import os
from app.connectors.files.csv_connector import CSVConnector
from app.connectors.files.excel_connector import ExcelConnector
from app.connectors.files.csv_connector import CSVConnector
from app.connectors.files.excel_connector import ExcelConnector
from app.connectors.files.parquet_connector import ParquetConnector
from app.services.connection_service import ConnectionService
from app.services.file_system_service import FileSystemService
from app.utils.db import get_db_path

class FilePreviewService:
    """Service for previewing files and inferring schema."""

    def __init__(self):
        db_path = get_db_path()
        self.connection_service = ConnectionService(db_path)
        self.file_system_service = FileSystemService()
        self.db_path = db_path
    
    def preview_file(self, file_path, file_type, config):
        """
        Preview a file and return sample data with inferred schema.
        
        Args:
            file_path: Path to the file
            file_type: Type of file (delimited, excel, parquet)
            config: Configuration for reading the file
            
        Returns:
            dict with 'data' (list of rows) and 'schema' (list of column definitions)
        """
        connection_id = config.get('connectionId')
        fs = None

        if connection_id and connection_id != 'local':
            from app.utils.password_resolver import PasswordResolver
            resolver = PasswordResolver(self.db_path)
            
            # TODO: Need workspaceId to resolve secrets correctly. 
            # For now, preview typically happens in context of editing a workspace job, 
            # but config might not have workspaceId. 
            # Ideally config should come with workspaceId. 
            # Assuming basic resolution for now or that config has enough info?
            # Actually, the API route probably knows the workspace.
            # But let's try to get connection first.
            conn_config = self.connection_service.get_connection(connection_id)
            if conn_config:
                 # Try to find workspace ID from connection if possible, or pass it in config
                 # Resolver needs workspace_id for context vars.
                 # If we don't have it, some vars might fail.
                 workspace_id = config.get('workspaceId') or conn_config.get('workspace_id')
                 conn_config = resolver.resolve_connection_config(conn_config, workspace_id)
                 fs = self.file_system_service.get_filesystem(conn_config)

        # Check if file exists
        if fs:
             if not fs.exists(file_path):
                 raise FileNotFoundError(f"File not found: {file_path}")
        else:
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"File not found: {file_path}")
        
        # Read data based on file type
        data = []
        if file_type == 'delimited':
            connector = CSVConnector()
            data = connector.read(config, fs=fs)
        elif file_type == 'excel':
            connector = ExcelConnector()
            data = connector.read(config, fs=fs)
        elif file_type == 'parquet':
            connector = ParquetConnector()
            data = connector.read(config, fs=fs)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")
        
        # Get sample data (first 5 rows)
        sample_data = data[:5] if len(data) > 5 else data
        
        # Infer schema from data
        schema = self._infer_schema(data)
        
        return {
            'data': sample_data,
            'schema': schema,
            'totalRows': len(data)
        }
    
    def _infer_schema(self, data):
        """
        Infer schema from data.
        
        Args:
            data: List of dictionaries
            
        Returns:
            List of column definitions with name and type
        """
        if not data or len(data) == 0:
            return []
        
        schema = []
        first_row = data[0]
        
        for column_name, value in first_row.items():
            column_type = self._infer_type(value, column_name, data)
            schema.append({
                'name': column_name,
                'type': column_type
            })
        
        return schema
    
    def _infer_type(self, value, column_name, data):
        """
        Infer the type of a column based on its values.
        
        Args:
            value: Sample value from the column
            column_name: Name of the column
            data: All data rows for better type inference
            
        Returns:
            Inferred type as string
        """
        # Sample multiple values for better inference
        sample_values = [row.get(column_name) for row in data[:100] if row.get(column_name) is not None]
        
        if not sample_values:
            return 'string'
        
        # Try to infer type from samples
        all_int = True
        all_float = True
        all_bool = True
        
        for val in sample_values:
            val_str = str(val).strip().lower()
            
            # Check boolean
            if val_str not in ['true', 'false', '0', '1', 'yes', 'no']:
                all_bool = False
            
            # Check integer
            try:
                int(val)
            except (ValueError, TypeError):
                all_int = False
            
            # Check float
            try:
                float(val)
            except (ValueError, TypeError):
                all_float = False
        
        if all_bool:
            return 'boolean'
        elif all_int:
            return 'integer'
        elif all_float:
            return 'number'
        else:
            return 'string'
