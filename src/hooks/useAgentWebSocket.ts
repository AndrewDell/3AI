import { useState, useEffect, useCallback } from 'react';
import { AgentCommand, AgentEvent } from '@/types/agents';

interface AgentWebSocketState {
  connected: boolean;
  agents: Array<{
    id: string;
    name: string;
    status: string;
    metrics: {
      success_rate: number;
      avg_response_time: number;
      error_count: number;
    };
  }>;
}

export function useAgentWebSocket() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [state, setState] = useState<AgentWebSocketState>({
    connected: false,
    agents: []
  });

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3000/api/agents');

    ws.onopen = () => {
      setState(prev => ({ ...prev, connected: true }));
    };

    ws.onclose = () => {
      setState(prev => ({ ...prev, connected: false }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'init':
          setState(prev => ({ ...prev, agents: data.agents }));
          break;

        case 'agent_event':
          const agentEvent = data.event as AgentEvent;
          setState(prev => {
            const agents = [...prev.agents];
            const agentIndex = agents.findIndex(a => a.id === agentEvent.agentId);

            if (agentIndex !== -1) {
              const agent = agents[agentIndex];
              switch (agentEvent.type) {
                case 'status_change':
                  if (agentEvent.data.status) {
                    agent.status = agentEvent.data.status;
                  }
                  break;
                case 'metrics_update':
                  if (agentEvent.data.metrics) {
                    agent.metrics = agentEvent.data.metrics;
                  }
                  break;
              }
              agents[agentIndex] = { ...agent };
            }

            return { ...prev, agents };
          });
          break;
      }
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, []);

  const sendCommand = useCallback((command: AgentCommand) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'command',
        command
      }));
    }
  }, [socket]);

  return {
    connected: state.connected,
    agents: state.agents,
    sendCommand
  };
} 