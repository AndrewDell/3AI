/**
 * @component QuickActions
 * @description Provides quick access to common agent management actions.
 * Implements loading states, error handling, and accessibility features.
 * 
 * Features:
 * - Start/Stop all agents functionality
 * - Loading state management
 * - Error handling with toast notifications
 * - Fully accessible controls
 */
import { useState } from 'react'
import { useAgentStore } from '@/stores/agentStore'
import { Button } from '../ui/button'
import { toast } from '../ui/toast'

export const QuickActions = () => {
  // Local loading state management
  const [isProcessing, setIsProcessing] = useState(false)
  const { startAllAgents, stopAllAgents } = useAgentStore()

  // Unified handler for start/stop actions
  const handleAgentAction = async (action: 'start' | 'stop') => {
    setIsProcessing(true)
    try {
      // Execute the appropriate action based on parameter
      await (action === 'start' ? startAllAgents() : stopAllAgents())
      toast.success(`Successfully ${action}ed all agents`)
    } catch (error) {
      toast.error(`Failed to ${action} agents: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <section className="card" aria-labelledby="quick-actions-title">
      <div className="p-4">
        <h2 id="quick-actions-title" className="text-lg font-semibold mb-4">
          Quick Actions
        </h2>
        <div className="space-y-3">
          {/* Start All Agents button */}
          <Button
            variant="primary"
            className="w-full"
            onClick={() => handleAgentAction('start')}
            disabled={isProcessing}
            aria-label="Start all agents"
          >
            Start All Agents
          </Button>
          
          {/* Stop All Agents button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleAgentAction('stop')}
            disabled={isProcessing}
            aria-label="Stop all agents"
          >
            Stop All Agents
          </Button>
        </div>
      </div>
    </section>
  )
} 