#!/usr/bin/env python

"""
dashboard.py - Flask-based Web Server for 3AI Platform

This module implements a modern Flask web server with WebSocket support for real-time 
agent status updates and RESTful API endpoints.

Key Features:
- Real-time WebSocket updates for agent statuses
- RESTful API endpoints for agent management
- Structured logging and error handling
- Modular template rendering
"""

import os
import logging
import json
import asyncio
import time
from datetime import datetime
from collections import defaultdict, deque
from functools import wraps
import psutil
import structlog
from flask import Flask, render_template, jsonify, request, session
from flask_socketio import SocketIO
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from src.core.agent_orchestration import AgentOrchestrator
from flask_wtf.csrf import CSRFProtect
import sys

# ----------------------------------------------------------------------------
# Enhanced Logging Configuration
# ----------------------------------------------------------------------------
def setup_structured_logging():
    structlog.configure(
        processors=[
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.add_log_level,
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer()
        ],
        wrapper_class=structlog.BoundLogger,
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )

setup_structured_logging()
logger = structlog.get_logger()

# ----------------------------------------------------------------------------
# Resource and Error Monitoring
# ----------------------------------------------------------------------------
class MonitoringService:
    def __init__(self):
        self.error_counts = defaultdict(int)
        self.recent_errors = deque(maxlen=100)
        self.user_interactions = defaultdict(lambda: defaultdict(int))
        self.resource_metrics = deque(maxlen=60)  # Last hour of metrics
        self.rate_limits = defaultdict(lambda: defaultdict(int))
        
    def track_error(self, error_type, error_msg, user_id=None):
        timestamp = datetime.utcnow()
        self.error_counts[error_type] += 1
        error_data = {
            'timestamp': timestamp.isoformat(),
            'type': error_type,
            'message': error_msg,
            'user_id': user_id
        }
        self.recent_errors.append(error_data)
        logger.error("error_tracked", 
            error_type=error_type,
            error_msg=error_msg,
            user_id=user_id
        )
        
    def track_interaction(self, user_id, action_type):
        timestamp = int(time.time())
        self.user_interactions[user_id][action_type] += 1
        
        # Detect rage clicks (more than 5 clicks in 2 seconds)
        recent_clicks = sum(1 for t in self.user_interactions[user_id].values() 
                          if t > timestamp - 2)
        if recent_clicks > 5:
            logger.warning("rage_clicks_detected",
                user_id=user_id,
                click_count=recent_clicks
            )
            
    def collect_resource_metrics(self):
        metrics = {
            'timestamp': datetime.utcnow().isoformat(),
            'cpu_percent': psutil.cpu_percent(),
            'memory_percent': psutil.virtual_memory().percent,
            'disk_usage': psutil.disk_usage('/').percent,
            'open_files': len(psutil.Process().open_files()),
            'connections': len(psutil.Process().connections())
        }
        self.resource_metrics.append(metrics)
        
        # Log warnings for high resource usage
        if metrics['cpu_percent'] > 80:
            logger.warning("high_cpu_usage", cpu_percent=metrics['cpu_percent'])
        if metrics['memory_percent'] > 85:
            logger.warning("high_memory_usage", memory_percent=metrics['memory_percent'])
            
    def check_rate_limit(self, user_id, action_type, limit=60, window=60):
        """Rate limiting with sliding window"""
        now = time.time()
        self.rate_limits[user_id][action_type] = [
            t for t in self.rate_limits[user_id][action_type] 
            if t > now - window
        ]
        
        if len(self.rate_limits[user_id][action_type]) >= limit:
            logger.warning("rate_limit_exceeded",
                user_id=user_id,
                action_type=action_type
            )
            return False
            
        self.rate_limits[user_id][action_type].append(now)
        return True

monitoring = MonitoringService()

# ----------------------------------------------------------------------------
# Initialize Core Application Components
# ----------------------------------------------------------------------------
app = Flask(__name__, 
    template_folder="templates",
    static_folder="static"
)
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', 'dev_key')
csrf = CSRFProtect(app)

# Rate limiting
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

# Enable CORS for WebSocket with enhanced logging
socketio = SocketIO(app, 
    cors_allowed_origins="*",
    async_mode='eventlet',
    logger=True,
    engineio_logger=True
)

# Initialize agent management
orchestrator = AgentOrchestrator()

# ----------------------------------------------------------------------------
# Middleware and Decorators
# ----------------------------------------------------------------------------
def log_request():
    """Log request details with context"""
    logger.info("request_received",
        path=request.path,
        method=request.method,
        user_id=session.get('user', {}).get('id'),
        ip=request.remote_addr
    )

@app.before_request
def before_request():
    log_request()
    monitoring.collect_resource_metrics()

def require_user(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = session.get('user')
        if not user:
            user = {
                'id': '1',
                'name': 'Test User',
                'has_2fa': False,
                'preferences': {}
            }
            session['user'] = user
            
        # Track user activity
        monitoring.track_interaction(user['id'], request.endpoint)
        return f(*args, **kwargs)
    return decorated_function

# ----------------------------------------------------------------------------
# UI Routes - Main Dashboard Pages
# ----------------------------------------------------------------------------
@app.route("/")
@require_user
def index():
    """Render main dashboard with agent overview."""
    try:
        return render_template("index.html")
    except Exception as e:
        logger.error(f"Failed to render index: {e}", exc_info=True)
        return render_template("error500.html"), 500

@app.route("/reports")
def reports():
    """Render reports page with agent analytics."""
    try:
        return render_template("reports.html")
    except Exception as e:
        logger.error(f"Failed to render reports: {e}", exc_info=True)
        return render_template("error500.html"), 500

@app.route("/settings")
@require_user
def settings():
    """Render settings page for agent configuration."""
    try:
        user = session.get('user', {})
        return render_template("settings.html", user=user)
    except Exception as e:
        logger.error(f"Failed to render settings: {e}", exc_info=True)
        return render_template("error500.html"), 500

# ----------------------------------------------------------------------------
# REST API Endpoints
# ----------------------------------------------------------------------------
@app.route("/api/agents", methods=["GET"])
@limiter.limit("30 per minute")
def get_agents():
    """
    GET /api/agents - Retrieve list of all registered agents
    Returns:
        JSON array of agent data
    """
    try:
        user_id = session.get('user', {}).get('id')
        if not monitoring.check_rate_limit(user_id, 'get_agents'):
            return jsonify({"error": "Rate limit exceeded"}), 429
            
        agents = orchestrator.list_agents()
        return jsonify({"agents": agents})
    except Exception as e:
        monitoring.track_error('agent_list_error', str(e), user_id)
        logger.exception("failed_to_fetch_agents")
        return jsonify({
            "status": "error",
            "message": "Failed to retrieve agents"
        }), 500

@app.route("/api/agent-status", methods=["GET"])
def agent_status():
    """
    GET /api/agent-status - Get real-time status of all agents
    Returns:
        JSON array of agent status data
    """
    try:
        agent_data = [
            {
                "name": agent.name,
                "status": agent.status,
                "last_active": agent.last_active
            } 
            for agent in orchestrator.agents.values()
        ]
        return jsonify(agent_data)
    except Exception as e:
        logger.error(f"Failed to fetch agent status: {e}", exc_info=True)
        return jsonify({
            "status": "error",
            "message": "Failed to retrieve agent status"
        }), 500

# ----------------------------------------------------------------------------
# WebSocket Event Handlers with Enhanced Monitoring
# ----------------------------------------------------------------------------
@socketio.on("connect")
def handle_connect():
    """Handle new WebSocket client connection with monitoring."""
    user_id = session.get('user', {}).get('id')
    logger.info("websocket_connected",
        user_id=user_id,
        sid=request.sid
    )
    monitoring.track_interaction(user_id, 'websocket_connect')

@socketio.on("disconnect")
def handle_disconnect():
    """Handle WebSocket client disconnection with monitoring."""
    user_id = session.get('user', {}).get('id')
    logger.info("websocket_disconnected",
        user_id=user_id,
        sid=request.sid
    )

# ----------------------------------------------------------------------------
# Error Handlers with Monitoring
# ----------------------------------------------------------------------------
@app.errorhandler(404)
def not_found(e):
    """Handle 404 Not Found errors with monitoring."""
    user_id = session.get('user', {}).get('id')
    monitoring.track_error('not_found', str(e), user_id)
    return render_template("error404.html"), 404

@app.errorhandler(500)
def server_error(e):
    """Handle 500 Internal Server errors with monitoring."""
    user_id = session.get('user', {}).get('id')
    monitoring.track_error('server_error', str(e), user_id)
    return render_template("error500.html"), 500

# ----------------------------------------------------------------------------
# Monitoring Endpoints
# ----------------------------------------------------------------------------
@app.route("/api/monitoring/metrics")
@require_user
def get_metrics():
    """Get current monitoring metrics"""
    try:
        return jsonify({
            'resource_metrics': list(monitoring.resource_metrics),
            'error_counts': dict(monitoring.error_counts),
            'recent_errors': list(monitoring.recent_errors)
        })
    except Exception as e:
        logger.exception("failed_to_fetch_metrics")
        return jsonify({"error": "Failed to fetch metrics"}), 500

# Add health check endpoint for Docker healthchecks
@app.route("/api/health")
def health_check():
    """Simple health check endpoint for Docker and monitoring tools."""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    })

# ----------------------------------------------------------------------------
# Main Entry Point
# ----------------------------------------------------------------------------
if __name__ == "__main__":
    host = os.environ.get("FLASK_HOST", "0.0.0.0")
    port = int(os.environ.get("FLASK_PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "False").lower() == "true"
    
    # Initialize the agent orchestrator
    agent_orchestrator = AgentOrchestrator()
    
    # Start the SocketIO server
    socketio.run(app, host=host, port=port, debug=debug)
