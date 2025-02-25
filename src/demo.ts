import { SalesAgent } from './server/agents/SalesAgent';

// Create a sales agent with enterprise configuration
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

// Listen for agent events
salesAgent.on('agent_event', (event) => {
  console.log('Agent Event:', JSON.stringify(event, null, 2));
});

// Start the agent
console.log('Starting sales agent...');
salesAgent.start();

// Log initial metrics
console.log('Initial metrics:', salesAgent.getMetrics());

// Keep the process running
setInterval(() => {
  console.log('Current metrics:', salesAgent.getMetrics());
}, 10000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('Stopping sales agent...');
  salesAgent.stop();
  process.exit();
}); 