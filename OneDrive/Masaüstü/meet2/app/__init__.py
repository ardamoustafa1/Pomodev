from flask import Flask
from flask_sqlalchemy import SQLAlchemy

# DİKKAT: 'app.config' yerine '.config' yazıyoruz (Nokta koyduk)
from .config import Config

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)

    # Burayı da '.routes' olarak güncellemek daha sağlıklı olur
    from .routes import main
    app.register_blueprint(main)

    with app.app_context():
        db.create_all()

    return app