from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, extract, and_, or_, case
from db import db
from models import Passenger, User
from datetime import datetime, timedelta
from utils.cache import cached

targeting_bp = Blueprint('targeting', __name__)

# Removed cache for real-time updates
def fetch_targeting_data(target_month, target_year):
    """
    Helper function to fetch and merge targeting data from multiple sources:
    1. Travel History (Anniversary of Travel)
    2. Birthdays (DOB in target month) - only if data exists
    3. Anniversaries (Anniversary Date in target month) - only if data exists
    """
    targets = {}

    try:
        # 1. Travel History Query
        history_query = db.session.query(
            Passenger.email_id,
            Passenger.master_passenger_name,
            Passenger.contact_number,
            func.count(Passenger.id).label('visit_count'),
            func.avg(Passenger.no_of_passenger).label('avg_pax'),
            func.max(Passenger.journey_date).label('last_visit'),
            func.avg(Passenger.journey_date - Passenger.booking_date).label('avg_lead_time'),
            func.avg(extract('day', Passenger.journey_date)).label('avg_journey_day'),
            func.max(Passenger.dob).label('dob'),
            func.max(Passenger.anniversary_date).label('anniversary'),
            func.max(Passenger.remarks).label('remarks'),
            func.max(Passenger.remarks_updated_at).label('remarks_updated_at'),
            func.max(Passenger.remarks_updated_by).label('remarks_updated_by')
        ).filter(
            Passenger.deleted_at.is_(None),
            Passenger.journey_date.isnot(None),
            extract('month', Passenger.journey_date) == target_month,
            extract('year', Passenger.journey_date) < target_year,
            Passenger.email_id.isnot(None),
            Passenger.status.notin_(['Cancelled', 'Can/Mod'])
        ).group_by(
            Passenger.email_id,
            Passenger.master_passenger_name,
            Passenger.contact_number
        ).all()

        for p in history_query:
            email, name, mobile, visits, avg_pax, last_visit, avg_lead_time_delta, avg_journey_day, dob, anniversary, remarks, remarks_updated_at, remarks_updated_by = p
            
            score = 0
            reasons = []
            
            # Frequency Score
            if visits >= 3:
                score += 50
                reasons.append("Regular traveler (3+ visits in this month)")
            elif visits == 2:
                score += 30
                reasons.append("Repeat traveler (2 visits in this month)")
            else:
                score += 10
                reasons.append("Visited once before in this month")

            # Recency Score
            if last_visit:
                last_visit_year = last_visit.year
                if last_visit_year == target_year - 1:
                    score += 30
                    reasons.append("Traveled last year")
                elif last_visit_year == target_year - 2:
                    score += 20
                    reasons.append("Skipped last year (Win-back)")
            else:
                last_visit_year = 'N/A'

            avg_lead_days = avg_lead_time_delta.days if avg_lead_time_delta is not None else 30
            historic_day = int(avg_journey_day) if avg_journey_day else 1
            
            targets[email] = {
                'name': name,
                'email': email,
                'mobile': mobile or 'N/A',
                'score': score,
                'reasons': reasons,
                'history': {
                    'visits': visits,
                    'last_visit_year': last_visit_year,
                    'avg_pax': round(float(avg_pax), 1) if avg_pax and avg_pax > 0 else 1
                },
                'personal': {
                    'dob': dob,
                    'anniversary': anniversary,
                    'remarks': remarks,
                    'remarks_updated_at': remarks_updated_at.isoformat() if remarks_updated_at else None,
                    'remarks_updated_by': remarks_updated_by
                },
                'insight': {
                    'avg_lead_time': avg_lead_days,
                    'historic_day': historic_day
                }
            }
    except Exception as e:
        print(f"Error in travel history query: {str(e)}")

    try:
        # 2. Birthday Query (only if DOB data exists)
        dob_query = db.session.query(
            Passenger.email_id,
            Passenger.master_passenger_name,
            Passenger.contact_number,
            func.max(Passenger.dob).label('dob')
        ).filter(
            Passenger.deleted_at.is_(None),
            Passenger.dob.isnot(None),
            extract('month', Passenger.dob) == target_month,
            Passenger.email_id.isnot(None),
            Passenger.status.notin_(['Cancelled', 'Can/Mod'])
        ).group_by(Passenger.email_id, Passenger.master_passenger_name, Passenger.contact_number).all()

        for p in dob_query:
            email, name, mobile, dob = p
            if email not in targets:
                targets[email] = {
                    'name': name,
                    'email': email,
                    'mobile': mobile or 'N/A',
                    'score': 0,
                    'reasons': [],
                    'history': {'visits': 0, 'last_visit_year': 'N/A', 'avg_pax': 1},
                    'personal': {'dob': dob, 'anniversary': None},
                    'insight': {'avg_lead_time': 30, 'historic_day': 1}
                }
            
            targets[email]['score'] += 25
            if "Birthday this month" not in targets[email]['reasons']:
                targets[email]['reasons'].append("Birthday this month")
            targets[email]['personal']['dob'] = dob
    except Exception as e:
        print(f"Error in birthday query: {str(e)}")

    try:
        # 3. Anniversary Query (only if anniversary data exists)
        anniv_query = db.session.query(
            Passenger.email_id,
            Passenger.master_passenger_name,
            Passenger.contact_number,
            func.max(Passenger.anniversary_date).label('anniversary')
        ).filter(
            Passenger.deleted_at.is_(None),
            Passenger.anniversary_date.isnot(None),
            extract('month', Passenger.anniversary_date) == target_month,
            Passenger.email_id.isnot(None),
            Passenger.status.notin_(['Cancelled', 'Can/Mod'])
        ).group_by(Passenger.email_id, Passenger.master_passenger_name, Passenger.contact_number).all()

        for p in anniv_query:
            email, name, mobile, anniversary = p
            if email not in targets:
                targets[email] = {
                    'name': name,
                    'email': email,
                    'mobile': mobile or 'N/A',
                    'score': 0,
                    'reasons': [],
                    'history': {'visits': 0, 'last_visit_year': 'N/A', 'avg_pax': 1},
                    'personal': {'dob': None, 'anniversary': anniversary},
                    'insight': {'avg_lead_time': 30, 'historic_day': 1}
                }
            
            targets[email]['score'] += 25
            if "Anniversary this month" not in targets[email]['reasons']:
                targets[email]['reasons'].append("Anniversary this month")
            targets[email]['personal']['anniversary'] = anniversary
    except Exception as e:
        print(f"Error in anniversary query: {str(e)}")

    # Final Processing
    results = []
    
    try:
        from calendar import monthrange
        
        for email, data in targets.items():
            # Cap score
            data['score'] = min(data['score'], 100)
            
            # Determine Probability
            if data['score'] >= 75:
                data['probability'] = 'High'
            elif data['score'] >= 40:
                data['probability'] = 'Medium'
            else:
                data['probability'] = 'Low'
                
            # Calculate Ideal Call Date (Historic Anchoring)
            lead_days = data['insight']['avg_lead_time']
            historic_day = data['insight'].get('historic_day', 1)
            
            # Safe date creation (clamping to max days in month)
            max_days = monthrange(target_year, target_month)[1]
            safe_day = min(historic_day, max_days)
            
            target_date = datetime(target_year, target_month, safe_day)
            
            # Formula: Target Date - Lead Time - 7 Days Buffer
            ideal_date = target_date - timedelta(days=lead_days) - timedelta(days=7)
            
            data['insight']['ideal_call_date'] = ideal_date.strftime('%Y-%m-%d')
            data['insight']['target_travel_date'] = target_date.strftime('%Y-%m-%d')
            
            # Format Dates
            if data['personal']['dob']:
                data['personal']['dob'] = data['personal']['dob'].isoformat()
            if data['personal']['anniversary']:
                data['personal']['anniversary'] = data['personal']['anniversary'].isoformat()
                
            results.append(data)
    except Exception as e:
        print(f"Error in final processing: {str(e)}")
        
    # Sort by score
    results.sort(key=lambda x: x['score'], reverse=True)
    return results

@targeting_bp.route('/predictions', methods=['GET'])
@jwt_required()
def get_predictions():
    """Get predicted targets"""
    try:
        target_month = request.args.get('month', type=int)
        target_year = request.args.get('year', type=int)
        
        if not target_month or not target_year:
            return jsonify({'error': 'Month and Year are required'}), 400

        predictions = fetch_targeting_data(target_month, target_year)
        return jsonify({'predictions': predictions}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@targeting_bp.route('/kpis', methods=['GET'])
@jwt_required()
def get_targeting_kpis():
    """Get KPIs based on merged targeting data"""
    try:
        target_month = request.args.get('month', type=int)
        target_year = request.args.get('year', type=int)
        
        if not target_month or not target_year:
            return jsonify({'error': 'Month and Year are required'}), 400
            
        # Use the same helper to ensure consistency (Now Cached!)
        targets = fetch_targeting_data(target_month, target_year)
        
        total_leads = len(targets)
        hot_leads = sum(1 for t in targets if t['probability'] == 'High')
        
        # Potential Pax
        potential_pax = sum(t['history']['avg_pax'] for t in targets)
        
        # Top Destinations (Still needs a separate query as it's city-based, not user-based)
        top_destinations = db.session.query(
            Passenger.city,
            func.count(Passenger.id).label('count')
        ).filter(
            Passenger.deleted_at.is_(None),
            extract('month', Passenger.journey_date) == target_month,
            extract('year', Passenger.journey_date) < target_year,
            Passenger.status.notin_(['Cancelled', 'Can/Mod'])
        ).group_by(Passenger.city).order_by(func.count(Passenger.id).desc()).limit(3).all()
        
        top_cities = [{'city': d[0], 'count': d[1]} for d in top_destinations]
        
        return jsonify({
            'total_leads': total_leads,
            'hot_leads': hot_leads,
            'potential_pax': int(potential_pax),
            'top_destinations': top_cities
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@targeting_bp.route('/update-info', methods=['POST'])
@jwt_required()
def update_passenger_info():
    """
    Update DOB, Anniversary Date, and Remarks for a passenger (by email).
    Updates all records for this passenger to keep data consistent.
    """
    try:
        data = request.get_json()
        email = data.get('email')
        dob_str = data.get('dob')
        anniversary_str = data.get('anniversary_date')
        remarks = data.get('remarks')
        
        if not email:
            return jsonify({'error': 'Email is required to identify the passenger'}), 400
            
        if not dob_str and not anniversary_str and remarks is None:
            return jsonify({'error': 'Provide at least DOB, Anniversary Date, or Remarks to update'}), 400

        # Parse dates
        dob = None
        anniversary = None
        
        if dob_str:
            try:
                dob = datetime.strptime(dob_str, '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Invalid DOB format. Use YYYY-MM-DD'}), 400
                
        if anniversary_str:
            try:
                anniversary = datetime.strptime(anniversary_str, '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Invalid Anniversary Date format. Use YYYY-MM-DD'}), 400

        # Find all records for this passenger
        passengers = Passenger.query.filter(
            Passenger.email_id == email,
            Passenger.deleted_at.is_(None)
        ).all()
        
        if not passengers:
            return jsonify({'error': 'Passenger not found'}), 404
            
        # Update all records
        count = 0
        for p in passengers:
            if dob:
                p.dob = dob
            if anniversary:
                p.anniversary_date = anniversary
            if remarks is not None:
                p.remarks = remarks
                p.remarks_updated_at = datetime.utcnow()

                
                # Get username from current user ID
                current_user_id = get_jwt_identity()
                current_user = User.query.get(current_user_id)
                p.remarks_updated_by = current_user.username if current_user else 'Unknown'
            count += 1
            
        
        # Log remark update (once per batch for productivity tracking)
        if remarks is not None and passengers:
            from utils.audit import log_audit_event
            # Get current user again to be safe (though inside loop we already got it, optimization possible but this is cleaner)
            current_user_id = get_jwt_identity()
            
            log_audit_event(
                user_id=str(current_user_id),
                action="Update Remarks",
                resource_type="passenger",
                resource_id=str(passengers[0].id), # Link to at least one passenger
                details={
                    'new_remarks': remarks[:50] + '...' if len(remarks) > 50 else remarks,
                    'update_method': 'Advance Target (Bulk)',
                    'affected_count': count
                }
            )

        db.session.commit()
        
        return jsonify({
            'message': 'Passenger information updated successfully',
            'updated_count': count
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
