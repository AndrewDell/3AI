import { EventEmitter } from 'events';
import { SalesAgent } from './SalesAgent';
import { AgentConfig, AgentCommand, AgentEvent } from '@/types/agents';

export class AgentManager extends EventEmitter {
  private agents: Map<string, SalesAgent> = new Map();

  constructor() {
    super();
  }

  public createAgent(config: AgentConfig): SalesAgent {
    if (this.agents.has(config.id)) {
      throw new Error(`Agent with ID ${config.id} already exists`);
    }

    const agent = new SalesAgent(config);
    this.agents.set(config.id, agent);

    // Forward agent events
    agent.on('agent_event', (event: AgentEvent) => {
      this.emit('agent_event', event);
    });

    return agent;
  }

  public executeCommand(command: AgentCommand): void {
    const agent = this.agents.get(command.agentId);
    if (!agent) {
      throw new Error(`Agent with ID ${command.agentId} not found`);
    }

    switch (command.type) {
      case 'start':
        agent.start();
        break;
      case 'stop':
        agent.stop();
        break;
      case 'restart':
        agent.restart();
        break;
      default:
        throw new Error(`Unknown command type: ${command.type}`);
    }

    if (command.config) {
      // Update agent config if provided
      Object.assign(agent, { config: { ...agent.getConfig(), ...command.config } });
    }
  }

  public getAgent(id: string): SalesAgent | undefined {
    return this.agents.get(id);
  }

  public getAllAgents(): SalesAgent[] {
    return Array.from(this.agents.values());
  }

  public removeAgent(id: string): boolean {
    const agent = this.agents.get(id);
    if (agent) {
      agent.stop();
      agent.removeAllListeners();
      return this.agents.delete(id);
    }
    return false;
  }
} 