#!/usr/bin/env python

#agent_orchestration.py

#This module provides a central scheduler and task router for coordinating
#specialized AI agents within the 3AI platform. It supports dynamic agent registration,
#scheduling optimization, result persistence, multi-agent execution, and monitoring integrations.

#The following agent classes are defined in this file:
#  - HealthcareComplianceAgent: Automates healthcare compliance monitoring, auditing, and reporting.
#  - FreightDispatcherAgent: Optimizes freight dispatching operations including load assignments and route planning.
#  - ExecutiveSupportAgent: Provides automated assistance for executive scheduling, communication, and reporting.
#  - CustomerSuccessAgent: Manages customer onboarding, health monitoring, and proactive account management.
#  - SalesAgent: Automates sales processes such as lead generation, qualification, pipeline management, and reporting.
#  - PurchaserAgent: Streamlines procurement processes and vendor management.
#  - OperationsAgent: Optimizes operational workflows and project milestone tracking.
#  - MedicalCodingAgent: Automates medical coding, claims submission, and billing processes.
#  - MarketingAgent: Automates marketing activities including content creation and campaign management.
#  - HRAgent: Automates HR processes including recruitment, onboarding, and employee engagement.
#  - BusinessAcquisitionManagerAgent: Automates M&A processes for identifying and acquiring SaaS companies.
#  - AutoVehicleBrokerAgent: Automates vehicle sourcing, negotiation, and transaction management.

#An AgentOrchestrator class is provided to register and schedule these agents concurrently.

#Usage:
#    - Create an instance of AgentOrchestrator.
#    - Register agents with the orchestrator.
#    - Run the scheduling loop to execute agent tasks at defined intervals.

#!/usr/bin/env python

#agent_orchestration.py

#Agent Orchestration Module
#---------------------------
#This module provides a central scheduler and task router for coordinating
#specialized AI agents within the 3AI platform. It supports:
#- Dynamic agent registration
#- Scheduling optimization
#- Result persistence
#- Multi-agent execution
#- Monitoring integrations

#The following agent classes are defined in this file:
#  - HealthcareComplianceAgent: Automates healthcare compliance monitoring, auditing, and reporting.
#  - FreightDispatcherAgent: Optimizes freight dispatching operations including load assignments and route planning.
#  - ExecutiveSupportAgent: Provides automated assistance for executive scheduling, communication, and reporting.
#  - CustomerSuccessAgent: Manages customer onboarding, health monitoring, and proactive account management.
#  - SalesAgent: Automates sales processes such as lead generation, qualification, pipeline management, and reporting.
#  - PurchaserAgent: Streamlines procurement processes and vendor management.
#  - OperationsAgent: Optimizes operational workflows and project milestone tracking.
#  - MedicalCodingAgent: Automates medical coding, claims submission, and billing processes.
#  - MarketingAgent: Automates marketing activities including content creation and campaign management.
#  - HRAgent: Automates HR processes including recruitment, onboarding, and employee engagement.
#  - BusinessAcquisitionManagerAgent: Automates M&A processes for identifying and acquiring SaaS companies.
#  - AutoVehicleBrokerAgent: Automates vehicle sourcing, negotiation, and transaction management.

#An AgentOrchestrator class is provided to register and schedule these agents concurrently.

#Usage:
#    - Create an instance of AgentOrchestrator.
#    - Register agents with the orchestrator.
#    - Run the scheduling loop to execute agent tasks at defined intervals.

import asyncio
import logging
import os
import importlib
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from datetime import datetime

# Configure logging dynamically using environment variables or default settings.
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)

# =============================================================================
# Base Agent Class
# =============================================================================
class BaseAgent(ABC):
    """
    Abstract base class for all domain-specific AI agents.
    Enforces the implementation of the run() method.
    """

    def __init__(self, name: str):
        """
        Initialize the base agent with a descriptive name.

        Args:
            name (str): Unique identifier for the agent.
        """
        self.name = name

    @abstractmethod
    async def run(self, **kwargs) -> Any:
        """
        Execute the agent's main functionality.

        Args:
            **kwargs: Domain-specific parameters.

        Returns:
            Any: Result of the agent's operation.
        """
        pass

    def log_startup(self):
        """Log agent startup."""
        logger.info(f"[{self.name}] Agent is starting up.")

    def log_shutdown(self):
        """Log agent shutdown."""
        logger.info(f"[{self.name}] Agent is shutting down.")


# =============================================================================
# Agent Orchestrator
# =============================================================================
class AgentOrchestrator:
    """Manages and coordinates AI agents"""
    
    def __init__(self):
        self.agents = {}
        self.active_tasks = {}
        self.logger = logging.getLogger(__name__)
        
    def register_agent(self, agent_id: str, agent_config: Dict) -> bool:
        """Register a new agent with the orchestrator"""
        try:
            if agent_id not in self.agents:
                self.agents[agent_id] = {
                    'config': agent_config,
                    'status': 'idle',
                    'last_active': datetime.now()
                }
                return True
            return False
        except Exception as e:
            self.logger.error(f"Failed to register agent {agent_id}: {str(e)}")
            return False
            
    def get_agent_status(self, agent_id: str) -> Optional[Dict]:
        """Get the current status of an agent"""
        return self.agents.get(agent_id)
        
    def list_agents(self) -> List[Dict]:
        """List all registered agents and their status"""
        return [
            {'id': agent_id, **agent_data}
            for agent_id, agent_data in self.agents.items()
        ]
        
    def start_agent(self, agent_id: str) -> bool:
        """Start a registered agent"""
        if agent_id in self.agents:
            self.agents[agent_id]['status'] = 'running'
            self.agents[agent_id]['last_active'] = datetime.now()
            return True
        return False
        
    def stop_agent(self, agent_id: str) -> bool:
        """Stop a running agent"""
        if agent_id in self.agents:
            self.agents[agent_id]['status'] = 'stopped'
            return True
        return False


# =============================================================================
# Dynamic Agent Registration
# =============================================================================
def dynamic_agent_registration(orchestrator: AgentOrchestrator):
    """
    Dynamically discovers and registers agents from the src.agents package.

    Assumes that:
    - The file name matches the class name (in CamelCase)
    - Each agent inherits from BaseAgent
    """
    agent_modules = [
        "sales_agent", "marketing_agent", "customer_success_agent", "executive_support_agent",
        "freight_dispatcher_agent", "healthcare_compliance_agent", "hr_agent", "medical_coding_agent", 
        "purchaser_agent", "operations_agent", "business_acquisition_manager_agent", "auto_vehicle_broker_agent"
    ]

    agents_dir = "src.agents"

    for module_name in agent_modules:
        try:
            module = importlib.import_module(f"{agents_dir}.{module_name}")
            class_name = "".join(word.capitalize() for word in module_name.split("_"))
            agent_class = getattr(module, class_name)
            agent_instance = agent_class(name=class_name)
            orchestrator.register_agent(class_name, {'class': agent_class})
        except (ModuleNotFoundError, AttributeError) as e:
            logger.warning(f"Could not load agent module {module_name}: {e}")


# =============================================================================
# Main Execution Block
# =============================================================================
if __name__ == "__main__":
    orchestrator = AgentOrchestrator()

    # Dynamic registration of all available agents
    dynamic_agent_registration(orchestrator)

    # Log the registered agents for verification
    logger.info("Registered Agents:")
    for agent_data in orchestrator.list_agents():
        logger.info(f"- {agent_data['id']}")

    # Start event loop, message handling, and agent scheduling
    loop = asyncio.get_event_loop()

    try:
        loop.run_until_complete(orchestrator.schedule_agents(interval=10))
    except KeyboardInterrupt:
        logger.info("Shutting down agent orchestrator gracefully.")
        loop.stop()
