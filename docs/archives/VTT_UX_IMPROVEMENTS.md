# VTT UX Improvements - October 2025

## Overview
Comprehensive set of improvements to the Virtual Tabletop (VTT) system addressing token snapping, grid alignment, default settings, and mobile responsiveness.

## Changes Implemented

### 1. Fixed Token Snap-to-Grid for Large Tokens ✅

**Problem:** Large tokens (1x1, 2x2, etc.) were not aligning properly with grid squares. The square boundary at the center of the circular token was being rendered at the corner, causing the border to surround squares incorrectly instead of aligning with the circle.

**Solution:**
- Updated snap-to-grid logic in `TokenSprite.jsx`
- Calculate top-left corner position of token square
- Snap that corner to grid intersection
- Then offset by half token size to center the circle
- Applied consistent logic to both `handleDragMove` and `handleDragEnd`

**Technical Details:**
```javascript
// Old (incorrect): Snapped center directly
const cellX = Math.floor(rawX / gridSize);
const snappedX = cellX * gridSize + gridSize / 2;

// New (correct): Snap top-left corner, then center
const topLeftX = rawX - tokenSize / 2;
const cellX = Math.round(topLeftX / gridSize);
const snappedX = cellX * gridSize + tokenSize / 2;
```

**Files Modified:**
- `src/components/VTT/TokenManager/TokenSprite.jsx`

---

### 2. Enhanced Grid Configurator with Manual Controls ✅

**Problem:** When DMs use uploaded maps with pre-drawn grids, the VTT grid often doesn't align perfectly. Only slider controls were available, making precise alignment difficult.

**Solution:**
- Added manual number input fields for grid size (alongside existing slider)
- Added grid offset X/Y controls (slider + number input for each axis)
- Grid can now be shifted horizontally and vertically to match map's existing grid
- Live preview updates while adjusting
- Offset range: -100px to +100px for precise alignment

**Features:**
- **Grid Size**: Slider (20-150px) + Manual input (10-300px)
- **Grid Offset X**: Slider (-100 to +100px) + Manual input
- **Grid Offset Y**: Slider (-100 to +100px) + Manual input
- All changes debounced (180ms) for smooth performance
- Saved to Firestore for persistence across sessions

**Technical Details:**
- Added `gridOffsetX` and `gridOffsetY` to map document schema
- Updated `GridLayer.jsx` to support offset rendering
- Bidirectional grid rendering (draws lines both forward and backward from offset)

**Files Modified:**
- `src/components/VTT/Canvas/GridConfigurator.jsx`
- `src/components/VTT/Canvas/GridLayer.jsx`
- `src/components/VTT/Canvas/MapCanvas.jsx`

---

### 3. Changed Default Token Sizes to 0.5x0.5 ✅

**Problem:** Default drag-to-create tokens were too large (1x1) for typical battle maps, cluttering the canvas.

**Solution:**
- Changed all default token sizes from 1.0 to 0.5 (25x25px at 50px grid)
- Applies to all 8 token types:
  - Player Character: 0.5x0.5 (was 1.0)
  - NPC: 0.5x0.5 (was 1.0)
  - Monster: 0.5x0.5 (was 1.0)
  - Enemy: 0.5x0.5 (unchanged)
  - Ally: 0.5x0.5 (was 1.0)
  - Object: 0.5x0.5 (was 1.0)
  - Hazard: 0.5x0.5 (was 1.0)
  - Marker: 0.5x0.5 (unchanged)

**Benefits:**
- Less clutter on maps
- Easier to see underlying map details
- More consistent token sizing
- DMs can still manually resize tokens as needed

**Files Modified:**
- `src/components/VTT/TokenManager/TokenPalette.jsx`

---

### 4. Made Pointer the Default Interaction Tool ✅

**Problem:** VTT started with "ping" tool active, which was confusing for new users who wanted to select/move tokens first.

**Solution:**
- Changed default tool from `'ping'` to `'pointer'`
- Updated `useCanvasTools` hook to accept default tool parameter
- More intuitive workflow: select → interact → draw

**User Flow:**
1. **Before**: User enters VTT → ping tool active → must switch to pointer to select tokens
2. **After**: User enters VTT → pointer tool active → can immediately interact with tokens

**Files Modified:**
- `src/hooks/vtt/useCanvasTools.js` (added `defaultTool` parameter)
- `src/components/VTT/Canvas/MapCanvas.jsx` (pass `'pointer'` as default)
- `src/hooks/vtt/useCanvasTools.test.js` (updated test expectations)

---

### 5. Improved Toolbar for Small Screens ✅

**Problem:** On mobile devices, the VTT toolbar buttons would wrap or overflow, making navigation difficult. Maps and Encounters buttons added unnecessary clutter.

**Solution:**

#### a) Made Toolbar-Center Scrollable
- Added horizontal scrolling to toolbar button container
- Smooth touch scrolling on mobile devices
- Custom styled scrollbar (thin, semi-transparent)
- Webkit scrollbar support for better appearance

**CSS Changes:**
```css
.toolbar-center {
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.3) transparent;
}
```

#### b) Moved Maps and Encounters to Canvas Controls
- Removed from main toolbar (toolbar-center)
- Added to canvas-controls-top section (with Layers, Player View, Fog, FX Library)
- Only visible to DM
- Includes icons for better recognition

**Benefits:**
- Cleaner main toolbar
- Better mobile experience
- Related controls grouped together
- Maps/Encounters near the canvas where they're used

**Files Modified:**
- `src/components/VTT/VTTSession/VTTSession.css`
- `src/components/VTT/VTTSession/VTTSession.jsx`
- `src/components/VTT/Canvas/MapCanvas.jsx`

---

## Testing

### Build Status
✅ **Build successful** - No compilation errors
✅ **Tests passing** - All 6 useCanvasTools tests pass
✅ **Linting clean** - ESLint passed with no warnings

### Test Updates
- Updated `useCanvasTools.test.js` to expect `'pointer'` as default tool
- All other tests unchanged and passing

---

## Migration Notes

### Database Schema Changes
New optional fields added to map documents in Firestore:
```javascript
{
  gridOffsetX: number, // Default: 0
  gridOffsetY: number, // Default: 0
}
```

**Backward Compatibility:** ✅ Fully backward compatible
- Existing maps without offset fields will default to 0
- No migration script needed
- All existing functionality preserved

---

## User-Facing Changes

### For DMs:
1. **Grid Alignment Tool**: Can now type exact grid size and offset values
2. **Smaller Default Tokens**: Less clutter when creating tokens
3. **Better Mobile Support**: Toolbar scrolls smoothly on phones/tablets
4. **Canvas-Based Controls**: Maps and Encounters buttons moved to canvas area

### For Players:
1. **Better Token Movement**: Large tokens snap to grid correctly
2. **Pointer-First Interface**: Can select tokens immediately on session load

---

## Commit Information

**Commit Hash:** `b5bad2c`
**Date:** October 1, 2025
**Files Changed:** 9 files
- **Additions:** 206 lines
- **Deletions:** 78 lines

**Modified Files:**
1. `src/components/VTT/Canvas/GridConfigurator.jsx`
2. `src/components/VTT/Canvas/GridLayer.jsx`
3. `src/components/VTT/Canvas/MapCanvas.jsx`
4. `src/components/VTT/TokenManager/TokenPalette.jsx`
5. `src/components/VTT/TokenManager/TokenSprite.jsx`
6. `src/components/VTT/VTTSession/VTTSession.jsx`
7. `src/components/VTT/VTTSession/VTTSession.css`
8. `src/hooks/vtt/useCanvasTools.js`
9. `src/hooks/vtt/useCanvasTools.test.js`

---

## Future Enhancements

### Potential Follow-ups:
1. **Map Dragging**: Allow DM to drag map image itself to align with grid
2. **Grid Presets**: Save common grid configurations (25px, 50px, 70px)
3. **Auto-Detection**: Attempt to detect grid on uploaded maps
4. **Grid Rotation**: Support for diagonal/rotated grids
5. **Zoom-Aware Grid**: Keep grid visible at all zoom levels

---

## Known Issues
None identified. All features working as expected.

---

## Documentation Updates Needed
- [ ] Update VTT Quick Start Guide with grid alignment instructions
- [ ] Add screenshots of new grid configurator
- [ ] Document grid offset workflow
- [ ] Update default token size documentation

---

## References
- Previous token drag-to-create feature: Commit `480cf4e`
- Active map sync fix: Commit `365e8ed`
- Related documentation: `ACTIVE_MAP_SYNC_FIX.md`
