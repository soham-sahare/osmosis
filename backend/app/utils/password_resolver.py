"""
Password Resolver Utility
Resolves passwords from various sources:
- Context variables: ${VAR_NAME}
- Unix commands: $(command) or `command`
- Environment variables: $VAR_NAME
- Plain text: direct password
"""
import os
import re
import subprocess
from typing import Dict, Any, Optional

class PasswordResolver:
    """Resolves passwords from different sources"""
    
    def __init__(self, context_variables: Optional[Dict[str, str]] = None):
        """
        Initialize password resolver
        
        Args:
            context_variables: Dictionary of context variables from workspace
        """
        self.context_variables = context_variables or {}
    
    def resolve(self, password: str) -> str:
        """
        Resolve password from various sources
        
        Args:
            password: Password string that may contain variables or commands
            
        Returns:
            Resolved password string
        """
        if not password:
            return password
        
        # 1. Check for context variables: ${VAR_NAME}
        password = self._resolve_context_variables(password)
        
        # 2. Check for unix commands: $(command) or `command`
        password = self._resolve_unix_commands(password)
        
        # 3. Check for environment variables: $VAR_NAME
        password = self._resolve_env_variables(password)
        
        return password
    
    def _resolve_context_variables(self, password: str) -> str:
        """Resolve context variables in format ${VAR_NAME}"""
        pattern = r'\$\{([^}]+)\}'
        
        def replace_var(match):
            var_name = match.group(1)
            return self.context_variables.get(var_name, match.group(0))
        
        return re.sub(pattern, replace_var, password)
    
    def _resolve_unix_commands(self, password: str) -> str:
        """
        Resolve unix commands in format $(command) or `command`
        WARNING: This executes shell commands - use with caution!
        """
        # Pattern for $(command)
        dollar_pattern = r'\$\(([^)]+)\)'
        # Pattern for `command`
        backtick_pattern = r'`([^`]+)`'
        
        def execute_command(match):
            command = match.group(1).strip()
            try:
                # Execute command and capture output
                result = subprocess.run(
                    command,
                    shell=True,
                    capture_output=True,
                    text=True,
                    timeout=5  # 5 second timeout for safety
                )
                if result.returncode == 0:
                    return result.stdout.strip()
                else:
                    print(f"Command failed: {command}, Error: {result.stderr}")
                    return match.group(0)  # Return original if command fails
            except subprocess.TimeoutExpired:
                print(f"Command timeout: {command}")
                return match.group(0)
            except Exception as e:
                print(f"Command execution error: {e}")
                return match.group(0)
        
        # Resolve $(command) format
        password = re.sub(dollar_pattern, execute_command, password)
        # Resolve `command` format
        password = re.sub(backtick_pattern, execute_command, password)
        
        return password
    
    def _resolve_env_variables(self, password: str) -> str:
        """Resolve environment variables in format $VAR_NAME"""
        # Pattern for $VAR_NAME (but not ${VAR_NAME} which was already handled)
        pattern = r'\$([A-Za-z_][A-Za-z0-9_]*)'
        
        def replace_env(match):
            var_name = match.group(1)
            return os.environ.get(var_name, match.group(0))
        
        return re.sub(pattern, replace_env, password)
    
    def resolve_connection_config(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Resolve all password-like fields in a connection config
        
        Args:
            config: Connection configuration dictionary
            
        Returns:
            Config with resolved passwords
        """
        resolved_config = config.copy()
        
        # Fields that might contain passwords or sensitive data
        sensitive_fields = ['password', 'kerberosKeytab', 'jaasConfig']
        
        for field in sensitive_fields:
            if field in resolved_config and resolved_config[field]:
                resolved_config[field] = self.resolve(resolved_config[field])
        
        return resolved_config

# Convenience function
def resolve_password(password: str, context_variables: Optional[Dict[str, str]] = None) -> str:
    """
    Convenience function to resolve a password
    
    Args:
        password: Password string to resolve
        context_variables: Optional context variables
        
    Returns:
        Resolved password
    """
    resolver = PasswordResolver(context_variables)
    return resolver.resolve(password)
