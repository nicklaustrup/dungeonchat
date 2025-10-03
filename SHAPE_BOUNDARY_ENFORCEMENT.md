# Shape Boundary Enforcement (DEPRECATED - See SHAPE_BOUNDARY_REJECTION.md)

## ⚠️ THIS APPROACH HAS BEEN REPLACED

This document describes the initial "clamping" approach which has been superseded by a "rejection" approach.
**Please see SHAPE_BOUNDARY_REJECTION.md for the current implementation.**

## Original Feature Overview (Deprecated)
Added boundary enforcement to prevent both DMs and players from creating shapes outside the map boundaries. This ensures all shapes remain visible and within the playable area of the map.

**Note**: This approach clamped coordinates to map edges. The new approach rejects out-of-bounds clicks entirely.

## Implementation Details

### New Helper Function: `clampToMapBounds`
**Location**: `src/components/VTT/Canvas/MapCanvas.jsx` (around line 331)

```javascript
// Clamp a point to stay within map boundaries (for shapes)
const clampToMapBounds = useCallback((pos) => {
  if (!gMap) return pos;
  const w = gMap.width || 0;
  const h = gMap.height || 0;
  return {
    x: Math.min(Math.max(pos.x, 0), w),
    y: Math.min(Math.max(pos.y, 0), h)
  };
}, [gMap]);
```

**Purpose**: Constrains any point to be within the map's boundaries (0 to width, 0 to height).

### Changes Applied

#### 1. Shape Start Point Clamping
**Location**: `handleStageClick` function in shape tool handling

**Before**:
```javascript
if (!shapeStart && e.evt.button !== 2) {
  setShapeStart(smartSnapPoint({ x: mapX, y: mapY }));
```

**After**:
```javascript
if (!shapeStart && e.evt.button !== 2) {
  const snappedPoint = smartSnapPoint({ x: mapX, y: mapY });
  const clampedPoint = clampToMapBounds(snappedPoint);
  setShapeStart(clampedPoint);
```

#### 2. Shape End Point Clamping (Creation)
**Location**: `handleStageClick` function when completing a shape

**Before**:
```javascript
} else if (shapeStart && e.evt.button !== 2) {
  const end = maybeSnapPoint({ x: mapX, y: mapY });
  try {
```

**After**:
```javascript
} else if (shapeStart && e.evt.button !== 2) {
  const snappedEnd = maybeSnapPoint({ x: mapX, y: mapY });
  const end = clampToMapBounds(snappedEnd);
  try {
```

#### 3. Shape Preview Clamping (Mouse Movement)
**Location**: `handleMouseMove` function during shape drawing

**Before**:
```javascript
} else if (['circle', 'rectangle', 'cone', 'line'].includes(activeTool) && shapeStart) {
  const end = smartSnapPoint({ x: mapX, y: mapY });
  let preview = null;
```

**After**:
```javascript
} else if (['circle', 'rectangle', 'cone', 'line'].includes(activeTool) && shapeStart) {
  const snappedEnd = smartSnapPoint({ x: mapX, y: mapY });
  const end = clampToMapBounds(snappedEnd);
  let preview = null;
```

## Affected Shape Types
This enforcement applies to all shape types:
- **Circle**: Center point and radius are constrained
- **Rectangle**: Start point and dimensions are constrained
- **Cone**: Origin point and direction are constrained
- **Line**: Both start and end points are constrained

## User Experience

### For DMs
- When attempting to draw a shape starting outside the map, the start point automatically snaps to the nearest map edge
- When dragging to complete a shape beyond the map edge, the end point is automatically clamped to the boundary
- The shape preview during drawing shows the constrained result in real-time

### For Players
- Same behavior as DMs - all users have consistent boundary enforcement
- This prevents accidental shapes off-screen that might cause confusion

## Technical Benefits
1. **Consistency**: Uses the same pattern as the existing `clampTokenCenter` function for tokens
2. **Safety**: Includes null checks for `gMap` to handle edge cases
3. **Performance**: Implemented as a memoized callback using `useCallback` with proper dependencies
4. **Integration**: Works seamlessly with existing snap-to-grid and snap-to-token features

## Testing Recommendations
1. **Basic Boundaries**: Try to create shapes with start/end points off the map edges
2. **Corner Cases**: Test shapes starting or ending in map corners
3. **All Shape Types**: Verify each shape type (circle, rectangle, cone, line) respects boundaries
4. **Grid Snapping**: Ensure boundary clamping works correctly with grid snapping enabled
5. **Player Mode**: Test as both DM and player to confirm consistent behavior

## Related Code
- **Token Boundaries**: Similar clamping logic exists for tokens in `clampTokenCenter`
- **Map Dimensions**: Uses `gMap.width` and `gMap.height` from the map data
- **Shape Service**: No changes needed - clamping occurs before calling shape creation methods
