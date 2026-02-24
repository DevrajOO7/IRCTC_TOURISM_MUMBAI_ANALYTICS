from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required
from db import db
from models import AuditLog, User, UserSession
from sqlalchemy import func, desc
from datetime import datetime, timedelta
import csv
import io

audit_bp = Blueprint('audit', __name__)

@audit_bp.route('/logs', methods=['GET'])
@jwt_required()
def get_audit_logs():
    """Get paginated audit logs with filters"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        user_id = request.args.get('user_id')
        action = request.args.get('action')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        # Try Elasticsearch if search term is present or just for performance
        from utils.search import get_search_manager
        search_manager = get_search_manager()
        
        # Build filters for ES
        es_filters = {}
        if user_id: es_filters['user_id'] = user_id
        if action: es_filters['action'] = action
        if start_date: es_filters['start_date'] = start_date
        if end_date: es_filters['end_date'] = end_date
        
        # Search via ES if manager acts
        es_result = None
        if search_manager and search_manager.client:
            # We use action as query if it's not an exact filter, but here we treat it as filter mostly
            # If we wanted full text search we'd need a separate 'q' param or treat 'action' as q
            # For now, let's treat 'action' as a partial match query in ES if provided
            query_str = action if action else None
            # If action is used as query, don't filter by exact action term
            if query_str: 
                es_filters.pop('action', None)
                
            es_result = search_manager.search_audit_logs(
                query=query_str, 
                filters=es_filters, 
                size=per_page, 
                from_=(page-1)*per_page
            )
            
        if es_result:
            return jsonify({
                'logs': es_result['logs'],
                'total': es_result['total'],
                'pages': (es_result['total'] + per_page - 1) // per_page,
                'current_page': page
            }), 200

        # Fallback to SQL
        query = AuditLog.query

        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        if action:
            query = query.filter(AuditLog.action.ilike(f"%{action}%"))
        if start_date:
            query = query.filter(AuditLog.timestamp >= datetime.fromisoformat(start_date))
        if end_date:
            query = query.filter(AuditLog.timestamp <= datetime.fromisoformat(end_date))

        # Order by newest first
        query = query.order_by(desc(AuditLog.timestamp))
        
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'logs': [log.to_dict() for log in pagination.items],
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@audit_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_audit_stats():
    """Get aggregated audit stats"""
    try:
        # Total logs today
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        logs_today = AuditLog.query.filter(AuditLog.timestamp >= today).count()
        
        # Unique active users today
        active_users_today = db.session.query(func.count(func.distinct(UserSession.user_id)))\
            .filter(UserSession.last_active_at >= today).scalar()
            
        # Top 5 Actions
        top_actions = db.session.query(AuditLog.action, func.count(AuditLog.id))\
            .group_by(AuditLog.action)\
            .order_by(func.count(AuditLog.id).desc())\
            .limit(5).all()
            
        return jsonify({
            'logs_today': logs_today,
            'active_users_today': active_users_today,
            'top_actions': [{'action': a[0], 'count': a[1]} for a in top_actions]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@audit_bp.route('/stats/user/<user_id>', methods=['GET'])
@jwt_required()
def get_user_activity_chart(user_id):
    """Get activity counts for a specific user (ES Aggregation or SQL fallback)"""
    try:
        # Params
        action = request.args.get('action') # Optional 'Update Remarks' etc.
        interval = request.args.get('interval', 'day') # 'day' or 'month'
        
        # 1. Try Elasticsearch
        from utils.search import get_search_manager
        search_manager = get_search_manager()
        
        data = None
        if search_manager and search_manager.client:
            data = search_manager.get_audit_aggregations(user_id, action, interval)
            # Do NOT return here, we need to merge duration below

        # 2. Fallback to SQL if ES failed or returned None
        if data is None:
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            
            query = db.session.query(
                func.date(AuditLog.timestamp).label('date'),
                func.count(AuditLog.id)
            ).filter(
                AuditLog.user_id == user_id,
                AuditLog.timestamp >= thirty_days_ago
            )
            
            if action:
                query = query.filter(AuditLog.action == action)
                
            daily_counts = query.group_by(
                func.date(AuditLog.timestamp)
            ).all()
            
            # Init data from SQL
            data = [{'date': str(day[0]), 'count': day[1]} for day in daily_counts]

        # 3. Get Duration Aggregations (from SQL UserSession)
        # We don't have this in ES yet, so we query SQL
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        duration_query = db.session.query(
            func.date(UserSession.login_at).label('date'),
            func.sum(UserSession.duration_minutes).label('total_minutes')
        ).filter(
            UserSession.user_id == user_id,
            UserSession.login_at >= thirty_days_ago
        ).group_by(
            func.date(UserSession.login_at)
        ).all()
        
        duration_map = {str(d[0]): d[1] for d in duration_query}

        # Format and Merge for chart
        # We now definitely have 'data' (from ES or SQL)
        if isinstance(data, list):
             # 3a. Convert data to map for easier merging
             data_map = {d['date']: d for d in data}
             
             # 3b. Ensure all duration dates exist in data map
             for date_str, minutes in duration_map.items():
                 if date_str not in data_map:
                     # Create entry with 0 count if it didn't exist (e.g. active but no actions)
                     new_entry = {'date': date_str, 'count': 0, 'duration_minutes': 0}
                     data.append(new_entry)
                     data_map[date_str] = new_entry
                 
                 # Update duration
                 data_map[date_str]['duration_minutes'] = round((minutes or 0), 1)
             
             # 3c. Sort data by date
             data.sort(key=lambda x: x['date'])
        
        return jsonify(data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@audit_bp.route('/stats/traffic', methods=['GET'])
@jwt_required()
def get_traffic_stats():
    """Get traffic analysis (Live + Historical)"""
    try:
        # 1. Live Users (Last 15 minutes)
        fifteen_minutes_ago = datetime.utcnow() - timedelta(minutes=15)
        live_sessions = UserSession.query.filter(
            UserSession.last_active_at >= fifteen_minutes_ago,
            UserSession.logout_at.is_(None) # Must not be explicitly logged out
        ).all()
        
        # Get unique live users involved
        live_user_ids = set([s.user_id for s in live_sessions])
        live_users_details = []
        if live_user_ids:
            users = User.query.filter(User.id.in_(live_user_ids)).all()
            for u in users:
                # Find latest activity for this user
                last_active = max([s.last_active_at for s in live_sessions if s.user_id == u.id])
                live_users_details.append({
                    'id': str(u.id),
                    'username': u.username,
                    'email': u.email,
                    'last_active_at': last_active.isoformat()
                })

        # 2. Historical Trend (DAU - Daily Active Users)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        # We need DISTINCT user_id count per day
        daily_traffic = db.session.query(
            func.date(UserSession.login_at).label('date'),
            func.count(func.distinct(UserSession.user_id)).label('unique_users')
        ).filter(
            UserSession.login_at >= thirty_days_ago
        ).group_by(
            func.date(UserSession.login_at)
        ).all()
        
        chart_data = [{'date': str(d[0]), 'users': d[1]} for d in daily_traffic]
        
        # Ensure charts look good even with sparse data (fill gaps optional? keeping simple for now)
        return jsonify({
            'live_count': len(live_users_details),
            'live_users': live_users_details,
            'daily_trend': chart_data
        }), 200

    except Exception as e:
        print(f"Traffic stats error: {e}")
        return jsonify({'error': str(e)}), 500

@audit_bp.route('/history/<user_id>', methods=['GET'])
@jwt_required()
def get_user_history(user_id):
    """Get session history for a user"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = 10
        
        sessions = UserSession.query.filter_by(user_id=user_id)\
            .order_by(desc(UserSession.login_at))\
            .paginate(page=page, per_page=per_page, error_out=False)
            
        return jsonify({
            'sessions': [s.to_dict() for s in sessions.items],
            'total': sessions.total,
            'pages': sessions.pages
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@audit_bp.route('/export', methods=['GET'])
@jwt_required()
def export_audit_logs():
    """Export logs to CSV"""
    try:
        # Get filters (same as list)
        user_id = request.args.get('user_id')
        start_date = request.args.get('start_date')
        
        query = AuditLog.query
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        if start_date:
            query = query.filter(AuditLog.timestamp >= datetime.fromisoformat(start_date))
            
        logs = query.order_by(desc(AuditLog.timestamp)).limit(10000).all() # Limit export
        
        # Generate CSV
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['Date', 'User', 'Action', 'Resource', 'IP', 'Details'])
        
        for log in logs:
            writer.writerow([
                log.timestamp.isoformat(),
                log.user.email if log.user else 'Unknown',
                log.action,
                f"{log.resource_type}:{log.resource_id}" if log.resource_type else '',
                log.ip_address,
                str(log.details)
            ])
            
        output.seek(0)
        
        return send_file(
            io.BytesIO(output.getvalue().encode('utf-8')),
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'audit_logs_{datetime.now().strftime("%Y%m%d")}.csv'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500
