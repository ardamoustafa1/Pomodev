from flask import Flask, render_template, request, redirect, url_for, send_from_directory
import os
import sqlite3
import logging
import datetime
import json
from flask import g, jsonify
from werkzeug.security import generate_password_hash, check_password_hash

# Logging yapılandırması (early setup)
# Logging yapılandırması (early setup)
handlers = [logging.StreamHandler()]
# Only add FileHandler if we are locally developing (not on Vercel)
if not os.environ.get('VERCEL'):
    try:
        handlers.append(logging.FileHandler('pomodev.log'))
    except IOError:
        pass # Ignore if we can't write to file

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=handlers
)
logger = logging.getLogger(__name__)

# Optional imports with fallbacks
try:
    from flask_cors import CORS
    CORS_AVAILABLE = True
except ImportError:
    CORS_AVAILABLE = False
    logger.warning("flask-cors not installed. CORS support disabled. Install with: pip install flask-cors")

try:
    from flask_limiter import Limiter
    from flask_limiter.util import get_remote_address
    LIMITER_AVAILABLE = True
except ImportError:
    LIMITER_AVAILABLE = False
    logger.warning("flask-limiter not installed. Rate limiting disabled. Install with: pip install flask-limiter")

try:
    from flask_caching import Cache
    CACHE_AVAILABLE = True
except ImportError:
    CACHE_AVAILABLE = False
    logger.warning("flask-caching not installed. Caching disabled. Install with: pip install flask-caching")

# Vercel için path ayarları
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_DIR = os.path.join(BASE_DIR, 'templates')
STATIC_DIR = os.path.join(BASE_DIR, 'static')

# Environment variables
# Load from .env file if exists
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv not installed, use environment variables directly

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Database Configuration
# Priority:
# 1. DATABASE_URL env var (Production DB like Postgres)
# 2. Local file if writable (Local development)
# 3. /tmp/pomodev.db (Vercel/Serverless fallback - ephemeral)

DATABASE_URL = os.environ.get('DATABASE_URL')

# Database Configuration Refined
DATABASE_URL = os.environ.get('DATABASE_URL')

if DATABASE_URL:
    DATABASE = DATABASE_URL
    if DATABASE.startswith('sqlite:///'):
        DATABASE = DATABASE.replace('sqlite:///', '')
else:
    # Check if we are on Vercel (or generally read-only filesystem)
    # Using /tmp as fallback for serverless environments where root is read-only
    # We rely on VERCEL env var or if we are in a lambda environment
    if os.environ.get('VERCEL') or os.environ.get('AWS_LAMBDA_FUNCTION_NAME'):
        DATABASE = '/tmp/pomodev.db'
    else:
        DATABASE = os.path.join(BASE_DIR, 'pomodev.db')

print(f"DEBUG: Using database at {DATABASE}") # Stdout log for Vercel

SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'
TOKEN_EXPIRY_DAYS = int(os.environ.get('TOKEN_EXPIRY_DAYS', '30'))

app = Flask(__name__, 
            template_folder=TEMPLATE_DIR,
            static_folder=STATIC_DIR)
app.config['SECRET_KEY'] = SECRET_KEY

# ... (rest of code)

# ...

# Initialize DB on start with Error Handling
try:
    init_db()
except Exception as e:
    # Log error but allow app to start so we can see the logs
    print(f"CRITICAL ERROR: Failed to initialize database: {e}")
    # We might want to set a flag to show a maintenance page or error
    app.config['DB_ERROR'] = str(e)

import uuid

# ===== Helper Functions =====
def get_auth_token():
    """Extract auth token from request"""
    token = request.headers.get('Authorization')
    if token and token.startswith('Bearer '):
        token = token[7:].strip()
    if not token:
        token = request.args.get('token')
    if not token:
        data = request.get_json(silent=True)
        if data:
            token = data.get('token')
    return token

def validate_token(token):
    """Validate token and check expiry"""
    if not token:
        return None, "No token provided"
    
    db = get_db()
    user = db.execute(
        'SELECT id, username, level, xp, inventory, stats, settings, tasks, token_expiry FROM users WHERE auth_token = ?',
        (token,)
    ).fetchone()
    
    if not user:
        return None, "Invalid token"
    
    # Check token expiry
    if user['token_expiry']:
        expiry = datetime.datetime.fromisoformat(user['token_expiry'])
        if datetime.datetime.now() > expiry:
            logger.warning(f"Expired token used: {user['username']}")
            return None, "Token expired"
    
    return user, None

def generate_token_expiry():
    """Generate token expiry datetime"""
    return datetime.datetime.now() + datetime.timedelta(days=TOKEN_EXPIRY_DAYS)

# ... existing code ...

# ... (Tasks API) ...


# ===== BRAIN DUMP API =====

@app.route('/api/notes', methods=['GET'])
@limiter.limit("100 per hour")
def get_notes():
    try:
        token = get_auth_token()
        user, error = validate_token(token)
        if error:
            return error_response(error, 401 if "No token" in error else 403)
        
        db = get_db()
        notes = db.execute('SELECT * FROM notes WHERE user_id = ? ORDER BY created_at DESC', (user['id'],)).fetchall()
        notes_data = [{'id': r['id'], 'content': r['content']} for r in notes]
        logger.info(f"User {user['username']} retrieved {len(notes_data)} notes")
        return success_response(notes_data, "Notes retrieved successfully")
    except Exception as e:
        logger.error(f"Error in get_notes: {str(e)}", exc_info=True)
        return error_response("Failed to retrieve notes", 500)

@app.route('/api/notes', methods=['POST'])
@limiter.limit("50 per hour")
def create_note():
    try:
        data = request.get_json()
        token = get_auth_token()
        content = data.get('content') if data else None
        
        if not content:
            return error_response("Content is required", 400)
        
        user, error = validate_token(token)
        if error:
            return error_response(error, 401 if "No token" in error else 403)
        
        db = get_db()
        cursor = db.execute('INSERT INTO notes (user_id, content) VALUES (?, ?)', (user['id'], content))
        db.commit()
        logger.info(f"User {user['username']} created note {cursor.lastrowid}")
        return success_response({'id': cursor.lastrowid, 'content': content}, "Note created successfully", 201)
    except Exception as e:
        logger.error(f"Error in create_note: {str(e)}", exc_info=True)
        return error_response("Failed to create note", 500)

@app.route('/api/notes/<int:note_id>', methods=['DELETE'])
@limiter.limit("50 per hour")
def delete_note(note_id):
    try:
        token = get_auth_token()
        user, error = validate_token(token)
        if error:
            return error_response(error, 401 if "No token" in error else 403)
        
        db = get_db()
        result = db.execute('DELETE FROM notes WHERE id = ? AND user_id = ?', (note_id, user['id']))
        db.commit()
        
        if result.rowcount == 0:
            return error_response("Note not found", 404)
        
        logger.info(f"User {user['username']} deleted note {note_id}")
        return success_response(None, "Note deleted successfully")
    except Exception as e:
        logger.error(f"Error in delete_note: {str(e)}", exc_info=True)
        return error_response("Failed to delete note", 500)

@app.route('/api/tasks', methods=['GET'])
@limiter.limit("100 per hour")
def get_tasks():
    try:
        token = get_auth_token()
        user, error = validate_token(token)
        if error:
            return error_response(error, 401 if "No token" in error else 403)
        
        db = get_db()
        tasks = db.execute('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC', (user['id'],)).fetchall()
        tasks_data = [{
            'id': row['id'],
            'text': row['text'],
            'completed': bool(row['is_completed']),
            'project': row['project']
        } for row in tasks]
        logger.info(f"User {user['username']} retrieved {len(tasks_data)} tasks")
        return success_response(tasks_data, "Tasks retrieved successfully")
    except Exception as e:
        logger.error(f"Error in get_tasks: {str(e)}", exc_info=True)
        return error_response("Failed to retrieve tasks", 500)

@app.route('/api/tasks', methods=['POST'])
@limiter.limit("50 per hour")
def create_task():
    try:
        data = request.get_json()
        token = get_auth_token()
        text = data.get('text') if data else None
        project = data.get('project', 'General') if data else 'General'
        
        if not text:
            return error_response("Text is required", 400)
        
        user, error = validate_token(token)
        if error:
            return error_response(error, 401 if "No token" in error else 403)
        
        db = get_db()
        cursor = db.execute('INSERT INTO tasks (user_id, text, project) VALUES (?, ?, ?)', (user['id'], text, project))
        db.commit()
        logger.info(f"User {user['username']} created task {cursor.lastrowid}")
        return success_response({
            'id': cursor.lastrowid,
            'text': text,
            'project': project,
            'completed': False
        }, "Task created successfully", 201)
    except Exception as e:
        logger.error(f"Error in create_task: {str(e)}", exc_info=True)
        return error_response("Failed to create task", 500)

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
@limiter.limit("100 per hour")
def update_task(task_id):
    try:
        data = request.get_json()
        token = get_auth_token()
        
        user, error = validate_token(token)
        if error:
            return error_response(error, 401 if "No token" in error else 403)
        
        db = get_db()
        task = db.execute('SELECT id FROM tasks WHERE id = ? AND user_id = ?', (task_id, user['id'])).fetchone()
        if not task:
            return error_response("Task not found", 404)

        updates = []
        if 'completed' in data:

            db.execute('UPDATE tasks SET is_completed = ? WHERE id = ?', (data['completed'], task_id))
            updates.append('completed')
        if 'text' in data:
            db.execute('UPDATE tasks SET text = ? WHERE id = ?', (data['text'], task_id))
            updates.append('text')
        if 'project' in data:
            db.execute('UPDATE tasks SET project = ? WHERE id = ?', (data['project'], task_id))
            updates.append('project')
        
        db.commit()
        logger.info(f"User {user['username']} updated task {task_id}: {', '.join(updates)}")
        return success_response(None, "Task updated successfully")
    except Exception as e:
        logger.error(f"Error in update_task: {str(e)}", exc_info=True)
        return error_response("Failed to update task", 500)

# ===== INTEGRATIONS (TODOIST) =====

@app.route('/api/integrations/todoist/import', methods=['POST'])
@limiter.limit("20 per hour")
def import_todoist_tasks():
    """Import tasks from Todoist"""
    try:
        data = request.get_json()
        todoist_token = data.get('todoistToken')
        
        if not todoist_token:
            return error_response("Todoist token is required", 400)
            
        token = get_auth_token()
        user, error = validate_token(token)
        if error:
            return error_response(error, 401)

        # Fetch from Todoist API
        try:
            import requests
            headers = {"Authorization": f"Bearer {todoist_token}"}
            # Fetch active tasks
            response = requests.get("https://api.todoist.com/rest/v2/tasks", headers=headers, params={"filter": "today|overdue"})
            
            if response.status_code != 200:
                return error_response("Failed to connect to Todoist. Check your token.", 400)
                
            tasks = response.json()
            
            # Save to local DB
            db = get_db()
            imported_count = 0
            
            for t in tasks:
                content = t.get('content', '')
                if not content: continue
                
                # Check duplicate (simple check by text for today)
                exists = db.execute('''
                    SELECT id FROM tasks 
                    WHERE user_id = ? AND text = ? AND is_completed = 0
                ''', (user['id'], content)).fetchone()
                
                if not exists:
                    db.execute('INSERT INTO tasks (user_id, text, project) VALUES (?, ?, ?)', 
                              (user['id'], content, 'Todoist'))
                    imported_count += 1
            
            db.commit()
            
            return success_response({
                "count": imported_count,
                "message": f"Successfully imported {imported_count} tasks from Todoist"
            }, "Import successful")
            
        except ImportError:
            return error_response("Requests library missing on server", 500)
        except Exception as e:
            logger.error(f"Todoist API Error: {str(e)}")
            return error_response("Error communicating with Todoist", 502)

    except Exception as e:
        logger.error(f"Error in import_todoist_tasks: {str(e)}", exc_info=True)
        return error_response("Internal Server Error", 500)

# ===== AI TASK BREAKDOWN =====

@app.route('/api/ai/breakdown-task', methods=['POST'])
@limiter.limit("10 per hour")
def ai_breakdown_task():
    """Break down a task into subtasks using 'AI' (Mock or Real)"""
    try:
        data = request.get_json()
        task_text = data.get('text')
        
        if not task_text:
            return error_response("Task text is required", 400)
            
        # Simulating AI Processing delay
        import time
        import random
        time.sleep(1.5) 
        
        # --- MOCK AI LOGIC (Rule Based) ---
        # In a real app, you would call OpenAI/Gemini API here
        # api_key = os.environ.get('OPENAI_API_KEY')
        
        subtasks = []
        lower_text = task_text.lower()
        
        if "python" in lower_text or "kod" in lower_text or "app" in lower_text:
            subtasks = [
                f"Research requirements for {task_text}",
                "Setup development environment",
                "Draft initial code structure",
                "Write core functions",
                "Debug and test",
                "Refactor and optimize"
            ]
        elif "spor" in lower_text or "egzersiz" in lower_text:
            subtasks = [
                "Isınma hareketleri (5 dk)",
                "Ana antrenman seti 1",
                "Ana antrenman seti 2",
                "Soğuma ve esneme"
            ]
        elif "ders" in lower_text or "çalış" in lower_text or "okul" in lower_text:
            subtasks = [
                "Materyalleri hazırla",
                "Konu özetini oku (25 dk)",
                "Pratik test çöz (25 dk)",
                "Hataları analiz et"
            ]
        elif "temiz" in lower_text:
            subtasks = [
                "Dağınıklığı topla",
                "Yüzeyleri sil",
                "Süpür ve paspasla",
                "Çöpleri at"
            ]
        else:
            # Generic breakdown
            subtasks = [
                f"Plan: {task_text} için hazırlık yap",
                "İlk 25 dakika: Giriş ve araştırma",
                "İkinci 25 dakika: Ana işe odaklan",
                "Son kontrol ve bitiriş"
            ]
            
        return success_response({
            "subtasks": subtasks,
            "message": "AI logic generated subtasks"
        }, "Success")

    except Exception as e:
        logger.error(f"Error in ai_breakdown_task: {str(e)}", exc_info=True)
        return error_response("AI Processing Failed", 500)
            


@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
@limiter.limit("50 per hour")
def delete_task(task_id):
    try:
        token = get_auth_token()
        user, error = validate_token(token)
        if error:
            return error_response(error, 401 if "No token" in error else 403)

        db = get_db()
        result = db.execute('DELETE FROM tasks WHERE id = ? AND user_id = ?', (task_id, user['id']))
        db.commit()
        
        if result.rowcount == 0:
            return error_response("Task not found", 404)
        
        logger.info(f"User {user['username']} deleted task {task_id}")
        return success_response(None, "Task deleted successfully")
    except Exception as e:
        logger.error(f"Error in delete_task: {str(e)}", exc_info=True)
        return error_response("Failed to delete task", 500)

@app.route('/api/register', methods=['POST'])
@limiter.limit("5 per minute")
def register():
    try:
        data = request.get_json()
        if not data:
            return error_response("No data provided", 400)
        
        raw_username = data.get('username')
        raw_password = data.get('password')

        # Validate username with strict rules
        valid, result = validate_username(raw_username)
        if not valid:
            return error_response(result, 400)
        username = result
        
        # Validate password strength
        valid, result = validate_password(raw_password)
        if not valid:
            return error_response(result, 400)
        password = result

        db = get_db()
        
        # Check if username already exists (case-insensitive)
        existing = db.execute('SELECT id FROM users WHERE LOWER(username) = LOWER(?)', (username,)).fetchone()
        if existing:
            return error_response("Username already taken", 409)
        
        try:
            hashed_pw = generate_password_hash(password)
            token = str(uuid.uuid4())
            token_expiry = generate_token_expiry()
            cur = db.execute(
                'INSERT INTO users (username, password, auth_token, token_expiry) VALUES (?, ?, ?, ?)',
                (username, hashed_pw, token, token_expiry.isoformat())
            )
            user_id = cur.lastrowid
            db.commit()
            row = db.execute('SELECT id, username, level, xp, inventory, stats, settings, tasks FROM users WHERE id = ?', (user_id,)).fetchone()
            logger.info(f"New user registered: {username}")
            def _get(r, k, default=None):
                try:
                    return r[k] if r is not None else default
                except (KeyError, TypeError):
                    return default
            user_data = {
                'id': _get(row, 'id'),
                'username': _get(row, 'username') or username,
                'level': _get(row, 'level', 1),
                'xp': _get(row, 'xp', 0),
                'inventory': _get(row, 'inventory') or '[]',
                'stats': _get(row, 'stats') or '{}',
                'settings': _get(row, 'settings') or '{}',
                'tasks': _get(row, 'tasks') or '[]'
            }
            return success_response({
                'token': token,
                'token_expiry': token_expiry.isoformat(),
                'user': user_data
            }, "User created successfully", 201)
        except sqlite3.IntegrityError:
            logger.warning(f"Registration attempt with existing username: {username}")
            return error_response("Username already exists", 409)
    except Exception as e:
        logger.error(f"Error in register: {str(e)}", exc_info=True)
        return error_response("Failed to register user", 500)

@app.route('/api/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    try:
        data = request.get_json()
        username = data.get('username') if data else None
        password = data.get('password') if data else None

        if not username or not password:
            return error_response("Username and password required", 400)

        db = get_db()
        user = db.execute('SELECT * FROM users WHERE LOWER(username) = LOWER(?)', (username.strip(),)).fetchone()

        if user and check_password_hash(user['password'], password):
            # Generate new token on login with expiry
            token = str(uuid.uuid4())
            token_expiry = generate_token_expiry()
            db.execute(
                'UPDATE users SET auth_token = ?, token_expiry = ? WHERE id = ?',
                (token, token_expiry.isoformat(), user['id'])
            )
            db.commit()
            
            logger.info(f"User logged in: {username}")
            return success_response({
                'token': token,
                'token_expiry': token_expiry.isoformat(),
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
            }, "Login successful")
        
        logger.warning(f"Failed login attempt for username: {username}")
        return error_response("Invalid credentials", 401)
    except Exception as e:
        logger.error(f"Error in login: {str(e)}", exc_info=True)
        return error_response("Failed to login", 500)

@app.route('/api/sync_session', methods=['POST'])
@limiter.limit("100 per hour")
def sync_session():
    """Save a completed Pomodoro session for analytics"""
    try:
        data = request.get_json()
        token = get_auth_token()
        mode = data.get('mode') if data else None  # pomodoro, short, long
        duration = data.get('duration') if data else None  # seconds
        
        if not mode or not duration:
            return error_response("Mode and duration are required", 400)
        
        user, error = validate_token(token)
        if error:
            return error_response(error, 401 if "No token" in error else 403)

        db = get_db()
        db.execute('''
            INSERT INTO sessions (user_id, mode, duration, completed_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ''', (user['id'], mode, duration))
        db.commit()
        
        logger.info(f"User {user['username']} synced session: {mode} ({duration}s)")
        return success_response(None, "Session synced successfully")
    except Exception as e:
        logger.error(f"Error in sync_session: {str(e)}", exc_info=True)
        return error_response("Failed to sync session", 500)

@app.route('/api/analytics', methods=['POST'])
@limiter.limit("50 per hour")
def get_analytics():
    try:
        token = get_auth_token()
        user, error = validate_token(token)
        if error:
            return error_response(error, 401 if "No token" in error else 403)

        db = get_db()
        
        # 1. Total Focus Time (hours)
        total_duration = db.execute(
            'SELECT SUM(duration) as total FROM sessions WHERE user_id = ? AND mode = "pomodoro"',
            (user['id'],)
        ).fetchone()['total'] or 0
        total_focus_hours = round(total_duration / 3600, 1)

        # 2. Last 7 Days Activity (Daily Pomodoro Counts)
        weekly_activity = db.execute('''
            SELECT date(completed_at) as day, COUNT(*) as count 
            FROM sessions 
            WHERE user_id = ? AND mode = "pomodoro" AND completed_at >= date('now', '-7 days')
            GROUP BY day
            ORDER BY day
        ''', (user['id'],)).fetchall()
        
        activity_data = {row['day']: row['count'] for row in weekly_activity}

        # 3. Mode Distribution
        distribution = db.execute('''
            SELECT mode, COUNT(*) as count 
            FROM sessions 
            WHERE user_id = ? 
            GROUP BY mode
        ''', (user['id'],)).fetchall()
        
        dist_data = {row['mode']: row['count'] for row in distribution}

        analytics_data = {
            'total_focus_hours': total_focus_hours,
            'weekly_activity': activity_data,
            'mode_distribution': dist_data
        }
        
        logger.info(f"User {user['username']} retrieved analytics")
        return success_response(analytics_data, "Analytics retrieved successfully")
    except Exception as e:
        logger.error(f"Error in get_analytics: {str(e)}", exc_info=True)
        return error_response("Failed to retrieve analytics", 500)

@app.route('/api/save_user_data', methods=['POST'])
@limiter.limit("100 per hour")
def save_user_data():
    """Save ALL user data (inventory, stats, settings, tasks)"""
    # Whitelist of allowed fields to update - prevents SQL injection
    ALLOWED_FIELDS = {'xp', 'level', 'inventory', 'stats', 'settings', 'tasks'}
    
    try:
        data = request.get_json()
        if not data:
            return error_response("No data provided", 400)
            
        token = get_auth_token()
        
        user, error = validate_token(token)
        if error:
            return error_response(error, 401 if "No token" in error else 403)
        
        db = get_db()
        
        # Build update query using only whitelisted fields
        update_fields = []
        params = []
        
        for field in ALLOWED_FIELDS:
            if field in data:
                # Validate data types
                value = data[field]
                if field in ('xp', 'level'):
                    # Ensure numeric fields are integers
                    try:
                        value = int(value)
                    except (ValueError, TypeError):
                        continue
                elif field in ('inventory', 'stats', 'settings', 'tasks'):
                    # Ensure JSON fields are strings
                    if not isinstance(value, str):
                        try:
                            value = json.dumps(value)
                        except (TypeError, ValueError):
                            continue
                
                update_fields.append(f'{field} = ?')
                params.append(value)
        
        if update_fields:
            params.append(user['id'])
            # Safe query - field names come from whitelist, values are parameterized
            query = "UPDATE users SET " + ", ".join(update_fields) + " WHERE id = ?"
            db.execute(query, params)
            db.commit()
            logger.info(f"User {user['username']} saved user data: {list(data.keys())}")
            return success_response(None, "User data saved successfully")
        else:
            return error_response("No valid data provided to update", 400)
    except Exception as e:
        logger.error(f"Error in save_user_data: {str(e)}", exc_info=True)
        return error_response("Failed to save user data", 500)

@app.route('/api/export/data', methods=['GET'])
@limiter.limit("50 per hour")
def export_user_data():
    """Export all user data as JSON"""
    try:
        token = get_auth_token()
        user, error = validate_token(token)
        if error:
            return error_response(error, 401 if "No token" in error else 403)

        db = get_db()
        
        # Get all user data
        user_data = {
            'version': '1.0',
            'exportDate': datetime.datetime.now().isoformat(),
            'user': {
                'id': user['id'],
                'username': user['username'],
                'level': user['level'],
                'xp': user['xp']
            },
            'tasks': [],
            'notes': [],
            'sessions': []
        }
        
        # Get tasks
        tasks = db.execute('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC', (user['id'],)).fetchall()
        user_data['tasks'] = [{
            'id': row['id'],
            'text': row['text'],
            'completed': bool(row['is_completed']),
            'project': row['project'],
            'created_at': row['created_at']
        } for row in tasks]
        
        # Get notes
        notes = db.execute('SELECT * FROM notes WHERE user_id = ? ORDER BY created_at DESC', (user['id'],)).fetchall()
        user_data['notes'] = [{
            'id': row['id'],
            'content': row['content'],
            'created_at': row['created_at']
        } for row in notes]
        
        # Get sessions
        sessions = db.execute('SELECT * FROM sessions WHERE user_id = ? ORDER BY completed_at DESC', (user['id'],)).fetchall()
        user_data['sessions'] = [{
            'id': row['id'],
            'mode': row['mode'],
            'duration': row['duration'],
            'completed_at': row['completed_at'],
            'project': row['project']
        } for row in sessions]
        
        # Get stats and settings
        user_data['inventory'] = json.loads(user['inventory'] or '[]')
        user_data['stats'] = json.loads(user['stats'] or '{}')
        user_data['settings'] = json.loads(user['settings'] or '{}')
        
        logger.info(f"User {user['username']} exported data")
        return jsonify(user_data), 200
        
    except Exception as e:
        logger.error(f"Error in export_user_data: {str(e)}", exc_info=True)
        return error_response("Failed to export data", 500)

@app.route('/api/leaderboard', methods=['GET'])
@limiter.limit("100 per hour")
@cache.cached(timeout=300, key_prefix='leaderboard')
def get_leaderboard():
    try:
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
        logger.info("Leaderboard retrieved")
        return success_response(leaderboard_data, "Leaderboard retrieved successfully")
    except Exception as e:
        logger.error(f"Error in get_leaderboard: {str(e)}", exc_info=True)
        return error_response("Failed to retrieve leaderboard", 500)
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

@app.route('/robots.txt')
def robots_txt():
    return send_from_directory(BASE_DIR, 'robots.txt', mimetype='text/plain')

@app.route('/google86d7f55421be2d0f.html')
def google_verification():
    return send_from_directory(BASE_DIR, 'google86d7f55421be2d0f.html', mimetype='text/html')

@app.route('/favicon.ico')
def favicon():
    favicon_ico = os.path.join(STATIC_DIR, 'favicon.ico')
    if os.path.exists(favicon_ico):
        return send_from_directory(STATIC_DIR, 'favicon.ico')
    return send_from_directory(STATIC_DIR, 'favicon.svg')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
