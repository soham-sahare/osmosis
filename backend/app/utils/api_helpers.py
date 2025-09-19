from functools import wraps
from flask import jsonify

def api_response(f):
    """
    Decorator to wrap API routes with standard error handling and JSON response formatting.
    Expects the decorated function to return:
    - A dictionary/list (converted to JSON 200)
    - A tuple (data, status_code)
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            result = f(*args, **kwargs)
            if isinstance(result, tuple):
                response, status = result
                return jsonify(response), status
            return jsonify(result), 200
        except Exception as e:
            # In a real app we'd log this error
            return jsonify({'error': str(e)}), 500
    return decorated_function
