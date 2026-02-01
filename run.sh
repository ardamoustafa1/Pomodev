#!/bin/bash
# Pomodev Başlatma Scripti

cd "$(dirname "$0")"

echo "🚀 Pomodev başlatılıyor..."
echo "📁 Dizin: $(pwd)"
echo ""

# Python3 kontrolü
if ! command -v python3 &> /dev/null; then
    echo "❌ HATA: python3 bulunamadı!"
    echo "Lütfen Python 3'ü yükleyin."
    exit 1
fi

echo "✅ Python3 bulundu: $(which python3)"
echo "📦 Versiyon: $(python3 --version)"
echo ""

# Port kontrolü ve seçimi
PORT=8080
if command -v lsof &> /dev/null; then
    if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo "⚠️  Port 5000 kullanımda, 8080 portunu kullanıyoruz..."
        PORT=8080
    else
        PORT=5000
    fi
else
    echo "⚠️  Port kontrolü yapılamadı, 8080 portunu kullanıyoruz..."
    PORT=8080
fi

URL="http://localhost:$PORT"

echo "🌐 Flask uygulaması başlatılıyor..."
echo "📍 URL: $URL"
echo "📍 Alternatif: http://127.0.0.1:$PORT"
echo ""
echo "Durdurmak için Ctrl+C tuşlarına basın"
echo ""

# Uygulamayı başlat
PORT=$PORT python3 app.py
