from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import func, extract, and_, or_
from db import db
from models import Passenger
from datetime import datetime, timedelta
from utils.analytics_helper import apply_common_filters
from utils.cache import cache

analytics_bp = Blueprint('analytics', __name__)



# REAL IMPLEMENTATION BELOW
@analytics_bp.route('/kpis', methods=['GET'])
@jwt_required()
@cache.cached(timeout=30, query_string=True)
def get_kpis():
    """Get key performance indicators"""
    try:
        year = request.args.get('year', type=int)
        client_type = request.args.get('clientType')
        
        base_query = Passenger.query.filter(Passenger.deleted_at.is_(None))
        query = apply_common_filters(base_query, year, client_type)
        
        total_passengers = query.count()
        total_bookings = query.count()
        
        # Total travelers (sum of no_of_passenger)
        travelers_query = db.session.query(func.sum(Passenger.no_of_passenger)).filter(Passenger.deleted_at.is_(None))
        travelers_query = apply_common_filters(travelers_query, year, client_type)
        total_travelers = travelers_query.scalar() or 0
        
        # International vs Domestic
        intl_query = query.filter(Passenger.international_client == True)
        international_count = intl_query.count()
        
        dom_query = query.filter(Passenger.international_client == False)
        domestic_count = dom_query.count()
        
        # Status breakdown
        delivered = query.filter(func.lower(Passenger.status).ilike('%delivered%')).count()
        cancelled = query.filter(
            or_(
                func.lower(Passenger.status).ilike('%cancel%'),
                func.lower(Passenger.status).ilike('%can/mod%')
            )
        ).count()
        pending = query.filter(func.lower(Passenger.status).ilike('%pending%')).count()
        
        # Average age
        age_query = db.session.query(func.avg(Passenger.age)).filter(
            and_(Passenger.deleted_at.is_(None), Passenger.age.isnot(None))
        )
        age_query = apply_common_filters(age_query, year, client_type)
        avg_age = age_query.scalar() or 0
        
        # Gender breakdown
        gender_query = db.session.query(Passenger.gender, func.count(Passenger.id)).filter(Passenger.deleted_at.is_(None))
        gender_query = apply_common_filters(gender_query, year, client_type)
        gender_counts = gender_query.group_by(Passenger.gender).all()
        
        male_count = 0
        female_count = 0
        
        for gender, count in gender_counts:
            if gender and gender.lower() == 'male':
                male_count += count
            elif gender and gender.lower() == 'female':
                female_count += count
        
        return jsonify({
            'total_passengers': total_passengers,
            'total_bookings': total_bookings,
            'total_travelers': int(total_travelers),
            'international': international_count,
            'domestic': domestic_count,
            'status': {
                'delivered': delivered,
                'cancelled': cancelled,
                'pending': pending
            },
            'gender': {
                'male': male_count,
                'female': female_count
            },
            'average_age': round(float(avg_age), 2) if avg_age else 0
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/status-breakdown', methods=['GET'])
@jwt_required()
@cache.cached(timeout=30, query_string=True)
def get_status_breakdown():
    """Get status breakdown"""
    try:
        year = request.args.get('year', type=int)
        client_type = request.args.get('clientType')

        query = db.session.query(func.initcap(Passenger.status), func.count(Passenger.id)).filter(
            Passenger.deleted_at.is_(None)
        )
        query = apply_common_filters(query, year, client_type)
        statuses = query.group_by(func.initcap(Passenger.status)).all()
        
        breakdown = [
            {'status': status, 'count': count}
            for status, count in statuses
        ]
        
        return jsonify({'breakdown': breakdown}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/city-trends', methods=['GET'])
@jwt_required()
@cache.cached(timeout=30, query_string=True)
def get_city_trends():
    """Get top cities by passenger count"""
    try:
        limit = request.args.get('limit', 10, type=int)
        year = request.args.get('year', type=int)
        client_type = request.args.get('clientType')
        
        query = db.session.query(
            func.upper(Passenger.city).label('city'),
            func.count(Passenger.id).label('count'),
            func.sum(Passenger.no_of_passenger).label('travelers')
        ).filter(
            and_(
                Passenger.deleted_at.is_(None),
                Passenger.city.isnot(None),
                Passenger.city != '',
                func.lower(Passenger.city) != 'nan',
                func.lower(Passenger.city) != 'none',
                func.lower(Passenger.city) != 'null'
            )
        )
        
        query = apply_common_filters(query, year, client_type)
        
        cities = query.group_by(func.upper(Passenger.city)).order_by(
            func.count(Passenger.id).desc()
        ).limit(limit).all()
        
        trends = [
            {
                'city': city,
                'bookings': count,
                'travelers': int(travelers) if travelers else 0
            }
            for city, count, travelers in cities
        ]
        
        return jsonify({'trends': trends}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/monthly-trends/<int:year>', methods=['GET'])
@jwt_required()
@cache.cached(timeout=60, query_string=True)
def get_monthly_trends(year):
    """Get monthly booking trends for a year"""
    try:
        client_type = request.args.get('clientType')
        
        query = db.session.query(
            extract('month', Passenger.journey_date).label('month'),
            func.count(Passenger.id).label('bookings'),
            func.sum(Passenger.no_of_passenger).label('travelers')
        ).filter(
            and_(
                Passenger.deleted_at.is_(None),
                extract('year', Passenger.journey_date) == year
            )
        )
        
        # Apply only client_type filter here as year is already handled
        query = apply_common_filters(query, None, client_type)
        
        monthly_data = query.group_by(
            extract('month', Passenger.journey_date)
        ).order_by(
            extract('month', Passenger.journey_date)
        ).all()
        
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        trends = []
        for month_num in range(1, 13):
            month_data = next((d for d in monthly_data if d[0] == month_num), None)
            trends.append({
                'month': months[month_num - 1],
                'month_num': month_num,
                'bookings': month_data[1] if month_data else 0,
                'travelers': int(month_data[2]) if month_data and month_data[2] else 0
            })
        
        return jsonify({'year': year, 'trends': trends}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/frequent-travelers/<int:min_trips>', methods=['GET'])
@jwt_required()
@cache.cached(timeout=30, query_string=True)
def get_frequent_travelers(min_trips):
    """Get passengers with minimum number of trips"""
    try:
        limit = request.args.get('limit', 20, type=int)
        year = request.args.get('year', type=int)
        client_type = request.args.get('clientType')
        
        query = db.session.query(
            Passenger.master_passenger_name,
            Passenger.email_id,
            func.count(Passenger.id).label('trips'),
            func.sum(Passenger.no_of_passenger).label('total_travelers')
        ).filter(
            Passenger.deleted_at.is_(None)
        )
        
        query = apply_common_filters(query, year, client_type)
        
        frequent = query.group_by(
            Passenger.master_passenger_name,
            Passenger.email_id
        ).having(
            func.count(Passenger.id) >= min_trips
        ).order_by(
            func.count(Passenger.id).desc()
        ).limit(limit).all()
        
        travelers = [
            {
                'name': name,
                'email': email,
                'trips': trips,
                'total_travelers': int(total) if total else 0
            }
            for name, email, trips, total in frequent
        ]
        
        return jsonify({'travelers': travelers}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/package-popularity', methods=['GET'])
@jwt_required()
@cache.cached(timeout=30, query_string=True)
def get_package_popularity():
    """Get most popular packages"""
    try:
        limit = request.args.get('limit', 10, type=int)
        year = request.args.get('year', type=int)
        client_type = request.args.get('clientType')
        
        query = db.session.query(
            Passenger.package_name,
            func.count(Passenger.id).label('bookings'),
            func.sum(Passenger.no_of_passenger).label('travelers')
        ).filter(
            and_(
                Passenger.deleted_at.is_(None),
                Passenger.package_name.isnot(None),
                Passenger.package_name != '',
                func.lower(Passenger.package_name) != 'nan'
            )
        )
        
        query = apply_common_filters(query, year, client_type)
        
        packages = query.group_by(
            Passenger.package_name
        ).order_by(
            func.count(Passenger.id).desc()
        ).limit(limit).all()
        
        popular = [
            {
                'code': name[:3].upper() if name else 'UNK',
                'name': name,
                'bookings': bookings,
                'travelers': int(travelers) if travelers else 0
            }
            for name, bookings, travelers in packages
        ]
        
        return jsonify({'packages': popular}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/advanced-insights', methods=['GET'])
@jwt_required()
@cache.cached(timeout=60, query_string=True)
def get_advanced_insights():
    """Get advanced analytics including lead time, age groups, etc."""
    try:
        year = request.args.get('year', type=int)
        client_type = request.args.get('clientType')
        
        # Base query
        base_query = Passenger.query.filter(Passenger.deleted_at.is_(None))
        base_query = apply_common_filters(base_query, year, client_type)
        
        # 1. Lead Time Analysis (Booking Date vs Journey Date)
        lead_time_query = db.session.query(
            (Passenger.journey_date - Passenger.booking_date).label('lead_time')
        ).filter(
            and_(
                Passenger.deleted_at.is_(None),
                Passenger.journey_date.isnot(None),
                Passenger.booking_date.isnot(None)
            )
        )
        lead_time_query = apply_common_filters(lead_time_query, year, client_type)
        lead_times = lead_time_query.all()
        
        lead_time_buckets = {
            '0-7 Days': 0,
            '8-30 Days': 0,
            '1-3 Months': 0,
            '3+ Months': 0
        }
        
        total_lead_days = 0
        count_lead_days = 0
        
        for lt in lead_times:
            if lt.lead_time:
                days = lt.lead_time.days
                if days < 0: continue
                
                total_lead_days += days
                count_lead_days += 1
                
                if days <= 7:
                    lead_time_buckets['0-7 Days'] += 1
                elif days <= 30:
                    lead_time_buckets['8-30 Days'] += 1
                elif days <= 90:
                    lead_time_buckets['1-3 Months'] += 1
                else:
                    lead_time_buckets['3+ Months'] += 1
                    
        avg_lead_time = round(total_lead_days / count_lead_days) if count_lead_days > 0 else 0
        
        # 2. Age Groups
        age_query = db.session.query(Passenger.age).filter(
            and_(
                Passenger.deleted_at.is_(None),
                Passenger.age.isnot(None)
            )
        )
        age_query = apply_common_filters(age_query, year, client_type)
        ages = age_query.all()
        
        age_groups = {
            '0-18': 0,
            '19-35': 0,
            '36-50': 0,
            '51-65': 0,
            '65+': 0
        }
        
        for a in ages:
            age = a.age
            if age is None: continue
            
            if age <= 18:
                age_groups['0-18'] += 1
            elif age <= 35:
                age_groups['19-35'] += 1
            elif age <= 50:
                age_groups['36-50'] += 1
            elif age <= 65:
                age_groups['51-65'] += 1
            else:
                age_groups['65+'] += 1

        # 3. State Distribution
        state_query = db.session.query(
            func.upper(Passenger.state).label('state'),
            func.count(Passenger.id).label('count')
        ).filter(
            and_(
                Passenger.deleted_at.is_(None),
                Passenger.state.isnot(None),
                Passenger.state != ''
            )
        )
        state_query = apply_common_filters(state_query, year, client_type)
        states = state_query.group_by(func.upper(Passenger.state)).order_by(func.count(Passenger.id).desc()).limit(10).all()
        
        state_data = [{'name': s[0], 'value': s[1]} for s in states]

        # 4. Package Class Preference
        class_query = db.session.query(
            Passenger.package_class,
            func.count(Passenger.id)
        ).filter(
            and_(
                Passenger.deleted_at.is_(None),
                Passenger.package_class.isnot(None),
                Passenger.package_class != ''
            )
        )
        class_query = apply_common_filters(class_query, year, client_type)
        classes = class_query.group_by(Passenger.package_class).all()
        
        class_data = [{'name': c[0], 'value': c[1]} for c in classes]

        return jsonify({
            'lead_time': {
                'average_days': avg_lead_time,
                'distribution': [{'name': k, 'value': v} for k, v in lead_time_buckets.items()]
            },
            'age_groups': [{'name': k, 'value': v} for k, v in age_groups.items()],
            'top_states': state_data,
            'package_classes': class_data
        }), 200

    except Exception as e:
        print(f"Error in advanced insights: {str(e)}")
        return jsonify({'error': str(e)}), 500
