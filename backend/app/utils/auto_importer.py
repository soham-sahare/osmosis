import os
import glob
import json
from app.services.workspace_service import WorkspaceService
from app.services.job_service import JobService
from config.settings import config

class AutoImporter:
    def __init__(self, app):
        self.app = app
        self.db_path = config.DATABASE_PATH
        self.workspace_service = WorkspaceService(self.db_path)
        self.job_service = JobService(self.db_path)
    
    def run(self):
        """Execute auto-import logic."""
        import_dir = os.environ.get('osmosis_IMPORT_DIR', './deployment')
        
        # Resolve to absolute path
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__))) # app/.. -> backend
        # Assuming app is in backend/app, so __file__ is backend/app/utils/auto_importer.py
        # backend root is ../../..
        # But allow absolute path in env var
        
        if not os.path.isabs(import_dir):
            import_dir = os.path.join(base_dir, import_dir)
            
        print(f"Checking for auto-import in: {import_dir}")
        if not os.path.exists(import_dir):
            print("Import directory not found, skipping.")
            return

        # Ensure Production Workspace
        prod_ws_name = "Production"
        workspace = None
        
        # Find existing
        # This is inefficient but safe (no direct name lookup in service yet)
        all_ws = self.workspace_service.get_all()
        for ws in all_ws:
            if ws['name'] == prod_ws_name:
                workspace = ws
                break
        
        if not workspace:
            print(f"Creating '{prod_ws_name}' workspace...")
            workspace = self.workspace_service.create(prod_ws_name, "Auto-created production workspace")

        workspace_id = workspace['id']
        
        # Find .osmosis files
        files = glob.glob(os.path.join(import_dir, "*.osmosis"))
        print(f"Found {len(files)} files to import.")
        
        for file_path in files:
            try:
                print(f"Importing {os.path.basename(file_path)}...")
                with open(file_path, 'r') as f:
                    data = json.load(f)
                
                job = self.job_service.import_job(workspace_id, data, preserve_ids=True)
                if job:
                   print(f"Successfully imported job: {job['name']} ({job['id']})")
                else:
                   print(f"Failed to import job from {file_path}")
                   
            except Exception as e:
                print(f"Error importing {file_path}: {e}")
