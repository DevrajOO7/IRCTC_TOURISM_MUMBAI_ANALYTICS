import os
from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from config import config
from db import db, init_db
import models  # Import models so create_all knows about them
from utils.cache import init_cache
from utils.backup import init_backup
from utils.search import init_search
from utils.monitoring import init_monitoring

def create_app(config_name=None):
    """Application factory"""
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    
    app = Flask(__name__, static_folder='../frontend/build', static_url_path='')
    
    # Load config
    app.config.from_object(config[config_name])
    app.config['SQLALCHEMY_ECHO'] = False
    
    # Initialize extensions
    db.init_app(app)
    
    # Enhanced CORS configuration for network access
    # Allow requests from localhost:3000 (React default) and potentially other local network IPs if needed
    # Using specific list or wildcard for development
    CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000", "*"]}})
    jwt = JWTManager(app)
    
    # Initialize database
    with app.app_context():
        db.create_all()
        
        # Initialize new features
        init_cache(app)
        init_backup(app)
        init_search(app)
        init_monitoring(app)
    
    # Register blueprints
    from routes.auth_routes import auth_bp
    from routes.user_routes import user_bp
    from routes.passenger_routes import passenger_bp
    from routes.analytics_routes import analytics_bp
    from routes.export_routes import export_bp
    from routes.admin_routes import admin_bp
    from routes.reports_routes import reports_bp
    from routes.analytics_endpoints import analytics_bp as analytics_advanced_bp

    from routes.backup_routes import backup_bp
    from routes.search_routes import search_bp
    from routes.monitoring_routes import monitoring_bp
    from routes.targeting_routes import targeting_bp
    from routes.audit_routes import audit_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')

    app.register_blueprint(user_bp, url_prefix='/api/users')
    app.register_blueprint(passenger_bp, url_prefix='/api/passengers')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(analytics_advanced_bp, url_prefix='/api/analytics/advanced')
    app.register_blueprint(export_bp, url_prefix='/api/export')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')

    app.register_blueprint(backup_bp, url_prefix='/api/backup')
    app.register_blueprint(search_bp, url_prefix='/api/search')
    app.register_blueprint(monitoring_bp, url_prefix='/api/monitoring')
    app.register_blueprint(targeting_bp, url_prefix='/api/targeting')
    app.register_blueprint(audit_bp, url_prefix='/api/audit')
    
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health():
        return jsonify({'status': 'ok', 'message': 'Passenger Analytics API is running'}), 200

    # Serve React App
    # Root endpoint for API check
    @app.route('/')
    def serve():
        return jsonify({
            'status': 'ok',
            'message': 'Passenger Analytics API is running',
            'version': '1.0.0'
        }), 200

    @app.before_request
    def log_request_info():
        pass

    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Internal server error', 'details': str(error)}), 500
    
    return app

class ExceptionLoggingMiddleware:
    def __init__(self, app):
        self.app = app

    def __call__(self, environ, start_response):
        try:
            return self.app(environ, start_response)
        except Exception as e:
            import traceback
            with open('wsgi_error.log', 'w') as f:
                f.write(traceback.format_exc())
            raise

app = create_app()
app.wsgi_app = ExceptionLoggingMiddleware(app.wsgi_app)

if __name__ == '__main__':
    host = os.getenv('SERVER_HOST', '0.0.0.0')
    port = int(os.getenv('SERVER_PORT', 5000))
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(host=host, port=port, debug=debug_mode)
