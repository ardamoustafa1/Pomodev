import sys
import os

# Vercel için root dizini path'e ekle
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, root_dir)

# Flask app'i import et
from app import app

# Vercel serverless function handler
# Flask WSGI uygulamasını direkt export et
handler = app
