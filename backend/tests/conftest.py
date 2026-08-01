"""Provide the required settings before app modules import and instantiate Settings.

Without this, importing any app module on a machine with no backend/.env fails at
import time, because JWT_SECRET and GEMINI_API_KEY are required fields.
"""
import os

os.environ.setdefault("JWT_SECRET", "test-secret-not-used-for-signing-anything-real")
os.environ.setdefault("GEMINI_API_KEY", "test-key")
os.environ.setdefault("MONGO_URI", "mongodb://localhost:27017/studygenie_test")
