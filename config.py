from dotenv import load_dotenv
import os
import firebase_admin
from firebase_admin import credentials
import google.generativeai as genai

load_dotenv()

APP_SECRET_KEY = os.getenv("APP_SECRET_KEY")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is not set.")

YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY')
if not YOUTUBE_API_KEY:
    raise ValueError("YOUTUBE_API_KEY environment variable is not set.")

FIREBASE_ADMIN_SDK_CREDENTIALS = os.getenv("FIREBASE_ADMIN_SDK_CREDENTIALS")
if not FIREBASE_ADMIN_SDK_CREDENTIALS:
    raise ValueError("FIREBASE_ADMIN_SDK_CREDENTIALS environment variable is not set.")

FIREBASE_DATABASE_URL = os.getenv("FIREBASE_DATABASE_URL")

def init_firebase():
    try:
        firebase_admin.get_app()
    except ValueError:
        cred = credentials.Certificate(FIREBASE_ADMIN_SDK_CREDENTIALS)
        firebase_admin.initialize_app(cred, {
            'databaseURL': FIREBASE_DATABASE_URL
        })

def init_gemini():
    genai.configure(api_key=GEMINI_API_KEY)

def init_services():
    init_firebase()
    init_gemini()

config = {
    'SECRET_KEY': APP_SECRET_KEY,
    'GEMINI_API_KEY': GEMINI_API_KEY,
    'YOUTUBE_API_KEY': YOUTUBE_API_KEY,
    'FIREBASE_DATABASE_URL': FIREBASE_DATABASE_URL
}