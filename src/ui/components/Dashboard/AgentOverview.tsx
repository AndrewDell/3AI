/**
 * @component AgentOverview
 * @description Provides a high-level view of all AI agents and their current status.
 * Implements real-time updates and interactive controls.
 * 
 * Features:
 * - Real-time agent status monitoring
 * - Performance metrics visualization
 * - Quick action controls for agent management
 * - Responsive grid layout
 */
import { useState, useEffect } from 'react'
import { useAgentStore } from '@/stores/agentStore'
import { AgentCard } from '../Cards/AgentCard'
import { PerformanceChart } from '../Charts/PerformanceChart'
import { QuickActions } from './QuickActions'

export const AgentOverview = () => {
  // Global state management for agents
  const { agents, fetchAgents } = useAgentStore()
  const [isLoading, setIsLoading] = useState(true)

  // Initial data fetch on component mount
  useEffect(() => {
    const loadAgents = async () => {
      try {
        await fetchAgents()
      } catch (error) {
        console.error('Failed to fetch agents:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadAgents()
  }, [fetchAgents])

  return (
    // Responsive grid layout with proper spacing
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <AgentCard 
        title="Active Agents"
        isLoading={isLoading}
        count={agents.length} 
      />
      <PerformanceChart />
      <QuickActions />
    </div>
  )
} 