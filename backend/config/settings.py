import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    # Server Configuration
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', 5001))
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
    
    # Database Configuration
    DATABASE_PATH = os.getenv('DATABASE_PATH', './data/osmosis.db')
    
    # Security
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    
    # File Paths
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
    
    @staticmethod
    def ensure_dirs():
        """Ensure necessary directories exist."""
        os.makedirs(os.path.dirname(Config.DATABASE_PATH), exist_ok=True)
        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)

# Global config instance
config = Config()
Config.ensure_dirs()
