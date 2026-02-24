"""
Backup management API endpoints
"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.backup import get_backup_manager
from models import User

backup_bp = Blueprint('backup', __name__)

@backup_bp.route('/create', methods=['POST'])
@jwt_required()
def create_backup():
    """Create a new database backup"""
    try:
        # Check if user is admin
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403
        
        backup_manager = get_backup_manager()
        compress = request.json.get('compress', True) if request.json else True
        
        result = backup_manager.create_backup(compress=compress)
        
        if result['success']:
            return jsonify(result), 201
        else:
            return jsonify(result), 500
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Backup creation failed'
        }), 500

@backup_bp.route('/list', methods=['GET'])
@jwt_required()
def list_backups():
    """List all available backups"""
    try:
        # Check if user is admin
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403
        
        backup_manager = get_backup_manager()
        result = backup_manager.list_backups()
        
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@backup_bp.route('/restore', methods=['POST'])
@jwt_required()
def restore_backup():
    """Restore database from backup"""
    try:
        # Check if user is admin
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        backup_file = data.get('file')
        
        if not backup_file:
            return jsonify({
                'success': False,
                'error': 'Backup file not specified'
            }), 400
        
        backup_manager = get_backup_manager()
        result = backup_manager.restore_backup(backup_file)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 500
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Restore failed'
        }), 500

@backup_bp.route('/verify/<backup_file>', methods=['GET'])
@jwt_required()
def verify_backup(backup_file):
    """Verify backup integrity"""
    try:
        # Check if user is admin
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403
        
        backup_manager = get_backup_manager()
        result = backup_manager.verify_backup(backup_file)
        
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@backup_bp.route('/delete/<backup_file>', methods=['DELETE'])
@jwt_required()
def delete_backup(backup_file):
    """Delete a backup file"""
    try:
        # Check if user is admin
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403
        
        backup_manager = get_backup_manager()
        result = backup_manager.delete_backup(backup_file)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 404
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
