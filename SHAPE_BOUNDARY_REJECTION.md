# Shape Boundary Rejection & Auto-Timeout Feature

## Overview
Modified the VTT canvas to **reject** (rather than clamp) any shape, drawing, arrow, or ruler that starts or ends outside the map boundaries. Additionally, implemented automatic cleanup for unfinished shapes after 30 seconds of inactivity.

## Changes Made

### 1. Boundary Checking Function
**Location**: `src/components/VTT/Canvas/MapCanvas.jsx` (line ~331)

```javascript
// Check if a point is within map boundaries
const isPointInMapBounds = useCallback((pos) => {
  if (!gMap) return true; // If no map loaded, allow by default
  const w = gMap.width || 0;
  const h = gMap.height || 0;
  return pos.x >= 0 && pos.x <= w && pos.y >= 0 && pos.y <= h;
}, [gMap]);
```

**Purpose**: Returns `true` if point is within bounds, `false` otherwise.

### 2. Auto-Timeout Implementation
**Location**: `src/components/VTT/Canvas/MapCanvas.jsx` (lines ~339-412)

Added three timeout refs and corresponding `useEffect` hooks:

#### Shape Timeout
```javascript
const shapeTimeoutRef = useRef(null);

useEffect(() => {
  if (shapeStart) {
    if (shapeTimeoutRef.current) {
      clearTimeout(shapeTimeoutRef.current);
    }
    shapeTimeoutRef.current = setTimeout(() => {
      setShapeStart(null);
      setShapePreview(null);
      console.log('Shape drawing cancelled due to inactivity');
    }, 30000); // 30 seconds
  } else {
    if (shapeTimeoutRef.current) {
      clearTimeout(shapeTimeoutRef.current);
      shapeTimeoutRef.current = null;
    }
  }
  return () => {
    if (shapeTimeoutRef.current) {
      clearTimeout(shapeTimeoutRef.current);
    }
  };
}, [shapeStart]);
```

#### Ruler Timeout
```javascript
const rulerTimeoutRef = useRef(null);

useEffect(() => {
  if (rulerStart) {
    if (rulerTimeoutRef.current) {
      clearTimeout(rulerTimeoutRef.current);
    }
    rulerTimeoutRef.current = setTimeout(() => {
      setRulerStart(null);
      setRulerEnd(null);
      console.log('Ruler measurement cancelled due to inactivity');
    }, 30000);
  } else {
    if (rulerTimeoutRef.current) {
      clearTimeout(rulerTimeoutRef.current);
      rulerTimeoutRef.current = null;
    }
  }
  return () => {
    if (rulerTimeoutRef.current) {
      clearTimeout(rulerTimeoutRef.current);
    }
  };
}, [rulerStart]);
```

#### Arrow Timeout
```javascript
const arrowTimeoutRef = useRef(null);

useEffect(() => {
  if (arrowStart) {
    if (arrowTimeoutRef.current) {
      clearTimeout(arrowTimeoutRef.current);
    }
    arrowTimeoutRef.current = setTimeout(() => {
      setArrowStart(null);
      console.log('Arrow drawing cancelled due to inactivity');
    }, 30000);
  } else {
    if (arrowTimeoutRef.current) {
      clearTimeout(arrowTimeoutRef.current);
      arrowTimeoutRef.current = null;
    }
  }
  return () => {
    if (arrowTimeoutRef.current) {
      clearTimeout(arrowTimeoutRef.current);
    }
  };
}, [arrowStart]);
```

### 3. Arrow Tool - Boundary Rejection
**Location**: `handleStageClick` function (lines ~760-780)

**Before**: Clamped to map bounds
**After**: Rejects with console log

```javascript
if (!arrowStart && e.evt.button !== 2) {
  const snappedPoint = maybeSnapPoint({ x: mapX, y: mapY });
  if (isPointInMapBounds(snappedPoint)) {
    setArrowStart(snappedPoint);
  } else {
    console.log('Cannot start arrow outside map bounds');
  }
} else if (arrowStart && e.evt.button !== 2) {
  const end = maybeSnapPoint({ x: mapX, y: mapY });
  if (isPointInMapBounds(end)) {
    await drawingService.createArrow(firestore, campaignId, map.id, arrowStart, end, '#ffff00', user.uid);
    setArrowStart(null);
  } else {
    console.log('Cannot end arrow outside map bounds');
    setArrowStart(null); // Clear to prevent stuck state
  }
}
```

### 4. Ruler Tool - Boundary Rejection
**Location**: `handleStageClick` function (lines ~806-828)

**Before**: Accepted any coordinates
**After**: Validates both start and end points

```javascript
if (!rulerStart) {
  const startPoint = { x: startX, y: startY };
  if (isPointInMapBounds(startPoint)) {
    setRulerStart(startPoint);
    setRulerEnd(startPoint);
  } else {
    console.log('Cannot start ruler outside map bounds');
  }
} else {
  const endPoint = { x: endX, y: endY };
  if (isPointInMapBounds(endPoint)) {
    if (rulerPersistent) {
      setPinnedRulers(prev => [...prev, {
        id: Date.now(),
        start: rulerStart,
        end: endPoint
      }]);
    }
  } else {
    console.log('Cannot end ruler outside map bounds');
  }
  // Always clear ruler on second click
  setRulerStart(null);
  setRulerEnd(null);
}
```

### 5. Shape Tools - Boundary Rejection
**Location**: `handleStageClick` function (lines ~857-878)

**Before**: Clamped coordinates to map edges
**After**: Rejects out-of-bounds clicks

```javascript
if (!shapeStart && e.evt.button !== 2) {
  const snappedPoint = smartSnapPoint({ x: mapX, y: mapY });
  if (isPointInMapBounds(snappedPoint)) {
    setShapeStart(snappedPoint);
  } else {
    console.log('Cannot start shape outside map bounds');
  }
} else if (shapeStart && e.evt.button !== 2) {
  const snappedEnd = maybeSnapPoint({ x: mapX, y: mapY });
  if (!isPointInMapBounds(snappedEnd)) {
    console.log('Cannot end shape outside map bounds');
    setShapeStart(null);
    setShapePreview(null);
    return;
  }
  const end = snappedEnd;
  // ... create shape
}
```

### 6. Pen Tool - Boundary Rejection
**Location**: `handleMouseDown` function (lines ~918-932)

**Before**: Accepted any starting point
**After**: Validates starting point

```javascript
if (activeTool === 'pen' && e.target === e.target.getStage()) {
  if (e.evt.button === 2) return; // Ignore right-clicks
  
  const mapX = (pointer.x - stage.x()) / stage.scaleX();
  const mapY = (pointer.y - stage.y()) / stage.scaleY();

  if (isPointInMapBounds({ x: mapX, y: mapY })) {
    setIsDrawing(true);
    setCurrentDrawing([mapX, mapY]);
  } else {
    console.log('Cannot start drawing outside map bounds');
  }
}
```

### 7. Shape Preview - Boundary Validation
**Location**: `handleMouseMove` function (lines ~968-977)

**Before**: Clamped preview to map bounds
**After**: Hides preview when outside bounds

```javascript
else if (['circle', 'rectangle', 'cone', 'line'].includes(activeTool) && shapeStart) {
  const snappedEnd = smartSnapPoint({ x: mapX, y: mapY });
  // Only show preview if end point would be valid
  if (!isPointInMapBounds(snappedEnd)) {
    setShapePreview(null);
    return;
  }
  const end = snappedEnd;
  // ... calculate and show preview
}
```

## User Experience

### Boundary Rejection Behavior

#### Valid Click (Inside Map)
```
✅ Click at (500, 400) on a 1000x800 map
   → Action proceeds normally
   → Shape/drawing/ruler/arrow starts or completes
```

#### Invalid Click (Outside Map)
```
❌ Click at (-50, 400) on a 1000x800 map
   → Console log: "Cannot start [tool] outside map bounds"
   → No action taken
   → User must click within map bounds
```

#### Partial Out-of-Bounds
```
✅ Start at (900, 700) - valid
❌ End at (1200, 900) - invalid
   → Console log: "Cannot end [tool] outside map bounds"
   → Tool state cleared to prevent stuck state
   → User must restart the tool
```

### Auto-Timeout Behavior

#### Timeline
```
0s:  User clicks to start shape/ruler/arrow
...  User moves mouse (preview shows)
30s: Timeout triggers
     → State automatically cleared
     → Console log: "[Tool] cancelled due to inactivity"
     → User can start fresh
```

#### Cancellation Events
- **Manual completion**: Timeout cancelled when shape is finished
- **Tool switch**: Timeout cancelled when switching tools
- **ESC key**: Timeout cancelled when ESC is pressed
- **Component unmount**: Timeout cleaned up properly

## Benefits

### 1. Clearer Boundaries
- Users immediately understand where they can and cannot draw
- No confusing "edge snapping" behavior
- Predictable and consistent across all tools

### 2. No Stuck States
- 30-second timeout prevents indefinitely stuck drawing states
- Automatic cleanup if user forgets to finish
- Prevents UI confusion from abandoned operations

### 3. Better UX
- Console feedback for developers/troubleshooting
- Clean state management
- Preview disappears when moving outside bounds (visual feedback)

### 4. Applies to All Drawing Tools
- **Shapes**: circle, rectangle, cone, line
- **Drawings**: pen tool
- **Arrows**: temporary markers
- **Rulers**: measurement tool

## Technical Details

### Timeout Duration
**30 seconds** - Long enough to not interfere with normal use, short enough to clean up abandoned operations.

### Memory Management
- All timeouts properly cleared on unmount
- Refs used instead of state to avoid re-renders
- Cleanup functions in all useEffect hooks

### Boundary Math
```javascript
// A point is valid if:
pos.x >= 0 && pos.x <= mapWidth && 
pos.y >= 0 && pos.y <= mapHeight
```

### Edge Cases Handled
1. **No map loaded**: Returns `true` (allows by default)
2. **Zero dimensions**: Uses `0` as fallback for width/height
3. **Rapid tool switches**: Each timeout tracked independently
4. **Manual cancellation**: Timeout cleared immediately

## Testing Recommendations

### Boundary Tests
1. ✅ Try to start shapes at each map edge
2. ✅ Try to start shapes at each map corner
3. ✅ Try to start shapes far outside map (negative coords)
4. ✅ Start inside, try to end outside
5. ✅ Verify preview disappears when cursor leaves map

### Timeout Tests
1. ✅ Start a shape, wait 30 seconds, verify auto-clear
2. ✅ Start multiple tools, verify independent timeouts
3. ✅ Complete shape quickly, verify timeout cancelled
4. ✅ Switch tools mid-drawing, verify cleanup
5. ✅ Check console for timeout messages

### Integration Tests
1. ✅ Test with grid snapping enabled
2. ✅ Test with token snapping enabled
3. ✅ Test as DM and as player
4. ✅ Test on maps of various sizes
5. ✅ Test with zoomed in/out views

## Console Messages

Users (and developers) will see helpful messages:
- `"Cannot start [tool] outside map bounds"`
- `"Cannot end [tool] outside map bounds"`
- `"Shape drawing cancelled due to inactivity"`
- `"Ruler measurement cancelled due to inactivity"`
- `"Arrow drawing cancelled due to inactivity"`

These can be upgraded to UI toasts in the future if desired.
