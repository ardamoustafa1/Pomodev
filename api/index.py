import sys
import os

# Vercel için: Mevcut dosyanın bulunduğu dizin (api/)
current_dir = os.path.dirname(os.path.abspath(__file__))
# Root dizin (api/ klasörünün bir üstü)
root_dir = os.path.dirname(current_dir)

# Root dizini Python path'e ekle
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

# Flask app'i import et
try:
    from app import app
except ImportError as e:
    # Debug için hata mesajı
    import traceback
    traceback.print_exc()
    raise

# Vercel serverless function handler
# Flask WSGI uygulamasını direkt export et
handler = app
