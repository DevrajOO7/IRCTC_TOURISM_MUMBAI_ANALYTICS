import os
import sys
from werkzeug.security import generate_password_hash

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from db import db
from models import User

def seed_users():
    """
    Seeds the database with default production users (defined in LoginPage.js).
    """
    print("Initializing app context...")
    # Use 'production' config to ensure we don't accidentally use dev settings
    # But rely on DATABASE_URL from environment
    app = create_app('production')
    
    with app.app_context():
        print(f"Connecting to database: {app.config['SQLALCHEMY_DATABASE_URI'].split('@')[-1]}") # Log host only for safety
        
        users_to_create = [
            {
                'username': 'user-public',
                'email': 'admin@irctctourism.com',
                'password': 'pass-Admin123',
                'role': 'admin'
            },
            {
                'username': 'manager',
                'email': 'manager@irctctourism.com',
                'password': 'manager',
                'role': 'manager'
            },
            {
                'username': 'viewer',
                'email': 'viewer@irctctourism.com',
                'password': 'viewer',
                'role': 'viewer'
            }
        ]
        
        created_count = 0
        for user_data in users_to_create:
            if User.query.filter_by(username=user_data['username']).first():
                print(f"User '{user_data['username']}' already exists. Skipping.")
                continue
                
            user = User(
                username=user_data['username'],
                email=user_data['email'],
                password_hash=generate_password_hash(user_data['password']),
                role=user_data['role'],
                is_active=True,
                is_email_verified=True
            )
            db.session.add(user)
            created_count += 1
            print(f"Created user: {user_data['username']} ({user_data['role']})")
            
        if created_count > 0:
            try:
                db.session.commit()
                print(f"Successfully seeded {created_count} users.")
            except Exception as e:
                db.session.rollback()
                print(f"Error saving changes: {e}")
        else:
            print("No new users created.")

if __name__ == "__main__":
    if not os.getenv('DATABASE_URL'):
        print("Error: DATABASE_URL environment variable is not set.")
        print("Please set it to your Supabase connection string before running this script.")
        print("Example (Windows): set DATABASE_URL=postgresql://... && python backend/database_migration/seed_production_users.py")
        sys.exit(1)
        
    seed_users()
