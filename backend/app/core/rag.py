import asyncio
import logging
import os

import numpy as np
import pypdf
from bson import ObjectId
from google.genai import types
from fastapi import HTTPException
from fastembed import TextEmbedding
from app.core.config import settings
from app.core.gemini import generate as gemini_generate, AIUnavailable
from langchain_text_splitters import RecursiveCharacterTextSplitter

logger = logging.getLogger(__name__)

# Chunks and their vectors live in MongoDB alongside the rest of the app's data.
# The previous ChromaDB store was a SQLite file on local disk, which pinned the backend
# to one process on one machine with a persistent volume — impossible to host for free.
CHUNK_COLLECTION = "note_chunks"

EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
EMBEDDING_DIM = 384

# Lazy loading of the ONNX embedding model. fastembed runs the same MiniLM weights as
# sentence-transformers but without PyTorch, which takes the image from ~2.6GB to a size
# that fits a free 512MB instance.
_embedding_model = None


def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        logger.info(f"Initializing fastembed model '{EMBEDDING_MODEL}'...")
        _embedding_model = TextEmbedding(model_name=EMBEDDING_MODEL)
        logger.info("Embedding model loaded successfully.")
    return _embedding_model


# ONNX Runtime allocates working buffers per batch. Embedding a whole 200-chunk PDF in
# one call peaked around 870MB resident, which does not fit a free 512MB instance;
# batching holds the steady state near 250MB for the same total work.
EMBED_BATCH_SIZE = 16


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed a batch of texts. Blocking and CPU-bound — call via asyncio.to_thread."""
    model = get_embedding_model()
    return [vector.tolist() for vector in model.embed(texts, batch_size=EMBED_BATCH_SIZE)]

def extract_pdf_text(filepath: str) -> str:
    """Extract text content from a PDF file using PyPDF."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"PDF file not found at {filepath}")
    
    try:
        reader = pypdf.PdfReader(filepath)
        text_parts = []
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
        return "\n".join(text_parts)
    except Exception as e:
        logger.error(f"Failed to extract text from PDF {filepath}: {e}")
        raise ValueError(f"Failed to extract text from PDF: {str(e)}")

def chunk_text(text: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> list[str]:
    """
    Split text into chunks of maximum length chunk_size, with an overlap using LangChain splitter.
    """
    if chunk_overlap >= chunk_size:
        raise ValueError("chunk_overlap must be less than chunk_size")
        
    if not text or not text.strip():
        return []
        
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ".", "?", "!", " ", ""]
    )
    chunks = splitter.split_text(text)
    return [c.strip() for c in chunks if c.strip()]

async def index_note(db, user_id: str, note_id: str, filename: str, subject: str, filepath: str):
    """Extract, chunk, embed, and store a PDF note's vectors in MongoDB."""
    logger.info(f"RAG: Indexing note {note_id} (Subject: {subject}, File: {filename}) for user {user_id}...")

    # 1. Extract text and split it — both blocking, so run off the event loop.
    text = await asyncio.to_thread(extract_pdf_text, filepath)
    if not text or not text.strip():
        raise ValueError("The uploaded note PDF appears to be empty or has unextractable text.")

    chunks = chunk_text(text, chunk_size=1000, chunk_overlap=200)
    if not chunks:
        raise ValueError("Failed to split PDF text into valid chunks.")

    logger.info(f"RAG: Split document into {len(chunks)} chunks.")

    # 2. Embed every chunk in one batch.
    embeddings = await asyncio.to_thread(embed_texts, chunks)

    # 3. Store. Re-indexing the same note replaces its chunks rather than duplicating them.
    await db[CHUNK_COLLECTION].delete_many({"note_id": ObjectId(note_id)})
    await db[CHUNK_COLLECTION].insert_many([
        {
            "user_id": ObjectId(user_id),
            "note_id": ObjectId(note_id),
            "filename": filename,
            "subject": subject,
            "chunk_index": i,
            "content": chunk,
            "embedding": embedding,
        }
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings))
    ])
    logger.info(f"RAG: Successfully indexed {len(chunks)} chunks for note {note_id}.")


async def delete_note_embeddings(db, note_id: str):
    """Delete all stored vector chunks for a specific note."""
    logger.info(f"RAG: Purging stored vectors for note {note_id}...")
    try:
        result = await db[CHUNK_COLLECTION].delete_many({"note_id": ObjectId(note_id)})
        logger.info(f"RAG: Purged {result.deleted_count} chunks for note {note_id}.")
    except Exception as e:
        logger.error(f"RAG: Failed to delete vectors for note {note_id}: {e}")


async def query_notes(db, user_id: str, question: str, limit: int = 5) -> list[dict]:
    """Embed the question and return the top matching chunks for a specific user."""
    logger.info(f"RAG: Searching notes for user {user_id}: '{question}'...")

    try:
        query_vector = (await asyncio.to_thread(embed_texts, [question]))[0]

        # ponytail: brute-force cosine over one user's own chunks. A personal note
        # library is a few hundred chunks, so this is a sub-millisecond numpy dot product
        # and it avoids depending on an Atlas-only $vectorSearch index that would not
        # exist on a local or containerised MongoDB. Move to Atlas Vector Search if a
        # single user's library ever grows past a few thousand chunks.
        cursor = db[CHUNK_COLLECTION].find(
            {"user_id": ObjectId(user_id)},
            {"content": 1, "embedding": 1, "filename": 1, "subject": 1, "note_id": 1},
        )
        docs = await cursor.to_list(length=20000)
        if not docs:
            logger.info("RAG: No indexed chunks for this user.")
            return []

        matrix = np.asarray([d["embedding"] for d in docs], dtype=np.float32)
        vector = np.asarray(query_vector, dtype=np.float32)

        # MiniLM output is already L2-normalised, so a dot product is cosine similarity.
        # Normalising again defensively costs nothing and protects against a model swap.
        matrix /= np.linalg.norm(matrix, axis=1, keepdims=True) + 1e-9
        vector /= np.linalg.norm(vector) + 1e-9
        scores = matrix @ vector

        top_indices = np.argsort(-scores)[:limit]
        hits = [
            {
                "content": docs[i]["content"],
                "metadata": {
                    "filename": docs[i]["filename"],
                    "subject": docs[i]["subject"],
                    "note_id": str(docs[i]["note_id"]),
                },
                # Kept as a distance for callers that were written against Chroma.
                "distance": float(1.0 - scores[i]),
            }
            for i in top_indices
        ]
        logger.info(f"RAG: Found {len(hits)} matching chunks out of {len(docs)}.")
        return hits
    except Exception as e:
        logger.error(f"RAG: Vector search failed: {e}")
        return []

async def generate_rag_answer(context_chunks: list[dict], question: str) -> dict:
    """
    Generate an answer grounded strictly on the retrieved context chunks.
    If context is empty or Gemini fails, return appropriate error responses.
    """
    if not settings.GEMINI_API_KEY:
        logger.error("GEMINI_API_KEY is missing from environment/config settings.")
        raise HTTPException(
            status_code=500,
            detail="AI service is not configured on the server (missing Gemini API Key)."
        )

    # 1. Build context block and collect unique source references
    context_texts = []
    sources = []
    seen_sources = set()
    
    for chunk in context_chunks:
        meta = chunk["metadata"]
        context_texts.append(
            f"Source Note: {meta['filename']} (Subject: {meta['subject']})\n"
            f"Content:\n{chunk['content']}\n"
            f"----------------------------------------"
        )
        
        # Create citation record
        source_key = (meta["filename"], meta["subject"])
        if source_key not in seen_sources:
            seen_sources.add(source_key)
            sources.append({
                "filename": meta["filename"],
                "subject": meta["subject"]
            })
            
    # If there are no study notes/context retrieved, immediately return "unavailable" message
    if not context_chunks:
        return {
            "answer": "I could not find this information in your uploaded notes.",
            "sources": []
        }
        
    context_block = "\n".join(context_texts)
    
    # 2. Define the grounding prompt guidelines
    prompt = f"""You are a helpful study assistant. Answer the user's question based strictly and ONLY on the provided notes context.
Do not use any external knowledge. Do not hallucinate. Do not add facts that are not present in the context.
If the answer to the question cannot be answered using the provided context, respond EXACTLY with:
"I could not find this information in your uploaded notes."

Context:
{context_block}

Question:
{question}

Answer:"""

    logger.info("RAG: Sending grounded context and question to Gemini...")
    
    try:
        response = await gemini_generate(
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.0,  # 0.0 forces strict grounded outcomes
            )
        )
        
        answer = response.text.strip()
        
        # Check if response indicates not found
        not_found_phrase = "I could not find this information in your uploaded notes."
        if not_found_phrase.lower() in answer.lower() or "could not find this information" in answer.lower():
            return {
                "answer": not_found_phrase,
                "sources": []
            }
            
        return {
            "answer": answer,
            "sources": sources
        }
        
    except AIUnavailable as e:
        # Surface a message the student can act on. The raw SDK error leaked quota URLs
        # and stack detail into the chat window, which read as the app being broken.
        logger.error(f"RAG: Gemini API call failed: {e}")
        raise HTTPException(
            status_code=503,
            detail="The AI is busy right now. Please ask again in a few seconds."
        )
