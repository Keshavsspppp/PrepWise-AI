"""
Exam Readiness Engine
Predicts how prepared a student is for exams using a weighted multi-factor analysis.
"""
import json
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Dict

from fastapi import APIRouter, Depends, Request
from bson import ObjectId

from app.db.mongodb import get_db
from app.routes.auth import get_current_user
from app.core.gemini import generate as gemini_generate
from google.genai import types
from app.core.limiter import limiter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/readiness", tags=["Exam Readiness"])

# ─── Weight Configuration ──────────────────────────────────────────────────────
WEIGHTS = {
    "quiz_performance":    0.30,
    "retention_score":     0.20,
    "study_consistency":   0.15,
    "revision_completion": 0.15,
    "subject_coverage":    0.10,
    "learning_dna":        0.10,
}

# ─── Risk Categorisation ───────────────────────────────────────────────────────
def get_exam_prediction(score: float) -> dict:
    if score >= 81:
        return {"label": "Exam Ready", "status": "Ready", "color": "emerald"}
    elif score >= 61:
        return {"label": "Good Preparation", "status": "Good", "color": "cyan"}
    elif score >= 41:
        return {"label": "Moderate Risk", "status": "Moderate", "color": "amber"}
    return {"label": "High Risk — Needs Urgent Revision", "status": "High Risk", "color": "red"}


def get_subject_status(score: float) -> str:
    if score >= 81:
        return "Ready"
    if score >= 61:
        return "Good"
    if score >= 41:
        return "Needs Improvement"
    return "High Risk"


# ─── Core Readiness Calculation Engine ────────────────────────────────────────

async def calculate_readiness(user_id: str, db) -> dict:
    """Multi-factor weighted readiness engine."""
    uid = ObjectId(user_id)

    # 1. QUIZ PERFORMANCE (30%)
    pipeline = [
        {"$match": {"user_id": uid}},
        {"$lookup": {"from": "quizzes", "localField": "quiz_id", "foreignField": "_id", "as": "q"}},
        {"$unwind": "$q"}
    ]
    quiz_results = await db["quiz_results"].aggregate(pipeline).to_list(500)

    subject_quiz_scores: Dict[str, List[float]] = {}
    for r in quiz_results:
        sub = r["q"]["subject"]
        subject_quiz_scores.setdefault(sub, []).append(r["percentage"])

    overall_quiz_avg = 0.0
    if quiz_results:
        overall_quiz_avg = sum(r["percentage"] for r in quiz_results) / len(quiz_results)

    # 2. RETENTION SCORES (20%)
    retention_docs = await db["topic_retention"].find({"user_id": uid}).to_list(200)
    subject_retention: Dict[str, List[float]] = {}
    for doc in retention_docs:
        sub = doc.get("subject", "Other")
        subject_retention.setdefault(sub, []).append(doc.get("retention_score", 0))

    overall_retention_avg = 0.0
    if retention_docs:
        overall_retention_avg = sum(d.get("retention_score", 0) for d in retention_docs) / len(retention_docs)

    # 3. STUDY CONSISTENCY (15%)
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    activities = await db["user_activities"].find(
        {"user_id": uid, "timestamp": {"$gte": thirty_days_ago}}
    ).to_list(1000)
    active_days = len(set(
        a["timestamp"].astimezone().strftime("%Y-%m-%d") for a in activities
    ))
    # Target: 15 active days per month = 100%
    consistency_score = min(100.0, (active_days / 15) * 100)

    # 4. REVISION COMPLETION (15%)
    revision_history = await db["revision_history"].find({"user_id": uid}).to_list(200)
    topic_retention_count = max(len(retention_docs), 1)
    revision_rate = min(100.0, (len(revision_history) / topic_retention_count) * 100)

    # 5. SUBJECT COVERAGE (10%)
    notes_count = await db["notes"].count_documents({"user_id": uid})
    subjects_with_notes = await db["notes"].distinct("subject", {"user_id": uid})
    # Scope the syllabus to this user's own subjects; an unscoped distinct() would let
    # other users' uploads inflate the denominator and move this user's coverage score.
    default_subjects = {"DSA", "DBMS", "Operating Systems", "Computer Networks", "Aptitude"}
    all_subjects = set(subjects_with_notes) | default_subjects
    covered = len(set(subjects_with_notes))
    total_subjects = len(all_subjects)
    coverage_score = min(100.0, (covered / max(total_subjects, 1)) * 100 + (notes_count * 5))

    # 6. LEARNING DNA (10%)
    dna = await db["learning_dna"].find_one({"user_id": uid})
    dna_score = 0.0
    if dna:
        dna_score = dna.get("overall_learning_score", 0)
    elif quiz_results:
        dna_score = min(100.0, overall_quiz_avg)

    # ── Weighted Overall Score ────────────────────────────────────────────────
    qpa = overall_quiz_avg
    ret = overall_retention_avg
    con = consistency_score
    rev = revision_rate
    cov = coverage_score
    dna_s = dna_score

    overall = round(
        qpa * WEIGHTS["quiz_performance"] +
        ret * WEIGHTS["retention_score"] +
        con * WEIGHTS["study_consistency"] +
        rev * WEIGHTS["revision_completion"] +
        cov * WEIGHTS["subject_coverage"] +
        dna_s * WEIGHTS["learning_dna"],
        1
    )

    # ── Subject-wise Readiness ────────────────────────────────────────────────
    all_subs = set(subject_quiz_scores.keys()) | set(subject_retention.keys())
    subject_scores = []
    for sub in all_subs:
        sq = sum(subject_quiz_scores.get(sub, [0.0])) / max(len(subject_quiz_scores.get(sub, [0.0])), 1)
        sr = sum(subject_retention.get(sub, [0.0])) / max(len(subject_retention.get(sub, [0.0])), 1)
        sub_score = round(sq * 0.6 + sr * 0.4, 1)
        subject_scores.append({
            "subject": sub,
            "readiness_score": sub_score,
            "quiz_avg": round(sq, 1),
            "retention_avg": round(sr, 1),
            "status": get_subject_status(sub_score),
            "quiz_attempts": len(subject_quiz_scores.get(sub, []))
        })
    subject_scores.sort(key=lambda x: x["readiness_score"])

    # ── Topic-wise Readiness ──────────────────────────────────────────────────
    topic_scores = []
    for doc in retention_docs:
        ret_s = doc.get("retention_score", 0)
        topic_scores.append({
            "topic": doc.get("topic", ""),
            "subject": doc.get("subject", ""),
            "readiness_score": round(ret_s, 1),
            "risk_level": doc.get("risk_level", "Low"),
            "num_revisions": doc.get("num_revisions", 0),
            "last_studied": doc["last_studied"].strftime("%Y-%m-%d") if doc.get("last_studied") else None,
        })
    topic_scores.sort(key=lambda x: x["readiness_score"])

    prediction = get_exam_prediction(overall)
    weak_subjects = [s["subject"] for s in subject_scores if s["readiness_score"] < 60]

    result = {
        "user_id": user_id,
        "overall_score": overall,
        "exam_prediction": prediction["label"],
        "prediction_status": prediction["status"],
        "prediction_color": prediction["color"],
        "subject_scores": subject_scores,
        "topic_scores": topic_scores,
        "weak_subjects": weak_subjects,
        "factor_breakdown": {
            "quiz_performance": round(qpa, 1),
            "retention_score": round(ret, 1),
            "study_consistency": round(con, 1),
            "revision_completion": round(rev, 1),
            "subject_coverage": round(cov, 1),
            "learning_dna": round(dna_s, 1)
        },
        "recommendations": [],
        "generated_at": datetime.now(timezone.utc)
    }
    return result


# ─── Helper for Cache Invalidation ──────────────────────────────────────────

def format_readiness_doc(doc: dict) -> dict:
    if not doc:
        return doc
    doc = dict(doc)
    doc["_id"] = str(doc["_id"])
    doc["user_id"] = str(doc["user_id"])
    if "generated_at" in doc and isinstance(doc["generated_at"], datetime):
        gen_at = doc["generated_at"]
        if gen_at.tzinfo is None:
            gen_at = gen_at.replace(tzinfo=timezone.utc)
        doc["generated_at"] = gen_at.isoformat()
    return doc

def is_cache_stale(cached: dict) -> bool:
    """Check if the cached readiness document is older than 24 hours."""
    if not cached or "generated_at" not in cached:
        return True
    gen_at = cached["generated_at"]
    if gen_at.tzinfo is None:
        gen_at = gen_at.replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    return now - gen_at > timedelta(hours=24)


# ─── API Endpoints ─────────────────────────────────────────────────────────────

@router.get("/overall")
async def get_overall_readiness(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """Return the cached or freshly calculated overall readiness score."""
    uid = current_user["_id"]
    cached = await db["exam_readiness"].find_one({"user_id": ObjectId(uid)})
    if cached and not is_cache_stale(cached):
        return format_readiness_doc(cached)
    # Auto-calculate if not cached or stale
    result = await calculate_readiness(uid, db)
    existing_recs = cached.get("recommendations", []) if cached else []
    result["recommendations"] = existing_recs
    await db["exam_readiness"].update_one(
        {"user_id": ObjectId(uid)},
        {"$set": {**result, "user_id": ObjectId(uid)}},
        upsert=True
    )
    inserted = await db["exam_readiness"].find_one({"user_id": ObjectId(uid)})
    return format_readiness_doc(inserted)


@router.get("/subjects")
async def get_subject_readiness(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """Return subject-wise readiness scores."""
    uid = current_user["_id"]
    cached = await db["exam_readiness"].find_one({"user_id": ObjectId(uid)})
    if cached and not is_cache_stale(cached):
        return cached.get("subject_scores", [])
    result = await calculate_readiness(uid, db)
    existing_recs = cached.get("recommendations", []) if cached else []
    result["recommendations"] = existing_recs
    await db["exam_readiness"].update_one(
        {"user_id": ObjectId(uid)},
        {"$set": {**result, "user_id": ObjectId(uid)}},
        upsert=True
    )
    return result.get("subject_scores", [])


@router.get("/topics")
async def get_topic_readiness(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """Return topic-wise readiness scores."""
    uid = current_user["_id"]
    cached = await db["exam_readiness"].find_one({"user_id": ObjectId(uid)})
    if cached and not is_cache_stale(cached):
        return cached.get("topic_scores", [])
    result = await calculate_readiness(uid, db)
    existing_recs = cached.get("recommendations", []) if cached else []
    result["recommendations"] = existing_recs
    await db["exam_readiness"].update_one(
        {"user_id": ObjectId(uid)},
        {"$set": {**result, "user_id": ObjectId(uid)}},
        upsert=True
    )
    return result.get("topic_scores", [])


@router.get("/recommendations")
async def get_readiness_recommendations(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """Return AI-generated exam readiness recommendations."""
    uid = current_user["_id"]
    cached = await db["exam_readiness"].find_one({"user_id": ObjectId(uid)})
    recs = cached.get("recommendations", []) if cached else []
    if recs:
        gen_at = cached.get("generated_at")
        if isinstance(gen_at, datetime):
            if gen_at.tzinfo is None:
                gen_at = gen_at.replace(tzinfo=timezone.utc)
            gen_at_str = gen_at.isoformat()
        else:
            gen_at_str = str(gen_at)
        return {"recommendations": recs, "generated_at": gen_at_str}
    return {"recommendations": [
        "Click 'Recalculate' to generate your personalized AI exam recommendations.",
        "Start by taking a few quizzes across all your subjects.",
        "Upload study notes to unlock RAG-powered topic analysis."
    ]}


@router.post("/recalculate")
@limiter.limit("3/minute")
async def recalculate_readiness(
    request: Request,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """Force-recalculate readiness and generate Gemini AI recommendations."""
    uid = current_user["_id"]
    result = await calculate_readiness(uid, db)

    # ── Gemini Recommendations ────────────────────────────────────────────────
    weak_subjects = result.get("weak_subjects", [])
    fb = result.get("factor_breakdown", {})
    overall = result.get("overall_score", 0)
    subject_scores = result.get("subject_scores", [])

    subject_summary = "\n".join([
        f"- {s['subject']}: {s['readiness_score']:.0f}% ({s['status']})"
        for s in subject_scores
    ]) or "No subject data available."

    schema = {
        "type": "OBJECT",
        "properties": {
            "recommendations": {
                "type": "ARRAY",
                "items": {"type": "STRING"},
                "minItems": 3,
                "maxItems": 6
            }
        },
        "required": ["recommendations"]
    }
    prompt = f"""You are a senior academic coach. A student has an exam readiness score of {overall:.0f}/100.
Generate 3-6 highly specific, actionable exam preparation recommendations.

Factor scores:
- Quiz Performance: {fb.get('quiz_performance', 0):.0f}%
- Retention Score: {fb.get('retention_score', 0):.0f}%
- Study Consistency: {fb.get('study_consistency', 0):.0f}%
- Revision Completion: {fb.get('revision_completion', 0):.0f}%
- Subject Coverage: {fb.get('subject_coverage', 0):.0f}%
- Learning DNA Score: {fb.get('learning_dna', 0):.0f}%

Subject Readiness:
{subject_summary}

Weak subjects: {', '.join(weak_subjects) if weak_subjects else 'None identified'}

Each recommendation must be 1-2 concise sentences. Be specific, motivating, and direct. Reference actual subject names."""

    recommendations = []
    try:
        response = await gemini_generate(
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.6,
                response_mime_type="application/json",
                response_schema=schema
            )
        )
        rec_data = json.loads(response.text.strip())
        recommendations = rec_data.get("recommendations", [])
    except Exception as e:
        logger.error(f"Readiness: Gemini call failed: {e}")
        recommendations = [
            f"Your overall readiness is {overall:.0f}%. {'Great work — keep revising consistently.' if overall >= 70 else 'You need to urgently increase study hours and quiz attempts.'}",
            f"Weak areas: {', '.join(weak_subjects) + ' require immediate attention.' if weak_subjects else 'No critical weak areas identified — maintain your current pace.'}",
            "Use the Smart Revision Engine to prioritise topics with the lowest retention scores.",
            "Aim for at least 3 quiz sessions per subject before your exam date."
        ]

    result["recommendations"] = recommendations
    await db["exam_readiness"].update_one(
        {"user_id": ObjectId(uid)},
        {"$set": {**result, "user_id": ObjectId(uid)}},
        upsert=True
    )
    inserted = await db["exam_readiness"].find_one({"user_id": ObjectId(uid)})
    return format_readiness_doc(inserted)
