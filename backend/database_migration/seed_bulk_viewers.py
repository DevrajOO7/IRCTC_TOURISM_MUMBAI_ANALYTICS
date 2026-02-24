import os
import sys
from werkzeug.security import generate_password_hash

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from db import db
from models import User

def seed_bulk_viewers():
    """
    Seeds a bulk list of viewers from the provided requirements.
    """
    viewers_list = [
        {"username": "subash", "password": "subash123", "email": "subash@gmail.com"},
        {"username": "sanjay", "password": "sanjay123", "email": "sanjay@gmail.com"},
        {"username": "navin", "password": "navin123", "email": "navin@gmail.com"},
        {"username": "annu", "password": "annu123", "email": "annu@gmail.com"},
        {"username": "amol", "password": "amol123", "email": "amol@gmail.com"},
        {"username": "sweta", "password": "sweta123", "email": "sweta@gmail.com"},
        {"username": "pallavis", "password": "pallavis123", "email": "pallavis@gmail.com"},
        {"username": "pallavij", "password": "pallavij123", "email": "pallavij@gmail.com"},
        {"username": "yogesh", "password": "yogesh123", "email": "yogesh@gmail.com"},
        {"username": "swathi", "password": "swathi123", "email": "swathi@gmail.com"},
        {"username": "abhinav", "password": "abhinav123", "email": "abhinav@gmail.com"},
        {"username": "nikhil", "password": "nikhil123", "email": "nikhil@gmail.com"},
        {"username": "vijay", "password": "vijay123", "email": "vijay@gmail.com"},
        {"username": "nitin", "password": "nitin123", "email": "nitin@gmail.com"},
        {"username": "sachin", "password": "sachin123", "email": "sachin@gmail.com"},
        {"username": "sushant", "password": "sushant123", "email": "sushant@gmail.com"},
        {"username": "jagannath", "password": "jagannath123", "email": "jagannath@gmail.com"},
        {"username": "mansi", "password": "mansi123", "email": "mansi@gmail.com"},
        {"username": "chhaya", "password": "chhaya123", "email": "chhaya@gmail.com"},
        {"username": "pammie", "password": "pammie123", "email": "pammie@gmail.com"},
        {"username": "rupali", "password": "rupali123", "email": "rupali@gmail.com"},
        {"username": "yayati", "password": "yayati123", "email": "yayati@gmail.com"},
        {"username": "nikita", "password": "nikita123", "email": "nikita@gmail.com"},
        {"username": "mangesh", "password": "mangesh123", "email": "mangesh@gmail.com"},
        {"username": "khushi", "password": "khushi123", "email": "khushi@gmail.com"},
        {"username": "vinayak", "password": "vinayak123", "email": "vinayak@gmail.com"},
        {"username": "vidula", "password": "vidula123", "email": "vidula@gmail.com"},
        {"username": "mrunmayee", "password": "mrunmayee123", "email": "mrunmayee@gmail.com"},
        {"username": "apurvashanti", "password": "apurvashanti123", "email": "apurvashanti@gmail.com"},
        {"username": "lokesh", "password": "lokesh123", "email": "lokesh@gmail.com"},
        {"username": "mallikarjun", "password": "mallikarjun123", "email": "mallikarjun@gmail.com"}
    ]

    app = create_app('development')
    
    with app.app_context():
        print(f"Starting bulk seed for {len(viewers_list)} viewers...")
        added = 0
        skipped = 0
        
        for v in viewers_list:
            # Check by email or username to avoid duplicates
            existing = User.query.filter((User.email == v['email']) | (User.username == v['username'])).first()
            
            if existing:
                print(f"User {v['username']} / {v['email']} already exists. Skipping.")
                skipped += 1
                continue

            user = User(
                username=v['username'],
                email=v['email'],
                password_hash=generate_password_hash(v['password']),
                role='viewer',
                is_active=True,
                is_email_verified=True
            )
            db.session.add(user)
            added += 1

        db.session.commit()
        print(f"Bulk seed complete. Added: {added}, Skipped: {skipped}")

if __name__ == "__main__":
    seed_bulk_viewers()
