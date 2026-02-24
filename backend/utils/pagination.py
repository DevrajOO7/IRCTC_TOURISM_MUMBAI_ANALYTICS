from flask import request

class Paginator:
    """Pagination helper"""
    
    DEFAULT_PER_PAGE = 50
    MAX_PER_PAGE = 100
    
    @staticmethod
    def get_pagination_params():
        """Extract pagination params from request"""
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', Paginator.DEFAULT_PER_PAGE, type=int)
        
        # Validate
        if page < 1:
            page = 1
        if per_page < 1:
            per_page = Paginator.DEFAULT_PER_PAGE
        if per_page > Paginator.MAX_PER_PAGE:
            per_page = Paginator.MAX_PER_PAGE
        
        return page, per_page
    
    @staticmethod
    def paginate_query(query, page, per_page):
        """Paginate a SQLAlchemy query"""
        total = query.count()
        items = query.offset((page - 1) * per_page).limit(per_page).all()
        
        return {
            'data': [item.to_dict() for item in items],
            'page': page,
            'per_page': per_page,
            'total': total,
            'pages': (total + per_page - 1) // per_page
        }
