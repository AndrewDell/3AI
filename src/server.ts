import { createServer } from 'http';
import { Server } from 'socket.io';
import { SystemMetrics } from './types/monitoring';
import { AgentMetrics } from './types/agents';
import { AlertLevel } from './types/alerts';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Generate mock data
function generateMockMetrics(): SystemMetrics {
  const now = new Date().toISOString();
  return {
    cpu_percent: Math.random() * 100,
    memory_percent: Math.random() * 100,
    disk_usage: {
      '/': Math.random() * 100,
      '/home': Math.random() * 100
    },
    active_agents: Math.floor(Math.random() * 10),
    error_count: Math.floor(Math.random() * 5),
    history: Array.from({ length: 10 }, (_, i) => ({
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      cpu_percent: Math.random() * 100,
      memory_percent: Math.random() * 100
    })).reverse()
  };
}

function generateMockAgentMetrics(): Record<string, AgentMetrics> {
  return {
    'agent-1': {
      status: Math.random() > 0.7 ? 'degraded' : 'healthy',
      success_rate: Math.random(),
      avg_response_time: Math.random() * 1000,
      error_count: Math.floor(Math.random() * 5)
    },
    'agent-2': {
      status: Math.random() > 0.9 ? 'failed' : 'healthy',
      success_rate: Math.random(),
      avg_response_time: Math.random() * 1000,
      error_count: Math.floor(Math.random() * 5)
    }
  };
}

const alertLevels: AlertLevel[] = ['info', 'warning', 'error', 'critical'];
function generateMockAlert() {
  const level = alertLevels[Math.floor(Math.random() * alertLevels.length)];
  const messages = {
    info: 'System operating normally',
    warning: 'High resource usage detected',
    error: 'Service degradation observed',
    critical: 'System failure detected'
  };
  return { level, message: messages[level] };
}

io.on('connection', (socket) => {
  console.log('Client connected');

  // Send initial data
  socket.emit('metrics_update', generateMockMetrics());
  socket.emit('agent_metrics', generateMockAgentMetrics());

  // Set up intervals for periodic updates
  const metricsInterval = setInterval(() => {
    socket.emit('metrics_update', generateMockMetrics());
  }, 5000);

  const agentInterval = setInterval(() => {
    socket.emit('agent_metrics', generateMockAgentMetrics());
  }, 10000);

  const alertInterval = setInterval(() => {
    if (Math.random() > 0.7) { // 30% chance to emit an alert
      socket.emit('alert', generateMockAlert());
    }
  }, 15000);

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    clearInterval(metricsInterval);
    clearInterval(agentInterval);
    clearInterval(alertInterval);
  });
});

const PORT = process.env.PORT || 8000;
httpServer.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
}); 