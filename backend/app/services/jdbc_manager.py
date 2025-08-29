"""
JDBC Manager
Handles JDBC connections via JayDeBeApi with support for custom JARs and Kerberos
"""
import os
from typing import Dict, Any, List, Optional

# Try to import JayDeBeApi
try:
    import jaydebeapi
    HAS_JAYDEBEAPI = True
except ImportError:
    HAS_JAYDEBEAPI = False
    print("Warning: JayDeBeApi not installed. JDBC connections will not work.")
    print("Install with: pip install JayDeBeApi JPype1")

class JDBCManager:
    """Manages JDBC connections using JayDeBeApi"""
    
    def __init__(self, jdbc_drivers_dir: str = None):
        """
        Initialize JDBC Manager
        
        Args:
            jdbc_drivers_dir: Directory containing JDBC driver JAR files
        """
        if jdbc_drivers_dir is None:
            # Default to backend/jdbc_drivers/
            jdbc_drivers_dir = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
                'jdbc_drivers'
            )
        
        self.jdbc_drivers_dir = jdbc_drivers_dir
        
        # Create directory if it doesn't exist
        os.makedirs(self.jdbc_drivers_dir, exist_ok=True)
        
        self.connections = {}
    
    def get_jar_path(self, jar_filename: str) -> str:
        """
        Get full path to JAR file
        
        Args:
            jar_filename: JAR filename
            
        Returns:
            Full path to JAR file
        """
        return os.path.join(self.jdbc_drivers_dir, jar_filename)
    
    def setup_kerberos(self, config: Dict[str, Any]):
        """
        Setup Kerberos authentication
        
        Args:
            config: Configuration with Kerberos settings
        """
        if not config.get('useKerberos'):
            return
        
        # Set JAAS config if provided
        if config.get('jaasConfig'):
            os.environ['JAVA_TOOL_OPTIONS'] = f"-Djava.security.auth.login.config={config['jaasConfig']}"
        
        # Set Kerberos principal and keytab
        if config.get('kerberosPrincipal'):
            os.environ['KRB5_PRINCIPAL'] = config['kerberosPrincipal']
        
        if config.get('kerberosKeytab'):
            os.environ['KRB5_KTNAME'] = config['kerberosKeytab']
    
    def connect(self, config: Dict[str, Any]):
        """
        Create JDBC connection
        
        Args:
            config: Connection configuration
                - jdbcDriver: JDBC driver class name
                - jdbcUrl: JDBC connection URL
                - jdbcJarPath: Path to JAR file (filename or full path)
                - username: Database username (optional)
                - password: Database password (optional)
                - useKerberos: Enable Kerberos auth (optional)
                
        Returns:
            JDBC connection object
        """
        if not HAS_JAYDEBEAPI:
            raise ImportError("JayDeBeApi is not installed. Install with: pip install JayDeBeApi JPype1")
        
        # Setup Kerberos if needed
        self.setup_kerberos(config)
        
        # Get JAR path
        jar_path = config.get('jdbcJarPath', '')
        if not os.path.isabs(jar_path):
            # Relative path - look in jdbc_drivers directory
            jar_path = self.get_jar_path(jar_path)
        
        if not os.path.exists(jar_path):
            raise FileNotFoundError(f"JDBC driver JAR not found: {jar_path}")
        
        # Build connection parameters
        driver_class = config.get('jdbcDriver')
        jdbc_url = config.get('jdbcUrl')
        username = config.get('username')
        password = config.get('password')
        
        # Create connection
        if username and password:
            conn = jaydebeapi.connect(
                driver_class,
                jdbc_url,
                [username, password],
                jar_path
            )
        else:
            # No credentials (e.g., Kerberos auth)
            conn = jaydebeapi.connect(
                driver_class,
                jdbc_url,
                jars=jar_path
            )
        
        return conn
    
    def execute_query(self, config: Dict[str, Any], query: str) -> tuple:
        """
        Execute query and return results
        
        Args:
            config: Connection configuration
            query: SQL query to execute
            
        Returns:
            Tuple of (columns, rows)
        """
        conn = self.connect(config)
        
        try:
            cursor = conn.cursor()
            cursor.execute(query)
            
            # Get column names
            columns = [desc[0] for desc in cursor.description]
            
            # Fetch all rows
            rows = cursor.fetchall()
            
            cursor.close()
            
            return columns, rows
            
        finally:
            conn.close()
    
    def preview_query(self, config: Dict[str, Any], query: str, limit: int = 5) -> Dict[str, Any]:
        """
        Execute query and return preview data with schema
        
        Args:
            config: Connection configuration
            query: SQL query
            limit: Number of rows to return
            
        Returns:
            Dictionary with data, schema, and totalRows
        """
        from app.services.query_dialect import QueryDialect
        
        # Apply limit to query
        db_type = config.get('dbType', 'jdbc')
        limited_query = QueryDialect.apply_limit(query, db_type, limit)
        
        # Execute query
        columns, rows = self.execute_query(config, limited_query)
        
        # Convert to list of dicts
        data = []
        for row in rows:
            data.append(dict(zip(columns, row)))
        
        # Auto-detect schema
        schema = []
        if data:
            for col in columns:
                # Infer type from first non-null value
                col_type = 'string'
                for row_dict in data:
                    val = row_dict.get(col)
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

# Global instance
jdbc_manager = JDBCManager()
