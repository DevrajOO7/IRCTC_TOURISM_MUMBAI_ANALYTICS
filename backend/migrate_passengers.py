#!/usr/bin/env python
"""
Database Migration Script for Passengers
Adds destination_point column to passengers table
Usage: python migrate_passengers.py
"""

import os
from dotenv import load_dotenv
import psycopg2
from psycopg2 import sql

# Load environment variables
load_dotenv()

def migrate_passengers():
    """Add destination_point column to passengers table"""
    
    # Get database URL
    db_url = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/passenger_analytics')
    
    try:
        # Parse connection string
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()
        
        print("🔄 Checking passengers table schema...")
        
        column_name = 'destination_point'
        column_type = 'VARCHAR(255)'
        
        # Check if column exists
        cursor.execute(f"""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='passengers' AND column_name='{column_name}'
            )
        """)
        
        column_exists = cursor.fetchone()[0]
        
        if not column_exists:
            print(f"  ➕ Adding column: {column_name}")
            cursor.execute(f"ALTER TABLE passengers ADD COLUMN {column_name} {column_type}")
            conn.commit()
            print(f"  ✅ Column {column_name} added successfully")
        else:
            print(f"  ✅ Column {column_name} already exists")
            
        cursor.close()
        conn.close()
        
        print("\n✅ Passenger table migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Database connection error: {str(e)}")
        print(f"DB URL: {db_url}")

if __name__ == '__main__':
    migrate_passengers()
