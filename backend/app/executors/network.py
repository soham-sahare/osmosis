from .base import BaseExecutor
import requests
import json

class RestClientExecutor(BaseExecutor):
    def execute(self, config, input_data=None, context=None):
        url = config.get('url')
        method = config.get('method', 'GET')
        headers_config = config.get('headers', {})
        
        headers = {}
        if isinstance(headers_config, str):
            try:
                headers = json.loads(headers_config)
            except:
                print("Failed to parse headers JSON")
        elif isinstance(headers_config, dict):
            headers = headers_config
        elif isinstance(headers_config, list):
            # Legacy list support
            for h in headers_config:
                headers[h.get('key')] = h.get('value')
            
        output_data = []
        
        def make_request(row=None):
            final_url = url
            json_body = None
            
            if row:
                for key, val in row.items():
                    final_url = final_url.replace(f"{{{key}}}", str(val))
                
                if method in ['POST', 'PUT']:
                     json_body = row
            
            try:
                response = requests.request(method, final_url, headers=headers, json=json_body)
                
                result = {
                    'status_code': response.status_code,
                    'response_body': response.text
                }
                
                if row:
                    result.update(row)
                
                try:
                    json_resp = response.json()
                    if isinstance(json_resp, dict):
                        result.update(json_resp)
                except:
                    pass
                    
                return result
            except Exception as e:
                print(f"REST request failed: {e}")
                return None

        if input_data:
            for row in input_data:
                res = make_request(row)
                if res: output_data.append(res)
        else:
            res = make_request()
            if res: output_data.append(res)
            
        return output_data
