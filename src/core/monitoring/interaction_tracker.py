"""User interaction tracking and analysis module."""

from typing import Dict, List, Optional
import time
from dataclasses import dataclass
from datetime import datetime
import threading
from collections import defaultdict
import structlog

@dataclass
class UserClick:
    timestamp: float
    element_id: str
    x: int
    y: int

@dataclass
class UserSession:
    session_id: str
    user_id: str
    start_time: float
    last_activity: float
    clicks: List[UserClick]
    page_views: List[str]
    actions: List[Dict]

class InteractionTracker:
    def __init__(self):
        self.logger = structlog.get_logger(__name__)
        self._sessions: Dict[str, UserSession] = {}
        self._lock = threading.Lock()
        self.RAGE_CLICK_THRESHOLD = 5  # clicks
        self.RAGE_CLICK_WINDOW = 2.0   # seconds
        self.SESSION_TIMEOUT = 1800     # 30 minutes

    def track_click(self, session_id: str, user_id: str, element_id: str, x: int, y: int):
        with self._lock:
            current_time = time.time()
            
            # Get or create session
            session = self._sessions.get(session_id)
            if not session:
                session = UserSession(
                    session_id=session_id,
                    user_id=user_id,
                    start_time=current_time,
                    last_activity=current_time,
                    clicks=[],
                    page_views=[],
                    actions=[]
                )
                self._sessions[session_id] = session
            
            # Add click
            click = UserClick(timestamp=current_time, element_id=element_id, x=x, y=y)
            session.clicks.append(click)
            session.last_activity = current_time
            
            # Check for rage clicks
            self._check_rage_clicks(session, element_id)

    def track_page_view(self, session_id: str, user_id: str, page_path: str):
        with self._lock:
            current_time = time.time()
            session = self._sessions.get(session_id)
            if not session:
                session = UserSession(
                    session_id=session_id,
                    user_id=user_id,
                    start_time=current_time,
                    last_activity=current_time,
                    clicks=[],
                    page_views=[],
                    actions=[]
                )
                self._sessions[session_id] = session
            
            session.page_views.append(page_path)
            session.last_activity = current_time

    def track_action(self, session_id: str, user_id: str, action_type: str, context: Optional[Dict] = None):
        with self._lock:
            current_time = time.time()
            session = self._sessions.get(session_id)
            if not session:
                session = UserSession(
                    session_id=session_id,
                    user_id=user_id,
                    start_time=current_time,
                    last_activity=current_time,
                    clicks=[],
                    page_views=[],
                    actions=[]
                )
                self._sessions[session_id] = session
            
            action = {
                "type": action_type,
                "timestamp": current_time,
                "context": context or {}
            }
            session.actions.append(action)
            session.last_activity = current_time

    def _check_rage_clicks(self, session: UserSession, element_id: str):
        current_time = time.time()
        recent_clicks = [
            click for click in session.clicks
            if click.element_id == element_id
            and current_time - click.timestamp <= self.RAGE_CLICK_WINDOW
        ]
        
        if len(recent_clicks) >= self.RAGE_CLICK_THRESHOLD:
            self.logger.warning(
                "rage_clicks_detected",
                session_id=session.session_id,
                user_id=session.user_id,
                element_id=element_id,
                click_count=len(recent_clicks),
                window_seconds=self.RAGE_CLICK_WINDOW
            )

    def cleanup_expired_sessions(self):
        with self._lock:
            current_time = time.time()
            expired_sessions = [
                session_id for session_id, session in self._sessions.items()
                if current_time - session.last_activity > self.SESSION_TIMEOUT
            ]
            for session_id in expired_sessions:
                del self._sessions[session_id]

interaction_tracker = InteractionTracker() 