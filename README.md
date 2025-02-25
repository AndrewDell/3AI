# 3AI – Multi-Agent AI Automation
**Automate. Optimize. Scale.**

---

**Introduction / Overview**

**Project Description:**  
3AI is an innovative multi-agent AI automation system designed to streamline and enhance business processes. By leveraging Google's Gemini 2.0 for AI-powered orchestration and employing containerized Python environments, 3AI enables modular AI agents to work collaboratively, reducing manual tasks, improving productivity, and delivering real-time insights.

**Objectives:**
- Utilize Google's Gemini 2.0 to power AI and ML capabilities.
- Deploy containerized Python environments for consistent and reproducible setups.
- Enable flexible, modular AI agents that interact to automate complex workflows.

---

**Key Features**

- **Multi-Agent Orchestration:**  
  Seamlessly coordinate specialized AI agents that handle tasks such as sales, marketing, operations, and customer success, ensuring efficient process automation.

- **Integration with Google Gemini 2.0:**  
  Harness cutting-edge AI/ML capabilities for natural language understanding, predictive analytics, and dynamic task management.

- **Containerization:**  
  Use Docker to create isolated, reproducible environments that simplify deployment and scaling across different platforms.

- **Modular Architecture:**  
  A well-structured codebase that separates core functionality, individual agent logic, UI components, and configuration, making it easy to extend and maintain.

---
**File Structure**
3AI/
├── docs/                    
│   ├── project_overview.md    # Detailed description of your vision, roadmap, and design decisions.
│   ├── design/               # Architecture diagrams, UI mockups, and pitch deck resources.
│   └── pitch_deck.pdf        # Final pitch deck design document.
├── src/
│   ├── agents/               # Domain-specific agent modules implementing various business functions.
│   │   ├── __init__.py         # Initializes the agents package; can re-export key agent classes.
│   │   ├── auto_vehicle_broker_agent.py  # Agent for automating vehicle brokering tasks.
│   │   ├── base.py           # Defines the BaseAgent class that all agents inherit from.
│   │   ├── business_acquisition_manager_agent.py  # Agent for automating SaaS business acquisition.
│   │   ├── customer_success_agent.py  # Agent for automating customer onboarding and success processes.
│   │   ├── executive_support_agent.py  # Agent that supports executives with scheduling, reporting, etc.
│   │   ├── freight_dispatcher_agent.py  # Agent for optimizing freight dispatch and route planning.
│   │   ├── healthcare_compliance_agent.py  # Agent for monitoring and ensuring healthcare compliance.
│   │   ├── hr_agent.py       # Agent for automating HR tasks like recruitment, onboarding, and training.
│   │   ├── marketing_agent.py  # Agent for automating marketing activities and content creation.
│   │   ├── medical_coding_agent.py  # Agent for automating medical coding and billing processes.
│   │   ├── operations_agent.py  # Agent for managing operational workflows and project milestones.
│   │   ├── purchaser_agent.py  # Agent for streamlining procurement and vendor management.
│   │   ├── sales_agent.py    # Agent for automating sales processes including lead generation and pipeline management.
│   │   └── ... (add other agents as needed)
│   ├── core/                 # Core modules providing common functionality across the platform.
│   │   ├── agent_orchestration.py  # Central scheduler and task router for coordinating agents.
│   │   ├── gemini_integration.py     # Integration logic for interacting with Google Gemini 2.0 APIs.
│   │   └── ... 
│   ├── ui/                   # Web UI and dashboard files.
│   │   ├── dashboard.py      # Flask-based web server for rendering and managing dashboards.
│   │   ├── static/           # Static assets for the UI (CSS, JavaScript, images).
│   │   │   ├── css/
│   │   │   │   ├── layout.css        # Base layout styles ensuring overall page structure.
│   │   │   │   ├── components.css    # Styles for reusable UI components (buttons, forms, etc.).
│   │   │   │   ├── style.css         # Master stylesheet that imports modular CSS files.
│   │   │   │   └── utilities.css     # Utility classes and helper styles for common patterns.
│   │   │   └── js/
│   │   │       ├── main.js           # Main JavaScript file for global interactivity and AJAX calls.
│   │   │       └── components.js     # JavaScript for reusable UI components and micro-interactions.
│   │   └── templates/        # HTML templates for the UI.
│   │       ├── error404.html      # Custom 404 error page template.
│   │       ├── error500.html      # Custom 500 error page template.
│   │       ├── index.html         # Main landing page for the dashboard.
│   │       ├── reports.html       # Page for displaying detailed reports and analytics.
│   │       ├── settings.html      # Settings page for configuration and system preferences.
│   │       └── partials/          # Reusable UI components.
│   │           └── header.html    # Shared header component with navigation across UI pages.
│   ├── data/                 # Scripts and resources for data ingestion and preprocessing.
│   │   └── data_pipeline.py  # Module for fetching, cleaning, and storing data.
│   ├── config/               # Configuration files in YAML/JSON formats.
│   │   ├── settings.yaml     # Global configuration settings for API keys, agent behavior, logging, etc.
│   │   └── docker_config.yaml  # Docker-specific configuration settings.
│   └── utils/                # Utility scripts and helper functions.
│       ├── logging.py        # Custom logging setup for the 3AI platform.
│       ├── monitoring.py     # Custom monitoring setup for error notifications and performance metrics.
│       └── helpers.py        # General helper functions and utilities for the 3AI platform.
├── docker/                   # Docker files for containerization.
│   ├── Dockerfile            # Main Dockerfile for building the container image.
│   └── docker-compose.yml    # Docker Compose file for multi-container orchestration.
├── tests/                    # Automated tests for different modules.
│   ├── test_agents.py        # Unit tests for agent functionalities.
│   └── test_core.py          # Unit and integration tests for core modules.
├── scripts/                  # Deployment and automation scripts.
│   └── deploy.sh             # Shell script to automate testing, building, and deployment.
├── requirements.txt          # List of all Python dependencies.
├── README.md                 # Project overview and instructions.
└── .gitignore                # Git ignore rules for excluding unnecessary files.
---

**Installation & Setup**

**Prerequisites**
- **Python:** Version 3.10 (64-bit) or later (compatible with TensorFlow).
- **Docker:** For containerized deployment.
- **Git:** For version control and contribution management.

**Step-by-Step Setup Instructions**

**Clone the Repository:**
   ```bash
   git clone <repository-url>
   cd 3AI
   ```

**Set Up a Virtual Environment:**
   ```bash
    python -m venv venv
    source venv/bin/activate # On Windows: venv\Scripts\activate
   ```
**Install Dependencies:**
   ```bash
    pip install --upgrade pip
    pip install -r requirements.txt
   ```
**Set Up Dockers:**

For Linux/MacOS:
   ```bash
   # Navigate to docker directory
   cd docker
   
   # Build with BuildKit enabled (all in one line)
   DOCKER_BUILDKIT=1 docker-compose build --parallel
   
   # Start containers
   docker-compose up
   ```

For Windows PowerShell:
   ```powershell
   # Navigate to docker directory
   cd docker
   
   # Set BuildKit environment variable
   $env:DOCKER_BUILDKIT=1
   
   # Build containers
   docker-compose build --parallel
   
   # Start containers
   docker-compose up
   ```
**Usage**
   ```bash
    python src/core/agent_orchestration.py
    docker-compose up
    python src/ui/dashboard.py
    pytest tests/
   ```

**Configuration Files**

- **General Settings:**  
  The `src/config/settings.yaml` file is where you adjust system parameters that control various aspects of the application. You can configure:
  - **API Keys:** Insert keys for external services (e.g., Google Gemini 2.0).
  - **Agent Behavior:** Set defaults for how agents interact, such as task scheduling intervals and retry attempts.
  - **Logging Levels:** Define the verbosity of logging (e.g., DEBUG, INFO, WARNING, ERROR) to suit your development or production needs.

  **Example (`src/config/settings.yaml`):**
  ```yaml
  api:
    google_gemini_key: "AIzaSyDYTt1JxARqo1OP3i6Vj1VB64ulU_FRq-E"

  agent:
    default_timeout: 30  # Timeout in seconds for agent tasks
    retry_attempts: 3    # Number of times to retry failed tasks

  logging:
    level: INFO        # Options: DEBUG, INFO, WARNING, ERROR
    file: logs/3ai.log  # Log file path

**Contributing**

**How to Contribute**
- **Fork the Repository:**  
  Click the "Fork" button on the repository's GitHub page to create your own copy of the project.

- **Clone Your Fork Locally:**  
  Once you have forked the repository, clone it to your local machine:
  ```bash
  git clone https://github.com/<your-username>/3AI.git
  cd 3AI
  ```

- **Create a New Branch:**  
  Before making any changes, create a new branch for your work:
  ```bash
  git checkout -b feature/your-feature-name
  ```

- **Make Your Changes:**  
  Develop your feature or fix the bug while following the project's coding standards. Write clear, descriptive commit messages that explain your changes.
  Commit Your Changes.
  ```bash
  git add .
  git commit -m "Add [feature/bug fix]: Detailed description of your changes"
  ```

- **Push Your Changes:**  
  Push your changes to your fork on GitHub:
  ```bash
  git push origin feature/your-feature-name
  ```

- **Create a Pull Request:**  
  Go to your fork on GitHub and click the "Pull Request" button to create a request to merge your changes into the main repository.

- **Coding Standards**
  Ensure your code adheres to the project's style guidelines by using tools like Black, flake8, and pylint:
  ```bash
  black --check .
  flake8 .
  pylint src/
  ```

- **Testing** 
  Run automated tests to ensure your changes don't break existing functionality:
  ```bash
  pytest tests/
  ```

- **Documentation**
  Update the README.md file with your changes and add any new documentation:
  ```bash
  git add README.md
  git commit -m "Update README.md"
  git push origin main
  ```   

- **Issue Reporting**
  If you encounter a bug, please check the GitHub Issues page to see if it has already been reported. If not, create a new issue with:
  - A clear and descriptive title
  - A detailed description of the problem
  - Steps to reproduce the issue
  - Expected behavior
  - Actual behavior
  - Screenshots or error messages

- **Feature Requests**
  If you have a suggestion for a new feature, please check the GitHub Issues page to see if it has already been requested. If not, create a new issue with:
  - A clear and descriptive title
  - A detailed description of the feature
  - Steps to reproduce the issue
  - Expected behavior
  - Actual behavior
  - Screenshots or documentation references

- **Code Reviews**
  If you are a maintainer, you can review pull requests by:
  - Checking the code for any issues
  - Providing feedback on the code  

- **License**
  This project is licensed under the MIT License. See the LICENSE file for details.

- **Contributors**
  - Andrew D.

- **Acknowledgements**
  - Google Gemini 2.0
  - Docker
  - pytest
  - flake8
  - pylint
  - black

# Navigate to the docker directory first
cd C:\Users\Andrew\3AI\docker

# Then set BuildKit and run the build
$env:DOCKER_BUILDKIT=1
docker-compose build --parallel

## Agent System Architecture

### Core Components

3AI is structured as a coordinated multi-agent system with:

1. **Agent Orchestrator** - Central controller (`src/core/agent_orchestration.py`)
   - Manages agent lifecycles (registration, scheduling, monitoring)
   - Routes tasks between agents using priority queues
   - Implements circuit breaker pattern for fault tolerance
   - Maintains health metrics for all agents

2. **Base Agent** - Abstract foundation (`src/core/agent_orchestration.py:BaseAgent`)
   - Defines common interface for all domain-specific agents
   - Manages agent state (idle, running, failed, recovering, stopped)
   - Provides health check mechanism and logging capabilities
   - Standardizes metrics tracking and error handling

3. **Socket.IO Server** - Real-time communication layer (`src/server/socketServer.ts`)
   - Provides bidirectional event-based communication
   - Enables dashboard to receive agent updates in real-time
   - Manages connections with automatic reconnection support
   - Runs independently from the Next.js application

4. **Agent Manager** - Registry for specialized agents (`src/server/agents/AgentManager.ts`)
   - Creates and configures domain-specific agents
   - Maintains registry of available agents
   - Routes events between agents and external systems
   - Controls agent lifecycle (start, stop, restart)

### Agent Implementations

Each specialized agent inherits from the base agent class and adds domain-specific functionality:

#### Sales Agent (`src/server/agents/SalesAgent.ts`)

**Purpose**: Automates sales processes including lead generation, qualification, pipeline management, and reporting.

**Key Functions**:
- `start()` / `stop()` - Manage monitoring processes for pipeline and tasks
- `monitorPipeline()` - Analyzes deal progress and calculates key metrics
- `processTask()` - Handles regular sales activities like lead qualification
- `simulatePipelineUpdate()` - Generates synthetic deal data for development
- `updatePipelineMetrics()` - Calculates metrics like pipeline value and win rate
- `updateMetrics()` - Tracks qualified leads and meetings scheduled
- `fetchNewLeads()` - Retrieves leads from external systems or simulates lead data
- `qualifyLeads()` - Scores and filters leads based on qualification criteria
- `conductOutreach()` - Manages personalized communication with leads
- `scheduleMeetingWithLead()` - Coordinates calendar availability
- `createDealFromLead()` - Converts qualified leads into deals
- `progressDealToProposal()` - Advances deals through stages
- `followUpOnProposal()` - Manages deal progression activities
- `sendEmail()` - Handles email communications with template personalization

#### Marketing Agent (`src/server/agents/MarketingAgent.ts`)

**Purpose**: Automates marketing activities including campaign management, content creation, and audience engagement tracking.

**Key Functions**:
- `start()` / `stop()` - Manage intervals for campaign monitoring and tasks
- `monitorCampaigns()` - Tracks performance metrics across channels
- `simulateCampaignActivity()` - Generates channel performance data
- `updateCampaignMetrics()` - Calculates ROI, reach, and conversion metrics
- `processTask()` - Handles content creation and marketing optimization
- `simulateMarketingActivities()` - Models campaign creation and completion
- `updateMetrics()` - Tracks success rates and audience engagement
- `handleError()` - Manages failure scenarios and error recovery

#### Customer Success Agent (`src/server/agents/CustomerSuccessAgent.ts`)

**Purpose**: Manages customer relationships, monitors customer health, and handles support tickets.

**Key Functions**:
- `start()` / `stop()` - Manage intervals for ticket and customer monitoring
- `processTickets()` - Simulates ticket creation and resolution
- `simulateTicketActivity()` - Generates ticket data across priority levels
- `updateTicketMetrics()` - Tracks resolution times and satisfaction impact
- `processTask()` - Handles customer health monitoring
- `simulateCustomerActivities()` - Models customer feedback and stage transitions
- `updateMetrics()` - Updates NPS and satisfaction scores
- `updateHealthScores()` - Calculates customer health across lifecycle stages

#### Executive Agent (`src/server/agents/ExecutiveAgent.ts`)

**Purpose**: Monitors business metrics, generates reports, and manages stakeholder communications.

**Key Functions**:
- `start()` / `stop()` - Manage intervals for alerts and report generation
- `processAlerts()` - Monitors metric deviations and stakeholder alerts
- `simulateAlertActivity()` - Models alerts across business categories
- `updateAlertMetrics()` - Tracks which business areas need attention
- `processTask()` - Generates reports and executive analysis
- `simulateExecutiveActivities()` - Models report generation and accuracy
- `updateMetrics()` - Tracks decision accuracy and report completions

#### Operations Agent (`src/server/agents/OperationsAgent.ts`)

**Purpose**: Manages operational workflows, project milestones, and resource allocation.

**Key Functions**:
- `start()` / `stop()` - Manage intervals for project and resource monitoring
- `monitorProjects()` - Tracks project status and identifies blockers
- `simulateProjectActivity()` - Generates project progress and resource data
- `updateProjectMetrics()` - Calculates efficiency and completion rates
- `processTask()` - Handles resource allocation and scheduling
- `simulateOperationsActivities()` - Models operational tasks and outcomes
- `updateMetrics()` - Tracks productivity and resource utilization

### Cross-Agent Communication

Agents communicate through:

1. **Event-Based Model**: Using EventEmitter to publish/subscribe to events
2. **Metric Sharing**: Agents share metrics for cross-domain decision making
3. **Task Queues**: The orchestrator routes tasks between agents
4. **Socket.IO Events**: Real-time updates for frontend visualization

### Integrations

The system supports integration with external services:

1. **Email Integration**: For automated outreach and notifications
   - Gmail/SMTP support via nodemailer
   - Template selection and personalization
   - Activity tracking for analytics

2. **Calendar Integration**: For scheduling and time management
   - Google Calendar/Outlook support
   - Availability checking
   - Meeting creation and management

3. **CRM Integration**: For customer and deal management
   - Support for Salesforce, HubSpot, etc.
   - Bidirectional data synchronization
   - Activity recording for audit trails

## Troubleshooting

### Docker Issues

#### Windows PowerShell Syntax Error
```
$env:DOCKER_BUILDKIT=1 docker-compose build --parallel
```

**Problem**: This is not valid PowerShell syntax. Environment variables must be set separately.

**Solution**: Use two separate commands:
```powershell
$env:DOCKER_BUILDKIT=1
docker-compose build --parallel
```

#### Container Already Running
If you get errors about containers or ports already in use:

```powershell
# List running containers
docker ps

# Stop all containers
docker stop $(docker ps -q)

# Or stop specific container
docker stop container_name
```

#### Docker Compose Networking Issues
If containers can't communicate with each other:

1. Check the `docker-compose.yml` network configuration
2. Ensure containers are on the same network
3. Use container names, not localhost, for inter-container communication

### Agent Orchestration Issues

If agents fail to start or communicate:

1. Check log files in the `logs/` directory
2. Verify correct event names in emitters and listeners
3. Ensure all required configuration is provided
4. Check for port conflicts in Socket.IO servers
