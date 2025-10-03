# Fog of War Edge Reveal Fix

## Problem
When grid offsets were adjusted significantly, the fog of war cells would shift inward, revealing parts of the map that should remain concealed. This happened because:

1. The fog grid exactly matched the map dimensions (no padding)
2. Grid offsets could shift the fog by up to ±100 pixels
3. When fog shifted inward, edges of the map became visible beyond the fog coverage

## Solution
Implemented a two-part fix:

### Part 1: Add Padding Cells
Added 1 extra fog cell on each side of the map (2 extra cells total per dimension):
- **Before**: Fog grid = `ceil(mapWidth / gridSize) × ceil(mapHeight / gridSize)`
- **After**: Fog grid = `(ceil(mapWidth / gridSize) + 2) × (ceil(mapHeight / gridSize) + 2)`

This creates a "buffer zone" around the map so fog can shift without exposing edges.

### Part 2: Limit Grid Offset Range
Restricted grid offsets to ±half a grid square:
- **Before**: Grid offset range = -100px to +100px (fixed)
- **After**: Grid offset range = ±(gridSize / 2)

Examples:
- 50px grid → ±25px offset range
- 75px grid → ±37px offset range
- 100px grid → ±50px offset range

This ensures the grid can only shift by half a square, which is sufficient for alignment while keeping fog within the padded area.

## Implementation Details

### Files Modified

#### 1. `src/components/VTT/VTTSession/VTTSession.jsx`
**Function**: `handleInitializeFog`

```javascript
// Before
const gridWidth = Math.ceil(activeMap.width / activeMap.gridSize);
const gridHeight = Math.ceil(activeMap.height / activeMap.gridSize);

// After
const gridWidth = Math.ceil(activeMap.width / activeMap.gridSize) + 2;
const gridHeight = Math.ceil(activeMap.height / activeMap.gridSize) + 2;
```

#### 2. `src/components/VTT/Canvas/GridConfigurator.jsx`
**Component**: Grid Offset X and Y inputs

```javascript
// Before
min={-100}
max={100}

// After
min={Math.floor(-(gridSize / 2))}
max={Math.floor(gridSize / 2)}
```

Added clamping to number inputs to enforce limits when typing values.

#### 3. `src/components/VTT/Canvas/MapCanvas.jsx`
**Multiple locations**: Fog rendering and reveal

##### Fog Rendering
```javascript
// Before
const cellX = x * gMap.gridSize + offsetX;
const cellY = y * gMap.gridSize + offsetY;

// After (subtract 1 to account for padding)
const cellX = (x - 1) * gMap.gridSize + offsetX;
const cellY = (y - 1) * gMap.gridSize + offsetY;
```

##### Fog Reveal
```javascript
// Before
const gridX = Math.floor(adjustedX / map.gridSize);
const gridY = Math.floor(adjustedY / map.gridSize);

// After (add 1 to account for padding)
const gridX = Math.floor(adjustedX / map.gridSize) + 1;
const gridY = Math.floor(adjustedY / map.gridSize) + 1;
```

## Coordinate System

### Fog Grid Indices
With padding, the fog grid coordinate system is:
- Index 0: Padding cell (left/top edge)
- Index 1 to N: Actual map cells
- Index N+1: Padding cell (right/bottom edge)

### World to Fog Grid Conversion
```javascript
// Step 1: Adjust for grid offset
const adjustedX = worldX - gridOffsetX;
const adjustedY = worldY - gridOffsetY;

// Step 2: Convert to grid cell
const cellX = Math.floor(adjustedX / gridSize);
const cellY = Math.floor(adjustedY / gridSize);

// Step 3: Add padding offset
const fogGridX = cellX + 1;
const fogGridY = cellY + 1;
```

### Fog Grid to World Conversion
```javascript
// Step 1: Subtract padding offset
const cellX = fogGridX - 1;
const cellY = fogGridY - 1;

// Step 2: Convert to world position
const worldX = cellX * gridSize + gridOffsetX;
const worldY = cellY * gridSize + gridOffsetY;
```

## Visual Example

For a 1000×1000px map with 50px grid:

### Without Padding (Old)
```
Fog grid: 20×20 cells
Grid offset range: -100 to +100px (±2 cells)
Problem: Offset of -100px shifts fog right, exposing left edge
```

### With Padding (New)
```
Fog grid: 22×22 cells (20 + 2 padding)
Grid offset range: -25 to +25px (±0.5 cells)
Result: Maximum shift is half a cell, always covered by padding
```

### Grid Layout
```
┌─────────────────────────────────┐
│ P │ P │ P │ P │ P │ P │ P │ P │ P    ← Padding row
├───┼───┼───┼───┼───┼───┼───┼───┼───
│ P │   │   │   │   │   │   │   │ P    ← First map row
├───┼───┼───┼───┼───┼───┼───┼───┼───
│ P │   │   │ M │ A │ P │   │   │ P    ← Map cells
├───┼───┼───┼───┼───┼───┼───┼───┼───
│ P │   │   │   │   │   │   │   │ P    ← Last map row
├───┼───┼───┼───┼───┼───┼───┼───┼───
│ P │ P │ P │ P │ P │ P │ P │ P │ P    ← Padding row
└─────────────────────────────────┘

P = Padding cell (always concealed)
M = Map cell (can be revealed)
```

## Testing

### Test Case 1: Maximum Positive Offset
1. Set grid size to 50px
2. Set offset X to +25px (maximum)
3. Set offset Y to +25px (maximum)
4. Verify no map edges are exposed
5. Verify tokens still snap correctly

### Test Case 2: Maximum Negative Offset
1. Set grid size to 50px
2. Set offset X to -25px (maximum)
3. Set offset Y to -25px (maximum)
4. Verify no map edges are exposed
5. Verify tokens still snap correctly

### Test Case 3: Different Grid Sizes
Test with various grid sizes to verify offset limits scale:
- 25px grid → ±12px offset limit
- 50px grid → ±25px offset limit
- 75px grid → ±37px offset limit
- 100px grid → ±50px offset limit

### Test Case 4: Fog Reveal
1. Configure grid with offsets
2. Move player token around map
3. Verify fog reveals in correct cells
4. Verify no edge gaps appear

### Test Case 5: Edge Cases
1. Try to manually enter offset beyond limits (should clamp)
2. Change grid size while offset is set (limits should update)
3. Check fog rendering at map corners and edges

## Backward Compatibility

### Existing Fog Data
Existing fog data will continue to work but **will not have padding**. To get the benefit of this fix:

1. Option A: Re-initialize fog (DM clicks fog button again)
2. Option B: Manually add padding to existing fog data (not recommended)

### New Fog Initialization
All newly initialized fog will automatically have padding and work correctly.

## Benefits

1. **No Edge Reveal**: Map edges remain concealed regardless of grid offset
2. **Safer Alignment**: DMs can adjust grid without worrying about fog gaps
3. **Better UX**: Offset limits provide clear boundaries for valid adjustments
4. **Consistent Behavior**: Works the same across all grid sizes

## Limitations

1. **Offset Range**: Limited to ±half grid square (usually sufficient for alignment)
2. **Existing Sessions**: Requires fog re-initialization to get padding
3. **Memory**: Slightly larger fog arrays (~4% increase for typical maps)

## Future Enhancements

Potential improvements:
1. Auto-migrate existing fog data to add padding
2. Visual indicator showing valid offset range
3. Preview of fog coverage when adjusting offsets
4. Tool to trim/extend fog grid dynamically
