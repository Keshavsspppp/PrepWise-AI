import logging
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from bson import ObjectId
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class DatabaseManager:
    client: AsyncIOMotorClient = None
    db = None

db_manager = DatabaseManager()

async def connect_to_mongo():
    """Establish async MongoDB connection."""
    logger.info("Connecting to MongoDB...")
    # Extract DB name from URI if present, otherwise default to studygenie
    # E.g. mongodb://localhost:27017/studygenie -> database name is studygenie
    db_name = "studygenie"
    uri_parts = settings.MONGO_URI.split("/")
    if len(uri_parts) > 3 and uri_parts[3]:
        # Strip query parameters if any
        db_name = uri_parts[3].split("?")[0]
        
    db_manager.client = AsyncIOMotorClient(settings.MONGO_URI)
    db_manager.db = db_manager.client[db_name]
    logger.info(f"Connected to MongoDB database: {db_name}")

    # Create indexes on user_id to prevent full collection scans
    try:
        collections_to_index = [
            "notes",
            "quizzes",
            "quiz_results",
            "user_activities",
            "topic_retention",
            "revision_history",
            "exam_readiness",
            "viva_sessions",
            "viva_results"
        ]
        for col in collections_to_index:
            await db_manager.db[col].create_index([("user_id", 1)])
        logger.info("Successfully configured MongoDB indexes for all collections.")
    except Exception as idx_err:
        logger.error(f"Error creating MongoDB indexes: {idx_err}")

async def close_mongo_connection():
    """Close MongoDB connection."""
    if db_manager.client:
        logger.info("Closing MongoDB connection...")
        db_manager.client.close()
        logger.info("MongoDB connection closed.")

def get_db():
    """Dependency helper to get DB instance."""
    return db_manager.db



async def log_activity(db, user_id: str, activity_type: str):
    """Log user study activity for consistency tracking."""
    try:
        activity_doc = {
            "user_id": ObjectId(user_id),
            "activity_type": activity_type,
            "timestamp": datetime.now(timezone.utc)
        }
        await db["user_activities"].insert_one(activity_doc)
        logger.info(f"Activity logged: {activity_type} for user {user_id}")
    except Exception as e:
        logger.error(f"Failed to log user activity {activity_type}: {e}")

