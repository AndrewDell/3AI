# src/agents/base.py
"""
Base module defining the core interface and common behavior for AI agents.

Best Practices:
1. Use an abstract base class (ABC) to enforce a consistent interface (e.g., a run method).
2. Encourage maintainability by isolating shared logic or utility methods.
3. Facilitate SOLID design by ensuring each agent handles domain-specific tasks.

Usage Example:
    from .base import BaseAgent

    class MyAgent(BaseAgent):
        def run(self, **kwargs):
            # Agent-specific logic
            return "Agent Result"
"""

from abc import ABC, abstractmethod

class BaseAgent(ABC):
    """
    A foundational class for domain-specific AI agents in the 3AI platform.
    Subclasses must implement the run() method to handle domain-specific actions.
    """

    def __init__(self, name: str):
        """
        Initialize the base agent with a descriptive name.
        
        Args:
            name (str): A human-readable identifier for the agent.
        """
        self.name = name

    @abstractmethod
    def run(self, **kwargs):
        """
        Core method for the agent’s workflow. Must be overridden by child classes.

        Args:
            **kwargs: Arbitrary keyword arguments needed for agent logic.

        Returns:
            Any: The result or outcome of the agent’s operation.
        """
        pass

    def log_startup(self):
        """
        Optional helper for standardized startup logging or resource initialization.
        """
        print(f"[{self.name}] Agent is starting up...")

    def shutdown(self):
        """
        Optional method to clean up resources or perform any end-of-cycle tasks.
        """
        print(f"[{self.name}] Agent is shutting down...")
