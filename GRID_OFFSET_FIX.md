# Grid Offset Fix - Making Grid Adjustments the Source of Truth

## Problem
The grid configurator allowed DMs to set custom grid offsets (X and Y) to align with pre-drawn grids on custom maps. However, these offsets were only used for visual grid rendering and were not being respected by:
1. **Token snapping** - Tokens would snap to the default grid (starting at 0,0)
2. **Fog of war** - Fog cells were positioned based on the default grid, not the adjusted grid

This meant that even though the grid visually appeared in the correct position, all game mechanics were still using the original grid alignment.

## Solution
Updated all grid-related calculations throughout the codebase to use `gridOffsetX` and `gridOffsetY` as the true source of truth for grid positioning.

## Files Modified

### 1. `src/components/VTT/Canvas/MapCanvas.jsx`

#### Changes Made:
- **`maybeSnapPoint` function**: Updated to account for grid offsets when snapping points to grid
  - Adjusts point by removing offset
  - Snaps to grid
  - Adds offset back to get final position

- **`handleTokenDragEnd` function**: Updated token position snapping to use grid offsets
  - Adjusts token position by removing offset before calculating grid cell
  - Adds offset back when calculating final snapped position
  - Also updated fog reveal calculation to use offsets

- **Token fog reveal (player tokens)**: Updated automatic fog reveal around player tokens
  - Adjusts token world position by offset before calculating grid cell
  - Ensures fog reveals in correct cells relative to adjusted grid

- **Token fog reveal (light sources)**: Updated automatic fog reveal around light sources
  - Adjusts light position by offset before calculating grid cell
  - Ensures fog reveals in correct cells relative to adjusted grid

- **Ruler snapping**: Updated ruler start and end point snapping
  - Both ruler start and drag end points now account for grid offsets
  - Ensures measurements align with visible grid

- **Fog of War rendering (Players)**: Updated fog rendering to use grid offsets
  - Fog cells now render at correct positions relative to adjusted grid
  - Players see fog aligned with visible grid

- **Fog of War rendering (DM)**: Updated DM fog overlay to use grid offsets
  - DM fog visualization now aligns with adjusted grid
  - DM dimmer pattern (when grid disabled) also uses offsets

- **TokenSprite props**: Added `gridOffsetX` and `gridOffsetY` props to pass offsets to token components

### 2. `src/components/VTT/TokenManager/TokenSprite.jsx`

#### Changes Made:
- **Component props**: Added `gridOffsetX` and `gridOffsetY` parameters (default to 0)

- **`handleDragMove` function**: Updated token drag preview snapping
  - Adjusts token position by removing offset before calculating grid cell
  - Snaps to grid cell and adds offset back for final position
  - Updates preview highlight to show correct grid cells
  - Works for both snap-active and free-move modes

- **`handleDragEnd` function**: Updated final token position snapping
  - Adjusts final position by removing offset before calculating grid cell
  - Snaps to grid and adds offset back for final position
  - Ensures dropped token lands on correct grid cell

## Technical Implementation

### Grid Offset Conversion Formula

When converting from world coordinates to grid cell coordinates:
```javascript
const adjustedX = worldX - gridOffsetX;
const adjustedY = worldY - gridOffsetY;
const cellX = Math.floor(adjustedX / gridSize);
const cellY = Math.floor(adjustedY / gridSize);
```

When converting from grid cell coordinates back to world coordinates:
```javascript
const worldX = cellX * gridSize + gridOffsetX;
const worldY = cellY * gridSize + gridOffsetY;
```

For token snapping (centering token in cell):
```javascript
const worldX = cellX * gridSize + gridOffsetX + gridSize / 2;
const worldY = cellY * gridSize + gridOffsetY + gridSize / 2;
```

### Affected Systems

All the following systems now properly respect grid offsets:

1. **Token Snapping**
   - Drag preview during move
   - Final position on drop
   - Snap-to-grid toggle (with Alt override)

2. **Fog of War**
   - Cell rendering position (both player and DM views)
   - Automatic reveal around player tokens
   - Automatic reveal around light sources
   - Manual fog brush (if implemented)

3. **Ruler Tool**
   - Start point snapping
   - End point snapping during drag
   - Distance measurements

4. **Grid Visualization**
   - Already working (was the only thing using offsets before)

## Testing Checklist

To verify the fix works correctly:

- [ ] **Visual Alignment**
  - Set grid offsets (e.g., offsetX: 25, offsetY: 25)
  - Verify grid lines appear shifted on canvas
  - Verify tokens snap to visible grid intersections
  - Verify fog cells align with visible grid

- [ ] **Token Snapping**
  - Drag a token while snap is enabled
  - Token should snap to visible grid cells
  - Preview highlight should show correct cells
  - Released token should land centered in visible grid cell

- [ ] **Fog of War**
  - Place a player token
  - Verify fog reveals in cells around token's visible position
  - Move a light source
  - Verify fog reveals in cells around light's visible position
  - Check both player view and DM fog overlay align with grid

- [ ] **Ruler Measurements**
  - Enable ruler snap-to-grid
  - Draw a ruler line
  - Verify ruler snaps to visible grid intersections
  - Verify distance measurements are accurate

- [ ] **Different Grid Configurations**
  - Test with positive offsets (+25, +50)
  - Test with negative offsets (-25, -50)
  - Test with different grid sizes (25, 50, 75, 100)
  - Test with various offset combinations

## Impact

This fix ensures that the grid configuration set by the DM is the **single source of truth** for all grid-based mechanics. DMs can now:

1. Upload maps with pre-drawn grids
2. Adjust the VTT grid to perfectly align with the map's grid using offsets
3. Have confidence that all game mechanics (token movement, fog of war, measurements) will work correctly with the adjusted grid

## Notes

- Grid offsets default to `0` if not set, maintaining backward compatibility
- All calculations use `|| 0` fallback to handle undefined offsets
- The fog of war grid cell array itself is unchanged - only the rendering position and world-to-cell conversion formulas are affected
- This change does not affect fog persistence or require fog data migration
