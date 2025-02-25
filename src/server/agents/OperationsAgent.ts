import { EventEmitter } from 'events';
import { 
  AgentStatus, 
  OperationsMetrics, 
  OperationsConfig, 
  AgentEvent,
  OperationStatus,
  ResourceType,
  ServiceHealth
} from '@/types/agents';

/**
 * OperationsAgent class responsible for monitoring system health, managing resources,
 * and ensuring operational efficiency across the platform.
 * 
 * Key responsibilities:
 * - Monitor system performance and resource utilization
 * - Track and respond to system incidents
 * - Manage compliance and security metrics
 * - Optimize resource allocation and scaling
 * 
 * @extends EventEmitter - Enables event-based communication with the agent manager
 */
export class OperationsAgent extends EventEmitter {
  private status: AgentStatus = 'idle';
  private metrics: OperationsMetrics;
  private config: OperationsConfig;
  private monitorInterval: NodeJS.Timeout | null = null;
  private resourceInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize the OperationsAgent with configuration and default metrics
   * 
   * @param config - Configuration including:
   *   - Resource utilization thresholds
   *   - Monitoring intervals
   *   - Alert thresholds
   *   - Compliance requirements
   *   - Scaling policies
   */
  constructor(config: OperationsConfig) {
    super();
    this.config = config;
    // Initialize metrics with default values
    this.metrics = {
      // Base agent metrics
      status: 'idle',
      success_rate: 100,
      avg_response_time: 0,
      error_count: 0,
      consecutive_failures: 0,

      // System health metrics
      system_uptime: 100,
      incident_count: 0,
      mttr: 0,

      // Resource tracking
      resource_utilization: {
        cpu: 0,
        compute: 0,
        memory: 0,
        storage: 0,
        network: 0,
        database: 0
      },

      // Service health status
      service_health: {
        api: 'healthy',
        database: 'healthy',
        cache: 'healthy',
        queue: 'healthy'
      },

      // Resource metrics history
      resource_metrics: {
        cpu: [],
        compute: [],
        memory: [],
        storage: [],
        network: [],
        database: []
      },

      // Compliance score
      compliance_score: 100
    };
  }

  /**
   * Update agent status and emit status change event
   * @param newStatus - New status to set for the agent
   */
  private setStatus(newStatus: AgentStatus): void {
    this.status = newStatus;
    this.metrics.status = newStatus;
    this.emitEvent('status_change', { status: newStatus });
  }

  /**
   * Restart the agent with a brief cooldown period
   * Used when recovering from system issues or applying configuration changes
   */
  public restart(): void {
    this.stop();
    setTimeout(() => this.start(), 1000); // Brief cooldown before restart
  }

  /**
   * Start the agent's monitoring and resource management activities
   * Sets up two main intervals:
   * 1. System monitoring - Tracks performance metrics and incidents
   * 2. Resource monitoring - Manages resource allocation and optimization
   */
  public start(): void {
    if (this.status === 'active') return;

    this.setStatus('active');
    
    // Start system monitoring (every 5 seconds)
    this.monitorInterval = setInterval(() => this.monitorSystem(), 5000);

    // Start resource monitoring (every 10 seconds)
    this.resourceInterval = setInterval(() => this.monitorResources(), 10000);
  }

  /**
   * Stop all agent activities and clear monitoring intervals
   */
  public stop(): void {
    if (this.status === 'idle') return;

    this.setStatus('idle');
    
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }

    if (this.resourceInterval) {
      clearInterval(this.resourceInterval);
      this.resourceInterval = null;
    }
  }

  /**
   * Monitor system health and performance metrics
   * Updates:
   * - System uptime and performance
   * - Incident detection and resolution
   * - Service health status
   */
  private async monitorSystem(): Promise<void> {
    try {
      const systemUpdates = this.simulateSystemActivity();
      this.updateSystemMetrics(systemUpdates);
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * Simulate system activity and performance metrics
   * @returns Object containing system performance data and service health
   */
  private simulateSystemActivity() {
    const baseMultiplier = Math.random();
    
    return {
      // Service health status
      health: {
        api: Math.random() > 0.02 ? 'healthy' : 'degraded',
        database: Math.random() > 0.01 ? 'healthy' : 'degraded',
        cache: Math.random() > 0.05 ? 'healthy' : 'degraded',
        queue: Math.random() > 0.03 ? 'healthy' : 'degraded'
      } as ServiceHealth,

      // Incident metrics
      incidents: {
        new: Math.floor(baseMultiplier * 2),
        resolved: Math.floor(baseMultiplier * 3),
        resolution_time: Math.floor(baseMultiplier * 1800) // seconds
      },

      // Compliance updates
      compliance: {
        score: 85 + (Math.random() * 15),
        violations: Math.floor(baseMultiplier * 2)
      }
    };
  }

  /**
   * Update system-related metrics based on monitoring data
   * @param updates - System monitoring data including service health and incidents
   */
  private updateSystemMetrics(updates: {
    health: ServiceHealth;
    incidents: {
      new: number;
      resolved: number;
      resolution_time: number;
    };
    compliance: {
      score: number;
      violations: number;
    };
  }): void {
    // Update service health status
    this.metrics.service_health = updates.health;

    // Calculate system uptime based on service health
    const healthyServices = Object.values(updates.health)
      .filter(status => status === 'healthy').length;
    const totalServices = Object.keys(updates.health).length;
    this.metrics.system_uptime = (healthyServices / totalServices) * 100;

    // Update incident metrics
    this.metrics.incident_count += updates.incidents.new;
    
    // Update MTTR using rolling average if incidents were resolved
    if (updates.incidents.resolved > 0) {
      this.metrics.mttr = 
        (this.metrics.mttr * 0.9) + 
        (updates.incidents.resolution_time * 0.1);
    }

    // Update compliance score using rolling average
    this.metrics.compliance_score = 
      (this.metrics.compliance_score * 0.9) + 
      (updates.compliance.score * 0.1);

    this.emitEvent('metrics_update', { metrics: this.metrics });
  }

  /**
   * Monitor and optimize resource allocation across the system
   * Tracks:
   * - Resource utilization by type
   * - Resource metrics history
   * - System efficiency
   */
  private async monitorResources(): Promise<void> {
    try {
      const resourceUpdates = this.simulateResourceActivity();
      this.updateResourceMetrics(resourceUpdates);
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * Simulate resource utilization and allocation activities
   * @returns Object containing resource utilization data by type
   */
  private simulateResourceActivity(): Record<ResourceType, number> {
    return {
      cpu: 40 + (Math.random() * 30),      // Base CPU load
      compute: 35 + (Math.random() * 35),   // Additional compute resources
      memory: 50 + (Math.random() * 20),    // Memory usage
      storage: 60 + (Math.random() * 10),   // Storage utilization
      network: 30 + (Math.random() * 40),   // Network usage
      database: 45 + (Math.random() * 25)   // Database utilization
    };
  }

  /**
   * Update resource-related metrics based on monitoring data
   * @param updates - Resource utilization data by type
   */
  private updateResourceMetrics(updates: Record<ResourceType, number>): void {
    // Update current utilization
    Object.entries(updates).forEach(([resource, value]) => {
      this.metrics.resource_utilization[resource as ResourceType] = value;
      
      // Update historical metrics (keep last 60 data points)
      const trend = this.metrics.resource_metrics[resource as ResourceType];
      trend.push(value);
      if (trend.length > 60) trend.shift();
    });

    this.emitEvent('metrics_update', { metrics: this.metrics });
  }

  /**
   * Handle errors by updating error metrics and potentially changing agent status
   * @param error - The error that occurred
   */
  private handleError(error: Error): void {
    this.metrics.error_count++;
    this.metrics.consecutive_failures++;

    if (this.metrics.consecutive_failures >= (this.config.retryAttempts || 3)) {
      this.setStatus('error');
    }

    this.emitEvent('error', { error: error.message });
  }

  /**
   * Emit an event with the specified type and data
   * @param type - Type of event to emit
   * @param data - Data to include with the event
   */
  private emitEvent(type: AgentEvent['type'], data: Partial<AgentEvent['data']>): void {
    const event: AgentEvent = {
      type,
      agentId: this.config.id,
      data,
      timestamp: Date.now()
    };
    this.emit('agent_event', event);
  }

  // Public methods for external interaction

  /**
   * Get current metrics
   * @returns Copy of current metrics
   */
  public getMetrics(): OperationsMetrics {
    return { ...this.metrics };
  }

  /**
   * Get current agent status
   * @returns Current status
   */
  public getStatus(): AgentStatus {
    return this.status;
  }

  /**
   * Get agent ID
   * @returns Agent ID
   */
  public getId(): string {
    return this.config.id;
  }

  /**
   * Get agent name
   * @returns Agent name
   */
  public getName(): string {
    return this.config.name;
  }

  /**
   * Get agent configuration
   * @returns Copy of current configuration
   */
  public getConfig(): OperationsConfig {
    return { ...this.config };
  }
} 