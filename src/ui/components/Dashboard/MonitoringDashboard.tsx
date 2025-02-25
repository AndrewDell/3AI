'use client';

import React from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Card,
  LineChart,
  Title,
  Text,
  Grid,
  Flex,
  Badge,
  Metric,
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@tremor/react';
import { AgentMetrics } from '@/types/agents';
import { SystemMetrics } from '@/types/monitoring';
import { AlertLevel } from '@/types/alerts';

interface MonitoringDashboardProps {
  refreshInterval?: number;
  showDetailedView?: boolean;
}

function MetricCard({ title, value, unit, className = '' }: {
  title: string;
  value: number;
  unit: string;
  className?: string;
}) {
  return (
    <Card className="bg-white" decoration="top" decorationColor={className.includes('red') ? 'red' : className.includes('yellow') ? 'yellow' : 'green'}>
      <Flex alignItems="start">
        <div>
          <Text>{title}</Text>
          <Metric>{value.toFixed(1)}{unit}</Metric>
        </div>
      </Flex>
    </Card>
  );
}

function AgentStatusCard({ 
  agentId, 
  metrics, 
  showDetails, 
  className = '', 
  style 
}: {
  agentId: string;
  metrics: AgentMetrics;
  showDetails: boolean;
  className?: string;
  style?: { [key: string]: string | number };
}) {
  const statusColors = {
    healthy: 'emerald',
    degraded: 'yellow',
    failed: 'red'
  } as const;

  return (
    <Card className="bg-white">
      <Flex alignItems="center" justifyContent="between" className="space-x-3">
        <Title>{agentId}</Title>
        <Badge size="sm" color={statusColors[metrics.status]}>
          {metrics.status}
        </Badge>
      </Flex>
      {showDetails && (
        <div className="mt-4 space-y-2">
          <Flex justifyContent="between">
            <Text>Success Rate</Text>
            <Text>{(metrics.success_rate * 100).toFixed(1)}%</Text>
          </Flex>
          <Flex justifyContent="between">
            <Text>Response Time</Text>
            <Text>{metrics.avg_response_time.toFixed(2)}ms</Text>
          </Flex>
          <Flex justifyContent="between">
            <Text>Error Count</Text>
            <Text>{metrics.error_count}</Text>
          </Flex>
        </div>
      )}
    </Card>
  );
}

function AlertBadge({ 
  level, 
  message, 
  className = '', 
  style 
}: {
  level: AlertLevel;
  message: string;
  className?: string;
  style?: { [key: string]: string | number };
}) {
  const colors = {
    info: 'blue',
    warning: 'yellow',
    error: 'red',
    critical: 'rose'
  } as const;

  return (
    <Card decoration="left" decorationColor={colors[level]}>
      <Flex alignItems="center" className="gap-2">
        <Badge size="sm" color={colors[level]}>
          {level.toUpperCase()}
        </Badge>
        <Text>{message}</Text>
      </Flex>
    </Card>
  );
}

export function MonitoringDashboard({
  refreshInterval = 5000,
  showDetailedView = false,
}: MonitoringDashboardProps) {
  const [socket, setSocket] = React.useState<Socket | null>(null);
  const [metrics, setMetrics] = React.useState<SystemMetrics>({
    cpu_percent: 0,
    memory_percent: 0,
    disk_usage: {},
    active_agents: 0,
    error_count: 0,
    history: []
  });
  const [agentMetrics, setAgentMetrics] = React.useState<Record<string, AgentMetrics>>({});
  const [alerts, setAlerts] = React.useState<Array<{ level: AlertLevel; message: string }>>([]);
  const [selectedView, setSelectedView] = React.useState(0);

  React.useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000', {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
    });

    newSocket.on('metrics_update', (data: SystemMetrics) => {
      setMetrics(prevMetrics => ({
        ...prevMetrics,
        ...data
      }));
    });

    newSocket.on('agent_metrics', (data: Record<string, AgentMetrics>) => {
      setAgentMetrics(prevMetrics => ({
        ...prevMetrics,
        ...data
      }));
    });

    newSocket.on('alert', (alert: { level: AlertLevel; message: string }) => {
      setAlerts(prev => [...prev, alert].slice(-5));
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const getStatusColor = (value: number): string => {
    if (value >= 90) return 'text-red-500';
    if (value >= 75) return 'text-yellow-500';
    return 'text-green-500';
  };

  const chartData = metrics.history?.map(point => ({
    timestamp: point.timestamp,
    'CPU Usage': point.cpu_percent,
    'Memory Usage': point.memory_percent
  })) || [];

  return (
    <main className="p-4 md:p-10 mx-auto max-w-7xl">
      <Grid numItemsSm={2} numItemsLg={4} className="gap-6">
        <MetricCard
          title="CPU Usage"
          value={metrics.cpu_percent}
          unit="%"
          className={getStatusColor(metrics.cpu_percent)}
        />
        <MetricCard
          title="Memory Usage"
          value={metrics.memory_percent}
          unit="%"
          className={getStatusColor(metrics.memory_percent)}
        />
        <MetricCard
          title="Active Agents"
          value={metrics.active_agents}
          unit=""
        />
        <MetricCard
          title="Error Count"
          value={metrics.error_count}
          unit=""
          className={metrics.error_count > 0 ? 'text-red-500' : 'text-green-500'}
        />
      </Grid>

      <TabGroup className="mt-6">
        <TabList>
          <Tab>Performance</Tab>
          <Tab>Agents</Tab>
          <Tab>Alerts</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <Card className="mt-6">
              <Title>System Performance</Title>
              <LineChart
                className="mt-6 h-96"
                data={chartData}
                index="timestamp"
                categories={['CPU Usage', 'Memory Usage']}
                colors={['indigo', 'emerald']}
                yAxisWidth={40}
                showLegend={true}
                showGridLines={true}
                showAnimation={true}
              />
            </Card>
          </TabPanel>
          <TabPanel>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(agentMetrics).map(([id, metrics]) => (
                <AgentStatusCard
                  key={id}
                  agentId={id}
                  metrics={metrics}
                  showDetails={showDetailedView}
                />
              ))}
            </div>
          </TabPanel>
          <TabPanel>
            <div className="mt-6 space-y-4">
              {alerts.map((alert, index) => (
                <AlertBadge
                  key={`alert-${index}`}
                  level={alert.level}
                  message={alert.message}
                />
              ))}
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </main>
  );
} 