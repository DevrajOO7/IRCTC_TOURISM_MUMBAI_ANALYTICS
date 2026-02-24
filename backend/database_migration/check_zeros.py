import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from models import Passenger
from db import db

def check_zeros():
    app = create_app('development')
    
    with app.app_context():
        # Check for 0 or negative values
        zeros = Passenger.query.filter(Passenger.no_of_passenger < 1).count()
        print(f"Records with no_of_passenger < 1: {zeros}")
        
        if zeros > 0:
            sample = Passenger.query.filter(Passenger.no_of_passenger < 1).limit(5).all()
            print("Sample IDs:")
            for p in sample:
                print(f"ID: {p.id}, Value: {p.no_of_passenger}")

if __name__ == "__main__":
    check_zeros()
