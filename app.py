from flask import Flask, render_template, request, redirect, url_for, send_from_directory
import os

# Vercel için path ayarları
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_DIR = os.path.join(BASE_DIR, 'templates')
STATIC_DIR = os.path.join(BASE_DIR, 'static')

app = Flask(__name__, 
            template_folder=TEMPLATE_DIR,
            static_folder=STATIC_DIR)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/blog')
def blog_index():
    return render_template('blog.html')

@app.route('/blog/pomodoro-nasil-uygulanir')
def blog_pomodoro():
    return render_template('blog_pomodoro.html')

@app.route('/blog/derin-calisma-ipuclari')
def blog_deepwork():
    return render_template('blog_deepwork.html')

@app.route('/mini-player')
def mini_player():
    return render_template('mini_player.html')

@app.route('/hakkimizda')
def about():
    return render_template('about.html')

@app.route('/kullanim-kilavuzu')
def guide():
    return render_template('guide.html')

@app.route('/gizlilik-politikasi')
def privacy():
    return render_template('privacy.html')

@app.route('/kullanim-sartlari')
def terms():
    return render_template('terms.html')

@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory(STATIC_DIR, filename)

@app.route('/ads.txt')
def ads_txt():
    try:
        # Önce root dizinden dene
        return send_from_directory(BASE_DIR, 'ads.txt', mimetype='text/plain')
    except:
        # Sonra static dizinden dene
        return send_from_directory(STATIC_DIR, 'ads.txt', mimetype='text/plain')

@app.route('/favicon.ico')
def favicon():
    # Önce .ico varsa onu ver, yoksa svg ver
    try:
        return send_from_directory(STATIC_DIR, 'favicon.ico')
    except:
        return send_from_directory(STATIC_DIR, 'favicon.svg')

# Vercel için handler - WSGI uygulaması
handler = app

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
