export type AgentStatus = 'active' | 'idle' | 'error';

// Marketing-specific types
export type MarketingChannel = 
  | 'email' 
  | 'social' 
  | 'search' 
  | 'display' 
  | 'content' 
  | 'events';

export type CampaignType = 'awareness' | 'conversion' | 'retention';

// Customer Success types
export type CustomerStage = 'onboarding' | 'active' | 'at_risk' | 'churned';
export type SupportPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface CustomerSuccessMetrics {
  active_customers: number;
  churn_rate: number;
  nps_score: number;
  customer_satisfaction: number;
  time_to_resolution: number;
  tickets_resolved: number;
  customer_health_scores: Record<CustomerStage, number>;
  support_tickets: {
    open: number;
    resolved: number;
    by_priority: Record<SupportPriority, number>;
  };
}

export interface CustomerSuccessConfig {
  supportChannels: string[];
  slaTimelines: Record<SupportPriority, number>;
  automatedResponses?: boolean;
  escalationRules?: {
    priority: SupportPriority;
    conditions: Record<string, any>;
  }[];
  healthScoreThresholds?: {
    at_risk: number;
    healthy: number;
  };
}

// Executive Support types
export type ReportType = 
  | 'financial' 
  | 'operational' 
  | 'strategic' 
  | 'compliance';

export type MetricCategory = 
  | 'revenue' 
  | 'costs' 
  | 'efficiency' 
  | 'satisfaction' 
  | 'sales' 
  | 'marketing' 
  | 'customer_success' 
  | 'operations';

export interface ExecutiveMetrics extends BaseMetrics {
  reports_generated: number;
  alerts_triggered: number;
  stakeholder_engagement: number;
  decision_accuracy: number;
  report_metrics: {
    [key in ReportType]: {
      completed: number;
      pending: number;
    };
  };
  metric_trends: {
    [key in MetricCategory]: number[];
  };
}

export interface ExecutiveConfig extends BaseConfig {
  reportTypes?: ReportType[];
  metricCategories?: MetricCategory[];
  stakeholderPreferences?: {
    reportFrequency: number;
    alertThresholds: {
      [key in MetricCategory]?: number;
    };
  };
}

// Operations types
export type ResourceType = 
  | 'cpu' 
  | 'memory' 
  | 'storage' 
  | 'network' 
  | 'compute' 
  | 'database';

export type OperationStatus = 'healthy' | 'degraded' | 'failed';

export interface ServiceHealth {
  api: OperationStatus;
  database: OperationStatus;
  cache: OperationStatus;
  queue: OperationStatus;
}

export interface OperationsMetrics extends BaseMetrics {
  system_uptime: number;
  incident_count: number;
  mttr: number;
  resource_utilization: Record<ResourceType, number>;
  compliance_score: number;
  service_health: ServiceHealth;
  resource_metrics: {
    [key in ResourceType]: number[];
  };
}

export interface OperationsConfig extends BaseConfig {
  monitoredServices?: string[];
  resourceThresholds?: {
    [key in ResourceType]?: {
      warning: number;
      critical: number;
    };
  };
  complianceRules?: {
    category: string;
    rules: {
      id: string;
      name: string;
      severity: 'low' | 'medium' | 'high';
    }[];
  }[];
}

export interface ChannelMetrics {
  reach: number;
  engagement: number;
  conversions: number;
}

export interface MarketingMetrics extends BaseMetrics {
  leads_generated: number;
  conversion_rate: number;
  campaign_metrics: {
    active_campaigns: number;
    completed_campaigns: number;
    total_spend: number;
    roi: number;
  };
  channel_performance: Record<MarketingChannel, ChannelMetrics>;
  audience_engagement: {
    total_reach: number;
    engagement_rate: number;
    click_through_rate: number;
    bounce_rate: number;
  };
}

export interface MarketingConfig {
  channels: MarketingChannel[];
  campaignType: CampaignType;
  targetAudience?: string[];
  budget?: number;
  goals?: {
    leads?: number;
    conversions?: number;
    engagement?: number;
  };
}

// Sales-specific types
export interface SalesMetrics {
  deals_closed: number;
  pipeline_value: number;
  avg_deal_size: number;
  win_rate: number;
  sales_cycle_length: number; // in days
  meetings_scheduled: number;
  qualified_leads: number;
}

export interface SalesConfig {
  territory?: string;
  quota?: number;
  product_lines?: string[];
  target_industries?: string[];
  deal_stages?: string[];
  lead_scoring_rules?: {
    min_score: number;
    criteria: Record<string, number>;
  };
}

// Base agent types that can be extended by specific agents
export interface BaseMetrics {
  status: AgentStatus;
  success_rate: number;
  avg_response_time: number;
  error_count: number;
  consecutive_failures: number;
}

export interface BaseConfig {
  id: string;
  name: string;
  retryAttempts?: number;
}

// Combined types for the specific agents
export interface MarketingAgentMetrics extends BaseMetrics, MarketingMetrics {}
export interface SalesAgentMetrics extends BaseMetrics, SalesMetrics {}
export interface CustomerSuccessAgentMetrics extends BaseMetrics, CustomerSuccessMetrics {}
export interface ExecutiveAgentMetrics extends BaseMetrics, ExecutiveMetrics {}
export interface OperationsAgentMetrics extends BaseMetrics, OperationsMetrics {}

export interface MarketingAgentConfig extends BaseConfig {
  channels: string[];
  campaignTypes: string[];
  targetAudience: {
    segments: string[];
    interests: string[];
  };
  goals: {
    leads?: number;
    conversions?: number;
    engagement?: number;
    reach?: number;
    followers?: number;
    cpa?: number;
    budget?: number;
  };
}

export interface SalesAgentConfig extends BaseConfig {
  territory: string;
  quota: number;
  productLines: string[];
  targetIndustries: string[];
  dealStages: string[];
  leadScoringRules: {
    budget: { min: number; weight: number; };
    timeline: { max: number; weight: number; };
    authority: { weight: number; };
    need: { weight: number; };
  };
}

export interface CustomerSuccessAgentConfig extends BaseConfig {
  healthScoreThresholds: {
    at_risk: number;
    healthy: number;
  };
  supportChannels?: string[];
  slaTimelines?: {
    first_response: number;
    resolution: number;
  };
}

export interface ExecutiveAgentConfig extends BaseConfig, ExecutiveConfig {}
export interface OperationsAgentConfig extends BaseConfig, OperationsConfig {}

export interface AgentCommand {
  type: 'start' | 'stop' | 'restart';
  agentId: string;
  config?: Partial<BaseConfig>;
}

export interface AgentEvent {
  type: 'status_change' | 'metrics_update' | 'error';
  agentId: string;
  data: {
    status?: AgentStatus;
    metrics?: BaseMetrics & Partial<
      | SalesMetrics 
      | MarketingMetrics 
      | CustomerSuccessMetrics 
      | ExecutiveMetrics 
      | OperationsMetrics
    >;
    error?: string;
  };
  timestamp: number;
} 