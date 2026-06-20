import json
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from app.core.limiter import limiter
from bson import ObjectId

from app.db.mongodb import get_db
from app.routes.auth import get_current_user
from app.core.gemini import gemini_client
from google.genai import types
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/learning-dna", tags=["Learning DNA"])

# Pydantic Schemas for Response Validation
class LearningDNAProfile(BaseModel):
    user_id: str
    learning_speed: str
    consistency_score: int
    retention_score: int
    study_discipline_score: int
    strong_subjects: List[str]
    weak_subjects: List[str]
    strong_topics: List[str]
    weak_topics: List[str]
    recommended_focus: List[str]
    overall_learning_score: int
    recommendations: List[str]

class RecommendationResponse(BaseModel):
    recommendations: List[str]

class AnalyticsResponse(BaseModel):
    consistency_timeline: List[Dict[str, Any]] # last 7 days
    subject_performances: List[Dict[str, Any]]
    topic_performances: List[Dict[str, Any]]
    streak: int
    total_sessions: int
    total_study_hours: float
    notes_uploaded: int
    questions_asked: int
    active_days: int
    active_days_list: List[str]  # list of YYYY-MM-DD strings

# Helper to serialize ObjectId to string
def serialize_doc(doc):
    if not doc:
        return doc
    doc = dict(doc)
    doc["_id"] = str(doc["_id"])
    if "user_id" in doc:
        doc["user_id"] = str(doc["user_id"])
    return doc

async def calculate_profile(user_id: str, db) -> Dict[str, Any]:
    """Helper engine that pulls study and quiz data and recalculates the user's Learning DNA profile."""
    logger.info(f"Learning DNA: Recalculating profile for user {user_id}...")

    # 1. Fetch all quiz results joined with quiz details
    pipeline = [
        {"$match": {"user_id": ObjectId(user_id)}},
        {"$lookup": {
            "from": "quizzes",
            "localField": "quiz_id",
            "foreignField": "_id",
            "as": "quiz_details"
        }},
        {"$unwind": "$quiz_details"}
    ]
    cursor = db["quiz_results"].aggregate(pipeline)
    quiz_results = await cursor.to_list(length=100)

    # 2. Fetch user activity history for the last 30 days
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    activities_cursor = db["user_activities"].find({
        "user_id": ObjectId(user_id),
        "timestamp": {"$gte": thirty_days_ago}
    })
    activities = await activities_cursor.to_list(length=1000)

    # 3. Fetch notes uploaded
    notes_count = await db["notes"].count_documents({"user_id": ObjectId(user_id)})

    # Calculate subject-wise performance
    subject_scores = {}
    subject_counts = {}
    topic_scores = {}
    topic_counts = {}

    for res in quiz_results:
        sub = res["quiz_details"]["subject"]
        topic = res["quiz_details"]["topic"]
        pct = res["percentage"]

        # Subject averages
        subject_scores[sub] = subject_scores.get(sub, 0.0) + pct
        subject_counts[sub] = subject_counts.get(sub, 0) + 1

        # Topic averages
        topic_scores[topic] = topic_scores.get(topic, 0.0) + pct
        topic_counts[topic] = topic_counts.get(topic, 0) + 1

    strong_subjects = []
    weak_subjects = []
    for sub, total_pct in subject_scores.items():
        avg = total_pct / subject_counts[sub]
        if avg >= 80.0:
            strong_subjects.append(sub)
        elif avg < 60.0:
            weak_subjects.append(sub)

    strong_topics = []
    weak_topics = []
    for topic, total_pct in topic_scores.items():
        avg = total_pct / topic_counts[topic]
        if avg >= 80.0:
            strong_topics.append(topic)
        elif avg < 60.0:
            weak_topics.append(topic)

    # Calculate consistency score
    # Number of active study days in the last 30 days
    active_days_set = set()
    for act in activities:
        # Get date string (YYYY-MM-DD)
        date_str = act["timestamp"].astimezone().strftime("%Y-%m-%d")
        active_days_set.add(date_str)
    
    active_days = len(active_days_set)
    # Consider 12 days of study in a month as 100% consistent (approx. 3 days/week)
    consistency_score = min(100, int((active_days / 12) * 100)) if active_days > 0 else 0

    # Calculate retention score
    # Baseline average score on quiz attempts + active revision count
    total_quizzes = len(quiz_results)
    avg_quiz_score = 0.0
    if total_quizzes > 0:
        avg_quiz_score = sum(res["percentage"] for res in quiz_results) / total_quizzes
    
    # Retention matches avg quiz score + a bonus for repeated topic attempts (revision)
    repeated_topic_revisions = sum(1 for count in topic_counts.values() if count > 1)
    retention_score = min(100, int(avg_quiz_score + (repeated_topic_revisions * 5)))

    # Calculate study discipline score
    # Based on notes uploads, AI asks, and quiz submissions
    ask_ai_count = sum(1 for act in activities if act["activity_type"] == "ask_ai")
    attempt_quiz_count = sum(1 for act in activities if act["activity_type"] == "attempt_quiz")
    
    discipline_score = min(100, (notes_count * 10) + (ask_ai_count * 4) + (attempt_quiz_count * 8))
    


    # Determine learning speed
    if retention_score >= 80:
        learning_speed = "Fast"
    elif retention_score >= 60:
        learning_speed = "Medium"
    else:
        learning_speed = "Steady"

    # Overall learning score
    overall_learning_score = int((consistency_score * 0.3) + (retention_score * 0.4) + (discipline_score * 0.3))

    # Recommended Focus Areas
    recommended_focus = []
    # If they have weak topics, recommend those
    if weak_topics:
        recommended_focus.extend(weak_topics[:3])
    # If they have weak subjects, recommend those
    if weak_subjects:
        for ws in weak_subjects:
            recommended_focus.append(f"Subject Review: {ws}")
    
    # Default fallback focus areas
    if not recommended_focus:
        recommended_focus = ["Practice more active recall quizzes", "Review newly uploaded study notes"]

    profile_doc = {
        "user_id": ObjectId(user_id),
        "learning_speed": learning_speed,
        "consistency_score": consistency_score,
        "retention_score": retention_score,
        "study_discipline_score": discipline_score,
        "strong_subjects": strong_subjects,
        "weak_subjects": weak_subjects,
        "strong_topics": strong_topics,
        "weak_topics": weak_topics,
        "recommended_focus": recommended_focus,
        "overall_learning_score": overall_learning_score,
        "updated_at": datetime.now(timezone.utc)
    }

    # Upsert the profile in MongoDB
    await db["learning_dna"].update_one(
        {"user_id": ObjectId(user_id)},
        {"$set": profile_doc},
        upsert=True
    )

    return profile_doc

@router.get("", response_model=LearningDNAProfile)
async def get_learning_dna(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """
    Retrieve the current student's Learning DNA Profile.
    If it doesn't exist, calculate one automatically.
    """
    user_id = current_user["_id"]
    profile = await db["learning_dna"].find_one({"user_id": ObjectId(user_id)})
    
    if not profile:
        profile = await calculate_profile(user_id, db)
        
    return LearningDNAProfile(
        user_id=str(profile["user_id"]),
        learning_speed=profile["learning_speed"],
        consistency_score=profile["consistency_score"],
        retention_score=profile["retention_score"],
        study_discipline_score=profile.get("study_discipline_score", 75),
        strong_subjects=profile["strong_subjects"],
        weak_subjects=profile["weak_subjects"],
        strong_topics=profile.get("strong_topics", []),
        weak_topics=profile.get("weak_topics", []),
        recommended_focus=profile["recommended_focus"],
        overall_learning_score=profile["overall_learning_score"],
        recommendations=profile.get("recommendations", [
            "Focus on reviewing your weak topics to build core foundations.",
            "Maintain consistency by revising your notes for at least 10 minutes daily.",
            "Challenge yourself by attempting new quizzes on your strong subjects."
        ])
    )

@router.post("/recalculate", response_model=LearningDNAProfile)
async def force_recalculate_dna(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """
    Force a recalculation of the user's Learning DNA profile.
    """
    user_id = current_user["_id"]
    profile = await calculate_profile(user_id, db)
    
    return LearningDNAProfile(
        user_id=str(profile["user_id"]),
        learning_speed=profile["learning_speed"],
        consistency_score=profile["consistency_score"],
        retention_score=profile["retention_score"],
        study_discipline_score=profile["study_discipline_score"],
        strong_subjects=profile["strong_subjects"],
        weak_subjects=profile["weak_subjects"],
        strong_topics=profile["strong_topics"],
        weak_topics=profile["weak_topics"],
        recommended_focus=profile["recommended_focus"],
        overall_learning_score=profile["overall_learning_score"],
        recommendations=profile.get("recommendations", [
            "Focus on reviewing your weak topics to build core foundations.",
            "Maintain consistency by revising your notes for at least 10 minutes daily.",
            "Challenge yourself by attempting new quizzes on your strong subjects."
        ])
    )

@router.get("/recommendations", response_model=RecommendationResponse)
@limiter.limit("5/minute")
async def get_ai_recommendations(
    request: Request,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """
    Generate dynamic study recommendations using Gemini 2.5 Flash based on the student's DNA profile.
    """
    user_id = current_user["_id"]
    profile = await db["learning_dna"].find_one({"user_id": ObjectId(user_id)})
    if not profile:
        profile = await calculate_profile(user_id, db)

    # 1. Prepare profile metrics summary
    metrics_summary = f"""Learning DNA Profile:
- Learning Speed: {profile['learning_speed']}
- Consistency Score: {profile['consistency_score']}%
- Retention Score: {profile['retention_score']}%
- Study Discipline Score: {profile['study_discipline_score']}%
- Overall Learning Score: {profile['overall_learning_score']}/100
- Strong Subjects: {', '.join(profile['strong_subjects']) if profile['strong_subjects'] else 'None yet'}
- Weak Subjects: {', '.join(profile['weak_subjects']) if profile['weak_subjects'] else 'None yet'}
- Strong Topics: {', '.join(profile.get('strong_topics', [])) if profile.get('strong_topics') else 'None yet'}
- Weak Topics: {', '.join(profile.get('weak_topics', [])) if profile.get('weak_topics') else 'None yet'}
"""

    # 2. Structure Pydantic schema for recommendations list
    schema = {
        "type": "OBJECT",
        "properties": {
            "recommendations": {
                "type": "ARRAY",
                "items": {"type": "STRING"}
            }
        },
        "required": ["recommendations"]
    }

    prompt = f"""You are an elite academic AI advisor. Based on the student's Learning DNA Profile, generate exactly 3 highly personalized, actionable study recommendations.
The recommendations should address:
1. Specific focus areas based on weak topics or weak subjects (e.g., "Focus on AVL Trees this week because your average quiz score is below 60%").
2. General performance comparisons (e.g., "You excel in DSA but need to increase revision frequency in Operating Systems").
3. Motivations and consistency advice (e.g., "Your study consistency is excellent at 82%. Try setting a daily 15-minute notes review streak").

Guidelines:
- Each recommendation must be 1 concise sentence.
- Sound like a premium study coach.

Profile details:
{metrics_summary}
"""
    try:
        response = gemini_client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.7,
                response_mime_type="application/json",
                response_schema=schema
            )
        )
        
        rec_data = json.loads(response.text.strip())
        recommendations = rec_data.get("recommendations", [])
        
    except Exception as e:
        logger.error(f"Learning DNA Recommendations: Gemini call failed: {e}")
        # Default fallback recommendations matching format
        recommendations = [
            "Focus on reviewing your weak topics to build core foundations.",
            "Maintain consistency by revising your notes for at least 10 minutes daily.",
            "Challenge yourself by attempting new quizzes on your strong subjects."
        ]
        
    return RecommendationResponse(recommendations=recommendations)

@router.get("/analytics", response_model=AnalyticsResponse)
async def get_dna_analytics(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """
    Get detailed metrics analytics for plotting dashboard charts.
    """
    user_id = current_user["_id"]

    # 1. Calculate study streak from activity logs
    # Retrieve user activities in last 30 days
    activities_cursor = db["user_activities"].find({"user_id": ObjectId(user_id)}).sort("timestamp", -1)
    activities = await activities_cursor.to_list(length=500)

    # Calculate streak count
    # Group unique active days sorted descending
    active_days = sorted(list(set(
        act["timestamp"].astimezone().date() for act in activities
    )), reverse=True)

    streak = 0
    today = datetime.now().date()
    yesterday = today - timedelta(days=1)
    
    if active_days:
        # Streak continues if they studied today or yesterday
        if active_days[0] == today or active_days[0] == yesterday:
            streak = 1
            for i in range(len(active_days) - 1):
                if (active_days[i] - active_days[i+1]).days == 1:
                    streak += 1
                else:
                    break
        else:
            streak = 0
    else:
        streak = 0

    # 2. Build consistency timeline (last 7 days)
    # Mapping each day (e.g. "Mon", "Tue") to a boolean (whether they had any activity)
    consistency_timeline = []
    
    # Calculate dates for last 7 days
    now = datetime.now()
    for i in range(6, -1, -1):
        target_date = now - timedelta(days=i)
        date_str = target_date.strftime("%Y-%m-%d")
        day_label = target_date.strftime("%a") # e.g. "Mon"
        
        # Check if they had any activity on this date
        had_activity = any(
            act["timestamp"].astimezone().strftime("%Y-%m-%d") == date_str 
            for act in activities
        )
        consistency_timeline.append({
            "day": day_label,
            "date": target_date.strftime("%b %d"),
            "active": had_activity
        })

    # 3. Retrieve all quiz results joined with details
    pipeline = [
        {"$match": {"user_id": ObjectId(user_id)}},
        {"$lookup": {
            "from": "quizzes",
            "localField": "quiz_id",
            "foreignField": "_id",
            "as": "quiz_details"
        }},
        {"$unwind": "$quiz_details"}
    ]
    cursor = db["quiz_results"].aggregate(pipeline)
    quiz_results = await cursor.to_list(length=100)

    # 4. Group averages for subjects
    subject_totals = {}
    subject_counts = {}
    topic_totals = {}
    topic_counts = {}

    for res in quiz_results:
        sub = res["quiz_details"]["subject"]
        topic = res["quiz_details"]["topic"]
        pct = res["percentage"]

        subject_totals[sub] = subject_totals.get(sub, 0.0) + pct
        subject_counts[sub] = subject_counts.get(sub, 0) + 1

        topic_totals[topic] = topic_totals.get(topic, 0.0) + pct
        topic_counts[topic] = topic_counts.get(topic, 0) + 1

    subject_performances = []
    for sub, total_pct in subject_totals.items():
        subject_performances.append({
            "subject": sub,
            "average_score": round(total_pct / subject_counts[sub], 2),
            "attempts": subject_counts[sub]
        })
        
    # If empty, add default subjects
    if not subject_performances:
        subject_performances = [
            {"subject": "DSA", "average_score": 0.0, "attempts": 0},
            {"subject": "DBMS", "average_score": 0.0, "attempts": 0},
            {"subject": "Operating Systems", "average_score": 0.0, "attempts": 0}
        ]

    topic_performances = []
    for topic, total_pct in topic_totals.items():
        topic_performances.append({
            "topic": topic,
            "average_score": round(total_pct / topic_counts[topic], 2),
            "attempts": topic_counts[topic]
        })

    # Total unique active study days across all history
    total_sessions = len(active_days)

    notes_count = await db["notes"].count_documents({"user_id": ObjectId(user_id)})

    # Compute realistic study hours:
    # 1. Notes uploads: 15 minutes (0.25 hours) per upload
    notes_hours = notes_count * 0.25
    
    # 2. Quiz attempts: 1.5 minutes per question attempted
    quiz_hours = 0.0
    for res in quiz_results:
        q_count = len(res.get("correct_answers", [])) + len(res.get("wrong_answers", []))
        quiz_hours += (q_count * 1.5) / 60
        
    # 3. Completed viva sessions: actual duration (capped at 2 hours), default to 15 mins (0.25h) if invalid
    viva_cursor = db["viva_sessions"].find({"user_id": ObjectId(user_id), "status": "completed"})
    vivas = await viva_cursor.to_list(length=500)
    viva_hours = 0.0
    for v in vivas:
        if v.get("started_at") and v.get("completed_at"):
            start = v["started_at"]
            end = v["completed_at"]
            if start.tzinfo is None:
                start = start.replace(tzinfo=timezone.utc)
            if end.tzinfo is None:
                end = end.replace(tzinfo=timezone.utc)
            dur = (end - start).total_seconds() / 3600
            if 0.0 < dur < 2.0:
                viva_hours += dur
            else:
                viva_hours += 0.25
        else:
            viva_hours += 0.25
            
    # 4. Completed revisions: 10 minutes (0.17 hours) per completed revision
    revision_count = await db["revision_history"].count_documents({"user_id": ObjectId(user_id)})
    revision_hours = (revision_count * 10) / 60
    
    total_study_hours = round(notes_hours + quiz_hours + viva_hours + revision_hours, 1)

    # Additional activity-based metrics
    questions_asked = sum(1 for act in activities if act["activity_type"] == "ask_ai")

    # Build active_days_list as YYYY-MM-DD strings for the last 28 days
    active_days_list = sorted(
        list(set(act["timestamp"].astimezone().strftime("%Y-%m-%d") for act in activities)),
        reverse=True
    )[:28]

    return AnalyticsResponse(
        consistency_timeline=consistency_timeline,
        subject_performances=subject_performances,
        topic_performances=topic_performances,
        streak=streak,
        total_sessions=total_sessions,
        total_study_hours=total_study_hours,
        notes_uploaded=notes_count,
        questions_asked=questions_asked,
        active_days=len(active_days),
        active_days_list=active_days_list
    )
