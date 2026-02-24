#!/usr/bin/env python
"""
Database Migration Script
Adds missing columns to users table
Usage: python migrate_db.py
"""

import os
from dotenv import load_dotenv
import psycopg2
from psycopg2 import sql

# Load environment variables
load_dotenv()

def migrate_database():
    """Add missing columns to users table"""
    
    # Get database URL
    db_url = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/passenger_analytics')
    
    try:
        # Parse connection string
        # Format: postgresql://user:password@host:port/database
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()
        
        print("🔄 Checking database schema...")
        
        # List of columns to add with their definitions
        columns_to_add = [
            ('is_email_verified', 'BOOLEAN DEFAULT FALSE'),
            ('email_verification_token', 'VARCHAR(255)'),
            ('password_reset_token', 'VARCHAR(255)'),
            ('password_reset_expires', 'TIMESTAMP'),
            ('last_login', 'TIMESTAMP'),
            ('failed_login_attempts', 'INTEGER DEFAULT 0'),
            ('locked_until', 'TIMESTAMP'),
        ]
        
        # Check and add missing columns
        for column_name, column_type in columns_to_add:
            try:
                # Check if column exists
                cursor.execute(f"""
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name='users' AND column_name='{column_name}'
                    )
                """)
                
                column_exists = cursor.fetchone()[0]
                
                if not column_exists:
                    print(f"  ➕ Adding column: {column_name}")
                    cursor.execute(f"ALTER TABLE users ADD COLUMN {column_name} {column_type}")
                    conn.commit()
                    print(f"  ✅ Column {column_name} added successfully")
                else:
                    print(f"  ✅ Column {column_name} already exists")
                    
            except Exception as e:
                print(f"  ⚠️  Error with column {column_name}: {str(e)}")
                conn.rollback()

        # ---------------------------------------------------------
        # Check recruiter_details table
        # ---------------------------------------------------------
        print("\n🔄 Checking recruiter_details table...")
        recruiter_columns = [
            ('updated_at', 'TIMESTAMP DEFAULT NOW()'),
            ('purpose', 'TEXT'),
        ]

        for column_name, column_type in recruiter_columns:
            try:
                # Check if column exists
                cursor.execute(f"""
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name='recruiter_details' AND column_name='{column_name}'
                    )
                """)
                
                column_exists = cursor.fetchone()[0]
                
                if not column_exists:
                    print(f"  ➕ Adding column: {column_name}")
                    cursor.execute(f"ALTER TABLE recruiter_details ADD COLUMN {column_name} {column_type}")
                    conn.commit()
                    print(f"  ✅ Column {column_name} added successfully")
                else:
                    print(f"  ✅ Column {column_name} already exists")
                    
            except Exception as e:
                print(f"  ⚠️  Error with column {column_name}: {str(e)}")
                conn.rollback()
        
        cursor.close()
        conn.close()
        
        print("\n✅ Database migration completed successfully!")
        print("\nNext steps:")
        print("1. Run: python init_admin.py")
        print("2. Run: python app.py")
        
    except Exception as e:
        print(f"❌ Database connection error: {str(e)}")
        print("\nTroubleshooting:")
        print("1. Ensure PostgreSQL is running")
        print("2. Check DATABASE_URL in .env")
        print("3. Verify database exists: createdb passenger_analytics")
        print("4. Check connection string format: postgresql://user:password@host:port/database")

if __name__ == '__main__':
    migrate_database()
