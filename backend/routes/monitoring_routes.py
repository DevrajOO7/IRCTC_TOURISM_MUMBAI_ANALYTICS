"""
Performance monitoring API endpoints
"""
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.monitoring import get_monitor
from models import User

monitoring_bp = Blueprint('monitoring', __name__)

@monitoring_bp.route('/metrics', methods=['GET'])
@jwt_required()
def get_metrics():
    """Get performance metrics"""
    try:
        # Check if user is admin
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403
        
        monitor = get_monitor()
        metrics = monitor.get_metrics()
        
        return jsonify(metrics), 200
    
    except Exception as e:
        return jsonify({
            'error': str(e),
            'message': 'Failed to retrieve metrics'
        }), 500

@monitoring_bp.route('/metrics/reset', methods=['POST'])
@jwt_required()
def reset_metrics():
    """Reset all metrics"""
    try:
        # Check if user is admin
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403
        
        monitor = get_monitor()
        monitor.reset_metrics()
        
        return jsonify({
            'success': True,
            'message': 'Metrics reset successfully'
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@monitoring_bp.route('/health', methods=['GET'])
def health_check():
    """System health check"""
    try:
        from db import db
        from utils.cache import get_cache_manager
        from utils.search import get_search_manager
        
        health_status = {
            'status': 'healthy',
            'components': {}
        }
        
        # Check database
        try:
            db.session.execute('SELECT 1')
            health_status['components']['database'] = 'healthy'
        except Exception as e:
            health_status['components']['database'] = f'unhealthy: {str(e)}'
            health_status['status'] = 'degraded'
        
        # Redis and Elasticsearch health checks removed
        status_code = 200 if health_status['status'] == 'healthy' else 503
        return jsonify(health_status), status_code
    
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 503

@monitoring_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    """Get system statistics"""
    try:
        from db import db
        from models import Passenger, User
        from datetime import datetime, timedelta
        
        # Count statistics
        total_passengers = Passenger.query.filter(
            Passenger.deleted_at.is_(None)
        ).count()
        
        total_users = User.query.count()
        
        # Status breakdown
        status_breakdown = db.session.query(
            Passenger.status,
            db.func.count(Passenger.id).label('count')
        ).filter(
            Passenger.deleted_at.is_(None)
        ).group_by(Passenger.status).all()
        
        # Recent activity (last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_passengers = Passenger.query.filter(
            Passenger.created_at >= seven_days_ago,
            Passenger.deleted_at.is_(None)
        ).count()
        
        stats = {
            'passengers': {
                'total': total_passengers,
                'recent_7_days': recent_passengers,
                'by_status': {status: count for status, count in status_breakdown}
            },
            'users': {
                'total': total_users
            },
            'timestamp': datetime.utcnow().isoformat()
        }
        
        return jsonify(stats), 200
    
    except Exception as e:
        return jsonify({
            'error': str(e),
            'message': 'Failed to retrieve statistics'
        }), 500
