export interface SystemMetrics {
  cpu_percent: number;
  memory_percent: number;
  disk_usage: Record<string, number>;
  active_agents: number;
  error_count: number;
  history: Array<{
    timestamp: string;
    cpu_percent: number;
    memory_percent: number;
  }>;
} 