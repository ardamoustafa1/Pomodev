from flask import Flask, render_template, request, redirect, url_for, send_from_directory
import os

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory('static', filename)

def handler(request, context):
    # Netlify Functions için Flask uygulamasını çalıştır
    return app(request.environ, lambda *args: None)
