"""API endpoints for accessing monitoring data."""

from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import structlog
from datetime import datetime, timedelta
import asyncio

from .rate_limiter import rate_limiter, RateLimitConfig
from . import monitoring_service
from .interaction_tracker import interaction_tracker

router = APIRouter(prefix="/api/monitoring", tags=["monitoring"])
security = HTTPBearer()
logger = structlog.get_logger(__name__)

# Rate limit configuration for monitoring endpoints
METRICS_RATE_LIMIT = RateLimitConfig(max_requests=60, window_seconds=60)  # 1 request per second
ADMIN_RATE_LIMIT = RateLimitConfig(max_requests=600, window_seconds=3600)  # 600 requests per hour

def verify_admin_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    # In production, replace with proper token verification
    if credentials.credentials != "admin-token":
        raise HTTPException(status_code=403, detail="Invalid admin token")
    return credentials.credentials

@router.get("/metrics")
async def get_metrics(request: Request, token: str = Depends(verify_admin_token)) -> Dict[str, Any]:
    if rate_limiter.is_rate_limited(token, "metrics", METRICS_RATE_LIMIT):
        remaining, reset_in = rate_limiter.get_remaining_quota(token, "metrics", METRICS_RATE_LIMIT)
        raise HTTPException(
            status_code=429,
            detail={
                "message": "Rate limit exceeded",
                "remaining": remaining,
                "reset_in": reset_in
            }
        )

    metrics = monitoring_service.get_current_metrics()
    if not metrics:
        raise HTTPException(status_code=503, detail="Metrics not available")

    return {
        "timestamp": metrics.timestamp.isoformat(),
        "system": {
            "cpu_percent": metrics.cpu_percent,
            "memory_percent": metrics.memory_percent,
            "disk_usage": metrics.disk_usage,
            "open_files": metrics.open_files,
            "connections": metrics.connections
        },
        "predictions": metrics.prediction_window
    }

@router.get("/metrics/history")
async def get_metrics_history(
    minutes: int = 60,
    token: str = Depends(verify_admin_token)
) -> List[Dict[str, Any]]:
    """Get historical metrics for the specified duration."""
    if rate_limiter.is_rate_limited(token, "metrics_history", ADMIN_RATE_LIMIT):
        remaining, reset_in = rate_limiter.get_remaining_quota(token, "metrics_history", ADMIN_RATE_LIMIT)
        raise HTTPException(
            status_code=429,
            detail={
                "message": "Rate limit exceeded",
                "remaining": remaining,
                "reset_in": reset_in
            }
        )

    history = monitoring_service.get_metrics_history(minutes)
    return [{
        "timestamp": m.timestamp.isoformat(),
        "system": {
            "cpu_percent": m.cpu_percent,
            "memory_percent": m.memory_percent,
            "disk_usage": m.disk_usage,
            "open_files": m.open_files,
            "connections": m.connections
        },
        "predictions": m.prediction_window
    } for m in history]

@router.get("/health")
async def health_check(background_tasks: BackgroundTasks) -> Dict[str, Any]:
    metrics = monitoring_service.get_current_metrics()
    
    status = "healthy"
    warnings = []
    critical = []

    if metrics:
        # Check current metrics
        if metrics.cpu_percent > 90:
            status = "critical"
            critical.append("CPU usage extremely high")
        elif metrics.cpu_percent > 80:
            status = "degraded"
            warnings.append("CPU usage high")

        if metrics.memory_percent > 90:
            status = "critical"
            critical.append("Memory usage extremely high")
        elif metrics.memory_percent > 85:
            status = "degraded"
            warnings.append("Memory usage high")

        for path, usage in metrics.disk_usage.items():
            if usage > 95:
                status = "critical"
                critical.append(f"Disk usage critical on {path}")
            elif usage > 90:
                status = "degraded"
                warnings.append(f"Disk usage high on {path}")

        # Check predictions
        if metrics.prediction_window:
            if metrics.prediction_window.get('cpu_percent', 0) > 90:
                warnings.append("CPU usage predicted to reach critical levels")
            if metrics.prediction_window.get('memory_percent', 0) > 90:
                warnings.append("Memory usage predicted to reach critical levels")
    else:
        status = "unknown"
        warnings.append("Metrics collection unavailable")

    response = {
        "status": status,
        "timestamp": datetime.now().isoformat(),
        "warnings": warnings,
        "critical": critical
    }

    # If status is critical, trigger async recovery tasks
    if status == "critical":
        background_tasks.add_task(trigger_recovery_actions)

    return response

async def trigger_recovery_actions():
    """Trigger recovery actions asynchronously."""
    try:
        metrics = monitoring_service.get_current_metrics()
        if metrics.cpu_percent > 90:
            await asyncio.to_thread(monitoring_service._handle_high_cpu)
        if metrics.memory_percent > 90:
            await asyncio.to_thread(monitoring_service._handle_high_memory)
        if any(usage > 95 for usage in metrics.disk_usage.values()):
            await asyncio.to_thread(monitoring_service._handle_high_disk)
    except Exception as e:
        logger.error("recovery_action_failed", error=str(e))

@router.get("/user-activity/{user_id}")
async def get_user_activity(
    user_id: str,
    request: Request,
    token: str = Depends(verify_admin_token)
) -> Dict[str, Any]:
    if rate_limiter.is_rate_limited(token, "user_activity", ADMIN_RATE_LIMIT):
        remaining, reset_in = rate_limiter.get_remaining_quota(token, "user_activity", ADMIN_RATE_LIMIT)
        raise HTTPException(
            status_code=429,
            detail={
                "message": "Rate limit exceeded",
                "remaining": remaining,
                "reset_in": reset_in
            }
        )

    # Get all sessions for the user
    user_sessions = [
        session for session in interaction_tracker._sessions.values()
        if session.user_id == user_id
    ]

    if not user_sessions:
        return {
            "user_id": user_id,
            "sessions": []
        }

    return {
        "user_id": user_id,
        "sessions": [{
            "session_id": session.session_id,
            "start_time": datetime.fromtimestamp(session.start_time).isoformat(),
            "last_activity": datetime.fromtimestamp(session.last_activity).isoformat(),
            "page_views": len(session.page_views),
            "total_clicks": len(session.clicks),
            "total_actions": len(session.actions)
        } for session in user_sessions]
    } 