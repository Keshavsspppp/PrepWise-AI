from google import genai
from app.core.config import settings

# Initialise the Gemini client once globally at startup
gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
