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
from flask import Flask, render_template, jsonify, request
from flask_socketio import SocketIO
from src.core.agent_orchestration import AgentOrchestrator

# ----------------------------------------------------------------------------
# Configure Logging with Environment Variable Support
# ----------------------------------------------------------------------------
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler("logs/dashboard.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ----------------------------------------------------------------------------
# Initialize Core Application Components
# ----------------------------------------------------------------------------
app = Flask(__name__, 
    template_folder="templates",
    static_folder="static"
)
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', 'dev_key')

# Enable CORS for WebSocket
socketio = SocketIO(app, 
    cors_allowed_origins="*",
    async_mode='eventlet'
)

# Initialize agent management
orchestrator = AgentOrchestrator()

# ----------------------------------------------------------------------------
# UI Routes - Main Dashboard Pages
# ----------------------------------------------------------------------------
@app.route("/")
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
def settings():
    """Render settings page for agent configuration."""
    try:
        return render_template("settings.html")
    except Exception as e:
        logger.error(f"Failed to render settings: {e}", exc_info=True)
        return render_template("error500.html"), 500

# ----------------------------------------------------------------------------
# REST API Endpoints
# ----------------------------------------------------------------------------
@app.route("/api/agents", methods=["GET"])
def get_agents():
    """
    GET /api/agents - Retrieve list of all registered agents
    Returns:
        JSON array of agent data
    """
    try:
        agents = orchestrator.list_agents()
        return jsonify({"agents": agents})
    except Exception as e:
        logger.error(f"Failed to fetch agents: {e}", exc_info=True)
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
# WebSocket Event Handlers
# ----------------------------------------------------------------------------
@socketio.on("connect")
def handle_connect():
    """Handle new WebSocket client connection."""
    logger.info(f"Client connected: {request.sid}")

@socketio.on("disconnect")
def handle_disconnect():
    """Handle WebSocket client disconnection."""
    logger.info(f"Client disconnected: {request.sid}")

# ----------------------------------------------------------------------------
# Error Handlers
# ----------------------------------------------------------------------------
@app.errorhandler(404)
def not_found(e):
    """Handle 404 Not Found errors."""
    return render_template("error404.html"), 404

@app.errorhandler(500)
def server_error(e):
    """Handle 500 Internal Server errors."""
    return render_template("error500.html"), 500

# ----------------------------------------------------------------------------
# Main Entry Point
# ----------------------------------------------------------------------------
if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "False").lower() == "true"
    
    logger.info(f"Starting 3AI Dashboard on port {port}")
    socketio.run(app, 
        host="0.0.0.0",
        port=port,
        debug=debug
    )
