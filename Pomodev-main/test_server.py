#!/usr/bin/env python3
"""
Test server - Hataları görmek için
"""

import sys
import os

# Hataları göster
import traceback

try:
    print("=" * 50)
    print("Pomodev Server Başlatılıyor...")
    print("=" * 50)
    print()
    
    # Environment
    os.environ['PORT'] = '8080'
    
    # Import
    print("📦 Modüller yükleniyor...")
    from app import app, init_db
    
    print("✅ Modüller yüklendi")
    print()
    
    # Database
    print("🗄️  Database kontrol ediliyor...")
    init_db()
    print("✅ Database hazır")
    print()
    
    # Server
    print("🌐 Server başlatılıyor...")
    print("📍 URL: http://localhost:8080")
    print("📍 URL: http://127.0.0.1:8080")
    print()
    print("Durdurmak için Ctrl+C tuşlarına basın")
    print("=" * 50)
    print()
    
    app.run(host='127.0.0.1', port=8080, debug=True)
    
except KeyboardInterrupt:
    print("\n\n👋 Server durduruldu")
except Exception as e:
    print("\n❌ HATA:")
    print("=" * 50)
    traceback.print_exc()
    print("=" * 50)
    sys.exit(1)
