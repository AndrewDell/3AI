"""
Utility functions for 3AI
"""

import logging
from datetime import datetime

def setup_logging(level='INFO'):
    """Configure logging for the application"""
    logging.basicConfig(
        level=getattr(logging, level.upper()),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

def format_datetime(dt=None):
    """Format datetime for display"""
    if dt is None:
        dt = datetime.now()
    return dt.strftime('%Y-%m-%d %H:%M:%S')

def sanitize_input(text):
    """Sanitize user input"""
    if not text:
        return ''
    return str(text).strip() 