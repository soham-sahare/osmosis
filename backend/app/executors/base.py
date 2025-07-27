from abc import ABC, abstractmethod

class BaseExecutor(ABC):
    """Abstract base class for all component executors."""
    
    @abstractmethod
    def execute(self, config, input_data=None, context=None):
        """
        Execute the component logic.
        
        Args:
            config (dict): The configuration for the component.
            input_data (list, optional): The input data from upstream (list of dicts).
            context (object, optional): The execution context (e.g. ExecutionService instance) providing access to services.
            
        Returns:
            list: The output data (list of dicts).
        """
        pass
