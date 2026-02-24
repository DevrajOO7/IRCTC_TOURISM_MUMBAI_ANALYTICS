from datetime import datetime, timedelta
from sqlalchemy import extract
from models import Passenger

def parse_date_range(from_date_str, to_date_str, default_days=30):
    """
    Parse date range strings into datetime objects.
    
    Args:
        from_date_str (str): ISO format date string or empty
        to_date_str (str): ISO format date string or empty
        default_days (int): Number of days to look back if from_date is missing
        
    Returns:
        tuple: (from_dt, to_dt) as datetime objects
    """
    # Parse to_date
    if to_date_str:
        try:
            to_dt = datetime.fromisoformat(to_date_str)
        except (ValueError, TypeError):
            to_dt = datetime.utcnow()
    else:
        to_dt = datetime.utcnow()
    
    # Parse from_date
    if from_date_str:
        try:
            from_dt = datetime.fromisoformat(from_date_str)
        except (ValueError, TypeError):
            from_dt = to_dt - timedelta(days=default_days)
    else:
        from_dt = to_dt - timedelta(days=default_days)
        
    return from_dt, to_dt

def apply_common_filters(query, year=None, client_type=None):
    """
    Apply common filters to analytics queries.
    
    Args:
        query: SQLAlchemy query object
        year (int): Year to filter by (optional)
        client_type (str): 'international', 'domestic', or 'all' (optional)
        
    Returns:
        Modified query object
    """
    if year:
        # Ensure we are filtering by the year of the journey date
        query = query.filter(extract('year', Passenger.journey_date) == year)
    
    if client_type and client_type != 'all':
        if client_type == 'international':
            query = query.filter(Passenger.international_client == True)
        elif client_type == 'domestic':
            query = query.filter(Passenger.international_client == False)
            
    return query
