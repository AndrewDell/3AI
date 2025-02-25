from .base import BaseAgent
import logging
import asyncio
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
from dataclasses import dataclass
import structlog

# Configure structured logging
logger = structlog.get_logger(__name__)

@dataclass
class SalesMetrics:
    """Tracks key sales performance metrics."""
    success_rate: float = 1.0
    avg_response_time: float = 0.0
    error_count: int = 0
    last_success: Optional[datetime] = None
    consecutive_failures: int = 0

class SalesCircuitBreaker:
    """Circuit breaker for sales operations."""
    def __init__(self, failure_threshold: int = 3, recovery_timeout: int = 300):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout  # seconds
        self.failures = 0
        self.last_failure: Optional[datetime] = None
        self.is_open = False

    def record_failure(self):
        self.failures += 1
        self.last_failure = datetime.now()
        if self.failures >= self.failure_threshold:
            self.is_open = True

    def record_success(self):
        self.failures = 0
        self.is_open = False

    def can_execute(self) -> bool:
        if not self.is_open:
            return True
        if self.last_failure and (datetime.now() - self.last_failure).seconds > self.recovery_timeout:
            self.is_open = False
            self.failures = 0
            return True
        return False

class SalesAgent(BaseAgent):
    """
    Handles sales-related automation with enhanced resilience features for lead qualification, 
    pipeline updates, and outreach personalization.
    """

    def __init__(self, name: str):
        """
        Initialize the SalesAgent with resilience features and enhanced tracking.
        
        Args:
            name (str): Agent's display name.
        """
        super().__init__(name)
        # Basic metrics tracking
        self.leads_processed = 0
        self.deals_closed = 0
        
        # Enhanced tracking for synergies
        self.marketing_leads = []  # Leads from Marketing Agent
        self.upsell_opportunities = []  # Opportunities from Customer Success
        
        # Resilience features
        self.circuit_breaker = SalesCircuitBreaker()
        self.metrics = SalesMetrics()
        self.health_check_interval = 60  # seconds
        self.recovery_strategies = {
            'retry': self._recovery_retry,
            'reset': self._recovery_reset,
            'fallback': self._recovery_fallback
        }
        
        # Message queue for inter-agent communication
        self.message_queue = asyncio.Queue()

    async def process_lead(self, lead: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a single lead with circuit breaker and enhanced monitoring.
        
        Args:
            lead (dict): Lead information including contact and company data.
            
        Returns:
            dict: Processed lead result with qualification status.
        """
        if not self.circuit_breaker.can_execute():
            logger.warning("circuit_breaker_open", agent_name=self.name)
            return {"lead_id": lead.get("lead_id", "unknown"), "status": "circuit_breaker_open"}

        start_time = datetime.now()
        try:
            self.leads_processed += 1
            logger.info("processing_lead", 
                agent_name=self.name,
                lead_id=lead.get("lead_id", "unknown")
            )
            
            # Lead qualification logic would go here
            result = {
                "lead_id": lead.get("lead_id", "unknown"),
                "status": "qualified",
                "score": 0.0,  # Placeholder for actual scoring logic
                "next_action": "nurture"
            }
            
            # Update metrics on success
            self._update_metrics(start_time, success=True)
            self.circuit_breaker.record_success()
            
            return result
        except Exception as e:
            # Update metrics and circuit breaker on failure
            self._update_metrics(start_time, success=False)
            self.circuit_breaker.record_failure()
            
            logger.error("lead_processing_failed",
                agent_name=self.name,
                lead_id=lead.get("lead_id", "unknown"),
                error=str(e)
            )
            
            if self.circuit_breaker.is_open:
                await self._handle_failure("process_lead")
            
            return {"lead_id": lead.get("lead_id", "unknown"), "status": "error"}

    async def _handle_failure(self, operation: str):
        """Handle failures with progressive recovery strategies."""
        logger.warning("handling_failure",
            agent_name=self.name,
            operation=operation,
            consecutive_failures=self.metrics.consecutive_failures
        )
        
        # Try recovery strategies in order
        for strategy in ['retry', 'reset', 'fallback']:
            try:
                logger.info("attempting_recovery",
                    agent_name=self.name,
                    strategy=strategy
                )
                
                recovery_func = self.recovery_strategies[strategy]
                if await recovery_func():
                    logger.info("recovery_successful",
                        agent_name=self.name,
                        strategy=strategy
                    )
                    return
            except Exception as e:
                logger.error("recovery_failed",
                    agent_name=self.name,
                    strategy=strategy,
                    error=str(e)
                )

    async def _recovery_retry(self) -> bool:
        """Simple retry after a short delay."""
        await asyncio.sleep(5)
        return True

    async def _recovery_reset(self) -> bool:
        """Reset internal state and circuit breaker."""
        self.circuit_breaker = SalesCircuitBreaker()
        self.metrics = SalesMetrics()
        return True

    async def _recovery_fallback(self) -> bool:
        """Fallback to minimal functionality."""
        # Implement fallback behavior here
        return False

    def _update_metrics(self, start_time: datetime, success: bool):
        """Update performance metrics using exponential moving average."""
        execution_time = (datetime.now() - start_time).total_seconds()
        
        # Update success rate
        alpha = 0.1  # Smoothing factor
        current_success = 1.0 if success else 0.0
        self.metrics.success_rate = (
            alpha * current_success +
            (1 - alpha) * self.metrics.success_rate
        )
        
        # Update response time
        self.metrics.avg_response_time = (
            alpha * execution_time +
            (1 - alpha) * self.metrics.avg_response_time
        )
        
        # Update error tracking
        if success:
            self.metrics.consecutive_failures = 0
            self.metrics.last_success = datetime.now()
        else:
            self.metrics.error_count += 1
            self.metrics.consecutive_failures += 1

    async def health_check(self) -> bool:
        """Perform a health check on the sales agent."""
        try:
            is_healthy = (
                not self.circuit_breaker.is_open and
                self.metrics.success_rate >= 0.8 and
                self.metrics.consecutive_failures < 3 and
                (self.metrics.last_success is None or
                 (datetime.now() - self.metrics.last_success).seconds < 3600)
            )
            return is_healthy
        except Exception as e:
            logger.error("health_check_failed", agent_name=self.name, error=str(e))
            return False

    async def run(self, **kwargs) -> dict:
        """
        Execute the agent's sales routine with enhanced resilience and monitoring.
        
        Args:
            **kwargs:
                - leads (list): List of lead dicts with contact info, company data.
                - pipeline_action (str): E.g., "qualify", "nurture", "close_deal".
                - generate_report (bool): Whether to produce performance summary.
                
        Returns:
            dict: Summary of sales tasks, deals, and pipeline updates.
        """
        if not self.circuit_breaker.can_execute():
            return {
                "agent": self.name,
                "status": "circuit_breaker_open",
                "error_message": "Circuit breaker is open, operations suspended"
            }

        start_time = datetime.now()
        try:
            self.log_startup()
            
            leads = kwargs.get("leads", [])
            pipeline_action = kwargs.get("pipeline_action", "qualify")
            generate_report = kwargs.get("generate_report", False)
            pipeline_updates = 0

            # Process leads concurrently with enhanced monitoring
            if leads:
                tasks = [self.process_lead(lead) for lead in leads]
                results = await asyncio.gather(*tasks, return_exceptions=True)
                
                # Handle results and update metrics
                success_count = 0
                for result in results:
                    if isinstance(result, Exception):
                        logger.error("lead_processing_failed", 
                            agent_name=self.name,
                            error=str(result)
                        )
                        continue
                    
                    if result.get("status") == "qualified":
                        success_count += 1
                        await self.notify_marketing_agent(result)

                # Update overall success metrics
                self._update_metrics(start_time, success=success_count > 0)

            # Enhanced pipeline management with monitoring
            if pipeline_action == "close_deal":
                try:
                    closed_deals = await self.close_deals(leads)
                    self.deals_closed += closed_deals
                    pipeline_updates = closed_deals
                    logger.info("deals_closed",
                        agent_name=self.name,
                        count=closed_deals
                    )
                except Exception as e:
                    logger.error("deal_closing_failed",
                        agent_name=self.name,
                        error=str(e)
                    )
                    self.circuit_breaker.record_failure()

            # Generate comprehensive performance report
            report_data = None
            if generate_report:
                try:
                    report_data = await self.generate_performance_report()
                except Exception as e:
                    logger.error("report_generation_failed",
                        agent_name=self.name,
                        error=str(e)
                    )

            # Record overall success
            self.circuit_breaker.record_success()
            
            return {
                "agent": self.name,
                "pipeline_action": pipeline_action,
                "leads_processed_now": len(leads),
                "leads_processed_total": self.leads_processed,
                "deals_closed_now": pipeline_updates,
                "deals_closed_total": self.deals_closed,
                "report_generated": bool(report_data),
                "report_data": report_data,
                "metrics": {
                    "success_rate": self.metrics.success_rate,
                    "avg_response_time": self.metrics.avg_response_time,
                    "error_count": self.metrics.error_count,
                    "consecutive_failures": self.metrics.consecutive_failures
                },
                "status": "Sales tasks executed successfully"
            }
            
        except Exception as e:
            # Update metrics and circuit breaker on failure
            self._update_metrics(start_time, success=False)
            self.circuit_breaker.record_failure()
            
            logger.error("sales_routine_failed",
                agent_name=self.name,
                error=str(e)
            )
            
            if self.circuit_breaker.is_open:
                await self._handle_failure("run")
            
            return {
                "agent": self.name,
                "status": "error",
                "error_message": str(e),
                "circuit_breaker_open": self.circuit_breaker.is_open
            }