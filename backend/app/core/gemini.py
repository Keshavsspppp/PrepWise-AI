import google.generativeai as genai
from app.core.config import settings

# Configure Gemini once globally at startup
genai.configure(api_key=settings.GEMINI_API_KEY)
gemini_model = genai.GenerativeModel("gemini-2.5-flash")
