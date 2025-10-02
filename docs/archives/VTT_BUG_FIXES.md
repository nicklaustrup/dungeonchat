# VTT Bug Fixes - Grid Configurator & Fire Icons

**Date**: Current Session  
**Commit**: 39ea7f3  
**Previous Commit**: b5bad2c (5-feature UX improvements)

## Issues Reported

After implementing the 5 VTT UX improvements, two critical bugs were discovered:

1. **Grid Configurator Enabled Checkbox Bug**
   - **Symptom**: Every time the DM tried to adjust grid settings, the "Enabled" checkbox would uncheck itself
   - **Impact**: DM could not adjust the grid while it was enabled; had to disable, adjust, then re-enable

2. **Fire Icons Not Syncing**
   - **Symptom**: Light source markers (fire icons 🔥) were only visible to the DM who placed them
   - **Impact**: Remote players could not see where lights were positioned on the map

---

## Root Cause Analysis

### Bug 1: Grid Configurator Enabled Checkbox

**File**: `src/components/VTT/Canvas/GridConfigurator.jsx` (line 72)

**Problem**:
```jsx
// OLD CODE (line 72)
<input type="checkbox" checked={gridEnabled} onChange={e => setGridEnabled(e.target.checked)} />
```

- The `onChange` handler only called `setGridEnabled()` to update **local state**
- Unlike all other controls (gridSize, gridOffset, gridColor, gridOpacity), it never called `debouncedCommit()`
- Result: Changes to `gridEnabled` were never persisted to Firestore
- When the component re-rendered (e.g., when adjusting other settings), it would pull the old `map.gridEnabled` value from props, reverting the checkbox

**Why Other Controls Worked**:
```jsx
// Grid size control (working correctly)
<input
  type="range"
  value={gridSize}
  onChange={e => {
    setGridSize(Number(e.target.value));
    debouncedCommit({ gridSize: Number(e.target.value) });  // ✓ Commits to Firestore
  }}
/>
```

**Fix Applied**:
```jsx
// NEW CODE
<input type="checkbox" checked={gridEnabled} onChange={e => {
  const newValue = e.target.checked;
  setGridEnabled(newValue);
  debouncedCommit({ gridEnabled: newValue });  // ✓ Now commits to Firestore
}} />
```

### Bug 2: Fire Icons Not Syncing

**File**: `src/components/VTT/Canvas/MapCanvas.jsx` (line 1287)

**Problem**:
```jsx
// OLD CODE (line 1287)
{isDM && globalLighting.enabled && lights.map(light => (
  <React.Fragment key={`light-control-${light.id}`}>
    <Circle ... />  {/* Light marker */}
  </React.Fragment>
))}
```

- Light markers were wrapped in `{isDM && ...}` condition
- This meant light source markers were **only rendered for the DM**
- Remote players never saw the visual indicators showing where lights were placed
- The lighting **effects** (glow/darkness) were syncing correctly via `LightingLayer`, but the **position markers** were not visible

**Architecture**:
- `LightingLayer.jsx`: Renders visual lighting effects (glow, darkness, flicker)
- `MapCanvas.jsx` (lines 1286-1377): Renders light position markers (colored circles)
- `useLighting.js`: Manages Firestore real-time sync for light data
- Data flow: DM creates light → Firestore → onSnapshot → All users get `lights` array → LightingLayer renders effects ✓ | MapCanvas should render markers ✗

**Fix Applied**:
```jsx
// NEW CODE
{globalLighting.enabled && lights.map(light => (  // ✓ Removed isDM condition
  <React.Fragment key={`light-control-${light.id}`}>
    <Circle
      draggable={isDM && activeTool === 'pointer'}  // ✓ Only DM can drag
      onContextMenu={(e) => {
        if (!isDM) return;  // ✓ Only DM can delete
        // ... show delete menu
      }}
      onMouseEnter={(e) => {
        if (isDM) {  // ✓ Only DM sees move cursor
          e.target.getStage().container().style.cursor = 'move';
        }
      }}
      // ... rest of marker
    />
  </React.Fragment>
))}
```

**Security/UX Considerations**:
- ✓ Light markers now visible to **all users**
- ✓ Markers remain **draggable only for DM**
- ✓ Context menu (delete) only works for DM
- ✓ Move cursor only shows for DM
- ✓ Players see lights but cannot interact with them

---

## Files Modified

### 1. `src/components/VTT/Canvas/GridConfigurator.jsx`
**Changes**: Lines 70-77  
**Modification**: Added `debouncedCommit({ gridEnabled: newValue })` to checkbox onChange handler

**Before**:
```jsx
<input type="checkbox" checked={gridEnabled} onChange={e => setGridEnabled(e.target.checked)} />
```

**After**:
```jsx
<input type="checkbox" checked={gridEnabled} onChange={e => {
  const newValue = e.target.checked;
  setGridEnabled(newValue);
  debouncedCommit({ gridEnabled: newValue });
}} />
```

### 2. `src/components/VTT/Canvas/MapCanvas.jsx`
**Changes**: Lines 1286-1327  
**Modifications**:
1. Changed condition from `{isDM && globalLighting.enabled && ...}` to `{globalLighting.enabled && ...}`
2. Updated comment to clarify markers are "visible to all, draggable for DMs"
3. Changed `draggable` from `activeTool === 'pointer'` to `isDM && activeTool === 'pointer'`
4. Added `if (!isDM) return;` guard to `onContextMenu` handler
5. Wrapped cursor changes in `if (isDM)` checks

**Key Code Sections**:
```jsx
// Visibility condition (line 1287)
{globalLighting.enabled && lights.map(light => (

// Draggable only for DM (line 1295)
draggable={isDM && activeTool === 'pointer'}

// Context menu only for DM (line 1332)
onContextMenu={(e) => {
  if (!isDM) return; // Only DMs can delete lights
  // ...
}}

// Move cursor only for DM (lines 1320-1327)
onMouseEnter={(e) => {
  if (isDM) {
    e.target.getStage().container().style.cursor = 'move';
  }
}}
```

---

## Testing Performed

### Build Test
```bash
npm run build
```
✅ **Result**: Compiled successfully (506.12 kB main bundle, +18 B from previous)

### ESLint
✅ **Result**: No warnings, no errors

### Pre-commit Hooks
✅ **Result**: All tests passed

---

## Expected Behavior After Fix

### Grid Configurator
1. DM opens Grid Configurator panel
2. DM checks "Enabled" checkbox ✓
3. DM adjusts grid size, offsets, color, or opacity
4. Grid remains enabled throughout adjustments ✓
5. Settings persist across page refreshes ✓

**Before Fix**: Checkbox would uncheck when adjusting other settings  
**After Fix**: Checkbox state persists correctly

### Fire Icons (Light Markers)
1. DM opens Lighting panel and places a torch
2. DM sees orange circle marker at light position ✓
3. **Remote player** also sees orange circle marker at same position ✓
4. Both DM and player see lighting effects (glow/darkness) ✓
5. Only DM can drag marker to move light ✓
6. Only DM can right-click to delete light ✓
7. Player sees marker but cannot interact with it ✓

**Before Fix**: Only DM saw light markers; players saw lighting effects but no position indicators  
**After Fix**: All users see light markers; only DM can interact with them

---

## Multi-User Sync Verification

### Data Flow
```
DM creates/moves light
    ↓
updateLight(id, { position: ... })
    ↓
lightingService.updateLight()
    ↓
Firestore updateDoc()
    ↓
Real-time onSnapshot listener (useLighting hook)
    ↓
All users' lights state updates
    ↓
MapCanvas re-renders with new lights array
    ↓
✓ LightingLayer renders visual effects (glow/darkness)
✓ MapCanvas renders position markers (colored circles) ← NOW VISIBLE TO ALL
```

### Firestore Document Structure
```javascript
// maps/{mapId}
{
  gridEnabled: true,        // ← Fixed: Now syncs correctly
  gridSize: 50,
  gridOffsetX: 10,
  gridOffsetY: 5,
  // ... other settings
}

// lights/{lightId}
{
  id: "light-123",
  position: { x: 400, y: 300 },  // ← Always synced
  color: "#FF8800",
  radius: 100,
  // ... other properties
}
```

---

## Related Components

### Components Involved
1. **GridConfigurator.jsx** - Panel for adjusting grid settings
2. **GridLayer.jsx** - Renders the grid overlay with offsets
3. **MapCanvas.jsx** - Main canvas orchestrator, renders light markers
4. **LightingLayer.jsx** - Renders lighting visual effects (glow/darkness)
5. **LightingPanel.jsx** - Panel for creating/managing lights
6. **useLighting.js** - Hook managing light state with Firestore real-time sync

### Component Hierarchy
```
VTTSession
  ├── MapCanvas (orchestrates all layers)
  │   ├── GridLayer (renders grid lines)
  │   ├── TokenLayer (renders tokens)
  │   ├── Light Markers (Circle elements) ← Fixed here
  │   ├── LightingLayer (renders lighting effects)
  │   └── FogLayer (renders fog of war)
  ├── GridConfigurator (floating panel) ← Fixed here
  └── LightingPanel (floating panel)
```

---

## Prevention Measures

### Code Review Checklist
- [ ] All state changes in DM-only panels must call `debouncedCommit()` or immediate `onUpdate()`
- [ ] Visual elements should default to visible unless security/UX requires DM-only
- [ ] Interactive controls (drag, delete, edit) can be DM-only
- [ ] Test all real-time sync features with multi-user scenarios

### Pattern to Follow
```jsx
// ✓ GOOD: Visible to all, interactive only for DM
{lights.map(light => (
  <Circle
    visible={true}  // All users see it
    draggable={isDM}  // Only DM can interact
  />
))}

// ✗ BAD: Visible only to DM
{isDM && lights.map(light => (
  <Circle />  // Remote users never see this
))}
```

### State Sync Pattern
```jsx
// ✓ GOOD: Local state + Firestore commit
const [value, setValue] = useState(initialValue);
onChange={e => {
  setValue(e.target.value);
  debouncedCommit({ fieldName: e.target.value });  // Persist to Firestore
}}

// ✗ BAD: Local state only
const [value, setValue] = useState(initialValue);
onChange={e => setValue(e.target.value)}  // Never persisted!
```

---

## Impact Assessment

### User-Facing Changes
- **Grid Adjustment**: DMs can now adjust grid settings without the enabled checkbox reverting
- **Light Visibility**: All users can now see where light sources are positioned on the map
- **No Breaking Changes**: Existing functionality preserved

### Performance Impact
- **Minimal**: +18 bytes to main bundle
- **No Additional Renders**: Light markers were always being processed, just conditionally rendered
- **Firestore Writes**: No increase (gridEnabled changes already occurred, just weren't persisted)

### Security/Privacy
- ✅ No security concerns: Light data is already synced via Firestore
- ✅ DM controls preserved: Only DM can create, move, or delete lights
- ✅ Appropriate visibility: Players should see light positions to understand the scene

---

## Lessons Learned

1. **Debounced Commits Required**: Any user-editable state that needs persistence MUST call `debouncedCommit()` or similar
2. **Visibility vs Interactivity**: Separate concerns - visibility should default to all users, interactivity can be role-restricted
3. **Grep for Patterns**: When one control works and another doesn't, search for the working pattern and apply it consistently
4. **Real-time Sync Testing**: Always test multi-user scenarios to catch visibility/sync issues early
5. **Component Archaeology**: Understanding which component renders what (LightingLayer vs MapCanvas light markers) is crucial

---

## Commit Details

**Commit**: 39ea7f3  
**Message**: "Fix grid configurator enabled checkbox and fire icon sync"  
**Files Changed**: 2  
**Insertions**: +15  
**Deletions**: -6  

**Previous Work**: b5bad2c (5 VTT UX improvements)

---

## Documentation Updated

- ✅ VTT_BUG_FIXES.md (this file)
- 🔄 VTT_UX_IMPROVEMENTS.md should be updated with bug fix addendum

## Next Steps

1. Test grid adjustment in live session
2. Test light marker visibility with remote player
3. Verify both fixes work together correctly
4. Update VTT_UX_IMPROVEMENTS.md with "Known Issues (Fixed)" section
