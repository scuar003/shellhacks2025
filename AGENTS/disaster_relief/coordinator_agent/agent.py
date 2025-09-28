# disaster_coordinator/agent.py
# Requires: pip install google-adk google-genai
# Run locally (dev UI):  adk web .
# Or CLI chat:           adk run disaster_coordinator
#
# This coordinator:
# - Parallel fan-out to three specialists:
#     1) NewsAgent (local) → pulls incident/shelter mentions (mock/tool-backed)
#     2) MappingAgent (REMOTE via A2A) → blocked roads / safe routes
#     3) LogisticsAgent (REMOTE via A2A) → shelters, supply status
# - Merger synthesizes a single situational update
# - Loop stops early when the “snapshot hash” didn’t change (via a tiny exit tool)

import hashlib
import json
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
    Mock "news/feed" fetcher. In your hack, replace with a real source:
    - RSS, X, government feeds, or a thin server that queries them.
    Return a normalized structure so the LLM stays predictable.
    """
    sample = {
        "region": region,
        "incidents": [
            {"type": "flooding", "where": "Little Havana", "severity": "moderate"},
            {"type": "power_outage", "where": "Wynwood", "severity": "high"},
        ],
        "shelter_mentions": [
            {"name": "Jose Marti Park Shelter", "status": "open"},
            {"name": "Civic Center Gym", "status": "at_capacity"},
        ],
        "timestamp": "2025-09-28T10:15:00Z",
        "sources": ["mock/local-news", "mock/oem-bulletin"],
    }
    return {"status": "success", "payload": sample}


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
    instruction="""You summarize incoming structured incident data for emergency coordinators.
Use ONLY the provided tool data. Output a compact JSON with keys:
'incidents', 'shelter_mentions', 'notable', 'sources'.
""",
    tools=[fetch_news_reports],
    # Write a normalized “summary” into shared session state for the merger
    output_key="news_summary",
    # Provide the default region via state templating (UI or caller can override)
    system_prompt_overrides={"region": DEFAULT_REGION},
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
        """Simulate mapping agent data"""
        return {
            "status": "success",
            "payload": {
                "blocked_roads": [
                    {"road": "US-1 @ 88th St", "reason": "flooding", "eta": "unknown"},
                    {"road": "I-95 N ramp", "reason": "debris", "eta": "3h"},
                ],
                "safe_routes": [
                    {"from": "Downtown", "to": "Airport", "route": "via I-395"},
                ],
                "timestamp": "2025-09-28T10:15:00Z",
            }
        }

    def fetch_logistics_data(region: str) -> Dict[str, Any]:
        """Simulate logistics agent data"""
        return {
            "status": "success",
            "payload": {
                "shelters": [
                    {"name": "Civic Center", "capacity": 300, "occupied": 190, "status": "open"},
                    {"name": "Norland High", "capacity": 250, "occupied": 250, "status": "full"},
                ],
                "supplies": [
                    {"site": "Jose Marti Park", "items": ["Water", "Food"], "stock_pct": 70},
                ],
                "timestamp": "2025-09-28T10:15:00Z",
            }
        }

    mapping_agent = LlmAgent(
        name="MappingAgent",
        model=GEMINI_MODEL,
        description="Simulated mapping agent that returns blocked roads and safe routes.",
        instruction="""You process mapping data for disaster response.
        Use ONLY the provided tool data. Output a compact JSON with keys:
        'blocked_roads', 'safe_routes', 'notable', 'sources'.
        """,
        tools=[fetch_mapping_data],
        output_key="mapping_summary",
        system_prompt_overrides={"region": DEFAULT_REGION},
    )

    logistics_agent = LlmAgent(
        name="LogisticsAgent",
        model=GEMINI_MODEL,
        description="Simulated logistics agent that returns shelters and supply status.",
        instruction="""You process logistics data for disaster response.
        Use ONLY the provided tool data. Output a compact JSON with keys:
        'shelters', 'supplies', 'notable', 'sources'.
        """,
        tools=[fetch_logistics_data],
        output_key="logistics_summary",
        system_prompt_overrides={"region": DEFAULT_REGION},
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
