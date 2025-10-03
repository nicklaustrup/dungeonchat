# Shape Boundary Enforcement - Quick Visual Guide (DEPRECATED)

## ⚠️ THIS DOCUMENT IS OUTDATED

This document describes the "clamping" approach which has been replaced.
**Please see SHAPE_BOUNDARY_REJECTION.md for the current implementation.**

The current implementation **rejects** out-of-bounds clicks rather than clamping them to edges.

---

## 🎯 What This Does (Original Clamping Approach - Deprecated)

Previously, users could start or end shapes anywhere, even off the visible map:
```
❌ BEFORE:
┌─────────────────┐
│     MAP         │  ← Shape start or end could be here (off map)
│                 │
│    🔴───────────●─── (Shape extends beyond map edge)
│                 │
└─────────────────┘
```

Now, shape coordinates are automatically constrained to the map boundaries:
```
✅ AFTER:
┌─────────────────┐
│     MAP         │
│                 │
│    🔴──────────●│  ← End point clamped to map edge
│                 │
└─────────────────┘
```

## 📍 Where Clamping Happens

### 1. Shape Start (First Click)
```javascript
// User clicks at (-50, 100) which is off the map
const clickPoint = { x: -50, y: 100 };

// After smartSnapPoint (grid/token snapping)
const snappedPoint = { x: -50, y: 100 };

// After clampToMapBounds
const clampedPoint = { x: 0, y: 100 }; // ✅ Clamped to left edge
```

### 2. Shape End (Second Click)
```javascript
// User clicks at (1200, 800) but map is only 1000x700
const clickPoint = { x: 1200, y: 800 };

// After maybeSnapPoint (grid snapping)
const snappedPoint = { x: 1200, y: 800 };

// After clampToMapBounds
const clampedPoint = { x: 1000, y: 700 }; // ✅ Clamped to bottom-right corner
```

### 3. Shape Preview (Mouse Movement)
```javascript
// As mouse moves off the map during drawing
const mousePos = { x: -100, y: 500 };

// After smartSnapPoint
const snappedPos = { x: -100, y: 500 };

// After clampToMapBounds
const previewPos = { x: 0, y: 500 }; // ✅ Preview sticks to left edge
```

## 🎨 Shape-Specific Behavior

### Circle
- **Center point** is clamped to map bounds
- Radius extends from the clamped center
- Circle may partially extend off-map if radius is large

### Rectangle
- **Top-left corner** is clamped to map bounds
- Width and height calculated from start to clamped end
- Rectangle dimensions automatically adjust to fit

### Cone (Triangle)
- **Origin point** is clamped to map bounds
- Direction and length calculated from clamped points
- Cone shape automatically adjusts

### Line
- **Both endpoints** are independently clamped
- Line is drawn between the two clamped points

## 🔧 Implementation Flow

```
User Click/Move
      ↓
   mapX, mapY (raw coordinates)
      ↓
smartSnapPoint / maybeSnapPoint
   (grid/token snapping)
      ↓
  clampToMapBounds
   (boundary enforcement)
      ↓
Final coordinates used for shape
```

## 🎮 User Experience Examples

### Example 1: Starting Off-Map (Left Edge)
```
User clicks at x=-50
   ↓
Clamped to x=0
   ↓
Shape starts at left edge of map
```

### Example 2: Ending Off-Map (Right Edge)
```
Map width: 1000px
User drags to x=1200
   ↓
Clamped to x=1000
   ↓
Shape ends at right edge of map
```

### Example 3: Diagonal Off-Map (Corner)
```
Map: 1000x800
User clicks at x=1500, y=1000
   ↓
Clamped to x=1000, y=800
   ↓
Shape point at bottom-right corner
```

## ✨ Benefits

1. **No Off-Screen Shapes**: All shapes remain visible on the map
2. **Consistent Behavior**: Works the same for DM and players
3. **Intuitive**: Users don't need to think about boundaries
4. **Real-time Feedback**: Preview shows clamped position during drawing
5. **Grid Compatible**: Works seamlessly with grid snapping

## 🛠️ Code Location

**File**: `src/components/VTT/Canvas/MapCanvas.jsx`

**Key Function**:
```javascript
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

**Applied At**:
- Line ~760: Shape start point
- Line ~764: Shape end point (creation)
- Line ~856: Shape preview (mouse movement)
