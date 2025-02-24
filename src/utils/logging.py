# src/utils/logging.py
"""
Custom logging setup for the 3AI platform.

Best Practices Implemented:
1. Configurable Log Level via Environment Variable
2. Structured Format with Timestamps
3. Optional File Handler for Persistence
4. Consistent Logger Import Throughout the Codebase
"""

import logging
import os
from logging.handlers import RotatingFileHandler

def setup_logging(logger_name: str = "3AI") -> logging.Logger:
    """
    Configure and return a logger object with a rotating file handler and console handler.

    Args:
        logger_name (str): The name of the logger (usually the application or module name).

    Returns:
        logging.Logger: A configured logger instance ready for use.
    """
    # Read log level from environment; default to INFO
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()

    # Create a logger instance
    logger = logging.getLogger(logger_name)
    logger.setLevel(log_level)

    # Prevent logging from propagating to the root logger (optional)
    logger.propagate = False

    # Create a console handler for stdout
    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    console_format = logging.Formatter(
        "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    console_handler.setFormatter(console_format)

    # (Optional) Create a rotating file handler to limit file size
    file_handler = RotatingFileHandler(
        "3ai.log",
        maxBytes=5_000_000,  # 5 MB
        backupCount=5        # Keep up to 5 old log files
    )
    file_handler.setLevel(log_level)
    file_format = logging.Formatter(
        "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    file_handler.setFormatter(file_format)

    # Add handlers to the logger
    # Check if handlers already exist to avoid duplication
    if not logger.handlers:
        logger.addHandler(console_handler)
        logger.addHandler(file_handler)

    logger.debug("Logger initialized with level: %s", log_level)
    return logger
