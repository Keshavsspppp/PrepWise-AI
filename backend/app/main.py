import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.mongodb import connect_to_mongo, close_mongo_connection
from app.routes import auth, notes, ai, quiz, learning_dna, revision, readiness, viva
from app.core.limiter import limiter
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
import os


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Context manager for FastAPI application startup and shutdown events."""
    # Startup: Connect to MongoDB
    await connect_to_mongo()
    # Ensure upload directory exists
    os.makedirs("uploads", exist_ok=True)
    yield
    # Shutdown: Close database connection
    await close_mongo_connection()

app = FastAPI(
    title=settings.PROJECT_NAME,
    debug=settings.DEBUG,
    lifespan=lifespan
)

# Set up Rate Limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Set up CORS middleware to allow connections from React Vite frontend
allowed_origins = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routes
app.include_router(auth.router)
app.include_router(notes.router)
app.include_router(ai.router)
app.include_router(quiz.router)
app.include_router(learning_dna.router)
app.include_router(revision.router)
app.include_router(readiness.router)
app.include_router(viva.router)

@app.get("/", tags=["Health"])
async def root():
    """Basic health check endpoint."""
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "database": "MongoDB Connection Configured"
    }
