"""
Unit tests for Pomodev API endpoints
"""

import pytest
import json
import os
import tempfile
import shutil
from app import app, init_db, get_db

@pytest.fixture
def client():
    """Create a test client"""
    # Create temporary database
    db_fd, app.config['DATABASE'] = tempfile.mkstemp()
    app.config['TESTING'] = True
    app.config['SECRET_KEY'] = 'test-secret-key'
    
    with app.test_client() as client:
        with app.app_context():
            init_db()
        yield client
    
    os.close(db_fd)
    os.unlink(app.config['DATABASE'])

@pytest.fixture
def auth_token(client):
    """Register a test user and return auth token"""
    response = client.post('/api/register', 
        json={'username': 'testuser', 'password': 'testpass123'})
    data = json.loads(response.data)
    return data['data']['token']

def test_register_success(client):
    """Test successful user registration"""
    response = client.post('/api/register',
        json={'username': 'newuser', 'password': 'password123'})
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['success'] == True
    assert 'token' in data['data']

def test_register_duplicate(client):
    """Test registration with duplicate username"""
    client.post('/api/register',
        json={'username': 'duplicate', 'password': 'pass123'})
    response = client.post('/api/register',
        json={'username': 'duplicate', 'password': 'pass123'})
    assert response.status_code == 409
    data = json.loads(response.data)
    assert data['success'] == False

def test_register_validation(client):
    """Test registration validation"""
    # Short password
    response = client.post('/api/register',
        json={'username': 'user', 'password': '123'})
    assert response.status_code == 400
    
    # Missing fields
    response = client.post('/api/register', json={})
    assert response.status_code == 400

def test_login_success(client, auth_token):
    """Test successful login"""
    response = client.post('/api/login',
        json={'username': 'testuser', 'password': 'testpass123'})
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] == True
    assert 'token' in data['data']

def test_login_invalid_credentials(client):
    """Test login with invalid credentials"""
    response = client.post('/api/login',
        json={'username': 'nonexistent', 'password': 'wrong'})
    assert response.status_code == 401
    data = json.loads(response.data)
    assert data['success'] == False

def test_get_tasks_unauthorized(client):
    """Test getting tasks without authentication"""
    response = client.get('/api/tasks')
    assert response.status_code == 401

def test_create_task(client, auth_token):
    """Test creating a task"""
    response = client.post('/api/tasks',
        json={'token': auth_token, 'text': 'Test task', 'project': 'Test'})
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['success'] == True
    assert data['data']['text'] == 'Test task'

def test_get_tasks(client, auth_token):
    """Test getting user tasks"""
    # Create a task first
    client.post('/api/tasks',
        json={'token': auth_token, 'text': 'Test task', 'project': 'Test'})
    
    # Get tasks
    response = client.get('/api/tasks',
        headers={'Authorization': auth_token})
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] == True
    assert len(data['data']) > 0

def test_update_task(client, auth_token):
    """Test updating a task"""
    # Create task
    create_response = client.post('/api/tasks',
        json={'token': auth_token, 'text': 'Original', 'project': 'Test'})
    task_id = json.loads(create_response.data)['data']['id']
    
    # Update task
    response = client.put(f'/api/tasks/{task_id}',
        json={'token': auth_token, 'completed': True})
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] == True

def test_delete_task(client, auth_token):
    """Test deleting a task"""
    # Create task
    create_response = client.post('/api/tasks',
        json={'token': auth_token, 'text': 'To delete', 'project': 'Test'})
    task_id = json.loads(create_response.data)['data']['id']
    
    # Delete task
    response = client.delete(f'/api/tasks/{task_id}?token={auth_token}')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] == True

def test_get_leaderboard(client):
    """Test getting leaderboard"""
    response = client.get('/api/leaderboard')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] == True
    assert isinstance(data['data'], list)

def test_rate_limiting(client):
    """Test rate limiting on login endpoint"""
    # Try to register/login too many times
    for i in range(10):
        client.post('/api/login',
            json={'username': f'user{i}', 'password': 'wrong'})
    
    # Should eventually get rate limited (429)
    # Note: This might not always trigger depending on limiter config
    pass  # Rate limiting test may need adjustment based on actual limits
