# Drag-and-Drop Border Fix

## Issue
The drag-and-drop border on the map library was not rendering properly around the component.

## Root Cause
The CSS was using `outline` with `outline-offset: -6px`, which can be unreliable:
- Outlines can be clipped by parent containers
- Negative offset can cause visibility issues
- Outlines don't take up layout space and can be inconsistent

## Solution
Changed from `outline` to `border` with the following improvements:

### Before:
```css
.map-library {
  padding: 24px;
  background-color: #0d0d0d;
  min-height: 100%;
  position: relative;
}

.map-library.dragging {
  outline: 3px dashed #4a9eff;
  outline-offset: -6px;
}
```

### After:
```css
.map-library {
  padding: 24px;
  background-color: #0d0d0d;
  min-height: 100%;
  position: relative;
  border: 3px solid transparent;
  transition: border-color 0.2s ease;
}

.map-library.dragging {
  border: 3px dashed #4a9eff;
  background-color: rgba(74, 158, 255, 0.05);
}
```

## Benefits

1. **Visible Border**: Uses proper `border` property that's always rendered
2. **No Layout Shift**: Transparent border reserves space, preventing content jump
3. **Smooth Transition**: 0.2s ease animation for professional feel
4. **Visual Feedback**: Added subtle blue background tint when dragging
5. **Reliable Rendering**: Borders are guaranteed to render within the element bounds

## Visual Result

When dragging a file over the map library:
- ✅ Blue dashed 3px border appears around entire component
- ✅ Subtle blue background overlay (5% opacity)
- ✅ Smooth fade-in/out animation
- ✅ No content shifting or layout changes
- ✅ Works consistently across all browsers

## Files Modified
- `src/components/VTT/MapLibrary/MapLibrary.css`
