# Development Workflow & Plan 🚀

This document outlines the step-by-step implementation strategy for the Clean Air Home App.

## 📍 Phase 1: Foundation & Project Setup
**Goal:** Initialize the app and build the basic UI shell.
- [ ] Initialize React Native project using Expo.
- [ ] Set up navigation (Bottom Tabs: Home, Rooms, AI Assistant, Profile).
- [ ] Implement the dark-mode, glassmorphism UI for the Home Dashboard.

## 🌍 Phase 2: Room-by-Room Simulation Logic
**Goal:** Create a convincing multi-room data environment.
- [ ] Create a local state manager or context to hold "Live" data for the Kitchen, Bedroom, and Living Room.
- [ ] Build a simulation engine that triggers events (e.g., "User started cooking" -> spikes PM2.5 in Kitchen to 110).
- [ ] Implement the **Dynamic UI**: Room cards shift from neon-green (Safe) to neon-orange (Warning) based on the simulated threshold.

## 🤖 Phase 3: Dedicated Native AI & Voice Integration (The "Wow" Factor)
**Goal:** Build and host a custom AI intelligence layer and link it with voice.
- [ ] **AI Backend Setup:** Create a Python service (FastAPI) to host your dedicated AI. 
- [ ] **Model Selection:** Deploy an open-source lightweight LLM (like Microsoft's Phi-3 or Meta's Llama) locally via Ollama.
- [ ] **Prompt Interface:** Pass the simulated room data to the AI ("The Kitchen VOCs are at 120, user is in the Living room").
- [ ] **Voice to App:** Implement Speech-to-Text in React Native so the user can interact directly.
- [ ] **App to Voice:** Display the custom backend's response text in the EcoBot chat bubble, and implement Text-to-Speech.

## 📈 Phase 4: Advanced Features & Gamification
**Goal:** Keep users coming back and provide deeper value.
- [ ] **Predictive Forecasting:** Add a screen/section showing the AQI trend for the next 24 hours.
- [ ] **Eco-Streaks:** Create a daily checklist of eco-friendly actions. Store progress using local storage (AsyncStorage) or a lightweight database (Firebase/Supabase).
- [ ] **Health Warnings:** Add logic to trigger a push notification if AQI exceeds a dangerous threshold.

## 🎨 Phase 5: Polish & Pitch Preparation
**Goal:** Finalize the app for the SLAM project presentation.
- [ ] Add smooth animations (e.g., particles, wind effects, smooth color transitions).
- [ ] Conduct end-to-end testing on both an Android device and an iPhone.
- [ ] Handle edge cases (No internet connection, API rate limits, Location services disabled).
- [ ] Finalize documentation and prepare the presentation demo.
