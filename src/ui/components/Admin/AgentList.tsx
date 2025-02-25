'use client';

import React, { useState, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useAgentWebSocket } from '@/hooks/useAgentWebSocket';

interface Agent {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'error';
  details: string;
  metrics?: {
    success_rate: number;
    avg_response_time: number;
    error_count: number;
    consecutive_failures: number;
  };
}

// Mock data based on the SalesAgent implementation
const MOCK_AGENTS: Agent[] = Array.from({ length: 50 }, (_, i) => ({
  id: `agent-${i + 1}`,
  name: `Sales Agent ${i + 1}`,
  status: ['active', 'idle', 'error'][Math.floor(Math.random() * 3)] as Agent['status'],
  details: `Processing leads: ${Math.floor(Math.random() * 100)}`,
  metrics: {
    success_rate: Math.random() * 100,
    avg_response_time: Math.random() * 1000,
    error_count: Math.floor(Math.random() * 10),
    consecutive_failures: Math.floor(Math.random() * 3)
  }
}));

const AgentList: React.FC = () => {
  const { connected, agents, sendCommand } = useAgentWebSocket();
  const [search, setSearch] = useState('');
  const parentRef = useRef<HTMLDivElement>(null);

  const filteredAgents = MOCK_AGENTS.filter(agent => 
    agent.name.toLowerCase().includes(search.toLowerCase()) ||
    agent.details.toLowerCase().includes(search.toLowerCase())
  );

  const virtualizer = useVirtualizer({
    count: filteredAgents.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 76,
    overscan: 5
  });

  const handleStart = (agentId: string) => {
    sendCommand({ type: 'start', agentId });
  };

  const handleStop = (agentId: string) => {
    sendCommand({ type: 'stop', agentId });
  };

  const handleRestart = (agentId: string) => {
    sendCommand({ type: 'restart', agentId });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'idle':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  if (!connected) {
    return (
      <div className="p-4">
        <p className="text-gray-500">Connecting to agent server...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Active Agents</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search agents..."
            value={search}
            onChange={handleSearch}
            className="w-64 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Search agents"
          />
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </span>
        </div>
      </div>

      <div 
        ref={parentRef} 
        className="h-[400px] overflow-auto"
        role="list"
        aria-label="List of agents"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const agent = filteredAgents[virtualRow.index];
            return (
              <div
                key={agent.id}
                className="absolute top-0 left-0 w-full border-b border-gray-200"
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                role="listitem"
              >
                <div className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{agent.name}</div>
                      <div className="text-sm text-gray-500">{agent.details}</div>
                      {agent.metrics && (
                        <div className="text-xs text-gray-500 mt-1">
                          Success Rate: {agent.metrics.success_rate.toFixed(1)}% | 
                          Response Time: {agent.metrics.avg_response_time.toFixed(0)}ms | 
                          Errors: {agent.metrics.error_count}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(agent.status)}`}
                      >
                        {agent.status.toUpperCase()}
                      </span>
                      <div className="flex space-x-2">
                        {agent.status === 'idle' && (
                          <button
                            onClick={() => handleStart(agent.id)}
                            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                          >
                            Start
                          </button>
                        )}
                        {agent.status === 'active' && (
                          <button
                            onClick={() => handleStop(agent.id)}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            Stop
                          </button>
                        )}
                        {agent.status === 'error' && (
                          <button
                            onClick={() => handleRestart(agent.id)}
                            className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                          >
                            Restart
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AgentList; 