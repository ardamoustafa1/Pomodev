import json
from flask import Flask, render_template, request, redirect, url_for
import os

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

def handler(event, context):
    # Netlify Functions için Flask uygulamasını çalıştır
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'text/html',
        },
        'body': render_template('index.html')
    }
