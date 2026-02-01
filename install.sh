#!/bin/bash
# Paket Yükleme Scripti

cd "$(dirname "$0")"

echo "📦 Pomodev paketleri yükleniyor..."
echo ""

# Python3 kontrolü
if ! command -v python3 &> /dev/null; then
    echo "❌ HATA: python3 bulunamadı!"
    exit 1
fi

echo "✅ Python3 bulundu"
echo ""

# Pip'i güncelle
echo "🔄 pip güncelleniyor..."
python3 -m pip install --upgrade pip --user

echo ""
echo "📥 Paketler yükleniyor..."
python3 -m pip install -r requirements.txt --user

echo ""
echo "✅ Paket yükleme tamamlandı!"
echo ""
echo "Uygulamayı çalıştırmak için:"
echo "  ./run.sh"
echo "veya"
echo "  python3 app.py"
