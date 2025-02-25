import { EventEmitter } from 'events';
import { 
  AgentStatus, 
  MarketingMetrics, 
  MarketingAgentConfig, 
  AgentEvent,
  MarketingChannel,
  ChannelMetrics
} from '@/types/agents';

export class MarketingAgent extends EventEmitter {
  private status: AgentStatus = 'idle';
  private metrics: MarketingMetrics;
  private config: MarketingAgentConfig;
  private taskInterval: NodeJS.Timeout | null = null;
  private campaignInterval: NodeJS.Timeout | null = null;

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

  private setStatus(newStatus: AgentStatus): void {
    this.status = newStatus;
    this.metrics.status = newStatus;
    this.emitEvent('status_change', { status: newStatus });
  }

  public restart(): void {
    this.stop();
    setTimeout(() => this.start(), 1000);
  }

  public start(): void {
    if (this.status === 'active') return;

    this.setStatus('active');
    
    // Start campaign monitoring
    this.campaignInterval = setInterval(() => this.monitorCampaigns(), 10000);

    // Start general marketing activities
    this.taskInterval = setInterval(() => this.processTask(), 15000);
  }

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

  private async monitorCampaigns(): Promise<void> {
    try {
      const campaignUpdates = this.simulateCampaignActivity();
      this.updateCampaignMetrics(campaignUpdates);
    } catch (error) {
      this.handleError(error as Error);
    }
  }

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

    this.emitEvent('metrics_update', { metrics: this.metrics });
  }

  private async processTask(): Promise<void> {
    const startTime = Date.now();
    
    try {
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
    // Update response time
    const responseTime = Date.now() - startTime;
    this.metrics.avg_response_time = 
      (this.metrics.avg_response_time * 0.9) + (responseTime * 0.1);
    
    // Update success rate
    const totalTasks = this.metrics.error_count + 
      (this.metrics.success_rate * 100);
    const successfulTasks = totalTasks - this.metrics.error_count;
    this.metrics.success_rate = (successfulTasks / (totalTasks + 1)) * 100;

    // Update campaign metrics
    if (activities.campaignUpdates) {
      this.metrics.campaign_metrics.active_campaigns = 
        activities.campaignUpdates.active;
      this.metrics.campaign_metrics.completed_campaigns += 
        activities.campaignUpdates.completed;

      // Update audience engagement metrics
      this.metrics.audience_engagement.click_through_rate = 
        (this.metrics.audience_engagement.click_through_rate * 0.9) + 
        (activities.campaignUpdates.performance.click_through_rate * 0.1);
      
      this.metrics.audience_engagement.bounce_rate = 
        (this.metrics.audience_engagement.bounce_rate * 0.9) + 
        (activities.campaignUpdates.performance.bounce_rate * 0.1);
    }

    this.emitEvent('metrics_update', { metrics: this.metrics });
  }

  private handleError(error: Error): void {
    this.metrics.error_count++;
    this.metrics.consecutive_failures++;

    if (this.metrics.consecutive_failures >= (this.config.retryAttempts || 3)) {
      this.setStatus('error');
    }

    this.emitEvent('error', { error: error.message });
  }

  private emitEvent(type: AgentEvent['type'], data: Partial<AgentEvent['data']>): void {
    const event: AgentEvent = {
      type,
      agentId: this.config.id,
      data,
      timestamp: Date.now()
    };
    this.emit('agent_event', event);
  }

  public getMetrics(): MarketingMetrics {
    return { ...this.metrics };
  }

  public getStatus(): AgentStatus {
    return this.status;
  }

  public getId(): string {
    return this.config.id;
  }

  public getName(): string {
    return this.config.name;
  }

  public getConfig(): MarketingAgentConfig {
    return { ...this.config };
  }
} 