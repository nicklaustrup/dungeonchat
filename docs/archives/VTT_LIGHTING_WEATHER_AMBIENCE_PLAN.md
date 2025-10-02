# VTT Lighting, Weather & Ambience Implementation Plan

**Date**: January 2025  
**Status**: 📋 Planning Phase  
**Priority**: High - Enhances immersion and gameplay experience

---

## Executive Summary

This document outlines the implementation plan for three major atmospheric features:
1. **Dynamic Lighting System** - Token-based light sources, day/night cycles, shadows
2. **Weather Effects** - Rain, snow, fog, wind with visual and gameplay impacts
3. **Ambience System** - Background sounds, music, atmospheric audio

These features will dramatically improve immersion and provide DMs with powerful storytelling tools.

---

## 1. Dynamic Lighting System

### 1.1 Core Features

#### Light Sources
- **Token Lights** - Torches, lanterns, spells (Dancing Lights, Light cantrip)
- **Static Lights** - Braziers, fireplaces, magical crystals, windows
- **Ambient Light** - Day/night cycle, indoor/outdoor lighting
- **Magical Effects** - Darkness spell, Daylight spell, colored light zones

#### Light Properties
```javascript
{
  type: 'point' | 'cone' | 'ambient' | 'area',
  radius: number,              // in grid units
  intensity: 0-1,              // brightness
  color: '#RRGGBB',           // light color (white, orange, blue, etc.)
  flicker: boolean,           // animated flicker effect
  animated: boolean,          // pulsing/breathing animation
  castsShadows: boolean,      // performance-intensive
  attachedTo: tokenId | null, // moves with token
  position: { x, y },         // for static lights
  angle: number,              // for directional/cone lights
  falloff: 'linear' | 'quadratic' | 'realistic'
}
```

### 1.2 Vision & Line of Sight

#### Token Vision
```javascript
{
  tokenId: string,
  visionRadius: number,        // darkvision/normal vision range
  visionType: 'normal' | 'darkvision' | 'blindsight' | 'truesight',
  lightSensitive: boolean,     // sunlight sensitivity (drow, etc.)
  canSeeThroughDarkness: boolean
}
```

#### Dynamic Fog of War
- **Revealed Areas** - Stay visible but dimmed when no tokens present
- **Active Vision** - Brightly lit areas where tokens can currently see
- **Shadows** - Dark areas blocked by walls/obstacles
- **Partial Vision** - Dim light conditions (disadvantage on Perception)

### 1.3 UI Components

#### Light Source Manager Panel
```
┌─────────────────────────────────────┐
│ 🔦 Light Sources                    │
├─────────────────────────────────────┤
│ Token Lights:                       │
│  ⚫ Paladin's Torch   [🔧] [🗑️]    │
│     Range: 20ft • Color: Orange     │
│  ⚫ Wizard's Light    [🔧] [🗑️]    │
│     Range: 40ft • Color: White      │
│                                     │
│ Static Lights:                      │
│  💡 Fireplace       [🔧] [🗑️]     │
│     Range: 30ft • Flicker: On       │
│                                     │
│ [+ Add Light Source]                │
│                                     │
│ Global Lighting:                    │
│  Time: [====·····] 14:00           │
│  ☀️ Day  🌅 Dusk  🌙 Night         │
│  Ambient: [====·····] 70%          │
└─────────────────────────────────────┘
```

#### Light Source Editor Modal
```
┌─────────────────────────────────────┐
│ Edit Light Source                   │
├─────────────────────────────────────┤
│ Type:                               │
│  ⚪ Point Light  ⚪ Cone  ⚪ Area    │
│                                     │
│ Radius: [20] grid units             │
│ ░░░░░░░░░░░░░░░░ (20)              │
│                                     │
│ Color: [🎨] [#FF8800]              │
│ [Orange] [White] [Blue] [Custom]    │
│                                     │
│ Intensity: [80]%                    │
│ ░░░░░░░░░░░░░░░ (80)               │
│                                     │
│ Effects:                            │
│  ☑️ Flicker animation               │
│  ☐ Pulse/breathing                 │
│  ☐ Cast shadows (performance)      │
│                                     │
│ Attach to Token:                    │
│  [Select Token ▼] None              │
│                                     │
│        [Cancel]  [Apply]            │
└─────────────────────────────────────┘
```

### 1.4 Technical Implementation

#### New Service: `lightingService.js`
```javascript
// Service for managing lighting system
export const lightingService = {
  // Light source CRUD
  createLightSource(firestore, campaignId, mapId, lightData),
  updateLightSource(firestore, campaignId, mapId, lightId, updates),
  deleteLightSource(firestore, campaignId, mapId, lightId),
  subscribeToLights(firestore, campaignId, mapId, callback),
  
  // Token vision
  updateTokenVision(firestore, campaignId, mapId, tokenId, visionData),
  calculateVisibleArea(tokenPosition, visionRadius, obstacles),
  
  // Global lighting
  updateGlobalLighting(firestore, campaignId, mapId, settings),
  getDayNightCycle(time), // Returns ambient light level
  
  // Calculations
  calculateLightIntensity(distance, lightRadius, falloff),
  blendLightColors(lights), // Combine overlapping lights
  castShadows(lightPosition, obstacles) // Ray casting for shadows
};
```

#### New Hook: `useLighting.js`
```javascript
const useLighting = (campaignId, mapId) => {
  const [lights, setLights] = useState([]);
  const [globalLighting, setGlobalLighting] = useState({
    timeOfDay: 12.0, // 0-24 hours
    ambientLight: 0.7, // 0-1
    outdoorLighting: true
  });
  
  // Calculate composite lighting for a point
  const getLightingAt = useCallback((x, y) => {
    // Combine all light sources
    // Return { intensity, color, isLit }
  }, [lights, globalLighting]);
  
  // Get visible area for a token
  const getTokenVisibleArea = useCallback((token) => {
    // Calculate vision polygon
    // Consider light sources and obstacles
  }, [lights, tokens]);
  
  return {
    lights,
    globalLighting,
    getLightingAt,
    getTokenVisibleArea,
    updateGlobalLighting,
    addLight,
    removeLight,
    updateLight
  };
};
```

#### Canvas Rendering
```javascript
// Add to MapCanvas.jsx
<Layer name="lighting-layer">
  {/* Render light sources as gradients */}
  {lights.map(light => (
    <LightSource
      key={light.id}
      light={light}
      opacity={globalLighting.ambientLight}
    />
  ))}
  
  {/* Darkness overlay with light cutouts */}
  <Rect
    x={0}
    y={0}
    width={map.width}
    height={map.height}
    fill="black"
    opacity={1 - globalLighting.ambientLight}
    globalCompositeOperation="destination-over"
  />
</Layer>
```

---

## 2. Weather Effects System

### 2.1 Weather Types

#### Precipitation
- **Rain** - Light drizzle to heavy downpour
  - Visual: Animated rain drops falling
  - Audio: Pitter-patter sound effects
  - Gameplay: Disadvantage on Perception (hearing), extinguishes fires
  
- **Snow** - Light flurries to blizzard
  - Visual: Animated snowflakes, accumulation layer
  - Audio: Wind howling, snow crunching
  - Gameplay: Difficult terrain, reduced visibility
  
- **Hail** - Dangerous ice balls
  - Visual: Larger, faster particles with impact effects
  - Audio: Crashing, tinkling ice sounds
  - Gameplay: Potential damage, extinguishes fires

#### Environmental
- **Fog/Mist** - Reduces visibility
  - Visual: Semi-transparent fog layer, animated wisps
  - Gameplay: Heavily obscures vision, disadvantage on Perception
  
- **Wind** - Affects ranged attacks
  - Visual: Leaves/debris blowing, particle direction changes
  - Audio: Howling, whistling wind
  - Gameplay: Disadvantage on ranged attacks, extinguishes flames
  
- **Sandstorm** - Desert hazard
  - Visual: Brown/tan particle storm
  - Audio: Wind + gritty sand sounds
  - Gameplay: Blindness, difficult terrain, damage

#### Magical Weather
- **Magical Darkness** - Supernatural shadow
- **Arcane Storm** - Lightning, magical energy
- **Blood Rain** - Ominous red precipitation
- **Spectral Fog** - Ghostly, glowing mist

### 2.2 Weather Properties

```javascript
{
  type: 'rain' | 'snow' | 'fog' | 'wind' | 'hail' | 'sandstorm',
  intensity: 0-1,              // 0=light, 0.5=moderate, 1=heavy
  direction: 0-360,            // wind direction in degrees
  duration: number,            // -1 for infinite
  startTime: timestamp,
  visibility: number,          // 0-1, affects fog of war
  soundVolume: 0-1,           // ambient sound level
  particleCount: number,       // performance vs quality
  affectsGameplay: boolean,    // apply mechanical effects
  
  // Gameplay effects
  effects: {
    difficultTerrain: boolean,
    disadvantagePerception: boolean,
    disadvantageRanged: boolean,
    extinguishesFires: boolean,
    damagePerRound: number
  }
}
```

### 2.3 UI Components

#### Weather Control Panel
```
┌─────────────────────────────────────┐
│ 🌦️ Weather & Atmosphere             │
├─────────────────────────────────────┤
│ Active Weather:                     │
│  🌧️ Heavy Rain                      │
│     Intensity: [====·····] 80%     │
│     Duration: Ongoing               │
│     [Edit] [Stop]                   │
│                                     │
│ Quick Presets:                      │
│  [Clear] [Rain] [Snow] [Fog]       │
│  [Storm] [Blizzard] [Custom...]    │
│                                     │
│ Gameplay Effects:                   │
│  ☑️ Difficult terrain               │
│  ☑️ Perception disadvantage         │
│  ☐ Ranged attack disadvantage      │
│  ☑️ Extinguish open flames          │
│                                     │
│ Ambience:                           │
│  🔊 Volume: [====·····] 60%        │
│  [🎵 Rain Sounds]                   │
└─────────────────────────────────────┘
```

#### Weather Effect Creator
```
┌─────────────────────────────────────┐
│ Create Weather Effect               │
├─────────────────────────────────────┤
│ Weather Type:                       │
│  ⚫ Rain   ⚪ Snow   ⚪ Fog          │
│  ⚪ Wind   ⚪ Storm  ⚪ Custom        │
│                                     │
│ Intensity:                          │
│  Light [===······] Heavy            │
│                                     │
│ Duration:                           │
│  ⚪ 1 Round  ⚪ 1 Minute  ⚪ 1 Hour   │
│  ⚫ Ongoing  ⚪ Custom: [___] rounds │
│                                     │
│ Visual Settings:                    │
│  Particle Density: [Medium ▼]      │
│  Animation Speed: [Normal ▼]       │
│  Wind Direction: [⬆️] 90°          │
│                                     │
│ Audio Settings:                     │
│  ☑️ Enable ambient sounds           │
│  Volume: [====····] 70%            │
│  Sound: [Rain - Heavy ▼]           │
│                                     │
│ Gameplay Effects:                   │
│  ☑️ Apply mechanical effects        │
│  [Configure Effects...]             │
│                                     │
│      [Cancel]  [Create Weather]     │
└─────────────────────────────────────┘
```

### 2.4 Technical Implementation

#### New Service: `weatherService.js`
```javascript
export const weatherService = {
  // Weather CRUD
  createWeather(firestore, campaignId, mapId, weatherData),
  updateWeather(firestore, campaignId, mapId, weatherId, updates),
  deleteWeather(firestore, campaignId, mapId, weatherId),
  subscribeToWeather(firestore, campaignId, mapId, callback),
  
  // Presets
  getWeatherPresets(), // Returns common weather configurations
  applyPreset(preset),
  
  // Effects
  calculateVisibilityReduction(weatherType, intensity),
  getGameplayEffects(weatherType, intensity)
};
```

#### New Component: `WeatherLayer.jsx`
```javascript
const WeatherLayer = ({ weather, width, height }) => {
  const particles = useMemo(() => 
    generateWeatherParticles(weather, width, height),
    [weather, width, height]
  );
  
  return (
    <Layer name="weather-layer">
      {/* Rain drops */}
      {weather.type === 'rain' && particles.map((particle, i) => (
        <Line
          key={i}
          points={[particle.x, particle.y, particle.x + 2, particle.y + 10]}
          stroke="rgba(200, 200, 255, 0.3)"
          strokeWidth={1}
          listening={false}
        />
      ))}
      
      {/* Snow flakes */}
      {weather.type === 'snow' && particles.map((particle, i) => (
        <Circle
          key={i}
          x={particle.x}
          y={particle.y}
          radius={2}
          fill="rgba(255, 255, 255, 0.8)"
          listening={false}
        />
      ))}
      
      {/* Fog overlay */}
      {weather.type === 'fog' && (
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="rgba(200, 200, 200, 0.4)"
          listening={false}
        />
      )}
    </Layer>
  );
};
```

#### Animation System
```javascript
// Animate weather particles
useEffect(() => {
  if (!weather || !weatherActive) return;
  
  let animationFrame;
  const animate = () => {
    // Update particle positions
    updateParticles(weather.type, weather.intensity, weather.direction);
    animationFrame = requestAnimationFrame(animate);
  };
  
  animationFrame = requestAnimationFrame(animate);
  return () => cancelAnimationFrame(animationFrame);
}, [weather]);
```

---

## 3. Ambience System

### 3.1 Audio Features

#### Background Music
- **Combat Tracks** - Intense, fast-paced battle music
- **Exploration Tracks** - Ambient, mysterious exploration
- **Tavern Tracks** - Lively, social atmosphere
- **Dungeon Tracks** - Dark, ominous underground
- **Boss Tracks** - Epic, dramatic boss encounters
- **Rest Tracks** - Calm, peaceful resting music

#### Ambient Sounds
- **Nature** - Birds chirping, wind rustling, water flowing
- **Urban** - City crowds, market chatter, horse hooves
- **Dungeon** - Dripping water, distant echoes, chains rattling
- **Weather** - Rain pattering, thunder rumbling, wind howling
- **Magical** - Arcane humming, energy crackling, mystical chimes

#### Sound Effects
- **Environmental** - Door creaks, torch flickers, footsteps
- **Combat** - Sword clashes, spell casts, shield blocks
- **Creature** - Monster roars, animal calls, undead moans

### 3.2 Audio Properties

```javascript
{
  type: 'music' | 'ambient' | 'soundEffect',
  url: string,                // Audio file URL
  name: string,               // Display name
  category: string,           // Combat, Exploration, etc.
  volume: 0-1,                // Playback volume
  loop: boolean,              // Repeat continuously
  fadeIn: number,             // Fade in duration (ms)
  fadeOut: number,            // Fade out duration (ms)
  spatial: boolean,           // 3D positional audio
  position: { x, y },         // For spatial audio
  radius: number,             // Audible radius for spatial
  startTime: timestamp,
  duration: number            // -1 for infinite
}
```

### 3.3 UI Components

#### Ambience Control Panel
```
┌─────────────────────────────────────┐
│ 🎵 Ambience & Audio                 │
├─────────────────────────────────────┤
│ Now Playing:                        │
│  🎵 "Tavern Revelry"                │
│     [⏸️] [⏭️] [🔊] 70%              │
│     ░░░░░░░░·········· 2:34 / 4:12 │
│                                     │
│ Music Library:                      │
│  📁 Combat                          │
│  📁 Exploration                     │
│  📁 Social                          │
│  📁 Boss Battles                    │
│  [+ Upload Track]                   │
│                                     │
│ Active Ambience:                    │
│  🌊 Ocean Waves        [🔊] [🗑️]   │
│  🔥 Crackling Fire     [🔊] [🗑️]   │
│  🌧️ Rain (from weather) [🔊]       │
│                                     │
│ Quick Atmospheres:                  │
│  [🍺 Tavern] [🏰 Castle] [🌲 Forest]│
│  [⚔️ Combat] [🎭 Dramatic] [😴 Rest]│
│                                     │
│ Master Volume:                      │
│  Music:   [====·····] 70%          │
│  Ambient: [======···] 80%          │
│  SFX:     [=====····] 65%          │
└─────────────────────────────────────┘
```

#### Audio Trigger System
```
┌─────────────────────────────────────┐
│ Audio Trigger Setup                 │
├─────────────────────────────────────┤
│ Trigger Type:                       │
│  ⚫ Area Enter  ⚪ Combat Start      │
│  ⚪ Token Click ⚪ Manual            │
│                                     │
│ Trigger Area: (if area enter)      │
│  [Draw Area on Map...]              │
│                                     │
│ Audio to Play:                      │
│  [Select Track ▼] Dungeon Ambience  │
│                                     │
│ Playback:                           │
│  ☑️ Loop continuously                │
│  ☑️ Fade in (2s)                     │
│  ☐ Stop other music                 │
│                                     │
│ Volume: [====·····] 60%            │
│                                     │
│       [Cancel]  [Create Trigger]    │
└─────────────────────────────────────┘
```

### 3.4 Technical Implementation

#### New Service: `ambienceService.js`
```javascript
export const ambienceService = {
  // Audio track management
  uploadAudioTrack(file, metadata),
  deleteAudioTrack(trackId),
  getAudioLibrary(campaignId),
  
  // Playback control
  playTrack(trackId, options),
  stopTrack(trackId, fadeOut),
  pauseTrack(trackId),
  resumeTrack(trackId),
  setVolume(trackId, volume),
  
  // Playlists
  createPlaylist(name, trackIds),
  playPlaylist(playlistId, shuffle),
  
  // Spatial audio
  createSpatialAudio(trackId, position, radius),
  updateSpatialAudioPosition(audioId, position),
  
  // Triggers
  createAudioTrigger(campaignId, mapId, triggerData),
  checkAudioTriggers(tokenPosition, triggers)
};
```

#### New Hook: `useAmbience.js`
```javascript
const useAmbience = (campaignId, mapId) => {
  const [activeTracks, setActiveTracks] = useState([]);
  const [masterVolume, setMasterVolume] = useState({
    music: 0.7,
    ambient: 0.8,
    sfx: 0.65
  });
  
  const audioContextRef = useRef(null);
  const tracksRef = useRef({});
  
  const playTrack = useCallback((track, options = {}) => {
    // Create audio element or use Web Audio API
    // Apply volume, fade in, spatial effects
  }, []);
  
  const stopTrack = useCallback((trackId, fadeOut = 0) => {
    // Fade out and stop audio
  }, []);
  
  const playAtmosphere = useCallback((atmospherePreset) => {
    // Play a combination of music + ambient sounds
    // e.g., "tavern" = tavern music + crowd chatter + fire crackling
  }, []);
  
  return {
    activeTracks,
    playTrack,
    stopTrack,
    pauseTrack,
    resumeTrack,
    setVolume,
    playAtmosphere,
    masterVolume,
    setMasterVolume
  };
};
```

#### Web Audio API Integration
```javascript
// Advanced audio with 3D positioning
const AudioManager = {
  context: null,
  
  init() {
    this.context = new (window.AudioContext || window.webkitAudioContext)();
    this.listener = this.context.listener;
  },
  
  createSpatialSource(audioBuffer, position, radius) {
    const source = this.context.createBufferSource();
    const panner = this.context.createPanner();
    const gainNode = this.context.createGain();
    
    source.buffer = audioBuffer;
    
    // Configure 3D positioning
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = radius * 0.5;
    panner.maxDistance = radius;
    panner.setPosition(position.x, position.y, 0);
    
    // Connect nodes
    source.connect(panner);
    panner.connect(gainNode);
    gainNode.connect(this.context.destination);
    
    return { source, panner, gainNode };
  },
  
  updateListenerPosition(cameraPosition) {
    this.listener.setPosition(cameraPosition.x, cameraPosition.y, 0);
  }
};
```

---

## 4. Integration & Architecture

### 4.1 Component Hierarchy

```
VTTSession
├── MapCanvas
│   ├── GridLayer
│   ├── FogOfWarLayer
│   ├── LightingLayer ⭐ NEW
│   ├── TokenLayer
│   ├── WeatherLayer ⭐ NEW
│   └── DrawingLayer
├── MapToolbar
├── TokenManager
├── LightingPanel ⭐ NEW
├── WeatherPanel ⭐ NEW
└── AmbiencePanel ⭐ NEW
```

### 4.2 State Management

```javascript
// VTTSession state additions
const [lighting, setLighting] = useState({
  enabled: false,
  lights: [],
  globalSettings: {}
});

const [weather, setWeather] = useState({
  enabled: false,
  current: null
});

const [ambience, setAmbience] = useState({
  musicEnabled: true,
  ambienceEnabled: true,
  activeTracks: [],
  masterVolume: {}
});
```

### 4.3 Performance Considerations

#### Optimization Strategies
1. **Lighting**
   - Use canvas compositing instead of calculating per-pixel
   - Limit shadow casting to essential lights only
   - Cache light radius calculations
   - Use simple radial gradients instead of ray casting for basic lights

2. **Weather**
   - Particle pooling (reuse particles instead of creating/destroying)
   - Limit particle count based on viewport size
   - Use simpler shapes for distant particles
   - Disable weather when zoomed out significantly

3. **Audio**
   - Lazy load audio files
   - Use compressed audio formats (MP3, OGG)
   - Limit concurrent audio tracks
   - Use Web Audio API for better performance than `<audio>` elements

#### Performance Budget
```javascript
const PERFORMANCE_SETTINGS = {
  lighting: {
    maxLights: 20,
    maxShadowCasters: 5,
    updateFPS: 30 // Lower than canvas FPS for performance
  },
  weather: {
    maxParticles: {
      low: 100,
      medium: 300,
      high: 500
    },
    updateFPS: 20
  },
  audio: {
    maxConcurrentTracks: 5,
    spatialAudioRadius: 500 // grid units
  }
};
```

---

## 5. Implementation Phases

### Phase 1: Dynamic Lighting (Week 1-2) 🎯 Priority
**Goal**: Basic lighting system with token lights and global lighting

#### Tasks:
- [ ] Create `lightingService.js`
- [ ] Create `useLighting.js` hook
- [ ] Implement `LightingPanel.jsx` UI
- [ ] Add `LightingLayer` to MapCanvas
- [ ] Implement point lights with radial gradients
- [ ] Add global day/night cycle slider
- [ ] Test with 5-10 light sources
- [ ] Performance testing

**Deliverables**:
- Working point lights attached to tokens
- Global lighting control (day/night)
- Light source manager panel
- Basic light rendering on canvas

---

### Phase 2: Enhanced Lighting (Week 3) 🔥
**Goal**: Advanced lighting features

#### Tasks:
- [ ] Implement directional/cone lights (for spells like Burning Hands)
- [ ] Add light colors (warm orange, cool blue, magical purple)
- [ ] Implement flicker animation
- [ ] Add pulse/breathing effects
- [ ] Token vision system (darkvision, blindsight)
- [ ] Dynamic fog of war based on token vision + lighting
- [ ] Shadow casting (optional, performance-intensive)

**Deliverables**:
- Multiple light types
- Animated lighting effects
- Vision-based fog of war
- Enhanced immersion

---

### Phase 3: Weather System (Week 4) 🌧️
**Goal**: Core weather effects

#### Tasks:
- [ ] Create `weatherService.js`
- [ ] Create `useWeather.js` hook
- [ ] Implement `WeatherPanel.jsx` UI
- [ ] Create `WeatherLayer.jsx` component
- [ ] Implement rain effect with particles
- [ ] Implement snow effect with particles
- [ ] Implement fog overlay effect
- [ ] Add weather presets (light rain, heavy storm, blizzard)
- [ ] Particle animation system
- [ ] Performance optimization (particle pooling)

**Deliverables**:
- Working rain, snow, and fog effects
- Weather control panel
- Visual particle animations
- Weather presets

---

### Phase 4: Weather Enhancement (Week 5) 💨
**Goal**: Additional weather types and gameplay integration

#### Tasks:
- [ ] Implement wind effect (directional particles)
- [ ] Implement hail and sandstorm
- [ ] Add gameplay effect toggles (difficult terrain, disadvantage, etc.)
- [ ] Weather intensity controls
- [ ] Weather duration timer
- [ ] Multiple simultaneous weather effects
- [ ] Integration with lighting (fog reduces light, etc.)

**Deliverables**:
- Complete weather system
- Gameplay mechanical effects
- Weather + lighting interactions

---

### Phase 5: Ambience System (Week 6) 🎵
**Goal**: Audio atmosphere

#### Tasks:
- [ ] Create `ambienceService.js`
- [ ] Create `useAmbience.js` hook
- [ ] Implement `AmbiencePanel.jsx` UI
- [ ] Audio file upload system
- [ ] Basic audio playback (music, ambient)
- [ ] Volume controls (master, music, ambient, SFX)
- [ ] Audio library management
- [ ] Playlist creation
- [ ] Quick atmosphere presets (tavern, combat, dungeon)

**Deliverables**:
- Working audio playback
- Audio library system
- Volume controls
- Atmosphere presets

---

### Phase 6: Advanced Audio (Week 7) 🔊
**Goal**: Spatial audio and triggers

#### Tasks:
- [ ] Web Audio API integration
- [ ] Spatial/positional audio
- [ ] Audio triggers (enter area, combat start)
- [ ] Crossfade between tracks
- [ ] Audio visualization (optional)
- [ ] Integration with weather (automatic rain sounds)
- [ ] Sound effect library

**Deliverables**:
- 3D spatial audio
- Audio trigger system
- Complete ambience system

---

## 6. Database Schema

### Firestore Collections

```javascript
// campaigns/{campaignId}/maps/{mapId}/lights/{lightId}
{
  id: string,
  type: 'point' | 'cone' | 'ambient' | 'area',
  position: { x: number, y: number },
  radius: number,
  intensity: number,
  color: string,
  flicker: boolean,
  animated: boolean,
  attachedTo: string | null, // tokenId
  angle: number,
  falloff: string,
  createdBy: string,
  createdAt: timestamp
}

// campaigns/{campaignId}/maps/{mapId}/weather/{weatherId}
{
  id: string,
  type: string,
  intensity: number,
  direction: number,
  startTime: timestamp,
  duration: number,
  visibility: number,
  soundVolume: number,
  particleCount: number,
  affectsGameplay: boolean,
  effects: object,
  createdBy: string,
  createdAt: timestamp
}

// campaigns/{campaignId}/audio/{trackId}
{
  id: string,
  name: string,
  type: 'music' | 'ambient' | 'soundEffect',
  category: string,
  url: string,
  duration: number,
  volume: number,
  loop: boolean,
  uploadedBy: string,
  uploadedAt: timestamp
}

// campaigns/{campaignId}/maps/{mapId}/audioTriggers/{triggerId}
{
  id: string,
  type: 'areaEnter' | 'combatStart' | 'manual',
  trackId: string,
  area: polygon | null,
  playback: object,
  createdBy: string,
  createdAt: timestamp
}
```

---

## 7. User Stories

### DM Perspective

**Lighting**
> "As a DM, I want to create a torch attached to the fighter's token so the party can explore a dark dungeon realistically."

> "As a DM, I want to set the time of day to dusk so the outdoor encounter has appropriate lighting."

> "As a DM, I want to place magical crystals that emit blue light to create an otherworldly atmosphere."

**Weather**
> "As a DM, I want to add heavy rain during the battle so players feel the intensity of fighting in a storm."

> "As a DM, I want to create a fog effect to reduce visibility and add tension to the encounter."

> "As a DM, I want the rain to give disadvantage on Perception checks for hearing."

**Ambience**
> "As a DM, I want to play tavern music when the party enters the inn so they feel immersed in the setting."

> "As a DM, I want ominous dungeon ambience to automatically start when tokens enter the crypt."

> "As a DM, I want to quickly switch to intense combat music when initiative is rolled."

### Player Perspective

**Lighting**
> "As a player, I want my torch to illuminate the area around me so I can see in the dark dungeon."

> "As a player with darkvision, I want to see further than characters without it."

**Weather**
> "As a player, I want to see snow falling during our arctic expedition to feel the harsh environment."

> "As a player, I want fog to actually obscure distant enemies like it would in real life."

**Ambience**
> "As a player, I want to hear ambient sounds that match our location to feel more immersed."

> "As a player, I want battle music during combat to get excited and engaged."

---

## 8. Testing Plan

### Unit Tests
- [ ] `lightingService` CRUD operations
- [ ] `weatherService` CRUD operations
- [ ] `ambienceService` audio playback
- [ ] `useLighting` hook calculations
- [ ] `useWeather` hook particle generation
- [ ] `useAmbience` hook volume control

### Integration Tests
- [ ] Light source creation and rendering
- [ ] Weather effect creation and animation
- [ ] Audio track upload and playback
- [ ] Lighting + fog of war integration
- [ ] Weather + lighting interaction
- [ ] Audio triggers activation

### Performance Tests
- [ ] 20+ light sources rendering
- [ ] 500 weather particles animation
- [ ] 5 concurrent audio tracks
- [ ] Combined: lighting + weather + audio
- [ ] Frame rate monitoring (target: 60 FPS)

### User Acceptance Testing
- [ ] DM can create and control all features
- [ ] Players can see lighting effects
- [ ] Weather effects are visually appealing
- [ ] Audio enhances gameplay experience
- [ ] No performance degradation
- [ ] Mobile device compatibility

---

## 9. Documentation

### Files to Create
- [ ] `LIGHTING_SYSTEM_GUIDE.md` - How to use lighting features
- [ ] `WEATHER_EFFECTS_GUIDE.md` - How to create weather
- [ ] `AMBIENCE_SETUP_GUIDE.md` - Audio system documentation
- [ ] `VTT_ATMOSPHERE_API.md` - Developer API reference

### In-App Help
- [ ] Lighting panel tooltips
- [ ] Weather panel tooltips
- [ ] Ambience panel tooltips
- [ ] Quick start tutorial
- [ ] Video walkthrough (optional)

---

## 10. Future Enhancements

### Advanced Lighting
- [ ] **Volumetric lighting** - God rays, light shafts
- [ ] **Reflection mapping** - Light bouncing off surfaces
- [ ] **Real-time shadows** - Proper shadow casting with obstacles
- [ ] **Light presets** - Saved lighting configurations
- [ ] **Spell light effects** - Specialized lighting for spells (Fireball, Faerie Fire)

### Advanced Weather
- [ ] **Weather transitions** - Smooth changes between weather types
- [ ] **Weather zones** - Different weather in different areas
- [ ] **Seasonal effects** - Autumn leaves, spring flowers
- [ ] **Weather spells** - Control Weather, Fog Cloud integration
- [ ] **Terrain interaction** - Mud puddles, snow drifts, ice patches

### Advanced Ambience
- [ ] **Procedural audio** - Generative ambient soundscapes
- [ ] **Voice chat integration** - Spatial voice audio
- [ ] **Sound effect automation** - Automatic SFX on dice rolls, attacks
- [ ] **Mood presets** - One-click atmosphere changes
- [ ] **Custom sound mixing** - Layered audio tracks

### Integration Features
- [ ] **Cinematics** - Scripted lighting + weather + audio sequences
- [ ] **Time progression** - Automatic day/night cycle based on in-game time
- [ ] **Environmental hazards** - Damage zones with visual effects
- [ ] **Spell effects overlay** - Visual representation of area spells
- [ ] **Token auras** - Glow effects on tokens (healing, buffs, conditions)

---

## 11. Success Metrics

### User Engagement
- [ ] % of sessions using lighting features
- [ ] % of sessions using weather effects
- [ ] % of sessions using ambience
- [ ] Average number of light sources per map
- [ ] Average audio tracks per session

### Performance
- [ ] Frame rate maintained (60 FPS target)
- [ ] Load time impact (< 500ms increase)
- [ ] Memory usage (< 100MB increase)
- [ ] Audio latency (< 100ms)

### User Satisfaction
- [ ] Feature usage surveys
- [ ] User feedback collection
- [ ] Bug reports tracking
- [ ] Feature request analysis

---

## Summary

This comprehensive plan outlines the implementation of three major atmospheric systems:

1. **Dynamic Lighting** 💡 - Token lights, day/night cycles, shadows
2. **Weather Effects** 🌧️ - Rain, snow, fog, wind with gameplay impacts
3. **Ambience System** 🎵 - Music, ambient sounds, spatial audio

**Estimated Timeline**: 7 weeks for complete implementation
**Estimated Effort**: ~280 hours total
**Priority**: Phase 1 (Basic Lighting) should be implemented first for maximum impact

These features will dramatically enhance immersion, provide powerful DM tools, and create memorable gaming experiences. The modular design allows for phased implementation and ensures maintainable, performant code.

**Next Steps**:
1. Review and approve this plan
2. Set up development environment
3. Begin Phase 1: Basic Dynamic Lighting
4. Iterate based on user feedback

Ready to bring atmosphere and immersion to the VTT! 🎮✨
