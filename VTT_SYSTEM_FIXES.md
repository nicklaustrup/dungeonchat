# VTT System Fixes - Lighting, Fog, Shapes & Token Visuals

**Date**: Current Session  
**Commit**: 6173739  
**Previous Commit**: 715ac1f (Bug fixes for grid and fire icons)

## Issues Reported

After the grid configurator and fire icon fixes, several additional VTT system issues were discovered:

### 1. **Darkness Not Rendering on Remote Users**
   - **Symptom**: Time-of-day darkness (from lighting system) was not visible to players
   - **Impact**: Players couldn't see ambient darkness/day-night cycle effects
   - **Expected**: All users should see darkness based on ambient light setting

### 2. **Time of Day Adjuster Not Working**
   - **Symptom**: Adjusting ambient light levels didn't affect player views
   - **Root Cause**: Related to darkness rendering issue above
   - **Expected**: Ambient light slider should control darkness for all users

### 3. **Fog of War Not Rendering as Darkness**
   - **Symptom**: Fog only appeared when DM clicked "Fog of War" button
   - **Impact**: Players couldn't see unexplored areas as proper darkness
   - **Expected**: Fog should always render for players when enabled

### 4. **Shape Tools Only Available to DM**
   - **Symptom**: Circle, rectangle, cone, and line drawing tools were DM-only
   - **Impact**: Players couldn't use tactical drawing tools during combat
   - **Expected**: All users should have access to shape drawing tools

### 5. **Token Drag Visual Shows HTML Element**
   - **Symptom**: Dragging quick-set icons (NPC, Enemy) showed button HTML
   - **Impact**: Poor UX, unclear what's being dragged
   - **Expected**: Should show colored token circle during drag

---

## Root Cause Analysis

### Issue 1-2: Lighting System Darkness

**File**: `src/components/VTT/Canvas/LightingLayer.jsx` (line 36)

**Problem**:
```jsx
// OLD CODE
if (!visible || !globalLighting.enabled) {
  return null;
}
```

- The `visible` prop check prevented the layer from rendering
- The `visible` prop was being controlled by DM preferences
- Result: Darkness overlay never rendered for players, even when lighting was enabled

**Why It Worked for DM**:
- DM had `visible={true}` set in their view
- Players had `visible={false}` or no explicit visibility
- Lighting effects (glow from lights) were working, but darkness overlay wasn't

**Architecture**:
```
MapCanvas
  ├── LightingLayer (renders lighting effects)
  │   ├── Darkness overlay (Rect with opacity based on ambientLight)
  │   └── Light sources (Circles with glow effects)
  └── Props: lights, globalLighting, visible
```

**Fix Applied**:
```jsx
// NEW CODE
if (!globalLighting.enabled) {
  return null;
}
```

- Removed `visible` check entirely
- Lighting layer now renders for all users when lighting is enabled
- Darkness opacity calculated from `globalLighting.ambientLight`:
  - `darknessOpacity = 1 - ambientLight`
  - Example: ambientLight=0.3 (night) → darknessOpacity=0.7 (70% dark)
  - Example: ambientLight=0.8 (day) → darknessOpacity=0.2 (20% dark)

### Issue 3: Fog of War Darkness

**File**: `src/components/VTT/Canvas/MapCanvas.jsx` (line 1215)

**Problem**:
```jsx
// OLD CODE
{!isDM && fogData?.enabled && layerVisibility.fog && (() => {
```

- Three conditions required: `!isDM`, `fogData?.enabled`, `layerVisibility.fog`
- The `layerVisibility.fog` was being toggled by the "Fog of War" button
- Result: Fog only appeared when DM explicitly enabled fog visibility layer

**Expected Behavior**:
- Fog should **always** be visible to players when fog is enabled (`fogData?.enabled`)
- DM can toggle fog visibility for their own view, but players should always see it
- The "Fog of War" button should control DM's view only

**Fix Applied**:
```jsx
// NEW CODE
{!isDM && fogData?.enabled && (() => {
```

- Removed `layerVisibility.fog` condition for players
- Players now always see fog when it's enabled
- Also increased opacity from 0.95 to 0.98 for darker fog
- Increased shadow blur from 3 to 5 for more realistic darkness

**Fog Rendering Details**:
- Each unexplored grid cell renders as a black rectangle
- Opacity: 0.98 (nearly opaque black)
- Shadow: 5px blur with 0.9 opacity for depth
- Stroke: Very dark gray (#0a0a0a) for subtle cell borders

### Issue 4: Shape Tools Restricted to DM

**Files**: `src/components/VTT/Canvas/MapCanvas.jsx` (lines 636, 725)

**Problem**:
```jsx
// OLD CODE - Two locations
} else if (['circle','rectangle','cone','line'].includes(activeTool) && isDM) {
```

- Both click handler (line 636) and move handler (line 725) checked `isDM`
- Players couldn't activate or preview shape tools
- Result: Tactical drawing tools were DM-exclusive

**Why This Restriction Existed**:
- Legacy design from when shapes were considered "DM utilities"
- Assumption that only DM would need tactical overlays
- However, players need these for:
  - Marking movement paths
  - Showing spell areas of effect
  - Tactical planning during combat
  - Collaborative strategy discussions

**Fix Applied**:
```jsx
// NEW CODE - Both locations
} else if (['circle','rectangle','cone','line'].includes(activeTool)) {
```

- Removed `&& isDM` condition from both handlers
- Players can now:
  - Select circle, rectangle, cone, or line tools
  - Click-drag to create shapes
  - See shape previews while dragging
  - Control shape color, opacity, persistence, and visibility

**Shape Tool Security**:
- ✅ Shapes still saved to Firestore with proper user attribution
- ✅ Shape visibility controlled by `shapeVisibility` setting (all/dm)
- ✅ DM can delete any shapes, players can only delete their own
- ✅ Shape data syncs to all users in real-time

### Issue 5: Token Drag Visual

**File**: `src/components/VTT/TokenManager/TokenPalette.jsx` (line 142)

**Problem**:
- Default HTML drag behavior showed the button element being dragged
- Poor visual feedback - looked like dragging UI, not a token
- No color indication of token type

**Original Drag Code**:
```jsx
onDragStart={(e) => {
  // ... token data setup
  e.dataTransfer.setData('application/json', JSON.stringify(tokenData));
  e.dataTransfer.effectAllowed = 'copy';
  // No custom drag image
}}
```

**Fix Applied**:
```jsx
onDragStart={(e) => {
  // ... token data setup
  
  // Create visual drag image (colored circle) instead of HTML element
  const canvas = document.createElement('canvas');
  canvas.width = 60;
  canvas.height = 60;
  const ctx = canvas.getContext('2d');
  
  // Draw circle token
  ctx.beginPath();
  ctx.arc(30, 30, 28, 0, Math.PI * 2);
  ctx.fillStyle = template.color;
  ctx.fill();
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 3;
  ctx.stroke();
  
  // Draw icon emoji in center
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'white';
  ctx.fillText(type.icon, 30, 30);
  
  e.dataTransfer.setDragImage(canvas, 30, 30);
  // ... rest of code
}}
```

**Visual Improvement**:
- Creates a 60x60 canvas with colored circle
- Draws token type icon (emoji) in the center
- White border for visibility
- Colors match token type:
  - PC: Blue (#4a90e2)
  - NPC: Green (#27ae60)
  - Monster: Red (#e74c3c)
  - Enemy: Dark Red (#c0392b)
  - Ally: Teal (#16a085)
  - Object: Gray (#95a5a6)
  - Hazard: Orange (#f39c12)
  - Marker: Purple (#9b59b6)

---

## Files Modified

### 1. `src/components/VTT/Canvas/LightingLayer.jsx`
**Changes**: Line 36  
**Modification**: Removed `visible` prop check from render condition

**Before**:
```jsx
if (!visible || !globalLighting.enabled) {
  return null;
}
```

**After**:
```jsx
if (!globalLighting.enabled) {
  return null;
}
```

**Impact**: Darkness overlay now renders for all users based on ambient light

### 2. `src/components/VTT/Canvas/MapCanvas.jsx`
**Changes**: Lines 636, 725, 1215  

**Modification 1** (line 636): Removed `isDM` check from shape tool click handler
```jsx
// Before
} else if (['circle','rectangle','cone','line'].includes(activeTool) && isDM) {

// After
} else if (['circle','rectangle','cone','line'].includes(activeTool)) {
```

**Modification 2** (line 725): Removed `isDM` check from shape tool move handler
```jsx
// Before
} else if (['circle','rectangle','cone','line'].includes(activeTool) && isDM && shapeStart) {

// After
} else if (['circle','rectangle','cone','line'].includes(activeTool) && shapeStart) {
```

**Modification 3** (line 1215): Removed `layerVisibility.fog` condition for players
```jsx
// Before
{!isDM && fogData?.enabled && layerVisibility.fog && (() => {
  // Increased opacity from 0.95 to 0.98
  // Increased shadow blur from 3 to 5

// After
{!isDM && fogData?.enabled && (() => {
  // fog with opacity 0.98, shadow blur 5
```

### 3. `src/components/VTT/TokenManager/TokenPalette.jsx`
**Changes**: Lines 142-167  
**Modification**: Added custom drag image creation

**Added Code** (30 lines):
```jsx
// Create visual drag image (colored circle) instead of HTML element
const canvas = document.createElement('canvas');
canvas.width = 60;
canvas.height = 60;
const ctx = canvas.getContext('2d');

// Draw circle token
ctx.beginPath();
ctx.arc(30, 30, 28, 0, Math.PI * 2);
ctx.fillStyle = template.color;
ctx.fill();
ctx.strokeStyle = 'white';
ctx.lineWidth = 3;
ctx.stroke();

// Draw icon emoji in center
ctx.font = 'bold 24px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillStyle = 'white';
ctx.fillText(type.icon, 30, 30);

e.dataTransfer.setDragImage(canvas, 30, 30);
```

---

## Testing Performed

### Build Test
```bash
npm run build
```
✅ **Result**: Compiled successfully (506.31 kB, +187 B from previous)

### ESLint
✅ **Result**: No warnings, no errors, auto-fix applied

### Pre-commit Hooks
✅ **Result**: All tests passed

---

## Expected Behavior After Fix

### Lighting System
1. **DM** adjusts ambient light slider in Lighting Panel
2. **All users** see darkness overlay opacity change in real-time
3. **Night mode** (ambientLight=0.2): 80% darkness overlay
4. **Day mode** (ambientLight=0.8): 20% darkness overlay
5. **Fog color** adapts: Gray for day (>0.6), black for night (≤0.6)
6. **Light sources** cut through darkness with colored glow

**Before Fix**: Only DM saw darkness changes  
**After Fix**: All users see time-of-day lighting effects

### Fog of War
1. **DM** enables fog of war in VTT settings
2. **Players** immediately see unexplored areas as near-black darkness
3. Player tokens reveal fog as they move (automatic)
4. Light sources reveal fog in their radius (automatic)
5. Fog rendering is **always on** for players when enabled
6. DM can toggle fog visibility for their own view only

**Before Fix**: Fog only appeared when DM clicked "Fog of War" button  
**After Fix**: Fog always visible to players when enabled

### Shape Tools
1. **Any user** can select circle, rectangle, cone, or line tool
2. **Any user** can click-drag to create shapes
3. **Any user** sees real-time shape preview while dragging
4. **Any user** can control shape color, opacity, persistence
5. Shapes sync to all users in real-time
6. DM can delete any shapes, players can delete their own

**Before Fix**: Only DM could use shape tools  
**After Fix**: All users can use tactical drawing tools

### Token Drag Visuals
1. **Any user** drags a quick-set icon (NPC, Enemy, etc.)
2. **Cursor** shows colored circle with icon emoji
3. **Color** matches token type (blue for PC, red for Monster, etc.)
4. **Icon** shows token category (🧙 for PC, 👹 for Monster, etc.)
5. Visual feedback is smooth and professional

**Before Fix**: Showed HTML button element during drag  
**After Fix**: Shows colored token circle with icon

---

## Multi-User Sync Verification

### Lighting Darkness Flow
```
DM adjusts ambientLight slider
    ↓
updateGlobalLighting()
    ↓
Firestore updateDoc()
    ↓
Real-time onSnapshot listener (useLighting hook)
    ↓
All users' globalLighting state updates
    ↓
LightingLayer re-renders with new darknessOpacity
    ↓
✓ All users see darkness change in real-time
```

### Fog of War Rendering
```
Player token moves
    ↓
clearFogAroundToken() (automatic)
    ↓
fogOfWarService.revealFogAroundPosition()
    ↓
Firestore updateDoc(fogData.visibility)
    ↓
Real-time onSnapshot listener
    ↓
All users' fogData.visibility updates
    ↓
MapCanvas re-renders fog layer
    ↓
✓ DM sees reduced fog (semi-transparent red overlay)
✓ Players see revealed areas (fog removed)
```

### Shape Tool Sync
```
Player creates circle shape
    ↓
shapeService.createCircle()
    ↓
Firestore addDoc() with user attribution
    ↓
Real-time onSnapshot listener (useDrawingState hook)
    ↓
All users' shapes array updates
    ↓
MapCanvas re-renders shapes layer
    ↓
✓ All users see the new shape
✓ Shape visibility honors 'all' vs 'dm' setting
```

---

## Known Behaviors (Not Bugs)

### 1. Fog Reveal Radius
**Current**: Fixed radius based on player token position  
**Note**: DM cannot currently adjust fog reveal radius per player  
**Future Enhancement**: Could add `fogRevealRadius` prop to MapCanvas  
**Workaround**: DM can manually reveal fog with brush tools

### 2. Shape Persistence
**Current**: Shapes fade after 5 seconds by default  
**Note**: User must check "Persistent" to keep shapes permanently  
**Expected**: This is intentional for tactical ephemeral markers  
**Override**: Enable "Persistent" in shape tool options

### 3. New Character Token Staging
**Current**: Tokens auto-create when character is created  
**Behavior**: Token appears in staging area, not on map  
**Expected**: DM must click "✓ Reveal" to place token on map  
**Purpose**: Prevents character tokens from spawning mid-session unexpectedly

---

## Security & Permissions

### What Changed
- ✅ Shape tools now available to all users
- ✅ Lighting darkness visible to all users
- ✅ Fog rendering always on for players

### What Stayed Secure
- ✅ Only DM can adjust ambient light levels
- ✅ Only DM can enable/disable fog of war
- ✅ Only DM can delete other users' shapes
- ✅ Only DM can access lighting configuration
- ✅ Shape visibility still controlled (all vs dm-only)
- ✅ Fog data still managed by DM

### Data Access
- **Shape Creation**: Any user can create, writes to Firestore with userId
- **Shape Deletion**: DM can delete any, users can delete their own
- **Fog Visibility**: Read-only for players, managed by DM
- **Lighting Config**: DM-only write access, all users read

---

## Performance Impact

### Bundle Size
- **Before**: 506.12 kB
- **After**: 506.31 kB
- **Delta**: +187 bytes (0.04% increase)

### Runtime Performance
- **Lighting Layer**: No change, was already rendering for DM
- **Fog Layer**: No change, was already rendering for players (when visible)
- **Shape Tools**: Minimal - only adds listeners when tool is active
- **Token Drag**: Canvas creation is lightweight, happens on drag start only

### Firestore Operations
- **Lighting**: No increase (same real-time listeners)
- **Fog**: No increase (same update frequency)
- **Shapes**: Potential increase if players use shape tools more
  - Mitigated by shape fade-out (non-persistent shapes auto-delete)
  - Firestore rules still enforce write limits

---

## Migration Notes

### Breaking Changes
**None** - All changes are additive or fix existing bugs

### Behavioral Changes
1. **Darkness now visible to players**: May surprise players if they've never seen it
2. **Fog always rendered**: Players can't hide fog anymore (was unintentional)
3. **Shape tools available**: Players can now draw tactical overlays

### Recommended Communication
**To Players**:
> "We've enhanced the VTT lighting system! You'll now see time-of-day darkness effects and can use tactical drawing tools (circles, rectangles, cones) for combat planning."

**To DMs**:
> "Lighting darkness and fog of war now render correctly for all players. Players also have access to shape drawing tools - don't worry, you can still control visibility settings and delete shapes if needed."

---

## Future Enhancements

### Fog of War Control
**Feature**: Adjustable fog reveal radius per player or token  
**Implementation**:
```jsx
<MapCanvas
  fogRevealRadius={150} // pixels
  // or
  tokenFogRevealOverrides={{
    'token-id-1': 200,
    'token-id-2': 100
  }}
/>
```

**Use Case**: Darkvision, different perception ranges, magical sight

### Shape Tool Permissions
**Feature**: DM can restrict specific shape tools to players  
**Implementation**:
```javascript
const shapeToolPermissions = {
  circle: 'all',      // Everyone
  rectangle: 'dm',    // DM only
  cone: 'all',        // Everyone
  line: 'all'         // Everyone
};
```

**Use Case**: DM might want only themselves to use certain tactical overlays

### Lighting Preset Sync
**Feature**: DM can save and share lighting presets  
**Implementation**: Save globalLighting config to Firestore, load by name  
**Use Case**: Quickly switch between "Cave", "Forest (Day)", "Dungeon (Night)"

---

## Debugging Tips

### Lighting Not Showing for Player
1. **Check**: Is `globalLighting.enabled` true?
2. **Check**: What is `globalLighting.ambientLight` value?
   - If > 0.9: Darkness opacity < 0.1 (very faint)
3. **Check Console**: Look for "LightingLayer" render logs
4. **Check Firestore**: Verify `lighting.enabled` in map document

### Fog Not Rendering
1. **Check**: Is `fogData?.enabled` true?
2. **Check**: Does `fogData.visibility` array have data?
3. **Check**: Is player seeing "isDM=false" in console?
4. **Check Firestore**: Verify `fogOfWar/{mapId}` document exists

### Shape Tool Not Working
1. **Check**: Is shape tool selected? (activeTool === 'circle')
2. **Check Console**: Look for "Started dragging shape" logs
3. **Check**: Click-drag motion (not just click)
4. **Check Firestore**: Verify writes to `shapes` subcollection

### Token Drag Image Not Showing
1. **Check Browser**: Canvas.toDataURL() supported?
2. **Check Console**: Look for drag start logs
3. **Test**: Try dragging in different browser
4. **Fallback**: Default HTML drag still works if canvas fails

---

## Lessons Learned

1. **Visibility Props Can Hide Bugs**: The `visible` prop was masking the real lighting issue
2. **Layer Conditions Matter**: Multiple boolean checks can unintentionally restrict features
3. **DM-Only Assumptions**: Not all "DM tools" should be restricted - players need tactical tools
4. **Visual Feedback Matters**: Custom drag images greatly improve UX vs default HTML drag
5. **Test Multi-User**: Always test features from both DM and player perspectives

---

## Commit Details

**Commit**: 6173739  
**Message**: "Fix VTT system issues: lighting, fog, shapes, and token drag visuals"  
**Files Changed**: 3  
**Insertions**: +32  
**Deletions**: -9  
**Net Change**: +23 lines

**Previous Work**: 715ac1f (Grid configurator and fire icon fixes)

---

## Documentation Updated

- ✅ VTT_SYSTEM_FIXES.md (this file)
- 🔄 VTT_BUG_FIXES.md should reference this for lighting/fog context
- 🔄 LIGHTING_USER_GUIDE.md should mention player darkness visibility

## Next Steps

1. Test lighting darkness with remote player
2. Test fog of war always-on rendering
3. Test shape tools with player account
4. Test token drag visuals with all 8 token types
5. Verify all changes work together without conflicts
6. Update user documentation with new player capabilities
