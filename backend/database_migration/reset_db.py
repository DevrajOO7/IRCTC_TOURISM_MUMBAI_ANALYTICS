import os
import sys

# Add parent directory to path to import app and models
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from db import db

def reset_database():
    """
    Resets the database by dropping all tables and recreating them.
    WARNING: This will delete ALL data.
    """
    print("WARNING: This will DELETE ALL DATA in the database.")
    confirmation = input("Are you sure you want to proceed? (type 'yes' to confirm): ")
    
    if confirmation.lower() != 'yes':
        print("Operation cancelled.")
        return

    app = create_app('development')
    
    with app.app_context():
        print("Dropping all tables...")
        db.metadata.reflect(bind=db.engine)
        db.drop_all()
        print("Creating all tables...")
        db.create_all()
        print("Database reset successfully!")

if __name__ == "__main__":
    reset_database()
