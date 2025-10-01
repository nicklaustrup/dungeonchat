# Virtual Tabletop (VTT) System Strategy

## Executive Summary

This document outlines a comprehensive strategy for implementing a real-time, collaborative Virtual Tabletop system for the DungeonChat application. The system will enable Dungeon Masters (DMs) to create, customize, and manage battle maps with grids, tokens, and encounters, while allowing players to interact with these maps in real-time during campaign sessions.

**📋 Related Documents:**
- **[MVP Scope & Implementation Plan](./VTT_MVP_SCOPE.md)** - Prioritized feature set, phased timeline (6 weeks)
- **[Tech Stack Comparison](./VTT_TECH_STACK_COMPARISON.md)** - Library options, recommendations, tradeoffs

## Table of Contents

1. [MVP Overview](#mvp-overview)
2. [System Architecture Overview](#system-architecture-overview)
3. [Data Model & Firebase Structure](#data-model--firebase-structure)
4. [Core Feature Modules](#core-feature-modules)
5. [Real-Time Synchronization Strategy](#real-time-synchronization-strategy)
6. [Technical Implementation](#technical-implementation)
7. [Security & Access Control](#security--access-control)
8. [Performance Optimization](#performance-optimization)
9. [User Interface Design](#user-interface-design)
10. [Integration with Existing Systems](#integration-with-existing-systems)
11. [Implementation Phases](#implementation-phases)

---

## MVP Overview

**Goal:** Create a functional DM map editor with basic real-time viewing for players

### MVP Core Features (6 weeks)
1. ✅ **Map Management** - Upload map, adjustable grid, save to library
2. ✅ **Token System** - Player & enemy tokens, drag to move
3. ✅ **Real-Time View** - Players see map and token updates live
4. ✅ **Basic Pinging** - Click to ping locations for all users

### Stretch Goals
- Live cursor tracking (Realtime Database)
- Player token movement permissions
- Snap-to-grid functionality

### Post-MVP (Future)
- Fog of War
- Drawing tools
- Measurement tools
- Token conditions & HP bars
- Encounter deployment
- Initiative tracker integration

**See [VTT_MVP_SCOPE.md](./VTT_MVP_SCOPE.md) for detailed breakdown.**

---

## System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend Layer                      │
├─────────────────────────────────────────────────────────────┤
│  Map Canvas    │  Token Manager  │  Tool Palette │  Layers  │
│  (Konva.js)    │  (Drag & Drop)  │  (Draw/Edit)  │  (UI)    │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│              Real-Time Sync Layer (Firebase)                 │
├─────────────────────────────────────────────────────────────┤
│  Firestore     │  Storage        │  Functions    │  RTDB    │
│  (State/Data)  │  (Images/Maps)  │  (Processing) │  (Cursor)│
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
├─────────────────────────────────────────────────────────────┤
│  mapService    │  tokenService   │  layerService │  fogService│
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- **React 19**: Component architecture
- **Konva.js** or **Fabric.js**: Canvas rendering and manipulation
- **react-konva**: React bindings for Konva
- **react-dnd**: Drag and drop functionality
- **Context API**: State management (already in use)

**Backend:**
- **Firestore**: Map metadata, tokens, campaigns
- **Firebase Storage**: Map images, token artwork
- **Cloud Functions**: Image processing, permission checks
- **Realtime Database**: Live cursor positions, temporary data

**Additional Libraries:**
- **sharp** (Cloud Functions): Image optimization
- **axios**: HTTP requests
- **uuid**: Unique ID generation

---

## Data Model & Firebase Structure

### Firestore Collections Structure

```
campaigns/{campaignId}/
├── maps/
│   ├── {mapId}
│   │   ├── mapId: string
│   │   ├── name: string
│   │   ├── description: string
│   │   ├── imageUrl: string (Storage reference)
│   │   ├── thumbnailUrl: string
│   │   ├── width: number (pixels)
│   │   ├── height: number (pixels)
│   │   ├── gridSize: number (default: 50px)
│   │   ├── gridType: 'square' | 'hex' | 'none'
│   │   ├── gridColor: string (hex)
│   │   ├── gridOpacity: number (0-1)
│   │   ├── backgroundColor: string
│   │   ├── isActive: boolean
│   │   ├── visibility: 'dm' | 'all'
│   │   ├── createdBy: string (userId)
│   │   ├── createdAt: timestamp
│   │   ├── updatedAt: timestamp
│   │   ├── tags: string[]
│   │   └── metadata: {
│   │       scaleInFeet: number (e.g., 5ft per square)
│   │       terrainType: string
│   │       dangerLevel: number
│   │   }
│   │
│   └── layers/
│       ├── {layerId}
│       │   ├── layerId: string
│       │   ├── name: string
│       │   ├── type: 'background' | 'grid' | 'terrain' | 'tokens' | 'effects' | 'fog' | 'dm-notes'
│       │   ├── zIndex: number
│       │   ├── visible: boolean
│       │   ├── locked: boolean
│       │   ├── opacity: number
│       │   └── objects: object[] (shapes, lines, areas)
│       │
│       └── tokens/
│           └── {tokenId}
│               ├── tokenId: string
│               ├── name: string
│               ├── type: 'player' | 'npc' | 'enemy' | 'object' | 'marker'
│               ├── imageUrl: string
│               ├── position: { x: number, y: number, z: number }
│               ├── size: { width: number, height: number }
│               ├── rotation: number (degrees)
│               ├── gridSize: number (how many squares, e.g., 1x1, 2x2)
│               ├── ownerId: string (userId)
│               ├── characterId: string (link to character sheet)
│               ├── isHidden: boolean (DM can hide from players)
│               ├── conditions: string[] (stunned, prone, etc.)
│               ├── stats: {
│               │   currentHP: number
│               │   maxHP: number
│               │   ac: number
│               │   speed: number
│               │   initiative: number
│               │}
│               ├── aura: {
│               │   enabled: boolean
│               │   radius: number
│               │   color: string
│               │   type: 'friendly' | 'hostile' | 'neutral'
│               │}
│               ├── vision: {
│               │   enabled: boolean
│               │   range: number
│               │   type: 'normal' | 'darkvision' | 'blindsight'
│               │}
│               ├── movementPath: {x: number, y: number}[]
│               ├── lastMovedBy: string (userId)
│               ├── lastMovedAt: timestamp
│               ├── createdAt: timestamp
│               └── updatedAt: timestamp
│
├── fogOfWar/
│   ├── {mapId}
│   │   ├── mapId: string
│   │   ├── mode: 'none' | 'manual' | 'automatic'
│   │   ├── revealedAreas: {
│   │   │   type: 'polygon' | 'circle' | 'rectangle'
│   │   │   points: number[] or {x, y, radius}
│   │   │   permanent: boolean
│   │   │}[]
│   │   ├── playerVisibility: {
│   │   │   [userId]: {
│   │   │       visibleTokenIds: string[]
│   │   │       visibleAreas: object[]
│   │   │   }
│   │   │}
│   │   └── updatedAt: timestamp
│
├── drawings/
│   ├── {drawingId}
│   │   ├── drawingId: string
│   │   ├── mapId: string
│   │   ├── type: 'line' | 'circle' | 'rectangle' | 'polygon' | 'text' | 'freehand'
│   │   ├── points: number[] or object
│   │   ├── color: string
│   │   ├── strokeWidth: number
│   │   ├── fillColor: string
│   │   ├── opacity: number
│   │   ├── text: string (for text type)
│   │   ├── layerId: string
│   │   ├── isTemporary: boolean (cleared on map close)
│   │   ├── createdBy: string (userId)
│   │   ├── createdAt: timestamp
│   │   └── deletedAt: timestamp?
│
├── measurements/
│   ├── {measurementId}
│   │   ├── mapId: string
│   │   ├── userId: string
│   │   ├── startPoint: {x: number, y: number}
│   │   ├── endPoint: {x: number, y: number}
│   │   ├── distance: number (in feet)
│   │   ├── gridUnits: number
│   │   ├── isVisible: boolean
│   │   ├── createdAt: timestamp
│   │   └── expiresAt: timestamp (auto-delete after 5 min)
│
└── mapTemplates/
    ├── {templateId}
    │   ├── name: string
    │   ├── category: 'dungeon' | 'wilderness' | 'urban' | 'other'
    │   ├── isPublic: boolean
    │   ├── previewUrl: string
    │   └── templateData: object (reusable map configuration)
```

### Firebase Storage Structure

```
campaigns/{campaignId}/
├── maps/
│   ├── {mapId}/
│   │   ├── original.jpg/png
│   │   ├── optimized.jpg
│   │   ├── thumbnail.jpg
│   │   └── tiles/
│   │       ├── 0_0.jpg (tile-based loading for large maps)
│   │       ├── 0_1.jpg
│   │       └── ...
│   │
│   └── tokens/
│       ├── {tokenId}.png
│       ├── {tokenId}_thumbnail.png
│       └── custom/
│           └── {userId}/{tokenId}.png
```

### Realtime Database Structure

```json
{
  "campaigns": {
    "{campaignId}": {
      "mapSessions": {
        "{mapId}": {
          "cursors": {
            "{userId}": {
              "x": 450,
              "y": 320,
              "username": "PlayerName",
              "color": "#FF5733",
              "timestamp": 1234567890
            }
          },
          "activeTool": {
            "{userId}": {
              "tool": "select",
              "isDrawing": false
            }
          },
          "ping": {
            "x": 500,
            "y": 400,
            "userId": "abc123",
            "timestamp": 1234567890
          }
        }
      }
    }
  }
}
```

---

## Core Feature Modules

### 1. Map Management Module

**Features:**
- **Map Upload**: Drag-and-drop map images (JPEG, PNG, WebP)
- **Map Creation**: Blank canvas with background color/texture
- **Grid Overlay**: Configure grid type (square/hex), size, color, opacity
- **Map Library**: Browse, search, filter maps by campaign
- **Map Duplication**: Copy maps with all layers and tokens
- **Map Import/Export**: JSON export for sharing

**Components:**
```
src/components/VTT/
├── MapManager/
│   ├── MapManager.jsx
│   ├── MapUploader.jsx
│   ├── MapLibrary.jsx
│   ├── MapCard.jsx
│   ├── GridConfigurator.jsx
│   └── MapImportExport.jsx
```

**Services:**
```javascript
// src/services/vtt/mapService.js
export const mapService = {
  createMap,
  updateMap,
  deleteMap,
  getMap,
  getMaps,
  uploadMapImage,
  generateGridOverlay,
  duplicateMap,
  exportMapData,
  importMapData
};
```

### 2. Token Management Module

**Features:**
- **Token Creation**: Upload custom images or use library
- **Token Library**: Pre-built tokens (fantasy creatures, characters)
- **Token Placement**: Drag-and-drop onto map
- **Token Linking**: Connect to character sheets for auto-stats
- **Bulk Operations**: Multi-select, move, delete tokens
- **Token States**: HP bars, condition icons, status effects
- **Auras & Vision**: Visual indicators for spell effects, vision ranges

**Components:**
```
src/components/VTT/
├── TokenManager/
│   ├── TokenManager.jsx
│   ├── TokenPalette.jsx
│   ├── TokenEditor.jsx
│   ├── TokenProperties.jsx
│   ├── TokenLibrary.jsx
│   ├── ConditionTracker.jsx
│   └── VisionManager.jsx
```

**Services:**
```javascript
// src/services/vtt/tokenService.js
export const tokenService = {
  createToken,
  updateToken,
  deleteToken,
  moveToken,
  bulkMoveTokens,
  updateTokenStats,
  applyCondition,
  removeCondition,
  linkToCharacter,
  uploadTokenImage
};
```

### 3. Canvas & Rendering Module

**Features:**
- **Layered Canvas**: Background, grid, terrain, tokens, effects, fog, UI
- **Pan & Zoom**: Smooth navigation, zoom levels (25% - 400%)
- **Selection Tools**: Click, marquee select, lasso
- **Snap to Grid**: Optional snapping for precise placement
- **Keyboard Shortcuts**: Arrow keys, delete, copy, paste
- **Undo/Redo**: Action history (last 20 actions)

**Components:**
```
src/components/VTT/
├── Canvas/
│   ├── MapCanvas.jsx (main Konva Stage)
│   ├── GridLayer.jsx
│   ├── TokenLayer.jsx
│   ├── DrawingLayer.jsx
│   ├── FogLayer.jsx
│   ├── UILayer.jsx (cursors, measurements)
│   └── CanvasControls.jsx (zoom, pan controls)
```

**Hooks:**
```javascript
// src/hooks/vtt/
useCanvas.js          // Canvas state management
useZoomPan.js         // Zoom and pan controls
useGridSnapping.js    // Grid snapping logic
useSelection.js       // Multi-selection logic
useUndoRedo.js        // Action history
```

### 4. Drawing & Annotation Module

**Features:**
- **Drawing Tools**: Freehand, line, circle, rectangle, polygon
- **Text Annotations**: Add labels, notes
- **Colors & Styles**: Stroke width, color, fill, opacity
- **Temporary Drawings**: Auto-clear on session end
- **DM-Only Drawings**: Private notes visible only to DM
- **Measurement Tool**: Distance measurement in feet/meters

**Components:**
```
src/components/VTT/
├── DrawingTools/
│   ├── ToolPalette.jsx
│   ├── FreehandTool.jsx
│   ├── ShapeTool.jsx
│   ├── TextTool.jsx
│   ├── MeasurementTool.jsx
│   └── ColorPicker.jsx
```

**Services:**
```javascript
// src/services/vtt/drawingService.js
export const drawingService = {
  createDrawing,
  updateDrawing,
  deleteDrawing,
  clearTemporaryDrawings,
  createMeasurement
};
```

### 5. Fog of War Module

**Features:**
- **Manual Fog**: DM reveals areas by drawing
- **Automatic Fog**: Reveals based on token vision ranges
- **Quick Reveal**: Reveal/hide entire rooms
- **Player-Specific Fog**: Different visibility per player
- **Dynamic Lighting**: Walls block vision, doors toggle visibility

**Components:**
```
src/components/VTT/
├── FogOfWar/
│   ├── FogManager.jsx
│   ├── FogTool.jsx
│   ├── VisionCalculator.jsx
│   ├── WallEditor.jsx
│   └── LightingControls.jsx
```

**Services:**
```javascript
// src/services/vtt/fogService.js
export const fogService = {
  revealArea,
  hideArea,
  clearFog,
  calculateVision,
  updatePlayerVision,
  createWall,
  deleteWall
};
```

### 6. Encounter Integration Module

**Features:**
- **Quick Spawn**: Add encounter enemies to map
- **Auto-Position**: Smart placement on map
- **Initiative Integration**: Sync with existing initiative tracker
- **Loot Drop**: Place treasure tokens on map
- **Environmental Effects**: Add hazards, traps

**Components:**
```
src/components/VTT/
├── EncounterIntegration/
│   ├── EncounterSpawner.jsx
│   ├── QuickAddMenu.jsx
│   └── LootPlacer.jsx
```

### 7. Real-Time Collaboration Module

**Features:**
- **Live Cursors**: See other users' cursor positions
- **Ping System**: Click to ping location for all users
- **Turn Indicators**: Highlight active player's token
- **Lock Controls**: DM can lock/unlock player controls
- **Collision Detection**: Prevent token overlap (optional)

**Components:**
```
src/components/VTT/
├── Collaboration/
│   ├── LiveCursors.jsx
│   ├── PingSystem.jsx
│   ├── TurnIndicator.jsx
│   └── ControlManager.jsx
```

**Hooks:**
```javascript
// src/hooks/vtt/
useRealTimeSync.js    // Firestore real-time listeners
useCursors.js         // RTDB cursor tracking
usePing.js            // Ping system
```

---

## Real-Time Synchronization Strategy

### Sync Architecture

**Firestore for Persistent State:**
- Map metadata, tokens, drawings, fog state
- Optimistic updates with rollback on error
- Batch writes for performance

**Realtime Database for Ephemeral Data:**
- Cursor positions (updates every 100ms)
- Active tool selection
- Pings (auto-expire after 3 seconds)

### Optimistic Update Pattern

```javascript
// Example: Move token optimistically
async function moveToken(mapId, tokenId, newPosition) {
  const optimisticState = { ...currentToken, position: newPosition };
  
  // 1. Update local state immediately
  setTokens(prev => prev.map(t => 
    t.id === tokenId ? optimisticState : t
  ));
  
  try {
    // 2. Update Firestore
    await updateDoc(tokenRef, { position: newPosition, updatedAt: serverTimestamp() });
  } catch (error) {
    // 3. Rollback on error
    setTokens(prev => prev.map(t => 
      t.id === tokenId ? currentToken : t
    ));
    showError('Failed to move token');
  }
}
```

### Debouncing & Throttling

```javascript
// Throttle cursor updates (max 10/sec)
const updateCursor = throttle((position) => {
  realtimeDb.ref(`campaigns/${campaignId}/cursors/${userId}`).set({
    ...position,
    timestamp: Date.now()
  });
}, 100);

// Debounce drawing updates (batch after 500ms)
const saveDrawing = debounce((drawing) => {
  drawingService.createDrawing(campaignId, mapId, drawing);
}, 500);
```

### Conflict Resolution

**Strategy: Last-Write-Wins with Timestamps**
- All updates include `updatedAt` timestamp
- Client compares local vs server timestamp
- Server timestamp always wins
- Show conflict notification if user's change is overwritten

---

## Technical Implementation

### Canvas Rendering with Konva.js

**Why Konva.js?**
- High-performance canvas rendering
- Built-in event handling (drag, click, hover)
- Layer management
- Easy shape manipulation
- React bindings available

**Basic Setup:**

```javascript
// MapCanvas.jsx
import { Stage, Layer, Image, Rect, Circle } from 'react-konva';
import useImage from 'use-image';

function MapCanvas({ map, tokens, onTokenMove }) {
  const [mapImage] = useImage(map.imageUrl);
  const stageRef = useRef(null);
  
  return (
    <Stage
      width={window.innerWidth}
      height={window.innerHeight}
      ref={stageRef}
      draggable
      onWheel={handleZoom}
    >
      {/* Background Layer */}
      <Layer>
        <Image image={mapImage} />
      </Layer>
      
      {/* Grid Layer */}
      <Layer>
        <GridOverlay gridSize={map.gridSize} />
      </Layer>
      
      {/* Token Layer */}
      <Layer>
        {tokens.map(token => (
          <TokenSprite
            key={token.tokenId}
            token={token}
            onDragEnd={onTokenMove}
          />
        ))}
      </Layer>
      
      {/* UI Layer (cursors, measurements) */}
      <Layer listening={false}>
        <LiveCursors />
      </Layer>
    </Stage>
  );
}
```

### Image Upload & Processing

**Frontend: Upload to Storage**

```javascript
// src/services/vtt/mapService.js
export async function uploadMapImage(file, campaignId, userId) {
  const mapId = generateId();
  const storageRef = ref(storage, `campaigns/${campaignId}/maps/${mapId}/original.${ext}`);
  
  // Upload original
  const uploadTask = uploadBytesResumable(storageRef, file);
  
  return new Promise((resolve, reject) => {
    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('Upload progress:', progress);
      },
      reject,
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        
        // Trigger Cloud Function for processing
        const processFunction = httpsCallable(functions, 'processMapImage');
        const result = await processFunction({ 
          campaignId, 
          mapId, 
          originalUrl: downloadURL 
        });
        
        resolve(result.data);
      }
    );
  });
}
```

**Backend: Cloud Function for Processing**

```javascript
// functions/processMapImage.js
const sharp = require('sharp');
const { Storage } = require('@google-cloud/storage');
const storage = new Storage();

exports.processMapImage = functions.https.onCall(async (data, context) => {
  const { campaignId, mapId, originalUrl } = data;
  
  // Download original
  const bucket = storage.bucket('your-bucket-name');
  const originalFile = bucket.file(`campaigns/${campaignId}/maps/${mapId}/original.jpg`);
  const [buffer] = await originalFile.download();
  
  // Create optimized version (max 4096x4096, 80% quality)
  const optimized = await sharp(buffer)
    .resize(4096, 4096, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();
  
  // Create thumbnail (400x400)
  const thumbnail = await sharp(buffer)
    .resize(400, 400, { fit: 'cover' })
    .jpeg({ quality: 70 })
    .toBuffer();
  
  // Upload processed images
  await bucket.file(`campaigns/${campaignId}/maps/${mapId}/optimized.jpg`).save(optimized);
  await bucket.file(`campaigns/${campaignId}/maps/${mapId}/thumbnail.jpg`).save(thumbnail);
  
  // Get public URLs
  const optimizedUrl = await bucket.file(`campaigns/${campaignId}/maps/${mapId}/optimized.jpg`).getSignedUrl(...);
  const thumbnailUrl = await bucket.file(`campaigns/${campaignId}/maps/${mapId}/thumbnail.jpg`).getSignedUrl(...);
  
  // Get image dimensions
  const metadata = await sharp(buffer).metadata();
  
  return {
    mapId,
    imageUrl: optimizedUrl,
    thumbnailUrl,
    width: metadata.width,
    height: metadata.height
  };
});
```

### Permission System

**DM Controls:**
- Full control: create/edit/delete maps, tokens, drawings
- Manage fog of war
- Control player permissions
- Lock/unlock player controls

**Player Controls:**
- View active map
- Move own tokens (if unlocked by DM)
- Draw temporary annotations (if enabled)
- Use measurement tools
- Ping locations

**Implementation:**

```javascript
// src/hooks/vtt/useMapPermissions.js
export function useMapPermissions(campaignId, mapId) {
  const { user } = useFirebase();
  const { currentCampaign } = useCampaign();
  
  const isDM = currentCampaign?.dmId === user?.uid;
  const [permissions, setPermissions] = useState({
    canEdit: false,
    canMove: false,
    canDraw: false,
    canRevealFog: false
  });
  
  useEffect(() => {
    if (isDM) {
      setPermissions({
        canEdit: true,
        canMove: true,
        canDraw: true,
        canRevealFog: true
      });
    } else {
      // Fetch player permissions from map settings
      const mapRef = doc(firestore, 'campaigns', campaignId, 'maps', mapId);
      getDoc(mapRef).then(snap => {
        const settings = snap.data()?.playerPermissions || {};
        setPermissions({
          canEdit: false,
          canMove: settings.allowTokenMovement ?? true,
          canDraw: settings.allowDrawing ?? false,
          canRevealFog: false
        });
      });
    }
  }, [isDM, campaignId, mapId]);
  
  return permissions;
}
```

---

## Security & Access Control

### Firestore Security Rules

```javascript
// firestore-security-rules.rules (additions)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isCampaignDM(campaignId) {
      return get(/databases/$(database)/documents/campaigns/$(campaignId)).data.dmId == request.auth.uid;
    }
    
    function isCampaignMember(campaignId) {
      return exists(/databases/$(database)/documents/campaigns/$(campaignId)/members/$(request.auth.uid));
    }
    
    // Maps
    match /campaigns/{campaignId}/maps/{mapId} {
      allow read: if request.auth != null && isCampaignMember(campaignId);
      allow create, update, delete: if request.auth != null && isCampaignDM(campaignId);
      
      // Layers
      match /layers/{layerId} {
        allow read: if request.auth != null && isCampaignMember(campaignId);
        allow write: if request.auth != null && isCampaignDM(campaignId);
        
        // Tokens
        match /tokens/{tokenId} {
          allow read: if request.auth != null && isCampaignMember(campaignId);
          // DM can write any token
          allow write: if request.auth != null && isCampaignDM(campaignId);
          // Players can move their own tokens (if ownerId matches)
          allow update: if request.auth != null && 
            isCampaignMember(campaignId) &&
            resource.data.ownerId == request.auth.uid &&
            request.resource.data.diff(resource.data).affectedKeys().hasOnly(['position', 'updatedAt', 'lastMovedBy', 'lastMovedAt']);
        }
      }
    }
    
    // Fog of War
    match /campaigns/{campaignId}/fogOfWar/{mapId} {
      allow read: if request.auth != null && isCampaignMember(campaignId);
      allow write: if request.auth != null && isCampaignDM(campaignId);
    }
    
    // Drawings
    match /campaigns/{campaignId}/drawings/{drawingId} {
      allow read: if request.auth != null && isCampaignMember(campaignId);
      // DM can create/delete any drawing
      allow create, delete: if request.auth != null && isCampaignDM(campaignId);
      // Players can create temporary drawings (if enabled)
      allow create: if request.auth != null && 
        isCampaignMember(campaignId) &&
        request.resource.data.isTemporary == true &&
        request.resource.data.createdBy == request.auth.uid;
    }
    
    // Measurements (ephemeral, auto-expire)
    match /campaigns/{campaignId}/measurements/{measurementId} {
      allow read: if request.auth != null && isCampaignMember(campaignId);
      allow create: if request.auth != null && 
        isCampaignMember(campaignId) &&
        request.resource.data.userId == request.auth.uid;
      allow delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

### Storage Security Rules

```javascript
// storage-security-rules.rules (additions)
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Campaign maps
    match /campaigns/{campaignId}/maps/{mapId}/{fileName} {
      // Anyone in campaign can view
      allow read: if request.auth != null;
      // Only DM can upload/delete
      allow write: if request.auth != null && 
        firestore.get(/databases/(default)/documents/campaigns/$(campaignId)).data.dmId == request.auth.uid &&
        request.resource.size < 20 * 1024 * 1024 && // 20MB limit
        request.resource.contentType.matches('image/.*');
    }
    
    // Campaign tokens
    match /campaigns/{campaignId}/maps/tokens/{tokenId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (firestore.get(/databases/(default)/documents/campaigns/$(campaignId)).data.dmId == request.auth.uid ||
         firestore.get(/databases/(default)/documents/campaigns/$(campaignId)/members/$(request.auth.uid)).data != null) &&
        request.resource.size < 5 * 1024 * 1024 && // 5MB limit
        request.resource.contentType.matches('image/.*');
    }
  }
}
```

---

## Performance Optimization

### 1. Image Optimization

**Strategies:**
- Automatic image compression (Cloud Functions + sharp)
- Progressive JPEG loading
- Tile-based loading for large maps (>4000x4000px)
- WebP format support (fallback to JPEG)
- Lazy loading for token images

### 2. Canvas Performance

**Strategies:**
- Layer caching (cache static layers)
- Viewport culling (only render visible tokens)
- Throttle/debounce updates
- Use `transformsEnabled: false` for performance
- Limit simultaneous animations

```javascript
// Example: Viewport culling
function TokenLayer({ tokens, viewport }) {
  const visibleTokens = useMemo(() => {
    return tokens.filter(token => {
      const { x, y } = token.position;
      return x >= viewport.x - 200 && 
             x <= viewport.x + viewport.width + 200 &&
             y >= viewport.y - 200 && 
             y <= viewport.y + viewport.height + 200;
    });
  }, [tokens, viewport]);
  
  return (
    <Layer>
      {visibleTokens.map(token => <TokenSprite key={token.tokenId} token={token} />)}
    </Layer>
  );
}
```

### 3. Firestore Optimization

**Strategies:**
- Pagination (load 50 tokens at a time)
- Composite indexes for queries
- Denormalization (embed frequently accessed data)
- Batch writes (group updates)
- Offline persistence enabled

```javascript
// Example: Batch token updates
async function updateMultipleTokens(campaignId, mapId, updates) {
  const batch = writeBatch(firestore);
  
  updates.forEach(({ tokenId, changes }) => {
    const tokenRef = doc(firestore, 'campaigns', campaignId, 'maps', mapId, 'layers/tokens/tokens', tokenId);
    batch.update(tokenRef, { ...changes, updatedAt: serverTimestamp() });
  });
  
  await batch.commit();
}
```

### 4. Real-Time Sync Optimization

**Strategies:**
- Throttle cursor updates (10Hz = 100ms)
- Debounce drawing updates (500ms)
- Use Realtime Database for high-frequency updates
- Limit snapshot listeners (cleanup on unmount)
- Use `onSnapshot` with `includeMetadataChanges: false`

---

## User Interface Design

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Top Toolbar                                                 │
│  [Map Select] [Grid] [Fog] [Tools] [Zoom: 100%] [Exit]     │
├──────┬──────────────────────────────────────────────────────┤
│ Left │                                                       │
│ Tool │                                                       │
│ Bar  │            MAP CANVAS                                │
│      │            (Konva Stage)                             │
│ [✋] │                                                       │
│ [➕] │                                                       │
│ [✏️] │                                                       │
│ [🌫️] │                                                       │
│ [📏] │                                                       │
│      │                                                       │
├──────┴───────────────────────────────────────────────────────┤
│  Status Bar: X: 450, Y: 320 | Grid: 50px | Players: 4       │
└─────────────────────────────────────────────────────────────┘
```

### Key UI Components

**1. Map Selector Dropdown**
- List of campaign maps
- Quick switch between maps
- "Create New Map" button

**2. Tool Palette (Left Sidebar)**
- Select tool (default)
- Add Token tool
- Drawing tools (freehand, shapes, text)
- Fog of War tool
- Measurement tool
- Pan tool

**3. Context Menus**
- Right-click token: Edit, Delete, Link Character, Apply Condition
- Right-click canvas: Add Token, Draw, Measure, Reveal Fog
- Right-click drawing: Edit, Delete

**4. Token Properties Panel (Right Sidebar)**
- When token selected:
  - Name, HP, AC, Conditions
  - Position (X, Y)
  - Size, Rotation
  - Vision settings
  - Aura settings

**5. Layer Manager (Floating Panel)**
- Toggle layer visibility
- Lock/unlock layers
- Reorder layers (drag to reorder)
- Create/delete layers

**6. Fog of War Controls (DM Only)**
- Mode: None | Manual | Automatic
- Reveal All / Hide All buttons
- Quick reveal shapes (circle, rectangle, polygon)

### Mobile Responsiveness

**Challenges:**
- Small screen real estate
- Touch gestures vs mouse clicks
- Performance on mobile devices

**Solutions:**
- Simplified toolbar (collapsible)
- Touch gestures: pinch-zoom, two-finger pan
- Token selection: tap once to select, tap-hold for menu
- Read-only mode for players on mobile
- Separate mobile-optimized view

---

## Integration with Existing Systems

### 1. Campaign Integration

**Existing:** `CampaignContext`, `campaignService`

**Changes:**
- Add `maps` array to campaign document
- Add `activeMapId` field to track current map in session
- Display map selector in Campaign dashboard

```javascript
// src/contexts/CampaignContext.js additions
const [currentMap, setCurrentMap] = useState(null);
const [campaignMaps, setCampaignMaps] = useState([]);

const switchMap = useCallback(async (mapId) => {
  const map = await mapService.getMap(firestore, currentCampaign.id, mapId);
  setCurrentMap(map);
  
  // Update campaign's activeMapId
  await updateDoc(doc(firestore, 'campaigns', currentCampaign.id), {
    activeMapId: mapId
  });
}, [currentCampaign, firestore]);
```

### 2. Character Sheet Integration

**Existing:** `characterSheetService`, `CharacterSheet` component

**Changes:**
- Add "Place on Map" button to character sheet
- Auto-create token when character placed
- Sync HP changes between character sheet and token

```javascript
// Bi-directional sync
// Character Sheet → Token
useEffect(() => {
  if (character?.currentHP && token) {
    tokenService.updateToken(campaignId, mapId, token.tokenId, {
      stats: { currentHP: character.currentHP, maxHP: character.maxHP }
    });
  }
}, [character?.currentHP]);

// Token → Character Sheet
useEffect(() => {
  if (token?.stats?.currentHP !== undefined) {
    characterSheetService.updateCharacter(campaignId, characterId, {
      currentHP: token.stats.currentHP
    });
  }
}, [token?.stats?.currentHP]);
```

### 3. Initiative Tracker Integration

**Existing:** `initiativeService`, turn order tracking

**Changes:**
- Highlight active token on map during combat
- Click token to select in initiative tracker
- Show turn indicator (glow effect) on active token

```javascript
// src/components/VTT/TurnIndicator.jsx
function TurnIndicator({ token, isActive }) {
  return (
    <Circle
      x={token.position.x}
      y={token.position.y}
      radius={token.size.width / 2 + 10}
      stroke={isActive ? '#FFD700' : 'transparent'}
      strokeWidth={3}
      dash={[10, 5]}
      listening={false}
      opacity={isActive ? 1 : 0}
      // Animate if active
      {...(isActive && { 
        shadowColor: '#FFD700', 
        shadowBlur: 20, 
        shadowOpacity: 0.8 
      })}
    />
  );
}
```

### 4. Encounter System Integration

**Existing:** `encounterService`, encounter templates

**Changes:**
- "Deploy to Map" button in encounter view
- Auto-place enemies with smart positioning
- Link encounter participants to map tokens

```javascript
// src/services/vtt/encounterIntegration.js
export async function deployEncounterToMap(firestore, campaignId, mapId, encounterId) {
  const encounter = await encounterService.getEncounter(firestore, campaignId, encounterId);
  const map = await mapService.getMap(firestore, campaignId, mapId);
  
  // Find empty spaces on map grid
  const positions = findEmptyGridPositions(map, encounter.participants.length);
  
  // Create tokens for each participant
  const tokens = await Promise.all(
    encounter.participants.map((participant, index) => {
      return tokenService.createToken(firestore, campaignId, mapId, {
        name: participant.name,
        type: 'enemy',
        position: positions[index],
        stats: {
          currentHP: participant.hp,
          maxHP: participant.hp,
          ac: participant.ac,
          initiative: 0
        },
        encounterReference: encounterId
      });
    })
  );
  
  return tokens;
}
```

### 5. Dice Roller Integration

**Existing:** `diceService`, `DiceRoller` component

**Changes:**
- Roll from map (right-click token → Roll for Attack/Save)
- Show dice roll result above token (temporary overlay)
- Auto-calculate range for spells/attacks

### 6. Chat Integration

**Existing:** `messageService`, `ChatRoom` component

**Changes:**
- Post map events to chat (token moved, fog revealed)
- Click map reference in chat to focus on map location
- Dice rolls from map appear in chat

```javascript
// Example: Post map event to chat
async function postMapEventToChat(campaignId, channelId, event) {
  await messageService.createMessage(firestore, channelId, {
    text: event.text,
    type: 'system',
    metadata: {
      eventType: 'map',
      mapId: event.mapId,
      coordinates: event.coordinates
    }
  });
}
```

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-3)

**Goals:** Basic map viewing and token placement

**Tasks:**
1. Install dependencies (react-konva, konva)
2. Create basic Firestore schema (maps, tokens)
3. Create `MapCanvas` component with Konva Stage
4. Implement map upload and storage integration
5. Create `TokenSprite` component
6. Implement drag-and-drop token placement
7. Add grid overlay rendering
8. Set up real-time Firestore listeners for tokens
9. Create basic toolbar and tool palette
10. Implement pan and zoom controls

**Deliverables:**
- DM can upload map image
- DM can place tokens on map
- All users can view map and tokens in real-time
- Basic pan and zoom functionality

### Phase 2: Core Features (Weeks 4-6)

**Goals:** Essential VTT functionality

**Tasks:**
1. Implement layer system (background, grid, tokens, UI)
2. Add token editing (properties panel)
3. Implement selection tools (click, marquee select)
4. Add drawing tools (freehand, shapes, text)
5. Create token library with pre-built tokens
6. Implement snap-to-grid functionality
7. Add measurement tool
8. Create context menus (right-click)
9. Implement undo/redo system
10. Add keyboard shortcuts

**Deliverables:**
- DM can edit token properties
- DM can draw annotations on map
- DM can measure distances
- Players can select and view tokens
- Basic keyboard shortcuts work

### Phase 3: Advanced Features (Weeks 7-9)

**Goals:** Fog of War and advanced token features

**Tasks:**
1. Implement manual Fog of War
2. Create vision range calculations
3. Add token conditions and status effects
4. Implement auras (visual effects)
5. Add HP bars above tokens
6. Create automatic Fog of War (vision-based)
7. Implement wall/door system for dynamic lighting
8. Add token linking to character sheets
9. Create encounter deployment system
10. Implement initiative tracker integration

**Deliverables:**
- DM can control Fog of War
- Tokens show HP, conditions, auras
- Automatic vision calculations
- Encounter → Map deployment
- Initiative tracker highlights active token

### Phase 4: Collaboration & Polish (Weeks 10-12)

**Goals:** Real-time collaboration and UX polish

**Tasks:**
1. Implement live cursors (Realtime Database)
2. Add ping system
3. Create player permission system
4. Implement turn indicators
5. Add bulk operations (multi-select, move)
6. Create map templates system
7. Implement map import/export
8. Add mobile-responsive view
9. Create map library with search/filter
10. Performance optimization (viewport culling, caching)

**Deliverables:**
- Live cursor tracking
- Ping system for communication
- Granular player permissions
- Map templates for quick setup
- Mobile-friendly view
- Optimized performance

### Phase 5: Integration & Testing (Weeks 13-14)

**Goals:** Integrate with existing systems, comprehensive testing

**Tasks:**
1. Integration testing with character sheets
2. Integration testing with encounters
3. Integration testing with initiative tracker
4. Integration testing with chat
5. End-to-end testing (full campaign session)
6. Performance testing (large maps, many tokens)
7. Mobile testing
8. Security audit (Firestore rules, Storage rules)
9. User acceptance testing
10. Bug fixes and refinements

**Deliverables:**
- All systems integrated and working together
- Comprehensive test suite
- Performance benchmarks met
- Security audit passed
- Production-ready VTT system

---

## Risk Mitigation

### Technical Risks

**Risk 1: Performance Issues with Large Maps**
- **Mitigation:** Implement tile-based loading, viewport culling, layer caching
- **Fallback:** Downscale large maps, limit token count

**Risk 2: Real-Time Sync Conflicts**
- **Mitigation:** Implement conflict resolution (last-write-wins), optimistic updates
- **Fallback:** Lock controls temporarily during sync

**Risk 3: Mobile Performance**
- **Mitigation:** Simplified mobile view, reduced rendering complexity
- **Fallback:** Read-only mode on mobile, desktop-only editing

### Security Risks

**Risk 1: Unauthorized Map/Token Access**
- **Mitigation:** Strict Firestore rules, campaign membership checks
- **Testing:** Security audit before launch

**Risk 2: Storage Abuse (Large Uploads)**
- **Mitigation:** File size limits (20MB maps, 5MB tokens), file type validation
- **Monitoring:** Cloud Functions to track storage usage

### User Experience Risks

**Risk 1: Steep Learning Curve**
- **Mitigation:** Interactive tutorial, tooltips, "Quick Start" guide
- **Support:** Video tutorials, documentation

**Risk 2: DM Overwhelm (Too Many Features)**
- **Mitigation:** Progressive disclosure, sane defaults, templates
- **Support:** Pre-built maps, token libraries

---

## Success Metrics

### Performance KPIs
- **Map Load Time:** < 3 seconds for average map (2000x2000px)
- **Token Movement Latency:** < 200ms from drag to all clients updated
- **Frame Rate:** Maintain 30+ FPS with 50+ tokens on screen
- **Storage Efficiency:** Average map < 5MB after optimization

### User Engagement KPIs
- **Adoption Rate:** 70%+ of campaigns create at least one map
- **Active Usage:** Average 2+ maps created per campaign
- **Session Duration:** Increase average session time by 25%
- **User Satisfaction:** 4.5+ star rating for VTT feature

---

## Future Enhancements (Post-Launch)

### Short-Term (1-3 months)
- **Animated Tokens:** GIF/WEBM support for token images
- **Sound Effects:** Ambient audio per map, token sound triggers
- **Weather Effects:** Rain, fog, snow overlays
- **Dice Roller Integration:** Click-to-roll from token stats

### Mid-Term (3-6 months)
- **3D Terrain:** Optional 3D view for elevation
- **AI Map Generation:** Generate maps from text descriptions
- **Token Marketplace:** Community-uploaded tokens
- **Map Sharing:** Public map library, import from URL

### Long-Term (6-12 months)
- **VR Support:** VR view for immersive gameplay
- **Procedural Generation:** Auto-generate dungeons
- **Asset Marketplace:** Buy/sell premium maps and tokens
- **API Access:** Allow third-party integrations

---

## Cost Analysis

### Development Costs
- **Engineering Time:** 12-14 weeks × 40 hours × $75/hr = ~$45,000
- **Design Time:** 2 weeks × 40 hours × $60/hr = ~$4,800
- **Total Development:** ~$50,000

### Infrastructure Costs (Monthly)
- **Firebase Hosting:** $5-10
- **Firestore:** $25-100 (depends on read/write volume)
- **Storage:** $20-80 (depends on map/token uploads)
- **Cloud Functions:** $10-50 (image processing)
- **Realtime Database:** $5-20 (cursor tracking)
- **Total Infrastructure:** ~$65-260/month

### Break-Even Analysis
- Assuming $10/month subscription per DM
- 200 active campaigns = $2,000/month
- Break-even in 25 months (with $50K dev cost)

---

## Conclusion

This Virtual Tabletop strategy provides a comprehensive roadmap for implementing a production-ready, real-time collaborative VTT system within the DungeonChat application. By leveraging Firebase's real-time capabilities, Konva.js for high-performance canvas rendering, and integrating deeply with existing campaign management systems, we can create a powerful tool that enhances gameplay and brings campaigns to life.

### Key Strengths
✅ **Real-Time Collaboration:** Live cursor tracking, instant updates  
✅ **Deep Integration:** Works seamlessly with characters, encounters, initiative  
✅ **Scalable Architecture:** Firebase handles concurrent users, Cloud Functions for processing  
✅ **DM-Friendly:** Powerful tools without overwhelming complexity  
✅ **Player Experience:** Intuitive, responsive, visually engaging  

### Next Steps
1. **Review & Refine:** Discuss this strategy with stakeholders
2. **Prioritize Features:** Determine MVP scope
3. **Prototype:** Build Phase 1 foundation (weeks 1-3)
4. **Iterate:** User testing, feedback loops
5. **Launch:** Phased rollout to campaigns

**Let's bring this Virtual Tabletop to life! 🎲🗺️**
