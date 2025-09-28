# mapping_agent/agent.py
# Remote A2A agent for mapping and road conditions
# Run: adk web . (from mapping_agent directory)

import json
from typing import Dict, Any, List
from google.adk.agents import LlmAgent
from google.adk.tools.tool_context import ToolContext

# =========================
# 🗺️ Mapping Agent Configuration
# =========================
GEMINI_MODEL = "gemini-2.0-flash"
DEFAULT_REGION = "Miami, FL"

# =========================
# 🧰 Mapping Tools
# =========================
def fetch_road_conditions(region: str) -> Dict[str, Any]:
    """
    Fetch current road conditions and closures for the region.
    In production, this would connect to real traffic APIs.
    """
    # Mock data - replace with real API calls
    road_data = {
        "region": region,
        "blocked_roads": [
            {
                "id": "rc1",
                "road": "US-1 @ 88th St",
                "lat": 25.6932,
                "lng": -80.3131,
                "cause": "Flooding",
                "severity": "high",
                "eta_reopen": "unknown",
                "detour_available": True,
                "last_updated": "2025-09-28T10:15:00Z"
            },
            {
                "id": "rc2", 
                "road": "I-95 N ramp",
                "lat": 25.8215,
                "lng": -80.1870,
                "cause": "Debris",
                "severity": "moderate",
                "eta_reopen": "3h",
                "detour_available": True,
                "last_updated": "2025-09-28T10:10:00Z"
            },
            {
                "id": "rc3",
                "road": "Biscayne Blvd @ 36th St", 
                "lat": 25.8134,
                "lng": -80.1910,
                "cause": "Power Lines Down",
                "severity": "high",
                "eta_reopen": "6h",
                "detour_available": False,
                "last_updated": "2025-09-28T10:12:00Z"
            }
        ],
        "safe_routes": [
            {
                "from": "Downtown Miami",
                "to": "Miami Airport", 
                "route": "I-395 → I-95 → Airport Connector",
                "status": "clear",
                "estimated_time": "25 min"
            },
            {
                "from": "Coral Gables",
                "to": "Brickell",
                "route": "US-1 → Brickell Ave",
                "status": "clear", 
                "estimated_time": "15 min"
            }
        ],
        "evacuation_routes": [
            {
                "zone": "Zone A (Coastal)",
                "primary_route": "I-95 North",
                "alternate_route": "US-1 North",
                "status": "active"
            }
        ],
        "timestamp": "2025-09-28T10:15:00Z",
        "sources": ["FDOT", "Miami-Dade Traffic", "Waze API"]
    }
    
    return {"status": "success", "payload": road_data}

def fetch_infrastructure_status(region: str) -> Dict[str, Any]:
    """
    Check status of critical infrastructure (bridges, tunnels, etc.)
    """
    infrastructure_data = {
        "region": region,
        "bridges": [
            {
                "name": "Venetian Causeway",
                "status": "open",
                "restrictions": "none",
                "last_inspection": "2025-09-20T00:00:00Z"
            },
            {
                "name": "MacArthur Causeway", 
                "status": "open",
                "restrictions": "none",
                "last_inspection": "2025-09-20T00:00:00Z"
            }
        ],
        "tunnels": [
            {
                "name": "Port of Miami Tunnel",
                "status": "open",
                "restrictions": "none",
                "last_inspection": "2025-09-20T00:00:00Z"
            }
        ],
        "airports": [
            {
                "name": "Miami International Airport",
                "status": "operational",
                "runways": "all open",
                "last_update": "2025-09-28T10:15:00Z"
            }
        ],
        "timestamp": "2025-09-28T10:15:00Z"
    }
    
    return {"status": "success", "payload": infrastructure_data}

def update_map_data(updates: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update map data with new information
    """
    # In production, this would update a GIS database
    return {
        "status": "success", 
        "message": "Map data updated successfully",
        "updated_items": len(updates.get("items", [])),
        "timestamp": "2025-09-28T10:15:00Z"
    }

# =========================
# 🧠 Mapping Agent
# =========================
mapping_agent = LlmAgent(
    name="MappingAgent",
    model=GEMINI_MODEL,
    description="Processes geographical data, road conditions, and infrastructure status for disaster response.",
    instruction="""You are a Mapping Agent for disaster relief coordination. Your role is to:

1. Monitor road conditions and closures
2. Identify safe evacuation routes  
3. Track infrastructure status (bridges, tunnels, airports)
4. Provide real-time mapping updates

When called, analyze the provided data and return a structured JSON response with:
- blocked_roads: List of road closures with details
- safe_routes: Available alternative routes
- evacuation_routes: Designated evacuation paths
- infrastructure_status: Status of critical infrastructure
- recommendations: Actionable mapping recommendations
- priority_areas: Areas requiring immediate attention

Be concise and operational. Focus on actionable intelligence for emergency coordinators.
""",
    tools=[fetch_road_conditions, fetch_infrastructure_status, update_map_data],
    output_key="mapping_result",
    system_prompt_overrides={"region": DEFAULT_REGION},
)

# =========================
# 🎯 Root Agent
# =========================
root_agent = mapping_agent
