import os
import sys
from werkzeug.security import generate_password_hash

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from db import db
from models import User

def seed_admin():
    """
    Creates a default admin user.
    """
    app = create_app('development')
    
    with app.app_context():
        username = input("Enter admin username (default: admin): ") or 'admin'
        email = input("Enter admin email (default: admin@example.com): ") or 'admin@example.com'
        password = input("Enter admin password (default: admin123): ") or 'admin123'
        
        if User.query.filter_by(username=username).first():
            print("User already exists.")
            return

        user = User(
            username=username,
            email=email,
            password_hash=generate_password_hash(password),
            role='admin',
            is_active=True,
            is_email_verified=True
        )
        
        db.session.add(user)
        db.session.commit()
        print(f"Admin user '{username}' created successfully.")

if __name__ == "__main__":
    seed_admin()
