import json
import os

class JSONConnector:
    """Connector for reading and writing JSON files."""
    
    def read(self, config, fs=None):
        """Read data from JSON file."""
        file_path = config.get('filePath')
        encoding = config.get('encoding', 'utf-8')
        json_mode = config.get('jsonMode', 'auto') # auto, array, lines
        
        if not file_path:
             raise Exception('JSON file path is required')

        if fs:
            if not fs.exists(file_path):
                 raise Exception(f'JSON file not found: {file_path}')
            open_func = fs.open
        else:
            if not os.path.exists(file_path):
                raise Exception(f'JSON file not found: {file_path}')
            open_func = open
        
        data = []
        with open_func(file_path, mode='rt', encoding=encoding) as f:
            if json_mode == 'lines':
                for line in f:
                    if line.strip():
                        data.append(json.loads(line))
            elif json_mode == 'array':
                data = json.load(f)
            else: # auto
                # Simple auto-detection: read first non-whitespace char
                # Note: f.read(1) advances pointer, so we must seek(0) in some streams. 
                # If stream is not seekable (some remote fs), this might be an issue.
                # Assuming fs.open returns a file-like object that supports seek or we read content.
                try:
                    first_char = f.read(1)
                    f.seek(0)
                    if first_char == '[':
                        data = json.load(f)
                    elif first_char == '{':
                        # Assume JSON Lines
                        for line in f:
                            if line.strip():
                                data.append(json.loads(line))
                    else:
                         # Fallback for empty file or other cases
                         content = f.read()
                         if not content.strip():
                             return []
                         data = json.loads(content)
                except Exception as e:
                     raise Exception(f"Failed to parse JSON: {str(e)}")
                        
        if not isinstance(data, list):
            # If root is dict, wrap in list
            data = [data]
            
        return data

    def write(self, data, config, fs=None):
        """Write data to JSON file."""
        file_path = config.get('filePath')
        encoding = config.get('encoding', 'utf-8')
        json_mode = config.get('jsonMode', 'array') # array, lines
        
        if not file_path:
             raise Exception('JSON file path is required')

        if fs:
            try:
                fs.makedirs(os.path.dirname(file_path), exist_ok=True)
            except:
                pass 
            open_func = fs.open
        else:
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            open_func = open

        with open_func(file_path, mode='wt', encoding=encoding) as f:
            if json_mode == 'lines':
                for row in data:
                    f.write(json.dumps(row) + '\n')
            else:
                json.dump(data, f, indent=2)
                
        return True
