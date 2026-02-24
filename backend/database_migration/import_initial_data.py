import os
import sys
import pandas as pd
import logging
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from db import db
from models import Passenger

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

from database_migration.data_utils import parse_date, parse_datetime, parse_integer, parse_boolean

def import_initial_data(csv_path):
    """
    Imports data into an EMPTY database.
    """
    if not os.path.exists(csv_path):
        logger.error(f"File not found: {csv_path}")
        return

    app = create_app('development')
    
    with app.app_context():
        # Check if database is empty
        if Passenger.query.first() is not None:
            print("WARNING: Database is not empty.")
            confirm = input("Do you want to continue and append data? (yes/no): ")
            if confirm.lower() != 'yes':
                return

        logger.info(f"Reading CSV: {csv_path}")
        try:
            df = pd.read_csv(csv_path)
        except Exception as e:
            logger.error(f"Failed to read CSV: {e}")
            return

        total_rows = len(df)
        imported = 0
        errors = 0
        
        logger.info(f"Found {total_rows} rows. Starting import...")

        for idx, row in df.iterrows():
            try:
                # Clean and validate data
                user_id = str(row.get('user_id', 'import')).strip()
                if not user_id or user_id.lower() == 'nan': user_id = 'import_user'
                
                transcation_id = str(row.get('transcation_id', '')).strip()
                if not transcation_id or transcation_id.lower() == 'nan':
                    logger.warning(f"Row {idx+2}: Missing transaction_id, skipping.")
                    errors += 1
                    continue

                passenger = Passenger(
                    user_id=user_id,
                    transcation_id=transcation_id,
                    master_passenger_name=str(row.get('master_passenger_name', '')).strip(),
                    age=parse_integer(row.get('age')),
                    dob=parse_date(row.get('dob')),
                    anniversary_date=parse_date(row.get('anniversary_date')),
                    gender=str(row.get('gender', '')).strip() if pd.notna(row.get('gender')) else None,
                    email_id=str(row.get('email_id', '')).strip() if pd.notna(row.get('email_id')) else None,
                    contact_number=str(row.get('contact_number', '')).strip() if pd.notna(row.get('contact_number')) else None,
                    no_of_passenger=parse_integer(row.get('no_of_passenger')),
                    booking_date=parse_datetime(row.get('booking_date')),
                    journey_date=parse_datetime(row.get('journey_date')),
                    boarding_point=str(row.get('boarding_point', '')).strip() if pd.notna(row.get('boarding_point')) else None,
                    city=str(row.get('City', row.get('city', 'Unknown'))).strip(),
                    state=str(row.get('State', row.get('state', 'Unknown'))).strip(),
                    package_code=str(row.get('package_code', '')).strip() if pd.notna(row.get('package_code')) else None,
                    package_name=str(row.get('package_name', '')).strip() if pd.notna(row.get('package_name')) else None,
                    package_class=str(row.get('package_class', '')).strip() if pd.notna(row.get('package_class')) else None,
                    status=str(row.get('status', 'Pending')).strip(),
                    nominee_name=str(row.get('nominee_name', '')).strip() if pd.notna(row.get('nominee_name')) else None,
                    nominee_relation=str(row.get('nominee_relation', '')).strip() if pd.notna(row.get('nominee_relation')) else None,
                    nominee_contact=str(row.get('nominee_contact', '')).strip() if pd.notna(row.get('nominee_contact')) else None,
                    international_client=parse_boolean(row.get('international_client'))
                )
                
                db.session.add(passenger)
                imported += 1
                
                if imported % 100 == 0:
                    db.session.commit()
                    print(f"Imported {imported}/{total_rows}...")

            except Exception as e:
                logger.error(f"Error row {idx+2}: {e}")
                errors += 1
                db.session.rollback()

        db.session.commit()
        logger.info(f"Import complete. Imported: {imported}, Errors: {errors}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python import_initial_data.py <path_to_csv>")
    else:
        import_initial_data(sys.argv[1])
