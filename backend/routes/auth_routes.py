from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token, create_refresh_token
from werkzeug.security import generate_password_hash, check_password_hash
from db import db
from models import User, Permission, UserSession
from utils.validators import Validators
from utils.audit import log_audit_event

from datetime import datetime, timedelta
import secrets
import string

auth_bp = Blueprint('auth', __name__)

def generate_token(length=32):
    """Generate a secure random token"""
    return ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(length))

@auth_bp.route('/register', methods=['POST'])
def register():
    """Registration endpoint disabled - only admins can create users"""
    return jsonify({
        'error': 'User registration is disabled. Contact your administrator to create an account.'
    }), 403

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user - Simple authentication like web project"""
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Username and password required'}), 400
    
    user = User.query.filter_by(username=data['username']).first()
    
    # Check if user exists
    if not user:
        # Avoid timing attacks by simulating work, but for now just return 401
        return jsonify({'error': 'Invalid credentials'}), 401

    # Check if account is locked
    if user.is_locked():
        lock_remaining = int((user.locked_until - datetime.utcnow()).total_seconds() / 60)
        return jsonify({'error': f'Account locked. Try again in {lock_remaining} minutes.'}), 403

    # Check password
    if not check_password_hash(user.password_hash, data['password']):
        # Increment failed attempts
        user.failed_login_attempts += 1
        
        # Lock if threshold reached
        if user.failed_login_attempts >= 5:
            user.locked_until = datetime.utcnow() + timedelta(minutes=15)
            log_audit_event(
                user_id=str(user.id),
                action="Account Locked",
                details={'ip': request.remote_addr, 'reason': 'Too many failed attempts'}
            )
        
        db.session.commit()
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Reset failed attempts on success
    if user.failed_login_attempts > 0 or user.locked_until:
        user.failed_login_attempts = 0
        user.locked_until = None
        db.session.commit()
    
    # Create JWT token (24 hour expiration like web project)
    token = create_access_token(identity=str(user.id))
    
    # Create User Session
    try:
        session = UserSession(
            user_id=user.id,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')[:500] if request.headers.get('User-Agent') else None,
            login_at=datetime.utcnow(),
            last_active_at=datetime.utcnow()
        )
        db.session.add(session)
        db.session.commit() # Commit session immediately
        
        # Log Audit Event (Separate transaction)
        try:
            log_audit_event(
                user_id=str(user.id),
                action="Login Success",
                details={'ip': request.remote_addr, 'user_agent': request.headers.get('User-Agent')}
            )
        except Exception as e:
            print(f"Audit log failed: {e}")
            
    except Exception as e:
        print(f"Session creation failed: {e}")
        db.session.rollback()

    
    return jsonify({
        'token': token,
        'user': {
            'id': str(user.id),
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'permissions': user.permissions_list
        }
    }), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user info"""
    user_id = get_jwt_identity()
    user = User.query.filter_by(id=user_id).first()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify(user.to_dict()), 200

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change password"""
    user_id = get_jwt_identity()
    user = User.query.filter_by(id=user_id).first()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    if not data or not data.get('old_password') or not data.get('new_password'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Verify old password
    if not check_password_hash(user.password_hash, data['old_password']):
        return jsonify({'error': 'Invalid old password'}), 401
    
    # Update password
    user.password_hash = generate_password_hash(data['new_password'])
    user.updated_at = datetime.utcnow()
    db.session.commit()
    
    db.session.commit()
    
    return jsonify({'message': 'Password changed successfully'}), 200

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    user_id = get_jwt_identity()
    user = User.query.filter_by(id=user_id).first()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if not user.is_active:
        return jsonify({'error': 'User account is inactive'}), 403
    
    # Create new access token
    access_token = create_access_token(identity=str(user.id))
    
    # Update Session Activity
    try:
        # particular logic to find specific session might be needed, here we take latest open session
        session = UserSession.query.filter_by(user_id=user_id, logout_at=None).order_by(UserSession.login_at.desc()).first()
        if session:
            session.last_active_at = datetime.utcnow()
            db.session.commit()
    except Exception as e:
        print(f"Session update failed: {e}")

    return jsonify({
        'message': 'Token refreshed successfully',
        'access_token': access_token
    }), 200


@auth_bp.route('/logout', methods=['POST'])
@jwt_required(optional=True) # Optional in case token is already invalid
def logout():
    """Logout user"""
    try:
        user_id = get_jwt_identity()
        if user_id:
            # Update Session
            session = UserSession.query.filter_by(user_id=user_id, logout_at=None).order_by(UserSession.login_at.desc()).first()
            if session:
                session.logout_at = datetime.utcnow()
                # Calculate duration
                duration = (session.logout_at - session.login_at).total_seconds() / 60
                session.duration_minutes = round(duration, 2)
                
            log_audit_event(
                user_id=user_id,
                action="Logout",
                details={'ip': request.remote_addr}
            )
            db.session.commit()
    except Exception as e:
        print(f"Logout logging failed: {e}")
        
    return jsonify({'message': 'Logged out successfully'}), 200


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Request password reset"""
    data = request.get_json()
    
    if not data or not data.get('email'):
        return jsonify({'error': 'Email is required'}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user:
        # Don't reveal if email exists for security
        return jsonify({'message': 'If email exists, reset link will be sent'}), 200
    
    # Generate reset token
    reset_token = generate_token()
    user.password_reset_token = reset_token
    user.password_reset_expires = datetime.utcnow() + timedelta(hours=24)
    db.session.commit()
    
    db.session.commit()
    
    # TODO: Send email with reset link
    # For now, return token in response (remove in production)
    return jsonify({
        'message': 'Password reset link sent to email'
    }), 200

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset password with token"""
    data = request.get_json()
    
    if not data or not data.get('token') or not data.get('new_password'):
        return jsonify({'error': 'Token and new password are required'}), 400
    
    user = User.query.filter_by(password_reset_token=data['token']).first()
    
    if not user:
        return jsonify({'error': 'Invalid reset token'}), 400
    
    # Check if token has expired
    if user.password_reset_expires < datetime.utcnow():
        return jsonify({'error': 'Reset token has expired'}), 400
    
    # Update password
    user.password_hash = generate_password_hash(data['new_password'])
    user.password_reset_token = None
    user.password_reset_expires = None
    db.session.commit()
    
    db.session.commit()
    
    return jsonify({'message': 'Password reset successfully'}), 200

@auth_bp.route('/verify-email', methods=['POST'])
def verify_email():
    """Verify email with token"""
    data = request.get_json()
    
    if not data or not data.get('token'):
        return jsonify({'error': 'Verification token is required'}), 400
    
    user = User.query.filter_by(email_verification_token=data['token']).first()
    
    if not user:
        return jsonify({'error': 'Invalid verification token'}), 400
    
    # Mark email as verified
    user.is_email_verified = True
    user.email_verification_token = None
    db.session.commit()
    
    db.session.commit()
    
    return jsonify({'message': 'Email verified successfully'}), 200
