import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'varsayilan-anahtar'
    # Dosya yerine hafızada çalışsın (Vercel uyumlu)
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    BBB_URL = os.environ.get('BBB_API_URL', '').rstrip('/')
    BBB_SECRET = os.environ.get('BBB_SECRET', '')