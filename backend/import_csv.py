#!/usr/bin/env python3
"""
CSV Import Script for Passenger Analytics
Usage: python import_csv.py --csv <path> --db-url <postgres-url> [--batch-size <size>]
"""

import argparse
import pandas as pd
import sys
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

from models import Passenger, db
from app import create_app

def parse_date(date_str):
    """Parse date string to date object"""
    if pd.isna(date_str) or date_str == '':
        return None
    
    try:
        # Support DD/MM/YYYY format by setting dayfirst=True
        return pd.to_datetime(date_str, dayfirst=True).date()
    except:
        return None

def parse_datetime(datetime_str):
    """Parse datetime string to datetime object"""
    if pd.isna(datetime_str) or datetime_str == '':
        return None
    
    try:
        # Support DD/MM/YYYY format by setting dayfirst=True
        return pd.to_datetime(datetime_str, dayfirst=True)
    except:
        return None

def parse_boolean(value):
    """Parse boolean value"""
    if pd.isna(value) or value == '':
        return False
    
    if isinstance(value, bool):
        return value
    
    if isinstance(value, str):
        return value.lower() in ['yes', 'true', '1', 'y']
    
    return bool(value)

def parse_integer(value):
    """Parse integer value"""
    if pd.isna(value) or value == '':
        return None
    
    try:
        return int(value)
    except:
        return None

def import_csv(csv_path, db_url, batch_size=1000):
    """Import CSV into PostgreSQL"""
    
    logger.info(f"Starting import from {csv_path}")
    logger.info(f"Database: {db_url}")
    logger.info(f"Batch size: {batch_size}")
    
    try:
        # Read CSV
        logger.info("Reading CSV file...")
        df = pd.read_csv(csv_path)
        logger.info(f"CSV loaded: {len(df)} rows, {len(df.columns)} columns")
        
        # Create app and engine
        # app = create_app('development')  # Disabled to avoid ES connection requirement
        engine = create_engine(db_url)
        Session = sessionmaker(bind=engine)
        session = Session()
        
        total_rows = len(df)
        imported = 0
        skipped = 0
        errors = 0
        
        logger.info("Starting data import...")
        
        # Process in batches
        for idx, row in df.iterrows():
            try:
                # Map CSV columns to model fields
                passenger = Passenger(
                    user_id=str(row.get('user_id', 'import')).strip(),
                    transcation_id=str(row.get('transcation_id', '')).strip(),
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
                
                # Validate required fields
                if not passenger.master_passenger_name or not passenger.city or not passenger.state:
                    logger.warning(f"Row {idx + 2}: Missing required fields, skipping")
                    skipped += 1
                    continue
                
                session.add(passenger)
                imported += 1
                
                # Batch commit
                if imported % batch_size == 0:
                    session.commit()
                    logger.info(f"Committed {imported} records...")
            
            except Exception as e:
                logger.error(f"Row {idx + 2}: {str(e)}")
                errors += 1
                continue
        
        # Final commit
        if imported % batch_size != 0:
            session.commit()
        
        session.close()
        
        # Summary
        logger.info("\n" + "="*50)
        logger.info("IMPORT SUMMARY")
        logger.info("="*50)
        logger.info(f"Total rows:    {total_rows}")
        logger.info(f"Imported:      {imported}")
        logger.info(f"Skipped:       {skipped}")
        logger.info(f"Errors:        {errors}")
        logger.info("="*50 + "\n")
        
        return {
            'total': total_rows,
            'imported': imported,
            'skipped': skipped,
            'errors': errors
        }
    
    except Exception as e:
        logger.error(f"Import failed: {str(e)}")
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description='Import CSV into Passenger Analytics database')
    parser.add_argument('--csv', required=True, help='Path to CSV file')
    parser.add_argument('--db-url', required=True, help='PostgreSQL database URL')
    parser.add_argument('--batch-size', type=int, default=1000, help='Batch size for commits (default: 1000)')
    
    args = parser.parse_args()
    
    result = import_csv(args.csv, args.db_url, args.batch_size)
    
    # Exit with error if there were errors
    if result['errors'] > 0:
        sys.exit(1)

if __name__ == '__main__':
    main()
