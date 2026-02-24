"""
Elasticsearch search API endpoints
"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from utils.search import get_search_manager
from models import Passenger

search_bp = Blueprint('search', __name__)

@search_bp.route('/search', methods=['POST'])
@jwt_required()
def search():
    """Full-text search for passengers"""
    try:
        data = request.get_json()
        query = data.get('query', '')
        filters = data.get('filters', {})
        size = data.get('size', 50)
        from_ = data.get('from', 0)
        # Empty queries are allowed when fetching the default passenger list
        
        search_manager = get_search_manager()
        
        # Fallback to Database Search if ES is not available
        if not search_manager.client:
            print("[INFO] Elasticsearch unavailable, falling back to Database Search")
            from models import Passenger
            from sqlalchemy import or_, func
            
            # Simple fallback query
            db_query = Passenger.query.filter(Passenger.deleted_at.is_(None))
            
            if query:
                search_term = f"%{query}%"
                db_query = db_query.filter(or_(
                    Passenger.master_passenger_name.ilike(search_term),
                    Passenger.email_id.ilike(search_term),
                    Passenger.contact_number.ilike(search_term),
                    Passenger.city.ilike(search_term),
                    Passenger.state.ilike(search_term),
                    Passenger.package_name.ilike(search_term)
                ))
            
            # Apply basic filters if feasible
            if filters:
                 if filters.get('city'):
                     db_query = db_query.filter(Passenger.city == filters['city'])
                 if filters.get('state'):
                     db_query = db_query.filter(Passenger.state == filters['state'])
                 if filters.get('status'):
                    db_query = db_query.filter(Passenger.status == filters['status'])
                 if 'international' in filters and filters['international'] is not None:
                    db_query = db_query.filter(Passenger.international_client == filters['international'])
            
            # Apply sort
            sort_payload = data.get('sort', [])
            if sort_payload and isinstance(sort_payload, list):
                sort_item = sort_payload[0]
                for field, direction in sort_item.items():
                    if hasattr(Passenger, field):
                        column = getattr(Passenger, field)
                        if direction.lower() == 'desc':
                            db_query = db_query.order_by(column.desc())
                        else:
                            db_query = db_query.order_by(column.asc())
            else:
                db_query = db_query.order_by(Passenger.booking_date.desc())
            
            # Pagination
            total = db_query.count()
            passengers = db_query.offset(from_).limit(size).all()
            
            hits = []
            for p in passengers:
                hits.append({
                    'id': str(p.id),
                    'score': 1.0,  # Dummy score
                    **p.to_dict()
                })
                
            result = {
                'hits': hits,
                'total': total,
                'took': 0,
                'fallback': True
            }
        else:
            result = search_manager.search(query, filters, size, from_)
        
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({
            'error': str(e),
            'message': 'Search failed'
        }), 500

@search_bp.route('/suggest', methods=['POST'])
@jwt_required()
def suggest():
    """Get search suggestions"""
    try:
        data = request.get_json()
        query = data.get('query', '')
        
        if not query or len(query) < 2:
            return jsonify({
                'suggestions': []
            }), 200
        
        search_manager = get_search_manager()
        suggestions = search_manager.suggest(query)
        
        return jsonify({
            'suggestions': suggestions,
            'query': query
        }), 200
    
    except Exception as e:
        return jsonify({
            'error': str(e),
            'suggestions': []
        }), 500

@search_bp.route('/index/create', methods=['POST'])
@jwt_required()
def create_index():
    """Create search index"""
    try:
        search_manager = get_search_manager()
        success = search_manager.create_index()
        
        return jsonify({
            'success': success,
            'message': 'Index created successfully' if success else 'Index creation failed'
        }), 200 if success else 500
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@search_bp.route('/index/reindex', methods=['POST'])
@jwt_required()
def reindex():
    """Reindex all passengers"""
    try:
        # Get all passengers
        passengers = Passenger.query.filter(
            Passenger.deleted_at.is_(None)
        ).all()
        
        # Convert to dictionaries
        passengers_data = [p.to_dict() for p in passengers]
        
        search_manager = get_search_manager()
        success = search_manager.reindex(passengers_data)
        
        return jsonify({
            'success': success,
            'count': len(passengers_data),
            'message': f'Reindexed {len(passengers_data)} passengers' if success else 'Reindex failed'
        }), 200 if success else 500
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@search_bp.route('/index/delete', methods=['DELETE'])
@jwt_required()
def delete_index():
    """Delete search index"""
    try:
        search_manager = get_search_manager()
        success = search_manager.delete_index()
        
        return jsonify({
            'success': success,
            'message': 'Index deleted successfully' if success else 'Index deletion failed'
        }), 200 if success else 500
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
