import { EventEmitter } from 'events';
import { 
  AgentStatus, 
  CustomerSuccessAgentMetrics, 
  CustomerSuccessAgentConfig, 
  AgentEvent,
  CustomerStage,
  SupportPriority
} from '@/types/agents';

/**
 * CustomerSuccessAgent class responsible for managing customer relationships,
 * monitoring customer health, and handling support tickets.
 * 
 * Key responsibilities:
 * - Track and manage customer lifecycle stages
 * - Monitor and respond to support tickets
 * - Calculate and maintain customer health scores
 * - Measure customer satisfaction and churn risk
 * 
 * @extends EventEmitter - Enables event-based communication with the agent manager
 */
export class CustomerSuccessAgent extends EventEmitter {
  private status: AgentStatus = 'idle';
  private metrics: CustomerSuccessAgentMetrics;
  private config: CustomerSuccessAgentConfig;
  private taskInterval: NodeJS.Timeout | null = null;
  private ticketInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize the CustomerSuccessAgent with configuration and default metrics
   * 
   * @param config - Configuration including:
   *   - Health score thresholds for risk assessment
   *   - Support channels and SLA timelines
   *   - Automated response settings
   *   - Escalation rules for different priority levels
   */
  constructor(config: CustomerSuccessAgentConfig) {
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

      // Customer base metrics
      active_customers: 0,
      churn_rate: 0,
      nps_score: 0,
      customer_satisfaction: 0,
      time_to_resolution: 0,
      tickets_resolved: 0,

      // Health scores by customer stage
      customer_health_scores: {
        onboarding: 100,  // New customers in setup phase
        active: 100,      // Regular, healthy customers
        at_risk: 60,      // Customers showing warning signs
        churned: 0        // Lost customers
      },

      // Support ticket tracking
      support_tickets: {
        open: 0,
        resolved: 0,
        by_priority: {
          low: 0,
          medium: 0,
          high: 0,
          urgent: 0
        }
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
   * Used when recovering from errors or applying configuration changes
   */
  public restart(): void {
    this.stop();
    setTimeout(() => this.start(), 1000); // Brief cooldown before restart
  }

  /**
   * Start the agent's monitoring and support activities
   * Sets up two main intervals:
   * 1. Ticket monitoring - Processes support tickets and updates resolution metrics
   * 2. Customer monitoring - Tracks customer health and engagement metrics
   */
  public start(): void {
    if (this.status === 'active') return;

    this.setStatus('active');
    
    // Start ticket monitoring (every 10 seconds)
    this.ticketInterval = setInterval(() => this.processTickets(), 10000);

    // Start customer monitoring (every 5 seconds)
    this.taskInterval = setInterval(() => this.processTask(), 5000);
  }

  /**
   * Stop all agent activities and clear monitoring intervals
   */
  public stop(): void {
    if (this.status === 'idle') return;

    this.setStatus('idle');
    
    if (this.ticketInterval) {
      clearInterval(this.ticketInterval);
      this.ticketInterval = null;
    }

    if (this.taskInterval) {
      clearInterval(this.taskInterval);
      this.taskInterval = null;
    }
  }

  /**
   * Process support tickets by simulating ticket creation and resolution
   * Updates metrics for:
   * - Ticket counts by priority
   * - Resolution times
   * - Customer satisfaction impact
   */
  private async processTickets(): Promise<void> {
    try {
      // Simulate ticket processing
      const ticketUpdates = this.simulateTicketActivity();
      this.updateTicketMetrics(ticketUpdates);
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * Simulate support ticket activity across different priority levels
   * @returns Object containing new and resolved tickets, plus average resolution time
   */
  private simulateTicketActivity() {
    const baseMultiplier = Math.random();
    
    return {
      // New tickets are weighted by priority (fewer high-priority tickets)
      new: {
        low: Math.floor(baseMultiplier * 3),
        medium: Math.floor(baseMultiplier * 2),
        high: Math.floor(baseMultiplier * 1),
        urgent: Math.floor(baseMultiplier * 0.5)
      },
      // Resolution rate is higher for higher priority tickets
      resolved: {
        low: Math.floor(baseMultiplier * 4),
        medium: Math.floor(baseMultiplier * 3),
        high: Math.floor(baseMultiplier * 2),
        urgent: Math.floor(baseMultiplier * 1)
      },
      avgResolutionTime: Math.floor(baseMultiplier * 120) // minutes
    };
  }

  /**
   * Update ticket-related metrics based on activity
   * @param updates - Ticket activity data including new, resolved, and resolution time
   */
  private updateTicketMetrics(updates: {
    new: Record<SupportPriority, number>;
    resolved: Record<SupportPriority, number>;
    avgResolutionTime: number;
  }): void {
    // Update ticket counts for new tickets
    Object.entries(updates.new).forEach(([priority, count]) => {
      this.metrics.support_tickets.open += count;
      this.metrics.support_tickets.by_priority[priority as SupportPriority] += count;
    });

    // Update ticket counts for resolved tickets
    Object.entries(updates.resolved).forEach(([priority, count]) => {
      // Only resolve up to the number of open tickets in each priority
      const actualResolved = Math.min(
        count,
        this.metrics.support_tickets.by_priority[priority as SupportPriority]
      );
      
      // Update ticket counters
      this.metrics.support_tickets.open -= actualResolved;
      this.metrics.support_tickets.resolved += actualResolved;
      this.metrics.support_tickets.by_priority[priority as SupportPriority] -= actualResolved;
      this.metrics.tickets_resolved += actualResolved;
    });

    // Update resolution time using rolling average
    this.metrics.time_to_resolution = 
      (this.metrics.time_to_resolution * 0.9) + (updates.avgResolutionTime * 0.1);

    this.emitEvent('metrics_update', { metrics: this.metrics });
  }

  /**
   * Process periodic customer monitoring tasks
   * Tracks:
   * - Customer stage transitions
   * - NPS and satisfaction scores
   * - Health score updates
   */
  private async processTask(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Simulate customer success activities
      const activities = this.simulateCustomerActivities();
      
      if (activities.success && activities.customerUpdates) {
        this.metrics.consecutive_failures = 0;
        this.updateMetrics(startTime, { customerUpdates: activities.customerUpdates });
      } else {
        throw new Error('Task processing failed');
      }
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * Simulate customer activity and feedback
   * @returns Object containing customer stage changes, NPS data, and satisfaction scores
   */
  private simulateCustomerActivities(): {
    success: boolean;
    customerUpdates?: {
      stage_changes: Record<CustomerStage, number>;
      nps_responses: { score: number; count: number; };
      satisfaction_score: number;
    };
  } {
    const success = Math.random() > 0.1; // 90% success rate
    
    if (success) {
      return {
        success: true,
        customerUpdates: {
          // Simulate customer lifecycle transitions
          stage_changes: {
            onboarding: Math.floor(Math.random() * 3),  // New customers
            active: Math.floor(Math.random() * 5),      // Activated customers
            at_risk: Math.floor(Math.random() * 2),     // Customers showing risk
            churned: Math.floor(Math.random() * 1)      // Lost customers
          },
          // Simulate NPS survey responses
          nps_responses: {
            score: Math.floor(Math.random() * 10),
            count: Math.floor(Math.random() * 5)
          },
          satisfaction_score: Math.random() * 100
        }
      };
    }
    
    return { success: false };
  }

  /**
   * Update customer-related metrics based on activity
   * @param responseTime - Time taken to process the activity
   * @param activities - Customer activity data including stage changes and feedback
   */
  private updateMetrics(responseTime: number, activities: { 
    customerUpdates: {
      stage_changes: Record<CustomerStage, number>;
      nps_responses: { score: number; count: number; };
      satisfaction_score: number;
    };
  }): void {
    // Update response time using rolling average
    this.metrics.avg_response_time = 
      (this.metrics.avg_response_time * 0.9) + (responseTime * 0.1);
    
    // Update success rate based on total tasks and errors
    const totalTasks = this.metrics.error_count + 
      (this.metrics.success_rate * 100);
    const successfulTasks = totalTasks - this.metrics.error_count;
    this.metrics.success_rate = (successfulTasks / (totalTasks + 1)) * 100;

    // Update customer metrics
    const updates = activities.customerUpdates;
    
    // Update active customers based on stage transitions
    this.metrics.active_customers += 
      updates.stage_changes.active + 
      updates.stage_changes.onboarding - 
      updates.stage_changes.churned;

    // Calculate churn rate based on active customer base
    if (this.metrics.active_customers > 0) {
      this.metrics.churn_rate = 
        (updates.stage_changes.churned / this.metrics.active_customers) * 100;
    }

    // Update NPS score using rolling average if we have responses
    if (updates.nps_responses.count > 0) {
      this.metrics.nps_score = 
        (this.metrics.nps_score * 0.9) + 
        ((updates.nps_responses.score / updates.nps_responses.count) * 0.1);
    }

    // Update customer satisfaction using rolling average
    this.metrics.customer_satisfaction = 
      (this.metrics.customer_satisfaction * 0.9) + 
      (updates.satisfaction_score * 0.1);

    // Recalculate health scores based on updated metrics
    this.updateHealthScores();

    this.emitEvent('metrics_update', { metrics: this.metrics });
  }

  /**
   * Update customer health scores based on multiple factors:
   * - Customer satisfaction
   * - NPS scores
   * - Support ticket resolution times
   * - Churn risk indicators
   */
  private updateHealthScores(): void {
    // Get health score thresholds from config or use defaults
    const { at_risk = 70, healthy = 80 } = this.config.healthScoreThresholds || {};

    this.metrics.customer_health_scores = {
      // Onboarding health: Weighted by satisfaction and support responsiveness
      onboarding: Math.min(100, 
        this.metrics.customer_satisfaction * 0.7 + 
        (100 - this.metrics.time_to_resolution / 60) * 0.3
      ),
      // Active customer health: Balanced between satisfaction, NPS, and churn risk
      active: Math.min(100,
        this.metrics.customer_satisfaction * 0.4 + 
        this.metrics.nps_score * 10 * 0.4 +
        (100 - this.metrics.churn_rate) * 0.2
      ),
      // At-risk health: Higher weight on churn indicators
      at_risk: Math.max(at_risk - 20,
        this.metrics.customer_satisfaction * 0.3 + 
        this.metrics.nps_score * 10 * 0.3 +
        (100 - this.metrics.churn_rate) * 0.4
      ),
      // Churned customers always have 0 health score
      churned: 0
    };
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
  public getMetrics(): CustomerSuccessAgentMetrics {
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
  public getConfig(): CustomerSuccessAgentConfig {
    return { ...this.config };
  }
} 