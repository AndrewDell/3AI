# src/agents/hr_agent.py
"""
HRAgent focuses on automating and optimizing various human resource processes, 
such as recruitment, onboarding, engagement, performance management, and retention.

References:
- Agent Name: Human Resources (HR) Agent
- Objective: Streamline recruitment, onboarding, engagement surveys, training, 
             and retention strategies to improve employee experience.

Key Tasks:
1. Recruitment Automation
2. Onboarding Workflow
3. Employee Engagement & Feedback
4. Performance & Training Management
5. Retention & Exit Management

Synergies:
- Executive Support Agent: Summarize HR reports for leadership
- Operations Agent: Coordinate time-off approvals and resource availability
- Customer Success Agent: Correlate employee feedback with customer-facing interactions
- Finance & Admin Agent: Integrate payroll & expense processes for new hires/exits

External Tools:
- ATS: Greenhouse, BambooHR, Workable
- HRIS: ADP, Gusto, Zoho People
- Engagement: Officevibe, CultureAmp, Lattice
- L&D: LinkedIn Learning, Coursera
"""

from .base import BaseAgent

class HRAgent(BaseAgent):
    """
    Automates various HR processes like recruitment, onboarding, engagement surveys,
    training scheduling, and retention strategies.
    """

    def __init__(self, name: str):
        super().__init__(name)
        self.recruitment_rounds = 0
        self.employees_onboarded = 0

    def run(self, **kwargs) -> dict:
        """
        Execute a single HR operation cycle: handle recruitment or manage onboarding tasks.

        Args:
            **kwargs:
                - task (str): "recruitment", "onboarding", "engagement", or "retention"
                - details (dict): Extra data for the operation (e.g., job desc, candidate list).

        Returns:
            dict: A summary of the HR activities completed in this cycle.
        """
        self.log_startup()

        task = kwargs.get("task", "recruitment")
        details = kwargs.get("details", {})

        if task == "recruitment":
            self.recruitment_rounds += 1
            print(f"[{self.name}] Handling recruitment round #{self.recruitment_rounds} for role: {details.get('role', 'N/A')}")
        elif task == "onboarding":
            self.employees_onboarded += 1
            print(f"[{self.name}] Onboarding new employee: {details.get('employee_name', 'Unknown')}")
        elif task == "engagement":
            print(f"[{self.name}] Sending out engagement surveys or measuring employee sentiment.")
        elif task == "retention":
            print(f"[{self.name}] Analyzing retention strategies for potential flight risks.")
        else:
            print(f"[{self.name}] Unrecognized task: {task}")

        return {
            "agent": self.name,
            "task_performed": task,
            "recruitment_rounds": self.recruitment_rounds,
            "employees_onboarded": self.employees_onboarded,
            "status": "HR workflow executed successfully"
        }
