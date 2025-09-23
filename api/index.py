from flask import Flask, render_template, send_from_directory
import os

app = Flask(__name__, 
            static_folder='../static',
            template_folder='../templates')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory('../static', filename)

# Vercel serverless function handler
def handler(request):
    return app(request.environ, lambda *args: None)
