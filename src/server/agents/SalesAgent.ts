import { EventEmitter } from 'events';
import { 
  AgentStatus, 
  SalesAgentMetrics, 
  SalesAgentConfig, 
  AgentEvent,
  BaseMetrics
} from '@/types/agents';

/**
 * Lead interface representing a potential customer in the sales pipeline
 */
interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company: string;
  title: string;
  industry: string;
  budget?: number;
  timeline?: number; // months
  needs: string[];
  source: string;
  firstContact: Date;
  lastContact?: Date;
  status: 'new' | 'contacted' | 'qualified' | 'unqualified';
  notes: string;
  score?: number;
}

/**
 * Deal interface representing a qualified opportunity in the sales pipeline
 */
interface Deal {
  id: string;
  leadId: string;
  productLine: string;
  value: number;
  probability: number;
  stage: string;
  createdAt: Date;
  updatedAt: Date;
  expectedCloseDate: Date;
  daysInPipeline: number;
  activities: Activity[];
  notes: string;
}

/**
 * Activity interface representing a sales-related interaction
 */
interface Activity {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'note' | 'task';
  leadId: string;
  dealId?: string;
  timestamp: Date;
  duration?: number; // minutes
  outcome?: string;
  notes?: string;
}

/**
 * Meeting details interface for calendar integration
 */
interface MeetingDetails {
  leadId: string;
  leadName: string;
  leadEmail: string;
  time: Date;
  duration: number; // minutes
  topic: string;
  notes?: string;
}

/**
 * Calendar configuration interface for external calendar services
 */
interface CalendarConfig {
  provider: 'google' | 'outlook' | 'apple';
  credentials: {
    clientId: string;
    clientSecret: string;
    refreshToken?: string;
  };
  calendarId?: string;
}

/**
 * Email provider configuration interface
 */
interface EmailConfig {
  provider: 'smtp' | 'sendgrid' | 'mailchimp';
  credentials: {
    apiKey?: string;
    username?: string;
    password?: string;
  };
  fromEmail: string;
  fromName: string;
}

/**
 * CRM provider configuration interface
 */
interface CRMConfig {
  provider: 'salesforce' | 'hubspot' | 'zoho' | 'custom';
  credentials: {
    apiKey?: string;
    instanceUrl?: string;
    username?: string;
    password?: string;
  };
}

/**
 * Extended SalesAgentConfig interface with integration options
 */
interface ExtendedSalesAgentConfig extends SalesAgentConfig {
  calendarIntegration?: CalendarConfig;
  emailIntegration?: EmailConfig;
  crmIntegration?: CRMConfig;
}

/**
 * SalesAgent class that automates sales processes including lead generation,
 * qualification, pipeline management, and reporting. Can operate in simulation
 * mode or with real integrations to CRM, email, and calendar systems.
 */
export class SalesAgent extends EventEmitter {
  private status: AgentStatus = 'idle';
  private metrics: SalesAgentMetrics;
  private config: ExtendedSalesAgentConfig;
  private taskInterval: NodeJS.Timeout | null = null;
  private pipelineInterval: NodeJS.Timeout | null = null;
  
  // Local storage for leads and deals (replace with CRM integration in production)
  private leads: Lead[] = [];
  private deals: Deal[] = [];

  /**
   * Creates a new SalesAgent instance
   * @param config - Configuration settings for the sales agent
   */
  constructor(config: SalesAgentConfig) {
    super();
    this.config = config as ExtendedSalesAgentConfig;
    this.metrics = {
      status: 'idle',
      success_rate: 100,
      avg_response_time: 0,
      error_count: 0,
      consecutive_failures: 0,
      deals_closed: 0,
      pipeline_value: 0,
      avg_deal_size: 0,
      win_rate: 0,
      sales_cycle_length: 0,
      meetings_scheduled: 0,
      qualified_leads: 0
    };
  }

  /**
   * Updates the agent's status and emits a status change event
   * @param newStatus - The new status to set
   */
  private setStatus(newStatus: AgentStatus): void {
    this.status = newStatus;
    this.metrics.status = newStatus;
    this.emitEvent('status_change', { status: newStatus });
  }

  /**
   * Restarts the agent by stopping and starting with a brief cooldown
   */
  public restart(): void {
    this.stop();
    setTimeout(() => this.start(), 1000); // Brief cooldown before restart
  }

  /**
   * Starts the agent's operation, initiating pipeline monitoring and task processing
   */
  public start(): void {
    if (this.status === 'active') return;

    this.setStatus('active');
    
    // Start pipeline monitoring
    this.pipelineInterval = setInterval(() => this.monitorPipeline(), 15000);

    // Start general task processing
    this.taskInterval = setInterval(() => this.processTask(), 5000);
  }

  /**
   * Stops the agent's operation, clearing all intervals
   */
  public stop(): void {
    if (this.status === 'idle') return;

    this.setStatus('idle');

    if (this.pipelineInterval) {
      clearInterval(this.pipelineInterval);
      this.pipelineInterval = null;
    }

    if (this.taskInterval) {
      clearInterval(this.taskInterval);
      this.taskInterval = null;
    }
  }

  /**
   * Monitors the sales pipeline for updates, analyzing deal progress
   * In a real implementation, this would connect to a CRM API
   */
  private async monitorPipeline(): Promise<void> {
    try {
      // In simulation mode, generate synthetic deal data
      if (!this.config.crmIntegration) {
        const deals = this.simulatePipelineUpdate();
        this.updatePipelineMetrics(deals);
        return;
      }
      
      // With real integration, fetch actual pipeline data from CRM
      const deals = await this.fetchPipelineFromCRM();
      this.updatePipelineMetrics(deals);
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * Generates simulated pipeline data for demonstration
   * @returns An array of simulated deals
   */
  private simulatePipelineUpdate() {
    // Simulate different deals in the pipeline
    const baseMultiplier = Math.random();
    const numDeals = Math.floor(baseMultiplier * 10);

    return Array.from({ length: numDeals }, () => ({
      value: Math.floor(Math.random() * 50000) + 10000,
      stage: Math.random() > 0.7 ? 'closed' : 'active',
      daysInPipeline: Math.floor(Math.random() * 90),
      probability: Math.random()
    }));
  }

  /**
   * Fetches real pipeline data from integrated CRM system
   * @returns Promise resolving to array of deals
   */
  private async fetchPipelineFromCRM(): Promise<Array<{ value: number; stage: string; daysInPipeline: number; probability: number }>> {
    // This would be replaced with actual API call to CRM system
    if (!this.config.crmIntegration) {
      return this.simulatePipelineUpdate();
    }

    try {
      // Example of how this would work with a real CRM integration
      // const crmClient = this.getCRMClient();
      // const rawDeals = await crmClient.fetchDeals({
      //   owner: this.config.id,
      //   territory: this.config.territory,
      //   updatedSince: new Date(Date.now() - 86400000) // last 24 hours
      // });
      
      // return rawDeals.map(deal => ({
      //   value: deal.amount,
      //   stage: deal.stage === 'Closed Won' ? 'closed' : 'active',
      //   daysInPipeline: this.calculateDaysInPipeline(deal.createdDate),
      //   probability: deal.probability / 100
      // }));

      // For now, simulate with random data
      return this.simulatePipelineUpdate();
    } catch (error) {
      console.error('Error fetching pipeline from CRM:', error);
      throw error;
    }
  }

  /**
   * Updates pipeline metrics based on current deal data
   * @param deals - Array of deals to analyze
   */
  private updatePipelineMetrics(deals: Array<{ value: number; stage: string; daysInPipeline: number; probability: number }>): void {
    const closedDeals = deals.filter(d => d.stage === 'closed');
    const activeDeals = deals.filter(d => d.stage === 'active');

    // Update pipeline metrics
    this.metrics.pipeline_value = activeDeals.reduce((sum, deal) => sum + (deal.value * deal.probability), 0);
    this.metrics.deals_closed += closedDeals.length;

    if (closedDeals.length > 0) {
      this.metrics.avg_deal_size = closedDeals.reduce((sum, deal) => sum + deal.value, 0) / closedDeals.length;
    }

    // Calculate win rate
    const totalDeals = this.metrics.deals_closed + activeDeals.length;
    this.metrics.win_rate = totalDeals > 0 ? (this.metrics.deals_closed / totalDeals) * 100 : 0;

    // Calculate average sales cycle length
    if (closedDeals.length > 0) {
      this.metrics.sales_cycle_length = closedDeals.reduce((sum, deal) => sum + deal.daysInPipeline, 0) / closedDeals.length || 0;
    }

    this.emitEvent('metrics_update', { metrics: this.metrics });
  }

  /**
   * Process sales tasks such as lead qualification, outreach, and follow-ups
   * Runs on a regular interval to move leads through the pipeline
   */
  private async processTask(): Promise<void> {
    const startTime = Date.now();

    try {
      // In simulation mode, generate synthetic activities
      if (!this.config.emailIntegration && !this.config.calendarIntegration) {
        const activities = this.simulateSalesActivities();
        if (activities.success) {
          this.metrics.consecutive_failures = 0;
          this.updateMetrics(startTime, {
            newMeetings: activities.newMeetings || 0,
            qualifiedLeads: activities.qualifiedLeads || 0
          });
        } else {
          throw new Error('Task processing failed');
        }
        return;
      }
      
      // With real integration, perform actual sales activities
      const results = await this.performRealSalesActivities();
      this.updateMetrics(startTime, {
        newMeetings: results.newMeetings,
        qualifiedLeads: results.qualifiedLeads
      });
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * Simulates sales activities for demonstration purposes
   * @returns Object containing success flag and activity metrics
   */
  private simulateSalesActivities(): {
    success: boolean;
    newMeetings?: number;
    qualifiedLeads?: number;
  } {
    const success = Math.random() > 0.1; // 90% success rate

    if (success) {
      return {
        success: true,
        newMeetings: Math.floor(Math.random() * 3),
        qualifiedLeads: Math.floor(Math.random() * 5)
      };
    }

    return { success: false };
  }

  /**
   * Performs real sales activities when integrations are configured
   * This includes qualifying leads, sending emails, and scheduling meetings
   * @returns Promise resolving to activity metrics
   */
  private async performRealSalesActivities(): Promise<{ newMeetings: number; qualifiedLeads: number }> {
    // Initialize counters
    let newMeetings = 0;
    let qualifiedLeads = 0;
    
    try {
      // 1. Fetch new leads that need processing
      const leadsToProcess = await this.fetchNewLeads();
      
      // 2. Score and qualify leads
      const qualifiedLeadsArray = this.qualifyLeads(leadsToProcess);
      qualifiedLeads = qualifiedLeadsArray.length;
      
      // 3. Conduct outreach to qualified leads
      const outreachResults = await Promise.all(
        qualifiedLeadsArray.map(lead => this.conductOutreach(lead))
      );
      
      // 4. Schedule meetings based on positive responses
      for (const lead of qualifiedLeadsArray) {
        if (await this.shouldScheduleMeeting(lead)) {
          const meetingScheduled = await this.scheduleMeetingWithLead(lead);
          if (meetingScheduled) newMeetings++;
        }
      }
      
      // 5. Follow up with existing deals
      await this.followUpWithExistingDeals();
      
      return { newMeetings, qualifiedLeads };
    } catch (error) {
      console.error('Error performing sales activities:', error);
      return { newMeetings, qualifiedLeads };
    }
  }

  /**
   * Fetches new leads from CRM or lead database
   * @returns Promise resolving to array of leads
   */
  private async fetchNewLeads(): Promise<Lead[]> {
    // This would connect to your CRM or lead database in production
    // For now, generate some sample leads
    return Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, i) => ({
      id: `lead-${Date.now()}-${i}`,
      firstName: `FirstName${i}`,
      lastName: `LastName${i}`,
      email: `lead${i}@example.com`,
      phone: `555-123-${1000 + i}`,
      company: `Company ${String.fromCharCode(65 + i)}`,
      title: 'Director',
      industry: this.config.targetIndustries[i % this.config.targetIndustries.length],
      budget: 50000 + (Math.random() * 50000),
      timeline: Math.floor(Math.random() * 6) + 1,
      needs: ['efficiency', 'automation'],
      source: 'website',
      firstContact: new Date(),
      status: 'new',
      notes: ''
    }));
  }

  /**
   * Qualifies leads based on lead scoring rules
   * @param leads - Array of leads to qualify
   * @returns Array of qualified leads
   */
  private qualifyLeads(leads: Lead[]): Lead[] {
    return leads.filter(lead => {
      const score = this.calculateLeadScore(lead);
      lead.score = score;
      
      // If lead meets minimum score threshold, mark as qualified
      if (score >= 50) { // Threshold could be configurable
        lead.status = 'qualified';
        return true;
      }
      
      lead.status = 'unqualified';
      return false;
    });
  }

  /**
   * Calculates a lead score based on configured scoring rules
   * @param lead - The lead to score
   * @returns Numerical score
   */
  private calculateLeadScore(lead: Lead): number {
    let score = 0;
    const rules = this.config.leadScoringRules;
    
    // Budget scoring
    if (lead.budget && lead.budget >= rules.budget.min) {
      score += rules.budget.weight;
    }
    
    // Timeline scoring (shorter timeline = higher score)
    if (lead.timeline !== undefined && lead.timeline <= rules.timeline.max) {
      score += rules.timeline.weight * (1 - (lead.timeline / rules.timeline.max));
    }
    
    // Authority scoring (based on job title)
    if (['CEO', 'CTO', 'CIO', 'Director', 'VP', 'Head'].some(t => 
      lead.title.includes(t))) {
      score += rules.authority.weight;
    }
    
    // Need scoring (based on alignment with product)
    if (lead.needs && lead.needs.length > 0) {
      score += rules.need.weight;
    }
    
    // Industry fit
    if (this.config.targetIndustries.includes(lead.industry)) {
      score += 10; // Bonus for target industry
    }
    
    return score;
  }

  /**
   * Conducts outreach to a qualified lead via email
   * @param lead - The lead to contact
   * @returns Promise resolving to success status
   */
  private async conductOutreach(lead: Lead): Promise<boolean> {
    try {
      // 1. Select appropriate template based on lead characteristics
      const template = this.selectOutreachTemplate(lead);
      
      // 2. Personalize the template for this specific lead
      const personalizedMessage = this.personalizeTemplate(template, lead);
      
      // 3. Send the email (if email integration is configured)
      if (this.config.emailIntegration) {
        // In real implementation, this would send via configured email provider
        // await this.sendEmail(lead.email, personalizedMessage);
        console.log(`Would send email to ${lead.email}`);
      }
      
      // 4. Record the outreach activity
      this.recordActivity({
        id: `activity-${Date.now()}`,
        type: 'email',
        leadId: lead.id,
        timestamp: new Date(),
        outcome: 'sent',
        notes: 'Initial outreach email sent'
      });
      
      // 5. Update lead status
      lead.status = 'contacted';
      lead.lastContact = new Date();
      
      return true;
    } catch (error) {
      console.error(`Error in outreach to lead ${lead.id}:`, error);
      return false;
    }
  }

  /**
   * Selects an appropriate outreach template based on lead characteristics
   * @param lead - The lead to analyze
   * @returns Email template ID or content
   */
  private selectOutreachTemplate(lead: Lead): string {
    // Logic to select the best template based on industry, needs, etc.
    if (this.config.targetIndustries.includes(lead.industry)) {
      return `template_${lead.industry.toLowerCase()}`;
    }
    
    // Default template
    return 'template_general';
  }

  /**
   * Personalizes an email template for a specific lead
   * @param templateId - The template to personalize
   * @param lead - The lead to personalize for
   * @returns Personalized message content
   */
  private personalizeTemplate(templateId: string, lead: Lead): string {
    // In production, this would fetch actual templates and use a template engine
    return `Dear ${lead.firstName},\n\nI noticed ${lead.company} is in the ${lead.industry} industry and might benefit from our ${this.config.productLines[0]} solution. Would you be open to a 15-minute call to discuss how we've helped similar companies?\n\nBest regards,\n${this.config.name}`;
  }

  /**
   * Determines if we should attempt to schedule a meeting with this lead
   * @param lead - The lead to evaluate
   * @returns Promise resolving to boolean decision
   */
  private async shouldScheduleMeeting(lead: Lead): Promise<boolean> {
    // Logic to determine if lead is ready for a meeting
    // Could be based on lead score, previous interactions, etc.
    return lead.score !== undefined && lead.score > 70;
  }

  /**
   * Schedules a meeting with a lead using calendar integration
   * @param lead - The lead to schedule with
   * @returns Promise resolving to success status
   */
  private async scheduleMeetingWithLead(lead: Lead): Promise<boolean> {
    try {
      if (!this.config.calendarIntegration) {
        // Simulate scheduling success in demo mode
        this.recordActivity({
          id: `activity-${Date.now()}`,
          type: 'meeting',
          leadId: lead.id,
          timestamp: new Date(Date.now() + 86400000), // Tomorrow
          duration: 30,
          outcome: 'scheduled',
          notes: 'Initial discovery call'
        });
        return true;
      }

      // In a real implementation with calendar integration:
      
      // 1. Find available time slots on calendar
      // const availableSlots = await this.getCalendarAvailability(
      //   new Date(),
      //   new Date(Date.now() + 7 * 86400000) // Next 7 days
      // );
      
      // 2. Propose time slots to the lead
      // const proposedTimes = availableSlots.slice(0, 3); // Offer 3 options
      // const selectedTime = await this.offerTimeSlotsToLead(lead, proposedTimes);
      
      // 3. Create calendar event
      // if (selectedTime) {
      //   await this.createCalendarEvent({
      //     leadId: lead.id,
      //     leadName: `${lead.firstName} ${lead.lastName}`,
      //     leadEmail: lead.email,
      //     time: selectedTime,
      //     duration: 30,
      //     topic: `Discuss ${this.determineRelevantProduct(lead)} for ${lead.company}`
      //   });
      //   return true;
      // }
      
      // For demo, pretend we scheduled successfully
      this.recordActivity({
        id: `activity-${Date.now()}`,
        type: 'meeting',
        leadId: lead.id,
        timestamp: new Date(Date.now() + 86400000), // Tomorrow
        duration: 30,
        outcome: 'scheduled',
        notes: 'Initial discovery call'
      });
      
      return true;
    } catch (error) {
      console.error(`Error scheduling meeting with lead ${lead.id}:`, error);
      return false;
    }
  }

  /**
   * Follows up with existing deals to progress them through the pipeline
   * @returns Promise resolving to number of deals updated
   */
  private async followUpWithExistingDeals(): Promise<number> {
    let updatedDeals = 0;
    
    // For each active deal, determine if it needs follow-up
    for (const deal of this.deals.filter(d => d.stage !== 'closed_won' && d.stage !== 'closed_lost')) {
      // Determine appropriate follow-up action based on deal stage
      if (deal.stage === 'discovery') {
        // Send proposal if discovery is complete
        if (deal.activities.some(a => a.type === 'meeting' && a.outcome === 'completed')) {
          await this.progressDealToProposal(deal);
          updatedDeals++;
        }
      } else if (deal.stage === 'proposal') {
        // Follow up on proposal if sent more than 3 days ago
        const proposalSent = deal.activities.find(a => a.notes?.includes('Proposal sent'));
        if (proposalSent && Date.now() - proposalSent.timestamp.getTime() > 3 * 86400000) {
          await this.followUpOnProposal(deal);
          updatedDeals++;
        }
      }
      // Add more stage-specific logic here
    }
    
    return updatedDeals;
  }

  /**
   * Progresses a deal to the proposal stage
   * @param deal - The deal to update
   * @returns Promise resolving to updated deal
   */
  private async progressDealToProposal(deal: Deal): Promise<Deal> {
    // In production, this would generate and send an actual proposal
    deal.stage = 'proposal';
    deal.updatedAt = new Date();
    deal.probability = 0.5; // 50% probability at proposal stage
    
    this.recordActivity({
      id: `activity-${Date.now()}`,
      type: 'email',
      leadId: deal.leadId,
      dealId: deal.id,
      timestamp: new Date(),
      outcome: 'sent',
      notes: 'Proposal sent'
    });
    
    return deal;
  }

  /**
   * Follows up on a sent proposal
   * @param deal - The deal to follow up on
   * @returns Promise resolving to success status
   */
  private async followUpOnProposal(deal: Deal): Promise<boolean> {
    // In production, this would send an actual follow-up email
    this.recordActivity({
      id: `activity-${Date.now()}`,
      type: 'email',
      leadId: deal.leadId,
      dealId: deal.id,
      timestamp: new Date(),
      outcome: 'sent',
      notes: 'Proposal follow-up'
    });
    
    return true;
  }

  /**
   * Records a sales activity in the system
   * @param activity - The activity to record
   */
  private recordActivity(activity: Activity): void {
    // In production, this would save to CRM or database
    // For demo, just add to local array or log
    console.log('Activity recorded:', activity);
    
    // Update the appropriate deal if this activity is related to a deal
    if (activity.dealId) {
      const deal = this.deals.find(d => d.id === activity.dealId);
      if (deal) {
        deal.activities.push(activity);
        deal.updatedAt = new Date();
      }
    }
  }

  /**
   * Creates a new deal from a qualified lead
   * @param lead - The lead to convert
   * @param productLine - The product line for this deal
   * @param value - The estimated deal value
   * @returns The newly created deal
   */
  private createDealFromLead(lead: Lead, productLine: string, value: number): Deal {
    const deal: Deal = {
      id: `deal-${Date.now()}`,
      leadId: lead.id,
      productLine,
      value,
      probability: 0.2, // Initial probability
      stage: 'discovery',
      createdAt: new Date(),
      updatedAt: new Date(),
      expectedCloseDate: new Date(Date.now() + (lead.timeline || 3) * 30 * 86400000), // Based on timeline
      daysInPipeline: 0,
      activities: [],
      notes: `Created from lead ${lead.id}`
    };
    
    // Add to local deals array
    this.deals.push(deal);
    
    return deal;
  }

  /**
   * Updates agent metrics based on recent activities
   * @param responseTime - Processing time in ms
   * @param activities - Count of different activity types
   */
  private updateMetrics(responseTime: number, activities: { newMeetings: number; qualifiedLeads: number }): void {
    // Update response time (exponential moving average)
    this.metrics.avg_response_time =
      (this.metrics.avg_response_time * 0.9) + ((Date.now() - responseTime) * 0.1);

    // Update success rate
    const totalTasks = this.metrics.error_count +
      (this.metrics.success_rate * 100);
    const successfulTasks = totalTasks - this.metrics.error_count;
    this.metrics.success_rate = (successfulTasks / (totalTasks + 1)) * 100;

    // Update sales-specific metrics
    this.metrics.meetings_scheduled += activities.newMeetings;
    this.metrics.qualified_leads += activities.qualifiedLeads;

    this.emitEvent('metrics_update', { metrics: this.metrics });
  }

  /**
   * Handles errors during agent operation
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
   * Emits an agent event to listeners
   * @param type - The type of event
   * @param data - Event data
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

  /**
   * Gets the current agent metrics
   * @returns Copy of the current metrics
   */
  public getMetrics(): SalesAgentMetrics {
    return { ...this.metrics };
  }

  /**
   * Gets the current agent status
   * @returns The agent status
   */
  public getStatus(): AgentStatus {
    return this.status;
  }

  /**
   * Gets the agent ID
   * @returns The agent ID
   */
  public getId(): string {
    return this.config.id;
  }

  /**
   * Gets the agent name
   * @returns The agent name
   */
  public getName(): string {
    return this.config.name;
  }

  /**
   * Gets the agent configuration
   * @returns Copy of the agent config
   */
  public getConfig(): SalesAgentConfig {
    return { ...this.config };
  }
} 