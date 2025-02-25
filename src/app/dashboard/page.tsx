'use client';

import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import {
  Card,
  Title,
  Text,
  Grid,
  Flex,
  Button,
  Metric
} from '@tremor/react';

// Define interface for sales agent metrics
interface SalesMetrics {
  deals_closed: number;
  pipeline_value: number;
  win_rate: number;
  meetings_scheduled: number;
  qualified_leads: number;
  success_rate: number;
  avg_deal_size: number;
  sales_cycle_length: number;
  [key: string]: any;
}

export default function Dashboard() {
  // Connection state
  const [status, setStatus] = useState<'disconnected' | 'connected' | 'connecting'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [agentStatus, setAgentStatus] = useState<'idle' | 'active'>('idle');
  
  // Metrics state
  const [metrics, setMetrics] = useState<SalesMetrics>({
    deals_closed: 0,
    pipeline_value: 0,
    win_rate: 0,
    meetings_scheduled: 0,
    qualified_leads: 0,
    success_rate: 0,
    avg_deal_size: 0,
    sales_cycle_length: 0
  });
  
  // Initialize timestamp with empty string to prevent hydration errors
  // This ensures the server and client render the same initial value
  const [lastUpdated, setLastUpdated] = useState<string>('');
  
  // Socket reference
  const [socketInstance, setSocketInstance] = useState<any>(null);
  
  // HYDRATION FIX: Update timestamp only on client-side
  // This effect runs after component mounts (client-side only)
  // and ensures no mismatch between server and client rendering
  useEffect(() => {
    // Set initial timestamp once mounted on client
    setLastUpdated(new Date().toLocaleTimeString());
    
    // Update time every second to keep it current
    const timeInterval = setInterval(() => {
      setLastUpdated(new Date().toLocaleTimeString());
    }, 1000);
    
    // Clean up interval on component unmount
    return () => clearInterval(timeInterval);
  }, []);
  
  // Initialize socket connection
  useEffect(() => {
    // Connect to the Socket.IO server
    const socket = io('http://localhost:3100', {
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 5000,
      transports: ['websocket']
    });
    
    // Set the socket instance
    setSocketInstance(socket);
    
    // Track connection status
    setStatus('connecting');
    
    // Handle connect event
    socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
      setStatus('connected');
      setError(null);
      
      // Get initial metrics
      socket.emit('command', { command: 'getMetrics' });
    });
    
    // Handle connect error
    socket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      setStatus('disconnected');
      setError(`Connection error: ${err.message}`);
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
      setStatus('disconnected');
    });
    
    // Handle metrics updates
    socket.on('metrics', (data) => {
      console.log('Received metrics update:', data);
      if (data?.data?.metrics) {
        setMetrics(data.data.metrics);
        
        // Update timestamp when new metrics arrive
        // This helps users see when the last update occurred
        setLastUpdated(new Date().toLocaleTimeString());
        
        // Update agent status based on metrics
        if (data.data.metrics.status) {
          setAgentStatus(data.data.metrics.status);
        }
      }
    });
    
    // Handle agent events
    socket.on('agent_event', (event) => {
      console.log('Agent event:', event);
      if (event.type === 'status_change') {
        setAgentStatus(event.data.status);
      }
    });
    
    // Handle ping from server to keep connection alive
    socket.on('ping', () => {
      socket.emit('pong');
    });
    
    // Clean up on unmount
    return () => {
      console.log('Cleaning up socket connection');
      socket.disconnect();
    };
  }, []);
  
  // Command handlers
  const startAgent = useCallback(() => {
    if (socketInstance && status === 'connected') {
      console.log('Starting agent');
      socketInstance.emit('command', { command: 'start' });
    }
  }, [socketInstance, status]);
  
  const stopAgent = useCallback(() => {
    if (socketInstance && status === 'connected') {
      console.log('Stopping agent');
      socketInstance.emit('command', { command: 'stop' });
    }
  }, [socketInstance, status]);
  
  const refreshMetrics = useCallback(() => {
    if (socketInstance && status === 'connected') {
      console.log('Refreshing metrics');
      socketInstance.emit('command', { command: 'getMetrics' });
    }
  }, [socketInstance, status]);
  
  // Format numbers for display
  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;
  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;
  
  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Sales Agent Dashboard</h1>
        <p className="text-gray-600">Real-time monitoring of sales agent metrics</p>
        <div className="mt-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            status === 'connected' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            Status: {status}
          </span>
          {error && (
            <span className="ml-2 text-red-600 text-sm">{error}</span>
          )}
        </div>
      </div>
      
      <Flex className="gap-4 mb-4">
        <Button 
          color="blue" 
          onClick={startAgent}
          disabled={status !== 'connected' || agentStatus === 'active'}
        >
          Start Agent
        </Button>
        <Button 
          color="red" 
          onClick={stopAgent}
          disabled={status !== 'connected' || agentStatus === 'idle'}
        >
          Stop Agent
        </Button>
        <Button
          color="gray"
          onClick={refreshMetrics}
          disabled={status !== 'connected'}
        >
          Refresh Metrics
        </Button>
      </Flex>
      
      <Card className="mb-4">
        <Title>Agent Status</Title>
        <Metric className={agentStatus === 'active' ? 'text-green-600' : 'text-gray-600'}>
          {agentStatus}
        </Metric>
      </Card>
      
      <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-4">
        <Card>
          <Title>Deals Closed</Title>
          <Metric>{metrics.deals_closed}</Metric>
        </Card>
        
        <Card>
          <Title>Pipeline Value</Title>
          <Metric>{formatCurrency(metrics.pipeline_value)}</Metric>
        </Card>
        
        <Card>
          <Title>Win Rate</Title>
          <Metric>{metrics.win_rate ? formatPercent(metrics.win_rate) : '0.0%'}</Metric>
        </Card>
        
        <Card>
          <Title>Meetings Scheduled</Title>
          <Metric>{metrics.meetings_scheduled}</Metric>
        </Card>
        
        <Card>
          <Title>Qualified Leads</Title>
          <Metric>{metrics.qualified_leads}</Metric>
        </Card>
        
        <Card>
          <Title>Success Rate</Title>
          <Metric>{metrics.success_rate ? `${metrics.success_rate.toFixed(1)}%` : '0.0%'}</Metric>
        </Card>
        
        <Card>
          <Title>Average Deal Size</Title>
          <Metric>{formatCurrency(metrics.avg_deal_size)}</Metric>
        </Card>
        
        <Card>
          <Title>Sales Cycle Length</Title>
          <Metric>{metrics.sales_cycle_length} days</Metric>
        </Card>
      </Grid>
      
      <div className="mt-4 text-xs text-gray-500">
        {/* Only render last updated text when there's a value (client-side only) */}
        {/* This prevents hydration errors between server and client rendering */}
        Last updated: {lastUpdated}
      </div>
    </div>
  );
} 