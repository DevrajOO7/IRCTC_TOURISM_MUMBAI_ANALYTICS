"""Permission and authorization utilities"""
from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity
from db import db
from models import User, Permission

def require_admin(f):
    """Decorator to require admin role"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = get_jwt_identity()
        user = User.query.filter_by(id=user_id).first()
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        if not user.is_active:
            return jsonify({'error': 'User account is inactive'}), 403
        
        return f(*args, **kwargs)
    return decorated_function

def require_permission(module_name, action):
    """
    Decorator to require specific permission
    action: 'view', 'edit', 'delete'
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user_id = get_jwt_identity()
            user = User.query.filter_by(id=user_id).first()
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            if not user.is_active:
                return jsonify({'error': 'User account is inactive'}), 403
            
            # Admins have all permissions
            if user.role == 'admin':
                return f(*args, **kwargs)
            
            # Check specific permission
            permission = Permission.query.filter_by(
                user_id=user_id,
                module_name=module_name
            ).first()
            
            if not permission:
                return jsonify({'error': f'No permission for {module_name}'}), 403
            
            if action == 'view' and not permission.can_view:
                return jsonify({'error': f'View permission denied for {module_name}'}), 403
            elif action == 'edit' and not permission.can_edit:
                return jsonify({'error': f'Edit permission denied for {module_name}'}), 403
            elif action == 'delete' and not permission.can_delete:
                return jsonify({'error': f'Delete permission denied for {module_name}'}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def check_permission(user_id, module_name, action):
    """
    Check if user has specific permission
    Returns: True/False
    """
    user = User.query.filter_by(id=user_id).first()
    
    if not user or not user.is_active:
        return False
    
    # Admins have all permissions
    if user.role == 'admin':
        return True
    
    permission = Permission.query.filter_by(
        user_id=user_id,
        module_name=module_name
    ).first()
    
    if not permission:
        return False
    
    if action == 'view':
        return permission.can_view
    elif action == 'edit':
        return permission.can_edit
    elif action == 'delete':
        return permission.can_delete
    
    return False

def get_user_permissions(user_id):
    """Get all permissions for a user"""
    permissions = Permission.query.filter_by(user_id=user_id).all()
    return {p.module_name: p.to_dict() for p in permissions}

def initialize_default_permissions(user_id, role='viewer'):
    """Initialize default permissions for new user"""
    modules = ['passengers', 'packages', 'reports', 'analytics', 'users']
    
    for module in modules:
        # Admins get all permissions by default
        if role == 'admin':
            can_view = can_edit = can_delete = True
        else:
            # Viewers get view-only by default
            can_view = True
            can_edit = can_delete = False
        
        permission = Permission(
            user_id=user_id,
            module_name=module,
            can_view=can_view,
            can_edit=can_edit,
            can_delete=can_delete
        )
        db.session.add(permission)
    
    db.session.commit()
