import os
import sys
import json
import logging
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from db import db
from models import Passenger, User, Nominee, Permission, AuditLog, UserSession
from database_migration.data_utils import parse_date, parse_datetime, parse_integer, parse_boolean

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def restore_db(json_path):
    """
    Restores full database from a JSON export file.
    Includes password hashes and all user fields.
    """
    if not os.path.exists(json_path):
        logger.error(f"File not found: {json_path}")
        return

    app = create_app('development')
    
    with app.app_context():
        logger.info(f"Reading JSON: {json_path}")
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            logger.error(f"Failed to read JSON: {e}")
            return

        # --- Process Users ---
        users_data = data.get('users', [])
        if users_data:
            logger.info(f"Found {len(users_data)} users. Restoring users...")
            u_added = 0
            u_updated = 0
            u_errors = 0
            u_processed = 0

            for user_row in users_data:
                u_processed += 1
                try:
                    email = str(user_row.get('email', '')).strip()
                    if not email:
                        logger.warning(f"User record {u_processed}: Missing email. Skipping.")
                        u_errors += 1
                        continue

                    user = User.query.filter_by(email=email).first()
                    is_new_user = False

                    if not user:
                        user = User()
                        user.email = email
                        is_new_user = True
                    
                    # Update all fields including password_hash
                    user.username = str(user_row.get('username', email.split('@')[0])).strip()
                    if user_row.get('password_hash'):
                         user.password_hash = str(user_row.get('password_hash'))
                    
                    user.role = str(user_row.get('role', 'viewer')).strip()
                    user.is_active = parse_boolean(user_row.get('is_active'))
                    user.is_email_verified = parse_boolean(user_row.get('is_email_verified'))
                    user.email_verification_token = user_row.get('email_verification_token')
                    user.password_reset_token = user_row.get('password_reset_token')
                    
                    if user_row.get('password_reset_expires'):
                        user.password_reset_expires = parse_datetime(user_row.get('password_reset_expires'), dayfirst=False)
                    if user_row.get('last_login'):
                        user.last_login = parse_datetime(user_row.get('last_login'), dayfirst=False)
                    
                    user.failed_login_attempts = parse_integer(user_row.get('failed_login_attempts')) or 0
                    
                    if user_row.get('locked_until'):
                        user.locked_until = parse_datetime(user_row.get('locked_until'), dayfirst=False)
                    if user_row.get('created_at'):
                        user.created_at = parse_datetime(user_row.get('created_at'), dayfirst=False)
                    if user_row.get('updated_at'):
                        user.updated_at = parse_datetime(user_row.get('updated_at'), dayfirst=False)

                    if is_new_user:
                        db.session.add(user)
                        u_added += 1
                    else:
                        u_updated += 1
                    
                except Exception as e:
                    logger.error(f"Error restoring user {email}: {e}")
                    u_errors += 1
            
            db.session.commit()
            logger.info(f"Users restore complete. Added: {u_added}, Updated: {u_updated}, Errors: {u_errors}")
        else:
            logger.info("No users found in backup.")

        # --- Process Permissions (Depends on Users) ---
        permissions_data = data.get('permissions', [])
        if permissions_data:
            logger.info(f"Found {len(permissions_data)} permissions. Restoring permissions...")
            perm_added = 0
            perm_errors = 0
            
            for row in permissions_data:
                try:
                    user_id = str(row.get('user_id', '')).strip()
                    module = str(row.get('module_name', '')).strip()
                    
                    if not user_id or not module:
                        continue
                        
                    # Find existing permission
                    perm = Permission.query.filter_by(user_id=user_id, module_name=module).first()
                    
                    if not perm:
                        perm = Permission()
                        perm.user_id = user_id
                        perm.module_name = module
                        perm_added += 1
                        db.session.add(perm)
                    
                    perm.can_view = parse_boolean(row.get('can_view'))
                    perm.can_edit = parse_boolean(row.get('can_edit'))
                    perm.can_delete = parse_boolean(row.get('can_delete'))
                    
                except Exception as e:
                    logger.error(f"Error restoring permission: {e}")
                    perm_errors += 1
            
            db.session.commit()
            logger.info(f"Permissions restore complete. Added: {perm_added}, Errors: {perm_errors}")

        # --- Process Passengers ---
        passengers_data = data.get('passengers', [])
        if passengers_data:
            logger.info(f"Found {len(passengers_data)} passengers. Restoring passengers...")
            p_added = 0
            p_updated = 0
            p_errors = 0
            p_processed = 0
            
            for row in passengers_data:
                p_processed += 1
                try:
                    trans_id = str(row.get('transcation_id', '')).strip()
                    if not trans_id:
                        logger.warning(f"Passenger record {p_processed}: Missing transaction_id. Skipping.")
                        p_errors += 1
                        continue

                    passenger = Passenger.query.filter_by(transcation_id=trans_id).first()
                    is_new = False

                    if not passenger:
                        passenger = Passenger()
                        passenger.transcation_id = trans_id
                        is_new = True
                    
                    # Update fields
                    passenger.user_id = str(row.get('user_id', 'import')).strip()
                    passenger.master_passenger_name = str(row.get('master_passenger_name', '')).strip()
                    passenger.age = parse_integer(row.get('age'))
                    
                    # Handle dates
                    dob_val = row.get('dob')
                    if dob_val: passenger.dob = parse_date(dob_val, dayfirst=False)
                    
                    anniv_val = row.get('anniversary_date')
                    if anniv_val: passenger.anniversary_date = parse_date(anniv_val, dayfirst=False)

                    passenger.gender = str(row.get('gender', '')).strip() if row.get('gender') else None
                    passenger.email_id = str(row.get('email_id', '')).strip() if row.get('email_id') else None
                    passenger.contact_number = str(row.get('contact_number', '')).strip() if row.get('contact_number') else None
                    passenger.no_of_passenger = parse_integer(row.get('no_of_passenger'))
                    
                    booking_val = row.get('booking_date')
                    if booking_val: passenger.booking_date = parse_datetime(booking_val, dayfirst=False)
                    
                    journey_val = row.get('journey_date')
                    if journey_val: passenger.journey_date = parse_datetime(journey_val, dayfirst=False)

                    passenger.boarding_point = str(row.get('boarding_point', '')).strip() if row.get('boarding_point') else None
                    passenger.city = str(row.get('city', 'Unknown')).strip()
                    passenger.state = str(row.get('state', 'Unknown')).strip()
                    passenger.package_code = str(row.get('package_code', '')).strip() if row.get('package_code') else None
                    passenger.package_name = str(row.get('package_name', '')).strip() if row.get('package_name') else None
                    passenger.package_class = str(row.get('package_class', '')).strip() if row.get('package_class') else None
                    passenger.status = str(row.get('status', 'Pending')).strip()
                    passenger.nominee_name = str(row.get('nominee_name', '')).strip() if row.get('nominee_name') else None
                    passenger.nominee_relation = str(row.get('nominee_relation', '')).strip() if row.get('nominee_relation') else None
                    passenger.nominee_contact = str(row.get('nominee_contact', '')).strip() if row.get('nominee_contact') else None
                    passenger.international_client = parse_boolean(row.get('international_client'))
                    passenger.remarks = str(row.get('remarks', '')) if row.get('remarks') else None
                    passenger.remarks_updated_by = str(row.get('remarks_updated_by', '')) if row.get('remarks_updated_by') else None
                    
                    if row.get('remarks_updated_at'):
                        passenger.remarks_updated_at = parse_datetime(row.get('remarks_updated_at'), dayfirst=False)
                    if row.get('created_at'):
                         passenger.created_at = parse_datetime(row.get('created_at'), dayfirst=False)
                    if row.get('updated_at'):
                        passenger.updated_at = parse_datetime(row.get('updated_at'), dayfirst=False)


                    if is_new:
                        db.session.add(passenger)
                        p_added += 1
                    else:
                        p_updated += 1
                    
                    if p_processed % 100 == 0:
                        db.session.commit()
                        print(f"Processed Passengers {p_processed}/{len(passengers_data)}...")

                except Exception as e:
                    logger.error(f"Error restoring passenger {trans_id}: {e}")
                    p_errors += 1
                    db.session.rollback()
            
            db.session.commit()
            logger.info(f"Passengers restore complete. Added: {p_added}, Updated: {p_updated}, Errors: {p_errors}")
        else:
             logger.info("No passengers found in backup.")

        # --- Process Nominees (Depends on Passengers) ---
        nominees_data = data.get('nominees', [])
        if nominees_data:
            logger.info(f"Found {len(nominees_data)} nominees. Restoring nominees...")
            n_added = 0
            n_errors = 0
            
            for row in nominees_data:
                try:
                    passenger_id = str(row.get('passenger_id', '')).strip()
                    if not passenger_id:
                        continue
                        
                    # Check if passenger exists (since we just restored them)
                    # Note: passenger_id in JSON might be UUID string.
                    
                    # Try to find mostly by passenger_id and name to avoid dups
                    name = str(row.get('name', '')).strip()
                    
                    nominee = Nominee.query.filter_by(passenger_id=passenger_id, name=name).first()
                    
                    if not nominee:
                        nominee = Nominee()
                        nominee.passenger_id = passenger_id
                        nominee.name = name
                        n_added += 1
                        db.session.add(nominee)
                    
                    nominee.relation = str(row.get('relation', ''))
                    nominee.contact = str(row.get('contact', ''))
                    
                except Exception as e:
                    logger.error(f"Error restoring nominee: {e}")
                    n_errors += 1
            
            db.session.commit()
            logger.info(f"Nominees restore complete. Added: {n_added}, Errors: {n_errors}")

        # --- Process Audit Logs ---
        audit_logs_data = data.get('audit_logs', [])
        if audit_logs_data:
            logger.info(f"Found {len(audit_logs_data)} audit logs. Restoring audit logs...")
            a_added = 0
            a_errors = 0
            
            for row in audit_logs_data:
                try:
                    log_id = str(row.get('id', '')).strip()
                    if not log_id: continue

                    audit_log = AuditLog.query.get(log_id)
                    if not audit_log:
                        audit_log = AuditLog()
                        audit_log.id = log_id
                        
                        audit_log.user_id = str(row.get('user_id', '')) if row.get('user_id') else None
                        audit_log.action = str(row.get('action', ''))
                        audit_log.resource_type = str(row.get('resource_type', '')) if row.get('resource_type') else None
                        audit_log.resource_id = str(row.get('resource_id', '')) if row.get('resource_id') else None
                        audit_log.details = row.get('details')
                        audit_log.ip_address = str(row.get('ip_address', '')) if row.get('ip_address') else None
                        
                        if row.get('timestamp'):
                            audit_log.timestamp = parse_datetime(row.get('timestamp'), dayfirst=False)

                        db.session.add(audit_log)
                        a_added += 1
                except Exception as e:
                    logger.error(f"Error restoring audit log: {e}")
                    a_errors += 1
            
            db.session.commit()
            logger.info(f"Audit logs restore complete. Added: {a_added}, Errors: {a_errors}")

        # --- Process User Sessions ---
        user_sessions_data = data.get('user_sessions', [])
        if user_sessions_data:
            logger.info(f"Found {len(user_sessions_data)} user sessions. Restoring user sessions...")
            s_added = 0
            s_errors = 0
            
            for row in user_sessions_data:
                try:
                    session_id = str(row.get('id', '')).strip()
                    if not session_id: continue

                    session = UserSession.query.get(session_id)
                    if not session:
                        session = UserSession()
                        session.id = session_id
                        
                        session.user_id = str(row.get('user_id', ''))
                        session.ip_address = str(row.get('ip_address', '')) if row.get('ip_address') else None
                        session.user_agent = str(row.get('user_agent', '')) if row.get('user_agent') else None
                        session.duration_minutes = row.get('duration_minutes')
                        
                        if row.get('login_at'):
                            session.login_at = parse_datetime(row.get('login_at'), dayfirst=False)
                        if row.get('last_active_at'):
                            session.last_active_at = parse_datetime(row.get('last_active_at'), dayfirst=False)
                        if row.get('logout_at'):
                            session.logout_at = parse_datetime(row.get('logout_at'), dayfirst=False)

                        db.session.add(session)
                        s_added += 1
                except Exception as e:
                    logger.error(f"Error restoring user session: {e}")
                    s_errors += 1
            
            db.session.commit()
            logger.info(f"User sessions restore complete. Added: {s_added}, Errors: {s_errors}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python restore_db.py <path_to_json>")
    else:
        restore_db(sys.argv[1])
