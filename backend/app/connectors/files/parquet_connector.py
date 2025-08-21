import pandas as pd
import os

class ParquetConnector:
    """Connector for reading and writing Parquet files using pandas."""
    
    def read(self, config, fs=None):
        """Read data from Parquet file."""
        file_path = config.get('filePath')
        
        if not file_path:
            raise Exception('Parquet file path is required')

        if fs:
            if not fs.exists(file_path):
                 raise Exception(f'Parquet file not found: {file_path}')
            open_func = fs.open
        else:
            if not os.path.exists(file_path):
                raise Exception(f'Parquet file not found: {file_path}')
            open_func = open
        
        try:
            with open_func(file_path, 'rb') as f:
                df = pd.read_parquet(f)
                
            data = df.to_dict(orient='records')
            return data
        except Exception as e:
            raise Exception(f"Failed to read Parquet file: {str(e)}")
    
    def write(self, data, config, fs=None):
        """Write data to Parquet file."""
        file_path = config.get('filePath')
        
        if not file_path:
            raise Exception('Parquet file path is required')
        
        if not data:
            return False
            
        # Create directory
        if fs:
             try:
                fs.makedirs(os.path.dirname(file_path), exist_ok=True)
             except:
                pass
             open_func = fs.open
        else:
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            open_func = open
        
        try:
            df = pd.DataFrame(data)
            with open_func(file_path, 'wb') as f:
                df.to_parquet(f, index=False)
            return True
        except Exception as e:
            raise Exception(f"Failed to write Parquet file: {str(e)}")
