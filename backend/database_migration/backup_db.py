import os
import sys
import json
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from models import Passenger, User, Nominee, Permission, AuditLog, UserSession

def backup_database():
    """
    Backs up the database to a JSON file.
    """
    app = create_app('development')
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_file = f"backup_{timestamp}.json"
    
    with app.app_context():
        print("Starting backup...")
        
        data = {
            'passengers': [p.to_dict() for p in Passenger.query.all()],
            'nominees': [n.to_dict() for n in Nominee.query.all()],
            'permissions': [p.to_dict() for p in Permission.query.all()],
            'audit_logs': [a.to_dict() for a in AuditLog.query.all()],
            'user_sessions': [s.to_dict() for s in UserSession.query.all()],
            'users': [{
                'id': str(u.id),
                'username': u.username,
                'email': u.email,
                'password_hash': u.password_hash,
                'role': u.role,
                'is_active': u.is_active,
                'is_email_verified': u.is_email_verified,
                'email_verification_token': u.email_verification_token,
                'password_reset_token': u.password_reset_token,
                'password_reset_expires': u.password_reset_expires.isoformat() if u.password_reset_expires else None,
                'last_login': u.last_login.isoformat() if u.last_login else None,
                'failed_login_attempts': u.failed_login_attempts,
                'locked_until': u.locked_until.isoformat() if u.locked_until else None,
                'created_at': u.created_at.isoformat(),
                'updated_at': u.updated_at.isoformat()
            } for u in User.query.all()]
        }
        
        with open(backup_file, 'w') as f:
            json.dump(data, f, indent=4)
            
        print(f"Backup saved to {backup_file}")
        print(f"Total Passengers: {len(data['passengers'])}")
        print(f"Total Nominees: {len(data['nominees'])}")
        print(f"Total Permissions: {len(data['permissions'])}")
        print(f"Total Audit Logs: {len(data['audit_logs'])}")
        print(f"Total User Sessions: {len(data['user_sessions'])}")
        print(f"Total Users: {len(data['users'])}")

if __name__ == "__main__":
    backup_database()
