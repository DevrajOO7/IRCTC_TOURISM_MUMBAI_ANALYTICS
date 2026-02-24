import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from models import Passenger
from db import db

def fix_passenger_counts():
    app = create_app('development')
    
    with app.app_context():
        print("Checking for passengers with missing passenger counts...")
        
        # Find passengers with NULL no_of_passenger
        query = Passenger.query.filter(Passenger.no_of_passenger.is_(None))
        count = query.count()
        
        if count == 0:
            print("No records found with missing passenger counts.")
            return
            
        print(f"Found {count} records with NULL no_of_passenger.")
        print("Updating values to 1...")
        
        # Update records
        # Using bulk update for performance
        query.update({Passenger.no_of_passenger: 1}, synchronize_session=False)
        db.session.commit()
        
        print("Successfully updated records.")
        
        # Verify
        remaining = Passenger.query.filter(Passenger.no_of_passenger.is_(None)).count()
        print(f"Remaining NULL records: {remaining}")

if __name__ == "__main__":
    fix_passenger_counts()
