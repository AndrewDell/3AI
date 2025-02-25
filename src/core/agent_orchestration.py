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
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
import aiohttp
import structlog
import nodemailer

# Configure structured logging
logger = structlog.get_logger(__name__)

class AgentState(Enum):
    IDLE = "idle"
    RUNNING = "running"
    FAILED = "failed"
    RECOVERING = "recovering"
    STOPPED = "stopped"

@dataclass
class CircuitBreaker:
    failure_threshold: int = 3
    recovery_timeout: int = 300  # seconds
    failure_count: int = 0
    last_failure: Optional[datetime] = None
    is_open: bool = False

    def record_failure(self):
        self.failure_count += 1
        self.last_failure = datetime.now()
        if self.failure_count >= self.failure_threshold:
            self.is_open = True

    def record_success(self):
        self.failure_count = 0
        self.is_open = False

    def should_allow_request(self) -> bool:
        if not self.is_open:
            return True
        if self.last_failure and (datetime.now() - self.last_failure).seconds > self.recovery_timeout:
            self.is_open = False
            self.failure_count = 0
            return True
        return False

class BaseAgent(ABC):
    """Abstract base class for all domain-specific AI agents."""

    def __init__(self, name: str):
        self.name = name
        self.state = AgentState.IDLE
        self.last_active = datetime.now()
        self.circuit_breaker = CircuitBreaker()
        self.health_metrics = {
            'success_rate': 1.0,
            'avg_response_time': 0.0,
            'error_count': 0
        }

    @abstractmethod
    async def run(self, **kwargs) -> Any:
        """Execute the agent's main functionality."""
        pass

    def log_startup(self):
        """Log agent startup."""
        logger.info("agent_startup", agent_name=self.name)

    def log_shutdown(self):
        """Log agent shutdown."""
        logger.info("agent_shutdown", agent_name=self.name)

    async def health_check(self) -> bool:
        """Perform a health check on the agent."""
        try:
            # Basic health check implementation
            is_healthy = (
                self.state != AgentState.FAILED and
                self.health_metrics['success_rate'] >= 0.8 and
                self.health_metrics['error_count'] < 5
            )
            return is_healthy
        except Exception as e:
            logger.error("health_check_failed", agent_name=self.name, error=str(e))
            return False

class AgentOrchestrator:
    """Manages and coordinates AI agents with enhanced resilience features."""
    
    def __init__(self):
        self.agents: Dict[str, BaseAgent] = {}
        self.active_tasks = {}
        self.health_check_interval = 60  # seconds
        self.recovery_strategies = {
            'restart': self._recovery_restart,
            'failover': self._recovery_failover,
            'graceful_shutdown': self._recovery_shutdown
        }

    async def register_agent(self, agent: BaseAgent) -> bool:
        """Register a new agent with the orchestrator."""
        try:
            if agent.name not in self.agents:
                self.agents[agent.name] = agent
                logger.info("agent_registered", agent_name=agent.name)
                # Start health monitoring for the agent
                asyncio.create_task(self._monitor_agent_health(agent.name))
                return True
            return False
        except Exception as e:
            logger.error("agent_registration_failed", agent_name=agent.name, error=str(e))
            return False

    async def run_agent(self, agent: BaseAgent) -> Any:
        """Execute an agent with circuit breaker and monitoring."""
        if not agent.circuit_breaker.should_allow_request():
            logger.warning("circuit_breaker_open", agent_name=agent.name)
            return None

        start_time = datetime.now()
        try:
            agent.state = AgentState.RUNNING
            agent.last_active = datetime.now()
            
            result = await agent.run()
            
            # Update metrics on success
            agent.circuit_breaker.record_success()
            self._update_health_metrics(agent, start_time, success=True)
            
            return result
        except Exception as e:
            # Update metrics on failure
            agent.circuit_breaker.record_failure()
            self._update_health_metrics(agent, start_time, success=False)
            
            logger.error("agent_execution_failed", 
                agent_name=agent.name,
                error=str(e),
                failure_count=agent.circuit_breaker.failure_count
            )
            
            if agent.circuit_breaker.is_open:
                await self._handle_agent_failure(agent.name)
            
            return None

    async def _monitor_agent_health(self, agent_name: str):
        """Continuously monitor agent health and trigger recovery if needed."""
        while True:
            try:
                agent = self.agents.get(agent_name)
                if agent:
                    is_healthy = await agent.health_check()
                    if not is_healthy:
                        logger.warning("agent_unhealthy", agent_name=agent_name)
                        await self._handle_agent_failure(agent_name)
            except Exception as e:
                logger.error("health_monitoring_failed", agent_name=agent_name, error=str(e))
            
            await asyncio.sleep(self.health_check_interval)

    async def _handle_agent_failure(self, agent_name: str):
        """Handle agent failures with progressive recovery strategies."""
        agent = self.agents.get(agent_name)
        if not agent:
            return

        agent.state = AgentState.FAILED
        
        # Try recovery strategies in order
        for strategy in ['restart', 'failover', 'graceful_shutdown']:
            try:
                logger.info("attempting_recovery", 
                    agent_name=agent_name,
                    strategy=strategy
                )
                
                recovery_func = self.recovery_strategies[strategy]
                success = await recovery_func(agent_name)
                
                if success:
                    logger.info("recovery_successful",
                        agent_name=agent_name,
                        strategy=strategy
                    )
                    return
            except Exception as e:
                logger.error("recovery_failed",
                    agent_name=agent_name,
                    strategy=strategy,
                    error=str(e)
                )

    async def _recovery_restart(self, agent_name: str) -> bool:
        """Attempt to restart a failed agent."""
        agent = self.agents.get(agent_name)
        if not agent:
            return False

        try:
            agent.state = AgentState.RECOVERING
            # Simulate cleanup and restart
            await asyncio.sleep(1)
            agent.circuit_breaker = CircuitBreaker()  # Reset circuit breaker
            agent.state = AgentState.IDLE
            return True
        except Exception as e:
            logger.error("restart_failed", agent_name=agent_name, error=str(e))
            return False

    async def _recovery_failover(self, agent_name: str) -> bool:
        """Attempt to failover to a backup instance."""
        # Implement failover logic here
        return False

    async def _recovery_shutdown(self, agent_name: str) -> bool:
        """Gracefully shutdown a failed agent."""
        agent = self.agents.get(agent_name)
        if not agent:
            return False

        try:
            agent.state = AgentState.STOPPED
            agent.log_shutdown()
            return True
        except Exception as e:
            logger.error("shutdown_failed", agent_name=agent_name, error=str(e))
            return False

    def _update_health_metrics(self, agent: BaseAgent, start_time: datetime, success: bool):
        """Update agent health metrics."""
        execution_time = (datetime.now() - start_time).total_seconds()
        
        # Update success rate (using exponential moving average)
        alpha = 0.1  # Smoothing factor
        current_success = 1.0 if success else 0.0
        agent.health_metrics['success_rate'] = (
            alpha * current_success +
            (1 - alpha) * agent.health_metrics['success_rate']
        )
        
        # Update average response time
        agent.health_metrics['avg_response_time'] = (
            alpha * execution_time +
            (1 - alpha) * agent.health_metrics['avg_response_time']
        )
        
        # Update error count
        if not success:
            agent.health_metrics['error_count'] += 1

    async def schedule_agents(self, interval: int = 60):
        """Schedule and execute agents with resilience features."""
        while True:
            tasks = []
            for agent in self.agents.values():
                if agent.state not in [AgentState.FAILED, AgentState.STOPPED]:
                    tasks.append(self.run_agent(agent))
            
            if tasks:
                await asyncio.gather(*tasks, return_exceptions=True)
            
            await asyncio.sleep(interval)


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
            orchestrator.register_agent(agent_instance)
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
