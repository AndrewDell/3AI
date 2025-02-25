"""Rate limiting implementation with sliding window approach."""

from typing import Dict, Tuple
import time
from dataclasses import dataclass
from datetime import datetime
import threading
from collections import defaultdict

@dataclass
class RateLimitConfig:
    max_requests: int
    window_seconds: int
    backoff_multiplier: float = 2.0

class SlidingWindowRateLimiter:
    def __init__(self):
        self._windows: Dict[str, Dict[str, list[float]]] = defaultdict(lambda: defaultdict(list))
        self._backoff_times: Dict[str, Dict[str, Tuple[float, int]]] = defaultdict(lambda: defaultdict(lambda: (0, 0)))
        self._lock = threading.Lock()

    def is_rate_limited(self, key: str, endpoint: str, config: RateLimitConfig) -> bool:
        with self._lock:
            current_time = time.time()
            window = self._windows[key][endpoint]
            
            # Clean old timestamps
            cutoff = current_time - config.window_seconds
            window[:] = [ts for ts in window if ts > cutoff]

            # Check backoff
            backoff_until, violations = self._backoff_times[key][endpoint]
            if current_time < backoff_until:
                return True

            # Check rate limit
            if len(window) >= config.max_requests:
                violations += 1
                backoff_duration = config.window_seconds * (config.backoff_multiplier ** violations)
                self._backoff_times[key][endpoint] = (current_time + backoff_duration, violations)
                return True

            # Add new request timestamp
            window.append(current_time)
            return False

    def get_remaining_quota(self, key: str, endpoint: str, config: RateLimitConfig) -> Tuple[int, float]:
        with self._lock:
            current_time = time.time()
            window = self._windows[key][endpoint]
            cutoff = current_time - config.window_seconds
            window[:] = [ts for ts in window if ts > cutoff]
            
            backoff_until, _ = self._backoff_times[key][endpoint]
            if current_time < backoff_until:
                return 0, backoff_until - current_time
                
            remaining = max(0, config.max_requests - len(window))
            reset_time = min(window[0] + config.window_seconds, current_time + config.window_seconds) if window else current_time + config.window_seconds
            return remaining, reset_time - current_time

rate_limiter = SlidingWindowRateLimiter() 