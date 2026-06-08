"""
Smart Revision Engine — Ebbinghaus Forgetting Curve
Predicts knowledge retention and generates smart revision recommendations.
"""
import json
import math
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from bson import ObjectId

from app.db.mongodb import get_db, log_activity
from app.routes.auth import get_current_user
from app.core.gemini import gemini_model
import google.generativeai as genai

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/revision", tags=["Smart Revision"])

# ─── Ebbinghaus Stability Table (days) ───────────────────────────────────────
# Interval grows with each successful revision (spaced repetition)
STABILITY_BY_REVISIONS = [1.0, 3.0, 7.0, 14.0, 21.0, 30.0]

# ─── Pydantic Schemas ─────────────────────────────────────────────────────────

class RevisionCompleteRequest(BaseModel):
    topic_id: str
    completed: bool = True

class RecalculateRequest(BaseModel):
    pass  # no body needed, user derived from JWT


class TopicRetentionOut(BaseModel):
    topic_id: str
    user_id: str
    subject: str
    topic: str
    retention_score: float
    risk_level: str          # High / Medium / Low
    revision_priority: int   # 1 = most urgent
    last_studied: Optional[str]
    last_revised: Optional[str]
    next_revision: Optional[str]
    days_since_studied: int
    num_revisions: int


class RevisionHistoryOut(BaseModel):
    history_id: str
    topic: str
    subject: str
    revision_date: str
    retention_before: float
    retention_after: float


class RevisionRecommendationOut(BaseModel):
    topic_id: str
    topic: str
    subject: str
    retention_score: float
    risk_level: str
    message: str
    revision_priority: int
    recommended_revision_date: str


# ─── Core Ebbinghaus Algorithm ────────────────────────────────────────────────

def calculate_stability(num_revisions: int, avg_quiz_score: float) -> float:
    """
    Stability = base stability for revision count × score modifier.
    Score modifier: 0.6 (score=0) → 1.6 (score=100). This means a student
    scoring 100% builds memory ~2.7× faster than one scoring 0%.
    """
    base = STABILITY_BY_REVISIONS[min(num_revisions, len(STABILITY_BY_REVISIONS) - 1)]
    score_mod = 0.6 + (avg_quiz_score / 100.0) * 1.0  # range [0.6, 1.6]
    return base * score_mod


def calculate_retention(days_elapsed: float, stability: float) -> float:
    """R = 100 × e^(−t / S)  — Ebbinghaus formula."""
    if days_elapsed <= 0:
        return 100.0
    retention = 100.0 * math.exp(-days_elapsed / stability)
    return round(max(0.0, min(100.0, retention)), 1)


def get_risk_level(retention: float) -> str:
    if retention <= 50:
        return "High"
    elif retention <= 75:
        return "Medium"
    return "Low"


def next_revision_date(stability: float, current_retention: float) -> datetime:
    """
    Return the date when retention will drop to 75% (medium-risk threshold).
    Solve: 75 = 100 × e^(−t / S) → t = −S × ln(0.75)
    We add that many days from NOW.
    """
    days_until_threshold = -stability * math.log(0.75)
    # But if already below 75%, schedule immediately (tomorrow)
    if current_retention < 75:
        days_until_threshold = 1
    days_until_threshold = max(1, round(days_until_threshold))
    return datetime.now(timezone.utc) + timedelta(days=days_until_threshold)


def build_revision_message(topic: str, retention: float, days_since: int, risk: str) -> str:
    """Generate a human-friendly revision recommendation message."""
    if retention < 40:
        return f"⚠️ {topic} retention has fallen to {retention:.0f}%. Revise immediately."
    elif retention < 55:
        return f"🔴 {topic} is at high risk ({retention:.0f}%). Revise today."
    elif retention < 70:
        return f"🟡 {topic} is entering medium-risk zone ({retention:.0f}%). Schedule a revision soon."
    elif days_since > 10:
        return f"📅 You have not revised {topic} for {days_since} days. A quick revision will help."
    else:
        return f"🟢 {topic} retention is {retention:.0f}%. Consider revising to maintain mastery."


# ─── Retention Seeding from Quiz History ─────────────────────────────────────

async def seed_retention_from_quizzes(user_id: str, db) -> List[Dict]:
    """
    Build/refresh TopicRetention docs from quiz_results + quizzes.
    This is the primary data source for retention calculation.
    """
    pipeline = [
        {"$match": {"user_id": ObjectId(user_id)}},
        {"$lookup": {
            "from": "quizzes",
            "localField": "quiz_id",
            "foreignField": "_id",
            "as": "quiz_details"
        }},
        {"$unwind": "$quiz_details"},
        {"$sort": {"completed_at": 1}}
    ]
    cursor = db["quiz_results"].aggregate(pipeline)
    results = await cursor.to_list(length=500)

    # Group by (subject, topic) — track average score, last attempt date
    topic_map: Dict[str, Dict] = {}
    for res in results:
        subject = res["quiz_details"]["subject"]
        topic = res["quiz_details"]["topic"]
        key = f"{subject}::{topic}"
        if key not in topic_map:
            topic_map[key] = {
                "subject": subject,
                "topic": topic,
                "scores": [],
                "last_studied": res["completed_at"],
                "attempts": 0
            }
        topic_map[key]["scores"].append(res["percentage"])
        topic_map[key]["attempts"] += 1
        topic_map[key]["last_studied"] = max(
            topic_map[key]["last_studied"], res["completed_at"]
        )

    upserted = []
    for key, data in topic_map.items():
        avg_score = sum(data["scores"]) / len(data["scores"])
        last_studied = data["last_studied"]
        if last_studied.tzinfo is None:
            last_studied = last_studied.replace(tzinfo=timezone.utc)

        # Fetch existing retention doc to preserve revision count & last_revised
        existing = await db["topic_retention"].find_one({
            "user_id": ObjectId(user_id),
            "subject": data["subject"],
            "topic": data["topic"]
        })

        num_revisions = existing.get("num_revisions", 0) if existing else 0
        last_revised = existing.get("last_revised") if existing else None

        # Use last_revised if more recent than last_studied
        reference_date = last_studied
        if last_revised:
            if last_revised.tzinfo is None:
                last_revised = last_revised.replace(tzinfo=timezone.utc)
            reference_date = max(last_studied, last_revised)

        now = datetime.now(timezone.utc)
        days_elapsed = (now - reference_date).total_seconds() / 86400

        stability = calculate_stability(num_revisions, avg_score)
        retention = calculate_retention(days_elapsed, stability)
        risk = get_risk_level(retention)
        next_rev = next_revision_date(stability, retention)

        doc = {
            "user_id": ObjectId(user_id),
            "subject": data["subject"],
            "topic": data["topic"],
            "retention_score": retention,
            "risk_level": risk,
            "last_studied": last_studied,
            "last_revised": last_revised,
            "next_revision": next_rev,
            "num_revisions": num_revisions,
            "avg_quiz_score": round(avg_score, 1),
            "attempts": data["attempts"],
            "stability": round(stability, 2),
            "updated_at": now
        }

        await db["topic_retention"].update_one(
            {"user_id": ObjectId(user_id), "subject": data["subject"], "topic": data["topic"]},
            {"$set": doc},
            upsert=True
        )
        doc["_id"] = existing["_id"] if existing else None
        upserted.append(doc)

    return upserted


def assign_priorities(docs: List[Dict]) -> List[Dict]:
    """Sort by retention ascending (lowest = most urgent) and assign priority rank."""
    sorted_docs = sorted(docs, key=lambda d: d["retention_score"])
    for i, doc in enumerate(sorted_docs):
        doc["revision_priority"] = i + 1
    return sorted_docs


def format_retention_doc(doc: Dict) -> Dict:
    """Convert a MongoDB TopicRetention doc to a clean response dict."""
    now = datetime.now(timezone.utc)

    last_studied = doc.get("last_studied")
    if last_studied and hasattr(last_studied, "tzinfo"):
        if last_studied.tzinfo is None:
            last_studied = last_studied.replace(tzinfo=timezone.utc)
        days_since = (now - last_studied).days
        last_studied_str = last_studied.strftime("%Y-%m-%d")
    else:
        days_since = 0
        last_studied_str = None

    last_revised = doc.get("last_revised")
    last_revised_str = None
    if last_revised:
        if hasattr(last_revised, "tzinfo") and last_revised.tzinfo is None:
            last_revised = last_revised.replace(tzinfo=timezone.utc)
        last_revised_str = last_revised.strftime("%Y-%m-%d") if last_revised else None

    next_rev = doc.get("next_revision")
    next_rev_str = None
    if next_rev:
        if hasattr(next_rev, "tzinfo") and next_rev.tzinfo is None:
            next_rev = next_rev.replace(tzinfo=timezone.utc)
        next_rev_str = next_rev.strftime("%Y-%m-%d") if next_rev else None

    return {
        "topic_id": str(doc["_id"]),
        "user_id": str(doc["user_id"]),
        "subject": doc.get("subject", ""),
        "topic": doc.get("topic", ""),
        "retention_score": round(doc.get("retention_score", 0), 1),
        "risk_level": doc.get("risk_level", "Low"),
        "revision_priority": doc.get("revision_priority", 99),
        "last_studied": last_studied_str,
        "last_revised": last_revised_str,
        "next_revision": next_rev_str,
        "days_since_studied": days_since,
        "num_revisions": doc.get("num_revisions", 0),
        "avg_quiz_score": doc.get("avg_quiz_score", 0),
        "stability": doc.get("stability", 1.0),
        "attempts": doc.get("attempts", 0),
    }


# ─── API Endpoints ────────────────────────────────────────────────────────────

@router.get("/retention", response_model=List[Dict[str, Any]])
async def get_retention_scores(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """
    Recalculate and return retention percentages for all topics.
    Seeds data from quiz history first.
    """
    user_id = current_user["_id"]
    await seed_retention_from_quizzes(user_id, db)

    cursor = db["topic_retention"].find({"user_id": ObjectId(user_id)})
    docs = await cursor.to_list(length=200)

    if not docs:
        return []

    formatted = [format_retention_doc(doc) for doc in docs]
    formatted = assign_priorities(formatted)
    return formatted


@router.get("/recommendations", response_model=List[Dict[str, Any]])
async def get_revision_recommendations(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """
    Return topics that need revision, ordered by urgency.
    Includes a human-readable recommendation message per topic.
    """
    user_id = current_user["_id"]
    await seed_retention_from_quizzes(user_id, db)

    cursor = db["topic_retention"].find({"user_id": ObjectId(user_id)})
    docs = await cursor.to_list(length=200)

    if not docs:
        return []

    formatted = [format_retention_doc(doc) for doc in docs]
    formatted = assign_priorities(formatted)

    recommendations = []
    for doc in formatted:
        # Only include topics worth recommending (not 100% fresh)
        if doc["retention_score"] < 95 or doc["days_since_studied"] > 3:
            rec_date = doc["next_revision"] or datetime.now(timezone.utc).strftime("%Y-%m-%d")
            recommendations.append({
                **doc,
                "message": build_revision_message(
                    doc["topic"],
                    doc["retention_score"],
                    doc["days_since_studied"],
                    doc["risk_level"]
                ),
                "recommended_revision_date": rec_date
            })

    return recommendations


@router.get("/upcoming", response_model=List[Dict[str, Any]])
async def get_upcoming_revisions(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """
    Return topics grouped by revision schedule:
    - today (overdue + due today)
    - tomorrow
    - this_week (next 7 days)
    """
    user_id = current_user["_id"]
    await seed_retention_from_quizzes(user_id, db)

    cursor = db["topic_retention"].find({"user_id": ObjectId(user_id)})
    docs = await cursor.to_list(length=200)

    now = datetime.now(timezone.utc)
    today = now.date()
    tomorrow = today + timedelta(days=1)
    week_end = today + timedelta(days=7)

    today_list, tomorrow_list, week_list = [], [], []

    for doc in docs:
        fmt = format_retention_doc(doc)
        next_rev = doc.get("next_revision")
        if next_rev is None:
            continue
        if hasattr(next_rev, "tzinfo") and next_rev.tzinfo is None:
            next_rev = next_rev.replace(tzinfo=timezone.utc)
        rev_date = next_rev.date()

        if rev_date <= today:
            fmt["bucket"] = "today"
            today_list.append(fmt)
        elif rev_date == tomorrow:
            fmt["bucket"] = "tomorrow"
            tomorrow_list.append(fmt)
        elif rev_date <= week_end:
            fmt["bucket"] = "this_week"
            week_list.append(fmt)

    # Sort each bucket by retention ascending (most urgent first)
    today_list.sort(key=lambda d: d["retention_score"])
    tomorrow_list.sort(key=lambda d: d["retention_score"])
    week_list.sort(key=lambda d: d["retention_score"])

    return today_list + tomorrow_list + week_list


@router.get("/history", response_model=List[Dict[str, Any]])
async def get_revision_history(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """Return the student's past revision log."""
    user_id = current_user["_id"]
    cursor = db["revision_history"].find(
        {"user_id": ObjectId(user_id)}
    ).sort("revision_date", -1)
    docs = await cursor.to_list(length=200)

    response = []
    for doc in docs:
        response.append({
            "history_id": str(doc["_id"]),
            "topic": doc.get("topic", ""),
            "subject": doc.get("subject", ""),
            "revision_date": doc["revision_date"].strftime("%Y-%m-%d %H:%M") if doc.get("revision_date") else "",
            "retention_before": round(doc.get("retention_before", 0), 1),
            "retention_after": round(doc.get("retention_after", 0), 1),
        })
    return response


@router.post("/complete", response_model=Dict[str, Any])
async def complete_revision(
    request: RevisionCompleteRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """
    Mark a topic revision as complete:
    - Increase num_revisions
    - Recalculate retention (boosted)
    - Set next_revision date
    - Log to revision_history
    - Log study activity
    """
    user_id = current_user["_id"]
    topic_id = request.topic_id

    if not ObjectId.is_valid(topic_id):
        raise HTTPException(status_code=400, detail="Invalid topic_id format.")

    doc = await db["topic_retention"].find_one({
        "_id": ObjectId(topic_id),
        "user_id": ObjectId(user_id)
    })
    if not doc:
        raise HTTPException(status_code=404, detail="Topic retention record not found.")

    retention_before = doc.get("retention_score", 0)
    num_revisions = doc.get("num_revisions", 0) + 1
    avg_score = doc.get("avg_quiz_score", 70)

    now = datetime.now(timezone.utc)

    # After revision, retention resets close to 100% with a small decay applied
    # (0 days have passed since "last revised", so retention ≈ 100%)
    new_stability = calculate_stability(num_revisions, avg_score)
    retention_after = 98.0  # fresh revision — near perfect recall

    risk_after = get_risk_level(retention_after)
    next_rev = next_revision_date(new_stability, retention_after)

    # Update topic_retention
    await db["topic_retention"].update_one(
        {"_id": ObjectId(topic_id)},
        {"$set": {
            "retention_score": retention_after,
            "risk_level": risk_after,
            "num_revisions": num_revisions,
            "stability": round(new_stability, 2),
            "last_revised": now,
            "next_revision": next_rev,
            "updated_at": now
        }}
    )

    # Log to revision_history
    history_doc = {
        "user_id": ObjectId(user_id),
        "topic": doc.get("topic", ""),
        "subject": doc.get("subject", ""),
        "revision_date": now,
        "retention_before": round(retention_before, 1),
        "retention_after": retention_after,
    }
    await db["revision_history"].insert_one(history_doc)

    # Log activity
    await log_activity(db, user_id, "revision_complete")

    return {
        "success": True,
        "topic": doc.get("topic", ""),
        "subject": doc.get("subject", ""),
        "retention_before": round(retention_before, 1),
        "retention_after": retention_after,
        "next_revision": next_rev.strftime("%Y-%m-%d"),
        "num_revisions": num_revisions,
        "message": f"✅ Revision complete! {doc.get('topic')} retention reset to {retention_after:.0f}%. Next revision: {next_rev.strftime('%b %d')}."
    }


@router.post("/recalculate", response_model=Dict[str, Any])
async def recalculate_all_retention(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """
    Force-refresh all retention scores from quiz history + Gemini AI recommendations.
    """
    user_id = current_user["_id"]

    # Re-seed from quiz history
    await seed_retention_from_quizzes(user_id, db)

    # Fetch updated docs for Gemini context
    cursor = db["topic_retention"].find({"user_id": ObjectId(user_id)})
    all_docs = await cursor.to_list(length=200)
    formatted = [format_retention_doc(doc) for doc in all_docs]
    formatted = assign_priorities(formatted)

    # Build Gemini context
    high_risk = [d for d in formatted if d["risk_level"] == "High"]
    medium_risk = [d for d in formatted if d["risk_level"] == "Medium"]

    ai_recommendations = []
    try:
        topics_summary = "\n".join([
            f"- {d['topic']} ({d['subject']}): {d['retention_score']:.0f}% retention, {d['days_since_studied']} days ago, {d['num_revisions']} revisions"
            for d in formatted[:10]
        ])

        schema = {
            "type": "OBJECT",
            "properties": {
                "recommendations": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"},
                    "minItems": 3,
                    "maxItems": 5
                }
            },
            "required": ["recommendations"]
        }

        prompt = f"""You are a learning science expert using the Ebbinghaus Forgetting Curve model.
A student's topic retention data is shown below. Generate 3-5 concise, personalized revision advice statements.
Each advice must be 1 actionable sentence referencing specific topics or patterns. Be direct and motivating.

Topics:
{topics_summary}

High-risk topics needing immediate attention: {', '.join(d['topic'] for d in high_risk) or 'None'}
Medium-risk topics: {', '.join(d['topic'] for d in medium_risk) or 'None'}
"""
        response = gemini_model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,
                response_mime_type="application/json",
                response_schema=schema
            )
        )
        rec_data = json.loads(response.text.strip())
        ai_recommendations = rec_data.get("recommendations", [])
    except Exception as e:
        logger.error(f"Revision recalculate: Gemini recommendations failed: {e}")
        ai_recommendations = [
            f"Prioritize revising {high_risk[0]['topic']} immediately — retention is critically low." if high_risk else "Keep up your study streak to maintain strong retention.",
            "Use spaced repetition: revise each topic 24 hours after first study, then at 3, 7, and 14-day intervals.",
            "Focus your revision sessions on your weakest subjects first for maximum exam impact."
        ]

    # Save AI recommendations to DB for profile reference
    await db["revision_ai_recommendations"].update_one(
        {"user_id": ObjectId(user_id)},
        {"$set": {
            "user_id": ObjectId(user_id),
            "recommendations": ai_recommendations,
            "updated_at": datetime.now(timezone.utc)
        }},
        upsert=True
    )

    return {
        "success": True,
        "topics_processed": len(formatted),
        "high_risk_count": len(high_risk),
        "medium_risk_count": len(medium_risk),
        "ai_recommendations": ai_recommendations,
        "message": f"Recalculated retention for {len(formatted)} topics."
    }


@router.get("/ai-tips", response_model=Dict[str, Any])
async def get_ai_revision_tips(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """Return the latest Gemini-generated revision tips."""
    user_id = current_user["_id"]
    doc = await db["revision_ai_recommendations"].find_one({"user_id": ObjectId(user_id)})
    if not doc:
        return {
            "recommendations": [
                "Run 'Recalculate Retention' to generate your personalized AI revision tips.",
                "The Ebbinghaus Forgetting Curve shows memory decays exponentially — revise at the right time.",
                "Spaced repetition beats cramming: short, frequent revisions outperform long study marathons."
            ]
        }
    return {
        "recommendations": doc.get("recommendations", []),
        "updated_at": doc.get("updated_at", datetime.now(timezone.utc)).strftime("%Y-%m-%d %H:%M")
    }
