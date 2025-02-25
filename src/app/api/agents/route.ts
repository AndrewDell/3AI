import { NextRequest } from 'next/server';
import { SalesAgent } from '@/server/agents/SalesAgent';
import { MarketingAgent } from '@/server/agents/MarketingAgent';
import { CustomerSuccessAgent } from '@/server/agents/CustomerSuccessAgent';
import { ExecutiveAgent } from '@/server/agents/ExecutiveAgent';
import { OperationsAgent } from '@/server/agents/OperationsAgent';
import { AgentEvent } from '@/types/agents';

class AgentManager {
  private agents: Map<string, SalesAgent | MarketingAgent | CustomerSuccessAgent | ExecutiveAgent | OperationsAgent> = new Map();
  private connections: Set<WebSocket> = new Set();

  constructor() {
    // Initialize Sales Agents
    const sales1 = new SalesAgent({
      id: 'sales1',
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

    const sales2 = new SalesAgent({
      id: 'sales2',
      name: 'SMB Sales Rep',
      territory: 'Europe',
      quota: 500000,
      productLines: ['Business Suite', 'Growth Package'],
      targetIndustries: ['Retail', 'Manufacturing', 'Services'],
      dealStages: ['Lead', 'Discovery', 'Proposal', 'Closing'],
      leadScoringRules: {
        budget: { min: 10000, weight: 0.25 },
        timeline: { max: 60, weight: 0.25 },
        authority: { weight: 0.25 },
        need: { weight: 0.25 }
      }
    });

    // Initialize Marketing Agents
    const marketing1 = new MarketingAgent({
      id: 'marketing1',
      name: 'Email Marketing Specialist',
      channels: ['email'],
      campaignTypes: ['nurture', 'promotional', 'onboarding'],
      targetAudience: {
        segments: ['enterprise', 'mid-market'],
        interests: ['technology', 'innovation', 'digital transformation']
      },
      goals: {
        leads: 200,
        conversions: 50,
        engagement: 0.25
      }
    });

    const marketing2 = new MarketingAgent({
      id: 'marketing2',
      name: 'Social Media Manager',
      channels: ['linkedin', 'twitter', 'facebook'],
      campaignTypes: ['brand_awareness', 'thought_leadership', 'community'],
      targetAudience: {
        segments: ['professionals', 'decision-makers'],
        interests: ['business', 'leadership', 'industry trends']
      },
      goals: {
        engagement: 0.35,
        reach: 100000,
        followers: 5000
      }
    });

    const marketing3 = new MarketingAgent({
      id: 'marketing3',
      name: 'Digital Advertising Expert',
      channels: ['display', 'search', 'social'],
      campaignTypes: ['acquisition', 'retargeting', 'brand'],
      targetAudience: {
        segments: ['all'],
        interests: ['software', 'business solutions', 'productivity']
      },
      goals: {
        leads: 300,
        cpa: 150,
        budget: 50000
      }
    });

    // Initialize Customer Success Agents
    const cs1 = new CustomerSuccessAgent({
      id: 'cs1',
      name: 'Enterprise Success Manager',
      healthScoreThresholds: {
        at_risk: 60,
        healthy: 80
      },
      retryAttempts: 3
    });

    const cs2 = new CustomerSuccessAgent({
      id: 'cs2',
      name: 'SMB Success Manager',
      healthScoreThresholds: {
        at_risk: 70,
        healthy: 85
      },
      retryAttempts: 3
    });

    // Initialize Executive Agents
    const exec1 = new ExecutiveAgent({
      id: 'exec1',
      name: 'Business Intelligence Director',
      reportTypes: ['financial', 'operational', 'strategic'],
      metricCategories: ['revenue', 'costs', 'efficiency', 'satisfaction'],
      stakeholderPreferences: {
        reportFrequency: 7 * 24 * 60 * 60 * 1000, // Weekly
        alertThresholds: {
          revenue: 0.1, // 10% deviation
          costs: 0.15,
          efficiency: 0.2,
          satisfaction: 0.1
        }
      }
    });

    const exec2 = new ExecutiveAgent({
      id: 'exec2',
      name: 'Compliance Officer',
      reportTypes: ['compliance', 'operational'],
      metricCategories: ['operations', 'customer_success'],
      stakeholderPreferences: {
        reportFrequency: 24 * 60 * 60 * 1000, // Daily
        alertThresholds: {
          operations: 0.15,
          customer_success: 0.1
        }
      }
    });

    // Initialize Operations Agents
    const ops1 = new OperationsAgent({
      id: 'ops1',
      name: 'Infrastructure Manager',
      monitoredServices: ['api', 'database', 'cache', 'queue'],
      resourceThresholds: {
        cpu: { warning: 70, critical: 90 },
        memory: { warning: 75, critical: 90 },
        storage: { warning: 80, critical: 95 },
        network: { warning: 60, critical: 80 }
      },
      complianceRules: [
        {
          category: 'Security',
          rules: [
            { id: 'sec1', name: 'Access Control', severity: 'high' },
            { id: 'sec2', name: 'Data Encryption', severity: 'high' },
            { id: 'sec3', name: 'Audit Logging', severity: 'medium' }
          ]
        },
        {
          category: 'Performance',
          rules: [
            { id: 'perf1', name: 'Response Time', severity: 'high' },
            { id: 'perf2', name: 'Resource Usage', severity: 'medium' }
          ]
        }
      ]
    });

    const ops2 = new OperationsAgent({
      id: 'ops2',
      name: 'System Reliability Engineer',
      monitoredServices: ['api', 'database', 'cache', 'queue'],
      resourceThresholds: {
        cpu: { warning: 60, critical: 80 },
        memory: { warning: 70, critical: 85 },
        storage: { warning: 75, critical: 90 },
        network: { warning: 50, critical: 70 }
      },
      complianceRules: [
        {
          category: 'Reliability',
          rules: [
            { id: 'rel1', name: 'Uptime SLA', severity: 'high' },
            { id: 'rel2', name: 'Backup Verification', severity: 'high' },
            { id: 'rel3', name: 'Failover Testing', severity: 'medium' }
          ]
        }
      ]
    });

    // Add all agents to the manager
    [
      sales1, sales2,
      marketing1, marketing2, marketing3,
      cs1, cs2,
      exec1, exec2,
      ops1, ops2
    ].forEach(agent => {
      this.agents.set(agent.getId(), agent);
      agent.on('agent_event', this.broadcastEvent.bind(this));
    });
  }

  public addConnection(socket: WebSocket): void {
    this.connections.add(socket);
    socket.addEventListener('close', () => {
      this.connections.delete(socket);
    });
  }

  private broadcastEvent(event: AgentEvent): void {
    const message = JSON.stringify(event);
    this.connections.forEach(socket => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(message);
      }
    });
  }

  public startAll(): void {
    this.agents.forEach(agent => agent.start());
  }

  public stopAll(): void {
    this.agents.forEach(agent => agent.stop());
  }

  public getAgent(id: string): SalesAgent | MarketingAgent | CustomerSuccessAgent | ExecutiveAgent | OperationsAgent | undefined {
    return this.agents.get(id);
  }

  public getMetrics(): Record<string, any> {
    const metrics: Record<string, any> = {};
    this.agents.forEach((agent, id) => {
      metrics[id] = agent.getMetrics();
    });
    return metrics;
  }
}

const agentManager = new AgentManager();

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  
  if (searchParams.get('type') === 'metrics') {
    return new Response(JSON.stringify({
      type: 'metrics',
      data: { metrics: agentManager.getMetrics() },
      timestamp: Date.now()
    }));
  }

  const upgradeHeader = req.headers.get('upgrade');
  if (upgradeHeader !== 'websocket') {
    return new Response('Expected Upgrade: WebSocket', { status: 426 });
  }

  const webSocketPair = new WebSocketPair();
  const [client, server] = Object.values(webSocketPair);

  server.accept();
  agentManager.addConnection(server);

  // Send initial metrics
  server.send(JSON.stringify({
    type: 'metrics',
    data: { metrics: agentManager.getMetrics() },
    timestamp: Date.now()
  }));

  // Handle client messages
  server.addEventListener('message', (event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data.toString());
      if (message.type === 'command') {
        switch (message.command) {
          case 'start':
            agentManager.startAll();
            break;
          case 'stop':
            agentManager.stopAll();
            break;
          case 'getMetrics':
            server.send(JSON.stringify({
              type: 'metrics',
              data: { metrics: agentManager.getMetrics() },
              timestamp: Date.now()
            }));
            break;
        }
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  // Handle client disconnection
  server.addEventListener('close', () => {
    agentManager.connections.delete(server);
  });

  return new Response(null, {
    status: 101,
    headers: {
      'Upgrade': 'websocket',
      'Connection': 'Upgrade'
    },
    webSocket: client
  });
}

export const dynamic = 'force-dynamic'; 