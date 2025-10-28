from flask import Flask, render_template, request, redirect, url_for, send_from_directory
import os

app = Flask(__name__)

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

@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory('static', filename)

@app.route('/ads.txt')
def ads_txt():
    try:
        # Önce root dizinden dene
        return send_from_directory('.', 'ads.txt', mimetype='text/plain')
    except:
        # Sonra static dizinden dene
        return send_from_directory('static', 'ads.txt', mimetype='text/plain')

@app.route('/favicon.ico')
def favicon():
    # Önce .ico varsa onu ver, yoksa svg ver
    try:
        return send_from_directory('static', 'favicon.ico')
    except:
        return send_from_directory('static', 'favicon.svg')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
