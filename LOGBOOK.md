# 📒 SLAM Project — Development Logbook

> **Project:** Clean Air Home App (EcoBot)  
> **Author:** Vishnu  
> **Start Date:** March 2026  
> **Stack:** React 19 + TypeScript 5.8 + Vite 6.2 | FastAPI + Ollama + edge-tts | Tailwind CSS 4.1

---

## 🔖 Entry 1 — Project Foundation & Full UI Build
**Date:** March 11, 2026  
**Phase:** Phase 1 + Phase 2 (Foundation, UI, Simulation)  
**Status:** ✅ Complete

### What was done
- Initialized the Vite + React + TypeScript project with Tailwind CSS v4.
- Set up the full app shell (`App.tsx`) with a premium glass-morphism bottom navigation bar featuring 5 tabs: Outdoor, Indoor, Assistant (center mic button), Map, Profile.
- Used `AnimatePresence` from `motion/react` for smooth page transitions between all screens.

### Screens Built

| Screen | File | Key Features |
|--------|------|-------------|
| **Home / Outdoor** | `src/components/HomeScreen.tsx` | Animated SVG AQI ring gauge, live weather from Open-Meteo API, expandable pollutant cards (PM2.5, PM10, O₃, NO₂, SO₂, CO), 7-day trend chart, auto-refresh every 3 min |
| **Indoor** | `src/components/IndoorScreen.tsx` | 4-room simulation (Kitchen, Bedroom, Living Room, Bathroom), live sensor updates every 10s, interactive purifier toggle, expandable room detail panels, EcoBot alerts |
| **Map** | `src/components/MapScreen.tsx` | Google Maps with dark theme, tap-anywhere for live AQI, search any city, 16 preloaded world cities, metric filter chips, comparison strip, auto-refresh |
| **Assistant** | `src/components/AssistantScreen.tsx` | Full chat UI with typing indicator, connected to FastAPI backend, Web Speech API for voice input, neural TTS playback |
| **Profile** | `src/components/ProfileScreen.tsx` | Dark themed, interactive eco-challenges with points system, achievements grid, environmental impact stats |

### Bug Fixes
- **162 TypeScript compile errors** — Resolved by installing `@types/react`, `@types/react-dom`, and `@types/google.maps` as devDependencies.
- **CSS `@theme` lint warnings** — Tailwind v4 syntax; works at runtime, CSS linter flags it as unknown (cosmetic warning only).

### APIs Integrated
- **AQI Data:** `https://air-quality-api.open-meteo.com/v1/air-quality` (real-time, free, no API key)
- **Weather:** `https://api.open-meteo.com/v1/forecast` (real-time, free)
- **Google Maps:** `@react-google-maps/api` with API key for map rendering + geocoding
- **Geocoding:** Google Maps Geocoding API (MapScreen) + Nominatim/OpenStreetMap (HomeScreen)

---

## 🔖 Entry 2 — MapScreen Major Upgrade (Live AQI Everywhere)
**Date:** March 11, 2026  
**Phase:** Phase 2 (Advanced Simulation)  
**Status:** ✅ Complete

### What was done
Complete rewrite of `MapScreen.tsx` from 390 lines to ~500+ lines with all-new functionality.

### Features Added
1. **Tap-to-Check AQI** — Click anywhere on the map → reverse-geocodes the location → fetches real AQI from Open-Meteo API → places a live marker with city name and AQI badge.
2. **Real Data Everywhere** — Every marker on the map uses the real `air-quality-api.open-meteo.com` endpoint. Removed all previous hardcoded fake data (which used artificial multipliers like `pm2_5 * 0.8`).
3. **Preloaded Cities** — Delhi, Mumbai, Hyderabad, Chennai, and Bengaluru auto-load on startup with staggered animation.
4. **Explore Cities Panel** — Globe button opens a panel of 16 cities (10 Indian + 6 global) for one-tap AQI loading.
5. **Multi-Marker Comparison** — Bottom sheet shows a scrollable comparison strip of all loaded stations.
6. **Per-Station Controls** — Refresh individual station data, delete tapped markers, see last-fetched timestamps.
7. **Metric Switching** — Filter chips (AQI, PM2.5, O₃, NO₂, CO, SO₂) update all marker displays simultaneously.
8. **Refresh All** — One-tap button to re-fetch live data for every marker on the map.
9. **Live Counter** — Badge showing how many stations are currently loaded with real data.

### Architecture Changes
- Replaced single-location state model with a `stations: AqiStation[]` array supporting unlimited markers.
- Added `addStation()`, `refreshStation()`, `refreshAllStations()`, `removeStation()` callback functions.
- Used `useRef` to avoid stale closure issues in Google Maps click handlers.

---

## 🔖 Entry 3 — AI Backend & Voice Integration (Phase 3)
**Date:** March 11, 2026  
**Phase:** Phase 3 (AI & Voice — "Wow" Factor)  
**Status:** ✅ Complete (Ollama pending download at home)

### Backend (`backend_ai/main.py`)

**Endpoints built:**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Health check — confirms backend is running |
| `POST` | `/api/ask-ecobot` | Main AI endpoint. Accepts `user_voice_text`, `current_aqi`, `location`, optional `indoor_data`. Tries Ollama first, falls back to built-in intelligence |
| `POST` | `/api/tts` | Text-to-Speech. Takes text, returns MP3 audio stream using Microsoft AriaNeural voice via `edge-tts` |
| `GET` | `/api/tts/voices` | Lists available neural TTS voices |
| `GET` | `/api/status` | Shows backend health, Ollama connection status, active model, TTS voice |

**Smart Fallback System:**
- When Ollama is not running, the backend uses an intelligent keyword-based response engine covering 10+ topics:
  - Outdoor safety, exercise, masks, indoor air, forecasts, children/elderly, plants, and general queries
  - All responses are dynamically contextualized with the real AQI level and location
  - AQI thresholds: Good (0-50), Moderate (51-100), Sensitive (101-150), Unhealthy (151-200), Very Unhealthy (201-300), Hazardous (300+)

**Ollama Integration (ready for activation):**
- System prompt includes location, AQI, AQI category, and optional indoor sensor data
- Configured for `phi3` model by default (configurable via `OLLAMA_MODEL` env var)
- Uses `httpx` async client with 30s timeout to `http://localhost:11434/api/chat`
- Auto-detects Ollama availability on every request — zero config needed

**Dependencies installed:**
- `fastapi`, `uvicorn[standard]`, `httpx`, `edge-tts`, `python-dotenv`, `ollama`

### Frontend (`src/components/AssistantScreen.tsx`)

**Changes from mock to real:**

| Before | After |
|--------|-------|
| Hardcoded `aiResponses` dictionary | Real `fetch()` to `http://localhost:8000/api/ask-ecobot` |
| Simulated voice (3s timeout → fake message) | Browser `SpeechRecognition` API with live transcript display |
| No text-to-speech | Neural TTS via `/api/tts` endpoint with auto-play |
| No backend status awareness | Live backend/Ollama status in settings panel |

**Voice Features:**
- **Speech-to-Text:** Web Speech API (`window.SpeechRecognition` / `webkitSpeechRecognition`)
  - Live interim transcript shown during speech
  - Auto-sends final transcript as message
  - Handles permission denials with user-friendly error messages
  - Full-screen voice visualizer with animated bars
- **Text-to-Speech:** Microsoft AriaNeural via `edge-tts` backend
  - Auto-speaks every EcoBot response (toggleable)
  - Speaking indicator with animated bars and stop button
  - Replay button on each assistant message
- **Source badges:** Each AI response shows `⚡ phi3` (Ollama) or `● built-in` (fallback)

### How to activate Ollama (when home):
```bash
# 1. Install Ollama (~50MB download)
irm https://ollama.com/install.ps1 | iex

# 2. Pull a model (~2.3GB for phi3)
ollama pull phi3

# 3. Start the model
ollama run phi3

# 4. Start backend (it auto-detects Ollama)
cd backend_ai
uvicorn main:app --reload
```
No code changes needed — the backend automatically switches from fallback to Ollama.

---

## 📊 Build Status

| Component | Status | Notes |
|-----------|--------|-------|
| Vite Build | ✅ Pass | Chunk 566KB (advisory warning only, not blocking) |
| TypeScript | ✅ 0 errors | All types resolved |
| FastAPI Backend | ✅ Running | Port 8000, CORS enabled |
| edge-tts | ✅ Working | Tested: 200 OK, 15KB MP3 response |
| AI Endpoint | ✅ Working | Smart fallback active (Ollama not yet installed) |
| Status Endpoint | ✅ Working | Reports Ollama as "not running (using smart fallback)" |

---

## 🗂️ File Structure

```
slam_project/
├── index.html                    # Vite entry HTML
├── package.json                  # React 19 + dependencies
├── tsconfig.json                 # TypeScript config
├── vite.config.ts                # Vite + Tailwind + React plugins
├── WORKFLOW.md                   # Phase-by-phase development plan
├── LOGBOOK.md                    # This file
├── src/
│   ├── main.tsx                  # React entry point
│   ├── index.css                 # Tailwind v4 theme + glass utilities
│   ├── App.tsx                   # App shell + glass nav bar
│   └── components/
│       ├── HomeScreen.tsx        # Outdoor AQI dashboard
│       ├── IndoorScreen.tsx      # Smart home sensors
│       ├── MapScreen.tsx         # Google Maps + live AQI
│       ├── AssistantScreen.tsx   # AI chat + voice
│       └── ProfileScreen.tsx     # Eco-challenges + profile
├── backend_ai/
│   ├── main.py                   # FastAPI server
│   └── requirements.txt          # Python dependencies
├── mobile_app/                   # Legacy mobile app (v1)
└── mobile_app_v2/                # React Native shell (future)
```

---

## 🔮 Next Steps (Upcoming)
- [ ] **Phase 4:** Predictive AQI forecasting (24-hour trend), Eco-Streaks with local storage, push notification triggers
- [ ] **Phase 5:** Particle animations, wind effects, end-to-end testing on Android/iPhone, edge case handling
- [ ] Connect `AssistantScreen` to real-time AQI from `HomeScreen` context (currently hardcoded to 72)
- [ ] Add shared React context/state for AQI data across all screens
