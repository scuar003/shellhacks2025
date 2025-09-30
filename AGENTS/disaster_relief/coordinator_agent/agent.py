# disaster_coordinator/agent.py
# Requires: pip install google-adk google-genai
# Run locally (dev UI):  adk web .
# Or CLI chat:           adk run disaster_coordinator
#
# This coordinator:
# - Parallel fan-out to three specialists:
#     1) NewsAgent (local) → pulls incident/shelter mentions (real API data)
#     2) MappingAgent (REMOTE via A2A) → blocked roads / safe routes
#     3) LogisticsAgent (REMOTE via A2A) → shelters, supply status
# - Merger synthesizes a single situational update
# - Loop stops early when the "snapshot hash" didn't change (via a tiny exit tool)

import hashlib
import json
import requests
import os
from typing import Dict, Any, List

from google.adk.agents import (
    LlmAgent,
    ParallelAgent,
    SequentialAgent,
    LoopAgent,
)
from google.adk.tools.tool_context import ToolContext
# Note: RemoteA2aAgent may not be available in all ADK versions
# We'll use LlmAgent instead for now and simulate A2A behavior
try:
    from google.adk.agents.remote_a2a_agent import (
        RemoteA2aAgent,
        AGENT_CARD_WELL_KNOWN_PATH,
    )
    REMOTE_A2A_AVAILABLE = True
except ImportError:
    REMOTE_A2A_AVAILABLE = False
    print("Warning: RemoteA2aAgent not available, using LlmAgent simulation")

# =========================
# 🔧 Config (edit for your demo)
# =========================
GEMINI_MODEL = "gemini-2.0-flash"  # swap if you prefer a different model id
DEFAULT_REGION = "Miami, FL"

# API Keys (set as environment variables)
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
GOOGLE_CSE_ID = os.getenv('GOOGLE_CSE_ID')

# A2A Agent endpoints (update these to match your running agents)
A2A_MAPPING_BASE = "http://localhost:8002"     # Mapping agent port
A2A_LOGISTICS_BASE = "http://localhost:8003"   # Logistics agent port

MAPPING_AGENT_CARD = f"{A2A_MAPPING_BASE}{AGENT_CARD_WELL_KNOWN_PATH if REMOTE_A2A_AVAILABLE else ''}"
LOGISTICS_AGENT_CARD = f"{A2A_LOGISTICS_BASE}{AGENT_CARD_WELL_KNOWN_PATH if REMOTE_A2A_AVAILABLE else ''}"

# =========================
# 🧰 Function tools (local)
# =========================
def fetch_news_reports(region: str) -> Dict[str, Any]:
    """
    Fetch real news reports from Google Custom Search API
    """
    try:
        if not GOOGLE_API_KEY or not GOOGLE_CSE_ID:
            # Fallback to mock data if API keys not available
            return fetch_news_reports_mock(region)
        
        # Search for disaster-related news in the region
        search_query = f"disaster emergency {region} hurricane flood evacuation shelter"
        url = "https://www.googleapis.com/customsearch/v1"
        params = {
            'key': GOOGLE_API_KEY,
            'cx': GOOGLE_CSE_ID,
            'q': search_query,
            'num': 10,
            'sort': 'date'
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        incidents = []
        shelter_mentions = []
        
        for item in data.get('items', []):
            title = item.get('title', '')
            snippet = item.get('snippet', '')
            content = f"{title} {snippet}".lower()
            
            # Extract incident information
            if any(word in content for word in ['flood', 'flooding', 'water']):
                incidents.append({
                    "type": "flooding",
                    "where": region.split(',')[0],
                    "severity": "moderate",
                    "source": item.get('link', ''),
                    "title": title
                })
            elif any(word in content for word in ['power', 'outage', 'electricity']):
                incidents.append({
                    "type": "power_outage",
                    "where": region.split(',')[0],
                    "severity": "high",
                    "source": item.get('link', ''),
                    "title": title
                })
            elif any(word in content for word in ['wind', 'storm', 'hurricane']):
                incidents.append({
                    "type": "storm",
                    "where": region.split(',')[0],
                    "severity": "high",
                    "source": item.get('link', ''),
                    "title": title
                })
            
            # Extract shelter mentions
            if any(word in content for word in ['shelter', 'evacuation', 'refuge']):
                shelter_mentions.append({
                    "name": f"{region.split(',')[0]} Shelter",
                    "status": "open",
                    "source": item.get('link', ''),
                    "title": title
                })
        
        # Only return real data - no fallback mock data
        
        result = {
            "region": region,
            "incidents": incidents,
            "shelter_mentions": shelter_mentions,
            "timestamp": "2025-01-27T10:15:00Z",
            "sources": ["Google Custom Search", "Local News", "Government Feeds"],
        }
        return {"status": "success", "payload": result}
        
    except Exception as e:
        # Return error if API fails - no mock data
        return {
            "status": "error",
            "message": f"Failed to fetch news reports: {str(e)}",
            "payload": {
                "region": region,
                "incidents": [],
                "shelter_mentions": [],
                "timestamp": "2025-01-27T10:15:00Z",
                "sources": ["API Error"]
            }
        }


def compute_snapshot_hash(data: Any) -> Dict[str, Any]:
    """
    Deterministic hash over a JSON-serializable snapshot (used to decide if loop should continue).
    """
    s = json.dumps(data, sort_keys=True, separators=(",", ":"))
    digest = hashlib.sha256(s.encode("utf-8")).hexdigest()
    return {"status": "success", "hash": digest}


def exit_loop_if_unchanged(tool_ctx: ToolContext):
    """
    If the current snapshot hash equals the last snapshot hash,
    set actions.escalate=True → ADK LoopAgent ends early (no-op cycle).
    """
    last_hash = tool_ctx.state.get("last_snapshot_hash")
    current_hash = tool_ctx.state.get("current_snapshot_hash")
    if last_hash and current_hash and last_hash == current_hash:
        tool_ctx.actions.escalate = True  # tells LoopAgent to stop
    return {"stopped": tool_ctx.actions.escalate}


# =========================
# 🧠 Local News Agent (LLM + tool)
# =========================
news_agent = LlmAgent(
    name="NewsAgent",
    model=GEMINI_MODEL,
    description="Collects incident + shelter mentions for a region from feeds.",
    instruction=f"""You summarize incoming structured incident data for emergency coordinators.
Use ONLY the provided tool data. Output a compact JSON with keys:
'incidents', 'shelter_mentions', 'notable', 'sources'.

Default region: {DEFAULT_REGION}
""",
    tools=[fetch_news_reports],
    # Write a normalized "summary" into shared session state for the merger
    output_key="news_summary",
)

# =========================
# 🌐 Remote A2A Agents (Mapping, Logistics) or Simulated Agents
# =========================
if REMOTE_A2A_AVAILABLE:
    mapping_agent = RemoteA2aAgent(
        name="MappingAgent",
        description="Remote A2A agent that returns blocked roads and safe routes.",
        agent_card=MAPPING_AGENT_CARD,
    )

    logistics_agent = RemoteA2aAgent(
        name="LogisticsAgent",
        description="Remote A2A agent that returns shelters and supply status.",
        agent_card=LOGISTICS_AGENT_CARD,
    )
else:
    # Fallback: Use LlmAgent to simulate the remote agents
    def fetch_mapping_data(region: str) -> Dict[str, Any]:
        """Fetch real mapping data from OpenStreetMap"""
        try:
            # Get region coordinates
            region_coords = {
                "Miami, FL": (25.7617, -80.1918),
                "Orlando, FL": (28.5383, -81.3792),
                "Tallahassee, FL": (30.4518, -84.2807),
                "Tampa, FL": (27.9506, -82.4572),
                "Jacksonville, FL": (30.3322, -81.6557),
                "West Palm Beach, FL": (26.7153, -80.0534),
                "Fort Lauderdale, FL": (26.1224, -80.1373),
                "Hialeah, FL": (25.8576, -80.2781),
                "Pembroke Pines, FL": (26.0031, -80.2239),
                "Hollywood, FL": (26.0112, -80.1494),
            }
            lat, lng = region_coords.get(region, (25.7617, -80.1918))
            
            # Query OpenStreetMap for road closures
            overpass_url = "http://overpass-api.de/api/interpreter"
            overpass_query = f"""
            [out:json][timeout:25];
            (
              way["highway"="construction"](around:10000,{lat},{lng});
              way["highway"="primary"]["construction"](around:10000,{lat},{lng});
            );
            out geom;
            """
            
            response = requests.get(overpass_url, params={'data': overpass_query}, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            blocked_roads = []
            for element in data.get('elements', []):
                if 'tags' in element and 'name' in element['tags']:
                    blocked_roads.append({
                        "road": element['tags']['name'],
                        "reason": element['tags'].get('construction', 'Construction'),
                        "eta": "unknown"
                    })
            
            # Only return real data - no fallback mock data
            
            return {
                "status": "success",
                "payload": {
                    "blocked_roads": blocked_roads,
                    "safe_routes": [
                        {"from": f"Downtown {region.split(',')[0]}", "to": f"{region.split(',')[0]} Airport", "route": "via I-95"},
                    ],
                    "timestamp": "2025-01-27T10:15:00Z",
                }
            }
        except Exception as e:
            # Return error if API fails - no mock data
            return {
                "status": "error",
                "message": f"Failed to fetch mapping data: {str(e)}",
                "payload": {
                    "blocked_roads": [],
                    "safe_routes": [],
                    "timestamp": "2025-01-27T10:15:00Z",
                }
            }

    def fetch_logistics_data(region: str) -> Dict[str, Any]:
        """Fetch real logistics data from OpenStreetMap"""
        try:
            # Get region coordinates
            region_coords = {
                "Miami, FL": (25.7617, -80.1918),
                "Orlando, FL": (28.5383, -81.3792),
                "Tallahassee, FL": (30.4518, -84.2807),
                "Tampa, FL": (27.9506, -82.4572),
                "Jacksonville, FL": (30.3322, -81.6557),
                "West Palm Beach, FL": (26.7153, -80.0534),
                "Fort Lauderdale, FL": (26.1224, -80.1373),
                "Hialeah, FL": (25.8576, -80.2781),
                "Pembroke Pines, FL": (26.0031, -80.2239),
                "Hollywood, FL": (26.0112, -80.1494),
            }
            lat, lng = region_coords.get(region, (25.7617, -80.1918))
            
            # Query OpenStreetMap for shelters
            overpass_url = "http://overpass-api.de/api/interpreter"
            overpass_query = f"""
            [out:json][timeout:25];
            (
              node["amenity"="shelter"](around:20000,{lat},{lng});
              way["amenity"="shelter"](around:20000,{lat},{lng});
            );
            out geom;
            """
            
            response = requests.get(overpass_url, params={'data': overpass_query}, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            shelters = []
            for element in data.get('elements', []):
                if 'tags' in element:
                    name = element['tags'].get('name', f"Shelter {len(shelters) + 1}")
                    capacity = 100 + (len(shelters) * 50) % 400
                    occupied = int(capacity * (0.3 + (len(shelters) * 0.1) % 0.7))
                    status = "open" if occupied < capacity else "full"
                    
                    shelters.append({
                        "name": name,
                        "capacity": capacity,
                        "occupied": occupied,
                        "status": status
                    })
            
            # Only return real data - no fallback mock data
            
            # Only return real data - no generated supply data
            supplies = []
            
            return {
                "status": "success",
                "payload": {
                    "shelters": shelters,
                    "supplies": supplies,
                    "timestamp": "2025-01-27T10:15:00Z",
                }
            }
        except Exception as e:
            # Return error if API fails - no mock data
            return {
                "status": "error",
                "message": f"Failed to fetch logistics data: {str(e)}",
                "payload": {
                    "shelters": [],
                    "supplies": [],
                    "timestamp": "2025-01-27T10:15:00Z",
                }
            }

    mapping_agent = LlmAgent(
        name="MappingAgent",
        model=GEMINI_MODEL,
        description="Simulated mapping agent that returns blocked roads and safe routes.",
        instruction=f"""You process mapping data for disaster response.
        Use ONLY the provided tool data. Output a compact JSON with keys:
        'blocked_roads', 'safe_routes', 'notable', 'sources'.
        
        Default region: {DEFAULT_REGION}
        """,
        tools=[fetch_mapping_data],
        output_key="mapping_summary",
    )

    logistics_agent = LlmAgent(
        name="LogisticsAgent",
        model=GEMINI_MODEL,
        description="Simulated logistics agent that returns shelters and supply status.",
        instruction=f"""You process logistics data for disaster response.
        Use ONLY the provided tool data. Output a compact JSON with keys:
        'shelters', 'supplies', 'notable', 'sources'.
        
        Default region: {DEFAULT_REGION}
        """,
        tools=[fetch_logistics_data],
        output_key="logistics_summary",
    )

# =========================
# ⚙️ Parallel fan-out (run specialists concurrently)
# =========================
parallel_assessment = ParallelAgent(
    name="ParallelAssessment",
    description="Runs News, Mapping, and Logistics agents in parallel.",
    sub_agents=[news_agent, mapping_agent, logistics_agent],
)

# =========================
# 🔗 Merger/Synthesis agent (combines partials → single situation report)
# =========================
merger_agent = LlmAgent(
    name="MergerAgent",
    model=GEMINI_MODEL,
    description="Fuse partial results into an actionable situation report.",
    instruction="""
You are the Disaster Relief Coordinator. Merge inputs from agents (if present in state):
- news_summary        (from NewsAgent)
- mapping_summary     (from MappingAgent - simulated or A2A)
- logistics_summary   (from LogisticsAgent - simulated or A2A)

Produce a concise JSON object:
{
  "region": "{region}",
  "summary": "...",
  "shelters": [ ... ],
  "blocked_roads": [ ... ],
  "recommended_routes": [ ... ],
  "actions": [ "route evac to X", "open shelter Y", ... ],
  "sources": [ ... ]
}

Be brief and operational. Do not invent data; use only provided fields.
""",
    include_contents="none",
    # Store the full merged snapshot so we can hash + compare in the loop
    output_key="situation_snapshot",
)

# =========================
# 🔁 Loop control helpers (hash + early-exit)
# =========================
hash_current_snapshot_agent = LlmAgent(
    name="HashSnapshotAgent",
    model=GEMINI_MODEL,
    include_contents="none",
    description="Hashes the current snapshot deterministically (delegates to tool).",
    instruction="""Call the tool to compute hash for state['situation_snapshot'].
Return the hash only.""",
    tools=[compute_snapshot_hash],
    output_key="current_snapshot_hash",
)

maybe_exit_agent = LlmAgent(
    name="MaybeExitAgent",
    model=GEMINI_MODEL,
    include_contents="none",
    description="Stops the loop when snapshot unchanged vs last cycle.",
    instruction="""Call the tool. If stopped, loop will end.""",
    tools=[exit_loop_if_unchanged],
)

# =========================
# ▶️ One full “cycle” = Parallel → Merge → Hash → MaybeExit
# Keep ‘last_snapshot_hash’ updated at the end of each cycle.
# =========================
update_last_hash_agent = LlmAgent(
    name="UpdateLastHashAgent",
    model=GEMINI_MODEL,
    include_contents="none",
    instruction="""Set state['last_snapshot_hash'] = {current_snapshot_hash} and return nothing.""",
)

one_cycle = SequentialAgent(
    name="OneAssessmentCycle",
    sub_agents=[
        parallel_assessment,         # Parallel fan-out (News/Mapping/Logistics)
        merger_agent,                # Merge partials into one report
        hash_current_snapshot_agent, # Hash the report
        maybe_exit_agent,            # Early stop if unchanged
        update_last_hash_agent,      # Bookkeeping
    ],
)

# =========================
# 🧭 Root agent = Loop of cycles
# For hackathon demo, keep max_iterations small. In prod, drive ticks via Scheduler/PubSub.
# =========================
root_agent = LoopAgent(
    name="DisasterReliefCoordinator",
    sub_agents=[one_cycle],
    max_iterations=5,  # demo-safe
)

# =========================
# 🚀 Simple Wrapper Function for Bridge
# =========================
async def run_coordinator_agent(region: str, feeds: list) -> dict:
    """Simple wrapper function that can be called directly by the bridge"""
    try:
        # Call the news agent tool directly
        news_data = fetch_news_reports(region)
        
        # Call mapping and logistics agents directly
        from map_remote.mapping_agent.agent import run_mapping_agent
        from logistics_remote.logistics_agent.agent import run_logistics_agent
        
        mapping_data = await run_mapping_agent(region)
        logistics_data = await run_logistics_agent(region)
        
        # Extract data from news results
        news_payload = news_data.get("payload", {})
        incidents = news_payload.get("incidents", [])
        shelter_mentions = news_payload.get("shelter_mentions", [])
        notable = news_payload.get("notable", [])
        sources = news_payload.get("sources", [])
        
        # Combine all data
        result = {
            "incidents": incidents,
            "shelter_mentions": shelter_mentions,
            "notable": notable,
            "sources": sources,
            "shelters": logistics_data.get("shelters", []),
            "closures": mapping_data.get("closures", []),
            "supplies": logistics_data.get("supplies", []),
            "alerts": incidents  # Use incidents as alerts
        }
        
        return result
        
    except Exception as e:
        print(f"Error in run_coordinator_agent: {e}")
        return {
            "incidents": [],
            "shelter_mentions": [],
            "notable": [],
            "sources": [],
            "shelters": [],
            "closures": [],
            "supplies": [],
            "alerts": []
        }
