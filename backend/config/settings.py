import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    # Server Configuration
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', 5001))
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
    
    # Detect if running on Vercel (read-only filesystem)
    IS_VERCEL = os.environ.get('VERCEL') == '1'

    # Database Configuration
    # Supabase uses POSTGRES_URL_NON_POOLING or DATABASE_URL
    db_url = os.getenv('DATABASE_URL') or os.getenv('POSTGRES_URL_NON_POOLING')
    
    if db_url:
        # SQLAlchemy 1.4+ requires postgresql:// instead of postgres://
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
        DATABASE_PATH = db_url
        UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', '/tmp/uploads' if IS_VERCEL else 'uploads')
    else:
        # Fallback to SQLite
        if IS_VERCEL:
            DATABASE_PATH = os.getenv('DATABASE_PATH', '/tmp/osmosis.db')
            UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', '/tmp/uploads')
        else:
            DATABASE_PATH = os.getenv('DATABASE_PATH', './data/osmosis.db')
            UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
    
    # Security
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    
    @staticmethod
    def ensure_dirs():
        """Ensure necessary directories exist."""
        try:
            os.makedirs(os.path.dirname(Config.DATABASE_PATH), exist_ok=True)
            os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
        except OSError as e:
            # Handle strictly read-only environments gracefully
            print(f"Directory creation skipped or failed: {e}")

# Global config instance
config = Config()
Config.ensure_dirs()
