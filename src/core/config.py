"""
Configuration management for 3AI
"""

import os
import yaml

def load_config(config_path=None):
    """Load configuration from YAML file or environment variables"""
    if config_path and os.path.exists(config_path):
        with open(config_path, 'r') as f:
            return yaml.safe_load(f)
    
    # Default configuration
    return {
        'flask': {
            'host': os.getenv('FLASK_HOST', '0.0.0.0'),
            'port': int(os.getenv('FLASK_PORT', 5000)),
            'debug': os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
        },
        'logging': {
            'level': os.getenv('LOG_LEVEL', 'INFO')
        }
    } 