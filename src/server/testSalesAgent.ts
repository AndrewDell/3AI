import { io } from 'socket.io-client';

interface ClientToServerEvents {
  command: (data: { command: string }) => void;
}

interface ServerToClientEvents {
  connect: () => void;
  disconnect: () => void;
  connect_error: (err: Error) => void;
  metrics: (data: { data: { metrics: any }, timestamp: number }) => void;
  agent_event: (event: { type: string; data: any }) => void;
}

/**
 * Test script to simulate sales activities and update metrics
 * This script connects to the Socket.IO server and sends commands
 * to test different sales agent functions
 */

// Configuration
const SOCKET_URL = 'http://localhost:3100';
const TEST_DURATION_SECONDS = 120; // How long to run the test
const UPDATE_INTERVAL_MS = 5000; // How often to update metrics

// Connect to Socket.IO server
console.log(`Connecting to Socket.IO server at ${SOCKET_URL}...`);
const socket = io<ServerToClientEvents, ClientToServerEvents>(SOCKET_URL);

// Track connection status
socket.on('connect', () => {
  console.log('Connected to Socket.IO server');
  runTest();
});

socket.on('connect_error', (err) => {
  console.error('Connection error:', err);
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

// Listen for metrics updates
socket.on('metrics', (data) => {
  console.log('\n----- METRICS UPDATE -----');
  console.log(JSON.stringify(data.data.metrics, null, 2));
  console.log('--------------------------\n');
});

// Listen for agent events
socket.on('agent_event', (event) => {
  console.log(`\nAGENT EVENT: ${event.type}`, event.data);
});

// Simulated actions to test the sales agent
const actions = [
  {
    name: 'Add new lead',
    execute: () => {
      console.log('⚡ Action: Adding new qualified lead');
      socket.emit('command', { command: 'simulateNewLead' });
    }
  },
  {
    name: 'Schedule meeting',
    execute: () => {
      console.log('⚡ Action: Scheduling customer meeting');
      socket.emit('command', { command: 'simulateMeeting' });
    }
  },
  {
    name: 'Create opportunity',
    execute: () => {
      console.log('⚡ Action: Creating new sales opportunity');
      socket.emit('command', { command: 'simulateOpportunity' });
    }
  },
  {
    name: 'Close deal (win)',
    execute: () => {
      console.log('⚡ Action: Closing deal (win)');
      socket.emit('command', { command: 'simulateClosedWon' });
    }
  },
  {
    name: 'Close deal (loss)',
    execute: () => {
      console.log('⚡ Action: Closing deal (loss)');
      socket.emit('command', { command: 'simulateClosedLost' });
    }
  },
  {
    name: 'Update pipeline',
    execute: () => {
      console.log('⚡ Action: Updating sales pipeline');
      socket.emit('command', { command: 'updatePipeline' });
    }
  }
];

// Start the test
function runTest() {
  console.log(`Starting sales agent test for ${TEST_DURATION_SECONDS} seconds`);
  
  // Start the agent
  console.log('Starting sales agent...');
  socket.emit('command', { command: 'start' });
  
  // Execute random actions at intervals
  const interval = setInterval(() => {
    // Randomly select an action
    const action = actions[Math.floor(Math.random() * actions.length)];
    action.execute();
    
    // Request updated metrics
    setTimeout(() => {
      socket.emit('command', { command: 'getMetrics' });
    }, 1000);
  }, UPDATE_INTERVAL_MS);
  
  // End test after specified duration
  setTimeout(() => {
    clearInterval(interval);
    console.log('Test completed. Stopping sales agent...');
    socket.emit('command', { command: 'stop' });
    
    // Get final metrics
    setTimeout(() => {
      socket.emit('command', { command: 'getMetrics' });
      console.log('Disconnecting in 5 seconds...');
      
      // Disconnect after showing final metrics
      setTimeout(() => {
        socket.disconnect();
        process.exit(0);
      }, 5000);
    }, 1000);
  }, TEST_DURATION_SECONDS * 1000);
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('Test interrupted. Cleaning up...');
  socket.emit('command', { command: 'stop' });
  socket.disconnect();
  process.exit(0);
}); 