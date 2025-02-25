import { createServer } from 'http';
import { Server } from 'socket.io';
import { SalesAgent } from './agents/SalesAgent';
import { AgentEvent } from '@/types/agents';

// Define interface for cached metrics - now capturing all metrics
interface CachedMetrics {
  pipeline_value: number;
  sales_cycle_length: number;
  deals_closed: number;
  win_rate: number;
  meetings_scheduled: number;
  qualified_leads: number;
  success_rate: number;
  avg_deal_size: number;
  [key: string]: any; // Allow other metrics properties
}

// Add cache for preserving metrics when agent is stopped
let cachedMetrics: CachedMetrics | null = null;

// Add heartbeat interval to ensure clients stay connected
let heartbeatInterval: NodeJS.Timeout | null = null;

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  // Set larger ping timeout to prevent premature disconnections
  pingTimeout: 60000,
  // More frequent pings to keep connection alive
  pingInterval: 10000
});

const salesAgent = new SalesAgent({
  id: 'enterprise1',
  name: 'Enterprise Sales Rep',
  territory: 'North America',
  quota: 1000000,
  productLines: ['Enterprise Suite', 'Custom Solutions'],
  targetIndustries: ['Technology', 'Finance', 'Healthcare'],
  dealStages: ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed'],
  leadScoringRules: {
    budget: { min: 100000, weight: 0.3 },
    timeline: { max: 90, weight: 0.2 },
    authority: { weight: 0.3 },
    need: { weight: 0.2 }
  }
});

// Forward agent events to all connected clients
salesAgent.on('agent_event', (event: AgentEvent) => {
  io.emit('agent_event', event);
  console.log(`Emitted agent event: ${event.type}`);
  
  // For any metrics-related events, always broadcast current metrics
  if (event.type === 'metrics_update' || event.type === 'status_change') {
    emitMetricsUpdate();
  }
});

// Start heartbeat to keep clients updated
function startHeartbeat() {
  // Clear any existing interval
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }
  
  // Set up new interval to regularly emit metrics to all clients
  heartbeatInterval = setInterval(() => {
    if (io.engine.clientsCount > 0) {
      emitMetricsUpdate();
    }
  }, 5000); // Send updates every 5 seconds
}

// Function to stop heartbeat
function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

// Start the heartbeat when the server starts
startHeartbeat();

// Handle client connections
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Send initial metrics
  socket.emit('metrics', {
    type: 'metrics',
    data: { metrics: salesAgent.getMetrics() },
    timestamp: Date.now()
  });
  console.log(`Sent initial metrics to client ${socket.id}`);
  
  // Ping client every second to keep connection alive
  const pingInterval = setInterval(() => {
    socket.emit('ping', { timestamp: Date.now() });
  }, 1000);

  // Handle client commands
  socket.on('command', (message: { command: string }) => {
    console.log(`Received command: ${message.command}`);
    
    switch (message.command) {
      case 'start':
        salesAgent.start();
        
        // Restore cached metrics if available
        if (cachedMetrics !== null) {
          setTimeout(() => {
            const metrics = salesAgent.getMetrics();
            // Restore ALL metrics from cache (with null check)
            if (cachedMetrics !== null) {
              // Copy all properties from cached metrics
              Object.keys(cachedMetrics).forEach(key => {
                (metrics as any)[key] = cachedMetrics![key];
              });
              
              console.log(`Restored metrics from cache: Pipeline=$${cachedMetrics.pipeline_value}, Cycle=${cachedMetrics.sales_cycle_length} days`);
              
              // Reset the cache
              cachedMetrics = null;
              
              // Emit updated metrics to all clients
              emitMetricsUpdate();
            }
          }, 500); // Small delay to ensure agent is fully started
        }
        break;
      case 'stop':
        // Cache ALL metrics before stopping
        cachedMetrics = { ...salesAgent.getMetrics() };
        console.log(`Cached metrics: Pipeline=$${cachedMetrics.pipeline_value}, Cycle=${cachedMetrics.sales_cycle_length} days`);
        
        salesAgent.stop();
        break;
      case 'getMetrics':
        socket.emit('metrics', {
          type: 'metrics',
          data: { metrics: salesAgent.getMetrics() },
          timestamp: Date.now()
        });
        break;
      // Test commands for simulating sales activities
      case 'simulateNewLead':
        simulateNewLead();
        break;
      case 'simulateMeeting':
        simulateMeeting();
        break;
      case 'simulateOpportunity':
        simulateOpportunity();
        break;
      case 'simulateClosedWon':
        simulateClosedWon();
        break;
      case 'simulateClosedLost':
        simulateClosedLost();
        break;
      case 'updatePipeline':
        updatePipeline();
        break;
    }
  });

  // Handle pong response from client
  socket.on('pong', () => {
    // Client is still connected
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    clearInterval(pingInterval);
  });
});

// Test functions to simulate different sales activities
function simulateNewLead() {
  const metrics = salesAgent.getMetrics();
  metrics.qualified_leads += 1;
  
  // Update win rate and success rate
  updateRates();
  
  // Emit metrics update
  emitMetricsUpdate();
}

function simulateMeeting() {
  const metrics = salesAgent.getMetrics();
  metrics.meetings_scheduled += 1;
  
  // Emit metrics update
  emitMetricsUpdate();
}

function simulateOpportunity() {
  const metrics = salesAgent.getMetrics();
  
  // Generate a random deal size between $50,000 and $500,000
  const dealSize = Math.floor(Math.random() * 450000) + 50000;
  
  // Add to pipeline value
  metrics.pipeline_value += dealSize;
  
  // Update average deal size if we have deals
  if (metrics.deals_closed > 0) {
    metrics.avg_deal_size = (metrics.avg_deal_size * metrics.deals_closed + dealSize) / (metrics.deals_closed + 1);
  } else {
    metrics.avg_deal_size = dealSize;
  }
  
  // Emit metrics update
  emitMetricsUpdate();
}

function simulateClosedWon() {
  const metrics = salesAgent.getMetrics();
  
  // Only close a deal if we have pipeline value
  if (metrics.pipeline_value > 0) {
    // Generate a random deal size up to the current pipeline value
    const maxDealSize = Math.min(500000, metrics.pipeline_value);
    const dealSize = Math.floor(Math.random() * maxDealSize) + 50000;
    
    // Update metrics
    metrics.deals_closed += 1;
    metrics.pipeline_value -= dealSize;
    
    // Update average deal size
    if (metrics.deals_closed > 1) {
      // Weighted average with the new deal
      metrics.avg_deal_size = (metrics.avg_deal_size * (metrics.deals_closed - 1) + dealSize) / metrics.deals_closed;
    } else {
      metrics.avg_deal_size = dealSize;
    }
    
    // Generate a random sales cycle length between 30 and 120 days
    metrics.sales_cycle_length = Math.floor(Math.random() * 90) + 30;
    
    // Update win rate
    updateRates();
  }
  
  // Emit metrics update
  emitMetricsUpdate();
}

function simulateClosedLost() {
  const metrics = salesAgent.getMetrics();
  
  // Only simulate a loss if we have pipeline value
  if (metrics.pipeline_value > 0) {
    // Remove a portion from the pipeline
    const lostDealValue = Math.min(
      Math.floor(Math.random() * metrics.pipeline_value * 0.5) + 50000,
      metrics.pipeline_value
    );
    
    metrics.pipeline_value -= lostDealValue;
    
    // Update win rate
    updateRates();
  }
  
  // Emit metrics update
  emitMetricsUpdate();
}

function updatePipeline() {
  const metrics = salesAgent.getMetrics();
  
  // Add a small random amount to the pipeline (up to $200,000)
  const addToPipeline = Math.floor(Math.random() * 200000);
  metrics.pipeline_value += addToPipeline;
  
  // Emit metrics update
  emitMetricsUpdate();
}

function updateRates() {
  const metrics = salesAgent.getMetrics();
  
  // Update win rate (randomly between 30% and 70%)
  metrics.win_rate = 0.3 + Math.random() * 0.4;
  
  // Update success rate (randomly between 60% and 100%)
  metrics.success_rate = 60 + Math.random() * 40;
}

// Enhanced emitMetricsUpdate function with better logging
function emitMetricsUpdate() {
  const metrics = salesAgent.getMetrics();
  // Get number of connected clients
  const connectedClients = io.engine.clientsCount;
  
  io.emit('metrics', {
    type: 'metrics',
    data: { metrics },
    timestamp: Date.now()
  });
  
  console.log(`Emitted metrics update to ${connectedClients} clients: Pipeline value = $${metrics.pipeline_value}, Sales cycle = ${metrics.sales_cycle_length} days`);
}

// Clean up intervals when server shuts down
process.on('SIGINT', () => {
  console.log('Server shutting down...');
  stopHeartbeat();
  process.exit(0);
});

const PORT = process.env.SOCKET_PORT || 3100;
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
}); 