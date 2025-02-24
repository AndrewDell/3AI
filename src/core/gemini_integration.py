# src/core/gemini_integration.py

#gemini_integration.py
#
#Integration logic for Google Gemini 2.0 APIs, enabling advanced AI features 
#such as language understanding, model inference, and data analysis.
#
#Best Practices:
#1. Use asynchronous HTTP requests for better performance (e.g., aiohttp).
#2. Implement robust error handling and retries for transient network issues.
#3. Store API credentials securely using environment variables or secrets management.
#4. Return structured data to be consumed by other modules.
#
#Usage Example:
#    from gemini_integration import GeminiIntegration
#    
#    integration = GeminiIntegration(api_key="YOUR_KEY")
#    await integration.authenticate()
#    result = await integration.perform_request("endpoint", data={...})

import os
import logging
import aiohttp
import asyncio
from typing import Any, Optional

class GeminiIntegration:
    """
    Handles communication with the Google Gemini 2.0 API, 
    including authentication, request processing, and error handling.
    """

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize with an API key, typically sourced from environment variables 
        or a secrets manager.

        Args:
            api_key (str, optional): The key used for authenticating 
                                     with the Gemini API.
        """
        self.logger = logging.getLogger(self.__class__.__name__)
        if not api_key:
            # Prefer reading from environment variables if not provided explicitly
            api_key = os.getenv("GEMINI_API_KEY", "")
        self.api_key = api_key.strip()
        self.base_url = os.getenv("GEMINI_BASE_URL", "https://api.google.com/gemini/v2")

    async def authenticate(self) -> bool:
        """
        Validate the API key with the Gemini service, 
        ensuring the client can access advanced AI capabilities.

        Returns:
            bool: True if authentication succeeded, False otherwise.
        """
        if not self.api_key:
            self.logger.error("No API key provided for Google Gemini 2.0.")
            return False

        url = f"{self.base_url}/auth"
        headers = {"Authorization": f"Bearer {self.api_key}"}

        self.logger.info("Authenticating with Gemini 2.0 API...")

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers) as response:
                    if response.status == 200:
                        self.logger.info("Authentication with Gemini successful.")
                        return True
                    else:
                        self.logger.error(
                            f"Auth failed with status {response.status}: {await response.text()}"
                        )
                        return False
        except Exception as e:
            self.logger.error(f"Exception during Gemini authentication: {e}", exc_info=True)
            return False

    async def perform_request(self, endpoint: str, data: dict = None) -> Any:
        """
        Make a POST request to a Gemini API endpoint with JSON data.

        Args:
            endpoint (str): The specific endpoint path under base_url.
            data (dict, optional): Payload for the request.

        Returns:
            Any: Parsed JSON response or an error message if the request fails.
        """
        if not self.api_key:
            self.logger.error("Cannot perform Gemini request: missing API key.")
            return None

        url = f"{self.base_url}/{endpoint}"
        headers = {"Authorization": f"Bearer {self.api_key}"}

        self.logger.debug(f"Sending request to {url} with data: {data}")

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=data or {}, headers=headers) as response:
                    if response.status == 200:
                        result = await response.json()
                        self.logger.info(f"Request to {endpoint} succeeded.")
                        return result
                    else:
                        err_text = await response.text()
                        self.logger.error(
                            f"Request to {endpoint} failed with status {response.status}. "
                            f"Response: {err_text}"
                        )
                        return None
        except Exception as e:
            self.logger.error(f"Error performing request to {endpoint}: {e}", exc_info=True)
            return None


async def demo():
    """
    A small demonstration of how GeminiIntegration might be used.
    """
    logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
    gemini = GeminiIntegration()
    if await gemini.authenticate():
        result = await gemini.perform_request("sample_endpoint", data={"hello": "world"})
        print("Gemini response:", result)

if __name__ == "__main__":
    asyncio.run(demo())
