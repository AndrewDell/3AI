/**
 * @store AgentStore
 * @description Global state management for AI agents using Zustand.
 * Handles agent data fetching, state updates, and agent control actions.
 * 
 * Features:
 * - Type-safe state management
 * - Async action handling
 * - Error state management
 * - CSRF protection
 */
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// Type definitions for agent data
interface Agent {
  id: string
  status: 'active' | 'inactive' | 'error'
  lastAction?: string
  timestamp?: string
}

// Store interface definition
interface AgentStore {
  agents: Agent[]
  isLoading: boolean
  error: string | null
  fetchAgents: () => Promise<void>
  startAllAgents: () => Promise<void>
  stopAllAgents: () => Promise<void>
}

export const useAgentStore = create<AgentStore>()(
  devtools(
    (set) => ({
      // Initial state
      agents: [],
      isLoading: false,
      error: null,

      // Fetch all agents
      fetchAgents: async () => {
        set({ isLoading: true })
        try {
          const response = await fetch('/api/agents')
          if (!response.ok) throw new Error('Failed to fetch agents')
          const data = await response.json()
          set({ agents: data, error: null })
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Unknown error' })
        } finally {
          set({ isLoading: false })
        }
      },

      // Start all agents with CSRF protection
      startAllAgents: async () => {
        const token = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content
        const response = await fetch('/api/agents/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': token || '',
          }
        })
        if (!response.ok) throw new Error('Failed to start agents')
      },

      // Stop all agents with CSRF protection
      stopAllAgents: async () => {
        const token = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content
        const response = await fetch('/api/agents/stop', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': token || '',
          }
        })
        if (!response.ok) throw new Error('Failed to stop agents')
      }
    })
  )
) 