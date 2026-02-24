"""
Advanced Analytics Endpoints for Real-Time Dashboard, Package, Passenger, and Agent Analytics
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import func, and_, or_, extract, case
from db import db
from models import Passenger
from utils.permissions import require_permission
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import json
from utils.analytics_helper import parse_date_range

analytics_bp = Blueprint('analytics_advanced', __name__)

# ==================== REAL-TIME DASHBOARD ====================

@analytics_bp.route('/realtime', methods=['GET'])
@jwt_required()
@require_permission('analytics', 'view')
def get_realtime_dashboard():
    """
    Get real-time dashboard data
    Auto-refresh every 5-10 seconds
    """
    try:
        today = datetime.utcnow().date()
        month_start = datetime(today.year, today.month, 1).date()
        
        # Query base
        base_query = Passenger.query.filter(Passenger.deleted_at.is_(None))
        today_query = base_query.filter(
            func.date(Passenger.booking_date) == today
        )
        month_query = base_query.filter(
            func.date(Passenger.booking_date) >= month_start
        )
        
        # Widget metrics
        total_passengers_today = today_query.count()
        total_passengers_month = month_query.count()
        total_packages_today = today_query.count()
        
        # Live traveling (journey_date is today and status is not completed)
        live_traveling = base_query.filter(
            func.date(Passenger.journey_date) == today,
            ~func.lower(Passenger.status).ilike('%completed%'),
            ~func.lower(Passenger.status).ilike('%cancelled%')
        ).count()
        
        # Completed today
        completed_today = today_query.filter(
            func.lower(Passenger.status).ilike('%completed%')
        ).count()
        
        # Not traveled today
        not_traveled_today = today_query.filter(
            or_(
                Passenger.journey_date.is_(None),
                ~func.lower(Passenger.status).ilike('%completed%')
            )
        ).count()
        
        # Top destination today
        top_destination = db.session.query(
            Passenger.city,
            func.count(Passenger.id).label('count')
        ).filter(
            Passenger.deleted_at.is_(None),
            func.date(Passenger.booking_date) == today
        ).group_by(Passenger.city).order_by(
            func.count(Passenger.id).desc()
        ).first()
        
        # Top performing agent today (by booking count)
        top_agent = db.session.query(
            Passenger.user_id,
            func.count(Passenger.id).label('count')
        ).filter(
            Passenger.deleted_at.is_(None),
            func.date(Passenger.booking_date) == today
        ).group_by(Passenger.user_id).order_by(
            func.count(Passenger.id).desc()
        ).first()
        
        # Hourly bookings today (for line chart)
        hourly_bookings = db.session.query(
            extract('hour', Passenger.booking_date).label('hour'),
            func.count(Passenger.id).label('count')
        ).filter(
            Passenger.deleted_at.is_(None),
            func.date(Passenger.booking_date) == today
        ).group_by('hour').order_by('hour').all()
        
        # Bookings by package (pie chart)
        bookings_by_package = db.session.query(
            Passenger.package_name,
            func.count(Passenger.id).label('count')
        ).filter(
            Passenger.deleted_at.is_(None),
            func.date(Passenger.booking_date) == today
        ).group_by(Passenger.package_name).all()
        
        # Bookings by agent (bar chart)
        bookings_by_agent = db.session.query(
            Passenger.user_id,
            func.count(Passenger.id).label('count')
        ).filter(
            Passenger.deleted_at.is_(None),
            func.date(Passenger.booking_date) == today
        ).group_by(Passenger.user_id).order_by(
            func.count(Passenger.id).desc()
        ).limit(10).all()
        
        return jsonify({
            'widgets': {
                'total_passengers_today': total_passengers_today,
                'total_passengers_month': total_passengers_month,
                'total_packages_today': total_packages_today,
                'live_traveling': live_traveling,
                'completed_today': completed_today,
                'not_traveled_today': not_traveled_today,
                'top_destination': top_destination[0] if top_destination else None,
                'top_agent': top_agent[0] if top_agent else None,
            },
            'charts': {
                'hourly_bookings': [
                    {'hour': int(h[0]) if h[0] else 0, 'count': h[1]}
                    for h in hourly_bookings
                ],
                'bookings_by_package': [
                    {'package': p[0] or 'Unknown', 'count': p[1]}
                    for p in bookings_by_package
                ],
                'bookings_by_agent': [
                    {'agent_id': str(a[0]), 'count': a[1]}
                    for a in bookings_by_agent
                ]
            },
            'timestamp': datetime.utcnow().isoformat()
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== PACKAGE ANALYTICS ====================

@analytics_bp.route('/packages', methods=['GET'])
@jwt_required()
@require_permission('analytics', 'view')
def get_package_analytics():
    """
    Get package performance analytics
    Supports daily, weekly, monthly, yearly views
    """
    try:
        period = request.args.get('period', 'daily').lower()  # daily, weekly, monthly, yearly
        from_date = request.args.get('from_date', '').strip()
        to_date = request.args.get('to_date', '').strip()
        package_id = request.args.get('package_id', '').strip()
        
        # Parse dates
        from_dt, to_dt = parse_date_range(from_date, to_date, default_days=30)
        
        # Base query
        query = Passenger.query.filter(
            Passenger.deleted_at.is_(None),
            Passenger.booking_date >= from_dt,
            Passenger.booking_date <= to_dt
        )
        
        if package_id:
            query = query.filter(Passenger.package_name.ilike(f'%{package_id}%'))
        
        # Top selling packages
        top_packages = db.session.query(
            Passenger.package_name,
            func.count(Passenger.id).label('bookings'),
            func.sum(case(
                (func.lower(Passenger.status).ilike('%completed%'), 1),
                else_=0
            )).label('completed')
        ).filter(
            Passenger.deleted_at.is_(None),
            Passenger.booking_date >= from_dt,
            Passenger.booking_date <= to_dt
        ).group_by(Passenger.package_name).order_by(
            func.count(Passenger.id).desc()
        ).limit(10).all()
        
        # Cancellation rate per package
        cancellation_rates = db.session.query(
            Passenger.package_name,
            func.count(Passenger.id).label('total'),
            func.sum(case(
                (func.lower(Passenger.status).ilike('%cancel%'), 1),
                else_=0
            )).label('cancelled')
        ).filter(
            Passenger.deleted_at.is_(None),
            Passenger.booking_date >= from_dt,
            Passenger.booking_date <= to_dt
        ).group_by(Passenger.package_name).all()
        
        # Repeat customer count per package
        repeat_customers = db.session.query(
            Passenger.package_name,
            Passenger.email_id,
            func.count(Passenger.id).label('count')
        ).filter(
            Passenger.deleted_at.is_(None),
            Passenger.booking_date >= from_dt,
            Passenger.booking_date <= to_dt,
            Passenger.email_id.isnot(None)
        ).group_by(Passenger.package_name, Passenger.email_id).having(
            func.count(Passenger.id) > 1
        ).all()
        
        # Package sales trend (last 12 months)
        trend_data = db.session.query(
            extract('year', Passenger.booking_date).label('year'),
            extract('month', Passenger.booking_date).label('month'),
            Passenger.package_name,
            func.count(Passenger.id).label('count')
        ).filter(
            Passenger.deleted_at.is_(None),
            Passenger.booking_date >= to_dt - timedelta(days=365)
        ).group_by('year', 'month', Passenger.package_name).order_by(
            'year', 'month'
        ).all()
        
        return jsonify({
            'top_packages': [
                {
                    'package': p[0] or 'Unknown',
                    'bookings': p[1],
                    'completed': p[2] or 0
                }
                for p in top_packages
            ],
            'cancellation_rates': [
                {
                    'package': c[0] or 'Unknown',
                    'total': c[1],
                    'cancelled': c[2] or 0,
                    'rate': round((c[2] or 0) / c[1] * 100, 2) if c[1] > 0 else 0
                }
                for c in cancellation_rates
            ],
            'repeat_customers': len(repeat_customers),
            'trend': [
                {
                    'year': int(t[0]),
                    'month': int(t[1]),
                    'package': t[2],
                    'count': t[3]
                }
                for t in trend_data
            ]
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== PASSENGER BEHAVIOR ANALYTICS ====================

@analytics_bp.route('/passenger-behavior', methods=['GET'])
@jwt_required()
@require_permission('analytics', 'view')
def get_passenger_behavior():
    """
    Get passenger behavior analytics
    """
    try:
        # Repeat passengers
        repeat_passengers = db.session.query(
            Passenger.email_id,
            Passenger.master_passenger_name,
            func.count(Passenger.id).label('trips')
        ).filter(
            Passenger.deleted_at.is_(None),
            Passenger.email_id.isnot(None)
        ).group_by(Passenger.email_id, Passenger.master_passenger_name).having(
            func.count(Passenger.id) > 1
        ).order_by(func.count(Passenger.id).desc()).limit(100).all()
        
        # Top 10 frequent travelers
        top_travelers = repeat_passengers[:10]
        
        # Most common travel months
        travel_months = db.session.query(
            extract('month', Passenger.journey_date).label('month'),
            func.count(Passenger.id).label('count')
        ).filter(
            Passenger.deleted_at.is_(None),
            Passenger.journey_date.isnot(None)
        ).group_by('month').order_by(
            func.count(Passenger.id).desc()
        ).all()
        
        # Most visited countries/cities
        top_destinations = db.session.query(
            Passenger.city,
            Passenger.state,
            func.count(Passenger.id).label('count')
        ).filter(
            Passenger.deleted_at.is_(None)
        ).group_by(Passenger.city, Passenger.state).order_by(
            func.count(Passenger.id).desc()
        ).limit(10).all()
        
        # Lifetime value calculation (simple: trips × avg booking value)
        lifetime_values = db.session.query(
            Passenger.email_id,
            Passenger.master_passenger_name,
            func.count(Passenger.id).label('trips'),
            func.avg(func.cast(Passenger.no_of_passenger, db.Integer)).label('avg_passengers')
        ).filter(
            Passenger.deleted_at.is_(None),
            Passenger.email_id.isnot(None)
        ).group_by(Passenger.email_id, Passenger.master_passenger_name).order_by(
            func.count(Passenger.id).desc()
        ).limit(20).all()
        
        return jsonify({
            'repeat_passengers_count': len(repeat_passengers),
            'top_travelers': [
                {
                    'name': t[1],
                    'email': t[0],
                    'trips': t[2]
                }
                for t in top_travelers
            ],
            'travel_months': [
                {
                    'month': int(m[0]) if m[0] else 0,
                    'count': m[1]
                }
                for m in travel_months
            ],
            'top_destinations': [
                {
                    'city': d[0],
                    'state': d[1],
                    'count': d[2]
                }
                for d in top_destinations
            ],
            'lifetime_values': [
                {
                    'name': lv[1],
                    'email': lv[0],
                    'trips': lv[2],
                    'avg_passengers': float(lv[3] or 0),
                    'lifetime_value': lv[2] * (float(lv[3] or 1) * 100)  # Simple formula
                }
                for lv in lifetime_values
            ]
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== AGENT PERFORMANCE ANALYTICS ====================

@analytics_bp.route('/agents', methods=['GET'])
@jwt_required()
@require_permission('analytics', 'view')
def get_agent_analytics():
    """
    Get agent performance analytics
    """
    try:
        from_date = request.args.get('from_date', '').strip()
        to_date = request.args.get('to_date', '').strip()
        agent_id = request.args.get('agent_id', '').strip()
        
        # Parse dates
        from_dt, to_dt = parse_date_range(from_date, to_date, default_days=30)
        
        # Bookings per agent
        agent_bookings = db.session.query(
            Passenger.user_id,
            func.count(Passenger.id).label('bookings'),
            func.sum(case(
                (func.lower(Passenger.status).ilike('%completed%'), 1),
                else_=0
            )).label('completed'),
            func.sum(case(
                (func.lower(Passenger.status).ilike('%cancel%'), 1),
                else_=0
            )).label('cancelled'),
            func.count(func.distinct(Passenger.email_id)).label('unique_customers')
        ).filter(
            Passenger.deleted_at.is_(None),
            Passenger.booking_date >= from_dt,
            Passenger.booking_date <= to_dt
        ).group_by(Passenger.user_id).order_by(
            func.count(Passenger.id).desc()
        ).all()
        
        # Monthly trend for top agents
        top_agents = [a[0] for a in agent_bookings[:5]]
        
        monthly_trend = db.session.query(
            Passenger.user_id,
            extract('year', Passenger.booking_date).label('year'),
            extract('month', Passenger.booking_date).label('month'),
            func.count(Passenger.id).label('count')
        ).filter(
            Passenger.deleted_at.is_(None),
            Passenger.user_id.in_(top_agents) if top_agents else False,
            Passenger.booking_date >= to_dt - timedelta(days=365)
        ).group_by(Passenger.user_id, 'year', 'month').order_by(
            Passenger.user_id, 'year', 'month'
        ).all()
        
        return jsonify({
            'agent_bookings': [
                {
                    'agent_id': str(a[0]),
                    'bookings': a[1],
                    'completed': a[2] or 0,
                    'cancelled': a[3] or 0,
                    'unique_customers': a[4],
                    'cancellation_rate': round((a[3] or 0) / a[1] * 100, 2) if a[1] > 0 else 0
                }
                for a in agent_bookings
            ],
            'monthly_trend': [
                {
                    'agent_id': str(m[0]),
                    'year': int(m[1]),
                    'month': int(m[2]),
                    'count': m[3]
                }
                for m in monthly_trend
            ]
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== FORECASTING ====================

@analytics_bp.route('/forecast', methods=['GET'])
@jwt_required()
@require_permission('analytics', 'view')
def get_forecast():
    """
    Get booking and package demand forecast
    Uses simple trend analysis
    """
    try:
        forecast_type = request.args.get('type', 'bookings').lower()
        days = int(request.args.get('days', 7))
        
        # Get historical data (last 30 days)
        historical = db.session.query(
            func.date(Passenger.booking_date).label('date'),
            func.count(Passenger.id).label('count')
        ).filter(
            Passenger.deleted_at.is_(None),
            Passenger.booking_date >= datetime.utcnow() - timedelta(days=30)
        ).group_by(func.date(Passenger.booking_date)).order_by(
            func.date(Passenger.booking_date)
        ).all()
        
        # Simple linear trend (average + trend)
        if len(historical) > 0:
            values = [h[1] for h in historical]
            avg_value = sum(values) / len(values)
            
            # Calculate trend
            if len(values) > 1:
                trend = (values[-1] - values[0]) / len(values)
            else:
                trend = 0
            
            # Generate forecast
            forecast_data = []
            today = datetime.utcnow().date()
            
            for i in range(days):
                forecast_date = today + timedelta(days=i+1)
                predicted_value = max(0, int(avg_value + (trend * (i + 1))))
                forecast_data.append({
                    'date': forecast_date.isoformat(),
                    'predicted': predicted_value,
                    'confidence_upper': int(predicted_value * 1.2),
                    'confidence_lower': max(0, int(predicted_value * 0.8))
                })
        else:
            forecast_data = []
        
        return jsonify({
            'type': forecast_type,
            'historical': [
                {
                    'date': h[0].isoformat() if isinstance(h[0], datetime) else str(h[0]),
                    'value': h[1]
                }
                for h in historical
            ],
            'forecast': forecast_data
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
