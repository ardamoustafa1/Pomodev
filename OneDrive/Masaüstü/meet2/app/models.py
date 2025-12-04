from app import db
from datetime import datetime

class Meeting(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    meeting_id = db.Column(db.String(100), unique=True, nullable=False)
    name = db.Column(db.String(150), nullable=False)
    moderator_pw = db.Column(db.String(50), nullable=False)
    attendee_pw = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

    def __repr__(self):
        return f'<Meeting {self.name}>'