import os
import io
import asyncio
import uuid
import json
import re
import time
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv

load_dotenv(override=True)

app = FastAPI(title="EcoBot AI Backend")

# ─── CORS (allow Vite dev server) ─────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Config ───────────────────────────────────────────
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:latest")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
TTS_VOICE = os.getenv("TTS_VOICE", "en-US-AriaNeural")  # High-quality Microsoft Neural voice
AQI_PROVIDER = os.getenv("AQI_PROVIDER", "auto").strip().lower()
AQI_API_KEY = os.getenv("AQI_API_KEY", "").strip()
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", os.getenv("VITE_GOOGLE_MAPS_API_KEY", "")).strip()
GOOGLE_AIR_QUALITY_API_KEY = os.getenv("GOOGLE_AIR_QUALITY_API_KEY", GOOGLE_MAPS_API_KEY).strip()
OLLAMA_NUM_CTX = int(os.getenv("OLLAMA_NUM_CTX", "768"))
OLLAMA_NUM_PREDICT = int(os.getenv("OLLAMA_NUM_PREDICT", "80"))
OLLAMA_TEMPERATURE = float(os.getenv("OLLAMA_TEMPERATURE", "0.2"))
OLLAMA_KEEP_ALIVE = os.getenv("OLLAMA_KEEP_ALIVE", "20m")
OLLAMA_MAX_SENTENCES = int(os.getenv("OLLAMA_MAX_SENTENCES", "2"))
OLLAMA_MAP_NUM_CTX = int(os.getenv("OLLAMA_MAP_NUM_CTX", "512"))
OLLAMA_MAP_NUM_PREDICT = int(os.getenv("OLLAMA_MAP_NUM_PREDICT", "40"))
OLLAMA_MAP_MAX_SENTENCES = int(os.getenv("OLLAMA_MAP_MAX_SENTENCES", "1"))
AQI_CACHE_TTL_SECONDS = int(os.getenv("AQI_CACHE_TTL_SECONDS", "60"))
AUDIO_DIR = Path("audio_cache")
AUDIO_DIR.mkdir(exist_ok=True)

AQI_CACHE: dict[tuple[float, float, str], tuple[float, dict]] = {}

IARE_DATA = {
    "name": "IARE",
    "full_name": "Institute of Aeronautical Engineering",
    "center": {"lat": 17.6001, "lng": 78.4175},
    "buildings": [
        {"name": "Bharadwaja Block", "lat": 17.599903, "lng": 78.416924, "type": "academic"},
        {"name": "Abdul Kalam Block", "lat": 17.599639, "lng": 78.417294, "type": "academic"},
        {"name": "Aryabhatta Block", "lat": 17.599878, "lng": 78.417661, "type": "academic"},
        {"name": "5th Block", "lat": 17.599799, "lng": 78.418182, "type": "academic"},
        {"name": "IT Park", "lat": 17.600183, "lng": 78.418238, "type": "academic"},
        {"name": "TIIC Center", "lat": 17.600462, "lng": 78.416978, "type": "facility"},
        {"name": "IARE Canteen", "lat": 17.600247, "lng": 78.418606, "type": "facility"},
        {"name": "Engineering Workshop", "lat": 17.599523, "lng": 78.418172, "type": "facility"},
        {"name": "Indoor Badminton Court", "lat": 17.600932, "lng": 78.417066, "type": "sports"},
        {"name": "Basketball Court", "lat": 17.599784, "lng": 78.418563, "type": "sports"},
        {"name": "IARE Parking", "lat": 17.600968, "lng": 78.417310, "type": "facility"},
        {"name": "Car Parking", "lat": 17.600607, "lng": 78.417410, "type": "facility"},
        {"name": "Main Entrance", "lat": 17.600372, "lng": 78.416849, "type": "entrance"},
    ],
}

# ─── Pydantic Models ─────────────────────────────────
class AIRequest(BaseModel):
    user_voice_text: str
    current_aqi: int
    location: str
    indoor_data: Optional[str] = None  # Optional room sensor context
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    response_style: Optional[str] = None

class TTSRequest(BaseModel):
    text: str
    voice: Optional[str] = None

# ─── Health Check ─────────────────────────────────────
@app.get("/")
def read_root():
    return {"status": "Backend is running!", "ollama_model": OLLAMA_MODEL, "tts_voice": TTS_VOICE}

# ─── Check if Ollama is available ─────────────────────
async def check_ollama() -> bool:
    try:
        import httpx
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(f"{OLLAMA_URL}/api/tags")
            return resp.status_code == 200
    except Exception:
        return False


def get_aqi_category(aqi: int) -> str:
    if aqi <= 50:
        return "Good"
    if aqi <= 100:
        return "Moderate"
    if aqi <= 150:
        return "Unhealthy for Sensitive"
    if aqi <= 200:
        return "Unhealthy"
    if aqi <= 300:
        return "Very Unhealthy"
    return "Hazardous"


def _approx_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Fast local distance approximation in meters."""
    dlat = (lat1 - lat2) * 111320.0
    dlon = (lon1 - lon2) * 111320.0 * max(0.1, abs(__import__('math').cos((lat1 + lat2) / 2 * __import__('math').pi / 180)))
    return (dlat * dlat + dlon * dlon) ** 0.5


def get_iare_context(query: str, location: str, latitude: Optional[float], longitude: Optional[float]) -> str:
    """Return concise IARE knowledge context when user asks about campus or is nearby."""
    q = (query or "").lower()
    loc = (location or "").lower()
    mentions_iare = any(token in q or token in loc for token in ["iare", "institute of aeronautical engineering", "dundigal", "campus", "block", "canteen", "workshop"])

    near_iare = False
    nearest_building = None
    nearest_dist = None

    if latitude is not None and longitude is not None:
        center = IARE_DATA["center"]
        center_dist = _approx_distance_m(latitude, longitude, center["lat"], center["lng"])
        near_iare = center_dist <= 2500

        for b in IARE_DATA["buildings"]:
            d = _approx_distance_m(latitude, longitude, b["lat"], b["lng"])
            if nearest_dist is None or d < nearest_dist:
                nearest_dist = d
                nearest_building = b

    if not mentions_iare and not near_iare:
        return ""

    building_names = ", ".join([b["name"] for b in IARE_DATA["buildings"]])
    nearest_line = ""
    if nearest_building and nearest_dist is not None:
        nearest_line = f"- Nearest IARE point: {nearest_building['name']} ({nearest_building['type']}), ~{int(round(nearest_dist))}m away."

    return (
        "IARE CAMPUS DATA:\n"
        f"- Campus: {IARE_DATA['full_name']} ({IARE_DATA['name']}) near Dundigal, Hyderabad.\n"
        f"- Known campus points: {building_names}.\n"
        f"{nearest_line}\n"
        "- If user asks for building-specific air quality/safety, tailor guidance to that building context."
    )


# ─── City Detection & Geocoding ───────────────────────
GEOCODE_CACHE: dict[str, tuple[float, dict]] = {}
GEOCODE_CACHE_TTL_SECONDS = int(os.getenv("GEOCODE_CACHE_TTL_SECONDS", "43200"))

# Region/state fallbacks where public geocoding can be inconsistent.
# Coordinates point to major reference city/centroid in the region for AQI lookup.
COMMON_REGIONS = {
    "tamil nadu": {"name": "Tamil Nadu", "lat": 13.0827, "lon": 80.2707},
    "andhra pradesh": {"name": "Andhra Pradesh", "lat": 16.5062, "lon": 80.6480},
    "telangana": {"name": "Telangana", "lat": 17.3850, "lon": 78.4867},
    "karnataka": {"name": "Karnataka", "lat": 12.9716, "lon": 77.5946},
    "kerala": {"name": "Kerala", "lat": 8.5241, "lon": 76.9366},
    "maharashtra": {"name": "Maharashtra", "lat": 19.0760, "lon": 72.8777},
    "gujarat": {"name": "Gujarat", "lat": 23.0225, "lon": 72.5714},
    "rajasthan": {"name": "Rajasthan", "lat": 26.9124, "lon": 75.7873},
    "uttar pradesh": {"name": "Uttar Pradesh", "lat": 26.8467, "lon": 80.9462},
    "west bengal": {"name": "West Bengal", "lat": 22.5726, "lon": 88.3639},
    "delhi ncr": {"name": "Delhi NCR", "lat": 28.6139, "lon": 77.2090},
}

def _extract_location_candidates(query: str) -> list[str]:
    q = (query or "").strip()
    if not q:
        return []

    q_lower = q.lower()
    candidates: list[str] = []

    patterns = [
        r"\b(?:aqi|air quality|pollution)\s+(?:in|at|for|of|near)\s+([a-z][a-z\s\-]{1,60})",
        r"\b(?:in|at|for|of|near|around)\s+([a-z][a-z\s\-]{1,60})",
    ]

    stop_words = {
        "today", "now", "please", "current", "currently", "right now", "weather",
        "air", "quality", "aqi", "pollution", "the", "my", "your", "me",
    }

    for pattern in patterns:
        for match in re.finditer(pattern, q_lower):
            phrase = (match.group(1) or "").strip(" ?!.,")
            if not phrase:
                continue
            words = []
            for token in phrase.split():
                if token in stop_words:
                    break
                words.append(token)
            normalized = " ".join(words[:4]).strip()
            if normalized and normalized not in candidates:
                candidates.append(normalized)

    if not candidates:
        stripped = re.sub(r"[^a-zA-Z\s\-]", " ", q).strip().lower()
        words = [w for w in stripped.split() if w not in stop_words]
        if 1 <= len(words) <= 4:
            fallback_candidate = " ".join(words)
            if fallback_candidate:
                candidates.append(fallback_candidate)

    return candidates


async def _geocode_with_google_maps(place_query: str) -> Optional[dict]:
    if not GOOGLE_MAPS_API_KEY:
        return None

    try:
        import httpx
        import urllib.parse

        encoded_query = urllib.parse.quote(place_query)
        url = f"https://maps.googleapis.com/maps/api/geocode/json?address={encoded_query}&key={GOOGLE_MAPS_API_KEY}"

        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(url)
            if res.status_code != 200:
                return None
            payload = res.json()

        if payload.get("status") != "OK":
            return None

        result = (payload.get("results") or [None])[0]
        if not result:
            return None

        geometry = (result.get("geometry") or {}).get("location") or {}
        lat = geometry.get("lat")
        lon = geometry.get("lng")
        if lat is None or lon is None:
            return None

        components = result.get("address_components") or []
        locality = next((c.get("long_name") for c in components if "locality" in (c.get("types") or [])), None)
        admin1 = next((c.get("long_name") for c in components if "administrative_area_level_1" in (c.get("types") or [])), None)
        country = next((c.get("long_name") for c in components if "country" in (c.get("types") or [])), None)

        display_name = locality or admin1 or result.get("formatted_address") or place_query

        return {
            "name": display_name,
            "lat": float(lat),
            "lon": float(lon),
            "country": country,
        }
    except Exception:
        return None


async def _geocode_with_open_meteo(place_query: str) -> Optional[dict]:
    try:
        import httpx
        import urllib.parse

        encoded_city = urllib.parse.quote(place_query)
        url = f"https://geocoding-api.open-meteo.com/v1/search?name={encoded_city}&count=1&language=en&format=json"

        async with httpx.AsyncClient(timeout=4.0) as client:
            res = await client.get(url)
            if res.status_code != 200:
                return None
            results = (res.json().get("results") or [])
            if not results:
                return None

            top = results[0]
            return {
                "name": top.get("name") or place_query.title(),
                "lat": float(top.get("latitude")),
                "lon": float(top.get("longitude")),
                "country": top.get("country"),
            }
    except Exception:
        return None


async def extract_and_geocode_city(query: str) -> Optional[dict]:
    """
    Detect if user is asking about a specific city and return its coordinates.
    Returns {name, lat, lon} or None if no city detected.
    """
    candidates = _extract_location_candidates(query)
    if not candidates:
        return None

    now = time.time()
    for candidate in candidates:
        candidate_key = candidate.lower().strip()
        if not candidate_key:
            continue

        cached = GEOCODE_CACHE.get(candidate_key)
        if cached and (now - cached[0] <= GEOCODE_CACHE_TTL_SECONDS):
            return cached[1]

        if candidate_key in COMMON_REGIONS:
            region = COMMON_REGIONS[candidate_key]
            result = {
                "name": region["name"],
                "lat": region["lat"],
                "lon": region["lon"],
            }
            GEOCODE_CACHE[candidate_key] = (now, result)
            return result

        google_result = await _geocode_with_google_maps(candidate)
        if google_result:
            result = {
                "name": google_result["name"],
                "lat": google_result["lat"],
                "lon": google_result["lon"],
            }
            GEOCODE_CACHE[candidate_key] = (now, result)
            return result

        open_meteo_result = await _geocode_with_open_meteo(candidate)
        if open_meteo_result:
            result = {
                "name": open_meteo_result["name"],
                "lat": open_meteo_result["lat"],
                "lon": open_meteo_result["lon"],
            }
            GEOCODE_CACHE[candidate_key] = (now, result)
            return result

    return None


async def fetch_live_aqi_snapshot(latitude: float, longitude: float) -> Optional[dict]:
    """Fetch exact AQI and key pollutants for precise coordinate grounding."""
    lat_key = round(latitude, 4)
    lon_key = round(longitude, 4)
    cache_key = (lat_key, lon_key, "aqi:auto")
    now = time.time()

    cached = AQI_CACHE.get(cache_key)
    if cached and (now - cached[0] <= AQI_CACHE_TTL_SECONDS):
        return cached[1]

    try:
        import httpx

        def _to_float(value, default=0.0) -> float:
            try:
                return float(value)
            except Exception:
                return float(default)

        def _google_index_to_aqi(payload: dict) -> Optional[int]:
            indexes = ((payload.get("indexes") or []))
            if not indexes:
                return None

            preferred = None
            for idx in indexes:
                idx_code = (idx.get("code") or "").lower()
                if idx_code in {"uaqi", "us_aqi", "usaqi"}:
                    preferred = idx
                    break
            if preferred is None:
                preferred = indexes[0]

            aqi_value = preferred.get("aqi")
            if aqi_value is None:
                return None
            return int(round(_to_float(aqi_value, 0)))

        def _google_pollutants(payload: dict) -> dict:
            pollutants = payload.get("pollutants") or []
            pollutant_map = {((p.get("code") or "").lower()): p for p in pollutants}

            def concentration_for(*codes: str) -> float:
                for code in codes:
                    item = pollutant_map.get(code.lower())
                    if not item:
                        continue
                    concentration = item.get("concentration") or {}
                    value = concentration.get("value")
                    if value is not None:
                        return round(_to_float(value, 0), 2)
                return 0.0

            return {
                "pm2_5": concentration_for("pm2_5", "pm25"),
                "pm10": concentration_for("pm10"),
                "co": concentration_for("co"),
                "no2": concentration_for("no2"),
                "so2": concentration_for("so2"),
                "ozone": concentration_for("o3", "ozone"),
            }

        provider_sequence: list[str] = []
        if AQI_PROVIDER in {"auto", "google", "google-maps", "maps"} and GOOGLE_AIR_QUALITY_API_KEY:
            provider_sequence.append("google")
        if AQI_PROVIDER in {"auto", "waqi"} and AQI_API_KEY:
            provider_sequence.append("waqi")
        if AQI_PROVIDER in {"auto", "open-meteo", "openmeteo"}:
            provider_sequence.append("open-meteo")

        if not provider_sequence:
            provider_sequence = ["open-meteo"]

        async with httpx.AsyncClient(timeout=8.0) as client:
            for provider in provider_sequence:
                if provider == "google":
                    try:
                        google_url = f"https://airquality.googleapis.com/v1/currentConditions:lookup?key={GOOGLE_AIR_QUALITY_API_KEY}"
                        google_payload = {
                            "location": {
                                "latitude": latitude,
                                "longitude": longitude,
                            },
                            "extraComputations": [
                                "LOCAL_AQI",
                                "POLLUTANT_CONCENTRATION",
                            ],
                            "languageCode": "en",
                            "universalAqi": True,
                        }
                        google_resp = await client.post(google_url, json=google_payload)
                        google_resp.raise_for_status()
                        google_data = google_resp.json() or {}
                        current_conditions = google_data.get("currentConditions") or {}

                        resolved_aqi = _google_index_to_aqi(current_conditions)
                        if resolved_aqi is not None:
                            pollutants = _google_pollutants(current_conditions)
                            result = {
                                "aqi": resolved_aqi,
                                "pm2_5": pollutants["pm2_5"],
                                "pm10": pollutants["pm10"],
                                "co": pollutants["co"],
                                "no2": pollutants["no2"],
                                "so2": pollutants["so2"],
                                "ozone": pollutants["ozone"],
                            }
                            AQI_CACHE[cache_key] = (now, result)
                            return result
                    except Exception:
                        pass

                if provider == "waqi":
                    try:
                        waqi_url = f"https://api.waqi.info/feed/geo:{latitude};{longitude}/?token={AQI_API_KEY}"
                        waqi_resp = await client.get(waqi_url)
                        waqi_resp.raise_for_status()
                        waqi_data = waqi_resp.json()

                        if waqi_data.get("status") != "ok":
                            continue

                        waqi_payload = waqi_data.get("data") or {}
                        iaqi = waqi_payload.get("iaqi") or {}
                        aqi_value = waqi_payload.get("aqi")

                        if aqi_value is None:
                            continue

                        result = {
                            "aqi": int(round(_to_float(aqi_value, 0))),
                            "pm2_5": round(_to_float((iaqi.get("pm25") or {}).get("v", 0), 0), 2),
                            "pm10": round(_to_float((iaqi.get("pm10") or {}).get("v", 0), 0), 2),
                            "co": round(_to_float((iaqi.get("co") or {}).get("v", 0), 0), 2),
                            "no2": round(_to_float((iaqi.get("no2") or {}).get("v", 0), 0), 2),
                            "so2": round(_to_float((iaqi.get("so2") or {}).get("v", 0), 0), 2),
                            "ozone": round(_to_float((iaqi.get("o3") or {}).get("v", 0), 0), 2),
                        }
                        AQI_CACHE[cache_key] = (now, result)
                        return result
                    except Exception:
                        pass

                if provider == "open-meteo":
                    try:
                        url = (
                            "https://air-quality-api.open-meteo.com/v1/air-quality"
                            f"?latitude={latitude}&longitude={longitude}"
                            "&current=us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone"
                        )
                        resp = await client.get(url)
                        resp.raise_for_status()
                        data = resp.json()
                        current = data.get("current") or {}
                        if current.get("us_aqi") is None:
                            continue
                        result = {
                            "aqi": int(round(_to_float(current.get("us_aqi", 0), 0))),
                            "pm2_5": round(_to_float(current.get("pm2_5", 0), 0), 2),
                            "pm10": round(_to_float(current.get("pm10", 0), 0), 2),
                            "co": round(_to_float(current.get("carbon_monoxide", 0), 0), 2),
                            "no2": round(_to_float(current.get("nitrogen_dioxide", 0), 0), 2),
                            "so2": round(_to_float(current.get("sulphur_dioxide", 0), 0), 2),
                            "ozone": round(_to_float(current.get("ozone", 0), 0), 2),
                        }
                        AQI_CACHE[cache_key] = (now, result)
                        return result
                    except Exception:
                        pass

            return None
    except Exception:
        return None

# ─── Smart Fallback Responses ─────────────────────────
def get_fallback_response(query: str, aqi: int, location: str, indoor_data: Optional[str] = None, is_grounded: bool = False) -> str:
    """Intelligent keyword-based fallback when Ollama is not running."""
    lower = query.lower()

    if not is_grounded:
        return (
            f"Based on latest app value, AQI appears around {aqi} in {location}, but this is not live-verified yet. "
            "Enable precise location access to fetch exact real-time AQI before making outdoor health decisions."
        )

    # AQI-aware context
    if aqi > 300:
        aqi_status = "hazardous"
        aqi_advice = "Stay indoors immediately, seal windows, and use an air purifier on max. This is a health emergency level."
    elif aqi > 200:
        aqi_status = "very unhealthy"
        aqi_advice = "Avoid all outdoor activities. Everyone should stay indoors. Use an N95 mask if you must go out."
    elif aqi > 150:
        aqi_status = "unhealthy"
        aqi_advice = "Wear an N95 mask outdoors. Limit time outside to under 30 minutes. Sensitive groups should stay in."
    elif aqi > 100:
        aqi_status = "unhealthy for sensitive groups"
        aqi_advice = "People with asthma or heart conditions should limit outdoor exposure. Others should reduce prolonged outdoor exertion."
    elif aqi > 50:
        aqi_status = "moderate"
        aqi_advice = "Air quality is acceptable. Unusually sensitive people should consider reducing prolonged outdoor exertion."
    else:
        aqi_status = "good"
        aqi_advice = "Air quality is excellent! Perfect conditions for outdoor activities, jogging, and cycling."

    certainty_note = ""

    # Topic detection
    if any(w in lower for w in ['safe', 'outside', 'outdoor', 'go out']):
        return f"The AQI in {location} is {aqi} ({aqi_status}). {aqi_advice}{certainty_note}"

    if any(w in lower for w in ['run', 'exercise', 'jog', 'walk', 'workout', 'gym']):
        if aqi > 100:
            return f"I'd hold off on outdoor exercise in {location} right now — AQI is {aqi} ({aqi_status}). Consider treadmill or indoor yoga instead. {aqi_advice}{certainty_note}"
        return f"AQI in {location} is {aqi} ({aqi_status}). Outdoor running is generally safe. Best hours are early morning (6-8 AM) or evening (after 6 PM) when pollution is lower.{certainty_note}"

    if any(w in lower for w in ['mask', 'n95', 'protect', 'respirator']):
        if aqi > 100:
            return f"Yes, wear an N95 mask — AQI is {aqi} in {location}. Surgical masks won't filter PM2.5. Look for NIOSH-certified N95 or KN95 respirators. Replace them every 8 hours of use.{certainty_note}"
        return f"A mask isn't strictly necessary right now (AQI {aqi}), but if you're sensitive to pollutants, a KN95 provides good protection during your outdoor time.{certainty_note}"

    if any(w in lower for w in ['indoor', 'home', 'room', 'kitchen', 'bedroom', 'living', 'purifier']):
        base = "For indoor air quality, I recommend: 1) Run exhaust fans while cooking, 2) Keep air purifiers on HEPA mode, 3) Open windows during early morning for cross-ventilation, 4) Add indoor plants like Snake Plant or Peace Lily for natural air filtering."
        if indoor_data:
            base = f"Based on your sensor data: {indoor_data}. {base}"
        return base

    if any(w in lower for w in ['forecast', 'predict', 'tomorrow', 'week', 'trend']):
        return f"AQI in {location} is {aqi} ({aqi_status}). For accurate forecasts, I analyze hourly trends. Generally, AQI tends to be lowest between 6-9 AM and highest during peak traffic hours (5-8 PM). Weekends often show 15-20% better air quality.{certainty_note}"

    if any(w in lower for w in ['child', 'kid', 'baby', 'pregnant', 'elderly', 'senior', 'asthma']):
        return f"For vulnerable populations in {location} (AQI {aqi}): Keep children indoors when AQI exceeds 100. Ensure asthma medications are accessible. Use air purifiers in bedrooms. Avoid opening windows during peak traffic hours. Consider wearing masks even for short outdoor trips.{certainty_note}"

    if any(w in lower for w in ['plant', 'tree', 'garden', 'green']):
        return "Best air-purifying indoor plants: 🌿 Snake Plant (removes formaldehyde, works at night), 🌱 Peace Lily (removes ammonia, benzene), 🍀 Pothos (excellent for VOCs), 🌳 Areca Palm (natural humidifier). A 1,500 sq ft home should have 15-20 plants for noticeable air quality improvement."

    if any(w in lower for w in ['hello', 'hi', 'hey', 'help', 'what can you']):
        return f"Hello! I'm EcoBot, your AI air quality assistant 🌿. I'm monitoring {location} where AQI is {aqi} ({aqi_status}). I can help with:\n• Real-time air quality analysis\n• Exercise & outdoor safety\n• Indoor air improvement tips\n• Health recommendations for sensitive groups\n• Mask and protection advice\n\nWhat would you like to know?{certainty_note}"

    # Default contextual response
    return f"AQI in {location} is {aqi} ({aqi_status}). {aqi_advice}{certainty_note} Feel free to ask me about outdoor safety, indoor air quality tips, exercise recommendations, or health precautions!"


def is_valid_grounded_reply(reply: str, location: str, aqi: int) -> bool:
    """Validate that model output is actually grounded to fetched live data."""
    text = (reply or "").strip().lower()
    if not text:
        return False

    denial_markers = [
        "i don't have",
        "i dont have",
        "i'm not aware",
        "im not aware",
        "cannot access",
        "can't access",
        "no data",
        "don't have data",
        "do not have data",
        "for hyderabad",
    ]
    if any(marker in text for marker in denial_markers):
        return False

    location_token = (location or "").split("(")[0].strip().lower()
    has_location = bool(location_token) and location_token in text
    has_aqi = str(aqi) in text
    return has_location and has_aqi


# ─── Main AI Endpoint ─────────────────────────────────
@app.post("/api/ask-ecobot")
async def ask_ecobot(req: AIRequest):
    """
    Responds to user queries using Ollama (if running) or smart fallback.
    When you install Ollama and run a model, this automatically connects.
    """
    effective_aqi = req.current_aqi
    effective_location = req.location
    pollutant_context = None
    is_grounded = False
    is_map_fast = (req.response_style or "").strip().lower() == "map_fast"

    # Check if user is asking about a different city
    detected_city = await extract_and_geocode_city(req.user_voice_text)
    if detected_city:
        # User mentioned a specific city - try to get its AQI
        effective_location = detected_city["name"]  # Use city name even if AQI fetch fails
        live_snapshot = await fetch_live_aqi_snapshot(detected_city["lat"], detected_city["lon"])
        if live_snapshot:
            effective_aqi = live_snapshot["aqi"]
            pollutant_context = live_snapshot
            is_grounded = True
        else:
            # City detected but AQI fetch failed - use fallback for this city
            pass

    # If no city detected or city AQI failed, try GPS coordinates
    if not is_grounded and req.latitude is not None and req.longitude is not None:
        live_snapshot = await fetch_live_aqi_snapshot(req.latitude, req.longitude)
        if live_snapshot:
            effective_aqi = live_snapshot["aqi"]
            pollutant_context = live_snapshot
            is_grounded = True
            # Only add coordinates if not using a named city
            if not detected_city:
                effective_location = f"{effective_location} ({req.latitude:.5f}, {req.longitude:.5f})"

    if not is_grounded:
        reply = get_fallback_response(req.user_voice_text, effective_aqi, effective_location, req.indoor_data, is_grounded=False)

        async def low_confidence_generator():
            yield f"data: {json.dumps({'text': reply, 'source': 'fallback', 'model': 'built-in'})}\n\n"
            yield "data: [DONE]\n\n"

        return StreamingResponse(low_confidence_generator(), media_type="text/event-stream")

    try:
        import httpx

        # Build EcoBot system prompt with live sensor context
        iare_context = get_iare_context(
            query=req.user_voice_text,
            location=req.location,
            latitude=req.latitude,
            longitude=req.longitude,
        )

        system_prompt = f"""You are EcoBot, a real-time air quality assistant with LIVE sensor data.

IMPORTANT: You have REAL-TIME DATA for this exact location. USE IT. Never say "I don't have data" or "I'm not aware" - you DO have data below!

LIVE SENSOR DATA (just fetched):
- Location: {effective_location}
- Current AQI: {effective_aqi} ({get_aqi_category(effective_aqi)})
{f"- PM2.5: {pollutant_context['pm2_5']}µg/m³, PM10: {pollutant_context['pm10']}µg/m³, O3: {pollutant_context['ozone']}ppb, NO2: {pollutant_context['no2']}ppb, SO2: {pollutant_context['so2']}ppb, CO: {pollutant_context['co']}ppb" if pollutant_context else ""}
{f"- Indoor: {req.indoor_data}" if req.indoor_data else ""}
{iare_context if iare_context else ""}

YOUR TASK: Give {'1 short sentence' if is_map_fast else '1-2 sentences'} of health advice based on the AQI value above.
- AQI 0-50 (Good): Safe for outdoor activities
- AQI 51-100 (Moderate): Generally safe, sensitive groups be cautious
- AQI 101-150 (Unhealthy for Sensitive): Sensitive groups limit outdoor time
- AQI 151-200 (Unhealthy): Everyone reduce outdoor exertion
- AQI 201+ (Very Unhealthy/Hazardous): Stay indoors, use masks

Always mention the location name and AQI number in your response."""

        max_sentences = OLLAMA_MAP_MAX_SENTENCES if is_map_fast else OLLAMA_MAX_SENTENCES
        num_ctx = OLLAMA_MAP_NUM_CTX if is_map_fast else OLLAMA_NUM_CTX
        num_predict = OLLAMA_MAP_NUM_PREDICT if is_map_fast else OLLAMA_NUM_PREDICT

        if not is_grounded:
            system_prompt += "\n- Data confidence is LOW (not coordinate-grounded). Never claim exact real-time AQI certainty. Use wording like 'based on latest available app value' and ask user to enable precise location for exact live AQI."

        original_user_text = req.user_voice_text
        user_query_for_llm = f"{original_user_text}\n\n[SYSTEM INTERVENTION: Use the LIVE SENSOR DATA provided above to answer this query. Do NOT claim you cannot access real-time data, since the system has already fetched it for you.]"

        payload = {
            "model": OLLAMA_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_query_for_llm}
            ],
            "stream": False,
            "keep_alive": OLLAMA_KEEP_ALIVE,
            "options": {
                "num_ctx": num_ctx,
                "num_predict": num_predict,
                "temperature": OLLAMA_TEMPERATURE
            }
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(f"{OLLAMA_URL}/api/chat", json=payload)
            response.raise_for_status()
            data = response.json()

        model_text = (((data.get("message") or {}).get("content")) or "").strip()

        if max_sentences > 0 and model_text:
            sentence_endings = list(re.finditer(r"[.!?](?:\s|$)", model_text))
            if len(sentence_endings) >= max_sentences:
                cut_at = sentence_endings[max_sentences - 1].end()
                model_text = model_text[:cut_at].strip()

        if not is_valid_grounded_reply(model_text, effective_location, effective_aqi):
            model_text = get_fallback_response(
                req.user_voice_text,
                effective_aqi,
                effective_location,
                req.indoor_data,
                is_grounded=True,
            )
            source = "fallback"
            model_name = "built-in"
        else:
            source = "ollama"
            model_name = OLLAMA_MODEL

        async def guarded_generator():
            yield f"data: {json.dumps({'text': model_text, 'source': source, 'model': model_name})}\n\n"
            yield "data: [DONE]\n\n"

        return StreamingResponse(guarded_generator(), media_type="text/event-stream")

    except Exception as e:
        print(f"[EcoBot] Ollama error, falling back: {e}")

    # Fallback: smart keyword-based responses
    reply = get_fallback_response(req.user_voice_text, effective_aqi, effective_location, req.indoor_data, is_grounded)
    # Wrap fallback in an SSE payload so frontend uniform parsing works
    async def fallback_generator():
        yield f"data: {json.dumps({'text': reply, 'source': 'fallback', 'model': 'built-in'})}\n\n"
        yield "data: [DONE]\n\n"
    return StreamingResponse(fallback_generator(), media_type="text/event-stream")


# ─── Text-to-Speech Endpoint (edge-tts) ──────────────
@app.post("/api/tts")
async def text_to_speech(req: TTSRequest):
    """
    Converts text to high-quality neural speech using edge-tts.
    Returns an MP3 audio stream.
    """
    try:
        import edge_tts

        voice = req.voice or TTS_VOICE
        communicate = edge_tts.Communicate(req.text, voice)

        # Stream audio to a buffer
        audio_buffer = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_buffer.write(chunk["data"])

        audio_buffer.seek(0)

        return StreamingResponse(
            audio_buffer,
            media_type="audio/mpeg",
            headers={"Content-Disposition": "inline; filename=ecobot_response.mp3"}
        )

    except ImportError:
        raise HTTPException(status_code=500, detail="edge-tts not installed. Run: pip install edge-tts")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS generation failed: {str(e)}")


# ─── List available TTS voices ────────────────────────
@app.get("/api/tts/voices")
async def list_voices():
    """Lists available neural voices from edge-tts."""
    try:
        import edge_tts
        voices = await edge_tts.list_voices()
        # Filter to English voices for convenience
        english = [v for v in voices if v["Locale"].startswith("en-")]
        return {"voices": english, "current": TTS_VOICE}
    except ImportError:
        raise HTTPException(status_code=500, detail="edge-tts not installed")


# ─── Ollama Status ────────────────────────────────────
@app.get("/api/status")
async def get_status():
    """Check backend health, Ollama status, and available models."""
    ollama_up = await check_ollama()
    models = []

    if ollama_up:
        try:
            import httpx
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{OLLAMA_URL}/api/tags")
                data = resp.json()
                models = [m["name"] for m in data.get("models", [])]
        except Exception:
            pass

    return {
        "backend": "running",
        "ollama": "connected" if ollama_up else "not running (using smart fallback)",
        "active_model": OLLAMA_MODEL,
        "aqi_provider": AQI_PROVIDER,
        "aqi_key_configured": bool(AQI_API_KEY),
        "google_maps_key_configured": bool(GOOGLE_MAPS_API_KEY),
        "google_air_quality_key_configured": bool(GOOGLE_AIR_QUALITY_API_KEY),
        "available_models": models,
        "tts_voice": TTS_VOICE
    }


# ─── IARE Campus Data ────────────────────────────────
@app.get("/api/iare/buildings")
async def get_iare_buildings():
    """Returns IARE campus center and known building points."""
    return IARE_DATA


@app.get("/api/iare/nearest")
async def get_nearest_iare_building(latitude: float, longitude: float):
    """Returns nearest IARE building for a given coordinate."""
    nearest_building = None
    nearest_distance_m = None

    for building in IARE_DATA["buildings"]:
        distance_m = _approx_distance_m(latitude, longitude, building["lat"], building["lng"])
        if nearest_distance_m is None or distance_m < nearest_distance_m:
            nearest_distance_m = distance_m
            nearest_building = building

    center = IARE_DATA["center"]
    distance_to_center_m = _approx_distance_m(latitude, longitude, center["lat"], center["lng"])

    return {
        "campus": IARE_DATA["name"],
        "query": {"lat": latitude, "lng": longitude},
        "nearest": {
            "name": nearest_building["name"] if nearest_building else None,
            "type": nearest_building["type"] if nearest_building else None,
            "lat": nearest_building["lat"] if nearest_building else None,
            "lng": nearest_building["lng"] if nearest_building else None,
            "distance_m": int(round(nearest_distance_m)) if nearest_distance_m is not None else None,
        },
        "distance_to_campus_center_m": int(round(distance_to_center_m)),
        "is_near_campus": distance_to_center_m <= 2500,
    }
