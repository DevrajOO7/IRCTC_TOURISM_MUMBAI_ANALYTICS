
from functools import wraps
from flask import request, g, has_request_context
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from datetime import datetime
from models import AuditLog, db
import json
import logging
from threading import Thread

# Configure logger
logger = logging.getLogger(__name__)

def log_audit_event(action, resource_type=None, resource_id=None, details=None, user_id=None):
    """
    Log an audit event to the database.
    Can be called manually or via decorator.
    """
    try:
        # Get user_id from context if not provided
        if not user_id and has_request_context():
            try:
                verify_jwt_in_request(optional=True)
                identity = get_jwt_identity()
                if identity:
                     # identity might be a dictionary or a string depending on how it's stored
                     # In this app, typically it's the user ID string
                    user_id = identity['id'] if isinstance(identity, dict) else identity
            except Exception:
                pass
        
        # Get IP address
        ip_address = request.remote_addr if has_request_context() else None
        
        # Create log entry
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
            ip_address=ip_address
        )
        
        db.session.add(audit_log)
        db.session.commit()
        
        # Async Sync to Elasticsearch
        try:
            from utils.search import get_search_manager
            search_manager = get_search_manager()
            if search_manager and search_manager.client:
                # Use threading to avoid blocking response
                Thread(target=search_manager.index_audit_log, args=(audit_log.to_dict(),)).start()
        except Exception as es_e:
            print(f"ES Sync failed: {es_e}")
            logger.warning(f"ES Sync failed: {es_e}")
        
    except Exception as e:
        print(f"DEBUG: Failed to create audit log: {e}")
        logger.error(f"Failed to create audit log: {e}")
        db.session.rollback()

def audit_log(action, resource_type=None):
    """
    Decorator to automatically log API actions.
    Usage: @audit_log(action="Create Passenger", resource_type="passenger")
    """
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            # Execute the function first
            response = f(*args, **kwargs)
            
            try:
                # Extract resource_id if possible (e.g. from response or kwargs)
                # This is heuristic and depends on API structure
                resource_id = kwargs.get('id') or kwargs.get('passenger_id') or kwargs.get('user_id')
                
                # If response is JSON and has ID, use that
                if not resource_id and hasattr(response, 'get_json') and response.get_json():
                    resource_id = response.get_json().get('id')
                
                # Capture details - be careful not to log sensitive data
                # We can log the request payload but should mask passwords
                payload = None
                if request.is_json:
                    payload = request.get_json()
                    if payload and 'password' in payload:
                        payload = payload.copy()
                        payload['password'] = '***'
                
                log_audit_event(
                    action=action,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    details=payload
                )
            except Exception as e:
                logger.error(f"Error in audit decorator: {e}")
            
            return response
        return wrapper
    return decorator
