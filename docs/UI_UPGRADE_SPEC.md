# EcoSense: Next-Generation Air Quality Monitoring App
## Complete UI/UX Redesign & Feature Enhancement Specification

---

## TABLE OF CONTENTS
1. Executive Summary
2. Current State Analysis
3. Design Philosophy & Principles
4. Design System Foundation
5. Core Screens & Components
6. Feature Specifications
7. Interaction Design
8. Animation & Motion
9. Accessibility Standards
10. Performance Requirements
11. Platform-Specific Guidelines
12. Implementation Priorities

---

## 1. EXECUTIVE SUMMARY

### 1.1 Vision Statement
EcoSense is a hyper-local air quality monitoring application that empowers users
to make informed decisions about their outdoor activities, health precautions,
and daily routines based on real-time atmospheric data. The app combines
cutting-edge AI analysis, precise GPS-based location tracking, and intuitive
visualization to deliver actionable insights about air quality.

### 1.2 Target Users
- Health-conscious individuals monitoring daily air quality
- Students and staff at educational institutions (primary: IARE College)
- Outdoor enthusiasts planning activities
- Parents concerned about children's exposure to pollution
- Individuals with respiratory conditions (asthma, allergies, COPD)
- Environmental researchers and data enthusiasts
- Urban planners and policymakers

### 1.3 Key Value Propositions
- Real-time AQI monitoring with sub-meter location accuracy
- AI-powered health recommendations personalized to user context
- Institutional customization (college campuses, office parks, neighborhoods)
- Predictive air quality forecasting
- Community-driven pollution reporting
- Offline-first architecture with smart caching

---

## 2. CURRENT STATE ANALYSIS

### 2.1 Existing Features
- Google Maps integration with custom dark theme styling
- Real-time AQI fetching from Open-Meteo API
- Reverse geocoding for location names
- IARE College building coordinates with custom labeling
- 3D map view with tilt and rotation controls
- Bottom sheet with pollutant breakdown (PM2.5, PM10, O3, NO2, SO2, CO)
- AI-powered insights via local EcoBot backend
- City exploration panel with 16+ pre-loaded cities
- College quick-access panel with 13 buildings
- Search functionality with building name recognition

### 2.2 Current Pain Points Identified
- Building labels appear cluttered when multiple markers overlap
- Location accuracy sometimes shows Plus Codes instead of recognizable names
- AI insights can be slow to load on poor network connections
- Bottom sheet animation occasionally janky on lower-end devices
- Search doesn't provide autocomplete suggestions
- No historical data visualization
- No user accounts or data persistence
- Limited accessibility features
- No dark/light mode toggle based on system preference
- Missing onboarding flow for new users

### 2.3 Technical Debt
- Some hardcoded API keys need environment variable migration
- TypeScript types could be more strictly defined
- Component file is monolithic (1200+ lines)
- No state management library (all useState)
- Missing error boundaries
- No analytics or crash reporting

---

## 3. DESIGN PHILOSOPHY & PRINCIPLES

### 3.1 Core Design Principles

#### 3.1.1 Clarity Over Complexity
Every element on screen must serve a purpose. Remove visual noise.
Prioritize information hierarchy. The most critical data (current AQI)
should be immediately visible within 0.5 seconds of app load.

#### 3.1.2 Contextual Intelligence
The UI should adapt based on:
- Current location (college campus vs. city street)
- Time of day (sunrise/sunset, work hours)
- User behavior patterns (frequent locations, preferred metrics)
- Air quality severity (calm vs. hazardous conditions)
- Device capabilities (3D rendering, haptic feedback)

#### 3.1.3 Progressive Disclosure
Show essential information first, reveal details on demand.
Layer complexity so casual users aren't overwhelmed while
power users can access advanced features.

#### 3.1.4 Ambient Awareness
The app should communicate air quality status even when
minimized or in the background through:
- Dynamic app icon badges
- Lock screen widgets
- Notification summaries
- Watch complications

#### 3.1.5 Trustworthy Data Presentation
- Always show data freshness timestamps
- Indicate when data is cached vs. live
- Display confidence intervals where applicable
- Cite data sources transparently

### 3.2 Emotional Design Goals

#### 3.2.1 When AQI is Good (0-50)
- Evoke feelings of: Calm, freedom, confidence
- Color palette: Fresh greens, sky blues
- Animations: Gentle, flowing, expansive
- Messaging: Encouraging outdoor activity

#### 3.2.2 When AQI is Moderate (51-100)
- Evoke feelings of: Awareness, consideration
- Color palette: Warm yellows, soft ambers
- Animations: Subtle pulsing, attention-drawing
- Messaging: Balanced, informative

#### 3.2.3 When AQI is Unhealthy (101-150)
- Evoke feelings of: Caution, preparedness
- Color palette: Warning oranges, muted tones
- Animations: More prominent alerts
- Messaging: Action-oriented recommendations

#### 3.2.4 When AQI is Very Unhealthy (151-200)
- Evoke feelings of: Urgency, protection
- Color palette: Alert reds, serious tones
- Animations: Persistent visual indicators
- Messaging: Strong health advisories

#### 3.2.5 When AQI is Hazardous (201+)
- Evoke feelings of: Immediate action required
- Color palette: Deep purples, emergency indicators
- Animations: Critical alert patterns
- Messaging: Clear evacuation/protection instructions

---

## 4. DESIGN SYSTEM FOUNDATION

### 4.1 Color Palette

#### 4.1.1 Primary Colors
```
--color-primary-50:  #eff6ff   /* Lightest blue */
--color-primary-100: #dbeafe
--color-primary-200: #bfdbfe
--color-primary-300: #93c5fd
--color-primary-400: #60a5fa
--color-primary-500: #3b82f6   /* Primary brand blue */
--color-primary-600: #2563eb
--color-primary-700: #1d4ed8
--color-primary-800: #1e40af
--color-primary-900: #1e3a8a   /* Darkest blue */
```

#### 4.1.2 AQI Status Colors
```
/* Good (0-50) */
--aqi-good-light:    #dcfce7
--aqi-good-main:     #22c55e
--aqi-good-dark:     #15803d

/* Moderate (51-100) */
--aqi-moderate-light:  #fef9c3
--aqi-moderate-main:   #eab308
--aqi-moderate-dark:   #a16207

/* Unhealthy for Sensitive (101-150) */
--aqi-sensitive-light: #ffedd5
--aqi-sensitive-main:  #f97316
--aqi-sensitive-dark:  #c2410c

/* Unhealthy (151-200) */
--aqi-unhealthy-light: #fee2e2
--aqi-unhealthy-main:  #ef4444
--aqi-unhealthy-dark:  #b91c1c

/* Very Unhealthy (201-300) */
--aqi-very-light:    #f3e8ff
--aqi-very-main:     #a855f7
--aqi-very-dark:     #7e22ce

/* Hazardous (301+) */
--aqi-hazardous-light: #fce7f3
--aqi-hazardous-main:  #be185d
--aqi-hazardous-dark:  #831843
```

#### 4.1.3 Neutral Colors (Dark Theme)
```
--neutral-950: #0a0a0b    /* True black backgrounds */
--neutral-900: #0b1120    /* Primary background */
--neutral-850: #0f1729    /* Elevated surfaces */
--neutral-800: #141820    /* Cards, panels */
--neutral-700: #1e2533    /* Borders, dividers */
--neutral-600: #2a3040    /* Subtle borders */
--neutral-500: #4b5563    /* Muted text */
--neutral-400: #6b7280    /* Secondary text */
--neutral-300: #94a3b8    /* Primary text */
--neutral-200: #cbd5e1    /* Emphasized text */
--neutral-100: #e2e8f0    /* High contrast text */
--neutral-50:  #f8fafc    /* Maximum contrast */
```

#### 4.1.4 Semantic Colors
```
/* Success */
--semantic-success-bg:     rgba(34, 197, 94, 0.1)
--semantic-success-border: rgba(34, 197, 94, 0.3)
--semantic-success-text:   #22c55e

/* Warning */
--semantic-warning-bg:     rgba(234, 179, 8, 0.1)
--semantic-warning-border: rgba(234, 179, 8, 0.3)
--semantic-warning-text:   #eab308

/* Error */
--semantic-error-bg:       rgba(239, 68, 68, 0.1)
--semantic-error-border:   rgba(239, 68, 68, 0.3)
--semantic-error-text:     #ef4444

/* Info */
--semantic-info-bg:        rgba(59, 130, 246, 0.1)
--semantic-info-border:    rgba(59, 130, 246, 0.3)
--semantic-info-text:      #3b82f6
```

### 4.2 Typography

#### 4.2.1 Font Stack
```
--font-display: 'SF Pro Display', 'Inter', system-ui, sans-serif
--font-body:    'SF Pro Text', 'Inter', system-ui, sans-serif
--font-mono:    'SF Mono', 'JetBrains Mono', monospace
```

#### 4.2.2 Type Scale
```
--text-2xs:  0.625rem   /* 10px - Labels, badges */
--text-xs:   0.75rem    /* 12px - Captions, metadata */
--text-sm:   0.875rem   /* 14px - Body small */
--text-base: 1rem       /* 16px - Body default */
--text-lg:   1.125rem   /* 18px - Body large */
--text-xl:   1.25rem    /* 20px - Heading 5 */
--text-2xl:  1.5rem     /* 24px - Heading 4 */
--text-3xl:  1.875rem   /* 30px - Heading 3 */
--text-4xl:  2.25rem    /* 36px - Heading 2 */
--text-5xl:  3rem       /* 48px - Heading 1 */
--text-6xl:  3.75rem    /* 60px - Display */
--text-7xl:  4.5rem     /* 72px - Hero */
```

#### 4.2.3 Font Weights
```
--font-thin:       100
--font-extralight: 200
--font-light:      300
--font-normal:     400
--font-medium:     500
--font-semibold:   600
--font-bold:       700
--font-extrabold:  800
--font-black:      900
```

#### 4.2.4 Line Heights
```
--leading-none:    1
--leading-tight:   1.25
--leading-snug:    1.375
--leading-normal:  1.5
--leading-relaxed: 1.625
--leading-loose:   2
```

### 4.3 Spacing System
```
--space-0:   0
--space-px:  1px
--space-0.5: 0.125rem  /* 2px */
--space-1:   0.25rem   /* 4px */
--space-1.5: 0.375rem  /* 6px */
--space-2:   0.5rem    /* 8px */
--space-2.5: 0.625rem  /* 10px */
--space-3:   0.75rem   /* 12px */
--space-3.5: 0.875rem  /* 14px */
--space-4:   1rem      /* 16px */
--space-5:   1.25rem   /* 20px */
--space-6:   1.5rem    /* 24px */
--space-7:   1.75rem   /* 28px */
--space-8:   2rem      /* 32px */
--space-9:   2.25rem   /* 36px */
--space-10:  2.5rem    /* 40px */
--space-11:  2.75rem   /* 44px */
--space-12:  3rem      /* 48px */
--space-14:  3.5rem    /* 56px */
--space-16:  4rem      /* 64px */
--space-20:  5rem      /* 80px */
--space-24:  6rem      /* 96px */
--space-28:  7rem      /* 112px */
--space-32:  8rem      /* 128px */
```

### 4.4 Border Radius
```
--radius-none: 0
--radius-sm:   0.125rem  /* 2px */
--radius-md:   0.375rem  /* 6px */
--radius-lg:   0.5rem    /* 8px */
--radius-xl:   0.75rem   /* 12px */
--radius-2xl:  1rem      /* 16px */
--radius-3xl:  1.5rem    /* 24px */
--radius-full: 9999px
```

### 4.5 Shadows
```
/* Elevation 1 - Cards, buttons */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05)

/* Elevation 2 - Dropdowns, popovers */
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
             0 2px 4px -2px rgba(0, 0, 0, 0.1)

/* Elevation 3 - Modals, dialogs */
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
             0 4px 6px -4px rgba(0, 0, 0, 0.1)

/* Elevation 4 - Floating elements */
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
             0 8px 10px -6px rgba(0, 0, 0, 0.1)

/* Elevation 5 - Full-screen overlays */
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25)

/* Inset shadow for pressed states */
--shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)

/* Glow effects for AQI indicators */
--shadow-glow-green:  0 0 20px rgba(34, 197, 94, 0.4)
--shadow-glow-yellow: 0 0 20px rgba(234, 179, 8, 0.4)
--shadow-glow-orange: 0 0 20px rgba(249, 115, 22, 0.4)
--shadow-glow-red:    0 0 20px rgba(239, 68, 68, 0.4)
--shadow-glow-purple: 0 0 20px rgba(168, 85, 247, 0.4)
```

### 4.6 Animation Tokens
```
/* Durations */
--duration-instant:  0ms
--duration-fast:     100ms
--duration-normal:   200ms
--duration-slow:     300ms
--duration-slower:   500ms
--duration-slowest:  1000ms

/* Easings */
--ease-linear:     linear
--ease-in:         cubic-bezier(0.4, 0, 1, 1)
--ease-out:        cubic-bezier(0, 0, 0.2, 1)
--ease-in-out:     cubic-bezier(0.4, 0, 0.2, 1)
--ease-bounce:     cubic-bezier(0.68, -0.55, 0.265, 1.55)
--ease-spring:     cubic-bezier(0.175, 0.885, 0.32, 1.275)
```

---

## 5. CORE SCREENS & COMPONENTS

### 5.1 Splash Screen / App Launch

#### 5.1.1 Visual Design
- Full-screen gradient background transitioning from deep blue to teal
- Centered app logo with subtle breathing animation
- Loading indicator showing data initialization progress
- Version number and copyright in footer

#### 5.1.2 Loading States
```
State 1: "Initializing sensors..."     (0-20%)
State 2: "Acquiring location..."       (20-40%)
State 3: "Fetching air quality data..." (40-60%)
State 4: "Loading map resources..."     (60-80%)
State 5: "Preparing your experience..." (80-100%)
```

#### 5.1.3 Animations
- Logo scales from 0.8 to 1.0 with spring easing
- Progress bar fills with gradient animation
- On complete: Logo expands and fades, revealing main screen

### 5.2 Onboarding Flow (New Users)

#### 5.2.1 Screen 1: Welcome
- Hero illustration of clean air vs. polluted air
- Headline: "Breathe with Confidence"
- Subtext: "Know the air quality around you in real-time"
- Primary CTA: "Get Started"
- Secondary: "I've used this before" -> Skip to permissions

#### 5.2.2 Screen 2: Location Permission
- Illustration showing location pin and air quality zones
- Headline: "Enable Location Access"
- Subtext: "We need your location to show hyper-local air quality data"
- Bullet points explaining benefits
- Primary CTA: "Allow Location" -> System permission dialog
- Secondary: "Maybe Later" -> Continue with manual location

#### 5.2.3 Screen 3: Notification Permission
- Illustration showing phone with air quality alert
- Headline: "Stay Informed"
- Subtext: "Get alerts when air quality changes significantly"
- Toggle options:
  - [ ] Daily morning briefing
  - [ ] Unhealthy air alerts
  - [ ] Activity recommendations
- Primary CTA: "Enable Notifications"
- Secondary: "Skip for Now"

#### 5.2.4 Screen 4: Personalization
- Headline: "Customize Your Experience"
- Quick preferences:
  - Sensitivity level: Normal / Sensitive / Very Sensitive
  - Preferred units: US AQI / PM2.5 ug/m3
  - Home location: [Set on Map]
  - Work/School location: [Optional]
- Primary CTA: "Continue"

#### 5.2.5 Screen 5: Institution Setup (Optional)
- Headline: "Are you part of an institution?"
- Subtext: "Get custom building labels and location tracking"
- Search field: "Search for your school, college, or workplace"
- Quick select: "IARE - Institute of Aeronautical Engineering"
- Primary CTA: "Add Institution"
- Secondary: "Skip" -> Proceed to main app

### 5.3 Main Map Screen

#### 5.3.1 Map Component Specifications

**Map Container**
- Full viewport coverage (100vw x 100vh)
- Safe area insets respected
- Touch gesture handling: pinch-zoom, pan, rotate (3D mode)

**Map Style Options**
```
1. Dark Mode (Default)
   - Background: #0b1120
   - Roads: #2a3040
   - Water: #0e1525
   - Labels: #6b7280
   - Points of Interest: Subtle emerald for parks

2. Light Mode
   - Background: #f1f5f9
   - Roads: #e2e8f0
   - Water: #bfdbfe
   - Labels: #475569
   - Points of Interest: Standard Google colors

3. Satellite View
   - Hybrid satellite + labels
   - Custom label styling for visibility
   - Enhanced building footprints

4. Terrain View (New)
   - Topographic elevation data
   - Pollution dispersion visualization
   - Wind pattern overlay option
```

**Zoom Level Behaviors**
```
Zoom 1-5:   Country/continent view
            - Show national AQI averages
            - Color-coded country borders

Zoom 6-9:   Regional view
            - Show city-level AQI markers
            - Major cities labeled

Zoom 10-13: City view
            - Individual station markers
            - Neighborhood names visible
            - AQI gradient overlay option

Zoom 14-16: Neighborhood view
            - Building footprints visible
            - Institution labels appear
            - Street-level detail

Zoom 17-20: Street/building view
            - Individual building labels
            - Entrance markers
            - Micro-location features
```

#### 5.3.2 Search Bar Component

**Design Specifications**
- Height: 52px
- Background: rgba(20, 24, 32, 0.95)
- Backdrop blur: 24px
- Border: 1px solid rgba(255, 255, 255, 0.08)
- Border radius: 16px
- Padding: 0 16px

**Input Field**
- Font: 14px semibold
- Placeholder: "Search cities, buildings, or coordinates..."
- Placeholder color: #6b7280
- Text color: #ffffff

**Icons**
- Left: Search icon (18px, #6b7280)
- Right (conditional):
  - Clear button when text present
  - Microphone for voice search
  - Loading spinner during search

**Autocomplete Dropdown**
- Appears after 2 character minimum
- Maximum 6 suggestions visible
- Categories:
  - Locations (cities, addresses)
  - IARE Buildings (when relevant)
  - Recent searches
  - Suggested searches

**Search Result Types**
```
Type: City
  Icon: City emoji
  Primary: City name
  Secondary: State/country
  Action: Pan to city, add AQI marker

Type: Building (IARE)
  Icon: Building type emoji
  Primary: Building name
  Secondary: "IARE Campus"
  Action: Pan to building, add AQI marker, zoom to 18

Type: Address
  Icon: Pin emoji
  Primary: Street address
  Secondary: Area, city
  Action: Pan to location, add AQI marker

Type: Coordinates
  Icon: Target emoji
  Primary: Lat, Long formatted
  Secondary: "Custom location"
  Action: Pan to coordinates, add AQI marker
```

#### 5.3.3 Map Control Buttons

**Positioning**
- Right side of screen
- Top offset: 140px (below search + filter chips)
- Gap between buttons: 12px
- Button size: 44px x 44px

**Button Styles**
```
Default State:
  Background: rgba(20, 24, 32, 0.8)
  Border: 1px solid rgba(255, 255, 255, 0.1)
  Border radius: 16px
  Icon color: #e2e8f0
  Shadow: 0 8px 30px rgba(0, 0, 0, 0.5)

Hover State:
  Background: rgba(255, 255, 255, 0.1)

Active State:
  Background: Gradient (varies by button)
  Border: Theme color with 40% opacity
  Shadow: Theme-colored glow

Pressed State:
  Scale: 0.95
  Duration: 100ms
```

**Button Inventory**
```
1. Live Counter Badge
   - Shows: "{n} Live" with green pulse dot
   - Purpose: Display active AQI stations count

2. Zoom In (+)
   - Icon: Plus
   - Action: Increment zoom by 1

3. Zoom Out (-)
   - Icon: Minus
   - Action: Decrement zoom by 1

4. Locate Me
   - Icon: Crosshair
   - Active: Blue color, pulsing animation
   - Action: Pan to user location, add/update marker

5. Explore Cities
   - Icon: Globe
   - Active: Blue background
   - Action: Toggle city panel

6. College Campus
   - Icon: Graduation cap emoji
   - Active: Emerald gradient
   - Action: Pan to campus, switch to satellite, show panel

7. 3D View Toggle
   - Icon: Box/Cube
   - Active: Violet-blue gradient, pulsing
   - Action: Enable 45 degree tilt, satellite view

8. Rotation Controls (3D only)
   - Appears below 3D toggle when active
   - Rotate Left: -45 degrees
   - Rotate Right: +45 degrees
   - Reset: North-up orientation

9. Layers
   - Icon: Stacked layers
   - Action: Show map style selector
   - Options: Dark, Light, Satellite, Terrain
```

#### 5.3.4 AQI Marker Component

**Structure**
```
<AqiMarker>
  <GlowAura />           // Background glow effect
  <RadarRing />          // Selected state animation
  <LocationLabel />      // Name floating above
  <AqiNode>              // Main circular indicator
    <AqiValue />         // Number or loading spinner
    <UserBadge />        // Blue dot for user location
  </AqiNode>
  <ShadowFloor />        // 3D grounding effect
</AqiMarker>
```

**Size Specifications**
```
Glow Aura:
  - Default: 150% scale, 40% opacity
  - Hover: 200% scale, 60% opacity
  - Selected: 250% scale, 70% opacity

AQI Node:
  - Diameter: 48px
  - Border: 3px solid (AQI color, 40% opacity)
  - Background: rgba(20, 24, 32, 0.75)
  - Selected: White border, 110% scale

Label:
  - Position: -32px from center (above)
  - Padding: 8px horizontal, 4px vertical
  - Font: 9px bold uppercase
  - Default: Hidden, appear on hover
  - Selected: Always visible, blue background
```

**AQI Color Mapping**
```javascript
function getMarkerColors(aqi) {
  if (aqi <= 50) return {
    bg: 'bg-green-500',
    border: 'border-green-500/40',
    text: 'text-green-400',
    hex: '#22c55e',
    glow: 'shadow-glow-green',
    label: 'Good',
    emoji: 'happy',
    advice: 'Perfect for outdoor activities!'
  };

  if (aqi <= 100) return {
    bg: 'bg-yellow-500',
    border: 'border-yellow-500/40',
    text: 'text-yellow-400',
    hex: '#eab308',
    glow: 'shadow-glow-yellow',
    label: 'Moderate',
    emoji: 'slight_smile',
    advice: 'Acceptable for most activities.'
  };

  if (aqi <= 150) return {
    bg: 'bg-orange-500',
    border: 'border-orange-500/40',
    text: 'text-orange-400',
    hex: '#f97316',
    glow: 'shadow-glow-orange',
    label: 'Sensitive',
    emoji: 'neutral',
    advice: 'Sensitive groups should limit outdoor exertion.'
  };

  if (aqi <= 200) return {
    bg: 'bg-red-500',
    border: 'border-red-500/40',
    text: 'text-red-400',
    hex: '#ef4444',
    glow: 'shadow-glow-red',
    label: 'Unhealthy',
    emoji: 'worried',
    advice: 'Everyone should reduce prolonged outdoor exertion.'
  };

  if (aqi <= 300) return {
    bg: 'bg-purple-500',
    border: 'border-purple-500/40',
    text: 'text-purple-400',
    hex: '#a855f7',
    glow: 'shadow-glow-purple',
    label: 'Very Unhealthy',
    emoji: 'mask',
    advice: 'Avoid outdoor activities. Wear N95 mask if going out.'
  };

  return {
    bg: 'bg-rose-700',
    border: 'border-rose-700/40',
    text: 'text-rose-400',
    hex: '#be185d',
    glow: 'shadow-glow-purple',
    label: 'Hazardous',
    emoji: 'biohazard',
    advice: 'EMERGENCY: Stay indoors with air purification.'
  };
}
```

#### 5.3.5 Building Label Component (Campus Overlay)

**Visibility Rules**
- Appear when zoom >= 16
- Appear for all IARE buildings when campus is in viewport
- Independent of college panel state

**Design Specifications**
```
Container:
  - Transform: translateX(-50%) translateY(-50%)
  - Cursor: pointer
  - Transition: transform 200ms ease-out

Label Box:
  - Background: rgba(255, 255, 255, 0.95)
  - Padding: 6px 10px
  - Border radius: 6px
  - Border: 1px solid rgba(0, 0, 0, 0.1)
  - Shadow: 0 2px 8px rgba(0, 0, 0, 0.15)

Text:
  - Font: 10px semibold
  - Color: #1f2937
  - White-space: nowrap

Hover State:
  - Scale: 1.05
  - Shadow: 0 4px 12px rgba(0, 0, 0, 0.2)

Active/Tapped:
  - Scale: 0.98
  - Background: #f1f5f9
```

---

## 6. FEATURE SPECIFICATIONS

### 6.1 Real-Time Location Tracking

#### 6.1.1 High Accuracy Mode
```javascript
const locationOptions = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 0
};
```

#### 6.1.2 Campus Location Matching
When user location is within campus bounds:
1. Check against all building coordinates (30m radius)
2. If match found, display building name instead of geocoded address
3. If within campus but not near building, show "IARE Campus"
4. Outside campus: Use Google Reverse Geocoding

#### 6.1.3 Location Permission States
```
State: Granted
  - Show live location marker
  - Enable "Locate Me" button
  - Track location updates

State: Denied
  - Hide location marker
  - Show "Enable Location" prompt on button tap
  - Allow manual location selection

State: Prompt
  - Show permission request with explanation
  - "Allow" -> Enable features
  - "Don't Allow" -> Graceful degradation
```

### 6.2 Campus Building System

#### 6.2.1 Building Data Structure
```typescript
interface Building {
  id: string;
  name: string;
  shortName?: string;        // "BB" for Bharadwaja Block
  lat: number;
  lng: number;
  type: BuildingType;
  floors?: number;
  departments?: string[];
  amenities?: string[];
  operatingHours?: {
    weekdays: string;        // "08:00-18:00"
    weekends: string;        // "Closed"
  };
  imageUrl?: string;
}

type BuildingType =
  | 'academic'      // Classrooms, labs
  | 'administrative'// Offices
  | 'library'       // Library
  | 'facility'      // Canteen, workshops
  | 'sports'        // Courts, gyms
  | 'hostel'        // Dormitories
  | 'entrance'      // Gates
  | 'parking'       // Parking lots
  | 'medical'       // Health center
  | 'cafeteria'     // Dining halls
```

#### 6.2.2 Building Search Algorithm
```
Priority 1: Exact name match (case insensitive)
Priority 2: Name contains query
Priority 3: First word match ("bharadwaja" -> "Bharadwaja Block")
Priority 4: Short name match ("BB" -> "Bharadwaja Block")
Priority 5: Fuzzy match (Levenshtein distance < 3)
```

#### 6.2.3 Campus Quick Actions
- Tap graduation cap button -> Pan to campus center, show building panel
- Search "IARE" -> Go to campus
- Search "canteen" -> Jump to IARE Canteen building
- Locate Me (on campus) -> Show building name in marker

### 6.3 AI-Powered Insights

#### 6.3.1 Request Payload
```json
{
  "user_voice_text": "Give me a quick 2-sentence insight...",
  "current_aqi": 78,
  "location": "Bharadwaja Block",
  "latitude": 17.599903,
  "longitude": 78.416924,
  "timestamp": "2024-03-18T14:30:00Z",
  "user_sensitivity": "normal",
  "activity_context": "studying"
}
```

#### 6.3.2 Response Handling
```
Success (Streaming SSE):
  - Parse "data: {text}" chunks
  - Accumulate full response
  - Handle "data: [DONE]" terminator

Error/Offline Fallback:
  - Generate local advice based on AQI thresholds
  - Indicate offline status to user

Loading State:
  - Show "Analyzing atmospheric data..."
  - Animated scanning effect
```

#### 6.3.3 Insight Content Guidelines
```
AQI 0-50 (Good):
  "Air quality in {location} is excellent at {aqi}.
   Perfect conditions for outdoor exercise, sports, or campus walks!"

AQI 51-100 (Moderate):
  "Air quality in {location} is acceptable at {aqi}.
   Most activities are fine, but unusually sensitive individuals
   should consider reducing prolonged outdoor exertion."

AQI 101-150 (Sensitive):
  "Air quality in {location} is {aqi}, potentially unhealthy for
   sensitive groups. If you have asthma or respiratory issues,
   consider indoor alternatives."

AQI 151-200 (Unhealthy):
  "Warning: Air quality in {location} has reached {aqi}. Everyone should
   reduce outdoor activities. Use an N95 mask if you must go outside."

AQI 201+ (Very Unhealthy/Hazardous):
  "ALERT: Air quality in {location} is {aqi} - {category}.
   Stay indoors if possible. Use air purifiers. Avoid all outdoor
   physical activity."
```

### 6.4 Notification System (New Feature)

#### 6.4.1 Notification Types
```
1. Morning Briefing (8:00 AM daily)
   Title: "Good Morning! Today's AQI at {home_location}"
   Body: "Current AQI: {value}. {brief_advice}"
   Action: Open app to home location

2. Significant Change Alert
   Trigger: AQI changes by +/-30 within 2 hours
   Title: "Air Quality {Improving/Worsening}"
   Body: "AQI at {location} changed from {old} to {new}"
   Action: Open app to location

3. Unhealthy Threshold Alert
   Trigger: AQI crosses 100, 150, or 200
   Title: "Air Quality Alert"
   Body: "{location} air is now {category}. {advice}"
   Action: Open app with recommendations

4. Activity Recommendation
   Trigger: User-scheduled activity + AQI data
   Title: "About your planned {activity}..."
   Body: "AQI is {value}. {recommendation}"
   Action: Open app with alternatives
```

#### 6.4.2 Notification Preferences Screen
```
[Notification Preferences]

Alert Types
  - [x] Morning briefing
  - [x] Significant AQI changes
  - [x] Unhealthy air alerts
  - [ ] Activity recommendations

Monitored Locations
  - Home: Bharadwaja Block, IARE
  - Work: Not set [Add]
  - [+ Add custom location]

Quiet Hours
  - Enable: [Toggle]
  - From: 10:00 PM
  - To: 7:00 AM

Alert Sound
  - [Default / Chime / Urgent / Silent]
```

### 6.5 Historical Data & Trends (New Feature)

#### 6.5.1 Time Range Options
```
- Last 24 hours (hourly data points)
- Last 7 days (daily averages)
- Last 30 days (daily averages)
- Last 12 months (monthly averages)
- Custom range
```

#### 6.5.2 Chart Visualization
```
Chart Type: Line graph with area fill
X-Axis: Time (adaptive labels)
Y-Axis: AQI value (0-500 scale)

Features:
- Color-coded background zones (Good/Moderate/etc.)
- Tap to see exact value at point
- Pinch to zoom time range
- Compare multiple locations
- Show trendline
```

#### 6.5.3 Statistics Panel
```
Period: {selected_range}
-----------------------
Average AQI:     62
Best Day:        March 15 (AQI 28)
Worst Day:       March 12 (AQI 156)
Good Days:       22 / 30 (73%)
Unhealthy Days:  3 / 30 (10%)
-----------------------
Trend: Improving (-8% vs. prev month)
```

### 6.6 Widget Support (New Feature)

#### 6.6.1 iOS Widget Sizes
```
Small (2x2):
  - Current AQI value
  - Status emoji
  - Location name
  - Last updated time

Medium (4x2):
  - Current AQI with location
  - PM2.5, O3, NO2 quick stats
  - Updated time

Large (4x4):
  - Mini map preview
  - Current location AQI
  - 24-hour trend chart
  - Quick actions row
```

#### 6.6.2 Android Widget
```
Glanceable Widget (4x1):
  [Emoji AQI Status | Location | Time ago]

Detailed Widget (4x2):
  Similar to iOS Medium

Full Widget (4x4):
  Similar to iOS Large
```

### 6.7 Accessibility Features

#### 6.7.1 VoiceOver / TalkBack Announcements
```
AQI Marker:
  "Air quality at {location} is {category} with AQI {value}.
   {brief_advice}. Double tap for details."

Map Region:
  "Map showing {n} air quality stations.
   {nearest_location} nearest to you at AQI {value}."

Bottom Sheet:
  "Details for {location}. AQI {value}, {category}.
   Swipe up for more information or swipe down to dismiss."
```

#### 6.7.2 Dynamic Type Support
- All text scales with system font size
- Minimum tap target: 44x44 points
- High contrast mode support

#### 6.7.3 Reduce Motion
- Disable glow animations
- Disable parallax effects
- Use fade transitions instead of springs

---

## 7. INTERACTION DESIGN

### 7.1 Gesture Library

#### 7.1.1 Map Gestures
```
Single Tap:
  - On empty area: Add AQI station at location
  - On marker: Select station, show details
  - On building label: Select building, add AQI station

Double Tap:
  - Zoom in by 1 level, centered on tap point

Two-Finger Tap:
  - Zoom out by 1 level

Pinch:
  - Zoom in/out smoothly
  - Preserve center point

Two-Finger Rotate (3D mode):
  - Rotate map heading

Two-Finger Tilt (3D mode):
  - Adjust camera tilt (0-45 degrees)

Long Press:
  - Show context menu
  - Options: Add station, Navigate here, Share location
```

#### 7.1.2 Bottom Sheet Gestures
```
Drag Handle:
  - Pull up to expand
  - Pull down to collapse
  - Release velocity determines final state

Content Scroll (expanded):
  - Scroll content normally
  - Over-scroll at top triggers collapse

Swipe Dismiss:
  - Swipe down quickly to collapse
  - Threshold: 50px displacement OR velocity > 500
```

#### 7.1.3 Panel Gestures
```
City/College Panels:
  - Swipe left to dismiss (right-anchored panels)
  - Tap outside to dismiss
  - Scroll content vertically
```

### 7.2 State Machines

#### 7.2.1 Bottom Sheet States
```
HIDDEN -> COLLAPSED (Station selected)
COLLAPSED -> EXPANDED (Drag up, tap expand, or tap header)
EXPANDED -> COLLAPSED (Drag down, tap collapse)
COLLAPSED -> HIDDEN (Deselect station, tap map)
EXPANDED -> HIDDEN (N/A, must collapse first)
```

#### 7.2.2 Map Mode States
```
2D MODE <-> 3D MODE

3D Mode Sub-states:
  - Default (heading: 0 degrees, tilt: 45 degrees)
  - Rotated (heading: n degrees, tilt: 45 degrees)
  - Reset -> Default
```

### 7.3 Loading States

#### 7.3.1 AQI Marker Loading
```
Phase 1: Placeholder (immediate)
  - Gray marker with loading spinner
  - Name label shows "Loading..."

Phase 2: Fetching (0-3 seconds)
  - Spinner continues
  - Pulsing glow animation

Phase 3: Complete
  - Color transitions to AQI color
  - Number fades in
  - Glow activates
```

#### 7.3.2 AI Insight Loading
```
Phase 1: Initial
  - "Analyzing atmospheric data..."
  - Spinner in bot icon

Phase 2: Streaming
  - Text appears word by word
  - Cursor blink effect

Phase 3: Complete
  - Full message displayed
  - "Active" badge shows
```

#### 7.3.3 Search Loading
```
- Search icon becomes spinner
- Autocomplete shows skeleton items
- Results fade in on complete
```

---

## 8. ANIMATION & MOTION

### 8.1 Micro-Interactions

#### 8.1.1 Button Press
```css
.button:active {
  transform: scale(0.95);
  transition: transform 100ms ease-out;
}
```

#### 8.1.2 AQI Glow Pulse
```css
@keyframes aqi-pulse {
  0%, 100% {
    transform: scale(1.5);
    opacity: 0.4;
  }
  50% {
    transform: scale(1.8);
    opacity: 0.6;
  }
}

.aqi-glow {
  animation: aqi-pulse 3s ease-in-out infinite;
}
```

#### 8.1.3 Selected Marker Radar
```css
@keyframes radar-ping {
  0% {
    transform: scale(0.8);
    opacity: 0.6;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

.radar-ring {
  animation: radar-ping 1.5s ease-out infinite;
}
```

### 8.2 Page Transitions

#### 8.2.1 Panel Slide-In
```javascript
// Framer Motion config
const panelVariants = {
  hidden: {
    x: 100,
    opacity: 0
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 200
    }
  },
  exit: {
    x: 100,
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }
};
```

#### 8.2.2 Bottom Sheet Spring
```javascript
const sheetVariants = {
  collapsed: {
    height: 100
  },
  expanded: {
    height: 'auto',
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 200
    }
  }
};
```

### 8.3 Skeleton Loaders

#### 8.3.1 Text Skeleton
```css
.skeleton-text {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05) 25%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0.05) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

## 9. ACCESSIBILITY STANDARDS

### 9.1 WCAG 2.1 AA Compliance

#### 9.1.1 Color Contrast
- Normal text: minimum 4.5:1 ratio
- Large text: minimum 3:1 ratio
- UI components: minimum 3:1 ratio

#### 9.1.2 Touch Targets
- Minimum size: 44x44 points
- Minimum spacing: 8 points

#### 9.1.3 Focus Indicators
```css
.focusable:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
```

### 9.2 Screen Reader Support

#### 9.2.1 ARIA Labels
```html
<button
  aria-label="Locate me. Double tap to center map on your current location."
  role="button"
>
  <CrosshairIcon />
</button>

<div
  role="region"
  aria-label="Air quality details for Bharadwaja Block"
  aria-live="polite"
>
  ...
</div>
```

#### 9.2.2 Live Regions
```html
<!-- AQI updates -->
<div aria-live="polite" aria-atomic="true">
  AQI updated to {value}
</div>

<!-- Errors -->
<div aria-live="assertive" role="alert">
  {error_message}
</div>
```

---

## 10. PERFORMANCE REQUIREMENTS

### 10.1 Loading Metrics (Target)
```
First Contentful Paint (FCP):    < 1.5s
Largest Contentful Paint (LCP):  < 2.5s
Time to Interactive (TTI):       < 3.5s
Cumulative Layout Shift (CLS):   < 0.1
First Input Delay (FID):         < 100ms
```

### 10.2 Runtime Performance
```
60 FPS:
  - All animations
  - Map panning/zooming
  - Bottom sheet dragging

Memory:
  - Peak usage: < 150MB
  - No memory leaks on navigation

Battery:
  - Background location: Low power mode
  - Refresh interval: 3 minutes (configurable)
```

### 10.3 Network Optimization
```
API Caching:
  - AQI data: 60 second cache
  - Geocoding: 24 hour cache
  - Map tiles: Browser default

Offline Support:
  - Last known AQI values
  - Cached building data
  - Graceful error handling
```

---

## 11. PLATFORM-SPECIFIC GUIDELINES

### 11.1 iOS
- Support iOS 14.0+
- Respect safe area insets
- Support Dynamic Island (iPhone 14 Pro+)
- Implement Haptic feedback
- Support Live Activities for ongoing AQI monitoring

### 11.2 Android
- Support Android 8.0+ (API 26+)
- Material You dynamic theming
- Edge-to-edge display
- Predictive back gesture support

### 11.3 Web
- Progressive Web App (PWA)
- Responsive design (320px - 2560px)
- Keyboard navigation
- Print styles for reports

---

## 12. IMPLEMENTATION PRIORITIES

### Phase 1: Core Improvements (Week 1-2)
- [x] Fix building label visibility (zoom-based)
- [x] Improve location matching for campus
- [x] Refactor monolithic component into modules
- [x] Add error boundaries
- [x] Implement proper TypeScript types

### Phase 2: UX Enhancements (Week 3-4)
- [x] Search autocomplete
- [ ] Improved bottom sheet animations
- [ ] Loading skeletons
- [ ] Empty states
- [ ] Error states with retry

### Phase 3: New Features (Week 5-8)
- [ ] Historical data charts
- [ ] Notification system
- [ ] User accounts & preferences
- [ ] Multiple campus support
- [ ] Offline mode improvements

### Phase 4: Polish (Week 9-10)
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] Animation refinements
- [ ] Widget development
- [ ] Beta testing

---

## APPENDIX A: IARE Campus Building Data

```typescript
const IARE_COLLEGE = {
  id: 'iare-hyderabad',
  name: 'IARE',
  fullName: 'Institute of Aeronautical Engineering',
  location: {
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    center: { lat: 17.6001, lng: 78.4175 },
    bounds: {
      north: 17.6020,
      south: 17.5985,
      east: 78.4195,
      west: 78.4160
    }
  },
  buildings: [
    {
      id: 'bharadwaja-block',
      name: 'Bharadwaja Block',
      shortName: 'BB',
      lat: 17.599903,
      lng: 78.416924,
      type: 'academic',
      floors: 4,
      departments: ['CSE', 'IT', 'ECE'],
      amenities: ['WiFi', 'AC Labs', 'Projectors']
    },
    {
      id: 'abdul-kalam-block',
      name: 'Abdul Kalam Block',
      shortName: 'AKB',
      lat: 17.599639,
      lng: 78.417294,
      type: 'academic',
      floors: 4,
      departments: ['Mechanical', 'Civil', 'EEE']
    },
    {
      id: 'aryabhatta-block',
      name: 'Aryabhatta Block',
      shortName: 'AB',
      lat: 17.599878,
      lng: 78.417661,
      type: 'academic',
      floors: 3,
      departments: ['MBA', 'Basic Sciences']
    },
    {
      id: '5th-block',
      name: '5th Block',
      lat: 17.599799,
      lng: 78.418182,
      type: 'academic',
      floors: 3
    },
    {
      id: 'it-park',
      name: 'IT Park',
      lat: 17.600183,
      lng: 78.418238,
      type: 'academic',
      floors: 2,
      amenities: ['High-speed Internet', 'Server Room']
    },
    {
      id: 'tiic-center',
      name: 'TIIC Center',
      lat: 17.600462,
      lng: 78.416978,
      type: 'facility',
      description: 'Technology Incubation Center'
    },
    {
      id: 'canteen',
      name: 'IARE Canteen',
      lat: 17.600247,
      lng: 78.418606,
      type: 'cafeteria',
      operatingHours: {
        weekdays: '07:30-20:00',
        weekends: '08:00-18:00'
      }
    },
    {
      id: 'workshop',
      name: 'Engineering Workshop',
      lat: 17.599523,
      lng: 78.418172,
      type: 'facility'
    },
    {
      id: 'badminton-court',
      name: 'Indoor Badminton Court',
      lat: 17.600932,
      lng: 78.417066,
      type: 'sports'
    },
    {
      id: 'basketball-court',
      name: 'Basketball Court',
      lat: 17.599784,
      lng: 78.418563,
      type: 'sports'
    },
    {
      id: 'parking-1',
      name: 'IARE Parking',
      lat: 17.600968,
      lng: 78.417310,
      type: 'parking'
    },
    {
      id: 'parking-2',
      name: 'Car Parking',
      lat: 17.600607,
      lng: 78.417410,
      type: 'parking'
    },
    {
      id: 'main-entrance',
      name: 'Main Entrance',
      lat: 17.600372,
      lng: 78.416849,
      type: 'entrance'
    }
  ]
};
```

---

## APPENDIX B: API Contracts

### B.1 AQI Data Endpoint
```
GET https://air-quality-api.open-meteo.com/v1/air-quality
  ?latitude={lat}
  &longitude={lng}
  &current=us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone

Response:
{
  "current": {
    "us_aqi": 42,
    "pm10": 18.5,
    "pm2_5": 8.2,
    "carbon_monoxide": 234.5,
    "nitrogen_dioxide": 12.3,
    "sulphur_dioxide": 4.1,
    "ozone": 68.9
  }
}
```

### B.2 AI Insight Endpoint
```
POST http://localhost:8000/api/ask-ecobot
Content-Type: application/json

{
  "user_voice_text": "...",
  "current_aqi": 78,
  "location": "Bharadwaja Block",
  "latitude": 17.599903,
  "longitude": 78.416924
}

Response (SSE Stream):
data: {"text": "The "}
data: {"text": "air quality..."}
data: [DONE]
```

---

## END OF SPECIFICATION

Version: 2.0.0
Last Updated: March 18, 2026
Authors: EcoSense Product Team
