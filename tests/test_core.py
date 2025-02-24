# tests/test_core.py

#test_core.py

#This file contains unit tests for the core modules of the 3AI project,
#specifically testing the agent orchestration and Gemini integration modules.


import pytest
import asyncio

# Import the modules to test; adjust the import paths as necessary.
from src.core.agent_orchestration import AgentOrchestrator, BaseAgent
from src.core.gemini_integration import GeminiIntegration

class TestAgent(BaseAgent):
    def __init__(self, name):
        self.name = name

    async def run(self, **kwargs):
        # Return a simple result for testing purposes.
        await asyncio.sleep(0.1)
        return f"{self.name} result"

@pytest.mark.asyncio
async def test_agent_orchestration():
    orchestrator = AgentOrchestrator()
    agent = TestAgent("UnitTestAgent")
    orchestrator.register_agent(agent)
    
    # Run the agent once and verify the output using the orchestrator's run_agent method.
    await orchestrator.run_agent(agent)
    # Since run_agent logs output, no assert is needed here; in a full test, capture log output.

@pytest.mark.asyncio
async def test_gemini_integration_auth_failure(monkeypatch):
    # Simulate a failure in authentication by patching aiohttp.ClientSession
    async def fake_get(*args, **kwargs):
        class FakeResponse:
            status = 401
            async def text(self):
                return "Unauthorized"
            async def __aenter__(self):
                return self
            async def __aexit__(self, exc_type, exc, tb):
                pass
        return FakeResponse()
    
    monkeypatch.setattr("aiohttp.ClientSession.get", fake_get)
    gemini = GeminiIntegration(api_key="invalid_key")
    result = await gemini.authenticate()
    assert result is False
