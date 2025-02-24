# src/utils/helpers.py
"""
General helper functions and utilities for the 3AI platform.

Best Practices Implemented:
1. Clear, Self-Documented Functions
2. Minimal Global State
3. Robust Error Handling and Input Validation
4. Reusable Patterns for Common Tasks
"""

import json
import re
from typing import Any, Dict

def load_json_file(filepath: str) -> Dict[str, Any]:
    """
    Load a JSON file into a Python dictionary.

    Args:
        filepath (str): The path to the JSON file.

    Returns:
        Dict[str, Any]: A dictionary representing the JSON data.

    Raises:
        FileNotFoundError: If the file does not exist.
        json.JSONDecodeError: If the file contains invalid JSON.
    """
    with open(filepath, "r", encoding="utf-8") as json_file:
        data = json.load(json_file)
    return data

def sanitize_text(text: str) -> str:
    """
    A simple text sanitization method to remove unwanted characters or scripts.

    Args:
        text (str): The original text to sanitize.

    Returns:
        str: The sanitized string.

    Example:
        >>> sanitize_text("<script>alert('XSS');</script>")
        ''  # script is removed
    """
    # Remove script tags or other undesired patterns
    sanitized = re.sub(r"<script.*?>.*?</script>", "", text, flags=re.IGNORECASE)
    # Additional transformations as needed
    return sanitized.strip()

def safe_divide(a: float, b: float) -> float:
    """
    Perform a division, returning 0.0 if 'b' is zero to avoid exceptions.

    Args:
        a (float): Numerator.
        b (float): Denominator.

    Returns:
        float: The result of a/b, or 0.0 if b == 0.
    """
    if b == 0:
        return 0.0
    return a / b

def chunk_list(data_list: list, chunk_size: int) -> list:
    """
    Break a list into smaller lists of a specified size.

    Args:
        data_list (list): The original list to chunk.
        chunk_size (int): The desired number of elements in each sub-list.

    Returns:
        list: A list of smaller sub-lists.

    Example:
        >>> chunk_list([1,2,3,4,5], 2)
        [[1, 2], [3, 4], [5]]
    """
    if chunk_size <= 0:
        raise ValueError("Chunk size must be a positive integer.")
    return [data_list[i : i + chunk_size] for i in range(0, len(data_list), chunk_size)]
