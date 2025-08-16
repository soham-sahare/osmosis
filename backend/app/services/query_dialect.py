"""
Query Dialect Handler
Handles database-specific SQL syntax differences
"""

class QueryDialect:
    """Handles query transformations for different database dialects"""
    
    @staticmethod
    def apply_limit(query: str, db_type: str, limit: int = 5) -> str:
        """
        Apply LIMIT clause to query based on database type
        
        Args:
            query: SQL query string
            db_type: Database type (mysql, oracle, postgresql, sqlserver, etc.)
            limit: Number of rows to limit
            
        Returns:
            Modified query with LIMIT clause
        """
        query = query.strip().rstrip(';')
        query_lower = query.lower()
        
        # Check if query already has a limit clause
        if any(keyword in query_lower for keyword in ['limit', 'fetch first', 'top ']):
            return query
        
        db_type = db_type.lower()
        
        # MySQL, PostgreSQL, SQLite - use LIMIT
        if db_type in ['mysql', 'postgresql', 'sqlite', 'impala']:
            return f"{query} LIMIT {limit}"
        
        # Oracle - use FETCH FIRST (12c+) or ROWNUM (older)
        elif db_type == 'oracle':
            # Try modern syntax first (Oracle 12c+)
            return f"{query} FETCH FIRST {limit} ROWS ONLY"
        
        # SQL Server - use TOP
        elif db_type in ['sqlserver', 'mssql']:
            # Inject TOP after SELECT
            if 'select' in query_lower:
                return query.replace('SELECT', f'SELECT TOP {limit}', 1).replace('select', f'SELECT TOP {limit}', 1)
            return query
        
        # Default - try LIMIT (works for most databases)
        else:
            return f"{query} LIMIT {limit}"
    
    @staticmethod
    def get_schema_query(db_type: str, table_name: str) -> str:
        """
        Get database-specific query to fetch table schema
        
        Args:
            db_type: Database type
            table_name: Table name
            
        Returns:
            Query to fetch schema information
        """
        db_type = db_type.lower()
        
        if db_type == 'mysql':
            return f"DESCRIBE {table_name}"
        
        elif db_type == 'postgresql':
            return f"""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = '{table_name}'
            """
        
        elif db_type == 'oracle':
            return f"""
                SELECT column_name, data_type 
                FROM user_tab_columns 
                WHERE table_name = UPPER('{table_name}')
            """
        
        elif db_type in ['sqlserver', 'mssql']:
            return f"""
                SELECT COLUMN_NAME, DATA_TYPE 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = '{table_name}'
            """
        
        else:
            # Generic approach - try to select with LIMIT 0
            return f"SELECT * FROM {table_name} WHERE 1=0"
    
    @staticmethod
    def normalize_type(db_type: str, native_type: str) -> str:
        """
        Normalize database-specific types to generic types
        
        Args:
            db_type: Database type
            native_type: Native database type
            
        Returns:
            Normalized type (string, number, integer, boolean, date)
        """
        native_type = native_type.lower()
        
        # Integer types
        if any(t in native_type for t in ['int', 'serial', 'number']):
            if 'decimal' in native_type or 'float' in native_type or 'double' in native_type:
                return 'number'
            return 'integer'
        
        # Floating point types
        if any(t in native_type for t in ['float', 'double', 'decimal', 'numeric', 'real']):
            return 'number'
        
        # Boolean types
        if any(t in native_type for t in ['bool', 'bit']):
            return 'boolean'
        
        # Date/Time types
        if any(t in native_type for t in ['date', 'time', 'timestamp']):
            return 'date'
        
        # Default to string
        return 'string'
