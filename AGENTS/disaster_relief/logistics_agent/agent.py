# logistics_agent/agent.py
# Remote A2A agent for logistics and supply chain management
# Run: adk web . (from logistics_agent directory)

import json
from typing import Dict, Any, List
from google.adk.agents import LlmAgent
from google.adk.tools.tool_context import ToolContext

# =========================
# 📦 Logistics Agent Configuration
# =========================
GEMINI_MODEL = "gemini-2.0-flash"
DEFAULT_REGION = "Miami, FL"

# =========================
# 🧰 Logistics Tools
# =========================
def fetch_shelter_status(region: str) -> Dict[str, Any]:
    """
    Get current shelter capacity and status
    """
    shelter_data = {
        "region": region,
        "shelters": [
            {
                "id": "sh1",
                "name": "Civic Center",
                "lat": 25.7811,
                "lng": -80.2102,
                "capacity": 300,
                "occupied": 190,
                "available": 110,
                "status": "open",
                "last_updated": "2025-09-28T10:15:00Z",
                "amenities": ["food", "water", "medical", "wifi"],
                "special_needs": True
            },
            {
                "id": "sh2",
                "name": "Norland High School",
                "lat": 25.9489,
                "lng": -80.2456,
                "capacity": 250,
                "occupied": 250,
                "available": 0,
                "status": "full",
                "last_updated": "2025-09-28T10:05:00Z",
                "amenities": ["food", "water", "medical"],
                "special_needs": False
            },
            {
                "id": "sh3",
                "name": "Miami Beach Convention Center",
                "lat": 25.7907,
                "lng": -80.1300,
                "capacity": 500,
                "occupied": 320,
                "available": 180,
                "status": "open",
                "last_updated": "2025-09-28T10:12:00Z",
                "amenities": ["food", "water", "medical", "wifi", "showers"],
                "special_needs": True
            },
            {
                "id": "sh4",
                "name": "FIU Stadium",
                "lat": 25.7569,
                "lng": -80.3736,
                "capacity": 400,
                "occupied": 150,
                "available": 250,
                "status": "open",
                "last_updated": "2025-09-28T10:08:00Z",
                "amenities": ["food", "water", "medical", "wifi"],
                "special_needs": True
            }
        ],
        "total_capacity": 1450,
        "total_occupied": 910,
        "total_available": 540,
        "utilization_rate": 62.8,
        "timestamp": "2025-09-28T10:15:00Z"
    }
    
    return {"status": "success", "payload": shelter_data}

def fetch_supply_inventory(region: str) -> Dict[str, Any]:
    """
    Get current supply inventory and distribution status
    """
    supply_data = {
        "region": region,
        "supply_sites": [
            {
                "id": "sp1",
                "site": "Jose Marti Park",
                "lat": 25.7656,
                "lng": -80.2046,
                "items": ["Water", "Food", "Blankets"],
                "stock_pct": 70,
                "last_restocked": "2025-09-27T14:30:00Z",
                "next_delivery": "2025-09-28T16:00:00Z",
                "priority": "high"
            },
            {
                "id": "sp2",
                "site": "UM Arena",
                "lat": 25.7198,
                "lng": -80.2793,
                "items": ["Blankets", "First Aid", "Hygiene Kits"],
                "stock_pct": 45,
                "last_restocked": "2025-09-26T10:15:00Z",
                "next_delivery": "2025-09-28T12:00:00Z",
                "priority": "medium"
            },
            {
                "id": "sp3",
                "site": "Bayfront Park",
                "lat": 25.7751,
                "lng": -80.1906,
                "items": ["Water", "Blankets", "Food", "Batteries"],
                "stock_pct": 85,
                "last_restocked": "2025-09-28T08:00:00Z",
                "next_delivery": "2025-09-29T10:00:00Z",
                "priority": "low"
            },
            {
                "id": "sp4",
                "site": "Tropical Park",
                "lat": 25.7200,
                "lng": -80.3100,
                "items": ["First Aid", "Water", "Flashlights"],
                "stock_pct": 30,
                "last_restocked": "2025-09-25T16:45:00Z",
                "next_delivery": "2025-09-28T14:00:00Z",
                "priority": "high"
            }
        ],
        "distribution_centers": [
            {
                "name": "Miami-Dade Emergency Operations Center",
                "status": "operational",
                "capacity": "high",
                "last_update": "2025-09-28T10:15:00Z"
            }
        ],
        "timestamp": "2025-09-28T10:15:00Z"
    }
    
    return {"status": "success", "payload": supply_data}

def check_resource_allocation(region: str) -> Dict[str, Any]:
    """
    Check current resource allocation and needs
    """
    allocation_data = {
        "region": region,
        "resource_needs": [
            {
                "item": "Water",
                "needed": 5000,
                "available": 3200,
                "shortage": 1800,
                "priority": "critical"
            },
            {
                "item": "Food",
                "needed": 3000,
                "available": 2800,
                "shortage": 200,
                "priority": "high"
            },
            {
                "item": "Blankets",
                "needed": 2000,
                "available": 1500,
                "shortage": 500,
                "priority": "medium"
            },
            {
                "item": "First Aid Kits",
                "needed": 500,
                "available": 300,
                "shortage": 200,
                "priority": "high"
            }
        ],
        "transportation": {
            "available_vehicles": 15,
            "in_use": 8,
            "available": 7,
            "maintenance_required": 2
        },
        "personnel": {
            "volunteers_available": 45,
            "staff_available": 12,
            "medical_staff": 8,
            "logistics_coordinators": 4
        },
        "timestamp": "2025-09-28T10:15:00Z"
    }
    
    return {"status": "success", "payload": allocation_data}

def update_supply_status(updates: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update supply status and inventory
    """
    # In production, this would update a logistics database
    return {
        "status": "success",
        "message": "Supply status updated successfully",
        "updated_items": len(updates.get("items", [])),
        "timestamp": "2025-09-28T10:15:00Z"
    }

# =========================
# 🧠 Logistics Agent
# =========================
logistics_agent = LlmAgent(
    name="LogisticsAgent",
    model=GEMINI_MODEL,
    description="Manages supply chains, resource distribution, and operational logistics for disaster response.",
    instruction="""You are a Logistics Agent for disaster relief coordination. Your role is to:

1. Monitor shelter capacity and availability
2. Track supply inventory and distribution
3. Manage resource allocation and needs
4. Coordinate transportation and personnel

When called, analyze the provided data and return a structured JSON response with:
- shelter_status: Current shelter capacity and availability
- supply_inventory: Available supplies and distribution sites
- resource_allocation: Current resource needs and shortages
- transportation: Available vehicles and logistics capacity
- personnel: Available staff and volunteers
- recommendations: Actionable logistics recommendations
- priority_actions: Critical logistics actions needed

Be concise and operational. Focus on resource optimization and efficient distribution.
""",
    tools=[fetch_shelter_status, fetch_supply_inventory, check_resource_allocation, update_supply_status],
    output_key="logistics_result",
    system_prompt_overrides={"region": DEFAULT_REGION},
)

# =========================
# 🎯 Root Agent
# =========================
root_agent = logistics_agent
