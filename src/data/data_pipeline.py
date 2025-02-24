# src/data/data_pipeline.py

#data_pipeline.py

#This script implements data ingestion and preprocessing for the 3AI platform.
#It demonstrates how to pull data from an external source, perform basic cleaning,
#and store the processed data for further use by the agents.

#Best Practices Implemented:
#- Modular design with functions for each processing step.
#- Robust error handling with logging.
#- Environment-based configuration for dynamic settings.
#- Comments and docstrings for maintainability.


import os
import csv
import logging
import requests
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("DataPipeline")

# Configuration (could also be loaded from a YAML file)
DATA_SOURCE_URL = os.getenv("DATA_SOURCE_URL", "https://api.example.com/data")
OUTPUT_CSV = os.getenv("OUTPUT_CSV", "data/processed_data.csv")

def fetch_data(url: str) -> list:
    """
    Fetch data from the specified URL.
    
    Args:
        url (str): The API endpoint URL for data ingestion.
        
    Returns:
        list: A list of data records (each record is a dict).
    """
    try:
        logger.info(f"Fetching data from {url}")
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        logger.info("Data fetched successfully.")
        return data
    except Exception as e:
        logger.error(f"Error fetching data: {e}", exc_info=True)
        return []

def preprocess_data(data: list) -> list:
    """
    Preprocess the raw data by performing cleaning and transformations.
    
    Args:
        data (list): The raw data records.
        
    Returns:
        list: A list of cleaned data records.
    """
    processed = []
    for record in data:
        try:
            # Example: Normalize date formats and remove invalid records.
            if "date" in record:
                # Parse and reformat date fields
                parsed_date = datetime.strptime(record["date"], "%Y-%m-%dT%H:%M:%S")
                record["date"] = parsed_date.strftime("%Y-%m-%d")
            # Additional preprocessing steps can be added here.
            processed.append(record)
        except Exception as e:
            logger.warning(f"Skipping record due to processing error: {e}")
    logger.info(f"Preprocessed {len(processed)} out of {len(data)} records.")
    return processed

def save_to_csv(data: list, output_file: str):
    """
    Save processed data to a CSV file.
    
    Args:
        data (list): List of data records (dictionaries).
        output_file (str): File path for the output CSV.
    """
    if not data:
        logger.warning("No data to save.")
        return

    try:
        logger.info(f"Saving data to {output_file}")
        # Ensure the output directory exists
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        with open(output_file, mode="w", newline="", encoding="utf-8") as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)
        logger.info("Data saved successfully.")
    except Exception as e:
        logger.error(f"Error saving data: {e}", exc_info=True)

def main():
    """
    Main function to orchestrate the data ingestion and preprocessing pipeline.
    """
    raw_data = fetch_data(DATA_SOURCE_URL)
    if not raw_data:
        logger.error("No data fetched. Exiting pipeline.")
        return
    processed_data = preprocess_data(raw_data)
    save_to_csv(processed_data, OUTPUT_CSV)

if __name__ == "__main__":
    main()
