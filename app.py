from flask import Flask, render_template, request, redirect, url_for, send_from_directory
import os

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

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

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
