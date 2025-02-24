# src/agents/purchaser_agent.py
"""
PurchaserAgent manages procurement processes for raw materials or goods, 
monitoring vendor performance, optimizing costs, and ensuring uninterrupted supply.

References:
- Agent Name: Purchaser Agent
- Objective: Streamline procurement with data-driven decisions to save costs, 
             track inventory, and improve supplier relationships.

Key Tasks:
1. Inventory Monitoring & Forecasting
2. Vendor Sourcing & Comparison
3. Purchase Order (PO) Automation
4. Vendor Performance Monitoring
5. Cost Optimization

Synergies:
- Operations Agent: Sync delivery and production schedules to avoid bottlenecks.
- Finance & Admin Agent: Automate invoice payments, track procurement budgets.
- Executive Support Agent: Provide strategic procurement reports for leadership.
- Customer Success Agent: Ensure supply chain reliability influences end customer satisfaction.

External Tools:
- Inventory Management: SAP, NetSuite, Odoo
- Vendor Management: Coupa, Procurify
- Data Analysis: Tableau, Power BI, Google Sheets
"""

from .base import BaseAgent

class PurchaserAgent(BaseAgent):
    """
    Handles procurement tasks, including vendor evaluation, purchase order 
    creation, inventory checks, and cost optimization strategies.
    """

    def __init__(self, name: str):
        super().__init__(name)
        self.purchase_orders = 0

    def run(self, **kwargs) -> dict:
        """
        Perform procurement actions such as checking inventory, 
        sourcing vendors, and creating purchase orders.

        Args:
            **kwargs:
                - inventory_levels (dict): Current stock levels for materials or goods.
                - vendor_list (list): Potential or existing suppliers with cost and reliability data.
                - create_po (bool): Whether to generate new Purchase Orders this cycle.

        Returns:
            dict: Summary of procurement activities, including number of POs generated.
        """
        self.log_startup()

        inventory_levels = kwargs.get("inventory_levels", {})
        vendor_list = kwargs.get("vendor_list", [])
        create_po = kwargs.get("create_po", False)

        # Example logic: check if inventory is below threshold
        reorders = {}
        for item, qty in inventory_levels.items():
            if qty < 10:  # simplistic threshold
                reorders[item] = 10 - qty

        pos_created = 0
        if create_po and reorders:
            pos_created = len(reorders)
            self.purchase_orders += pos_created
            print(f"[{self.name}] Creating {pos_created} purchase orders for low-stock items: {reorders}")

        # Evaluate vendor perfor
