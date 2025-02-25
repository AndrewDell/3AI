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
   * Process and respond to business metric alerts
   * In a real implementation, this would connect to business intelligence 
   * tools and notify stakeholders of significant deviations
   */
  private async processAlerts(): Promise<void> {
    try {
      // Simulate alert monitoring and stakeholder notifications
      const alertData = this.simulateAlertActivity();
      this.updateAlertMetrics(alertData);
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * Generate simulated alert data across business metrics
   * Models different metric categories that might trigger executive attention
   * 
   * @returns Object containing alert counts, affected categories, and stakeholder engagement metrics
   */
  private simulateAlertActivity() {
    const baseMultiplier = Math.random();
    
    // Create a record of which categories have alerts
    const categories: Record<MetricCategory, boolean> = {
      revenue: Math.random() > 0.7,
      costs: Math.random() > 0.7,
      efficiency: Math.random() > 0.8,
      satisfaction: Math.random() > 0.8,
      sales: Math.random() > 0.7,
      marketing: Math.random() > 0.7,
      customer_success: Math.random() > 0.8,
      operations: Math.random() > 0.8
    };
    
    return {
      // Number of alerts generated in this cycle
      alerts: Math.floor(baseMultiplier * 3),
      categories,
      // Measure of how many stakeholders engaged with previous alerts
      stakeholderEngagement: baseMultiplier * 0.7
    };
  }

  /**
   * Update alert-related metrics based on simulated activity
   * Tracks:
   * - Number of alerts triggered
   * - Which business categories are experiencing issues
   * - Stakeholder engagement with alerts
   * 
   * @param updates - Alert data including counts, categories, and engagement metrics
   */
  private updateAlertMetrics(updates: {
    alerts: number;
    categories: Record<MetricCategory, boolean>;
    stakeholderEngagement: number;
  }): void {
    // Update alert count
    this.metrics.alerts_triggered += updates.alerts;
    
    // Update stakeholder engagement with a weighted rolling average
    this.metrics.stakeholder_engagement = 
      (this.metrics.stakeholder_engagement * 0.8) + 
      (updates.stakeholderEngagement * 0.2);
    
    // Update metric trends for categories with alerts
    Object.entries(updates.categories).forEach(([category, hasAlert]) => {
      if (hasAlert && this.metrics.metric_trends[category as MetricCategory]) {
        // Add a new data point to the trend (simplified implementation)
        // In a real system, this would use actual metric values
        const currentValue = Math.random() * 100;
        this.metrics.metric_trends[category as MetricCategory].push(currentValue);
        
        // Keep only the last 10 data points
        if (this.metrics.metric_trends[category as MetricCategory].length > 10) {
          this.metrics.metric_trends[category as MetricCategory].shift();
        }
      }
    });

    // Emit updated metrics
    this.emitEvent('metrics_update', { metrics: this.metrics });
  }

  /**
   * Process executive tasks such as report generation,
   * data analysis, and strategic planning
   * 
   * Tracks execution time for performance metrics
   */
  private async processTask(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Simulate executive reporting and analysis activities
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
   * Generate simulated executive activity data
   * Models report generation across different business domains
   * 
   * @returns Object containing report updates by type, including completion status and accuracy metrics
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
    // 95% success rate for executive tasks
    const success = Math.random() > 0.05;
    
    if (success) {
      // Generate report activity for each configured report type
      const reportUpdates = (this.config.reportTypes || ['financial', 'operational']).map(type => {
        return {
          type,
          // Most cycles complete 0-1 reports of each type
          completed: Math.floor(Math.random() * 1.5),
          // Most cycles generate 1-3 pending reports
          pending: Math.floor(Math.random() * 3) + 1,
          // Accuracy between 85% and 100%
          accuracy: 0.85 + (Math.random() * 0.15)
        };
      });
      
      return {
        success: true,
        reportUpdates
      };
    }
    
    return { 
      success: false,
      reportUpdates: []
    };
  }

  /**
   * Update executive metrics based on activity data
   * Tracks:
   * - Response time and success rate
   * - Reports generated and pending by type
   * - Decision accuracy trends
   * 
   * @param startTime - Timestamp when task processing began
   * @param activities - Executive activity data including report updates
   */
  private updateMetrics(startTime: number, activities: {
    reportUpdates: {
      type: ReportType;
      completed: number;
      pending: number;
      accuracy: number;
    }[];
  }): void {
    // Update response time using weighted rolling average
    const responseTime = Date.now() - startTime;
    this.metrics.avg_response_time = 
      (this.metrics.avg_response_time * 0.9) + (responseTime * 0.1);
    
    // Update success rate calculation
    const totalTasks = this.metrics.error_count + 
      (this.metrics.success_rate * 100);
    const successfulTasks = totalTasks - this.metrics.error_count;
    this.metrics.success_rate = (successfulTasks / (totalTasks + 1)) * 100;

    // Process each report type's updates
    activities.reportUpdates.forEach(report => {
      // Update report counts for this type
      if (this.metrics.report_metrics[report.type]) {
        this.metrics.report_metrics[report.type].completed += report.completed;
        this.metrics.report_metrics[report.type].pending = report.pending;
      }
      
      // Update overall reports generated count
      this.metrics.reports_generated += report.completed;
      
      // Update decision accuracy using weighted rolling average
      this.metrics.decision_accuracy = 
        (this.metrics.decision_accuracy * 0.95) + (report.accuracy * 100 * 0.05);
    });

    // Emit updated metrics
    this.emitEvent('metrics_update', { metrics: this.metrics });
  }

  /**
   * Handle errors that occur during agent operation
   * Tracks consecutive failures and updates error metrics
   * 
   * @param error - The error that occurred
   */
  private handleError(error: Error): void {
    // Increment error count and consecutive failures
    this.metrics.error_count++;
    this.metrics.consecutive_failures++;
    
    // Log the error
    console.error(`Executive agent error: ${error.message}`);
    
    // If too many consecutive failures, mark the agent as failed
    if (this.metrics.consecutive_failures >= 3) {
      this.setStatus('failed' as AgentStatus);
    }
  }

  /**
   * Emit an event with the specified type and data
   * Used for communication with the agent orchestrator
   * 
   * @param type - The type of event to emit
   * @param data - The event data to include
   */
  private emitEvent(type: AgentEvent['type'], data: Partial<AgentEvent['data']>): void {
    const event: AgentEvent = {
      type,
      data
    };
    this.emit('event', event);
  }

  /**
   * Get the current agent metrics
   * @returns The current executive metrics
   */
  public getMetrics(): ExecutiveMetrics {
    return this.metrics;
  }

  /**
   * Get the current agent status
   * @returns The current agent status
   */
  public getStatus(): AgentStatus {
    return this.status;
  }

  /**
   * Get the agent's unique identifier
   * @returns The agent ID
   */
  public getId(): string {
    return this.config.id;
  }

  /**
   * Get the agent's display name
   * @returns The agent name
   */
  public getName(): string {
    return this.config.name;
  }

  /**
   * Get the agent's configuration
   * @returns The executive agent configuration
   */
  public getConfig(): ExecutiveConfig {
    return this.config;
  }
} 