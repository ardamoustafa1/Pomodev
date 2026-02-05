#!/usr/bin/env python3
"""
Basit başlatma scripti - Hataları gösterir
"""

import os
import sys

print("=" * 60)
print("🚀 POMODEV BAŞLATILIYOR")
print("=" * 60)
print()

# Port ayarla
port = 8080
if len(sys.argv) > 1:
    try:
        port = int(sys.argv[1])
    except:
        pass

print(f"📍 Port: {port}")
print(f"🌐 URL: http://localhost:{port}")
print(f"🌐 URL: http://127.0.0.1:{port}")
print()
print("Durdurmak için Ctrl+C tuşlarına basın")
print("=" * 60)
print()

try:
    os.environ['PORT'] = str(port)
    
    from app import app
    
    print("✅ Uygulama yüklendi!")
    print("🌐 Server başlatılıyor...")
    print()
    
    app.run(host='127.0.0.1', port=port, debug=True)
    
except KeyboardInterrupt:
    print("\n\n👋 Server durduruldu")
except Exception as e:
    print(f"\n❌ HATA: {e}")
    import traceback
    traceback.print_exc()
    print("\nLütfen bu hata mesajını kaydedin ve bana gönderin.")
    sys.exit(1)
