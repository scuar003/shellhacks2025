#!/usr/bin/env python3
"""
Simple ReliefOps Bridge Server
Connects React Native app to ADK agents
"""

import asyncio
import json
import logging
from typing import Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="ReliefOps Bridge", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
agent_state = {
    "last_run": None,
    "current_status": "idle",
    "agents": {
        "news": {"status": "idle", "last_run": None, "progress": 0},
        "mapping": {"status": "idle", "last_run": None, "progress": 0},
        "logistics": {"status": "idle", "last_run": None, "progress": 0},
    },
    "data": {
        "shelters": [
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
                "updated": "2025-09-28T10:05:00Z"
            }
        ],
        "closures": [
            {
                "id": "rc1",
                "road": "US-1 @ 88th St",
                "lat": 25.6932,
                "lng": -80.3131,
                "cause": "Flooded",
                "eta": "Unknown",
                "updated": "2025-09-28T10:12:00Z"
            }
        ],
        "supplies": [
            {
                "id": "sp1",
                "site": "Jose Marti Park",
                "lat": 25.7656,
                "lng": -80.2046,
                "items": ["Water", "Food"],
                "stock_pct": 70,
                "updated": "2025-09-28T10:11:00Z"
            }
        ],
        "alerts": [
            {
                "id": "al1",
                "severity": "Critical",
                "title": "New flood warning issued",
                "source": "Official",
                "time": "2025-09-28T10:13:00Z"
            }
        ]
    }
}

@app.get("/")
async def root():
    """Health check"""
    return {"status": "ReliefOps Bridge is running", "version": "1.0.0"}

@app.get("/api/status")
async def get_status():
    """Get current status"""
    return agent_state

@app.post("/api/run-agents")
async def run_agents(request: dict = None):
    """Run agents"""
    try:
        region = request.get("region", "Miami, FL") if request else "Miami, FL"
        feeds = request.get("feeds", ["Official"]) if request else ["Official"]
        logger.info(f"Running agents for region: {region}")
        
        # Update status
        agent_state["current_status"] = "running"
        for agent_name in agent_state["agents"]:
            agent_state["agents"][agent_name]["status"] = "running"
            agent_state["agents"][agent_name]["progress"] = 0
        
        # Simulate agent execution
        await asyncio.sleep(1)
        agent_state["agents"]["news"]["progress"] = 50
        await asyncio.sleep(1)
        agent_state["agents"]["news"]["progress"] = 100
        agent_state["agents"]["news"]["status"] = "done"
        
        await asyncio.sleep(0.5)
        agent_state["agents"]["mapping"]["progress"] = 50
        await asyncio.sleep(0.5)
        agent_state["agents"]["mapping"]["progress"] = 100
        agent_state["agents"]["mapping"]["status"] = "done"
        
        await asyncio.sleep(0.8)
        agent_state["agents"]["logistics"]["progress"] = 50
        await asyncio.sleep(0.8)
        agent_state["agents"]["logistics"]["progress"] = 100
        agent_state["agents"]["logistics"]["status"] = "done"
        
        # Update status
        agent_state["current_status"] = "completed"
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
    """Get closure data"""
    return agent_state["data"]["closures"]

@app.get("/api/data/supplies")
async def get_supplies():
    """Get supply data"""
    return agent_state["data"]["supplies"]

@app.get("/api/data/alerts")
async def get_alerts():
    """Get alert data"""
    return agent_state["data"]["alerts"]

if __name__ == "__main__":
    print("🚀 Starting ReliefOps Simple Bridge...")
    print("📱 App will connect to: http://localhost:8001")
    print("=" * 50)
    
    uvicorn.run(app, host="0.0.0.0", port=8001)
