import { Server as HTTPServer } from 'http';
import WebSocket, { Server as WebSocketServer } from 'ws';
import { AgentManager } from '../agents/AgentManager';
import { AgentCommand, AgentEvent } from '@/types/agents';

export class AgentWebSocketServer {
  private wss: WebSocketServer;
  private agentManager: AgentManager;

  constructor(server: HTTPServer) {
    this.wss = new WebSocketServer({ server });
    this.agentManager = new AgentManager();

    this.setupWebSocketServer();
    this.setupAgentEventForwarding();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      // Send initial state
      const agents = this.agentManager.getAllAgents();
      ws.send(JSON.stringify({
        type: 'init',
        agents: agents.map(agent => ({
          id: agent.getId(),
          name: agent.getName(),
          status: agent.getStatus(),
          metrics: agent.getMetrics()
        }))
      }));

      // Handle incoming messages
      ws.on('message', (data: string) => {
        try {
          const message = JSON.parse(data);
          
          if (message.type === 'command') {
            const command = message.command as AgentCommand;
            this.agentManager.executeCommand(command);
          }
        } catch (error) {
          ws.send(JSON.stringify({
            type: 'error',
            error: (error as Error).message
          }));
        }
      });
    });
  }

  private setupAgentEventForwarding(): void {
    this.agentManager.on('agent_event', (event: AgentEvent) => {
      const message = JSON.stringify({
        type: 'agent_event',
        event
      });

      this.wss.clients.forEach((client: WebSocket) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    });
  }

  public getAgentManager(): AgentManager {
    return this.agentManager;
  }
} 