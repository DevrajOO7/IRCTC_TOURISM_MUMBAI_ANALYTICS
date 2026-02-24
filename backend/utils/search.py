"""
Elasticsearch integration removed for Vercel/Render compatibility.
This is a stub to satisfy existing imports. The application routes
already have SQL fallbacks when self.client is None.
"""

class SearchManager:
    """Mock SearchManager without Elasticsearch"""
    
    def __init__(self, hosts=None):
        self.client = None
        self.hosts = []
        self.index_name = 'passengers'
    
    def connect(self):
        pass
    
    def create_index(self):
        return False

    def index_audit_log(self, log_data):
        return False

    def search_audit_logs(self, query=None, filters=None, size=20, from_=0):
        return None

    def get_audit_aggregations(self, user_id, action=None, interval='day'):
        return None
    
    def index_passenger(self, passenger_data):
        return False

    def delete_passenger(self, passenger_id):
        return False
    
    def bulk_index(self, passengers):
        return False
    
    def search(self, query, filters=None, size=50, from_=0, sort=None):
        return {'hits': [], 'total': 0, 'error': 'No search client'}
    
    def suggest(self, query):
        return []
    
    def delete_index(self):
        return False
    
    def reindex(self, passengers):
        return False

# Global search manager instance
search_manager = None

def init_search(app):
    """Initialize search manager with Flask app"""
    global search_manager
    search_manager = SearchManager()
    return search_manager

def get_search_manager():
    """Get search manager instance"""
    global search_manager
    if search_manager is None:
        search_manager = SearchManager()
    return search_manager
