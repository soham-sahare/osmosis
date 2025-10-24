"""
Context Variables Utility
Load and manage workspace context variables
"""
import json
from pathlib import Path
from typing import Dict, Optional

def load_context_variables(workspace_id: str, workspace_dir: str = "workspaces") -> Dict[str, str]:
    """
    Load context variables for a workspace
    
    Args:
        workspace_id: Workspace ID
        workspace_dir: Base workspace directory
        
    Returns:
        Dictionary of context variables
    """
    variables_file = Path(workspace_dir) / workspace_id / "context_variables.json"
    
    if not variables_file.exists():
        return {}
    
    try:
        with open(variables_file, 'r') as f:
            data = json.load(f)
            return data.get('variables', {})
    except Exception as e:
        print(f"Error loading context variables: {e}")
        return {}

def save_context_variables(workspace_id: str, variables: Dict[str, str], workspace_dir: str = "workspaces") -> bool:
    """
    Save context variables for a workspace
    
    Args:
        workspace_id: Workspace ID
        variables: Dictionary of variables to save
        workspace_dir: Base workspace directory
        
    Returns:
        True if successful, False otherwise
    """
    workspace_path = Path(workspace_dir) / workspace_id
    workspace_path.mkdir(parents=True, exist_ok=True)
    
    variables_file = workspace_path / "context_variables.json"
    
    try:
        with open(variables_file, 'w') as f:
            json.dump({'variables': variables}, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving context variables: {e}")
        return False
