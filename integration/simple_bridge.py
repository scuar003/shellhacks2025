#!/usr/bin/env python3
"""
ReliefOps Bridge Server
Connects React Native app to ADK agents
Calls actual agents instead of doing its own data fetching
"""

import asyncio
import json
import logging
import os
import requests
import sys
from pathlib import Path
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, Request, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from datetime import datetime

# Add the AGENTS directory to the Python path so we can import the agents
agents_path = Path(__file__).parent.parent / "AGENTS"
sys.path.insert(0, str(agents_path))

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

# Agent imports - we'll call the simple wrapper functions
try:
    from disaster_relief.coordinator_agent.agent import run_coordinator_agent
    from map_remote.mapping_agent.agent import run_mapping_agent
    from logistics_remote.logistics_agent.agent import run_logistics_agent
    AGENTS_AVAILABLE = True
    logger.info("✅ Successfully imported all agent wrapper functions")
except ImportError as e:
    logger.error(f"❌ Failed to import agent wrappers: {e}")
    AGENTS_AVAILABLE = False

# Global state
agent_state = {
    "last_run": None,
    "last_request": None,
    "last_result": None,
    "current_status": "idle",
    "agents": {
        "coordinator": {"status": "idle", "last_run": None, "progress": 0},
        "mapping": {"status": "idle", "last_run": None, "progress": 0},
        "logistics": {"status": "idle", "last_run": None, "progress": 0},
    },
    "data": {
        "shelters": [],
        "closures": [],
        "supplies": [],
        "alerts": []
    }
}

# --- Helper functions ---
def _now_iso():
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"

async def call_coordinator_agent(region: str, feeds: List[str]) -> Dict[str, Any]:
    """Call the coordinator agent which orchestrates all other agents"""
    if not AGENTS_AVAILABLE:
        return {"status": "error", "message": "Agents not available", "data": None}
    
    try:
        logger.info(f"Calling coordinator agent for region: {region}")
        
        # Call the simple wrapper function
        result = await run_coordinator_agent(region, feeds)
        
        logger.info("✅ Coordinator agent completed successfully")
        return {"status": "success", "data": result}
        
    except Exception as e:
        logger.error(f"Failed to call coordinator agent: {e}")
        return {"status": "error", "message": str(e), "data": None}

async def call_mapping_agent(region: str) -> Dict[str, Any]:
    """Call the mapping agent for road conditions and infrastructure"""
    if not AGENTS_AVAILABLE:
        return {"status": "error", "message": "Agents not available", "data": None}
    
    try:
        logger.info(f"Calling mapping agent for region: {region}")
        
        # Call the simple wrapper function
        result = await run_mapping_agent(region)
        
        logger.info("✅ Mapping agent completed successfully")
        return {"status": "success", "data": result}
        
    except Exception as e:
        logger.error(f"Failed to call mapping agent: {e}")
        return {"status": "error", "message": str(e), "data": None}

async def call_logistics_agent(region: str) -> Dict[str, Any]:
    """Call the logistics agent for shelters and supplies"""
    if not AGENTS_AVAILABLE:
        return {"status": "error", "message": "Agents not available", "data": None}
    
    try:
        logger.info(f"Calling logistics agent for region: {region}")
        
        # Call the simple wrapper function
        result = await run_logistics_agent(region)
        
        logger.info("✅ Logistics agent completed successfully")
        return {"status": "success", "data": result}
        
    except Exception as e:
        logger.error(f"Failed to call logistics agent: {e}")
        return {"status": "error", "message": str(e), "data": None}

# --- Agent health check helpers ---
def check_agent_health() -> bool:
    """Check if agents are available"""
    return AGENTS_AVAILABLE

# --- API Endpoints ---
@app.get("/")
async def root():
    """Health check"""
    return {"status": "ReliefOps Bridge is running", "version": "1.0.0"}

@app.get("/api/status")
async def get_status():
    """Get current status"""
    return agent_state

@app.post("/api/run-agents")
async def run_agents(request: Request):
    """Run agents by calling the actual ADK agents. Accepts either multipart/form-data or JSON."""
    try:
        # Determine feeds from form or JSON
        feeds: List[str] = ["Official"]
        region: str = "Miami, FL"

        # Try reading as form first (multipart or urlencoded)
        try:
            form = await request.form()
            form_feeds = form.getlist("feeds") if hasattr(form, "getlist") else None
            form_region = form.get("region") if hasattr(form, "get") else None
            parsed: List[str] = []
            if form_feeds:
                for item in form_feeds:
                    if isinstance(item, str) and item.strip().startswith("["):
                        try:
                            parsed.extend(json.loads(item))
                            continue
                        except Exception:
                            pass
                    parsed.append(item)
            if parsed:
                feeds = parsed
            if form_region:
                region = form_region
        except Exception:
            pass

        # If not provided by form, try JSON body
        if feeds == ["Official"] and region == "Miami, FL":
            try:
                data = await request.json()
                if isinstance(data, dict):
                    if "feeds" in data and isinstance(data["feeds"], list):
                        feeds = data["feeds"]
                    if "region" in data and isinstance(data["region"], str) and data["region"]:
                        region = data["region"]
            except Exception:
                pass

        logger.info(f"Running agents for region: {region} with feeds: {feeds}")
        
        # Update status
        agent_state["current_status"] = "running"
        for agent_name in agent_state["agents"]:
            agent_state["agents"][agent_name]["status"] = "running"
            agent_state["agents"][agent_name]["progress"] = 0
        
        # Save last request for diagnostics
        agent_state["last_request"] = {"region": region, "feeds": feeds, "ts": _now_iso()}

        # Call the coordinator agent which orchestrates all other agents
        logger.info("Calling coordinator agent...")
        coordinator_result = await call_coordinator_agent(region, feeds)
        
        if coordinator_result["status"] == "success":
            # Coordinator agent returned data
            agent_data = coordinator_result["data"]
            
            # Update agent statuses
            for agent_name in agent_state["agents"]:
                agent_state["agents"][agent_name]["status"] = "done"
                agent_state["agents"][agent_name]["progress"] = 100
                agent_state["agents"][agent_name]["last_run"] = _now_iso()
            
            # Store the data from agents
            agent_state["data"] = {
                "shelters": agent_data.get("shelters", []),
                "closures": agent_data.get("closures", []),
                "supplies": agent_data.get("supplies", []),
                "alerts": agent_data.get("alerts", []),
            }
            
            # Update status
            agent_state["current_status"] = "completed"
            agent_state["last_run"] = _now_iso()
            
            # Compute KPIs from agent data
            shelters = agent_state["data"]["shelters"]
            closures = agent_state["data"]["closures"]
            supplies = agent_state["data"]["supplies"]
            alerts = agent_state["data"]["alerts"]
            
            kpis = {
                "activeShelters": len(shelters),
                "roadClosures": len(closures),
                "supplySites": len(supplies),
                "newAlerts": len(alerts),
            }

            result_payload = {
                "status": "success",
                "message": "Agents executed successfully",
                "feeds": feeds,
                "region": region,
                "data": {
                    "shelters": shelters,
                    "closures": closures,
                    "supplies": supplies,
                    "alerts": alerts,
                },
                "kpis": kpis,
            }
            
        else:
            # Coordinator agent failed, try calling individual agents
            logger.warning("Coordinator agent failed, trying individual agents...")
            
            # Call mapping agent
            mapping_result = await call_mapping_agent(region)
            if mapping_result["status"] == "success":
                agent_state["agents"]["mapping"]["status"] = "done"
                agent_state["agents"]["mapping"]["progress"] = 100
                agent_state["agents"]["mapping"]["last_run"] = _now_iso()
            
            # Call logistics agent
            logistics_result = await call_logistics_agent(region)
            if logistics_result["status"] == "success":
                agent_state["agents"]["logistics"]["status"] = "done"
                agent_state["agents"]["logistics"]["progress"] = 100
                agent_state["agents"]["logistics"]["last_run"] = _now_iso()
            
            # Combine data from individual agents
            combined_data = {
                "shelters": [],
                "closures": [],
                "supplies": [],
                "alerts": [],
            }
            
            
            if mapping_result["status"] == "success" and mapping_result["data"]:
                mapping_data = mapping_result["data"]
                combined_data["closures"].extend(mapping_data.get("closures", []))
                combined_data["shelters"].extend(mapping_data.get("shelters", []))
            
            if logistics_result["status"] == "success" and logistics_result["data"]:
                logistics_data = logistics_result["data"]
                combined_data["supplies"].extend(logistics_data.get("supplies", []))
                combined_data["shelters"].extend(logistics_data.get("shelters", []))
            
            agent_state["data"] = combined_data
            agent_state["current_status"] = "completed"
            agent_state["last_run"] = _now_iso()
            
            # Compute KPIs
            shelters = agent_state["data"]["shelters"]
            closures = agent_state["data"]["closures"]
            supplies = agent_state["data"]["supplies"]
            alerts = agent_state["data"]["alerts"]
            
            kpis = {
                "activeShelters": len(shelters),
                "roadClosures": len(closures),
                "supplySites": len(supplies),
                "newAlerts": len(alerts),
            }

            result_payload = {
                "status": "success",
                "message": "Individual agents executed successfully",
                "feeds": feeds,
                "region": region,
                "data": {
                    "shelters": shelters,
                    "closures": closures,
                    "supplies": supplies,
                    "alerts": alerts,
                },
                "kpis": kpis,
            }

        agent_state["last_result"] = {"ts": _now_iso(), **result_payload}
        return result_payload
        
    except Exception as e:
        logger.error(f"Error running agents: {e}")
        agent_state["current_status"] = "error"
        for agent_name in agent_state["agents"]:
            agent_state["agents"][agent_name]["status"] = "error"
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

@app.get("/api/last-run")
async def get_last_run():
    """Return the last request/result for debugging end-to-end."""
    return {
        "last_request": agent_state.get("last_request"),
        "last_result": agent_state.get("last_result"),
        "last_run": agent_state.get("last_run"),
        "status": agent_state.get("current_status"),
    }

@app.get("/api/health")
async def health_check():
    """Health check for all agents"""
    return {
        "bridge": "healthy",
        "agents_available": AGENTS_AVAILABLE,
        "timestamp": _now_iso()
    }

if __name__ == "__main__":
    logger.info("🚀 Starting ReliefOps Bridge Server...")
    if AGENTS_AVAILABLE:
        logger.info("✅ All agents imported successfully")
    else:
        logger.warning("⚠️  Some agents failed to import - check dependencies")
    logger.info("🌐 Bridge will be available at: http://localhost:8001")
    
    uvicorn.run(app, host="0.0.0.0", port=8001)