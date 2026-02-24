"""Admin routes for user management"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from db import db
from models import User, Permission
from utils.permissions import require_admin, require_permission, initialize_default_permissions, get_user_permissions
from utils.pagination import Paginator
from datetime import datetime
import re

admin_bp = Blueprint('admin', __name__)

# Validation helpers
def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Validate password strength"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters"
    if not any(c.isupper() for c in password):
        return False, "Password must contain uppercase letter"
    if not any(c.isdigit() for c in password):
        return False, "Password must contain digit"
    return True, "Valid"

# ==================== USER MANAGEMENT ====================

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
@require_admin
def get_all_users():
    """Get all users with pagination and search"""
    try:
        page, per_page = Paginator.get_pagination_params()
        
        # Build query
        query = User.query
        
        # Search by name or email
        search = request.args.get('search', '').strip()
        if search:
            query = query.filter(
                (User.username.ilike(f'%{search}%')) |
                (User.email.ilike(f'%{search}%'))
            )
        
        # Filter by status
        status = request.args.get('status', '').strip()
        if status and status.lower() != 'all':
            is_active = status.lower() == 'active'
            query = query.filter(User.is_active == is_active)
        
        # Filter by role
        role = request.args.get('role', '').strip()
        if role and role.lower() != 'all':
            query = query.filter(User.role == role)
        
        # Sort
        sort_by = request.args.get('sort_by', 'created_at').strip()
        sort_dir = request.args.get('sort_dir', 'desc').strip().lower()
        
        valid_sort_fields = ['username', 'email', 'role', 'is_active', 'created_at']
        if sort_by not in valid_sort_fields:
            sort_by = 'created_at'
        
        sort_column = getattr(User, sort_by)
        if sort_dir == 'asc':
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())
        
        # Paginate
        result = Paginator.paginate_query(query, page, per_page)
        
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<user_id>', methods=['GET'])
@jwt_required()
@require_admin
def get_user(user_id):
    """Get single user details"""
    try:
        user = User.query.filter_by(id=user_id).first()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user_data = user.to_dict()
        user_data['permissions'] = get_user_permissions(user_id)
        
        return jsonify(user_data), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/create', methods=['POST'])
@jwt_required()
@require_admin
def create_user():
    """Create new user"""
    admin_id = get_jwt_identity()
    data = request.get_json()
    
    try:
        # Validate required fields
        if not data or not data.get('email') or not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Email, username, and password are required'}), 400
        
        # Validate email format
        if not validate_email(data['email']):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Validate password strength
        is_valid, message = validate_password(data['password'])
        if not is_valid:
            return jsonify({'error': message}), 400
        
        # Check if email already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 400
        
        # Check if username already exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 400
        
        # Validate role
        role = data.get('role', 'viewer').lower()
        if role not in ['admin', 'manager', 'viewer']:
            return jsonify({'error': 'Invalid role. Must be admin, manager, or viewer'}), 400
        
        # Prevent non-admin from creating admin users
        if role == 'admin':
            admin_user = User.query.filter_by(id=admin_id).first()
            if not admin_user or admin_user.role != 'admin':
                return jsonify({'error': 'Only admins can create admin users'}), 403
        
        # Create user
        user = User(
            username=data['username'],
            email=data['email'],
            password_hash=generate_password_hash(data['password']),
            role=role,
            is_active=data.get('is_active', True)
        )
        
        db.session.add(user)
        db.session.flush()
        
        # Initialize permissions
        initialize_default_permissions(user.id, role)
        
        db.session.commit()
        
        return jsonify({
            'message': 'User created successfully',
            'user': user.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<user_id>/update', methods=['POST'])
@jwt_required()
@require_admin
def update_user(user_id):
    """Update user details"""
    admin_id = get_jwt_identity()
    user = User.query.filter_by(id=user_id).first()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    try:
        old_values = user.to_dict()
        
        # Update email
        if 'email' in data:
            if not validate_email(data['email']):
                return jsonify({'error': 'Invalid email format'}), 400
            
            existing = User.query.filter_by(email=data['email']).first()
            # Compare string representation of UUIDs
            if existing and str(existing.id) != str(user_id):
                return jsonify({'error': 'Email already exists'}), 400
            
            user.email = data['email']
        
        # Update username
        if 'username' in data:
            existing = User.query.filter_by(username=data['username']).first()
            # Compare string representation of UUIDs
            if existing and str(existing.id) != str(user_id):
                return jsonify({'error': 'Username already exists'}), 400
            
            user.username = data['username']
        
        # Update role
        if 'role' in data:
            role = data['role'].lower()
            if role not in ['admin', 'manager', 'viewer']:
                return jsonify({'error': 'Invalid role'}), 400
            
            user.role = role
        
        # Update status
        if 'is_active' in data:
            user.is_active = data['is_active']
        
        user.updated_at = datetime.utcnow()
        db.session.flush()
        
        db.session.commit()
        
        return jsonify({
            'message': 'User updated successfully',
            'user': user.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<user_id>/deactivate', methods=['POST'])
@jwt_required()
@require_admin
def deactivate_user(user_id):
    """Deactivate user"""
    admin_id = get_jwt_identity()
    user = User.query.filter_by(id=user_id).first()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Prevent deactivating self
    if str(admin_id) == str(user_id):
        return jsonify({'error': 'Cannot deactivate your own account'}), 400
    
    try:
        user.is_active = False
        user.updated_at = datetime.utcnow()
        db.session.flush()
        
        db.session.commit()
        
        return jsonify({'message': 'User deactivated successfully'}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<user_id>/activate', methods=['POST'])
@jwt_required()
@require_admin
def activate_user(user_id):
    """Activate user"""
    admin_id = get_jwt_identity()
    user = User.query.filter_by(id=user_id).first()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    try:
        user.is_active = True
        user.updated_at = datetime.utcnow()
        db.session.flush()
        
        db.session.commit()
        
        return jsonify({'message': 'User activated successfully'}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ==================== PERMISSIONS MANAGEMENT ====================

@admin_bp.route('/users/<user_id>/permissions', methods=['GET'])
@jwt_required()
@require_admin
def get_user_permissions_route(user_id):
    """Get user permissions"""
    try:
        user = User.query.filter_by(id=user_id).first()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        permissions = get_user_permissions(user_id)
        
        return jsonify({
            'user_id': str(user_id),
            'permissions': permissions
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<user_id>/permissions/update', methods=['POST'])
@jwt_required()
@require_admin
def update_user_permissions(user_id):
    """Update user permissions"""
    admin_id = get_jwt_identity()
    user = User.query.filter_by(id=user_id).first()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    try:
        # data format: { "module_name": { "can_view": bool, "can_edit": bool, "can_delete": bool } }
        for module_name, perms in data.items():
            permission = Permission.query.filter_by(
                user_id=user_id,
                module_name=module_name
            ).first()
            
            if not permission:
                # Create new permission
                permission = Permission(
                    user_id=user_id,
                    module_name=module_name
                )
                db.session.add(permission)
            
            # Update permissions
            permission.can_view = perms.get('can_view', False)
            permission.can_edit = perms.get('can_edit', False)
            permission.can_delete = perms.get('can_delete', False)
            permission.updated_at = datetime.utcnow()
        
        db.session.flush()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Permissions updated successfully',
            'permissions': get_user_permissions(user_id)
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ==================== PASSWORD MANAGEMENT ====================

@admin_bp.route('/users/<user_id>/reset-password', methods=['POST'])
@jwt_required()
@require_admin
def admin_reset_password(user_id):
    """Admin reset user password"""
    admin_id = get_jwt_identity()
    user = User.query.filter_by(id=user_id).first()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    if not data or not data.get('new_password'):
        return jsonify({'error': 'New password is required'}), 400
    
    try:
        # Validate password strength
        is_valid, message = validate_password(data['new_password'])
        if not is_valid:
            return jsonify({'error': message}), 400
        
        # Update password
        user.password_hash = generate_password_hash(data['new_password'])
        user.updated_at = datetime.utcnow()
        db.session.flush()
        
        db.session.commit()
        
        return jsonify({'message': 'Password reset successfully'}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
