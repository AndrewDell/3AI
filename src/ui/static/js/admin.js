/**
 * Admin Panel Management System
 * 
 * Provides functionality for:
 * - Real-time system monitoring
 * - User management
 * - Agent control
 * - System logs
 * - Performance metrics
 */

/**
 * Performance Optimizations and State Management
 */
const ADMIN_STATE = {
    agents: new Map(), // Using Map for O(1) lookups
    users: new Map(),
    metrics: {
        history: new Array(20).fill(null), // Pre-allocate array
        lastUpdate: 0
    },
    observers: new Set(), // For pub/sub pattern
    throttleTimers: new Map(),
    virtualLists: new Map()
};

// Throttle and debounce utilities
const THROTTLE_MS = 250;
const DEBOUNCE_MS = 150;

function throttle(fn, key) {
    return (...args) => {
        const now = Date.now();
        if (!ADMIN_STATE.throttleTimers.has(key) || 
            now - ADMIN_STATE.throttleTimers.get(key) >= THROTTLE_MS) {
            ADMIN_STATE.throttleTimers.set(key, now);
            fn(...args);
        }
    };
}

function debounce(fn, key) {
    return (...args) => {
        clearTimeout(ADMIN_STATE.throttleTimers.get(key));
        ADMIN_STATE.throttleTimers.set(key, setTimeout(() => {
            fn(...args);
            ADMIN_STATE.throttleTimers.delete(key);
        }, DEBOUNCE_MS));
    };
}

// Virtual list for handling large datasets
class VirtualList {
    constructor(container, itemHeight = 48) {
        this.container = container;
        this.itemHeight = itemHeight;
        this.items = [];
        this.visibleItems = new Set();
        this.observer = new IntersectionObserver(
            this.handleIntersection.bind(this),
            { rootMargin: '100px' }
        );
    }

    setItems(items) {
        this.items = items;
        this.render();
    }

    render() {
        const visibleCount = Math.ceil(this.container.clientHeight / this.itemHeight) + 2;
        const start = Math.max(0, Math.floor(this.container.scrollTop / this.itemHeight) - 1);
        const end = Math.min(this.items.length, start + visibleCount);

        // Only update DOM for items that changed
        const newVisibleItems = new Set(this.items.slice(start, end).map(item => item.id));
        
        // Remove items no longer visible
        for (const id of this.visibleItems) {
            if (!newVisibleItems.has(id)) {
                const el = this.container.querySelector(`[data-id="${id}"]`);
                el?.remove();
                this.visibleItems.delete(id);
            }
        }

        // Add new visible items
        const fragment = document.createDocumentFragment();
        for (let i = start; i < end; i++) {
            const item = this.items[i];
            if (!this.visibleItems.has(item.id)) {
                const el = this.renderItem(item);
                el.style.transform = `translateY(${i * this.itemHeight}px)`;
                fragment.appendChild(el);
                this.visibleItems.add(item.id);
            }
        }
        this.container.appendChild(fragment);
    }

    handleIntersection(entries) {
        if (entries.some(entry => entry.isIntersecting)) {
            requestAnimationFrame(() => this.render());
        }
    }
}

// Optimized data updates
function updateSystemMetrics(metrics) {
    const now = Date.now();
    if (now - ADMIN_STATE.metrics.lastUpdate < THROTTLE_MS) return;
    
    ADMIN_STATE.metrics.lastUpdate = now;
    ADMIN_STATE.metrics.history.shift();
    ADMIN_STATE.metrics.history.push(metrics);

    // Use requestAnimationFrame for DOM updates
    requestAnimationFrame(() => {
        updateMetricsUI(metrics);
        updateCharts(ADMIN_STATE.metrics.history);
    });
}

// Efficient agent updates
function updateAgentStatus(agentId, status) {
    const agent = ADMIN_STATE.agents.get(agentId);
    if (!agent || agent.status === status) return;

    agent.status = status;
    agent.lastUpdate = Date.now();

    // Batch DOM updates
    requestAnimationFrame(() => {
        const el = document.querySelector(`[data-agent-id="${agentId}"]`);
        if (el) {
            el.querySelector('.status').textContent = status;
            el.className = `agent-row status-${status}`;
        }
    });
}

// Optimized search and filter
const searchIndex = new Map(); // Simple search index

function buildSearchIndex(items, fields) {
    searchIndex.clear();
    for (const item of items) {
        const searchText = fields
            .map(field => item[field]?.toLowerCase())
            .filter(Boolean)
            .join(' ');
        searchIndex.set(item.id, searchText);
    }
}

const filterItems = throttle((searchTerm, items) => {
    searchTerm = searchTerm.toLowerCase();
    return items.filter(item => 
        searchIndex.get(item.id)?.includes(searchTerm)
    );
}, 'filterItems');

// Optimized event handlers
function setupOptimizedEventListeners() {
    // Use event delegation for better performance
    document.addEventListener('click', handleGlobalClick);
    
    // Throttle scroll and resize handlers
    window.addEventListener('scroll', throttle(handleScroll, 'scroll'), { passive: true });
    window.addEventListener('resize', throttle(handleResize, 'resize'), { passive: true });
    
    // Efficient form handling
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('input', debounce(handleFormInput, `form-${form.id}`));
        form.addEventListener('submit', handleFormSubmit);
    });
}

// Memory management
function cleanup() {
    // Clear timers
    ADMIN_STATE.throttleTimers.forEach(clearTimeout);
    ADMIN_STATE.throttleTimers.clear();

    // Clear observers
    ADMIN_STATE.observers.forEach(observer => observer.disconnect());
    ADMIN_STATE.observers.clear();

    // Clear virtual lists
    ADMIN_STATE.virtualLists.forEach(list => list.destroy());
    ADMIN_STATE.virtualLists.clear();

    // Clear data
    ADMIN_STATE.agents.clear();
    ADMIN_STATE.users.clear();
    searchIndex.clear();
}

// Configuration and state management
const ADMIN_CONFIG = {
    chartColors: {
        primary: '#2563eb',
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        grid: '#e2e8f0'
    },
    defaultChartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 1000,
            easing: 'easeInOutQuart'
        }
    }
};

/**
 * Initialize the admin panel
 */
export function initAdminPanel(config) {
    const { updateInterval = 5000, wsEndpoint } = config;
    
    // Initialize data structures
    setupDataStructures();

    // Setup optimized event handling
    setupOptimizedEventListeners();

    // Initialize WebSocket with reconnection logic
    const socket = initializeWebSocket(wsEndpoint);

    // Setup cleanup on page unload
    window.addEventListener('unload', cleanup);

    return {
        destroy: cleanup,
        socket,
        updateInterval
    };
}

/**
 * Initialize WebSocket connection for real-time updates
 */
function initializeWebSocket(endpoint) {
    const socket = io(endpoint);
    
    socket.on('connect', () => {
        console.log('Admin WebSocket connected');
        updateConnectionStatus('connected');
    });
    
    socket.on('disconnect', () => {
        console.log('Admin WebSocket disconnected');
        updateConnectionStatus('disconnected');
    });
    
    socket.on('system_metrics', handleSystemMetrics);
    socket.on('user_activity', handleUserActivity);
    socket.on('system_alert', handleSystemAlert);
    
    return socket;
}

/**
 * Initialize system monitoring charts
 */
function initializeSystemMonitoring() {
    const ctx = document.getElementById('systemMonitoring').getContext('2d');
    
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'CPU Usage',
                    borderColor: ADMIN_CONFIG.chartColors.primary,
                    data: []
                },
                {
                    label: 'Memory Usage',
                    borderColor: ADMIN_CONFIG.chartColors.success,
                    data: []
                },
                {
                    label: 'Network Load',
                    borderColor: ADMIN_CONFIG.chartColors.warning,
                    data: []
                }
            ]
        },
        options: {
            ...ADMIN_CONFIG.defaultChartOptions,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: ADMIN_CONFIG.chartColors.grid
                    }
                }
            }
        }
    });
    
    return chart;
}

/**
 * Handle incoming system metrics
 */
function handleSystemMetrics(metrics) {
    const chart = Chart.getChart('systemMonitoring');
    if (!chart) return;
    
    // Update chart data
    chart.data.labels.push(new Date().toLocaleTimeString());
    chart.data.datasets[0].data.push(metrics.cpu);
    chart.data.datasets[1].data.push(metrics.memory);
    chart.data.datasets[2].data.push(metrics.network);
    
    // Keep only last 20 data points
    if (chart.data.labels.length > 20) {
        chart.data.labels.shift();
        chart.data.datasets.forEach(dataset => dataset.data.shift());
    }
    
    chart.update();
    
    // Update system health indicators
    updateSystemHealth(metrics);
}

/**
 * Update system health indicators
 */
function updateSystemHealth(metrics) {
    document.querySelectorAll('[data-metric]').forEach(element => {
        const metric = element.dataset.metric;
        if (metrics[metric] !== undefined) {
            element.style.width = `${metrics[metric]}%`;
            element.textContent = `${metrics[metric]}%`;
        }
    });
}

/**
 * User Management Functions
 */
export async function openUserManagement() {
    try {
        const response = await fetch('/api/admin/users');
        const users = await response.json();
        
        showModal({
            title: 'User Management',
            content: generateUserManagementHTML(users),
            size: 'lg',
            onClose: () => {
                // Cleanup if needed
            }
        });
    } catch (error) {
        showToast('Failed to load user data', 'error');
    }
}

export async function editUser(userId) {
    try {
        const response = await fetch(`/api/admin/users/${userId}`);
        const user = await response.json();
        
        showModal({
            title: 'Edit User',
            content: generateUserEditForm(user),
            actions: [
                {
                    text: 'Save Changes',
                    class: 'btn-primary',
                    handler: () => saveUserChanges(userId)
                }
            ]
        });
    } catch (error) {
        showToast('Failed to load user data', 'error');
    }
}

export async function suspendUser(userId) {
    if (!confirm('Are you sure you want to suspend this user?')) return;
    
    try {
        const response = await fetch(`/api/admin/users/${userId}/suspend`, {
            method: 'POST'
        });
        
        if (response.ok) {
            showToast('User suspended successfully', 'success');
            refreshUserTable();
        } else {
            throw new Error('Failed to suspend user');
        }
    } catch (error) {
        showToast('Failed to suspend user', 'error');
    }
}

/**
 * Agent Control Functions
 */
export function openAgentControl() {
    showModal({
        title: 'Agent Control Panel',
        content: generateAgentControlHTML(),
        size: 'xl',
        onClose: () => {
            // Cleanup if needed
        }
    });
}

export async function toggleAgent(agentId, action) {
    try {
        const response = await fetch(`/api/admin/agents/${agentId}/${action}`, {
            method: 'POST'
        });
        
        if (response.ok) {
            showToast(`Agent ${action} successful`, 'success');
            refreshAgentStatus();
        } else {
            throw new Error(`Failed to ${action} agent`);
        }
    } catch (error) {
        showToast(`Failed to ${action} agent`, 'error');
    }
}

/**
 * System Logs Functions
 */
export function openSystemLogs() {
    const logViewer = new LogViewer({
        container: 'log-viewer',
        autoScroll: true,
        highlightErrors: true
    });
    
    showModal({
        title: 'System Logs',
        content: logViewer.getHTML(),
        size: 'xl',
        onClose: () => logViewer.destroy()
    });
}

/**
 * Maintenance Mode Toggle
 */
export async function toggleSystemMaintenance() {
    try {
        const response = await fetch('/api/admin/maintenance', {
            method: 'POST'
        });
        
        if (response.ok) {
            const { enabled } = await response.json();
            showToast(
                `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`,
                'success'
            );
            updateMaintenanceUI(enabled);
        }
    } catch (error) {
        showToast('Failed to toggle maintenance mode', 'error');
    }
}

/**
 * Helper Functions
 */
function showToast(message, type = 'info') {
    // Implementation depends on your toast notification system
    console.log(`Toast: ${message} (${type})`);
}

function showModal(options) {
    // Implementation depends on your modal system
    console.log('Show modal:', options);
}

function updateConnectionStatus(status) {
    const indicator = document.querySelector('.connection-status');
    if (indicator) {
        indicator.className = `connection-status status-${status}`;
        indicator.textContent = status;
    }
}

function startPeriodicUpdates(interval) {
    setInterval(() => {
        fetch('/api/admin/metrics')
            .then(response => response.json())
            .then(handleSystemMetrics)
            .catch(error => console.error('Failed to fetch metrics:', error));
    }, interval);
}

function setupEventListeners() {
    // Setup various event listeners for the admin panel
    document.addEventListener('keydown', handleKeyboardShortcuts);
    window.addEventListener('resize', handleResize);
}

/**
 * HTML Generators for UI Components
 */
function generateUserManagementHTML(users) {
    return `
        <div class="space-y-4">
            <!-- User Search and Filters -->
            <div class="flex gap-4 mb-6">
                <input 
                    type="search" 
                    class="form-input flex-1" 
                    placeholder="Search users..."
                    onkeyup="filterUserList(this.value)"
                >
                <select class="form-input w-48" onchange="filterUsersByRole(this.value)">
                    <option value="">All Roles</option>
                    <option value="admin">Administrators</option>
                    <option value="user">Standard Users</option>
                    <option value="agent">Agent Users</option>
                </select>
                <button class="btn btn-primary" onclick="createNewUser()">
                    Add User
                </button>
            </div>

            <!-- Users List -->
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead>
                        <tr>
                            <th class="text-left p-4">User</th>
                            <th class="text-left p-4">Role</th>
                            <th class="text-left p-4">Status</th>
                            <th class="text-left p-4">Last Active</th>
                            <th class="text-left p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(user => `
                            <tr class="border-t border-border">
                                <td class="p-4">
                                    <div class="flex items-center gap-3">
                                        <img src="${user.avatar}" class="w-8 h-8 rounded-full">
                                        <div>
                                            <div class="font-medium">${user.name}</div>
                                            <div class="text-sm text-muted">${user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td class="p-4">
                                    <span class="px-2 py-1 bg-primary/10 rounded-full text-sm">
                                        ${user.role}
                                    </span>
                                </td>
                                <td class="p-4">
                                    <span class="status-indicator status-${user.status}"></span>
                                    ${user.status}
                                </td>
                                <td class="p-4 text-sm">
                                    ${formatDateTime(user.lastActive)}
                                </td>
                                <td class="p-4">
                                    <div class="flex items-center gap-2">
                                        <button 
                                            class="btn btn-sm btn-outline"
                                            onclick="editUser('${user.id}')"
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            class="btn btn-sm btn-error"
                                            onclick="suspendUser('${user.id}')"
                                        >
                                            Suspend
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function generateUserEditForm(user) {
    return `
        <form id="user-edit-form" class="space-y-4">
            <input type="hidden" name="userId" value="${user.id}">
            
            <div class="form-group">
                <label class="form-label">Name</label>
                <input 
                    type="text" 
                    name="name" 
                    class="form-input"
                    value="${user.name}"
                    required
                >
            </div>

            <div class="form-group">
                <label class="form-label">Email</label>
                <input 
                    type="email" 
                    name="email" 
                    class="form-input"
                    value="${user.email}"
                    required
                >
            </div>

            <div class="form-group">
                <label class="form-label">Role</label>
                <select name="role" class="form-input">
                    <option value="user" ${user.role === 'user' ? 'selected' : ''}>
                        Standard User
                    </option>
                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>
                        Administrator
                    </option>
                    <option value="agent" ${user.role === 'agent' ? 'selected' : ''}>
                        Agent User
                    </option>
                </select>
            </div>

            <div class="form-group">
                <label class="form-label">Status</label>
                <select name="status" class="form-input">
                    <option value="active" ${user.status === 'active' ? 'selected' : ''}>
                        Active
                    </option>
                    <option value="suspended" ${user.status === 'suspended' ? 'selected' : ''}>
                        Suspended
                    </option>
                </select>
            </div>

            <div class="form-group">
                <label class="flex items-center gap-2">
                    <input 
                        type="checkbox" 
                        name="forcePasswordChange"
                        class="form-checkbox"
                    >
                    <span>Require password change on next login</span>
                </label>
            </div>
        </form>
    `;
}

function generateAgentControlHTML() {
    return `
        <div class="space-y-6">
            <!-- Agent Status Overview -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="card bg-success/10">
                    <div class="p-4">
                        <h3 class="font-medium">Active Agents</h3>
                        <p class="text-2xl font-bold text-success">12</p>
                    </div>
                </div>
                <div class="card bg-warning/10">
                    <div class="p-4">
                        <h3 class="font-medium">Pending Tasks</h3>
                        <p class="text-2xl font-bold text-warning">5</p>
                    </div>
                </div>
                <div class="card bg-error/10">
                    <div class="p-4">
                        <h3 class="font-medium">Failed Tasks</h3>
                        <p class="text-2xl font-bold text-error">2</p>
                    </div>
                </div>
            </div>

            <!-- Agent Control Panel -->
            <div class="card">
                <div class="card-header">
                    <h3 class="text-lg font-semibold">Agent Control</h3>
                </div>
                <div class="p-4">
                    <div class="space-y-4">
                        ${agents.map(agent => `
                            <div class="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <h4 class="font-medium">${agent.name}</h4>
                                    <p class="text-sm text-muted">Last Active: ${formatDateTime(agent.lastActive)}</p>
                                </div>
                                <div class="flex items-center gap-2">
                                    <button 
                                        class="btn btn-sm ${agent.status === 'running' ? 'btn-error' : 'btn-success'}"
                                        onclick="toggleAgent('${agent.id}', '${agent.status === 'running' ? 'stop' : 'start'}')"
                                    >
                                        ${agent.status === 'running' ? 'Stop' : 'Start'}
                                    </button>
                                    <button 
                                        class="btn btn-sm btn-outline"
                                        onclick="restartAgent('${agent.id}')"
                                    >
                                        Restart
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Utility Functions
 */
function formatDateTime(date) {
    return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(new Date(date));
}

function handleKeyboardShortcuts(event) {
    // Implement keyboard shortcuts (e.g., Ctrl+S for save)
    if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        saveChanges();
    }
}

function handleResize() {
    // Update chart dimensions on window resize
    const charts = Object.values(Chart.instances);
    charts.forEach(chart => chart.resize());
}

function filterUserList(searchTerm) {
    const rows = document.querySelectorAll('#user-table tbody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
    });
}

function filterUsersByRole(role) {
    const rows = document.querySelectorAll('#user-table tbody tr');
    rows.forEach(row => {
        if (!role || row.querySelector('[data-role]').dataset.role === role) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function updateMaintenanceUI(enabled) {
    const button = document.querySelector('#maintenance-toggle');
    if (button) {
        button.classList.toggle('active', enabled);
        button.textContent = enabled ? 'Disable Maintenance Mode' : 'Enable Maintenance Mode';
    }
}

// Export necessary functions
export {
    toggleSystemMaintenance,
    handleSystemMetrics,
    updateSystemHealth,
    generateUserManagementHTML,
    generateUserEditForm,
    generateAgentControlHTML,
    filterUserList,
    filterUsersByRole
}; 