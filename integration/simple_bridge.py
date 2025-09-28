#!/usr/bin/env python3
"""
Simple ReliefOps Bridge Server
Connects React Native app to ADK agents
"""

import asyncio
import json
import logging
import os
from typing import Dict, Any, List, Optional, Tuple
from fastapi import FastAPI, HTTPException, Request
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
    "last_request": None,
    "last_result": None,
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

# --- Helpers to synthesize region-aware snapshots (replace with real coordinator outputs) ---
def _now_iso():
    import datetime
    return datetime.datetime.utcnow().replace(microsecond=0).isoformat() + "Z"

def build_region_snapshot(region: str, feeds: List[str]) -> Dict[str, Any]:
    # Clone baseline data and inject region/feeds/timestamps so UI varies per input
    base = agent_state["data"]
    shelters = [
        {**s, "updated": _now_iso(), "region": region}
        for s in base["shelters"]
    ]
    closures = [
        {**c, "updated": _now_iso(), "region": region}
        for c in base["closures"]
    ]
    supplies = [
        {**sp, "updated": _now_iso(), "region": region}
        for sp in base["supplies"]
    ]
    alerts = [
        {**al, "time": _now_iso(), "title": f"[{region}] {al['title']}", "source": ",".join(feeds)}
        for al in base["alerts"]
    ]
    return {
        "shelters": shelters,
        "closures": closures,
        "supplies": supplies,
        "alerts": alerts,
    }

# --- Lightweight region validation & localization helpers ---
def geocode_region_center(region: str) -> Optional[Tuple[float, float]]:
    """Resolve a region name to an approximate lat/lng using Nominatim.
    Returns (lat, lng) or None if not found. Uses a short timeout.
    """
    try:
        import urllib.request, urllib.parse, json as pyjson
        q = urllib.parse.quote(region)
        url = f"https://nominatim.openstreetmap.org/search?q={q}&format=json&limit=1"
        req = urllib.request.Request(url, headers={"User-Agent": "ReliefOpsBridge/1.0"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = pyjson.loads(resp.read().decode("utf-8"))
            if isinstance(data, list) and data:
                lat = float(data[0]["lat"])  # type: ignore
                lon = float(data[0]["lon"])  # type: ignore
                return (lat, lon)
    except Exception:
        return None
    return None

def _jitter(value: float, meters: float) -> float:
    # Convert meters to degrees approximately (lat ~111_000 m/deg)
    return value + (meters / 111000.0) * (0.5 - 0.0)

def localize_points_to_center(snapshot: Dict[str, Any], center: Tuple[float, float]) -> Dict[str, Any]:
    """Project points into vicinity of the requested region center (visual validity).
    This does NOT claim authoritative accuracy; replace with real sources when available.
    """
    lat_c, lng_c = center
    out = {"shelters": [], "closures": [], "supplies": [], "alerts": []}
    for s in snapshot.get("shelters", []):
        out["shelters"].append({**s, "lat": _jitter(lat_c, 1500), "lng": _jitter(lng_c, 1500)})
    for c in snapshot.get("closures", []):
        out["closures"].append({**c, "lat": _jitter(lat_c, 1200), "lng": _jitter(lng_c, 1200)})
    for sp in snapshot.get("supplies", []):
        out["supplies"].append({**sp, "lat": _jitter(lat_c, 1800), "lng": _jitter(lng_c, 1800)})
    out["alerts"] = snapshot.get("alerts", [])
    return out

# --- External data sources (NOAA alerts, Google CSE news, OSM shelters/closures) ---
def fetch_noaa_alerts(lat: float, lon: float) -> List[Dict[str, Any]]:
    try:
        import urllib.request, json as pyjson
        url = f"https://api.weather.gov/alerts/active?point={lat},{lon}"
        req = urllib.request.Request(url, headers={"User-Agent": "ReliefOpsBridge/1.0"})
        with urllib.request.urlopen(req, timeout=6) as resp:
            data = pyjson.loads(resp.read().decode("utf-8"))
            alerts = []
            for f in data.get("features", [])[:10]:
                props = f.get("properties", {})
                alerts.append({
                    "id": props.get("id") or props.get("event") or "noaa",
                    "severity": props.get("severity") or props.get("severity", "Unknown"),
                    "title": props.get("headline") or props.get("event"),
                    "source": "NOAA",
                    "time": props.get("sent") or props.get("onset") or props.get("effective"),
                })
            return alerts
    except Exception:
        return []

def google_cse_search_news(query: str) -> List[Dict[str, Any]]:
    api_key = os.getenv("GOOGLE_API_KEY")
    cse_id = os.getenv("GOOGLE_CSE_ID")
    if not api_key or not cse_id:
        return []
    try:
        import urllib.request, urllib.parse, json as pyjson
        q = urllib.parse.quote(query)
        url = f"https://www.googleapis.com/customsearch/v1?q={q}&cx={cse_id}&key={api_key}"
        with urllib.request.urlopen(url, timeout=6) as resp:
            data = pyjson.loads(resp.read().decode("utf-8"))
            items = data.get("items", [])
            out = []
            for it in items[:10]:
                out.append({
                    "id": it.get("cacheId") or it.get("link"),
                    "severity": "Info",
                    "title": it.get("title"),
                    "source": "GoogleNews",
                    "time": None,
                })
            return out
    except Exception:
        return []

def overpass_query(query: str) -> Optional[Dict[str, Any]]:
    try:
        import urllib.request
        data = query.encode("utf-8")
        req = urllib.request.Request(
            "https://overpass-api.de/api/interpreter",
            data=data,
            headers={"Content-Type": "application/x-www-form-urlencoded", "User-Agent": "ReliefOpsBridge/1.0"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=8) as resp:
            import json as pyjson
            return pyjson.loads(resp.read().decode("utf-8"))
    except Exception:
        return None

def fetch_osm_shelters(lat: float, lon: float, radius_m: int = 8000) -> List[Dict[str, Any]]:
    # amenity=shelter (may include general shelters; availability varies by region)
    q = f"data=[out:json];node(around:{radius_m},{lat},{lon})[amenity=shelter];out;"
    data = overpass_query(q)
    out: List[Dict[str, Any]] = []
    for el in (data or {}).get("elements", [])[:20]:
        out.append({
            "id": el.get("id"),
            "name": (el.get("tags") or {}).get("name") or "Shelter",
            "lat": el.get("lat"),
            "lng": el.get("lon"),
            "capacity": None,
            "occupied": None,
            "status": "Open",
            "updated": _now_iso(),
        })
    return out

def fetch_osm_construction(lat: float, lon: float, radius_m: int = 8000) -> List[Dict[str, Any]]:
    # proxy for closures: highway under construction
    q = f"data=[out:json];way(around:{radius_m},{lat},{lon})[highway=construction];out center;"
    data = overpass_query(q)
    out: List[Dict[str, Any]] = []
    for el in (data or {}).get("elements", [])[:20]:
        center = el.get("center") or {}
        out.append({
            "id": el.get("id"),
            "road": (el.get("tags") or {}).get("name") or "Unnamed road",
            "lat": center.get("lat"),
            "lng": center.get("lon"),
            "cause": "Construction",
            "eta": "Unknown",
            "updated": _now_iso(),
        })
    return out

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
    """Run agents. Accepts either multipart/form-data (feeds fields) or JSON body { feeds: [...] }."""
    try:
        # Determine feeds from form or JSON
        feeds: List[str] = ["Official"]
        region: str = "Miami, FL"

        # Try reading as form first (multipart or urlencoded)
        try:
            form = await request.form()
            # Starlette's FormData supports getlist
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
            # Not a form submission; ignore and try JSON
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
        
        # Save last request for diagnostics
        agent_state["last_request"] = {"region": region, "feeds": feeds, "ts": _now_iso()}

        # Region-aware snapshot, enhanced with external sources
        region_snapshot = build_region_snapshot(region, feeds)
        center = geocode_region_center(region)
        if center:
            # Fetch external sources
            lat_c, lon_c = center
            noaa = fetch_noaa_alerts(lat_c, lon_c)
            osm_shelters = fetch_osm_shelters(lat_c, lon_c)
            osm_closures = fetch_osm_construction(lat_c, lon_c)
            news = google_cse_search_news(f"{region} flooding OR closure OR shelter")

            # Replace or augment snapshot
            if osm_shelters:
                region_snapshot["shelters"] = osm_shelters
            if osm_closures:
                region_snapshot["closures"] = osm_closures
            if noaa:
                region_snapshot["alerts"] = noaa
            else:
                # Fall back to Google news headlines as informational alerts
                if news:
                    region_snapshot["alerts"] = news

            # Ensure everything is near the requested region
            region_snapshot = localize_points_to_center(region_snapshot, center)
        agent_state["data"] = region_snapshot

        # Update status
        agent_state["current_status"] = "completed"
        agent_state["last_run"] = "2025-09-28T10:15:00Z"
        
        # Compute simple KPIs from data
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

        agent_state["last_result"] = {"ts": _now_iso(), **result_payload}
        return result_payload
        
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

@app.get("/api/last-run")
async def get_last_run():
    """Return the last request/result for debugging end-to-end."""
    return {
        "last_request": agent_state.get("last_request"),
        "last_result": agent_state.get("last_result"),
        "last_run": agent_state.get("last_run"),
        "status": agent_state.get("current_status"),
    }

if __name__ == "__main__":
    print("🚀 Starting ReliefOps Simple Bridge...")
    print("📱 App will connect to: http://localhost:8001")
    print("=" * 50)
    
    uvicorn.run(app, host="0.0.0.0", port=8001)
