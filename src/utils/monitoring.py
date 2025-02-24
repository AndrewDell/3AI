# src/utils/monitoring.py
"""
Custom monitoring setup for the 3AI platform.

Best Practices Implemented:
1. Prometheus Integration for Metrics
2. Start an HTTP server for metric scraping
3. Sample Metrics (Counters, Gauges) for Agent Operations
4. Easily Extensible for Additional Metrics
"""

import os
from prometheus_client import start_http_server, Counter, Gauge

# Example counters for agent operations
agent_run_counter = Counter("agent_run_count", "Number of times any agent's run() method is invoked")
agent_error_counter = Counter("agent_error_count", "Number of errors encountered across all agents")

# Optional gauge to track concurrent operations
agent_active_gauge = Gauge("agent_active_operations", "Number of agents running at a given time")

def initialize_monitoring():
    """
    Start a Prometheus HTTP server to expose metrics. The port can be configured via environment variable.
    """
    default_port = 8001
    port = int(os.getenv("METRIC_PORT", default_port))
    start_http_server(port)
    print(f"Prometheus metrics server started on port {port}.")

def track_agent_run():
    """
    Increment the counter whenever an agent successfully starts or completes its 'run' method.
    """
    agent_run_counter.inc()

def track_agent_error():
    """
    Increment the counter when an agent encounters an error.
    """
    agent_error_counter.inc()

def set_active_operations(value: int):
    """
    Update the gauge to indicate how many agents are currently active.
    """
    agent_active_gauge.set(value)
