from flask import Blueprint, request, jsonify
from app.services.file_preview_service import FilePreviewService

file_routes = Blueprint('file_routes', __name__)
preview_service = FilePreviewService()

@file_routes.route('/preview', methods=['POST'])
def preview_file():
    """Preview a file and return sample data with schema."""
    try:
        data = request.get_json()
        
        file_path = data.get('filePath')
        file_type = data.get('fileType', 'delimited')
        config = data.get('config', {})
        
        if not file_path:
            return jsonify({'error': 'File path is required'}), 400
        
        result = preview_service.preview_file(file_path, file_type, config)
        
        return jsonify(result), 200
    
    except FileNotFoundError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500
