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

@app.route('/blog/en-iyi-pomodoro-timer-uygulamalari-2024')
def blog_best_timers():
    return render_template('blog_best_pomodoro_timers.html')

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
        'title': 'En İyi Pomodoro Timer Öğrenciler İçin 2024 - Ücretsiz | Pomodev',
        'description': 'Öğrenciler için en iyi pomodoro timer. Gamification ile çalışmayı eğlenceli hale getirin, XP kazanın, seviye atlayın. Sınav hazırlığı ve ders çalışma için ideal. Tamamen ücretsiz.',
        'content': '''
        <p>Öğrenciler için <strong>pomodoro timer</strong> seçimi çok önemlidir. Uzun saatler ders çalışmak yorucu olabilir, ancak <strong>Pomodoro Tekniği</strong> öğrencilerin bilgileri daha iyi hatırlamasına yardımcı olur. İşi 25 dakikalık bloklara bölerek çalışmak, odaklanmayı artırır ve verimliliği yükseltir.</p>
        
        <h2>Öğrenciler İçin Neden Pomodev?</h2>
        <ul>
            <li><strong>Gamification Sistemi:</strong> Her çalışma dakikası için XP kazanın, seviye atlayın ve liderlik tablosunda yükselin. Çalışmayı eğlenceli hale getirir.</li>
            <li><strong>Dikkat Dağıtmayan Arayüz:</strong> Temiz ve minimal tasarım ile odaklanmanızı koruyun.</li>
            <li><strong>Detaylı İlerleme Takibi:</strong> Günlük, haftalık ve aylık çalışma saatlerinizi görün. Hangi günlerde daha verimli olduğunuzu keşfedin.</li>
            <li><strong>Streak Takibi:</strong> Ardışık günlerde çalışarak streak'inizi koruyun ve motivasyonunuzu artırın.</li>
            <li><strong>Günlük Hedef Belirleme:</strong> Kendi hedeflerinizi belirleyin ve ilerlemenizi takip edin.</li>
            <li><strong>Görev Yönetimi:</strong> Her pomodoro'yu belirli bir derse veya konuya bağlayın. Hangi konuda ne kadar çalıştığınızı görün.</li>
            <li><strong>Tamamen Ücretsiz:</strong> Premium abonelik yok, tüm özellikler dahil.</li>
            <li><strong>Kayıt Olmadan Kullanım:</strong> Hemen başlayın, isterseniz daha sonra kayıt olun.</li>
        </ul>
        
        <h2>Öğrenciler İçin Pomodoro Tekniği Nasıl Kullanılır?</h2>
        <p>Öğrenciler için pomodoro tekniği şu şekilde uygulanır:</p>
        <ol>
            <li><strong>25 Dakika Odaklanmış Çalışma:</strong> Sadece bir konuya odaklanın. Telefonu kapatın, dikkat dağıtıcıları kaldırın.</li>
            <li><strong>5 Dakika Kısa Mola:</strong> Kalkın, su için, gözlerinizi dinlendirin.</li>
            <li><strong>4 Pomodoro Sonrası 15-30 Dakika Uzun Mola:</strong> Daha uzun bir mola verin, yemek yiyin veya kısa bir yürüyüş yapın.</li>
        </ol>
        
        <h2>Öğrenciler İçin Pomodev'in Avantajları</h2>
        <p><strong>Pomodev</strong>, öğrenciler için özel olarak tasarlanmış özellikler sunar:</p>
        <ul>
            <li><strong>Motivasyon Artırıcı:</strong> XP kazanma ve seviye atlama sistemi ile çalışmayı oyun gibi eğlenceli hale getirir.</li>
            <li><strong>İlerleme Görünürlüğü:</strong> Detaylı istatistikler ile ne kadar çalıştığınızı görün ve kendinizi motive edin.</li>
            <li><strong>Esnek Kullanım:</strong> Özelleştirilebilir süreler ile kendi çalışma ritminize göre ayarlayın.</li>
            <li><strong>Çoklu Cihaz Desteği:</strong> Bilgisayar, tablet veya telefon - her yerden erişin.</li>
        </ul>
        
        <h2>Sonuç: Öğrenciler İçin En İyi Pomodoro Timer</h2>
        <p><strong>Pomodev</strong>, öğrenciler için en iyi pomodoro timer seçimidir. Gamification özellikleri, detaylı istatistikler ve tamamen ücretsiz olması ile diğer uygulamalardan ayrılır. Sınav hazırlığı, ders çalışma ve proje yönetimi için ideal bir araçtır.</p>
        '''
    },
    'focus-timer-for-programmers': {
        'title': 'Programcılar İçin En İyi Pomodoro Timer 2024 - Deep Work | Pomodev',
        'description': 'Programcılar için pomodoro timer. Deep work modu, özelleştirilebilir süreler ve görev yönetimi ile uzun kodlama seanslarında verimliliğinizi artırın. Tamamen ücretsiz.',
        'content': '''
        <p>Programcılar için <strong>pomodoro timer</strong> seçimi kritik öneme sahiptir. Kodlama <strong>Deep Work</strong> (Derin Çalışma) gerektirir. Context switching (bağlam değiştirme) verimliliğin en büyük düşmanıdır. <strong>Pomodev</strong>, programcılar için özel olarak optimize edilmiş özellikler sunar.</p>
        
        <h2>Programcılar İçin Neden Pomodev?</h2>
        <ul>
            <li><strong>Deep Work Modu:</strong> 50 dakikalık derin çalışma blokları ile flow state'e girin.</li>
            <li><strong>Özelleştirilebilir Süreler:</strong> Pomodoro, kısa mola ve uzun mola sürelerini ihtiyacınıza göre ayarlayın.</li>
            <li><strong>Dark Mode:</strong> Gece kodlama seansları için göz dostu karanlık tema.</li>
            <li><strong>Kayıt Olmadan Kullanım:</strong> Hemen başlayın, gereksiz kayıt süreçleri yok.</li>
            <li><strong>Görev Yönetimi:</strong> Her pomodoro'yu belirli bir projeye veya feature'a bağlayın.</li>
            <li><strong>Minimal Arayüz:</strong> Dikkat dağıtmayan, odaklanmaya yardımcı temiz tasarım.</li>
            <li><strong>İstatistik Takibi:</strong> Hangi saatlerde daha verimli olduğunuzu keşfedin.</li>
            <li><strong>Tamamen Ücretsiz:</strong> Premium abonelik yok, tüm özellikler dahil.</li>
        </ul>
        
        <h2>Programcılar İçin Pomodoro Tekniği Nasıl Kullanılır?</h2>
        <p>Programcılar için pomodoro tekniği şu şekilde optimize edilmiştir:</p>
        <ol>
            <li><strong>50 Dakika Deep Work:</strong> Tek bir feature veya bug fix'e odaklanın. Context switching yapmayın.</li>
            <li><strong>10 Dakika Kısa Mola:</strong> Gözlerinizi dinlendirin, kalkın, su için.</li>
            <li><strong>4 Pomodoro Sonrası 30 Dakika Uzun Mola:</strong> Daha uzun bir mola verin, yemek yiyin veya kısa bir yürüyüş yapın.</li>
        </ol>
        
        <h2>Programcılar İçin Pomodev'in Avantajları</h2>
        <ul>
            <li><strong>Flow State'e Giriş:</strong> Uzun kodlama seanslarında derin odaklanma sağlar.</li>
            <li><strong>Context Switching Önleme:</strong> Tek bir göreve odaklanarak verimliliği artırır.</li>
            <li><strong>Proje Takibi:</strong> Hangi projede ne kadar zaman harcadığınızı görün.</li>
            <li><strong>Verimlilik Analizi:</strong> En verimli çalışma saatlerinizi keşfedin.</li>
        </ul>
        
        <h2>Sonuç: Programcılar İçin En İyi Pomodoro Timer</h2>
        <p><strong>Pomodev</strong>, programcılar için en iyi pomodoro timer seçimidir. Deep work modu, özelleştirilebilir süreler ve görev yönetimi ile uzun kodlama seanslarında verimliliğinizi maksimize eder. Tamamen ücretsizdir ve kayıt olmadan kullanılabilir.</p>
        '''
    },
    'timer-for-adhd': {
        'title': 'ADHD İçin En İyi Pomodoro Timer 2024 - Gamification | Pomodev',
        'description': 'ADHD için pomodoro timer. Gamification ile odaklanmayı eğlenceli hale getirin. XP kazanma, seviye atlama ve anında ödül sistemi ile dikkat eksikliği olanlar için ideal.',
        'content': '''
        <p>ADHD (Dikkat Eksikliği Hiperaktivite Bozukluğu) olan bireyler için standart pomodoro timer'lar yeterince uyarıcı olmayabilir. Beyinler sürekli uyarıcı arayışındadır ve standart timer'lar sıkıcı gelebilir. <strong>Pomodev</strong>, gamification özellikleri ile bu sorunu çözer.</p>
        
        <h2>ADHD İçin Neden Pomodev?</h2>
        <ul>
            <li><strong>Gamification Sistemi:</strong> XP kazanma, seviye atlama ve liderlik tablosu ile anında ödül sistemi. Dopamin salınımını artırır.</li>
            <li><strong>Görsel Geri Bildirim:</strong> Her pomodoro tamamlandığında görsel ödüller ve ilerleme göstergeleri.</li>
            <li><strong>Streak Takibi:</strong> Ardışık günlerde çalışarak motivasyonu koruyun.</li>
            <li><strong>Özelleştirilebilir Süreler:</strong> Dikkat sürenize göre pomodoro süresini ayarlayın (15, 20, 25 veya 30 dakika).</li>
            <li><strong>Görev Yönetimi:</strong> Her pomodoro'yu belirli bir göreve bağlayın ve ilerlemenizi görün.</li>
            <li><strong>Minimal Dikkat Dağıtıcı:</strong> Temiz arayüz ile odaklanmanızı koruyun.</li>
            <li><strong>Tamamen Ücretsiz:</strong> Premium abonelik yok, tüm özellikler dahil.</li>
        </ul>
        
        <h2>ADHD İçin Pomodoro Tekniği Nasıl Kullanılır?</h2>
        <p>ADHD olan bireyler için pomodoro tekniği şu şekilde uyarlanabilir:</p>
        <ol>
            <li><strong>Kısa Pomodoro Süreleri:</strong> 15-20 dakika ile başlayın, zamanla artırın.</li>
            <li><strong>Daha Sık Molalar:</strong> Her pomodoro sonrası 5 dakika mola verin.</li>
            <li><strong>Gamification Kullanın:</strong> XP kazanma ve seviye atlama ile motivasyonu koruyun.</li>
            <li><strong>Görsel Geri Bildirim:</strong> İlerlemenizi görsel olarak takip edin.</li>
        </ol>
        
        <h2>ADHD İçin Pomodev'in Avantajları</h2>
        <ul>
            <li><strong>Anında Ödül:</strong> Her pomodoro tamamlandığında XP kazanın ve seviye atlayın.</li>
            <li><strong>Dopamin Salınımı:</strong> Gamification özellikleri ile doğal dopamin salınımını artırır.</li>
            <li><strong>Motivasyon Koruma:</strong> Streak takibi ve liderlik tablosu ile uzun vadeli motivasyon.</li>
            <li><strong>Esnek Kullanım:</strong> Dikkat sürenize göre özelleştirilebilir.</li>
        </ul>
        
        <h2>Sonuç: ADHD İçin En İyi Pomodoro Timer</h2>
        <p><strong>Pomodev</strong>, ADHD olan bireyler için en iyi pomodoro timer seçimidir. Gamification özellikleri ile odaklanmayı eğlenceli hale getirir ve anında ödül sistemi ile motivasyonu korur. Tamamen ücretsizdir ve kayıt olmadan kullanılabilir.</p>
        '''
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
    xml += '<url><loc>https://pomodev-omega.vercel.app/</loc><changefreq>daily</changefreq><priority>1.0</priority><lastmod>2024-01-15</lastmod></url>'
    
    # Static pages - high priority
    routes = [
        ('/blog', 'weekly', '0.9'),
        ('/blog/en-iyi-pomodoro-timer-uygulamalari-2024', 'weekly', '1.0'),
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
