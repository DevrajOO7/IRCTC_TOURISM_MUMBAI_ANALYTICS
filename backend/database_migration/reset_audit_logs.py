import os
import sys
from sqlalchemy import text

# Add parent directory to path to import app and models
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from db import db
from models import AuditLog, UserSession
from utils.search import get_search_manager

def reset_audit_logs():
    """
    Resets the audit_logs table, user_sessions table, and Elasticsearch audit_logs index.
    """
    print("WARNING: This will DELETE ALL DATA in 'audit_logs' and 'user_sessions' tables.")
    print("It will also clear the 'audit_logs' index in Elasticsearch.")
    confirmation = input("Are you sure you want to proceed? (type 'yes' to confirm): ")
    
    if confirmation.lower() != 'yes':
        print("Operation cancelled.")
        return

    app = create_app('development')
    
    with app.app_context():
        # 1. Clear SQL Data
        print("Deleting SQL records...")
        try:
            # Delete all records from the AuditLog table
            num_audit = db.session.query(AuditLog).delete()
            # Delete all records from UserSession table
            num_sessions = db.session.query(UserSession).delete()
            
            db.session.commit()
            print(f"SQL: Deleted {num_audit} audit logs and {num_sessions} user sessions.")
        except Exception as e:
            db.session.rollback()
            print(f"Error resetting SQL data: {str(e)}")

        # 2. Clear Elasticsearch Data
        print("Clearing Elasticsearch index...")
        try:
            search_manager = get_search_manager()
            if search_manager and search_manager.client:
                # Delete the audit_logs index directly
                if search_manager.client.indices.exists(index="audit_logs"):
                    search_manager.client.indices.delete(index="audit_logs")
                    print("Elasticsearch: 'audit_logs' index deleted.")
                    
                    # Re-create it immediately so it's ready for new data
                    # (The connect/create_index method in search.py handles this, but we can trigger it)
                    search_manager.create_index()
                else:
                    print("Elasticsearch: 'audit_logs' index did not exist.")
            else:
                print("Elasticsearch: Manager not available or not connected.")
        except Exception as e:
            print(f"Error resetting Elasticsearch data: {str(e)}")

        print("\nAudit logs reset successfully!")

if __name__ == "__main__":
    reset_audit_logs()
