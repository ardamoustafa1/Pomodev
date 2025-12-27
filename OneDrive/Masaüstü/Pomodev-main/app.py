from flask import Flask, render_template, request, redirect, url_for, send_from_directory
import os
import sqlite3
from flask import g, jsonify
from werkzeug.security import generate_password_hash, check_password_hash

# Vercel için path ayarları
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_DIR = os.path.join(BASE_DIR, 'templates')
STATIC_DIR = os.path.join(BASE_DIR, 'static')

STATIC_DIR = os.path.join(BASE_DIR, 'static')
DATABASE = os.path.join(BASE_DIR, 'pomodev.db')

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

# ===== Database & Auth Logic =====
def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def init_db():
    with app.app_context():
        db = get_db()
        # Users Table with full user data
        db.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                level INTEGER DEFAULT 1,
                xp INTEGER DEFAULT 0,
                inventory TEXT DEFAULT '[]',
                stats TEXT DEFAULT '{}',
                settings TEXT DEFAULT '{}',
                tasks TEXT DEFAULT '[]',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        db.commit()

# Initialize DB on start
init_db()

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400

    db = get_db()
    try:
        hashed_pw = generate_password_hash(password)
        db.execute('INSERT INTO users (username, password) VALUES (?, ?)', (username, hashed_pw))
        db.commit()
        return jsonify({'message': 'User created successfully', 'username': username}), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Username already exists'}), 409

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    db = get_db()
    user = db.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()

    if user and check_password_hash(user['password'], password):
        # Return ALL user data
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': user['id'],
                'username': user['username'],
                'level': user['level'],
                'xp': user['xp'],
                'inventory': user['inventory'] if user['inventory'] else '[]',
                'stats': user['stats'] if user['stats'] else '{}',
                'settings': user['settings'] if user['settings'] else '{}',
                'tasks': user['tasks'] if user['tasks'] else '[]'
            }
        }), 200
    
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/update_progress', methods=['POST'])
def update_progress():
    data = request.get_json()
    username = data.get('username')
    xp = data.get('xp')
    level = data.get('level')

    if not username:
        return jsonify({'error': 'Username required'}), 400

    db = get_db()
    db.execute('''
        UPDATE users 
        SET xp = ?, level = ? 
        WHERE username = ?
    ''', (xp, level, username))
    db.commit()
    return jsonify({'message': 'Progress updated'}), 200

@app.route('/api/save_user_data', methods=['POST'])
def save_user_data():
    """Save ALL user data (inventory, stats, settings, tasks)"""
    data = request.get_json()
    username = data.get('username')
    
    if not username:
        return jsonify({'error': 'Username required'}), 400
    
    db = get_db()
    
    # Update all fields that are provided
    update_fields = []
    params = []
    
    if 'xp' in data:
        update_fields.append('xp = ?')
        params.append(data['xp'])
    if 'level' in data:
        update_fields.append('level = ?')
        params.append(data['level'])
    if 'inventory' in data:
        update_fields.append('inventory = ?')
        params.append(data['inventory'])
    if 'stats' in data:
        update_fields.append('stats = ?')
        params.append(data['stats'])
    if 'settings' in data:
        update_fields.append('settings = ?')
        params.append(data['settings'])
    if 'tasks' in data:
        update_fields.append('tasks = ?')
        params.append(data['tasks'])
    
    if update_fields:
        params.append(username)
        query = f"UPDATE users SET {', '.join(update_fields)} WHERE username = ?"
        db.execute(query, params)
        db.commit()
    
    return jsonify({'message': 'User data saved'}), 200

@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    db = get_db()
    # Top 50 users by Level descending, then XP descending
    users = db.execute('''
        SELECT username, level, xp 
        FROM users 
        ORDER BY level DESC, xp DESC 
        LIMIT 50
    ''').fetchall()
    
    leaderboard_data = [
        {'username': row['username'], 'level': row['level'], 'xp': row['xp']}
        for row in users
    ]
    return jsonify(leaderboard_data), 200
SEO_PAGES = {
    'pomodoro-timer-for-students': {
        'title': 'Best Pomodoro Timer for Students',
        'description': 'Maximize your study sessions with Pomodev. The perfect focus timer for students preparing for exams.',
        'content': '<p>Studying for long hours can be exhausting. The <strong>Pomodoro Technique</strong> is proven to help students retain more information by breaking work into 25-minute chunks.</p><h2>Why Pomodev for Students?</h2><ul><li><strong>Gamified:</strong> Earn XP for every minute you study.</li><li><strong>Distraction Free:</strong> Clean interface to keep you in the zone.</li><li><strong>Track Progress:</strong> See exactly how many hours you studied today.</li></ul>'
    },
    'focus-timer-for-programmers': {
        'title': 'Productivity Timer for Programmers (Deep Work)',
        'description': 'Stay in the flow state. Pomodev is designed for developers who need deep focus blocks.',
        'content': '<p>Coding requires <strong>Deep Work</strong>. Context switching is the enemy. Use Pomodev to set 50-minute blocks (Deep Work Mode) and merge into the flow.</p><h2>Features for Devs</h2><ul><li><strong>Dark Mode:</strong> Easy on the eyes for late-night coding.</li><li><strong>No Login Required:</strong> Just open and code.</li></ul>'
    },
    'timer-for-adhd': {
        'title': 'ADHD Friendly Focus Timer',
        'description': 'Struggling to focus? Pomodev uses gamification to provide the dopamine hits needed to stay on task.',
        'content': '<p>For brains that crave stimulation, standard timers are boring. Pomodev uses <strong>Gamification (XP & Levels)</strong> to make focusing rewarding immediately.</p>'
    }
}

@app.route('/use/<slug>')
def seo_landing(slug):
    if slug in SEO_PAGES:
        page = SEO_PAGES[slug]
        return render_template('landing_page.html', 
                             title=page['title'], 
                             description=page['description'], 
                             content=page['content'],
                             year="2024")
    return redirect(url_for('index'))

@app.route('/sitemap.xml')
def sitemap():
    xml = '<?xml version="1.0" encoding="UTF-8"?>'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    
    # Homepage - highest priority
    xml += '<url><loc>https://pomodev-omega.vercel.app/</loc><changefreq>daily</changefreq><priority>1.0</priority><lastmod>2024-01-01</lastmod></url>'
    
    # Static pages - high priority
    routes = [
        ('/blog', 'weekly', '0.9'),
        ('/blog/pomodoro-nasil-uygulanir', 'monthly', '0.8'),
        ('/blog/derin-calisma-ipuclari', 'monthly', '0.8'),
        ('/hakkimizda', 'monthly', '0.7'),
        ('/kullanim-kilavuzu', 'monthly', '0.8'),
        ('/gizlilik-politikasi', 'yearly', '0.5'),
        ('/kullanim-sartlari', 'yearly', '0.5'),
        ('/mini-player', 'monthly', '0.7')
    ]
    for route, freq, priority in routes:
        xml += f'<url><loc>https://pomodev-omega.vercel.app{route}</loc><changefreq>{freq}</changefreq><priority>{priority}</priority></url>'
    
    # Dynamic SEO pages
    for slug in SEO_PAGES:
         xml += f'<url><loc>https://pomodev-omega.vercel.app/use/{slug}</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>'

    xml += '</urlset>'
    return app.response_class(xml, mimetype='application/xml')

@app.route('/robots.txt')
def robots_txt():
    return send_from_directory(BASE_DIR, 'robots.txt', mimetype='text/plain')

@app.route('/google86d7f55421be2d0f.html')
def google_verification():
    return send_from_directory(BASE_DIR, 'google86d7f55421be2d0f.html', mimetype='text/html')

@app.route('/favicon.ico')
def favicon():
    # Önce .ico varsa onu ver, yoksa svg ver
    try:
        return send_from_directory(STATIC_DIR, 'favicon.ico')
    except:
        return send_from_directory(STATIC_DIR, 'favicon.svg')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
