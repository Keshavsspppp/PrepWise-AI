import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, Field
from app.core.limiter import limiter

from app.routes.auth import get_current_user
from app.core.rag import query_notes, generate_rag_answer
from app.db.mongodb import get_db, log_activity

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["AI Chat / RAG"])

# Pydantic models for request and response validation
class ChatRequest(BaseModel):
    question: str = Field(..., max_length=1000, min_length=1)

class SourceItem(BaseModel):
    filename: str
    subject: str

class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceItem]

@router.post("/chat", response_model=ChatResponse)
@limiter.limit("10/minute")
async def chat_with_notes(
    request: Request,
    chat_request: ChatRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """
    Query the user's uploaded notes inside ChromaDB and return a grounded answer from Gemini.
    """
    question = chat_request.question.strip()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question cannot be empty"
        )

    user_id = str(current_user["_id"])
    logger.info(f"AI Chat: Received question from user {user_id}: '{question}'")

    try:
        # 1. Retrieve the top 5 relevant document chunks for this user.
        relevant_chunks = await query_notes(db, user_id=user_id, question=question, limit=5)

        # 2. Feed the chunks and the question into Gemini for grounded answering
        result = await generate_rag_answer(context_chunks=relevant_chunks, question=question)
        
        # Log user activity
        await log_activity(db, user_id, "ask_ai")

        return ChatResponse(
            answer=result["answer"],
            sources=[
                SourceItem(filename=src["filename"], subject=src["subject"])
                for src in result["sources"]
            ]
        )
        
    except HTTPException as he:
        # Reraise FastAPI specific HTTPExceptions
        raise he
    except Exception as e:
        logger.error(f"AI Chat: Error processing RAG workflow for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while processing your query: {str(e)}"
        )
