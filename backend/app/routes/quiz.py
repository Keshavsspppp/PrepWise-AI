import json
import logging
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from bson import ObjectId

from app.db.mongodb import get_db, log_activity
from app.routes.auth import get_current_user
from app.core.rag import query_notes
from app.core.gemini import gemini_model
import google.generativeai as genai

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/quiz", tags=["Quiz Generation"])

# Pydantic Schemas for Requests
class QuizGenerateRequest(BaseModel):
    subject: str
    topic: str
    difficulty: str
    question_count: int
    quiz_type: str  # MCQ, Short Answer, Mixed

class AnswerSubmission(BaseModel):
    question_id: str
    selected_answer: str

class QuizSubmitRequest(BaseModel):
    quiz_id: str
    answers: List[AnswerSubmission]

# Pydantic Schemas for Responses
class QuestionResponse(BaseModel):
    question_id: str
    question: str
    options: List[str]

class QuizGenerateResponse(BaseModel):
    quiz_id: str
    questions: List[QuestionResponse]

class AnswerEvaluation(BaseModel):
    question_id: str
    question: str
    selected_answer: str
    correct_answer: str
    is_correct: bool
    explanation: str

class QuizSubmitResponse(BaseModel):
    score: int
    total: int
    percentage: float
    correct_answers: List[AnswerEvaluation]
    wrong_answers: List[AnswerEvaluation]
    feedback: str

# Helper to convert MongoDB doc to JSON-safe dictionary
def serialize_doc(doc):
    if not doc:
        return doc
    doc = dict(doc)
    doc["_id"] = str(doc["_id"])
    if "user_id" in doc:
        doc["user_id"] = str(doc["user_id"])
    if "quiz_id" in doc:
        doc["quiz_id"] = str(doc["quiz_id"])
    return doc

@router.post("/generate", response_model=QuizGenerateResponse, status_code=status.HTTP_201_CREATED)
async def generate_quiz(
    request: QuizGenerateRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """
    Generate a quiz using context retrieved from the student's notes and store it in MongoDB.
    """
    user_id = current_user["_id"]
    subject = request.subject
    topic = request.topic.strip()
    difficulty = request.difficulty
    count = request.question_count
    quiz_type = request.quiz_type

    if not topic:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Topic cannot be empty."
        )

    if count not in [5, 10, 20]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question count must be 5, 10, or 20."
        )

    # 1. Query ChromaDB for notes context matching topic and subject
    # Increase retrieve limit for larger question counts
    retrieve_limit = 12 if count == 5 else (18 if count == 10 else 25)
    context_chunks = query_notes(user_id=user_id, question=topic, limit=retrieve_limit)

    # Verify context is not empty (satisfies 'No notes uploaded' and 'Empty retrieval results')
    if not context_chunks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not find any relevant study notes for this topic. Please ensure you have uploaded PDFs covering this subject."
        )

    context_texts = [
        f"Source: {chunk['metadata']['filename']} (Subject: {chunk['metadata']['subject']})\nContent: {chunk['content']}"
        for chunk in context_chunks
    ]
    context_block = "\n---\n".join(context_texts)

    # 2. Configure Gemini schema
    # We enforce JSON output mapping exactly to our expected structure
    response_schema = {
        "type": "OBJECT",
        "properties": {
            "questions": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "question": {"type": "STRING"},
                        "options": {
                            "type": "ARRAY",
                            "items": {"type": "STRING"}
                        },
                        "correct_answer": {"type": "STRING"},
                        "explanation": {"type": "STRING"}
                    },
                    "required": ["question", "options", "correct_answer", "explanation"]
                }
            }
        },
        "required": ["questions"]
    }

    prompt = f"""You are an expert study quiz generator. Generate a quiz based strictly and ONLY on the provided notes context.
Do not use any external knowledge or facts not present in the notes. Avoid duplicate questions.
The quiz parameters are:
- Subject: {subject}
- Topic: {topic}
- Difficulty Level: {difficulty}
- Question Count: {count}
- Quiz Type: {quiz_type}

Instructions:
1. Generate exactly {count} unique questions.
2. If Quiz Type is 'MCQ': each question must have exactly 4 choices in 'options', and the 'correct_answer' must be one of those options exactly.
3. If Quiz Type is 'Short Answer': 'options' must be an empty list, and the 'correct_answer' must be a concise correct reference answer (1-2 sentences).
4. If Quiz Type is 'Mixed': generate a mixture of MCQs (with 4 options) and Short Answer questions (with empty options list).
5. Question difficulty should match '{difficulty}'.
6. The questions must be conceptual or application-based and sound like realistic exam questions.
7. Provide a detailed 'explanation' for each correct answer.

Retrieved Context:
{context_block}
"""

    logger.info(f"Quiz Gen: Requesting {count} questions for user {user_id} using gemini-2.5-flash...")

    try:
        response = gemini_model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.2,  # Low temperature for factual consistency
                response_mime_type="application/json",
                response_schema=response_schema
            )
        )

        quiz_data = json.loads(response.text.strip())
        questions = quiz_data.get("questions", [])

        # Validate count generated
        if not questions:
            raise ValueError("No questions returned by AI model.")

        # Assign unique question IDs
        formatted_questions = []
        for i, q in enumerate(questions):
            formatted_questions.append({
                "question_id": f"q_{i + 1}_{uuid.uuid4().hex[:6]}",
                "question": q["question"],
                "options": q.get("options", []),
                "correct_answer": q["correct_answer"],
                "explanation": q["explanation"]
            })

    except Exception as e:
        logger.error(f"Quiz Gen: Gemini API quiz generation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to generate quiz from AI service: {str(e)}"
        )

    # 3. Store Quiz in MongoDB
    quiz_doc = {
        "user_id": ObjectId(user_id),
        "subject": subject,
        "topic": topic,
        "difficulty": difficulty,
        "quiz_type": quiz_type,
        "questions": formatted_questions,
        "created_at": datetime.now(timezone.utc)
    }

    try:
        result = await db["quizzes"].insert_one(quiz_doc)
        quiz_id = str(result.inserted_id)
        
        # Log study activity
        await log_activity(db, user_id, "generate_quiz")
        
        # 4. Format and return response
        # correct_answer is stripped from QuestionsResponse for security
        return QuizGenerateResponse(
            quiz_id=quiz_id,
            questions=[
                QuestionResponse(
                    question_id=q["question_id"],
                    question=q["question"],
                    options=q["options"]
                )
                for q in formatted_questions
            ]
        )
    except Exception as e:
        logger.error(f"Quiz Gen: Failed to write quiz to database: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save generated quiz on server."
        )

@router.post("/submit", response_model=QuizSubmitResponse)
async def submit_quiz(
    request: QuizSubmitRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """
    Evaluate student answers, calculate score, write attempt to MongoDB, and return detailed feedback.
    """
    user_id = current_user["_id"]
    quiz_id = request.quiz_id
    submissions = {sub.question_id: sub.selected_answer for sub in request.answers}

    if not ObjectId.is_valid(quiz_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid quiz ID format."
        )

    # 1. Fetch Quiz from MongoDB
    quiz = await db["quizzes"].find_one({"_id": ObjectId(quiz_id)})
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found."
        )

    # Verify ownership/auth
    if str(quiz["user_id"]) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to submit answers for this quiz."
        )

    questions = quiz["questions"]
    
    # 2. Evaluate answers
    total = len(questions)
    
    # Track which questions are MCQ and which are Short Answer
    mcqs_to_eval = []
    shorts_to_eval = []
    
    for q in questions:
        q_id = q["question_id"]
        options = q["options"]
        q["correct_answer"]
        submitted = submissions.get(q_id, "").strip()
        
        is_mcq = len(options) > 0
        if is_mcq:
            mcqs_to_eval.append((q, submitted))
        else:
            shorts_to_eval.append((q, submitted))

    # Evaluate MCQs directly
    evaluations = {}
    score = 0

    for q, submitted in mcqs_to_eval:
        correct_ans = q["correct_answer"].strip()
        is_correct = submitted.lower() == correct_ans.lower()
        if is_correct:
            score += 1
            
        evaluations[q["question_id"]] = {
            "question_id": q["question_id"],
            "question": q["question"],
            "selected_answer": submitted,
            "correct_answer": q["correct_answer"],
            "is_correct": is_correct,
            "explanation": q["explanation"]
        }

    # Evaluate Short Answers using Gemini AI for semantic matching
    if shorts_to_eval:
        logger.info(f"Quiz Submit: Evaluating {len(shorts_to_eval)} short answers via Gemini...")
        
        # Prepare bulk grading prompt to save API call resources
        grading_items = []
        for q, submitted in shorts_to_eval:
            grading_items.append({
                "question_id": q["question_id"],
                "question": q["question"],
                "reference_answer": q["correct_answer"],
                "student_answer": submitted
            })
            
        grading_schema = {
            "type": "OBJECT",
            "properties": {
                "grades": {
                    "type": "ARRAY",
                    "items": {
                        "type": "OBJECT",
                        "properties": {
                            "question_id": {"type": "STRING"},
                            "is_correct": {"type": "BOOLEAN"},
                            "feedback": {"type": "STRING"}
                        },
                        "required": ["question_id", "is_correct", "feedback"]
                    }
                }
            },
            "required": ["grades"]
        }

        grading_prompt = f"""You are a strict teacher grading short answer questions. Compare the student's answer against the reference correct answer.
Decide if the answer is correct (true) or wrong (false). Allow semantic matches that express the correct technical concepts even if phrased differently.
If the student answer is empty or completely off-topic, mark it false.

Questions to grade:
{json.dumps(grading_items, indent=2)}
"""
        try:
            response = gemini_model.generate_content(
                grading_prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.0,
                    response_mime_type="application/json",
                    response_schema=grading_schema
                )
            )
            
            grades_data = json.loads(response.text.strip())
            grades_list = grades_data.get("grades", [])
            grades_map = {g["question_id"]: g for g in grades_list}
            
        except Exception as e:
            logger.error(f"Quiz Submit: Gemini short-answer evaluation failed: {e}")
            # Fallback to simple matching if Gemini fails
            grades_map = {}

        # Fill in Short Answer evaluations
        for q, submitted in shorts_to_eval:
            q_id = q["question_id"]
            ai_grade = grades_map.get(q_id, {"is_correct": False, "feedback": "AI evaluation failed. Fallback default."})
            is_correct = ai_grade["is_correct"]
            
            # Simple substring fallback if AI fail occurred
            if q_id not in grades_map and submitted:
                # If submitted answer is long enough and shares key terms, mark correct or false
                is_correct = q["correct_answer"].lower() in submitted.lower() or submitted.lower() in q["correct_answer"].lower()

            if is_correct:
                score += 1
                
            evaluations[q_id] = {
                "question_id": q_id,
                "question": q["question"],
                "selected_answer": submitted,
                "correct_answer": q["correct_answer"],
                "is_correct": is_correct,
                "explanation": f"{q['explanation']} (AI Grader Comment: {ai_grade.get('feedback', '')})"
            }

    # Split into correct and wrong answer response sets
    correct_list = []
    wrong_list = []
    
    for q in questions:
        q_id = q["question_id"]
        ev = evaluations[q_id]
        eval_obj = AnswerEvaluation(
            question_id=ev["question_id"],
            question=ev["question"],
            selected_answer=ev["selected_answer"],
            correct_answer=ev["correct_answer"],
            is_correct=ev["is_correct"],
            explanation=ev["explanation"]
        )
        if ev["is_correct"]:
            correct_list.append(eval_obj)
        else:
            wrong_list.append(eval_obj)

    percentage = round((score / total) * 100, 2) if total > 0 else 0.0

    # 3. Generate summary feedback using Gemini
    feedback = ""
    try:
        feedback_prompt = f"""Write a concise study evaluation feedback summary (3 sentences max) for a student who scored {score}/{total} ({percentage}%) on a quiz.
Subject: {quiz['subject']}
Topic: {quiz['topic']}
Difficulty: {quiz['difficulty']}

Acknowledge their strengths, note weak areas if applicable, and recommend study focuses. Keep it encouraging and direct.
"""
        response = gemini_model.generate_content(feedback_prompt)
        feedback = response.text.strip()
    except Exception as e:
        logger.error(f"Quiz Submit: Feedback generation failed: {e}")
        feedback = f"You completed the quiz in {quiz['topic']} at {quiz['difficulty']} difficulty. You scored {score} out of {total} ({percentage}%)."

    # 4. Save Quiz Result in MongoDB
    result_doc = {
        "user_id": ObjectId(user_id),
        "quiz_id": ObjectId(quiz_id),
        "score": score,
        "total": total,
        "percentage": percentage,
        "correct_answers": [dict(ev) for ev in correct_list],
        "wrong_answers": [dict(ev) for ev in wrong_list],
        "feedback": feedback,
        "completed_at": datetime.now(timezone.utc)
    }

    try:
        await db["quiz_results"].insert_one(result_doc)
        # Log user study activity
        await log_activity(db, user_id, "attempt_quiz")
    except Exception as e:
        logger.error(f"Quiz Submit: Failed to write result to database: {e}")
        # Return success regardless since evaluation is complete, but log it
        
    return QuizSubmitResponse(
        score=score,
        total=total,
        percentage=percentage,
        correct_answers=correct_list,
        wrong_answers=wrong_list,
        feedback=feedback
    )

@router.get("/history", response_model=List[Dict[str, Any]])
async def get_quiz_history(
    subject: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """
    Retrieve all quiz attempts for the user, joined with the subject/topic metadata from the original quiz.
    """
    user_id = current_user["_id"]
    
    # Build aggregation pipeline to join quiz_results and quizzes
    pipeline = [
        {"$match": {"user_id": ObjectId(user_id)}},
        {"$lookup": {
            "from": "quizzes",
            "localField": "quiz_id",
            "foreignField": "_id",
            "as": "quiz_details"
        }},
        {"$unwind": "$quiz_details"},
    ]
    
    # Add subject filter if supplied
    if subject and subject != "All":
        pipeline.append({"$match": {"quiz_details.subject": subject}})
        
    # Sort by completion date descending
    pipeline.append({"$sort": {"completed_at": -1}})

    try:
        cursor = db["quiz_results"].aggregate(pipeline)
        attempts = await cursor.to_list(length=100)
        
        response = []
        for att in attempts:
            response.append({
                "result_id": str(att["_id"]),
                "quiz_id": str(att["quiz_id"]),
                "score": att["score"],
                "total": att["total"],
                "percentage": att["percentage"],
                "feedback": att["feedback"],
                "completed_at": att["completed_at"].isoformat(),
                "subject": att["quiz_details"]["subject"],
                "topic": att["quiz_details"]["topic"],
                "difficulty": att["quiz_details"]["difficulty"],
                "quiz_type": att["quiz_details"]["quiz_type"]
            })
        return response
    except Exception as e:
        logger.error(f"Quiz History: Failed to fetch attempts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve quiz history list."
        )

@router.get("/{quiz_id}")
async def get_quiz_details(
    quiz_id: str,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """
    Retrieve specific quiz details (questions list) for attempting.
    """
    if not ObjectId.is_valid(quiz_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid quiz ID format."
        )

    quiz = await db["quizzes"].find_one({"_id": ObjectId(quiz_id)})
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found."
        )

    # Check ownership
    if str(quiz["user_id"]) != current_user["_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this quiz."
        )

    # Format questions to hide explanations during attempts
    questions = []
    for q in quiz["questions"]:
        questions.append({
            "question_id": q["question_id"],
            "question": q["question"],
            "options": q["options"]
        })

    return {
        "quiz_id": str(quiz["_id"]),
        "subject": quiz["subject"],
        "topic": quiz["topic"],
        "difficulty": quiz["difficulty"],
        "quiz_type": quiz["quiz_type"],
        "questions": questions
    }
