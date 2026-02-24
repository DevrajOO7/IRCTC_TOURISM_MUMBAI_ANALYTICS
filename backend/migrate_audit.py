
from app import create_app, db
from models import AuditLog, UserSession

app = create_app()

def migrate():
    print("🚀 Starting Audit System Migration...")
    with app.app_context():
        # This will create tables if they don't exist
        # It won't modify existing tables (safe)
        try:
            print("Creating audit_logs and user_sessions tables via SQLAlchemy...")
            db.create_all() 
            print("✅ Tables created (or already existed).")
            
            # Verify they exist
            engine = db.engine
            inspector = db.inspect(engine)
            tables = inspector.get_table_names()
            
            if 'audit_logs' in tables and 'user_sessions' in tables:
                print("✅ Verification successful: 'audit_logs' and 'user_sessions' found in DB.")
            else:
                print("❌ Verification failed: Tables not found.")
                
        except Exception as e:
            print(f"❌ Error creating tables: {e}")

if __name__ == "__main__":
    migrate()
