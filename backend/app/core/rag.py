import os
import logging
import pypdf
import chromadb
import google.generativeai as genai
from sentence_transformers import SentenceTransformer
from fastapi import HTTPException
from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize persistent ChromaDB client
# ChromaDB requires the path to be absolute or relative to the cwd
os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
chroma_client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)

# Get or create collection
collection = chroma_client.get_or_create_collection(
    name="study_notes",
    metadata={"hnsw:space": "cosine"}
)

# Lazy loading of sentence-transformers embedding model
_embedding_model = None

def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        logger.info("Initializing SentenceTransformer model 'sentence-transformers/all-MiniLM-L6-v2'...")
        _embedding_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        logger.info("SentenceTransformer model loaded successfully.")
    return _embedding_model

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
    Split text into chunks of maximum length chunk_size, with an overlap.
    Tries to break chunks on punctuation or whitespace characters to maintain context.
    """
    if not text or not text.strip():
        return []
    
    chunks = []
    text_len = len(text)
    start = 0
    
    while start < text_len:
        end = min(start + chunk_size, text_len)
        
        # If we are not at the end of the text, try to find a smart break point
        if end < text_len:
            lookback = max(start, end - 150)  # Look back up to 150 characters
            break_idx = -1
            
            # Look for sentence boundaries first: newline, period, question mark, exclamation mark
            for idx in range(end - 1, lookback - 1, -1):
                if text[idx] in ('\n', '.', '?', '!'):
                    break_idx = idx + 1  # Include the character itself
                    break
            
            # If no sentence boundary, look for space characters
            if break_idx == -1:
                for idx in range(end - 1, lookback - 1, -1):
                    if text[idx] == ' ':
                        break_idx = idx
                        break
            
            # Apply break index if a valid one was found
            if break_idx != -1:
                end = break_idx
        
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
            
        # Calculate next start point using overlap
        next_start = end - chunk_overlap
        # Guarantee forward progress
        if next_start >= end:
            next_start = end - 1
        start = max(next_start, start + 1)
        
    return chunks

def index_note(user_id: str, note_id: str, filename: str, subject: str, filepath: str):
    """Extract, chunk, embed, and index a PDF note in ChromaDB."""
    logger.info(f"RAG: Indexing note {note_id} (Subject: {subject}, File: {filename}) for user {user_id}...")
    
    # 1. Extract Text
    text = extract_pdf_text(filepath)
    if not text or not text.strip():
        raise ValueError("The uploaded note PDF appears to be empty or has unextractable text.")
    
    # 2. Split into Chunks
    chunks = chunk_text(text, chunk_size=1000, chunk_overlap=200)
    if not chunks:
        raise ValueError("Failed to split PDF text into valid chunks.")
    
    logger.info(f"RAG: Split document into {len(chunks)} chunks.")
    
    # 3. Generate Embeddings
    model = get_embedding_model()
    embeddings = model.encode(chunks).tolist()
    
    # 4. Prepare Metadata & IDs
    ids = [f"{note_id}_{i}" for i in range(len(chunks))]
    metadatas = [
        {
            "user_id": str(user_id),
            "note_id": str(note_id),
            "filename": filename,
            "subject": subject,
            "chunk_index": i
        }
        for i in range(len(chunks))
    ]
    
    # 5. Insert into ChromaDB
    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=chunks,
        metadatas=metadatas
    )
    logger.info(f"RAG: Successfully indexed {len(chunks)} chunks in ChromaDB for note {note_id}.")

def delete_note_embeddings(note_id: str):
    """Delete all indexed vector chunks for a specific note."""
    logger.info(f"RAG: Purging ChromaDB vectors for note {note_id}...")
    try:
        collection.delete(where={"note_id": str(note_id)})
        logger.info(f"RAG: Successfully purged ChromaDB vectors for note {note_id}.")
    except Exception as e:
        logger.error(f"RAG: Failed to delete vectors for note {note_id}: {e}")

def query_notes(user_id: str, question: str, limit: int = 5) -> list[dict]:
    """Embed the question and search for top K matching documents for a specific user."""
    logger.info(f"RAG: Searching database for user {user_id} question: '{question}'...")
    
    model = get_embedding_model()
    query_vector = model.encode(question).tolist()
    
    try:
        results = collection.query(
            query_embeddings=[query_vector],
            n_results=limit,
            where={"user_id": str(user_id)}
        )
        
        hits = []
        if results and results.get("documents") and len(results["documents"]) > 0:
            documents = results["documents"][0]
            metadatas = results["metadatas"][0]
            # Chroma returns distances; let's check if present
            distances = results.get("distances", [[]])[0] if results.get("distances") else [0.0] * len(documents)
            
            for i in range(len(documents)):
                hits.append({
                    "content": documents[i],
                    "metadata": metadatas[i],
                    "distance": distances[i]
                })
        logger.info(f"RAG: Found {len(hits)} matching chunks in ChromaDB.")
        return hits
    except Exception as e:
        logger.error(f"RAG: ChromaDB query failed: {e}")
        return []

def generate_rag_answer(context_chunks: list[dict], question: str) -> dict:
    """
    Generate an answer using Gemini 1.5 Flash grounded strictly on the retrieved context chunks.
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
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
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
        
    except Exception as e:
        logger.error(f"RAG: Gemini API call failed: {e}")
        raise HTTPException(
            status_code=502,
            detail=f"Failed to communicate with AI generation service: {str(e)}"
        )
