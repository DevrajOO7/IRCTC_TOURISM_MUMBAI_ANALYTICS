from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_, and_, func, Index
from db import db
from models import Passenger, User
from utils.pagination import Paginator
from utils.validators import Validators
from datetime import datetime
from utils.cache import cached

passenger_bp = Blueprint('passengers', __name__)

@passenger_bp.route('/search', methods=['GET'])
@jwt_required()
def search_passengers():
    """
    Search passengers with filters
    Query params:
    - name: passenger name (ILIKE)
    - city: city (ILIKE)
    - state: state (ILIKE)
    - status: exact match (ignore if "All")
    - international: yes/no/all
    - page: default 1
    - per_page: default 50, max 100
    - sort_by: field to sort by (default: booking_date)
    - sort_dir: asc/desc (default: desc)
    """
    try:
        # Get pagination params
        page, per_page = Paginator.get_pagination_params()
        
        # Build base query (exclude soft-deleted)
        query = Passenger.query.filter(Passenger.deleted_at.is_(None))
        
        # Apply filters
        name = request.args.get('name', '').strip()
        if name:
            query = query.filter(
                func.lower(Passenger.master_passenger_name).ilike(f'%{name.lower()}%')
            )
        
        city = request.args.get('city', '').strip()
        if city:
            query = query.filter(
                func.lower(Passenger.city).ilike(f'%{city.lower()}%')
            )
        
        state = request.args.get('state', '').strip()
        if state:
            query = query.filter(
                func.lower(Passenger.state).ilike(f'%{state.lower()}%')
            )
        
        destination_point = request.args.get('destination_point', '').strip()
        if destination_point:
            query = query.filter(
                func.lower(Passenger.destination_point).ilike(f'%{destination_point.lower()}%')
            )
        
        status = request.args.get('status', '').strip()
        if status and status.lower() != 'all':
            query = query.filter(
                func.lower(Passenger.status).ilike(f'%{status.lower()}%')
            )
        
        international = request.args.get('international', '').strip().lower()
        if international and international != 'all':
            intl_value = international in ['yes', 'true', '1']
            query = query.filter(Passenger.international_client == intl_value)
        
        # Apply sorting
        sort_by = request.args.get('sort_by', 'booking_date').strip()
        sort_dir = request.args.get('sort_dir', 'desc').strip().lower()
        
        # Validate sort_by to prevent SQL injection
        valid_sort_fields = [
            'booking_date', 'journey_date', 'master_passenger_name', 
            'age', 'city', 'state', 'status', 'created_at'
        ]
        if sort_by not in valid_sort_fields:
            sort_by = 'booking_date'
        
        sort_column = getattr(Passenger, sort_by)
        if sort_dir == 'asc':
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())
        
        # Paginate
        result = Paginator.paginate_query(query, page, per_page)
        
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@passenger_bp.route('', methods=['GET'])
@jwt_required()
def get_passengers():
    """Get all passengers (paginated)"""
    try:
        page, per_page = Paginator.get_pagination_params()
        query = Passenger.query.filter(Passenger.deleted_at.is_(None)).order_by(Passenger.booking_date.desc())
        result = Paginator.paginate_query(query, page, per_page)
        return jsonify(result), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

@passenger_bp.route('/<passenger_id>', methods=['GET'])
@jwt_required()
def get_passenger(passenger_id):
    """Get single passenger"""
    passenger = Passenger.query.filter_by(id=passenger_id, deleted_at=None).first()
    
    if not passenger:
        return jsonify({'error': 'Passenger not found'}), 404
    
    return jsonify(passenger.to_dict()), 200

@passenger_bp.route('', methods=['POST'])
@jwt_required()
def create_passenger():
    """Create new passenger"""
    user_id = get_jwt_identity()
    user = User.query.filter_by(id=user_id).first()
    
    if not user or user.role not in ['admin', 'manager', 'viewer']:
        return jsonify({'error': 'Permission denied. Only Admins, Managers, and Viewers can create passengers.'}), 403

    data = request.get_json()
    
    if not data or not data.get('master_passenger_name'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        age_val = int(data['age']) if data.get('age') else None
        pax_count_val = int(data['no_of_passenger']) if data.get('no_of_passenger') else 1
    except ValueError:
        return jsonify({'error': 'Invalid format for Age or No of Passengers'}), 400

    try:
        passenger = Passenger(
            user_id=data.get('user_id', 'system'),
            transcation_id=data.get('transcation_id', f'TXN_{datetime.utcnow().timestamp()}'),
            master_passenger_name=data['master_passenger_name'],
            age=age_val,
            dob=datetime.strptime(data['dob'], '%d/%m/%Y').date() if data.get('dob') else None,
            anniversary_date=datetime.strptime(data['anniversary_date'], '%d/%m/%Y').date() if data.get('anniversary_date') else None,
            gender=data.get('gender'),
            email_id=data.get('email_id'),
            contact_number=data.get('contact_number'),
            no_of_passenger=pax_count_val,
            booking_date=datetime.strptime(data['booking_date'], '%d/%m/%Y') if data.get('booking_date') else datetime.utcnow(),
            journey_date=datetime.strptime(data['journey_date'], '%d/%m/%Y') if data.get('journey_date') else None,
            boarding_point=data.get('boarding_point'),
            destination_point=data.get('destination_point'),
            city=data.get('city', 'Unknown'),
            state=data.get('state', 'Unknown'),
            package_code=data.get('package_code'),
            package_name=data.get('package_name'),
            package_class=data.get('package_class'),
            status=data.get('status', 'Pending'),
            nominee_name=data.get('nominee_name'),
            nominee_relation=data.get('nominee_relation'),
            nominee_contact=data.get('nominee_contact'),
            international_client=data.get('international_client', False),
            remarks=data.get('remarks')
        )
        
        
        db.session.add(passenger)
        db.session.flush()
        
        db.session.commit()
        
        # Log remark creation if present
        if data.get('remarks'):
            from utils.audit import log_audit_event
            log_audit_event(
                user_id=str(user.id),
                action="Update Remarks",
                resource_type="passenger",
                resource_id=str(passenger.id),
                details={'new_remarks': data['remarks'][:50] + '...' if len(data['remarks']) > 50 else data['remarks']}
            )

        # Sync with Elasticsearch (Index new passenger)
        try:
            from utils.search import get_search_manager
            search_manager = get_search_manager()
            if search_manager:
                search_manager.index_passenger(passenger.to_dict())
        except Exception as e:
            print(f"Search sync error (create): {e}")
        
        return jsonify({
            'message': 'Passenger created successfully',
            'passenger': passenger.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@passenger_bp.route('/<passenger_id>', methods=['PUT'])
@jwt_required()
def update_passenger(passenger_id):
    """Update passenger"""
    user_id = get_jwt_identity()
    user = User.query.filter_by(id=user_id).first()
    
    if not user or user.role not in ['admin', 'manager']:
        return jsonify({'error': 'Permission denied. Only Admins and Managers can update passengers.'}), 403

    passenger = Passenger.query.filter_by(id=passenger_id, deleted_at=None).first()
    
    if not passenger:
        return jsonify({'error': 'Passenger not found'}), 404
    
    data = request.get_json()
    
    try:
    # Define allowed fields and their conversion logic
        field_mappings = {
            'master_passenger_name': None,
            'age': lambda x: int(x) if x else None,
            'dob': lambda x: datetime.strptime(x, '%d/%m/%Y').date() if x else None,
            'anniversary_date': lambda x: datetime.strptime(x, '%d/%m/%Y').date() if x else None,
            'gender': None,
            'email_id': None,
            'contact_number': None,
            'no_of_passenger': lambda x: int(x) if x else 1,
            'booking_date': lambda x: datetime.strptime(x, '%d/%m/%Y') if x else None,
            'journey_date': lambda x: datetime.strptime(x, '%d/%m/%Y') if x else None,
            'boarding_point': None,
            'destination_point': None,
            'city': None,
            'state': None,
            'package_code': None,
            'package_name': None,
            'package_class': None,
            'status': None,
            'nominee_name': None,
            'nominee_relation': None,
            'nominee_contact': None,
            'international_client': None
        }

        # Update standard fields
        for field, converter in field_mappings.items():
            if field in data:
                val = data[field]
                try:
                    if converter:
                        val = converter(val)
                    setattr(passenger, field, val)
                except ValueError as e:
                    return jsonify({'error': f"Invalid format for {field}: {str(e)}"}), 400

        # Handle remarks separately for special logging/sync logic
        if 'remarks' in data:
            passenger.remarks = data['remarks']
            passenger.remarks_updated_at = datetime.utcnow()
            passenger.remarks_updated_by = user.username
            
            if passenger.email_id:
                other_passengers = Passenger.query.filter(
                    Passenger.email_id == passenger.email_id,
                    Passenger.id != passenger.id,
                    Passenger.deleted_at.is_(None)
                ).all()
                for p in other_passengers:
                    p.remarks = data['remarks']
                    p.remarks_updated_at = datetime.utcnow()
                    p.remarks_updated_by = user.username
            
            # Log specific audit event for productivity tracking
            from utils.audit import log_audit_event
            log_audit_event(
                user_id=str(user.id),
                action="Update Remarks",
                resource_type="passenger",
                resource_id=str(passenger.id),
                details={'new_remarks': data['remarks'][:50] + '...' if len(data['remarks']) > 50 else data['remarks']}
            )
            
        passenger.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Passenger updated successfully',
            'passenger': passenger.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@passenger_bp.route('/<passenger_id>', methods=['DELETE'])
@jwt_required()
def delete_passenger(passenger_id):
    """Soft delete passenger"""
    user_id = get_jwt_identity()
    user = User.query.filter_by(id=user_id).first()
    
    if not user or user.role != 'admin':
        return jsonify({'error': 'Permission denied. Only Admins can delete passengers.'}), 403

    passenger = Passenger.query.filter_by(id=passenger_id, deleted_at=None).first()
    
    if not passenger:
        return jsonify({'error': 'Passenger not found'}), 404
    
    try:
        # Soft delete
        passenger.deleted_at = datetime.utcnow()
        db.session.flush()
        
        db.session.commit()
        
        # Sync with Elasticsearch (Remove from index)
        try:
            from utils.search import get_search_manager
            search_manager = get_search_manager()
            if search_manager:
                search_manager.delete_passenger(passenger_id)
        except Exception as e:
            print(f"Search sync error (delete): {e}")

        return jsonify({'message': 'Passenger deleted successfully'}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@passenger_bp.route('/stats/summary', methods=['GET'])
@jwt_required()
@cached(timeout=300, key_prefix='passenger_stats')
def get_passenger_stats():
    """Get passenger statistics"""
    try:
        # Optimized count query
        total = db.session.query(func.count(Passenger.id)).filter(Passenger.deleted_at.is_(None)).scalar()
        international = db.session.query(func.count(Passenger.id)).filter(
            and_(Passenger.deleted_at.is_(None), Passenger.international_client == True)
        ).scalar()
        domestic = total - international
        
        return jsonify({
            'total': total,
            'international': international,
            'domestic': domestic
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
