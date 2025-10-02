# Hook Export Fix

**Date**: January 2025  
**Issue**: ESLint errors - setters not defined  
**Status**: ✅ Resolved

---

## Problem

After integrating the custom hooks, MapCanvas.jsx was using internal setters that weren't exported by the hooks:

### Missing Setters
- `setIsDragging` (from useCanvasViewport)
- `setIsDrawing` (from useDrawingState)
- `setCurrentDrawing` (from useDrawingState)
- `setArrowStart` (from useDrawingState)
- `setShapeStart` (from useDrawingState)
- `setShapePreview` (from useDrawingState)

### ESLint Errors (16 total)
```
Line 384:5:   'setIsDragging' is not defined
Line 416:11:  'setArrowStart' is not defined
Line 421:13:  'setArrowStart' is not defined
Line 464:11:  'setShapeStart' is not defined
Line 491:13:  'setShapeStart' is not defined
Line 492:13:  'setShapePreview' is not defined
Line 517:7:   'setIsDrawing' is not defined
Line 518:7:   'setCurrentDrawing' is not defined
Line 529:7:   'setCurrentDrawing' is not defined
Line 549:9:   'setShapePreview' is not defined
Line 551:9:   'setShapePreview' is not defined
Line 557:9:   'setShapePreview' is not defined
Line 559:9:   'setShapePreview' is not defined
Line 576:7:   'setIsDrawing' is not defined
Line 577:7:   'setCurrentDrawing' is not defined
Line 745:28:  'setIsDragging' is not defined
```

---

## Solution

### 1. Updated useDrawingState.js
**Added to return object:**
```javascript
// Setters for external control
setDrawings,
setShapes,
setIsDrawing,        // ✅ NEW
setCurrentDrawing,   // ✅ NEW
setArrowStart,       // ✅ NEW
setShapeStart,       // ✅ NEW
setShapePreview      // ✅ NEW
```

### 2. Updated useCanvasViewport.js
**Added to return object:**
```javascript
// Direct setters (for external control)
setStagePos,
setStageScale,
setIsDragging  // ✅ NEW
```

### 3. Updated MapCanvas.jsx
**Added to useCanvasViewport destructuring:**
```javascript
const {
  stagePos,
  stageScale,
  isDragging,
  setStagePos,
  setStageScale,
  setIsDragging  // ✅ NEW
} = useCanvasViewport({ minScale: 0.2, maxScale: 5, scaleBy: 1.05 });
```

**Added to useDrawingState destructuring:**
```javascript
const {
  drawings,
  isDrawing,
  currentDrawing,
  arrowStart,
  shapes,
  shapeStart,
  shapePreview,
  startDrawing,
  continueDrawing,
  endDrawing,
  startShape,
  updateShapePreview,
  completeShape,
  clearTemporaryShapes,
  clearAllShapes,
  setDrawings,
  setShapes,
  setIsDrawing,        // ✅ NEW
  setCurrentDrawing,   // ✅ NEW
  setArrowStart,       // ✅ NEW
  setShapeStart,       // ✅ NEW
  setShapePreview      // ✅ NEW
} = useDrawingState();
```

---

## Why These Setters Are Needed

While the hooks provide high-level methods like `startDrawing()`, `endDrawing()`, etc., there are specific scenarios where MapCanvas needs direct control over state:

1. **setIsDragging**: Used in custom drag handlers that override hook defaults
2. **setArrowStart**: Used in click-to-place arrow workflow (2-click placement)
3. **setShapeStart**: Used in click-to-place shape workflow
4. **setShapePreview**: Used for real-time shape preview during drawing
5. **setIsDrawing**: Used to cancel/interrupt drawing operations
6. **setCurrentDrawing**: Used to clear in-progress drawings

These setters provide "escape hatches" for complex interactions that don't fit the standard hook workflows.

---

## Design Decision: Methods vs Setters

### Hooks provide both:

**High-level methods** (preferred):
- `startDrawing(point)` - Begin a drawing operation
- `continueDrawing(point)` - Add point to current drawing
- `endDrawing()` - Complete and save drawing
- `cancelDrawing()` - Cancel without saving

**Low-level setters** (escape hatches):
- `setIsDrawing(bool)` - Direct state control
- `setCurrentDrawing(points)` - Direct drawing data control
- etc.

**Philosophy**: "Make the simple things easy, and the complex things possible."

---

## Verification

### ✅ Build Status
- Zero compilation errors
- Zero ESLint errors
- All 16 errors resolved

### ✅ Files Modified
- `src/hooks/vtt/useDrawingState.js` - Added 5 setters to exports
- `src/hooks/vtt/useCanvasViewport.js` - Added 1 setter to exports
- `src/components/VTT/Canvas/MapCanvas.jsx` - Destructured 6 new setters

### ✅ Hook API Completeness
Both hooks now export:
- State values (read-only)
- High-level methods (recommended API)
- Low-level setters (escape hatches for advanced use)

---

## Summary

Fixed 16 ESLint errors by exporting internal setters from custom hooks. The hooks now provide both:
1. **High-level methods** for common operations (preferred)
2. **Low-level setters** for advanced control (escape hatches)

This maintains clean abstractions while allowing flexibility for complex interactions in MapCanvas.

**Status**: ✅ All errors resolved, hooks fully functional
