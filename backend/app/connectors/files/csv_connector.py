import csv
import os

class CSVConnector:
    """Connector for reading and writing CSV files using standard library."""
    
    def read(self, config, fs=None):
        """Read data from CSV file."""
        file_path = config.get('filePath')
        delimiter = config.get('delimiter', ',')
        has_header = config.get('hasHeader', True)
        encoding = config.get('encoding', 'utf-8')
        
        if not file_path:
             raise Exception('CSV file path is required')

        # If fs is provided, use it to open file properties or check existence
        if fs:
            if not fs.exists(file_path):
                 raise Exception(f'CSV file not found: {file_path}')
            open_func = fs.open
        else:
            if not os.path.exists(file_path):
                raise Exception(f'CSV file not found: {file_path}')
            open_func = open
        
        data = []
        # Open file using appropriate function
        with open_func(file_path, mode='rt', encoding=encoding, newline='') as f:
            reader = csv.DictReader(f, delimiter=delimiter) if has_header else csv.reader(f, delimiter=delimiter)
            
            if has_header:
                data = list(reader)
            else:
                # Convert list of lists to dict with generic keys if no header
                raw_data = list(reader)
                if raw_data:
                    cols = [f'col_{i}' for i in range(len(raw_data[0]))]
                    data = [dict(zip(cols, row)) for row in raw_data]
        
        return data
    
    def write(self, data, config, fs=None):
        """Write data to CSV file."""
        file_path = config.get('filePath')
        delimiter = config.get('delimiter', ',')
        has_header = config.get('hasHeader', True)
        encoding = config.get('encoding', 'utf-8')
        
        if not file_path:
            raise Exception('CSV file path is required')
        
        if not data:
            return False
            
        # Create directory if it doesn't exist (only for local fs for now, or if fs supports makedirs)
        if fs:
            # Most remote FS handle directory creation automatically or have specific methods
            try:
                fs.makedirs(os.path.dirname(file_path), exist_ok=True)
            except:
                pass # Some FS (like S3) don't have real directories
            open_func = fs.open
        else:
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            open_func = open
        
        fieldnames = data[0].keys() if len(data) > 0 else []
        
        with open_func(file_path, mode='wt', encoding=encoding, newline='') as f:
            if has_header:
                writer = csv.DictWriter(f, fieldnames=fieldnames, delimiter=delimiter)
                writer.writeheader()
                writer.writerows(data)
            else:
                writer = csv.writer(f, delimiter=delimiter)
                for row in data:
                    writer.writerow(row.values())
        
        return True
