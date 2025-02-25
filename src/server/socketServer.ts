import { createServer } from 'http';
import { Server } from 'socket.io';
import { SalesAgent } from './agents/SalesAgent';
import { AgentEvent } from '@/types/agents';
import axios from 'axios';
import express, { Request, Response } from 'express';

/**
 * Socket.IO Server for 3AI Platform
 * 
 * This module serves as the central communication hub for real-time data exchange
 * between the agent system and frontend clients. It follows a Node-first architecture
 * where this server acts as a gateway between the Next.js frontend and any Python
 * backend services for specialized tasks.
 * 
 * Key responsibilities:
 * - Maintain WebSocket connections with clients
 * - Process agent events and forward to clients
 * - Manage agent lifecycle and operations
 * - Proxy specialized requests to Python APIs when needed
 * 
 * @module socketServer
 */

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

// Connection settings for API service
const API_URL = process.env.API_URL || 'http://localhost:5000';

/**
 * Cache for preserving metrics when agent is stopped
 * This enables persistent metrics across agent restart cycles
 */
let cachedMetrics: CachedMetrics | null = null;

/**
 * Heartbeat interval to ensure clients stay connected
 * Periodically sends updates to maintain connection health
 */
let heartbeatInterval: NodeJS.Timeout | null = null;

/**
 * Create Express app for HTTP endpoints
 */
const app = express();

/**
 * Add health check endpoint for Docker
 */
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: '3AI-socket-server',
    timestamp: new Date().toISOString()
  });
});

/**
 * Create HTTP server using Express app
 */
const httpServer = createServer(app);

/**
 * Initialize Socket.IO server with enhanced configuration 
 * for improved connection stability and cross-origin support
 */
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://frontend:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  // Set larger ping timeout to prevent premature disconnections
  pingTimeout: 60000,
  // More frequent pings to keep connection alive
  pingInterval: 10000
});

/**
 * Initialize the SalesAgent with default configuration
 * In production, this would load configuration from environment
 * variables or external configuration service
 */
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

/**
 * Forward agent events to all connected clients
 * Maps internal agent events to client-facing Socket.IO events
 */
salesAgent.on('agent_event', (event: AgentEvent) => {
  io.emit('agent_event', event);
  console.log(`Emitted agent event: ${event.type}`);
  
  // For any metrics-related events, always broadcast current metrics
  if (event.type === 'metrics_update' || event.type === 'status_change') {
    emitMetricsUpdate();
  }
});

/**
 * Start heartbeat to keep clients updated with fresh data
 * This ensures clients always have the most current state
 */
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

/**
 * Stop heartbeat when server is shutting down
 * Ensures clean resource management
 */
function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

// Start the heartbeat when the server starts
startHeartbeat();

/**
 * Helper function to communicate with Python API services
 * Uses HTTP requests to fetch data from specialized ML/AI endpoints
 */
async function fetchFromPythonAPI(endpoint: string) {
  try {
    console.log(`Fetching data from Python API: ${endpoint}`);
    const response = await axios.get(`${API_URL}${endpoint}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching from Python API (${endpoint}):`, error);
    return null;
  }
}

/**
 * Handle client connections and establish bidirectional communication
 */
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

  /**
   * Handle client commands and route to appropriate handlers
   */
  socket.on('command', async (message: { command: string, params?: any }) => {
    console.log(`Received command: ${message.command}`, message.params || '');
    
    try {
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
          
        case 'getPythonData':
          // Example of fetching data from Python API
          const data = await fetchFromPythonAPI('/api/data');
          socket.emit('pythonData', {
            type: 'data',
            data: data,
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
          
        default:
          socket.emit('error', {
            message: `Unknown command: ${message.command}`
          });
      }
    } catch (error) {
      console.error(`Error processing command ${message.command}:`, error);
      socket.emit('error', {
        message: `Failed to process command: ${message.command}`,
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Handle pong response from client
  socket.on('pong', () => {
    // Client is still connected
  });

  // Clean up on disconnect
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    clearInterval(pingInterval);
  });
});

/**
 * Test function to simulate new lead generation
 * Increments qualified leads count and updates related metrics
 */
function simulateNewLead() {
  const metrics = salesAgent.getMetrics();
  metrics.qualified_leads += 1;
  
  // Update win rate and success rate
  updateRates();
  
  // Emit metrics update
  emitMetricsUpdate();
}

/**
 * Test function to simulate scheduling a meeting
 * Increments meeting count and updates metrics
 */
function simulateMeeting() {
  const metrics = salesAgent.getMetrics();
  metrics.meetings_scheduled += 1;
  
  // Emit metrics update
  emitMetricsUpdate();
}

/**
 * Test function to simulate adding a new opportunity to pipeline
 * Increases pipeline value and updates average deal size
 */
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

/**
 * Test function to simulate winning a deal
 * Updates deals closed, pipeline value, and win metrics
 */
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

/**
 * Test function to simulate losing a deal
 * Reduces pipeline value and updates win rate
 */
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

/**
 * Test function to simulate changes in pipeline value
 * Adds a random amount to current pipeline
 */
function updatePipeline() {
  const metrics = salesAgent.getMetrics();
  
  // Add a small random amount to the pipeline (up to $200,000)
  const addToPipeline = Math.floor(Math.random() * 200000);
  metrics.pipeline_value += addToPipeline;
  
  // Emit metrics update
  emitMetricsUpdate();
}

/**
 * Helper function to update win and success rates
 * Calculates realistic metrics for simulation purposes
 */
function updateRates() {
  const metrics = salesAgent.getMetrics();
  
  // Update win rate (randomly between 30% and 70%)
  metrics.win_rate = 0.3 + Math.random() * 0.4;
  
  // Update success rate (randomly between 60% and 100%)
  metrics.success_rate = 60 + Math.random() * 40;
}

/**
 * Emit updated metrics to all connected clients
 * Centralizes the metrics broadcast logic
 */
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

// Define the port for the socket server
const PORT = process.env.PORT || 3001;

// Start the server with proper error handling
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running at http://localhost:${PORT}`);
});

// Handle server errors
httpServer.on('error', (error) => {
  console.error('Socket server error:', error);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down Socket.IO server...');
  stopHeartbeat();
  salesAgent.stop();
  io.close();
  httpServer.close(() => {
    console.log('Socket.IO server closed');
    process.exit(0);
  });
});

// Export for testing
export { io, httpServer, salesAgent }; 