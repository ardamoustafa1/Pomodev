import os
import hashlib
import requests
from dotenv import load_dotenv

# .env dosyasını yükle
load_dotenv()

API_URL = os.getenv("BBB_API_URL", "").rstrip("/")
SECRET = os.getenv("BBB_SECRET", "")

print("-" * 30)
print(f"URL:    {API_URL}")
print(f"SECRET: {SECRET}")
print("-" * 30)

if not API_URL or not SECRET:
    print("❌ HATA: .env dosyasından veriler okunamadı!")
    exit()

# Basit bir "getMeetings" isteği atalım
action = "getMeetings"
checksum_str = action + SECRET
checksum = hashlib.sha1(checksum_str.encode("utf-8")).hexdigest()

full_url = f"{API_URL}/{action}?checksum={checksum}"

print(f"İstek atılıyor: {full_url}")

try:
    response = requests.get(full_url, timeout=10)
    print(f"HTTP Kodu: {response.status_code}")
    print("Sunucu Yanıtı:")
    print(response.text)

    if "<returncode>SUCCESS</returncode>" in response.text:
        print("\n✅ BAŞARILI! Secret ve URL doğru.")
    elif "checksumError" in response.text:
        print("\n❌ HATA: Secret (Güvenlik Anahtarı) YANLIŞ!")
    else:
        print("\n⚠️ HATA: Başka bir sorun var (XML'i oku).")

except Exception as e:
    print(f"\n❌ BAĞLANTI HATASI: Sunucuya ulaşılamadı.\nDetay: {e}")