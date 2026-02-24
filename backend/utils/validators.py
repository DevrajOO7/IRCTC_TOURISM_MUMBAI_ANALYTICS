import re
from datetime import datetime

class Validators:
    """Validation utilities"""
    
    @staticmethod
    def validate_email(email):
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    @staticmethod
    def validate_phone(phone):
        """Validate phone number (basic)"""
        # Remove common separators
        cleaned = re.sub(r'[\s\-\(\)\.]+', '', phone)
        # Check if it's 10+ digits
        return re.match(r'^\+?1?\d{9,}$', cleaned) is not None
    
    @staticmethod
    def validate_date(date_str, format='%Y-%m-%d'):
        """Validate date format"""
        try:
            datetime.strptime(date_str, format)
            return True
        except ValueError:
            return False
    
    @staticmethod
    def validate_status(status):
        """Validate passenger status"""
        valid_statuses = ['Delivered', 'Can/Mod', 'Pending', 'Booked', 'Travelled', 'Cancelled']
        return status in valid_statuses
    
    @staticmethod
    def validate_international(value):
        """Validate international flag"""
        if isinstance(value, bool):
            return True
        if isinstance(value, str):
            return value.lower() in ['yes', 'no', 'true', 'false', '1', '0']
        return False
