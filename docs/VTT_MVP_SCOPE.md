# Virtual Tabletop - MVP Scope & Implementation Plan

## MVP Feature Set

### ✅ **Core MVP Features** (Must Have)

#### 1. Map Management
- **Upload map image** (JPEG, PNG, max 20MB)
- **Adjustable grid overlay**
  - Grid size (pixels per square)
  - Grid type (square only for MVP)
  - Grid color and opacity
  - Toggle grid on/off
- **Save map to library** (campaign-specific)
- **Basic map metadata** (name, description, grid settings)
- **Map selector** (choose from saved maps)

#### 2. Token System
- **Player tokens** (represent PCs)
  - Upload custom token image
  - Place on map
  - Drag to move
  - Display name on hover
  - Link to character sheet (optional)
- **Enemy tokens** (represent NPCs/monsters)
  - Same features as player tokens
  - Distinguish visually (border color/indicator)
- **Token properties**
  - Name
  - Type (player/enemy)
  - Position (x, y)
  - Size (1x1 grid squares for MVP)
- **Basic token actions**
  - Click to select
  - Drag to move
  - Delete (DM only)

#### 3. Real-Time Collaboration
- **Live token updates** (Firestore)
  - DM moves token → all players see immediately
  - Player moves own token → all see immediately
- **Basic pinging system**
  - Click map location to create ping
  - Ping appears for all users (3-second duration)
  - Visual: Expanding circle with user color
  - Audio: Optional ping sound

#### 4. Basic Canvas Controls
- **Pan** (click and drag background)
- **Zoom** (mouse wheel, buttons, or pinch)
- **Zoom levels**: 50%, 75%, 100%, 150%, 200%
- **Reset view** button

#### 5. Permissions System
- **DM permissions**
  - Upload/edit/delete maps
  - Place/move/delete any token
  - Configure grid settings
  - Access map editor
- **Player permissions**
  - View current map (read-only for MVP)
  - See all visible tokens
  - See pings

### 🎯 **Stretch Goals** (Nice to Have)

#### 1. Live Cursor Tracking
- See other users' cursor positions in real-time
- Username label follows cursor
- Color-coded per user

#### 2. Player Token Movement
- Players can drag their own tokens
- Permission toggle (DM can enable/disable)

#### 3. Snap-to-Grid
- Tokens automatically align to grid squares
- Toggle on/off

#### 4. Token Context Menu
- Right-click token for quick actions
- Edit, Delete, View Character Sheet

#### 5. Map Thumbnails
- Generate thumbnail on upload
- Display in map library

### ❌ **Post-MVP Features** (Future)

#### Phase 2+ Features
- Fog of War (manual or automatic)
- Drawing tools (freehand, shapes, text)
- Measurement tool
- Token conditions & status effects
- HP bars and stats display
- Auras and vision ranges
- Multiple layers
- Encounter deployment
- Initiative tracker integration
- Token animations
- Advanced grid types (hex, isometric)
- Undo/redo system
- Keyboard shortcuts
- Mobile optimization

---

## MVP Data Model (Simplified)

### Firestore Structure

```
campaigns/{campaignId}/
├── maps/
│   └── {mapId}
│       ├── mapId: string
│       ├── name: string
│       ├── description: string
│       ├── imageUrl: string (Storage ref)
│       ├── width: number (pixels)
│       ├── height: number (pixels)
│       ├── gridSize: number (default: 50)
│       ├── gridColor: string (default: '#000000')
│       ├── gridOpacity: number (default: 0.3)
│       ├── gridEnabled: boolean (default: true)
│       ├── createdBy: string (userId)
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
└── mapTokens/
    └── {mapId}/
        └── tokens/
            └── {tokenId}
                ├── tokenId: string
                ├── name: string
                ├── type: 'player' | 'enemy'
                ├── imageUrl: string
                ├── position: { x: number, y: number }
                ├── ownerId: string (userId - for player tokens)
                ├── characterId: string? (link to character sheet)
                ├── createdBy: string (userId)
                ├── createdAt: timestamp
                └── updatedAt: timestamp
```

### Realtime Database Structure (Stretch Goal)

```json
{
  "campaigns": {
    "{campaignId}": {
      "maps": {
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
          "pings": {
            "latest": {
              "x": 500,
              "y": 400,
              "userId": "abc123",
              "username": "DM",
              "color": "#4CAF50",
              "timestamp": 1234567890
            }
          }
        }
      }
    }
  }
}
```

---

## MVP Implementation Phases

### 🔵 **Phase 1: Map Editor Foundation** (Week 1-2)

**Goal:** DM can upload map, configure grid, save to library

**Tasks:**
1. Install dependencies (react-konva, konva)
2. Create Firestore schema (maps collection)
3. Set up Firebase Storage for map images
4. Create `MapEditor` page/component
5. Build `MapUploader` component (drag-and-drop)
6. Create `GridConfigurator` component
   - Grid size slider (25-100px)
   - Grid color picker
   - Grid opacity slider
   - Grid toggle
7. Implement `MapCanvas` with Konva
   - Display map image
   - Render grid overlay
   - Pan controls
   - Zoom controls
8. Create `MapLibrary` component
   - List saved maps
   - Click to load in editor
9. Save/update map metadata to Firestore
10. Update Firestore rules for maps

**Deliverables:**
- ✅ DM can upload map image
- ✅ DM can configure grid (size, color, opacity)
- ✅ DM can save map to campaign library
- ✅ DM can load saved maps
- ✅ Basic pan and zoom works

**Components Created:**
```
src/components/VTT/
├── MapEditor/
│   ├── MapEditor.jsx (main page)
│   ├── MapUploader.jsx
│   ├── GridConfigurator.jsx
│   └── MapSaveDialog.jsx
├── MapLibrary/
│   ├── MapLibrary.jsx
│   └── MapCard.jsx
└── Canvas/
    ├── MapCanvas.jsx (Konva Stage)
    ├── GridLayer.jsx
    └── CanvasControls.jsx (zoom, pan buttons)
```

**Services Created:**
```
src/services/vtt/
├── mapService.js
└── __tests__/
    └── mapService.test.js
```

---

### 🟢 **Phase 2: Token System** (Week 3-4)

**Goal:** DM can add player/enemy tokens to map, save with map

**Tasks:**
1. Extend Firestore schema (mapTokens subcollection)
2. Create `TokenManager` component
3. Build `TokenUploader` for custom images
4. Create `TokenPalette` (sidebar with token options)
5. Implement `TokenSprite` component (Konva Image)
6. Add token placement (click to place mode)
7. Implement token dragging (Konva drag events)
8. Add token selection (click to select, visual indicator)
9. Create `TokenProperties` panel
   - Name input
   - Type selector (player/enemy)
   - Link to character (dropdown)
   - Delete button
10. Save tokens with map data
11. Update Firestore rules for tokens

**Deliverables:**
- ✅ DM can upload token images
- ✅ DM can place tokens on map (player and enemy types)
- ✅ DM can drag tokens to move
- ✅ DM can select and edit token properties
- ✅ DM can delete tokens
- ✅ Tokens save with map

**Components Created:**
```
src/components/VTT/
├── TokenManager/
│   ├── TokenManager.jsx
│   ├── TokenPalette.jsx
│   ├── TokenUploader.jsx
│   ├── TokenSprite.jsx (Konva component)
│   └── TokenProperties.jsx
```

**Services Created:**
```
src/services/vtt/
├── tokenService.js
└── __tests__/
    └── tokenService.test.js
```

---

### 🟡 **Phase 3: Real-Time View & Ping System** (Week 5)

**Goal:** Players can view map in real-time, basic pinging works

**Tasks:**
1. Create `MapViewer` component (player view)
2. Set up Firestore real-time listeners
   - Listen to map changes
   - Listen to token position updates
3. Implement ping system
   - Click map to create ping
   - Store in Firestore (temporary doc)
   - Auto-delete after 3 seconds
4. Create `PingIndicator` component (Konva animation)
5. Add user color assignment
6. Optional ping sound effect
7. Create navigation to MapViewer from Campaign
8. Update permissions (players can view, not edit)

**Deliverables:**
- ✅ Players can view current campaign map
- ✅ Players see token movements in real-time
- ✅ Users can ping map locations
- ✅ Pings visible to all users for 3 seconds
- ✅ DM/Player permissions enforced

**Components Created:**
```
src/components/VTT/
├── MapViewer/
│   ├── MapViewer.jsx (player view)
│   └── PingIndicator.jsx (Konva Circle with animation)
└── Navigation/
    └── MapViewerLink.jsx
```

**Services Created:**
```
src/services/vtt/
├── pingService.js
└── __tests__/
    └── pingService.test.js
```

**Hooks Created:**
```
src/hooks/vtt/
├── useMapSync.js (real-time Firestore listener)
├── useTokenSync.js (real-time token updates)
└── usePing.js (ping creation/listening)
```

---

### 🟣 **Phase 4: Integration & Polish** (Week 6)

**Goal:** Integrate with campaign system, polish UX

**Tasks:**
1. Add "Map Editor" link to Campaign dashboard (DM only)
2. Add "View Map" link to Campaign (all members)
3. Create `MapSelector` dropdown in Campaign
   - Shows all campaign maps
   - DM can set "active map"
4. Update `CampaignContext` with map state
5. Add loading states and error handling
6. Add confirmation dialogs (delete map, delete token)
7. Improve visual design (icons, colors, spacing)
8. Add tooltips for controls
9. Create Quick Start guide (modal on first use)
10. Bug fixes and edge cases

**Deliverables:**
- ✅ Map Editor accessible from Campaign dashboard
- ✅ Active map displays in Campaign view
- ✅ Smooth navigation between editor and viewer
- ✅ Polished UI with helpful tooltips
- ✅ Error handling and loading states
- ✅ Quick Start guide for DMs

**Components Updated:**
```
src/components/Campaign/
├── CampaignDashboard.jsx (add Map Editor link)
└── MapSelector.jsx (dropdown for active map)

src/contexts/
└── CampaignContext.js (add map state)
```

**Docs Created:**
```
docs/
└── VTT_QUICK_START_GUIDE.md
```

---

### 🔴 **Phase 5: Stretch Goals** (Week 7+)

**Optional features if time permits:**

1. **Live Cursor Tracking** (1-2 days)
   - Set up Realtime Database
   - Track cursor position (throttled to 100ms)
   - Display cursors for other users
   - Username labels

2. **Player Token Movement** (1 day)
   - Add permission toggle in map settings
   - Allow players to drag their own tokens
   - Validate token ownership

3. **Snap-to-Grid** (1 day)
   - Calculate nearest grid cell on drag end
   - Toggle on/off in settings

4. **Map Thumbnails** (1 day)
   - Generate thumbnail on upload (Cloud Function)
   - Display in MapLibrary

5. **Token Context Menu** (1 day)
   - Right-click token for menu
   - Quick actions (Edit, Delete, View Character)

---

## MVP User Stories

### DM User Stories

1. **As a DM**, I want to upload a map image so that I can use it in my campaign sessions.
2. **As a DM**, I want to adjust the grid size and appearance so that it matches my map's scale.
3. **As a DM**, I want to save maps to a library so that I can reuse them in future sessions.
4. **As a DM**, I want to place player tokens on the map so that players know where their characters are.
5. **As a DM**, I want to place enemy tokens on the map so that I can show encounters visually.
6. **As a DM**, I want to move tokens by dragging so that I can update positions during combat.
7. **As a DM**, I want to delete tokens so that I can remove defeated enemies or unused tokens.
8. **As a DM**, I want to set an active map so that players can view the current scene.
9. **As a DM**, I want to ping locations on the map so that I can direct players' attention.
10. **As a DM**, I want to link tokens to character sheets so that stats are connected.

### Player User Stories

1. **As a Player**, I want to view the current map so that I can see the battlefield.
2. **As a Player**, I want to see my character token so that I know my position.
3. **As a Player**, I want to see enemy tokens so that I can plan my actions.
4. **As a Player**, I want to see token movements in real-time so that I stay updated during combat.
5. **As a Player**, I want to ping locations on the map so that I can communicate with the party.
6. **As a Player**, I want to zoom and pan the map so that I can see details clearly.

---

## Success Criteria for MVP

### Functional Requirements
- ✅ DM can upload map and configure grid
- ✅ DM can save map to campaign library
- ✅ DM can place and move player/enemy tokens
- ✅ Players can view map and tokens in real-time
- ✅ All users can ping map locations
- ✅ Pan and zoom controls work smoothly
- ✅ Permissions enforced (DM edit, Player view)

### Performance Requirements
- ✅ Map loads in < 5 seconds (2000x2000px image)
- ✅ Token movement updates all clients in < 500ms
- ✅ Ping appears for all users in < 500ms
- ✅ Smooth 30+ FPS with 20 tokens on screen

### Usability Requirements
- ✅ DM can create first map in < 5 minutes (without tutorial)
- ✅ Intuitive drag-and-drop for tokens
- ✅ Clear visual distinction between player/enemy tokens
- ✅ No more than 2 clicks to access map editor or viewer

---

## Estimated Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1: Map Editor | 2 weeks | Upload map, configure grid, save to library |
| Phase 2: Token System | 2 weeks | Place/move/edit tokens |
| Phase 3: Real-Time & Ping | 1 week | Player view, pings, real-time sync |
| Phase 4: Integration & Polish | 1 week | Campaign integration, UX polish |
| **Total MVP** | **6 weeks** | Fully functional MVP |
| Phase 5: Stretch Goals | 1+ weeks | Cursor tracking, player movement, snap-to-grid |

---

## Next Steps

1. ✅ **Review & Approve** this MVP scope
2. **Tech Stack Decision** (see separate tech stack comparison doc)
3. **Set up development environment**
   - Install react-konva, konva
   - Set up Firestore schema
   - Configure Storage bucket
4. **Start Phase 1** - Map Editor Foundation
5. **Create UI mockups** (you'll handle this)
6. **Begin implementation** following phased approach

---

## Notes & Assumptions

### Assumptions
- Campaign system already exists and functional
- Firebase project already set up
- Users authenticated via Firebase Auth
- Character sheet system exists (for token linking)

### Design Decisions
- **Grid Type:** Square only for MVP (hex grids are complex, defer to post-MVP)
- **Token Size:** 1x1 grid squares only for MVP (larger tokens post-MVP)
- **Player Movement:** View-only for MVP, stretch goal to allow movement
- **Fog of War:** Not in MVP (significant complexity, defer to Phase 2)
- **Drawing Tools:** Not in MVP (defer to Phase 2)

### Technical Constraints
- Max map image size: 20MB (Storage limits)
- Max token image size: 5MB
- Max tokens per map: 100 (performance consideration)
- Ping duration: 3 seconds (hardcoded for MVP)

---

**Ready to build! 🚀**
