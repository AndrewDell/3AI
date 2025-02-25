import { EventEmitter } from 'events';
import { 
  AgentStatus, 
  MarketingMetrics, 
  MarketingAgentConfig, 
  AgentEvent,
  MarketingChannel,
  ChannelMetrics
} from '@/types/agents';

/**
 * MarketingAgent class responsible for automating marketing activities,
 * campaign management, and channel performance tracking.
 * 
 * Key responsibilities:
 * - Track and optimize multi-channel marketing campaigns
 * - Monitor audience engagement and conversion metrics
 * - Generate marketing-qualified leads
 * - Calculate ROI across marketing channels
 * 
 * @extends EventEmitter - Enables event-based communication with the agent manager
 */
export class MarketingAgent extends EventEmitter {
  private status: AgentStatus = 'idle';
  private metrics: MarketingMetrics;
  private config: MarketingAgentConfig;
  private taskInterval: NodeJS.Timeout | null = null;
  private campaignInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize the MarketingAgent with configuration and default metrics
   * 
   * @param config - Configuration including:
   *   - Marketing channels to utilize (email, social, search, etc.)
   *   - Campaign budget and ROI targets
   *   - Target audience segments
   *   - Content strategy settings
   */
  constructor(config: MarketingAgentConfig) {
    super();
    this.config = config;
    this.metrics = {
      status: 'idle',
      success_rate: 100,
      avg_response_time: 0,
      error_count: 0,
      consecutive_failures: 0,
      leads_generated: 0,
      conversion_rate: 0,
      campaign_metrics: {
        active_campaigns: 0,
        completed_campaigns: 0,
        total_spend: 0,
        roi: 0
      },
      channel_performance: {
        email: { reach: 0, engagement: 0, conversions: 0 },
        social: { reach: 0, engagement: 0, conversions: 0 },
        search: { reach: 0, engagement: 0, conversions: 0 },
        display: { reach: 0, engagement: 0, conversions: 0 },
        content: { reach: 0, engagement: 0, conversions: 0 },
        events: { reach: 0, engagement: 0, conversions: 0 }
      },
      audience_engagement: {
        total_reach: 0,
        engagement_rate: 0,
        click_through_rate: 0,
        bounce_rate: 0
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
   * Start the agent's marketing automation activities
   * Sets up two main intervals:
   * 1. Campaign monitoring - Tracks performance metrics across channels
   * 2. Marketing tasks - Executes content creation, scheduling, and optimization
   */
  public start(): void {
    if (this.status === 'active') return;

    this.setStatus('active');
    
    // Start campaign monitoring (every 10 seconds)
    this.campaignInterval = setInterval(() => this.monitorCampaigns(), 10000);

    // Start general marketing activities (every 15 seconds)
    this.taskInterval = setInterval(() => this.processTask(), 15000);
  }

  /**
   * Stop all agent activities and clear monitoring intervals
   */
  public stop(): void {
    if (this.status === 'idle') return;

    this.setStatus('idle');
    
    if (this.campaignInterval) {
      clearInterval(this.campaignInterval);
      this.campaignInterval = null;
    }

    if (this.taskInterval) {
      clearInterval(this.taskInterval);
      this.taskInterval = null;
    }
  }

  /**
   * Monitor active marketing campaigns across all channels
   * In a real implementation, this would connect to ad platforms,
   * email marketing systems, and social media analytics
   */
  private async monitorCampaigns(): Promise<void> {
    try {
      // Simulate campaign performance data
      const campaignUpdates = this.simulateCampaignActivity();
      this.updateCampaignMetrics(campaignUpdates);
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * Generate simulated campaign performance data across configured channels
   * @returns Object containing channel metrics, spend, and revenue data
   */
  private simulateCampaignActivity() {
    const baseMultiplier = Math.random();
    
    return {
      channels: this.config.channels.map(channel => ({
        name: channel,
        metrics: {
          reach: Math.floor(baseMultiplier * 1000),
          engagement: baseMultiplier * 0.2,
          conversions: Math.floor(baseMultiplier * 50)
        }
      })),
      spend: baseMultiplier * (this.config.goals.budget || 1000),
      revenue: baseMultiplier * (this.config.goals.budget || 1000) * 1.5
    };
  }

  /**
   * Update marketing metrics based on campaign performance data
   * Calculates:
   * - Channel-specific performance (reach, engagement, conversions)
   * - Overall campaign ROI
   * - Audience engagement statistics
   * - Lead generation and conversion rates
   * 
   * @param updates - Campaign performance data including channel metrics, spend, and revenue
   */
  private updateCampaignMetrics(updates: {
    channels: {
      name: string;
      metrics: ChannelMetrics;
    }[];
    spend: number;
    revenue: number;
  }): void {
    // Update channel performance
    updates.channels.forEach(channel => {
      const channelMetrics = this.metrics.channel_performance[channel.name as MarketingChannel];
      if (channelMetrics) {
        channelMetrics.reach += channel.metrics.reach;
        channelMetrics.engagement = 
          (channelMetrics.engagement * 0.9) + (channel.metrics.engagement * 0.1);
        channelMetrics.conversions += channel.metrics.conversions;
      }
    });

    // Update campaign metrics
    this.metrics.campaign_metrics.total_spend += updates.spend;
    if (updates.revenue > 0) {
      this.metrics.campaign_metrics.roi = 
        ((updates.revenue - updates.spend) / updates.spend) * 100;
    }

    // Update audience engagement
    const totalReachIncrease = updates.channels.reduce(
      (sum, channel) => sum + channel.metrics.reach, 0
    );
    const totalEngagementRate = updates.channels.reduce(
      (sum, channel) => sum + channel.metrics.engagement, 0
    ) / updates.channels.length;

    this.metrics.audience_engagement.total_reach += totalReachIncrease;
    this.metrics.audience_engagement.engagement_rate = 
      (this.metrics.audience_engagement.engagement_rate * 0.9) + 
      (totalEngagementRate * 0.1);

    // Update conversion metrics
    const newConversions = updates.channels.reduce(
      (sum, channel) => sum + channel.metrics.conversions, 0
    );
    this.metrics.leads_generated += newConversions;
    if (this.metrics.audience_engagement.total_reach > 0) {
      this.metrics.conversion_rate = 
        (this.metrics.leads_generated / this.metrics.audience_engagement.total_reach) * 100;
    }

    // Emit updated metrics
    this.emitEvent('metrics_update', { metrics: this.metrics });
  }

  /**
   * Process regular marketing tasks such as content creation, 
   * social media posting, and campaign optimization
   * 
   * Tracks execution time for performance metrics
   */
  private async processTask(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Simulate various marketing activities
      const activities = this.simulateMarketingActivities();
      
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
   * Generate simulated marketing activity data
   * Models campaign creation, completion, and performance metrics
   * 
   * @returns Object containing campaign updates and performance metrics
   */
  private simulateMarketingActivities(): {
    success: boolean;
    campaignUpdates?: {
      active: number;
      completed: number;
      performance: {
        click_through_rate: number;
        bounce_rate: number;
      };
    };
  } {
    const success = Math.random() > 0.1; // 90% success rate
    
    if (success) {
      return {
        success: true,
        campaignUpdates: {
          active: Math.floor(Math.random() * 5),
          completed: Math.floor(Math.random() * 3),
          performance: {
            click_through_rate: Math.random() * 0.1, // 0-10%
            bounce_rate: 0.3 + (Math.random() * 0.4) // 30-70%
          }
        }
      };
    }
    
    return { success: false };
  }

  /**
   * Update agent metrics based on marketing activities
   * Tracks:
   * - Response time performance
   * - Success rate calculations
   * - Campaign status updates
   * - Click-through and bounce rate trends
   * 
   * @param startTime - Timestamp when task processing began
   * @param activities - Marketing activity data including campaign updates
   */
  private updateMetrics(startTime: number, activities: {
    campaignUpdates?: {
      active: number;
      completed: number;
      performance: {
        click_through_rate: number;
        bounce_rate: number;
      };
    };
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

    // Update campaign metrics
    if (activities.campaignUpdates) {
      // Update active and completed campaign counts
      this.metrics.campaign_metrics.active_campaigns = 
        activities.campaignUpdates.active;
      this.metrics.campaign_metrics.completed_campaigns += 
        activities.campaignUpdates.completed;

      // Update audience engagement metrics using weighted rolling average
      this.metrics.audience_engagement.click_through_rate = 
        (this.metrics.audience_engagement.click_through_rate * 0.9) + 
        (activities.campaignUpdates.performance.click_through_rate * 0.1);
      
      this.metrics.audience_engagement.bounce_rate = 
        (this.metrics.audience_engagement.bounce_rate * 0.9) + 
        (activities.campaignUpdates.performance.bounce_rate * 0.1);
    }

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
    console.error(`Marketing agent error: ${error.message}`);
    
    // If too many consecutive failures, set the agent to failed state
    if (this.metrics.consecutive_failures >= 5) {
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
      data: data
    };
    this.emit('event', event);
  }

  /**
   * Get the current agent metrics
   * @returns The current marketing metrics
   */
  public getMetrics(): MarketingMetrics {
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
   * @returns The marketing agent configuration
   */
  public getConfig(): MarketingAgentConfig {
    return this.config;
  }
} 