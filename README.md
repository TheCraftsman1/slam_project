# EcoBot (SLAM Project)

An AI-powered Eco-Assistant app that provides real-time Air Quality Index (AQI) tracking, interactive environmental maps, and voice-enabled AI assistance to help users make eco-friendly and health-conscious decisions.

## 🌟 Features

- **🗺️ Real-Time AQI Map**: Interactive global map displaying Air Quality data powered by Google Maps and Open-Meteo API.
- **🎙️ Voice-Activated AI Assistant**: Talk to EcoBot using your voice (native Web Speech API) and hear it talk back with high-quality Microsoft AriaNeural text-to-speech (`edge-tts`).
- **🤖 Local AI Ready**: Smart backend that seamlessly switches between a fast fallback rule-engine and a fully offline LLM (Ollama) when available.
- **📱 Modern UI**: Fully responsive, beautiful interface built with React and Tailwind CSS.

## 🛠️ Tech Stack

### Frontend
- **React 19** & **TypeScript**
- **Vite 6** (Build tool)
- **Tailwind CSS 4** (Styling)
- **Google Maps API** (`@react-google-maps/api`)

### Backend
- **Python 3** & **FastAPI**
- **edge-tts** (High-quality voice generation)
- **Ollama** (Local LLM integration, ready for Phi-3/Llama-3)
- **httpx** (Async HTTP client)

## 🚀 Getting Started

### 1. Frontend Setup
```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

### 2. Backend Setup
```bash
# Navigate to the backend directory
cd backend_ai

# Create a virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
uvicorn main:app --reload
```

### 3. Use Your Own AQI API Key (for grounded qwen2.5 responses)
The backend can fetch AQI from your API key provider and pass that grounded data to `qwen2.5`.

Set these environment variables before starting backend:

```bash
# Provider options: open-meteo (default, no key) or waqi (token required)
set AQI_PROVIDER=waqi
set AQI_API_KEY=YOUR_WAQI_TOKEN

# Optional: force fast local model
set OLLAMA_MODEL=qwen2.5:0.5b
```

Then run:

```bash
cd backend_ai
uvicorn main:app --reload --port 8000
```

Check config at:

```bash
http://localhost:8000/api/status
```

You should see `"aqi_provider": "waqi"` and `"aqi_key_configured": true`.

## 📝 Next Steps (Phase 4)
- Predictive Air Quality forecasting.
- Gamification (Eco-streaks and daily challenges).
- Push notifications for health alerts.
