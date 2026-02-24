import os
import sys
from werkzeug.security import generate_password_hash

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from app import create_app
from db import db
from models import User

def init_users():
    print("--- Initializing Demo Users ---")
    
    app = create_app('development')
    
    with app.app_context():
        try:
            # Ensure tables exist
            db.create_all()
            
            users = [
                {'username': 'user1', 'password': 'user@123', 'role': 'admin', 'email': 'user1@example.com'},
                {'username': 'manager1', 'password': 'manager@123', 'role': 'manager', 'email': 'manager1@example.com'},
                {'username': 'viewer1', 'password': 'viewer@123', 'role': 'viewer', 'email': 'viewer1@example.com'}
            ]
            
            for u_data in users:
                user = User.query.filter_by(username=u_data['username']).first()
                if not user:
                    print(f"Creating user: {u_data['username']}")
                    new_user = User(
                        username=u_data['username'],
                        email=u_data['email'],
                        role=u_data['role']
                    )
                    new_user.password_hash = generate_password_hash(u_data['password'])
                    db.session.add(new_user)
                else:
                    print(f"User already exists: {u_data['username']}")

            db.session.commit()
            print("SUCCESS: Demo users created/verified.")
            print("You can now log in with the credentials shown on the login page.")

        except Exception as e:
            print("\n❌ DATABASE ERROR!")
            print(f"Details: {e}")
            print("\nSUGGESTION:")
            if "password authentication failed" in str(e):
                print(">>> Your database password in 'backend/.env' is INCORRECT.")
                print(">>> Please update DATABASE_URL with the correct password.")
            else:
                print(">>> Ensure your DATABASE_URL is correct and the database is accessible.")
            db.session.rollback()

if __name__ == '__main__':
    init_users()
