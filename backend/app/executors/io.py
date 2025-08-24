from .base import BaseExecutor
from app.connectors.files.csv_connector import CSVConnector
from app.connectors.files.json_connector import JSONConnector
from app.connectors.files.excel_connector import ExcelConnector
from app.connectors.files.parquet_connector import ParquetConnector

# Determine connector based on config
def get_file_connector(file_type):
    if file_type == 'csv' or file_type == 'delimited':
        return CSVConnector()
    elif file_type == 'json':
        return JSONConnector()
    elif file_type == 'excel':
        return ExcelConnector()
    elif file_type == 'parquet':
        return ParquetConnector()
    return CSVConnector() # Default

class FileReaderExecutor(BaseExecutor):
    def execute(self, config, input_data=None, context=None):
        file_type = config.get('fileType', 'csv')
        connector = get_file_connector(file_type)
        
        fs = None
        # Use context to resolve connection if available
        if context:
             connection_id = config.get('connectionId')
             if connection_id and connection_id != 'local':
                 try:
                     conn_service = context.connection_service
                     fs_service = context.file_system_service
                     
                     conn_config = conn_service.get_connection(connection_id)
                     if conn_config:
                         from app.utils.password_resolver import PasswordResolver
                         resolver = PasswordResolver(context.db_path)
                         conn_config = resolver.resolve_connection_config(conn_config, context.current_workspace_id)
                         fs = fs_service.get_filesystem(conn_config)
                         print(f"Using remote connection: {conn_config.get('name')}")
                 except Exception as e:
                     print(f"Failed to resolve remote connection: {e}")

        return connector.read(config, fs=fs)

class FileWriterExecutor(BaseExecutor):
    def execute(self, config, input_data=None, context=None):
        if not input_data:
            return []
        file_type = config.get('fileType', 'csv')
        connector = get_file_connector(file_type)
        
        fs = None
        if context:
             connection_id = config.get('connectionId')
             if connection_id and connection_id != 'local':
                 try:
                     conn_service = context.connection_service
                     fs_service = context.file_system_service
                     
                     conn_config = conn_service.get_connection(connection_id)
                     if conn_config:
                         from app.utils.password_resolver import PasswordResolver
                         resolver = PasswordResolver(context.db_path)
                         conn_config = resolver.resolve_connection_config(conn_config, context.current_workspace_id)
                         fs = fs_service.get_filesystem(conn_config)
                 except Exception as e:
                     print(f"Failed to resolve remote connection: {e}")

        connector.write(input_data, config, fs=fs)
        return input_data

class DatabaseReaderExecutor(BaseExecutor):
    def execute(self, config, input_data=None, context=None):
        from sqlalchemy import create_engine, text
        
        db_type = config.get('type', 'mysql')
        host = config.get('host')
        port = config.get('port')
        username = config.get('username')
        password = config.get('password')
        database = config.get('database')
        query = config.get('query')
        
        if not query:
             raise Exception("Resulting query is empty")

        url = ""
        if db_type == 'mysql':
             url = f"mysql+pymysql://{username}:{password}@{host}:{port}/{database}"
        elif db_type == 'postgresql':
             url = f"postgresql://{username}:{password}@{host}:{port}/{database}"
        
        if url:
            engine = create_engine(url)
            with engine.connect() as conn:
                result = conn.execute(text(query))
                return [dict(row._mapping) for row in result]
        
        return []

class DatabaseWriterExecutor(BaseExecutor):
    def execute(self, config, input_data=None, context=None):
        from sqlalchemy import create_engine
        import pandas as pd
        
        if not input_data: return []

        db_type = config.get('type', 'mysql')
        host = config.get('host')
        port = config.get('port')
        username = config.get('username')
        password = config.get('password')
        database = config.get('database')
        table_name = config.get('table')
        
        url = ""
        if db_type == 'mysql':
             url = f"mysql+pymysql://{username}:{password}@{host}:{port}/{database}"
        elif db_type == 'postgresql':
             url = f"postgresql://{username}:{password}@{host}:{port}/{database}"
             
        if url and table_name:
            engine = create_engine(url)
            df = pd.DataFrame(input_data)
            df.to_sql(table_name, engine, if_exists='append', index=False)
            
        return input_data
