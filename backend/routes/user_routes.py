from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from db import db
from models import User, Permission
from utils.validators import Validators
from datetime import datetime
import secrets
import string

user_bp = Blueprint('users', __name__)

def is_admin(user_id):
    """Check if user is admin"""
    user = User.query.filter_by(id=user_id).first()
    return user and user.role == 'admin'

def generate_token(length=32):
    """Generate a secure random token"""
    return ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(length))

@user_bp.route('', methods=['GET'])
@jwt_required()
def get_users():
    """Get all users (admin only)"""
    user_id = get_jwt_identity()
    
    if not is_admin(user_id):
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        
        users = User.query.paginate(page=page, per_page=per_page)
        
        return jsonify({
            'users': [user.to_dict() for user in users.items],
            'total': users.total,
            'pages': users.pages,
            'current_page': page
        }), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

@user_bp.route('', methods=['POST'])
@jwt_required()
def create_user():
    """Create a new user (admin only)"""
    current_user_id = get_jwt_identity()
    
    # Check if user is admin
    if not is_admin(current_user_id):
        return jsonify({'error': 'Unauthorized - only admins can create users'}), 403
    
    data = request.get_json()
    
    # Validate required fields
    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Missing required fields: username, email, password'}), 400
    
    # Validate email format
    if not Validators.validate_email(data['email']):
        return jsonify({'error': 'Invalid email format'}), 400
    
    # Check if username already exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 409
    
    # Check if email already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 409
    
    # Validate role
    role = data.get('role', 'viewer')
    if role not in ['admin', 'manager', 'viewer']:
        return jsonify({'error': 'Invalid role. Must be: admin, manager, or viewer'}), 400
    
    # Create new user
    user = User(
        username=data['username'],
        email=data['email'],
        password_hash=generate_password_hash(data['password']),
        role=role,
        is_active=data.get('is_active', True)
    )
    
    db.session.add(user)
    db.session.commit()
    
    db.session.commit()
    
    return jsonify({
        'message': 'User created successfully',
        'user': user.to_dict()
    }), 201

@user_bp.route('/<user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    """Get user details"""
    current_user_id = get_jwt_identity()
    
    # Users can only view their own profile unless they're admin
    if str(current_user_id) != user_id and not is_admin(current_user_id):
        return jsonify({'error': 'Unauthorized'}), 403
    
    user = User.query.filter_by(id=user_id).first()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify(user.to_dict()), 200

@user_bp.route('/<user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    """Update user details"""
    current_user_id = get_jwt_identity()
    
    # Users can only update their own profile unless they're admin
    if str(current_user_id) != user_id and not is_admin(current_user_id):
        return jsonify({'error': 'Unauthorized'}), 403
    
    user = User.query.filter_by(id=user_id).first()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    old_values = {}
    new_values = {}
    
    # Update username
    if 'username' in data and data['username'] != user.username:
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 409
        old_values['username'] = user.username
        user.username = data['username']
        new_values['username'] = data['username']
    
    # Update email
    if 'email' in data and data['email'] != user.email:
        if not Validators.validate_email(data['email']):
            return jsonify({'error': 'Invalid email format'}), 400
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 409
        old_values['email'] = user.email
        user.email = data['email']
        new_values['email'] = data['email']
    
    # Update role (admin only)
    if 'role' in data and is_admin(current_user_id):
        if data['role'] not in ['admin', 'manager', 'viewer']:
            return jsonify({'error': 'Invalid role'}), 400
        old_values['role'] = user.role
        user.role = data['role']
        new_values['role'] = data['role']
    
    # Update is_active (admin only)
    if 'is_active' in data and is_admin(current_user_id):
        old_values['is_active'] = user.is_active
        user.is_active = data['is_active']
        new_values['is_active'] = data['is_active']
    
    user.updated_at = datetime.utcnow()
    db.session.commit()
    
    db.session.commit()
    
    return jsonify({
        'message': 'User updated successfully',
        'user': user.to_dict()
    }), 200

@user_bp.route('/<user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    """Delete user (admin only)"""
    current_user_id = get_jwt_identity()
    
    if not is_admin(current_user_id):
        return jsonify({'error': 'Unauthorized'}), 403
    
    user = User.query.filter_by(id=user_id).first()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Prevent deleting own account
    if str(current_user_id) == user_id:
        return jsonify({'error': 'Cannot delete your own account'}), 400
    
    db.session.delete(user)
    db.session.commit()
    
    db.session.commit()
    
    return jsonify({'message': 'User deleted successfully'}), 200

@user_bp.route('/<user_id>/deactivate', methods=['POST'])
@jwt_required()
def deactivate_user(user_id):
    """Deactivate user (admin only)"""
    current_user_id = get_jwt_identity()
    
    if not is_admin(current_user_id):
        return jsonify({'error': 'Unauthorized'}), 403
    
    user = User.query.filter_by(id=user_id).first()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    user.is_active = False
    user.updated_at = datetime.utcnow()
    db.session.commit()
    
    db.session.commit()
    
    return jsonify({'message': 'User deactivated successfully'}), 200

@user_bp.route('/<user_id>/activate', methods=['POST'])
@jwt_required()
def activate_user(user_id):
    """Activate user (admin only)"""
    current_user_id = get_jwt_identity()
    
    if not is_admin(current_user_id):
        return jsonify({'error': 'Unauthorized'}), 403
    
    user = User.query.filter_by(id=user_id).first()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    user.is_active = True
    user.updated_at = datetime.utcnow()
    db.session.commit()
    
    db.session.commit()
    
    return jsonify({'message': 'User activated successfully'}), 200

@user_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user profile"""
    user_id = get_jwt_identity()
    user = User.query.filter_by(id=user_id).first()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify(user.to_dict()), 200

@user_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update current user profile"""
    user_id = get_jwt_identity()
    user = User.query.filter_by(id=user_id).first()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    old_values = {}
    new_values = {}
    
    # Update username
    if 'username' in data and data['username'] != user.username:
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 409
        old_values['username'] = user.username
        user.username = data['username']
        new_values['username'] = data['username']
    
    # Update email
    if 'email' in data and data['email'] != user.email:
        if not Validators.validate_email(data['email']):
            return jsonify({'error': 'Invalid email format'}), 400
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 409
        old_values['email'] = user.email
        user.email = data['email']
        new_values['email'] = data['email']
    
    user.updated_at = datetime.utcnow()
    db.session.commit()
    
    # Log audit

    
    return jsonify({
        'message': 'Profile updated successfully',
        'user': user.to_dict()
    }), 200
