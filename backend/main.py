from flask import Flask
from flask_cors import CORS
from config.database import init_db
from app.routes.workspace_routes import workspace_bp
from app.routes.job_routes import job_bp
from app.routes.execution_routes import execution_bp
from app.routes.file_routes import file_routes
from app.routes.database_routes import database_bp
from app.routes.connection_routes import connection_bp
import os

from config.settings import config

def create_app():
    app = Flask(__name__)
    app.config.from_object(config)
    
    # Enable CORS
    CORS(app, resources={r"/api/*": {"origins": config.CORS_ORIGINS}})
    
    # Initialize database
    init_db(config.DATABASE_PATH)
    
    # Register blueprints
    app.register_blueprint(workspace_bp, url_prefix='/api')
    app.register_blueprint(job_bp, url_prefix='/api')
    app.register_blueprint(execution_bp, url_prefix='/api')
    app.register_blueprint(file_routes, url_prefix='/api/files')
    app.register_blueprint(database_bp, url_prefix='/api')
    app.register_blueprint(connection_bp)
    
    # Initialize Scheduler
    from app.services.scheduler_service import scheduler_service
    scheduler_service.init_app(app)
    
    @app.route('/')
    @app.route('/api')
    def root_status():
        return {'status': 'okay', 'message': 'Osmosis API is running'}, 200

    @app.route('/api/health')
    def health():
        return {'status': 'healthy'}, 200
    
    # Auto Import for Production
    with app.app_context():
        try:
            from app.utils.auto_importer import AutoImporter
            importer = AutoImporter(app)
            importer.run()
        except Exception as e:
            print(f"Auto-import failed: {e}")

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host=config.HOST, port=config.PORT, debug=config.DEBUG)
