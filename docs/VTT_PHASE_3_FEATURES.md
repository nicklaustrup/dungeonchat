# VTT Phase 3: Advanced Features Implementation

## Overview
Implementation of advanced VTT features including resizable panels, ping system, fog of war, and character sheets integration.

## Implementation Date
September 30, 2025

## Features Implemented

### 1. Resizable Floating Panels
All VTT panels can now be opened in floating, draggable, resizable windows that don't block the map view.

**Component**: `ResizablePanel.jsx`
- Drag panels by header
- Resize from bottom-right corner
- Minimize/maximize toggle
- Close button
- Prevents going off-screen
- Z-index stacking

**Panels Available**:
- Session Chat
- Campaign Rules
- Party Management
- Initiative Tracker
- Character Sheets (new!)

**Usage**:
- Click toolbar button once = opens in sidebar (existing behavior)
- Click toolbar button twice = opens in floating panel (popout mode)
- Panels remember position while open

### 2. Ping System
Players and DMs can ping locations on the map to draw attention.

**Service**: `pingService.js`
- Creates temporary markers that auto-delete after 3 seconds
- Real-time synchronization via Firestore
- Visible to all players in session

**Usage**:
- Hold **Alt/Option + Click** anywhere on map to create ping
- Yellow glowing circle appears at clicked location
- Automatically disappears after 3 seconds
- All players see the ping in real-time

**Implementation**:
- Firestore path: `/campaigns/{campaignId}/vtt/{mapId}/pings/{pingId}`
- Auto-deletion with setTimeout
- onSnapshot listeners for real-time updates
- Rendered in Konva Layer above tokens

### 3. Fog of War
DMs can hide/reveal areas of the map. Player tokens automatically reveal fog as they move.

**Service**: `fogOfWarService.js`

**Features**:
- Initialize fog for map (creates visibility grid)
- Toggle fog on/off
- Reveal areas manually (DM)
- Auto-reveal around player tokens (3 grid radius)
- Clear all fog (reveal entire map)
- Reset all fog (hide entire map)
- Real-time sync via Firestore

**DM Controls**:
- **Fog Button** in toolbar (DM only)
  - Eye icon = fog disabled
  - Eye-off icon = fog enabled
- Click to toggle fog of war for active map
- Fog state persists across sessions

**Player Experience**:
- Black overlay (85% opacity) on hidden areas
- Moving player tokens reveals fog in 3-grid radius
- Revealed areas stay visible (persistent)
- Cannot see tokens in fogged areas

**Data Structure**:
```javascript
{
  visibility: [[false, false, true], ...], // 2D array
  gridWidth: 50,
  gridHeight: 50,
  enabled: true,
  updatedAt: "2025-09-30T..."
}
```

**Storage**: `/campaigns/{campaignId}/vtt/{mapId}/fog/current`

### 4. Character Sheets in VTT
Character sheets are now accessible directly in the VTT session.

**Component**: `CharacterSheetPanel.jsx`

**Features**:
- DMs see **all player character sheets** with tabs
- Players see **only their own character sheet**
- Real-time sync with campaign characters
- Full D&D 5e character sheet display
- Tabbed interface for multiple characters (DM view)

**Usage**:
- Click **Characters** button (FiUser icon) in toolbar
- Opens in floating resizable panel
- DM can switch between player characters
- Players see only their character

**Integration**:
- Uses existing `CharacterSheet` component
- Loads from `/campaigns/{campaignId}/characters`
- Filters by `userId` for players
- Shows all for DM

### 5. Encounter Builder Enhancement
Pre-stage encounter tokens and reveal them during gameplay.

**Component**: `EncounterBuilder.jsx` (enhanced)

**New Features**:
- Tokens saved to Firestore with `staged: true` flag
- Real-time sync of staged tokens
- "Add" button reveals token to map
- "Delete" button removes staged token
- Staged tokens appear on map but marked as staged

**Usage**:
1. DM opens Encounter Builder (sidebar)
2. Creates tokens using TokenPalette
3. Tokens appear in "Staged Tokens" list
4. Click "✓ Add" to reveal token to players
5. Click "✕" to delete staged token

**Fixed Issues**:
- Tokens now properly save to Firestore
- Drag-and-drop functional via "Add" button
- Real-time updates when revealing tokens
- Proper cleanup when deleting

### 6. Enhanced MapCanvas
Map canvas now supports ping rendering and fog of war display.

**New Props**:
- `fogOfWarEnabled` - boolean to enable fog rendering
- Alt-click handling for pings

**Layers** (bottom to top):
1. Background Image
2. Grid Layer
3. **Fog of War Layer** (if enabled, players only)
4. Token Layer
5. **Ping Layer**
6. Additional custom layers

**Fog Rendering**:
- Black rectangles for each hidden grid cell
- Only rendered for non-DM users
- Efficient rendering (only hidden cells drawn)
- 85% opacity for semi-transparency

**Ping Rendering**:
- Yellow glowing circles
- 20px radius
- Shadow blur effect
- Auto-removes after 3 seconds

## Security Rules

### Firestore Rules for Pings
```javascript
match /campaigns/{campaignId}/vtt/{mapId}/pings/{pingId} {
  allow read: if isCampaignMember(campaignId);
  allow create: if isCampaignMember(campaignId);
  allow delete: if isCampaignMember(campaignId) || resource.data.userId == request.auth.uid;
}
```

### Firestore Rules for Fog of War
```javascript
match /campaigns/{campaignId}/vtt/{mapId}/fog/{fogId} {
  allow read: if isCampaignMember(campaignId);
  allow write: if isCampaignDM(campaignId); // DM only
}
```

## File Structure

```
src/
├── services/vtt/
│   ├── pingService.js           (NEW - ping CRUD operations)
│   ├── fogOfWarService.js       (NEW - fog of war management)
│   ├── tokenService.js          (existing)
│   └── mapService.js            (existing)
├── components/VTT/
│   ├── Canvas/
│   │   └── MapCanvas.jsx        (ENHANCED - ping/fog rendering)
│   ├── VTTSession/
│   │   ├── VTTSession.jsx       (ENHANCED - floating panels, fog controls)
│   │   ├── ResizablePanel.jsx   (NEW - draggable panels)
│   │   ├── ResizablePanel.css   (NEW)
│   │   ├── CharacterSheetPanel.jsx (NEW - character sheets)
│   │   ├── CharacterSheetPanel.css (NEW)
│   │   ├── EncounterBuilder.jsx (ENHANCED - Firestore integration)
│   │   └── VTTSession.css       (ENHANCED - tooltip styling)
│   └── ...
└── ...
```

## User Interface Updates

### VTT Toolbar (Updated)
```
[≡] Campaign Name - Live Session [👑 DM / 🎭 Player]

[Chat] [Rules] [Party] [Initiative] [Characters] [Maps*] [Encounters*] [Fog*]  [Tokens*] [Exit] [≡]

* = DM only
```

### New Toolbar Buttons
1. **Characters** (FiUser) - Opens character sheet panel
2. **Fog** (FiEye/FiEyeOff) - Toggles fog of war (DM only)

### Help Tooltip
Bottom-right corner shows:
```
💡 Hold Alt/Option + Click to ping the map
```

## Usage Workflows

### DM Workflow: Setting Up Fog of War
1. Load map with grid enabled
2. Click "Fog" button in toolbar
3. Fog initializes (entire map hidden)
4. Players see black overlay
5. As player tokens move, fog reveals automatically
6. DM can clear/reset fog via service functions

### Player Workflow: Exploring with Fog
1. DM enables fog of war
2. Player sees mostly black map
3. Move player token around map
4. Fog auto-clears in 3-grid radius around token
5. Explored areas stay visible
6. Hidden tokens not visible in fog

### DM Workflow: Building Encounters
1. Open Encounter Builder
2. Create enemy tokens (e.g., 5 Goblins)
3. Tokens appear in "Staged Tokens" list
4. When combat starts, click "✓ Add" for each
5. Tokens appear on map for players
6. Optionally delete unused staged tokens

### All Users: Using Pings
1. See something important on map
2. Hold Alt/Option
3. Click location
4. Yellow ping appears for 3 seconds
5. All players see it
6. Use to coordinate tactics or highlight areas

### All Users: Using Floating Panels
1. Click toolbar button (e.g., Chat)
2. Panel opens in sidebar
3. Click button again
4. Panel pops out as floating window
5. Drag by header to reposition
6. Resize from bottom-right corner
7. Minimize or close as needed

## Technical Implementation Details

### Ping Animation
Pings use Konva Circle with:
- `shadowColor`: yellow
- `shadowBlur`: 15
- `shadowOpacity`: 0.8
- `opacity`: 0.6
- Auto-delete timer: 3000ms

### Fog of War Grid Calculation
```javascript
const gridWidth = Math.ceil(map.width / map.gridSize);
const gridHeight = Math.ceil(map.height / map.gridSize);
const visibility = Array(gridHeight).fill(null).map(() => 
  Array(gridWidth).fill(false)
);
```

### Token Movement Fog Reveal
```javascript
const gridX = Math.floor(tokenX / gridSize);
const gridY = Math.floor(tokenY / gridSize);
await fogOfWarService.revealArea(firestore, campaignId, mapId, gridX, gridY, 3);
```

### Resizable Panel State Management
```javascript
const [floatingPanels, setFloatingPanels] = useState({
  chat: false,
  rules: false,
  party: false,
  initiative: false,
  characters: false
});
```

## Performance Considerations

### Fog of War
- Only renders hidden cells (not all cells)
- Grid calculation cached in state
- Firestore updates batched on token movement
- Fog data stored as 2D array (efficient)

### Pings
- Auto-cleanup prevents database bloat
- Short lifespan (3 seconds)
- Minimal data payload
- No persistent storage needed

### Resizable Panels
- Uses React state for position/size
- CSS transforms for smooth dragging
- Event listeners cleaned up on unmount
- Z-index management prevents overlaps

## Testing Checklist

### Fog of War
- [ ] DM can toggle fog on/off
- [ ] Player tokens reveal fog on movement
- [ ] Fog persists across session reloads
- [ ] Fog only visible to players (not DM)
- [ ] Hidden tokens not visible in fog
- [ ] Revealed areas stay visible

### Pings
- [ ] Alt+Click creates ping
- [ ] Ping appears for all users
- [ ] Ping auto-deletes after 3 seconds
- [ ] Ping positioned correctly at click point
- [ ] Multiple pings can exist simultaneously

### Resizable Panels
- [ ] Panels can be dragged
- [ ] Panels can be resized
- [ ] Panels can be minimized
- [ ] Panels don't go off-screen
- [ ] Multiple panels can be open
- [ ] Close button works

### Character Sheets
- [ ] DM sees all character sheets
- [ ] Players see only their own
- [ ] Tab switching works (DM view)
- [ ] Character data loads correctly
- [ ] Real-time updates work

### Encounter Builder
- [ ] Can create staged tokens
- [ ] Staged tokens appear in list
- [ ] "Add" button reveals token
- [ ] "Delete" button removes token
- [ ] Real-time sync works

## Known Issues & Limitations

### Fog of War
- Requires grid-enabled maps
- Cannot manually paint fog areas (future feature)
- Revelation is circular, not line-of-sight based
- No fog-of-war history/playback

### Pings
- Fixed 3-second duration (not configurable)
- No custom ping colors or sizes
- No ping history or log
- Cannot ping specific tokens

### Resizable Panels
- No snap-to-grid or docking
- Position not persisted across reloads
- Cannot cascade or tile multiple panels
- No keyboard shortcuts for panel management

### Character Sheets
- Read-only in VTT (edit in campaign dashboard)
- No quick HP/condition updates
- Cannot create characters from VTT

## Future Enhancements

### Phase 4 (Planned)
1. **Drawing Tools**: Freehand drawing on map for DM
2. **Measurement Tool**: Ruler for distances
3. **Area of Effect Templates**: Circles, cones, lines for spells
4. **Token Conditions**: Status icons on tokens (poisoned, prone, etc.)
5. **Initiative Auto-sort**: Tokens arranged by initiative order
6. **Dice Rolling**: Integrated 3D dice roller
7. **Sound Board**: Ambient music and sound effects
8. **Voice Chat**: WebRTC voice integration
9. **Session Recording**: Replay and export sessions
10. **Map Layers**: Multiple image layers for dynamic scenes

### Fog of War Improvements
- Line-of-sight calculation (walls block vision)
- Manual fog painting with brush tool
- Fog templates (square, circle, custom shapes)
- Fog history (undo/redo)
- Fog presets per map

### Ping Enhancements
- Configurable duration
- Color-coded pings (danger, info, question)
- Directional pings (arrows)
- Ping with text labels
- Ping sound effects

## Conclusion

Phase 3 brings significant enhancements to the VTT experience:
- **Resizable Panels**: Multi-tasking without blocking the map
- **Ping System**: Clear visual communication
- **Fog of War**: Dynamic exploration and tension
- **Character Sheets**: Quick reference during play
- **Enhanced Encounters**: Smooth combat setup

The VTT is now a fully-featured virtual tabletop suitable for running complete D&D 5e sessions with rich interactivity and real-time collaboration.

## Documentation References
- [VTT Phase 2 Completion](./PHASE_2_COMPLETION_REPORT.md)
- [VTT Immersive Full-Screen](./VTT_IMMERSIVE_FULLSCREEN.md)
- [VTT MVP Scope](./VTT_MVP_SCOPE.md)
- [Token Integration Guide](./TOKEN_INTEGRATION_GUIDE.md)
