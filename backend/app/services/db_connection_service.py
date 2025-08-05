"""
Database Connection Service
Unified service for all database connections (JDBC, SQLAlchemy, PyMongo)
"""
from typing import Dict, Any, Optional
from app.services.query_dialect import QueryDialect
from app.utils.password_resolver import PasswordResolver
from app.utils.context_variables import load_context_variables

# Try to import optional dependencies
try:
    from sqlalchemy import create_engine, text
    from sqlalchemy.pool import QueuePool
    HAS_SQLALCHEMY = True
except ImportError:
    HAS_SQLALCHEMY = False

try:
    from pymongo import MongoClient
    HAS_PYMONGO = True
except ImportError:
    HAS_PYMONGO = False

from app.services.jdbc_manager import jdbc_manager, HAS_JAYDEBEAPI

class DatabaseConnectionService:
    """Unified database connection service"""
    
    def __init__(self):
        self.sql_pools = {}
        self.mongo_clients = {}
    
    def preview_database(self, config: Dict[str, Any], query: str, limit: int = 5, workspace_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Preview database query with auto-detection of connection method
        
        Args:
            config: Database configuration
            query: SQL query
            limit: Number of rows to preview
            workspace_id: Optional workspace ID for loading context variables
            
        Returns:
            Dictionary with data, schema, and totalRows
        """
        # Resolve passwords using context variables, unix commands, and env vars
        resolved_config = self._resolve_config_passwords(config, workspace_id)
        
        db_type = resolved_config.get('dbType', '').lower()
        connection_method = resolved_config.get('connectionMethod', 'auto').lower()
        
        # Auto-detect connection method if not specified
        if connection_method == 'auto':
            if db_type == 'mongodb':
                connection_method = 'mongo'
            elif resolved_config.get('jdbcDriver') or resolved_config.get('jdbcUrl'):
                connection_method = 'jdbc'
            else:
                connection_method = 'native'
        
        # Route to appropriate handler
        if connection_method == 'jdbc':
            return self._preview_jdbc(resolved_config, query, limit)
        elif connection_method == 'mongo':
            return self._preview_mongo(resolved_config, query, limit)
        else:
            return self._preview_native(resolved_config, query, limit)
    
    def _resolve_config_passwords(self, config: Dict[str, Any], workspace_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Resolve passwords and sensitive fields in config
        
        Args:
            config: Database configuration
            workspace_id: Optional workspace ID for context variables
            
        Returns:
            Config with resolved passwords
        """
        # Load context variables if workspace_id provided
        context_vars = {}
        if workspace_id:
            context_vars = load_context_variables(workspace_id)
        
        # Create resolver with context variables
        resolver = PasswordResolver(context_vars)
        
        # Resolve the config
        return resolver.resolve_connection_config(config)
    
    def _preview_jdbc(self, config: Dict[str, Any], query: str, limit: int) -> Dict[str, Any]:
        """Preview using JDBC connection"""
        if not HAS_JAYDEBEAPI:
            raise ImportError("JayDeBeApi not installed. Install with: pip install JayDeBeApi JPype1")
        
        return jdbc_manager.preview_query(config, query, limit)
    
    def _preview_native(self, config: Dict[str, Any], query: str, limit: int) -> Dict[str, Any]:
        """Preview using SQLAlchemy (native Python drivers)"""
        if not HAS_SQLALCHEMY:
            raise ImportError("SQLAlchemy not installed. Install with: pip install sqlalchemy pymysql")
        
        db_type = config.get('dbType', 'mysql').lower()
        
        # Build connection string
        connection_string = self._build_connection_string(db_type, config)
        
        # Create engine
        engine = create_engine(
            connection_string,
            poolclass=QueuePool,
            pool_size=5,
            max_overflow=10,
            pool_timeout=30,
            pool_recycle=3600,
            pool_pre_ping=True
        )
        
        # Apply limit to query
        limited_query = QueryDialect.apply_limit(query, db_type, limit)
        
        try:
            with engine.connect() as conn:
                result = conn.execute(text(limited_query))
                
                # Fetch data
                rows = result.fetchall()
                columns = result.keys()
                
                # Convert to list of dicts
                data = [dict(zip(columns, row)) for row in rows]
                
                # Auto-detect schema
                schema = []
                if data:
                    for col in columns:
                        col_type = 'string'
                        for row in data:
                            val = row.get(col)
                            if val is not None:
                                if isinstance(val, (int, float)):
                                    col_type = 'number'
                                elif isinstance(val, bool):
                                    col_type = 'boolean'
                                break
                        
                        schema.append({
                            'name': col,
                            'type': col_type
                        })
                
                return {
                    'data': data,
                    'schema': schema,
                    'totalRows': len(data)
                }
        finally:
            engine.dispose()
    
    def _preview_mongo(self, config: Dict[str, Any], query: str, limit: int) -> Dict[str, Any]:
        """Preview MongoDB collection"""
        if not HAS_PYMONGO:
            raise ImportError("PyMongo not installed. Install with: pip install pymongo")
        
        host = config.get('host', 'localhost')
        port = config.get('port', 27017)
        database = config.get('database', 'test')
        username = config.get('username')
        password = config.get('password')
        
        # Build connection string
        if username and password:
            connection_string = f"mongodb://{username}:{password}@{host}:{port}/{database}"
        else:
            connection_string = f"mongodb://{host}:{port}/{database}"
        
        # Create client
        client = MongoClient(
            connection_string,
            maxPoolSize=10,
            serverSelectionTimeoutMS=5000
        )
        
        try:
            db = client[database]
            
            # Parse query (expecting collection name)
            collection_name = query.strip()
            collection = db[collection_name]
            
            # Fetch documents
            cursor = collection.find().limit(limit)
            data = list(cursor)
            
            # Convert ObjectId to string
            for doc in data:
                if '_id' in doc:
                    doc['_id'] = str(doc['_id'])
            
            # Auto-detect schema from first document
            schema = []
            if data:
                first_doc = data[0]
                for key, value in first_doc.items():
                    col_type = 'string'
                    if isinstance(value, (int, float)):
                        col_type = 'number'
                    elif isinstance(value, bool):
                        col_type = 'boolean'
                    
                    schema.append({
                        'name': key,
                        'type': col_type
                    })
            
            return {
                'data': data,
                'schema': schema,
                'totalRows': len(data)
            }
        finally:
            client.close()
    
    def _build_connection_string(self, db_type: str, config: Dict[str, Any]) -> str:
        """Build SQLAlchemy connection string"""
        host = config.get('host', 'localhost')
        port = config.get('port')
        database = config.get('database', '')
        username = config.get('username', '')
        password = config.get('password', '')
        
        if db_type == 'mysql':
            port = port or 3306
            return f"mysql+pymysql://{username}:{password}@{host}:{port}/{database}"
        
        elif db_type == 'postgresql':
            port = port or 5432
            return f"postgresql://{username}:{password}@{host}:{port}/{database}"
        
        elif db_type == 'oracle':
            port = port or 1521
            return f"oracle+cx_oracle://{username}:{password}@{host}:{port}/{database}"
        
        elif db_type == 'sqlite':
            return f"sqlite:///{database}"
        
        else:
            raise ValueError(f"Unsupported database type for native connection: {db_type}")

# Global instance
db_connection_service = DatabaseConnectionService()
