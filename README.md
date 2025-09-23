# 🍅 Pomodev - Modern Pomodoro Timer

<div align="center">

![Pomodev Logo](https://img.shields.io/badge/Pomodev-🍅-blue?style=for-the-badge&logo=clock)

**Derin odak için tasarlanmış modern Pomodoro uygulaması**

[![Python](https://img.shields.io/badge/Python-3.7+-blue?style=flat-square&logo=python)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-2.0+-green?style=flat-square&logo=flask)](https://flask.palletsprojects.com)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=flat-square&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

 • [📖 Özellikler](#-özellikler)  • [📱 Kullanım](#-kullanım) • [🎨 Ekran Görüntüleri](#-ekran-görüntüleri)

</div>

---

## 📖 Hakkında

**Pomodev**, Pomodoro Tekniği'ni kullanarak üretkenliğinizi artırmanız için tasarlanmış modern ve kullanıcı dostu bir web uygulamasıdır. Derin odak, görev yönetimi ve detaylı istatistiklerle çalışma ritminizi optimize edin.

### 🎯 Pomodoro Tekniği Nedir?

Pomodoro Tekniği, işi 25 dakikalık yoğun odak bloklarına (pomodoro) ve kısa molalara bölen kanıtlanmış bir zaman yönetimi yaklaşımıdır:

- **25 dakika** odaklanmış çalışma
- **5 dakika** kısa mola
- **4 pomodoro** sonrası **15-30 dakika** uzun mola
- Tek seferde tek görev, bölünmeyen çalışma

---

## ✨ Özellikler

### 🕐 Zamanlayıcı
- **3 Mod**: Pomodoro (25dk), Kısa Mola (5dk), Uzun Mola (15dk)
- **Özelleştirilebilir süreler** - Ayarlardan değiştirilebilir
- **Otomatik geçiş** - Molalar ve pomodorolar otomatik başlayabilir
- **Sesli bildirimler** - 3 farklı alarm sesi seçeneği
- **Tık sesi** - Çalışma sırasında arka plan sesi

### 📊 İstatistikler ve Takip
- **Günlük/Haftalık pomodoro sayısı**
- **Streak takibi** - Ardışık günler
- **Günlük hedef belirleme** ve ilerleme takibi
- **Saatlik üretkenlik analizi**
- **En verimli saatlerin tespiti**

### 📋 Görev Yönetimi
- **Detaylı görev oluşturma** - Başlık, kategori, öncelik, not
- **Pomodoro tahmini** - Her görev için tahmini süre
- **Kategori filtreleme** - İş, Kişisel, Öğrenme
- **Öncelik seviyeleri** - Düşük, Normal, Önemli, Acil
- **Proje ve etiket desteği**

### 🎨 Kişiselleştirme
- **Açık/Koyu tema** - Göz yorgunluğunu azaltır
- **3 Vurgu rengi** - Mavi, Mor, Mercan
- **Modern arayüz** - Glassmorphism tasarım
- **Responsive tasarım** - Tüm cihazlarda mükemmel görünüm

### ⌨️ Klavye Kısayolları
- **Space** - Zamanlayıcıyı başlat/durdur
- **R** - Zamanlayıcıyı sıfırla
- **S** - Ayarları aç
- **Escape** - Modalları kapat

### 🔔 Bildirimler
- **Web bildirimleri** - Tarayıcı bildirim desteği
- **Tam ekran modu** - Dikkat dağıtıcı unsurları gizle
- **Ses kontrolleri** - Alarm ve tık sesi seviyeleri

## 📱 Kullanım

### 🚀 Hızlı Başlangıç
1. **Mod Seçin**: Pomodoro, Kısa Mola veya Uzun Mola
2. **START** butonuna basın ve odaklanın
3. **Görev ekleyin** ve ilerlemenizi takip edin
4. **İstatistikleri** inceleyerek verimliliğinizi artırın

### ⚙️ Ayarlar
- **Zamanlayıcı**: Pomodoro, mola sürelerini özelleştirin
- **Ses**: Alarm ve tık sesi ayarları
- **Otomatik**: Otomatik geçiş ve görev işaretleme
- **Tema**: Açık/koyu tema ve vurgu rengi

### 📊 İstatistikler
- **Sol panel**: Günlük hedef ve ilerleme
- **Sağ panel**: Üretkenlik analizi ve en verimli saatler
- **Görevler**: Kategori filtreleme ve öncelik sıralaması

---



## 🏗️ Proje Yapısı

```
pomodev/
├── app.py                 # Flask uygulaması
├── requirements.txt       # Python bağımlılıkları
├── README.md             # Bu dosya
├── static/               # Statik dosyalar
│   ├── style.css         # Ana stil dosyası
│   ├── script.js         # JavaScript fonksiyonları
│   └── sounds/           # Ses dosyaları
│       ├── bell.wav
│       ├── clock.wav
│       └── kitchen.wav
└── templates/            # HTML şablonları
    └── index.html        # Ana sayfa
```

---

## 🔧 Teknik Detaylar

### Backend
- **Flask** - Web framework
- **Python 3.7+** - Programlama dili

### Frontend
- **HTML5** - Yapısal markup
- **CSS3** - Modern styling (Grid, Flexbox, Custom Properties)
- **Vanilla JavaScript** - Framework-free JS
- **Glassmorphism** - Modern UI tasarım

### Özellikler
- **LocalStorage** - Veri kalıcılığı
- **Web Notifications API** - Bildirimler
- **Fullscreen API** - Tam ekran modu
- **Audio API** - Ses kontrolü

---

## 👨‍💻 Geliştirici

**ARDA** - *Full Stack Developer*

- GitHub: [@ardamoustafa1](https://github.com/ardamoustafa1)
- LinkedIn: [Arda Moustafa](www.linkedin.com/in/arda-moustafa-746335335)
- Email: ardamoustafa_@hotmail.com

---


**⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!**

Made with ❤️ by [ARDA](https://github.com/ardamoustafa1)

