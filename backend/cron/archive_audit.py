import csv
import os
import sys

# Add backend directory to path so we can import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from models import AuditLog
from datetime import datetime, timedelta

def archive_audit_logs(days=365):
    """Archive logs older than X days to CSV and delete from DB"""
    app = create_app()
    with app.app_context():
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        try:
            # Query old logs
            logs = AuditLog.query.filter(AuditLog.timestamp < cutoff_date).all()
            
            if not logs:
                print(f"No logs older than {days} days to archive.")
                return

            # Ensure backups directory exists
            backup_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backups')
            os.makedirs(backup_dir, exist_ok=True)
            
            # Generate filename
            filename = f"audit_archive_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            filepath = os.path.join(backup_dir, filename)
            
            # Write key data to CSV
            with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.writer(csvfile)
                writer.writerow(['ID', 'Timestamp', 'User ID', 'Action', 'Resource', 'Attributes', 'IP', 'Details'])
                
                for log in logs:
                    writer.writerow([
                        str(log.id),
                        log.timestamp.isoformat(),
                        str(log.user_id) if log.user_id else 'System',
                        log.action,
                        f"{log.resource_type}:{log.resource_id}" if log.resource_type else '',
                        log.ip_address,
                        str(log.details)
                    ])
            
            print(f"Archived {len(logs)} logs to {filepath}")
            
            # Delete archived logs
            deleted_count = AuditLog.query.filter(AuditLog.timestamp < cutoff_date).delete()
            db.session.commit()
            
            print(f"Deleted {deleted_count} logs from database.")
            
        except Exception as e:
            print(f"Archiving Failed: {e}")
            db.session.rollback()

if __name__ == "__main__":
    # Default to 1 year, can be overridden
    archive_audit_logs(days=365)
