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
# Flask app'i import et
try:
    from app import app
    handler = app
except Exception as e:
    # CRITICAL: App failed to start.
    # Return a fallback WSGI app that displays the error.
    import traceback
    error_trace = traceback.format_exc()
    
    # Validation for Vercel logs
    print("CRITICAL STARTUP ERROR:")
    print(error_trace)
    
    from flask import Flask
    fallback = Flask(__name__)
    
    @fallback.route('/', defaults={'path': ''})
    @fallback.route('/<path:path>')
    def catch_all(path):
        return f"<h1>Application Startup Failed</h1><pre>{error_trace}</pre>", 500
        
    handler = fallback
