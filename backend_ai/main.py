import os
import io
import asyncio
import uuid
import json
import re
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional

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
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "phi3")  # Change to llama3.2, mistral, etc.
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
TTS_VOICE = os.getenv("TTS_VOICE", "en-US-AriaNeural")  # High-quality Microsoft Neural voice
AUDIO_DIR = Path("audio_cache")
AUDIO_DIR.mkdir(exist_ok=True)

# ─── Pydantic Models ─────────────────────────────────
class AIRequest(BaseModel):
    user_voice_text: str
    current_aqi: int
    location: str
    indoor_data: Optional[str] = None  # Optional room sensor context

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

# ─── Smart Fallback Responses ─────────────────────────
def get_fallback_response(query: str, aqi: int, location: str, indoor_data: Optional[str] = None) -> str:
    """Intelligent keyword-based fallback when Ollama is not running."""
    lower = query.lower()

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

    # Topic detection
    if any(w in lower for w in ['safe', 'outside', 'outdoor', 'go out']):
        return f"The current AQI in {location} is {aqi} ({aqi_status}). {aqi_advice}"

    if any(w in lower for w in ['run', 'exercise', 'jog', 'walk', 'workout', 'gym']):
        if aqi > 100:
            return f"I'd hold off on outdoor exercise in {location} right now — AQI is {aqi} ({aqi_status}). Consider treadmill or indoor yoga instead. {aqi_advice}"
        return f"Great news! AQI in {location} is {aqi} ({aqi_status}). Outdoor running is safe. Best hours are early morning (6-8 AM) or evening (after 6 PM) when pollution is lowest."

    if any(w in lower for w in ['mask', 'n95', 'protect', 'respirator']):
        if aqi > 100:
            return f"Yes, wear an N95 mask — the AQI is {aqi} in {location}. Surgical masks won't filter PM2.5. Look for NIOSH-certified N95 or KN95 respirators. Replace them every 8 hours of use."
        return f"A mask isn't strictly necessary right now (AQI {aqi}), but if you're sensitive to pollutants, a KN95 provides good protection during your outdoor time."

    if any(w in lower for w in ['indoor', 'home', 'room', 'kitchen', 'bedroom', 'living', 'purifier']):
        base = "For indoor air quality, I recommend: 1) Run exhaust fans while cooking, 2) Keep air purifiers on HEPA mode, 3) Open windows during early morning for cross-ventilation, 4) Add indoor plants like Snake Plant or Peace Lily for natural air filtering."
        if indoor_data:
            base = f"Based on your sensor data: {indoor_data}. {base}"
        return base

    if any(w in lower for w in ['forecast', 'predict', 'tomorrow', 'week', 'trend']):
        return f"The AQI in {location} is currently {aqi} ({aqi_status}). For accurate forecasts, I analyze hourly trends. Generally, AQI tends to be lowest between 6-9 AM and highest during peak traffic hours (5-8 PM). Weekends often show 15-20% better air quality."

    if any(w in lower for w in ['child', 'kid', 'baby', 'pregnant', 'elderly', 'senior', 'asthma']):
        return f"For vulnerable populations in {location} (AQI {aqi}): Keep children indoors when AQI exceeds 100. Ensure asthma medications are accessible. Use air purifiers in bedrooms. Avoid opening windows during peak traffic hours. Consider wearing masks even for short outdoor trips."

    if any(w in lower for w in ['plant', 'tree', 'garden', 'green']):
        return "Best air-purifying indoor plants: 🌿 Snake Plant (removes formaldehyde, works at night), 🌱 Peace Lily (removes ammonia, benzene), 🍀 Pothos (excellent for VOCs), 🌳 Areca Palm (natural humidifier). A 1,500 sq ft home should have 15-20 plants for noticeable air quality improvement."

    if any(w in lower for w in ['hello', 'hi', 'hey', 'help', 'what can you']):
        return f"Hello! I'm EcoBot, your AI air quality assistant 🌿. I'm monitoring {location} where AQI is {aqi} ({aqi_status}). I can help with:\n• Real-time air quality analysis\n• Exercise & outdoor safety\n• Indoor air improvement tips\n• Health recommendations for sensitive groups\n• Mask and protection advice\n\nWhat would you like to know?"

    # Default contextual response
    return f"The current AQI in {location} is {aqi} ({aqi_status}). {aqi_advice} Feel free to ask me about outdoor safety, indoor air quality tips, exercise recommendations, or health precautions!"


# ─── Main AI Endpoint ─────────────────────────────────
@app.post("/api/ask-ecobot")
async def ask_ecobot(req: AIRequest):
    """
    Responds to user queries using Ollama (if running) or smart fallback.
    When you install Ollama and run a model, this automatically connects.
    """
    ollama_available = await check_ollama()

    if ollama_available:
        try:
            import httpx

            # Build EcoBot system prompt with live sensor context
            system_prompt = f"""You are EcoBot, an expert AI assistant for air quality and environmental health.
You are concise, friendly, and authoritative. Keep responses under 3 sentences unless the user asks for detail.

CURRENT CONTEXT:
- Location: {req.location}
- Outdoor AQI: {req.current_aqi} (US EPA scale)
- AQI Category: {"Good" if req.current_aqi <= 50 else "Moderate" if req.current_aqi <= 100 else "Unhealthy for Sensitive" if req.current_aqi <= 150 else "Unhealthy" if req.current_aqi <= 200 else "Very Unhealthy" if req.current_aqi <= 300 else "Hazardous"}
{f"- Indoor Sensor Data: {req.indoor_data}" if req.indoor_data else ""}

RULES:
- Always reference the current AQI and location in your answers.
- Give specific, actionable advice (not generic).
- If AQI > 150, strongly warn about health risks.
- Use emojis sparingly for friendliness.
- If asked about topics unrelated to air/environment/health, politely redirect."""

            payload = {
                "model": OLLAMA_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": req.user_voice_text}
                ],
                "stream": False
            }

            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(f"{OLLAMA_URL}/api/chat", json=payload)
                data = resp.json()
                reply = data.get("message", {}).get("content", "")

            if reply:
                return {"reply": reply, "source": "ollama", "model": OLLAMA_MODEL}

        except Exception as e:
            print(f"[EcoBot] Ollama error, falling back: {e}")

    # Fallback: smart keyword-based responses
    reply = get_fallback_response(req.user_voice_text, req.current_aqi, req.location, req.indoor_data)
    return {"reply": reply, "source": "fallback", "model": "built-in"}


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
        "available_models": models,
        "tts_voice": TTS_VOICE
    }
