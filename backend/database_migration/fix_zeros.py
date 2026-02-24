import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from models import Passenger
from db import db

def fix_zeros():
    app = create_app('development')
    
    with app.app_context():
        print("Checking for passengers with 0 passenger counts...")
        
        # Find passengers with < 1 no_of_passenger
        query = Passenger.query.filter(Passenger.no_of_passenger < 1)
        count = query.count()
        
        if count == 0:
            print("No records found with 0 passenger counts.")
            return
            
        print(f"Found {count} records with 0 no_of_passenger.")
        print("Updating values to 1...")
        
        # Update records
        query.update({Passenger.no_of_passenger: 1}, synchronize_session=False)
        db.session.commit()
        
        print("Successfully updated records.")
        
        # Verify
        remaining = Passenger.query.filter(Passenger.no_of_passenger < 1).count()
        print(f"Remaining 0 records: {remaining}")

if __name__ == "__main__":
    fix_zeros()
