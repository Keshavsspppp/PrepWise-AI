import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "PrepWise AI"
    DEBUG: bool = False
    GEMINI_MODEL: str = "gemini-2.5-flash"
    
    # MongoDB Config
    MONGO_URI: str = "mongodb://localhost:27017/studygenie"
    
    # Security Config
    JWT_SECRET: str = Field(...)
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # RAG Config
    GEMINI_API_KEY: str = Field(...)
    CHROMA_PERSIST_DIR: str = "chroma_db"

    # CORS Config
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"


    # Auto load from .env file inside backend directory
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
