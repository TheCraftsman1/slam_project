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
OLLAMA_MODEL = "llama3.1:latest"
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
TTS_VOICE = os.getenv("TTS_VOICE", "en-US-AriaNeural")  # High-quality Microsoft Neural voice
AQI_PROVIDER = os.getenv("AQI_PROVIDER", "open-meteo").strip().lower()
AQI_API_KEY = os.getenv("AQI_API_KEY", "").strip()
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


async def fetch_live_aqi_snapshot(latitude: float, longitude: float) -> Optional[dict]:
    """Fetch exact AQI and key pollutants for precise coordinate grounding."""
    lat_key = round(latitude, 4)
    lon_key = round(longitude, 4)
    cache_key = (lat_key, lon_key, AQI_PROVIDER)
    now = time.time()

    cached = AQI_CACHE.get(cache_key)
    if cached and (now - cached[0] <= AQI_CACHE_TTL_SECONDS):
        return cached[1]

    try:
        import httpx

        async with httpx.AsyncClient(timeout=8.0) as client:
            if AQI_PROVIDER == "waqi" and AQI_API_KEY:
                waqi_url = f"https://api.waqi.info/feed/geo:{latitude};{longitude}/?token={AQI_API_KEY}"
                waqi_resp = await client.get(waqi_url)
                waqi_resp.raise_for_status()
                waqi_data = waqi_resp.json()

                if waqi_data.get("status") != "ok":
                    return None

                waqi_payload = waqi_data.get("data") or {}
                iaqi = waqi_payload.get("iaqi") or {}
                aqi_value = waqi_payload.get("aqi")

                if aqi_value is None:
                    return None

                result = {
                    "aqi": int(round(float(aqi_value))),
                    "pm2_5": round(float((iaqi.get("pm25") or {}).get("v", 0) or 0), 2),
                    "pm10": round(float((iaqi.get("pm10") or {}).get("v", 0) or 0), 2),
                    "co": round(float((iaqi.get("co") or {}).get("v", 0) or 0), 2),
                    "no2": round(float((iaqi.get("no2") or {}).get("v", 0) or 0), 2),
                    "so2": round(float((iaqi.get("so2") or {}).get("v", 0) or 0), 2),
                    "ozone": round(float((iaqi.get("o3") or {}).get("v", 0) or 0), 2),
                }
                AQI_CACHE[cache_key] = (now, result)
                return result

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
                return None
            result = {
                "aqi": int(round(current.get("us_aqi", 0))),
                "pm2_5": round(float(current.get("pm2_5", 0) or 0), 2),
                "pm10": round(float(current.get("pm10", 0) or 0), 2),
                "co": round(float(current.get("carbon_monoxide", 0) or 0), 2),
                "no2": round(float(current.get("nitrogen_dioxide", 0) or 0), 2),
                "so2": round(float(current.get("sulphur_dioxide", 0) or 0), 2),
                "ozone": round(float(current.get("ozone", 0) or 0), 2),
            }
            AQI_CACHE[cache_key] = (now, result)
            return result
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

    if req.latitude is not None and req.longitude is not None:
        live_snapshot = await fetch_live_aqi_snapshot(req.latitude, req.longitude)
        if live_snapshot:
            effective_aqi = live_snapshot["aqi"]
            pollutant_context = live_snapshot
            is_grounded = True

    if req.latitude is not None and req.longitude is not None:
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

            system_prompt = f"""You are EcoBot, an air-quality assistant.
Answer in {'1 short sentence' if is_map_fast else '1-2 short sentences unless user asks for detail'}.
Use this grounded data only:
- Location: {effective_location}
- AQI: {effective_aqi} ({get_aqi_category(effective_aqi)})
{f"- Pollutants: PM2.5={pollutant_context['pm2_5']}, PM10={pollutant_context['pm10']}, NO2={pollutant_context['no2']}, SO2={pollutant_context['so2']}, O3={pollutant_context['ozone']}, CO={pollutant_context['co']}" if pollutant_context else ""}
{f"- Indoor: {req.indoor_data}" if req.indoor_data else ""}
{iare_context if iare_context else ""}
Give actionable advice; if AQI > 150, strongly warn."""

            max_sentences = OLLAMA_MAP_MAX_SENTENCES if is_map_fast else OLLAMA_MAX_SENTENCES
            num_ctx = OLLAMA_MAP_NUM_CTX if is_map_fast else OLLAMA_NUM_CTX
            num_predict = OLLAMA_MAP_NUM_PREDICT if is_map_fast else OLLAMA_NUM_PREDICT

            if not is_grounded:
                system_prompt += "\n- Data confidence is LOW (not coordinate-grounded). Never claim exact real-time AQI certainty. Use wording like 'based on latest available app value' and ask user to enable precise location for exact live AQI." 

            payload = {
                "model": OLLAMA_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": req.user_voice_text}
                ],
                "stream": True, # ENABLE STREAMING
                "keep_alive": OLLAMA_KEEP_ALIVE,
                "options": {
                    "num_ctx": num_ctx,
                    "num_predict": num_predict,
                    "temperature": OLLAMA_TEMPERATURE
                }
            }

            async def stream_generator():
                full_text = ""
                async with httpx.AsyncClient(timeout=30.0) as client:
                    async with client.stream("POST", f"{OLLAMA_URL}/api/chat", json=payload) as response:
                        async for line in response.aiter_lines():
                            if line:
                                try:
                                    data = json.loads(line)
                                    if "message" in data and "content" in data["message"]:
                                        chunk = data["message"]["content"]
                                        full_text += chunk
                                        # Yield exactly the format Server-Sent Events (SSE) expects
                                        yield f"data: {json.dumps({'text': chunk, 'source': 'ollama', 'model': OLLAMA_MODEL})}\n\n"

                                        if max_sentences > 0:
                                            sentence_count = len(re.findall(r"[.!?](?:\s|$)", full_text))
                                            if sentence_count >= max_sentences:
                                                break
                                except Exception:
                                    pass
                        yield "data: [DONE]\n\n"
            
            return StreamingResponse(stream_generator(), media_type="text/event-stream")

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
