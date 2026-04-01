# 🚀 Project Handoff: EcoSense (Clean Air Home App / EcoBot)

## 📌 Project Overview
EcoSense is a hyper-local, real-time air quality monitoring web application with an "offline-first", local AI companion. It tracks outdoor data via maps, simulates live indoor room environments, and provides contextual health advice using a custom generative offline AI backend.

## 🛠️ Tech Stack
*   **Frontend:** React 19, TypeScript 5.8, Vite 6.2, Tailwind CSS 4.1.
*   **Backend:** Python via FastAPI.
*   **AI Engine:** Local LLM via Ollama (`phi3` model) with fallback to a built-in Contextual Logic Engine.
*   **Voice/Audio:** Web Speech API (STT) + `edge-tts` (Microsoft AriaNeural for TTS).
*   **Mapping & Data:** Google Maps API (with Geolocation) + Open-Meteo API (Free live AQI/Weather).

## ✅ What Has Been Completed
1. **Core UI & Navigation:** 5-tab bottom navigation with glassmorphism UI, React Error Boundaries, and `motion/react` page transitions. 
2. **Component Modularity:** Extracted the massive `MapScreen` into smaller maintainable components (Markers, Panels, SearchBars, Control Buttons). 
3. **Advanced Mapping:** Dark-mode Google Maps with:
    *   Tap-anywhere real-time reverse geocoded AQI markers.
    *   IARE College campus coordinate targeting limits.
    *   Live marker counters, global preloaded cities, and filter chips.
4. **Indoor Room Simulation:** Functional toggles and auto-refresh states mimicking 4 indoor spaces.
5. **EcoBot Assistant:** Full chat UI with STT transcription, TTS vocal playback, and auto-connection backend parsing.
6. **AI Backend Service:** FastAPI server running local logic with live model hot-swapping if Ollama is connected.

## 🚧 What Is Currently Pending (Immediate Next Steps)
1. **Global AQI Context State:** The `AssistantScreen` is currently sending a hardcoded AQI of `72` to the backend. We need to implement a shared React Context so the AI reads the active live AQI fetched from the `HomeScreen`.
2. **Notifications System:** Implement the framework for morning briefings, unhealthy threshold alerts, and UI user-preference toggles (Theme, Unit systems, sensitivity limits).
3. **Data Persistence & Gamification:** Connect the "Eco-Streaks" checklists and Profile achievements layout to Local Storage/Supabase so user progression saves across sessions.
4. **Predictive Forecasting:** Incorporate 24-hour forward-looking AQI trends.
5. **App Polish:** Optimize React re-renders on map pan/zoom, add service workers for PWA offline capabilities, and implement high-end visual features (wind animations, particle effects).

## 💡 Key Architectural Notes to Remember
*   **LLM Hot Swapping:** You do not *need* Ollama running to test the AI. The FastAPI server defaults to an intelligent text-based fallback when offline.
*   **Web First:** We shifted from a React Native execution path towards a robust React web stack. Ignore the legacy `mobile_app` and `mobile_app_v2` folders; all work operates inside the `src/` directory.
*   **Dev Run Commands:** 
    *   Frontend: `npm run dev`
    *   Backend: `cd backend_ai` then activate venv (`venv\Scripts\activate` on Windows) then `uvicorn main:app --reload`
