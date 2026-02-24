import os
import sys
import pandas as pd
import logging
from sqlalchemy import func

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from db import db
from models import Passenger
from database_migration.data_utils import parse_date, parse_datetime, parse_integer, parse_boolean

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def bulk_import():
    """
    Iterates through all CSV files in final_sort and imports/updates them.
    """
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, 'new _clean')
    
    if not os.path.exists(data_dir):
        logger.error(f"Directory not found: {data_dir}")
        return

    csv_files = [f for f in os.listdir(data_dir) if f.endswith('.csv')]
    logger.info(f"Found {len(csv_files)} CSV files to process: {csv_files}")

    app = create_app('development')
    
    with app.app_context():
        # Pre-fetch existing transaction IDs and their destination_point status to minimize queries
        # We store {transcation_id: has_destination_point (bool)}
        logger.info("Loading existing transaction IDs...")
        existing_data = {
            p.transcation_id: (p.destination_point is not None and p.destination_point != '') 
            for p in Passenger.query.with_entities(Passenger.transcation_id, Passenger.destination_point).filter(Passenger.deleted_at.is_(None)).all()
        }
        logger.info(f"Loaded {len(existing_data)} existing records.")

        for csv_file in csv_files:
            csv_path = os.path.join(data_dir, csv_file)
            process_file(csv_path, existing_data)

def process_file(csv_path, existing_data):
    logger.info(f"Processing file: {csv_path}")
    try:
        df = pd.read_csv(csv_path)
    except Exception as e:
        logger.error(f"Failed to read CSV {csv_path}: {e}")
        return

    total_rows = len(df)
    added = 0
    updated = 0
    skipped = 0
    errors = 0
    
    # Cache for bulk inserts/updates
    to_add = []
    
    for idx, row in df.iterrows():
        try:
            trans_id = str(row.get('transcation_id', '')).strip()
            
            if not trans_id or trans_id.lower() == 'nan':
                continue

            destination = str(row.get('destination_point', '')).strip() if pd.notna(row.get('destination_point')) else None

            # Check if exists
            if trans_id in existing_data:
                has_dest = existing_data[trans_id]
                
                # If record exists but is missing destination_point, and we have it now -> Update
                if not has_dest and destination:
                    # Perform direct update
                    passenger = Passenger.query.filter_by(transcation_id=trans_id).first()
                    if passenger:
                        passenger.destination_point = destination
                        updated += 1
                        existing_data[trans_id] = True # Mark as having dest
                else:
                    skipped += 1
                continue

            # New Record
            passenger = Passenger(
                user_id=str(row.get('user_id', 'import')).strip(),
                transcation_id=trans_id,
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
                destination_point=destination,
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
            added += 1
            existing_data[trans_id] = True # Mark as existing
            
            if (added + updated) % 100 == 0:
                db.session.commit()
                print(f"Processed {idx+1}/{total_rows} (Added: {added}, Updated: {updated})...")

        except Exception as e:
            logger.error(f"Error row {idx+2}: {e}")
            errors += 1
            db.session.rollback()
    
    db.session.commit()
    logger.info(f"File finished. Added: {added}, Updated: {updated}, Skipped: {skipped}, Errors: {errors}")

if __name__ == "__main__":
    bulk_import()
