/**
 * Main JavaScript for 3AI Dashboard
 * 
 * Core functionality including:
 * 1. WebSocket connection for real-time updates
 * 2. Dashboard initialization and event handlers
 * 3. Chart rendering and updates
 * 4. Form handling and validation
 */

import { showToast, showModal, fadeIn, fadeOut } from './components.js';

// Configuration
const CONFIG = {
  wsEndpoint: 'ws://localhost:5000/agent-status',
  apiEndpoint: '/api',
  updateInterval: 5000,
  chartColors: {
    primary: '#2563eb',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444'
  }
};

/**
 * Initialize Dashboard Components
 * Sets up all necessary event listeners and initial data loading
 */
class DashboardManager {
  constructor() {
    this.socket = null;
    this.charts = new Map();
    this.activeAgents = new Set();
    
    // Bind methods
    this.initializeWebSocket = this.initializeWebSocket.bind(this);
    this.handleAgentUpdate = this.handleAgentUpdate.bind(this);
    this.updateCharts = this.updateCharts.bind(this);
  }

  /**
   * Initialize the dashboard
   */
  async init() {
    try {
      await this.initializeWebSocket();
      this.setupEventListeners();
      this.initializeCharts();
      this.loadInitialData();
    } catch (error) {
      console.error('Dashboard initialization failed:', error);
      showToast('Failed to initialize dashboard', 'error');
    }
  }

  /**
   * Set up WebSocket connection for real-time updates
   */
  async initializeWebSocket() {
    try {
      this.socket = new WebSocket(CONFIG.wsEndpoint);
      
      this.socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleAgentUpdate(data);
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        showToast('Live updates unavailable', 'warning');
      };

      this.socket.onclose = () => {
        setTimeout(() => this.initializeWebSocket(), 5000);
      };
    } catch (error) {
      console.error('WebSocket initialization failed:', error);
      throw error;
    }
  }

  /**
   * Handle incoming agent status updates
   */
  handleAgentUpdate(agents) {
    const statusContainer = document.getElementById('agent-status');
    if (!statusContainer) return;

    const agentElements = agents.map(agent => `
      <div class="agent-card ${agent.status.toLowerCase()}" data-agent-id="${agent.id}">
        <div class="flex items-center gap-2">
          <span class="status-indicator status-${agent.status.toLowerCase()}"></span>
          <strong>${agent.name}</strong>
        </div>
        <div class="text-sm text-muted">Last active: ${new Date(agent.lastActive).toLocaleString()}</div>
      </div>
    `).join('');

    fadeOut(statusContainer);
    statusContainer.innerHTML = agentElements;
    fadeIn(statusContainer);
    
    this.updateCharts(agents);
  }

  /**
   * Initialize Chart.js instances
   */
  initializeCharts() {
    const performanceCtx = document.getElementById('performanceChart')?.getContext('2d');
    if (performanceCtx) {
      this.charts.set('performance', new Chart(performanceCtx, {
        type: 'bar',
        data: {
          labels: [],
          datasets: [{
            label: 'Tasks Completed',
            backgroundColor: CONFIG.chartColors.primary,
            data: []
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      }));
    }
  }

  /**
   * Update chart data with new agent information
   */
  updateCharts(agents) {
    const performanceChart = this.charts.get('performance');
    if (!performanceChart) return;

    performanceChart.data.labels = agents.map(agent => agent.name);
    performanceChart.data.datasets[0].data = agents.map(agent => agent.tasksCompleted);
    performanceChart.update();
  }

  /**
   * Set up event listeners for interactive elements
   */
  setupEventListeners() {
    // Form submission handling
    document.querySelectorAll('form').forEach(form => {
      form.addEventListener('submit', this.handleFormSubmit.bind(this));
    });

    // Dark mode toggle
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
      darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
        showToast('Theme updated', 'success');
      });
    }
  }

  /**
   * Handle form submissions with validation
   */
  async handleFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    
    if (!this.validateForm(form)) {
      showToast('Please check form inputs', 'error');
      return;
    }

    try {
      const formData = new FormData(form);
      const response = await fetch(form.action, {
        method: form.method,
        body: formData
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      
      showToast('Form submitted successfully', 'success');
      form.reset();
    } catch (error) {
      console.error('Form submission error:', error);
      showToast('Failed to submit form', 'error');
    }
  }

  /**
   * Validate form inputs
   */
  validateForm(form) {
    let isValid = true;
    form.querySelectorAll('[required]').forEach(input => {
      if (!input.value.trim()) {
        input.classList.add('error');
        isValid = false;
      } else {
        input.classList.remove('error');
      }
    });
    return isValid;
  }

  /**
   * Load initial dashboard data
   */
  async loadInitialData() {
    try {
      const response = await fetch(`${CONFIG.apiEndpoint}/data`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      this.handleAgentUpdate(data.agents);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      showToast('Failed to load dashboard data', 'error');
    }
  }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const dashboard = new DashboardManager();
  dashboard.init().catch(error => {
    console.error('Dashboard initialization failed:', error);
  });
});
