# Fog of War and Lighting Fixes

## Date
October 2, 2025

## Issues Fixed

### 1. Tokens Rendering Above Fog for Players ✅
**Problem**: Player view showed tokens rendered on top of the fog of war layer, making hidden areas visible.

**Root Cause**: There was a duplicate fog layer rendering BEFORE the Token Layer in the stage hierarchy. In Konva, layers render in declaration order - earlier layers paint first (bottom), later layers paint on top.

**Solution**: 
- Removed the duplicate fog layer that was placed between Grid and Tokens (line ~1349)
- Ensured the single player fog layer renders AFTER the Lighting Layer
- Final render order for players:
  1. Background Layer (map image)
  2. Grid Layer
  3. Token Layer
  4. Lighting Layer
  5. **Fog of War Layer (player)** ← Now correctly occludes tokens
  6. Shapes/Drawings Layer

**Files Changed**:
- `src/components/VTT/Canvas/MapCanvas.jsx`

---

### 2. Light Drag Not Showing Grid Snap Preview ✅
**Problem**: When DMs dragged light sources, the visual drag icon did not snap to the grid during the drag operation (only on release).

**Root Cause**: The light Circle's `onDragMove` handler updated the dragging state but didn't:
1. Apply the snap calculation during the drag
2. Update the visual position of the dragged element

**Solution**:
Modified the light Circle's `onDragMove` handler to:
```javascript
onDragMove={(e) => {
  e.cancelBubble = true;
  const rawPos = { x: e.target.x(), y: e.target.y() };
  const snappedPos = maybeSnapPoint(rawPos); // Apply snap calculation
  // Update visual position during drag
  e.target.x(snappedPos.x);
  e.target.y(snappedPos.y);
  setDraggingLight(prev => prev ? {
    ...prev,
    currentPos: snappedPos
  } : null);
}}
```

**Result**: Light sources now visually snap to grid intersections during drag operations, matching the token drag behavior.

**Files Changed**:
- `src/components/VTT/Canvas/MapCanvas.jsx` (line ~1443)

---

### 3. Light Sources Not Revealing Fog When Moved ✅
**Problem**: Moving light sources did not trigger fog-of-war reveals. Fog only updated on initial placement.

**Root Cause**: The fog reveal `useEffect` for lights had a dependency on `lights.length`, which only changes when lights are added/removed, NOT when they move:
```javascript
// OLD - only triggers on count change
}, [... lights.length, ...]);
```

**Solution**:
Changed the dependency to track actual light positions by serializing position data:
```javascript
// NEW - triggers whenever any light moves
}, [... JSON.stringify(lights.map(l => ({ 
  x: l.position?.x, 
  y: l.position?.y, 
  r: l.radius 
}))), ...]);
```

**Result**: Fog now automatically reveals around light sources whenever they are moved, creating dynamic fog updates as the DM repositions lights during gameplay.

**Files Changed**:
- `src/components/VTT/Canvas/MapCanvas.jsx` (line ~527)

---

## Testing Checklist

### Player View
- [ ] Tokens are hidden behind unexplored fog (black squares)
- [ ] Moving tokens with light sources reveals fog dynamically
- [ ] Fog layer visibility toggle works correctly
- [ ] No visual artifacts or nested layer errors

### DM View
- [ ] DM fog overlay shows semi-transparent (opacity 0.35) with red stroke
- [ ] Can drag light sources and see grid snap during drag
- [ ] Moving lights reveals fog in real-time
- [ ] Light radius indicators show correctly during drag
- [ ] Fog layer toggle still works for DM

### Light Source Behavior
- [ ] Placing new light sources reveals fog immediately
- [ ] Dragging light sources reveals fog along the path
- [ ] Light snap to grid is visible during drag operation
- [ ] Light deletion removes fog reveal (fog returns after a moment)

---

## Technical Notes

### Konva Layer Rendering Order
Konva renders `<Layer>` components in the order they're declared as children of `<Stage>`. Later layers paint on top:

```jsx
<Stage>
  <Layer>Background</Layer>     // Bottom (painted first)
  <Layer>Tokens</Layer>          // Middle
  <Layer>Fog</Layer>             // Top (painted last, occludes tokens)
</Stage>
```

### React useEffect Dependencies
When tracking object/array changes in `useEffect`, comparing by reference (`.length` or object identity) misses property changes. Use `JSON.stringify()` for deep comparison when tracking position/property updates.

### Grid Snapping During Drag
Konva drag events provide `e.target.x()` and `e.target.y()` getters/setters. To snap during drag:
1. Read current position: `e.target.x()`
2. Calculate snap: `maybeSnapPoint({ x, y })`
3. Apply to visual: `e.target.x(snappedX)` and `e.target.y(snappedY)`

---

## Performance Considerations

The fog reveal `useEffect` now triggers on every light position change. This is acceptable because:
1. Lights move infrequently (DM-only drag operations)
2. The reveal operation is debounced by Firestore write batching
3. Fog data is already subscribed and optimized
4. Alternative (polling) would be more expensive

If performance issues arise with many lights, consider:
- Debouncing the reveal effect with a 100-200ms delay
- Batching multiple light reveals into a single Firestore write
- Only revealing fog when `isDragging` state becomes false (drag end)

---

## Related Files

- `src/components/VTT/Canvas/MapCanvas.jsx` - Main canvas with layer ordering
- `src/services/vtt/fogOfWarService.js` - Fog reveal logic
- `src/hooks/vtt/useLighting.js` - Light CRUD operations
- `src/components/VTT/Canvas/LightingLayer.jsx` - Dynamic lighting renderer

---

## Commit Message Suggestion

```
fix(vtt): resolve fog rendering, light snap, and fog reveal issues

- Fix player fog layer rendering above tokens by removing duplicate layer
- Add grid snap visual feedback during light source dragging
- Update fog reveal dependency to track light positions not just count
- Ensures fog updates dynamically when lights are moved by DM

Fixes #[issue-number]
```
