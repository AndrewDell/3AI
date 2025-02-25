"""Core monitoring and observability components for 3AI."""

from typing import Any, Dict, Optional, List
import structlog
import time
import psutil
import threading
from dataclasses import dataclass
from datetime import datetime
import numpy as np
from scipy import stats
import signal
import subprocess

@dataclass
class SystemMetrics:
    cpu_percent: float
    memory_percent: float
    disk_usage: Dict[str, float]
    open_files: int
    connections: int
    timestamp: datetime
    prediction_window: Optional[Dict[str, float]] = None

class MonitoringService:
    def __init__(self):
        self.logger = structlog.get_logger(__name__)
        self._metrics_history: list[SystemMetrics] = []
        self._metrics_lock = threading.Lock()
        self._anomaly_thresholds = {
            'cpu_percent': 80.0,
            'memory_percent': 85.0,
            'disk_usage': 90.0
        }
        self._recovery_actions = {
            'cpu_percent': self._handle_high_cpu,
            'memory_percent': self._handle_high_memory,
            'disk_usage': self._handle_high_disk
        }
        self._start_metrics_collection()

    def _start_metrics_collection(self):
        def collect_metrics():
            while True:
                try:
                    metrics = self._collect_system_metrics()
                    self._detect_and_handle_anomalies(metrics)
                    with self._metrics_lock:
                        self._metrics_history.append(metrics)
                        if len(self._metrics_history) > 1000:
                            self._metrics_history.pop(0)
                except Exception as e:
                    self.logger.error("metrics_collection_error", error=str(e))
                time.sleep(60)

        thread = threading.Thread(target=collect_metrics, daemon=True)
        thread.start()

    def _collect_system_metrics(self) -> SystemMetrics:
        metrics = SystemMetrics(
            cpu_percent=psutil.cpu_percent(),
            memory_percent=psutil.virtual_memory().percent,
            disk_usage={path: psutil.disk_usage(path).percent for path in psutil.disk_partitions()},
            open_files=len(psutil.Process().open_files()),
            connections=len(psutil.Process().connections()),
            timestamp=datetime.now(),
            prediction_window=self._predict_metrics()
        )
        return metrics

    def _predict_metrics(self) -> Dict[str, float]:
        """Predict metrics for the next hour using simple linear regression."""
        if len(self._metrics_history) < 60:  # Need at least 60 data points
            return None

        predictions = {}
        recent_metrics = self._metrics_history[-60:]  # Last hour of metrics
        x = np.arange(len(recent_metrics))

        for metric in ['cpu_percent', 'memory_percent']:
            y = [getattr(m, metric) for m in recent_metrics]
            slope, intercept, _, _, _ = stats.linregress(x, y)
            predictions[metric] = max(0, min(100, intercept + slope * (len(x) + 60)))  # Predict 60 minutes ahead

        return predictions

    def _detect_and_handle_anomalies(self, metrics: SystemMetrics):
        """Detect anomalies and trigger auto-recovery if needed."""
        for metric_name, threshold in self._anomaly_thresholds.items():
            current_value = getattr(metrics, metric_name) if metric_name != 'disk_usage' else max(metrics.disk_usage.values())
            if current_value > threshold:
                self.logger.warning(f"anomaly_detected",
                    metric=metric_name,
                    value=current_value,
                    threshold=threshold
                )
                recovery_action = self._recovery_actions.get(metric_name)
                if recovery_action:
                    recovery_action()

    def _handle_high_cpu(self):
        """Handle high CPU usage by identifying and potentially restarting problematic processes."""
        try:
            processes = sorted(
                [(p, p.cpu_percent()) for p in psutil.process_iter(['name', 'cpu_percent'])],
                key=lambda x: x[1],
                reverse=True
            )[:5]  # Top 5 CPU-intensive processes

            for proc, cpu_usage in processes:
                if cpu_usage > 80:  # If process using >80% CPU
                    self.logger.warning("high_cpu_process",
                        process_name=proc.name(),
                        cpu_usage=cpu_usage
                    )

        except Exception as e:
            self.logger.error("cpu_recovery_error", error=str(e))

    def _handle_high_memory(self):
        """Handle high memory usage by attempting to free up memory."""
        try:
            # Clear Python's memory cache
            import gc
            gc.collect()

            # Identify memory-intensive processes
            processes = sorted(
                [(p, p.memory_percent()) for p in psutil.process_iter(['name', 'memory_percent'])],
                key=lambda x: x[1],
                reverse=True
            )[:5]  # Top 5 memory-intensive processes

            for proc, mem_usage in processes:
                if mem_usage > 30:  # If process using >30% memory
                    self.logger.warning("high_memory_process",
                        process_name=proc.name(),
                        memory_usage=mem_usage
                    )

        except Exception as e:
            self.logger.error("memory_recovery_error", error=str(e))

    def _handle_high_disk(self):
        """Handle high disk usage by identifying large files and old logs."""
        try:
            # Log directories with high usage
            for path, usage in psutil.disk_partitions():
                if psutil.disk_usage(path).percent > 90:
                    self.logger.warning("high_disk_usage",
                        path=path,
                        usage=usage
                    )

        except Exception as e:
            self.logger.error("disk_recovery_error", error=str(e))

    def get_current_metrics(self) -> SystemMetrics:
        with self._metrics_lock:
            return self._metrics_history[-1] if self._metrics_history else None

    def get_metrics_history(self, minutes: int = 60) -> List[SystemMetrics]:
        """Get metrics history for the specified duration."""
        with self._metrics_lock:
            return self._metrics_history[-minutes:]

    def log_user_action(self, user_id: str, action: str, context: Optional[Dict[str, Any]] = None):
        self.logger.info(
            "user_action",
            user_id=user_id,
            action=action,
            context=context or {},
            timestamp=datetime.now().isoformat()
        )

    def log_error(self, error: Exception, context: Optional[Dict[str, Any]] = None):
        self.logger.error(
            "system_error",
            error_type=type(error).__name__,
            error_message=str(error),
            context=context or {},
            timestamp=datetime.now().isoformat()
        )

monitoring_service = MonitoringService() 