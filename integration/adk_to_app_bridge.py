#!/usr/bin/env python3
"""
ADK to ReliefOps App Bridge
Connects your Google ADK agents with the React Native app via HTTP API
"""

import asyncio
import json
import logging
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import aiohttp

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="ReliefOps ADK Bridge", version="1.0.0")

# Add CORS middleware for React Native app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your app's origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state to store agent results
agent_state = {
    "last_run": None,
    "current_status": "idle",
    "agents": {
        "news": {"status": "idle", "last_run": None, "progress": 0},
        "mapping": {"status": "idle", "last_run": None, "progress": 0},
        "logistics": {"status": "idle", "last_run": None, "progress": 0},
    },
    "data": {
        "shelters": [],
        "closures": [],
        "supplies": [],
        "alerts": [],
    }
}

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ReliefOps ADK Bridge is running", "version": "1.0.0"}

@app.get("/api/status")
async def get_status():
    """Get current agent status"""
    return agent_state

@app.post("/api/run-agents")
async def run_agents(region: str = "Miami, FL", feeds: list = ["Official"]):
    """Trigger agent execution"""
    try:
        logger.info(f"Running agents for region: {region}, feeds: {feeds}")
        
        # Update status to running
        agent_state["current_status"] = "running"
        for agent_name in agent_state["agents"]:
            agent_state["agents"][agent_name]["status"] = "running"
            agent_state["agents"][agent_name]["progress"] = 0
        
        # Simulate agent execution (replace with actual ADK agent calls)
        await simulate_agent_execution(region, feeds)
        
        # Update status to completed
        agent_state["current_status"] = "completed"
        for agent_name in agent_state["agents"]:
            agent_state["agents"][agent_name]["status"] = "completed"
            agent_state["agents"][agent_name]["progress"] = 100
            agent_state["agents"][agent_name]["last_run"] = "2025-09-28T10:15:00Z"
        
        agent_state["last_run"] = "2025-09-28T10:15:00Z"
        
        return {"status": "success", "message": "Agents executed successfully"}
        
    except Exception as e:
        logger.error(f"Error running agents: {e}")
        agent_state["current_status"] = "error"
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/data/shelters")
async def get_shelters():
    """Get shelter data"""
    return agent_state["data"]["shelters"]

@app.get("/api/data/closures")
async def get_closures():
    """Get road closure data"""
    return agent_state["data"]["closures"]

@app.get("/api/data/supplies")
async def get_supplies():
    """Get supply data"""
    return agent_state["data"]["supplies"]

@app.get("/api/data/alerts")
async def get_alerts():
    """Get alerts data"""
    return agent_state["data"]["alerts"]

async def simulate_agent_execution(region: str, feeds: list):
    """Execute agents via ADK coordinator"""
    
    try:
        # Call the coordinator agent to run all agents
        coordinator_url = "http://localhost:8000/run_sse"
        
        # Simulate News Agent
        await asyncio.sleep(1)
        agent_state["agents"]["news"]["progress"] = 50
        await asyncio.sleep(1)
        agent_state["agents"]["news"]["progress"] = 100
        
        # Call Mapping Agent
        try:
            async with aiohttp.ClientSession() as session:
                mapping_response = await session.post(
                    "http://localhost:8002/run_sse",
                    json={"region": region},
                    headers={"Content-Type": "application/json"}
                )
                if mapping_response.status == 200:
                    agent_state["agents"]["mapping"]["progress"] = 50
                    await asyncio.sleep(0.5)
                    agent_state["agents"]["mapping"]["progress"] = 100
        except:
            # Fallback if mapping agent not available
            agent_state["agents"]["mapping"]["progress"] = 50
            await asyncio.sleep(0.5)
            agent_state["agents"]["mapping"]["progress"] = 100
        
        # Call Logistics Agent
        try:
            async with aiohttp.ClientSession() as session:
                logistics_response = await session.post(
                    "http://localhost:8003/run_sse",
                    json={"region": region},
                    headers={"Content-Type": "application/json"}
                )
                if logistics_response.status == 200:
                    agent_state["agents"]["logistics"]["progress"] = 50
                    await asyncio.sleep(0.8)
                    agent_state["agents"]["logistics"]["progress"] = 100
        except:
            # Fallback if logistics agent not available
            agent_state["agents"]["logistics"]["progress"] = 50
            await asyncio.sleep(0.8)
            agent_state["agents"]["logistics"]["progress"] = 100
            
    except Exception as e:
        logger.warning(f"Error calling ADK agents: {e}, using simulation")
        
        # Fallback simulation
        await asyncio.sleep(1)
        agent_state["agents"]["news"]["progress"] = 50
        await asyncio.sleep(1)
        agent_state["agents"]["news"]["progress"] = 100
        
        await asyncio.sleep(0.5)
        agent_state["agents"]["mapping"]["progress"] = 50
        await asyncio.sleep(0.5)
        agent_state["agents"]["mapping"]["progress"] = 100
        
        await asyncio.sleep(0.8)
        agent_state["agents"]["logistics"]["progress"] = 50
        await asyncio.sleep(0.8)
        agent_state["agents"]["logistics"]["progress"] = 100
    
    # Update data with mock results
    agent_state["data"]["shelters"] = [
        {
            "id": "sh1",
            "name": "Civic Center",
            "lat": 25.7811,
            "lng": -80.2102,
            "capacity": 300,
            "occupied": 190,
            "status": "Open",
            "updated": "2025-09-28T10:15:00Z"
        },
        {
            "id": "sh2",
            "name": "Norland High",
            "lat": 25.9489,
            "lng": -80.2456,
            "capacity": 250,
            "occupied": 250,
            "status": "Full",
            "updated": "2025-09-28T10:15:00Z"
        }
    ]
    
    agent_state["data"]["closures"] = [
        {
            "id": "rc1",
            "road": "US-1 @ 88th St",
            "lat": 25.6932,
            "lng": -80.3131,
            "cause": "Flooded",
            "eta": "Unknown",
            "updated": "2025-09-28T10:15:00Z"
        }
    ]
    
    agent_state["data"]["supplies"] = [
        {
            "id": "sp1",
            "site": "Jose Marti Park",
            "lat": 25.7656,
            "lng": -80.2046,
            "items": ["Water", "Food"],
            "stock_pct": 70,
            "updated": "2025-09-28T10:15:00Z"
        }
    ]
    
    agent_state["data"]["alerts"] = [
        {
            "id": "al1",
            "severity": "Critical",
            "title": f"New flood warning issued for {region}",
            "source": "Official",
            "time": "2025-09-28T10:15:00Z"
        }
    ]

if __name__ == "__main__":
    print("🚀 Starting ReliefOps ADK Bridge...")
    print("📱 App will connect to: http://localhost:8001")
    print("🔗 ADK Agent should run on: http://localhost:8000")
    print("=" * 50)
    
    uvicorn.run(app, host="0.0.0.0", port=8001)
