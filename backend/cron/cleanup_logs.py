
from app import create_app, db
from models import AuditLog, UserSession
from datetime import datetime, timedelta

def cleanup_old_logs(days=90):
    """Delete logs older than X days"""
    app = create_app()
    with app.app_context():
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        try:
            # Delete old audit logs
            deleted_logs = AuditLog.query.filter(AuditLog.timestamp < cutoff_date).delete()
            
            # Delete old sessions (keep slightly longer? No, same)
            deleted_sessions = UserSession.query.filter(UserSession.last_active_at < cutoff_date).delete()
            
            db.session.commit()
            print(f"Cleanup Complete: Deleted {deleted_logs} logs and {deleted_sessions} sessions older than {days} days.")
            
        except Exception as e:
            print(f"Cleanup Failed: {e}")
            db.session.rollback()

if __name__ == "__main__":
    cleanup_old_logs()
