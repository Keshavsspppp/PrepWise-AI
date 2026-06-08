"""
AI Mock Viva Assistant
Conducts oral examinations via text, evaluates answers using RAG + Gemini,
and provides detailed academic feedback.
"""
import json
import uuid
import logging
from datetime import datetime, timezone
from typing import List, Dict

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from bson import ObjectId

from app.db.mongodb import get_db, log_activity
from app.routes.auth import get_current_user
from app.core.rag import query_notes
import google.generativeai as genai

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/viva", tags=["Mock Viva"])

# ─── Pydantic Schemas ──────────────────────────────────────────────────────────

class StartVivaRequest(BaseModel):
    subject: str
    difficulty: str = "Medium"   # Easy | Medium | Hard
    question_count: int = 5      # 5, 10, 15

class AnswerRequest(BaseModel):
    viva_id: str
    question_id: str
    answer: str

class CompleteVivaRequest(BaseModel):
    viva_id: str


# ─── Question Generation ───────────────────────────────────────────────────────

async def generate_viva_questions(
    user_id: str,
    subject: str,
    difficulty: str,
    count: int,
    db
) -> List[Dict]:
    """Generate viva questions from student's notes via RAG + Gemini."""

    # Retrieve relevant chunks from student's notes
    query = f"{subject} concepts definitions theory applications"
    chunks = query_notes(user_id=user_id, question=query, limit=20)

    context_block = "No notes available."
    if chunks:
        context_texts = [
            f"[{c['metadata']['filename']} - {c['metadata']['subject']}]\n{c['content']}"
            for c in chunks
        ]
        context_block = "\n---\n".join(context_texts)

    schema = {
        "type": "OBJECT",
        "properties": {
            "questions": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "question": {"type": "STRING"},
                        "question_type": {"type": "STRING"},
                        "reference_answer": {"type": "STRING"},
                        "key_concepts": {"type": "ARRAY", "items": {"type": "STRING"}}
                    },
                    "required": ["question", "question_type", "reference_answer", "key_concepts"]
                }
            }
        },
        "required": ["questions"]
    }

    prompt = f"""You are an academic viva examiner conducting an oral examination on {subject}.
Generate exactly {count} viva questions at {difficulty} difficulty level.

Use ONLY the context from the student's notes below. Do not use external knowledge.

Question types to mix:
- Definition: "What is X?", "Define Y."
- Conceptual: "Explain how X works.", "Why does Y happen?"
- Scenario: "Given this situation, what would you do?"
- Application: "How would you apply X to solve Y?"

For each question provide:
- question: the viva question (natural, conversational tone)
- question_type: one of [Definition, Conceptual, Scenario, Application]
- reference_answer: detailed model answer (2-4 sentences) grounded in the notes
- key_concepts: 2-4 key technical terms the student must mention for a full answer

Context from Student Notes:
{context_block}

Generate {count} questions now."""

    try:
        from app.core.gemini import gemini_model
        response = gemini_model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.4,
                response_mime_type="application/json",
                response_schema=schema
            )
        )
        data = json.loads(response.text.strip())
        raw_questions = data.get("questions", [])
    except Exception as e:
        logger.error(f"Viva: Question generation failed: {e}")
        raw_questions = []

    # Fallback generic questions if generation fails
    if not raw_questions:
        fallback_templates = [
            {
                "question": f"Can you explain the core concepts of {subject}?",
                "question_type": "Conceptual",
                "reference_answer": f"The core concepts of {subject} include fundamental principles, design patterns, and methodologies used in the field.",
                "key_concepts": [subject, "fundamentals", "principles"]
            },
            {
                "question": f"What are some key challenges or design tradeoffs when implementing systems or algorithms in {subject}?",
                "question_type": "Conceptual",
                "reference_answer": f"Key challenges in {subject} usually involve resource constraints, algorithmic complexity, performance scaling, and memory tradeoffs.",
                "key_concepts": ["tradeoffs", "complexity", "resources"]
            },
            {
                "question": f"Describe a real-world scenario where concepts of {subject} are actively applied.",
                "question_type": "Application",
                "reference_answer": f"Concepts of {subject} are used in software engineering, database design, networking, and system performance optimizations to ensure robust operations.",
                "key_concepts": ["application", "real-world", "software"]
            }
        ]
        raw_questions = [dict(fallback_templates[i]) for i in range(min(count, len(fallback_templates)))]

    questions = []
    for i, q in enumerate(raw_questions[:count]):
        questions.append({
            "question_id": f"vq_{i+1}_{uuid.uuid4().hex[:6]}",
            "question_number": i + 1,
            "question": q.get("question", ""),
            "question_type": q.get("question_type", "Conceptual"),
            "reference_answer": q.get("reference_answer", ""),
            "key_concepts": q.get("key_concepts", []),
            "difficulty": difficulty,
        })
    return questions


# ─── Answer Evaluation ─────────────────────────────────────────────────────────

async def evaluate_answer(
    question: str,
    reference_answer: str,
    key_concepts: List[str],
    student_answer: str,
    subject: str,
    difficulty: str
) -> Dict:
    """Evaluate a student's viva answer using Gemini."""

    if not student_answer or len(student_answer.strip()) < 5:
        return {
            "score": 0,
            "feedback": "No answer provided. Please attempt the question.",
            "missing_concepts": key_concepts,
            "strengths": [],
            "is_correct": False
        }

    schema = {
        "type": "OBJECT",
        "properties": {
            "score": {"type": "INTEGER"},
            "feedback": {"type": "STRING"},
            "missing_concepts": {"type": "ARRAY", "items": {"type": "STRING"}},
            "strengths": {"type": "ARRAY", "items": {"type": "STRING"}},
            "correctness_summary": {"type": "STRING"}
        },
        "required": ["score", "feedback", "missing_concepts", "strengths", "correctness_summary"]
    }

    prompt = f"""You are a strict but fair academic viva examiner for {subject} at {difficulty} difficulty.

Evaluate the student's answer strictly against the reference answer and key concepts.

Question: {question}

Reference Answer: {reference_answer}

Key Concepts Required: {', '.join(key_concepts)}

Student's Answer: {student_answer}

Evaluation Criteria:
- Correctness (40%): Is the answer factually accurate?
- Completeness (30%): Does it cover all key concepts?
- Clarity (20%): Is it clearly explained?
- Technical Accuracy (10%): Correct use of terminology?

Score the answer from 0-10 (10 = perfect, 0 = completely wrong/no answer).
Give constructive academic feedback in 2-3 sentences.
List any missing_concepts the student failed to mention.
List 1-2 strengths if applicable.
Provide a 1-sentence correctness_summary."""

    try:
        from app.core.gemini import gemini_model
        response = gemini_model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.2,
                response_mime_type="application/json",
                response_schema=schema
            )
        )
        data = json.loads(response.text.strip())
        return {
            "score": max(0, min(10, int(data.get("score", 5)))),
            "feedback": data.get("feedback", ""),
            "missing_concepts": data.get("missing_concepts", []),
            "strengths": data.get("strengths", []),
            "correctness_summary": data.get("correctness_summary", ""),
            "is_correct": int(data.get("score", 0)) >= 6
        }
    except Exception as e:
        logger.error(f"Viva: Evaluation failed: {e}")
        # Keyword-based fallback scoring
        answer_lower = student_answer.lower()
        matched = sum(1 for kc in key_concepts if kc.lower() in answer_lower)
        fallback_score = min(10, round((matched / max(len(key_concepts), 1)) * 10))
        return {
            "score": fallback_score,
            "feedback": f"Your answer mentioned {matched}/{len(key_concepts)} key concepts. AI evaluation was unavailable — please review the reference answer.",
            "missing_concepts": [kc for kc in key_concepts if kc.lower() not in answer_lower],
            "strengths": ["Attempted the question"] if student_answer.strip() else [],
            "is_correct": fallback_score >= 6
        }


# ─── API Endpoints ─────────────────────────────────────────────────────────────

@router.post("/start")
async def start_viva(
    request: StartVivaRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """Start a new viva session and return the first question."""
    uid = current_user["_id"]

    if request.question_count not in [5, 10, 15]:
        raise HTTPException(status_code=400, detail="Question count must be 5, 10, or 15.")

    # Generate questions
    questions = await generate_viva_questions(
        user_id=uid,
        subject=request.subject,
        difficulty=request.difficulty,
        count=request.question_count,
        db=db
    )

    if not questions:
        raise HTTPException(status_code=502, detail="Failed to generate viva questions. Please ensure you have uploaded notes for this subject.")

    # Create viva session document
    viva_doc = {
        "user_id": ObjectId(uid),
        "subject": request.subject,
        "difficulty": request.difficulty,
        "question_count": request.question_count,
        "questions": questions,
        "answers": [],
        "status": "active",
        "current_question_index": 0,
        "started_at": datetime.now(timezone.utc),
        "completed_at": None,
        "total_score": None,
        "avg_score": None
    }

    result = await db["viva_sessions"].insert_one(viva_doc)
    viva_id = str(result.inserted_id)
    await log_activity(db, uid, "start_viva")

    first_q = questions[0]
    return {
        "viva_id": viva_id,
        "subject": request.subject,
        "difficulty": request.difficulty,
        "total_questions": len(questions),
        "current_question_number": 1,
        "first_question": {
            "question_id": first_q["question_id"],
            "question": first_q["question"],
            "question_type": first_q["question_type"],
            "question_number": 1,
        }
    }


@router.post("/answer")
async def submit_answer(
    request: AnswerRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """Submit an answer, evaluate it, and return feedback + next question."""
    uid = current_user["_id"]
    viva_id = request.viva_id

    if not ObjectId.is_valid(viva_id):
        raise HTTPException(status_code=400, detail="Invalid viva_id.")

    session = await db["viva_sessions"].find_one({
        "_id": ObjectId(viva_id),
        "user_id": ObjectId(uid)
    })
    if not session:
        raise HTTPException(status_code=404, detail="Viva session not found.")
    if session.get("status") == "completed":
        raise HTTPException(status_code=400, detail="This viva session is already completed.")

    questions = session["questions"]
    # Find question by ID
    question_doc = next((q for q in questions if q["question_id"] == request.question_id), None)
    if not question_doc:
        raise HTTPException(status_code=404, detail="Question not found in session.")

    # Evaluate answer
    evaluation = await evaluate_answer(
        question=question_doc["question"],
        reference_answer=question_doc["reference_answer"],
        key_concepts=question_doc["key_concepts"],
        student_answer=request.answer,
        subject=session["subject"],
        difficulty=session["difficulty"]
    )

    # Store answer + evaluation
    answer_record = {
        "question_id": request.question_id,
        "question": question_doc["question"],
        "question_type": question_doc["question_type"],
        "student_answer": request.answer,
        "reference_answer": question_doc["reference_answer"],
        "key_concepts": question_doc["key_concepts"],
        **evaluation,
        "answered_at": datetime.now(timezone.utc)
    }

    await db["viva_sessions"].update_one(
        {"_id": ObjectId(viva_id)},
        {
            "$push": {"answers": answer_record},
            "$inc": {"current_question_index": 1}
        }
    )

    # Determine next question
    current_idx = session.get("current_question_index", 0) + 1
    next_question = None
    if current_idx < len(questions):
        nq = questions[current_idx]
        next_question = {
            "question_id": nq["question_id"],
            "question": nq["question"],
            "question_type": nq["question_type"],
            "question_number": current_idx + 1,
        }

    return {
        "evaluation": {
            "score": evaluation["score"],
            "feedback": evaluation["feedback"],
            "missing_concepts": evaluation["missing_concepts"],
            "strengths": evaluation.get("strengths", []),
            "correctness_summary": evaluation.get("correctness_summary", ""),
            "is_correct": evaluation["is_correct"],
            "reference_answer": question_doc["reference_answer"],
        },
        "progress": {
            "answered": current_idx,
            "total": len(questions),
            "remaining": len(questions) - current_idx
        },
        "next_question": next_question,
        "viva_complete": next_question is None
    }


@router.post("/complete")
async def complete_viva(
    request: CompleteVivaRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """Complete the viva, calculate final scores, and save results."""
    uid = current_user["_id"]
    viva_id = request.viva_id

    if not ObjectId.is_valid(viva_id):
        raise HTTPException(status_code=400, detail="Invalid viva_id.")

    session = await db["viva_sessions"].find_one({
        "_id": ObjectId(viva_id),
        "user_id": ObjectId(uid)
    })
    if not session:
        raise HTTPException(status_code=404, detail="Viva session not found.")

    answers = session.get("answers", [])
    questions = session.get("questions", [])

    scores = [a["score"] for a in answers]
    total_score = sum(scores)
    avg_score = round(total_score / max(len(scores), 1), 1)
    max_possible = len(questions) * 10

    # Analyse strengths and weaknesses
    strong_answers = [a for a in answers if a["score"] >= 7]
    weak_answers = [a for a in answers if a["score"] < 5]
    all_missing = []
    for a in weak_answers:
        all_missing.extend(a.get("missing_concepts", []))
    missing_concepts = list(set(all_missing))

    strengths = list(set(
        a["question_type"] for a in strong_answers
    ))
    weaknesses = list(set(
        a["question_type"] for a in weak_answers
    ))

    # Grade
    pct = (total_score / max(max_possible, 1)) * 100
    grade = "Distinction" if pct >= 85 else "Merit" if pct >= 70 else "Pass" if pct >= 50 else "Needs Improvement"

    result_doc = {
        "viva_id": ObjectId(viva_id),
        "user_id": ObjectId(uid),
        "subject": session["subject"],
        "difficulty": session["difficulty"],
        "total_score": total_score,
        "max_possible": max_possible,
        "avg_score": avg_score,
        "percentage": round(pct, 1),
        "grade": grade,
        "answers": answers,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "missing_concepts": missing_concepts,
        "completed_at": datetime.now(timezone.utc)
    }

    await db["viva_results"].insert_one(result_doc)
    await db["viva_sessions"].update_one(
        {"_id": ObjectId(viva_id)},
        {"$set": {
            "status": "completed",
            "completed_at": datetime.now(timezone.utc),
            "total_score": total_score,
            "avg_score": avg_score
        }}
    )
    await log_activity(db, uid, "complete_viva")

    return {
        "viva_id": viva_id,
        "subject": session["subject"],
        "difficulty": session["difficulty"],
        "total_score": total_score,
        "max_possible": max_possible,
        "avg_score": avg_score,
        "percentage": round(pct, 1),
        "grade": grade,
        "questions_answered": len(answers),
        "strengths": strengths,
        "weaknesses": weaknesses,
        "missing_concepts": missing_concepts
    }


@router.get("/results/{viva_id}")
async def get_viva_results(
    viva_id: str,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """Get detailed results for a completed viva session."""
    uid = current_user["_id"]

    if not ObjectId.is_valid(viva_id):
        raise HTTPException(status_code=400, detail="Invalid viva_id.")

    result = await db["viva_results"].find_one({
        "viva_id": ObjectId(viva_id),
        "user_id": ObjectId(uid)
    })
    if not result:
        raise HTTPException(status_code=404, detail="Viva result not found.")

    result["_id"] = str(result["_id"])
    result["viva_id"] = str(result["viva_id"])
    result["user_id"] = str(result["user_id"])
    if result.get("completed_at"):
        result["completed_at"] = result["completed_at"].isoformat()

    # Clean up answer timestamps
    for a in result.get("answers", []):
        if isinstance(a.get("answered_at"), datetime):
            a["answered_at"] = a["answered_at"].isoformat()

    return result


@router.get("/history")
async def get_viva_history(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """Return all past viva sessions for the user."""
    uid = current_user["_id"]
    cursor = db["viva_sessions"].find(
        {"user_id": ObjectId(uid), "status": "completed"}
    ).sort("started_at", -1)
    sessions = await cursor.to_list(50)

    history = []
    for s in sessions:
        history.append({
            "viva_id": str(s["_id"]),
            "subject": s.get("subject", ""),
            "difficulty": s.get("difficulty", ""),
            "question_count": s.get("question_count", 0),
            "total_score": s.get("total_score"),
            "avg_score": s.get("avg_score"),
            "status": s.get("status", ""),
            "started_at": s["started_at"].isoformat() if s.get("started_at") else "",
            "completed_at": s["completed_at"].isoformat() if s.get("completed_at") else "",
        })
    return history
