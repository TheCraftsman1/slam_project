# EcoSense Implementation TODO

## Current Sprint Focus
Work through each phase systematically. Check off items as completed.

---

## PHASE 1: Core Improvements (Priority: HIGH)

### 1.1 Code Architecture
- [ ] Split MapScreen.tsx into smaller components:
  - [ ] `components/map/AqiMarker.tsx`
  - [ ] `components/map/BuildingLabel.tsx`
  - [ ] `components/map/MapControls.tsx`
  - [ ] `components/panels/CityPanel.tsx`
  - [ ] `components/panels/CollegePanel.tsx`
  - [ ] `components/sheets/AqiBottomSheet.tsx`
  - [ ] `components/search/SearchBar.tsx`
  - [ ] `components/search/FilterChips.tsx`
- [ ] Create shared hooks:
  - [ ] `hooks/useAqiData.ts`
  - [ ] `hooks/useGeolocation.ts`
  - [ ] `hooks/useMapControls.ts`
- [ ] Add TypeScript interfaces file:
  - [ ] `types/aqi.ts`
  - [ ] `types/buildings.ts`
  - [ ] `types/map.ts`

### 1.2 Error Handling
- [ ] Add React Error Boundaries
- [ ] Implement retry logic for API failures
- [ ] Add offline detection and UI feedback
- [ ] Create toast/notification system for errors

### 1.3 Environment & Config
- [ ] Move API keys to environment variables
- [ ] Create config file for app constants
- [ ] Add development/production environment handling

---

## PHASE 2: UX Enhancements (Priority: HIGH)

### 2.1 Search Improvements
- [ ] Add search autocomplete dropdown
- [ ] Show recent searches
- [ ] Add search suggestions based on location
- [ ] Implement fuzzy search for building names
- [ ] Add voice search functionality (Web Speech API)

### 2.2 Loading States
- [ ] Add skeleton loaders for:
  - [ ] AQI markers while loading
  - [ ] Bottom sheet content
  - [ ] City/College panels
  - [ ] AI insight section
- [ ] Improve loading animations
- [ ] Add progress indicators for multi-step operations

### 2.3 Empty & Error States
- [ ] Design empty state for no stations
- [ ] Add error state with retry button
- [ ] Create "no results" state for search
- [ ] Add connection lost indicator

### 2.4 Bottom Sheet Improvements
- [ ] Smoother drag animations
- [ ] Add haptic feedback on state changes
- [ ] Improve pollutant grid layout
- [ ] Add trend indicators (arrow up/down)

---

## PHASE 3: New Features (Priority: MEDIUM)

### 3.1 Historical Data
- [ ] Design historical data UI
- [ ] Implement date range selector
- [ ] Add line chart component
- [ ] Create statistics summary panel
- [ ] Add data export functionality

### 3.2 Notification System
- [ ] Request notification permissions
- [ ] Implement morning briefing notifications
- [ ] Add threshold alerts (AQI > 100, 150, 200)
- [ ] Create notification preferences screen
- [ ] Add quiet hours setting

### 3.3 User Preferences
- [ ] Create settings screen
- [ ] Add theme toggle (dark/light/system)
- [ ] Implement unit preferences (AQI/PM2.5)
- [ ] Add sensitivity level selector
- [ ] Save preferences to localStorage

### 3.4 Multi-Campus Support
- [ ] Design campus selector UI
- [ ] Allow adding custom campuses
- [ ] Implement campus data storage
- [ ] Add campus switching functionality

---

## PHASE 4: Polish & Optimization (Priority: MEDIUM)

### 4.1 Performance
- [ ] Implement React.memo for markers
- [ ] Add virtualization for station lists
- [ ] Optimize re-renders
- [ ] Lazy load panels
- [ ] Add service worker for caching

### 4.2 Animations
- [ ] Refine marker glow animations
- [ ] Improve panel slide transitions
- [ ] Add micro-interactions to buttons
- [ ] Smooth bottom sheet spring physics

### 4.3 Accessibility
- [ ] Add ARIA labels to all interactive elements
- [ ] Implement keyboard navigation
- [ ] Test with screen readers
- [ ] Add high contrast mode
- [ ] Ensure 44px minimum touch targets

### 4.4 Testing
- [ ] Write unit tests for utilities
- [ ] Add component tests
- [ ] Create integration tests
- [ ] Test offline functionality
- [ ] Cross-browser testing

---

## PHASE 5: Advanced Features (Priority: LOW)

### 5.1 Widgets
- [ ] Design widget layouts
- [ ] Implement iOS widget
- [ ] Implement Android widget
- [ ] Add widget configuration

### 5.2 Social Features
- [ ] Add location sharing
- [ ] Implement AQI comparison view
- [ ] Create shareable AQI cards
- [ ] Add social media integration

### 5.3 AI Enhancements
- [ ] Implement predictive AQI forecasting
- [ ] Add personalized health recommendations
- [ ] Create activity suggestions based on AQI
- [ ] Add voice interaction with EcoBot

---

## Quick Reference: File Locations

```
src/
  components/
    MapScreen.tsx          <- Main component (needs splitting)
    AssistantScreen.tsx    <- AI chat interface

docs/
    UI_UPGRADE_SPEC.md     <- Full specification
    TODO_IMPLEMENTATION.md <- This file

backend_ai/
    main.py                <- FastAPI backend
```

---

## Notes

### Completed Items
- [x] Building labels zoom-based visibility (zoom >= 16)
- [x] Location matching for IARE campus buildings
- [x] Satellite view auto-switch for campus
- [x] Backend API for IARE building data

### Known Issues
1. Building labels can overlap when zoomed out
2. AI insight caching could be more aggressive
3. 3D mode performance on low-end devices

### Dependencies to Add
```bash
# For charts
npm install recharts

# For notifications (PWA)
npm install web-push

# For better animations
npm install @react-spring/web

# For state management (if needed)
npm install zustand
```

---

Last Updated: March 18, 2026
