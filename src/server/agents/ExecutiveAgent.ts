import { EventEmitter } from 'events';
import { 
  AgentStatus, 
  ExecutiveMetrics, 
  ExecutiveConfig, 
  AgentEvent,
  ReportType,
  MetricCategory
} from '@/types/agents';

/**
 * ExecutiveAgent class responsible for monitoring and analyzing business metrics,
 * generating reports, and managing stakeholder communications.
 * 
 * @extends EventEmitter - Enables event-based communication with the agent manager
 */
export class ExecutiveAgent extends EventEmitter {
  private status: AgentStatus = 'idle';
  private metrics: ExecutiveMetrics;
  private config: ExecutiveConfig;
  private taskInterval: NodeJS.Timeout | null = null;
  private alertInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize the ExecutiveAgent with configuration and default metrics
   * @param config - Configuration for the executive agent including report types and stakeholder preferences
   */
  constructor(config: ExecutiveConfig) {
    super();
    this.config = config;
    // Initialize metrics with default values
    this.metrics = {
      status: 'idle',
      success_rate: 100,
      avg_response_time: 0,
      error_count: 0,
      consecutive_failures: 0,
      reports_generated: 0,
      alerts_triggered: 0,
      stakeholder_engagement: 0,
      decision_accuracy: 100,
      // Track metrics for different report types
      report_metrics: {
        financial: { completed: 0, pending: 0 },
        operational: { completed: 0, pending: 0 },
        strategic: { completed: 0, pending: 0 },
        compliance: { completed: 0, pending: 0 }
      },
      // Initialize trend tracking for all metric categories
      metric_trends: {
        revenue: [],
        costs: [],
        efficiency: [],
        satisfaction: [],
        sales: [],
        marketing: [],
        customer_success: [],
        operations: []
      }
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
   */
  public restart(): void {
    this.stop();
    setTimeout(() => this.start(), 1000);
  }

  /**
   * Start the agent's monitoring and analysis tasks
   * Sets up two main intervals:
   * 1. Alert monitoring - Checks for metric deviations and stakeholder alerts
   * 2. Report generation - Analyzes data and generates periodic reports
   */
  public start(): void {
    if (this.status === 'active') return;

    this.setStatus('active');
    
    // Start alert monitoring (every 15 seconds)
    this.alertInterval = setInterval(() => this.processAlerts(), 15000);

    // Start report generation and analysis (every 30 seconds)
    this.taskInterval = setInterval(() => this.processTask(), 30000);
  }

  /**
   * Stop all agent activities and clear intervals
   */
  public stop(): void {
    if (this.status === 'idle') return;

    this.setStatus('idle');
    
    if (this.alertInterval) {
      clearInterval(this.alertInterval);
      this.alertInterval = null;
    }

    if (this.taskInterval) {
      clearInterval(this.taskInterval);
      this.taskInterval = null;
    }
  }

  /**
   * Process alerts by simulating metric changes and stakeholder interactions
   */
  private async processAlerts(): Promise<void> {
    try {
      const alertUpdates = this.simulateAlertActivity();
      this.updateAlertMetrics(alertUpdates);
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * Simulate alert activity across different metric categories
   * @returns Object containing simulated alerts and stakeholder engagement data
   */
  private simulateAlertActivity() {
    const baseMultiplier = Math.random();
    
    // Simulate alerts for all metric categories
    const categories: Record<MetricCategory, boolean> = {
      revenue: Math.random() > 0.7,
      costs: Math.random() > 0.7,
      efficiency: Math.random() > 0.7,
      satisfaction: Math.random() > 0.7,
      sales: Math.random() > 0.7,
      marketing: Math.random() > 0.7,
      customer_success: Math.random() > 0.7,
      operations: Math.random() > 0.7
    };
    
    return {
      alerts: Math.floor(baseMultiplier * 5),
      categories,
      stakeholderEngagement: Math.random() * 100
    };
  }

  /**
   * Update metrics based on alert activity
   * @param updates - Alert activity data including triggered alerts and stakeholder engagement
   */
  private updateAlertMetrics(updates: {
    alerts: number;
    categories: Record<MetricCategory, boolean>;
    stakeholderEngagement: number;
  }): void {
    this.metrics.alerts_triggered += updates.alerts;

    // Update metric trends for categories with alerts
    Object.entries(updates.categories).forEach(([category, triggered]) => {
      if (triggered) {
        const trend = this.metrics.metric_trends[category as MetricCategory];
        trend.push(Math.random() * 100);
        if (trend.length > 10) trend.shift(); // Keep last 10 data points
      }
    });

    // Update stakeholder engagement using rolling average
    this.metrics.stakeholder_engagement = 
      (this.metrics.stakeholder_engagement * 0.9) + 
      (updates.stakeholderEngagement * 0.1);

    this.emitEvent('metrics_update', { metrics: this.metrics });
  }

  /**
   * Process periodic tasks including report generation and analysis
   */
  private async processTask(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const activities = this.simulateExecutiveActivities();
      
      if (activities.success) {
        this.metrics.consecutive_failures = 0;
        this.updateMetrics(startTime, activities);
      } else {
        throw new Error('Task processing failed');
      }
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * Simulate executive activities including report generation and analysis
   * @returns Object containing simulated report updates and success status
   */
  private simulateExecutiveActivities(): {
    success: boolean;
    reportUpdates: {
      type: ReportType;
      completed: number;
      pending: number;
      accuracy: number;
    }[];
  } {
    const success = Math.random() > 0.05; // 95% success rate
    
    if (success) {
      const reportTypes: ReportType[] = ['financial', 'operational', 'strategic', 'compliance'];
      return {
        success: true,
        reportUpdates: reportTypes.map(type => ({
          type,
          completed: Math.floor(Math.random() * 3),
          pending: Math.floor(Math.random() * 2),
          accuracy: 85 + Math.random() * 15 // 85-100% accuracy
        }))
      };
    }
    
    return {
      success: false,
      reportUpdates: []
    };
  }

  /**
   * Update metrics based on completed activities
   * @param startTime - Timestamp when the activity started
   * @param activities - Results of executive activities including report updates
   */
  private updateMetrics(startTime: number, activities: {
    reportUpdates: {
      type: ReportType;
      completed: number;
      pending: number;
      accuracy: number;
    }[];
  }): void {
    // Update response time using rolling average
    const responseTime = Date.now() - startTime;
    this.metrics.avg_response_time = 
      (this.metrics.avg_response_time * 0.9) + (responseTime * 0.1);
    
    // Update success rate based on total tasks and errors
    const totalTasks = this.metrics.error_count + 
      (this.metrics.success_rate * 100);
    const successfulTasks = totalTasks - this.metrics.error_count;
    this.metrics.success_rate = (successfulTasks / (totalTasks + 1)) * 100;

    // Process report updates
    activities.reportUpdates.forEach(update => {
      const reportMetric = this.metrics.report_metrics[update.type];
      
      // Update report counts
      reportMetric.completed += update.completed;
      reportMetric.pending = Math.max(0, 
        reportMetric.pending + update.pending - update.completed
      );
      
      this.metrics.reports_generated += update.completed;

      // Update decision accuracy using rolling average
      this.metrics.decision_accuracy = 
        (this.metrics.decision_accuracy * 0.9) + 
        (update.accuracy * 0.1);
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
  public getMetrics(): ExecutiveMetrics {
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
  public getConfig(): ExecutiveConfig {
    return { ...this.config };
  }
} 