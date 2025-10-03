# Lighting Panel - Draggable Feature Implementation

## Summary
Made the Lighting System panel draggable so users (DMs) can reposition it anywhere on the screen for better workflow flexibility.

**Status**: ✅ COMPLETE  
**Time**: ~10 minutes  
**Files Modified**: 2 files

---

## Feature Implementation

### Changes Made

#### 1. **LightingPanel.jsx** - Added Drag State & Handlers

**Drag State** (lines ~22-24):
```jsx
// Dragging state
const [position, setPosition] = useState({ x: null, y: null });
const [isDragging, setIsDragging] = useState(false);
const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
```

**Drag Handlers** (lines ~91-140):
```jsx
// Drag handlers
const handleMouseDown = (e) => {
  // Only start drag if clicking on header (not buttons)
  if (e.target.closest('button')) return;
  
  setIsDragging(true);
  const panel = e.currentTarget.parentElement;
  const rect = panel.getBoundingClientRect();
  setDragOffset({
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  });
};

const handleMouseMove = (e) => {
  if (!isDragging) return;
  
  const newX = e.clientX - dragOffset.x;
  const newY = e.clientY - dragOffset.y;
  
  // Keep panel within viewport bounds
  const maxX = window.innerWidth - 320; // panel width
  const maxY = window.innerHeight - 100; // leave some space at bottom
  
  setPosition({
    x: Math.max(0, Math.min(newX, maxX)),
    y: Math.max(0, Math.min(newY, maxY))
  });
};

const handleMouseUp = () => {
  setIsDragging(false);
};

// Add/remove mouse event listeners for dragging
React.useEffect(() => {
  if (isDragging) {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }
}, [isDragging, dragOffset]);
```

**Updated JSX** (lines ~157-172):
```jsx
return (
  <div 
    className="lighting-panel"
    style={{
      left: position.x !== null ? `${position.x}px` : undefined,
      top: position.y !== null ? `${position.y}px` : undefined,
      right: position.x !== null ? 'auto' : undefined,
      cursor: isDragging ? 'grabbing' : undefined
    }}
  >
    <div 
      className="lighting-panel-header"
      onMouseDown={handleMouseDown}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
```

#### 2. **LightingPanel.css** - Enhanced Visual Feedback

**Panel Styles**:
```css
.lighting-panel {
  /* ... existing styles ... */
  user-select: none; /* Prevent text selection while dragging */
  transition: box-shadow 0.2s ease; /* Smooth shadow transition */
}

.lighting-panel:active {
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.6); /* Enhanced shadow when dragging */
}
```

**Header Styles**:
```css
.lighting-panel-header {
  /* ... existing styles ... */
  cursor: grab;
  user-select: none;
}

.lighting-panel-header:active {
  cursor: grabbing;
}
```

---

## How It Works

### User Experience

1. **Initial Position**: Panel appears at default location (right: 20px, top: 80px)
2. **Grab Cursor**: Hovering over header shows grab cursor (✋)
3. **Click & Drag**: Click on header (not buttons) and drag to move
4. **Grabbing Cursor**: While dragging, cursor changes to grabbing (✊)
5. **Boundary Protection**: Panel stays within viewport bounds
6. **Smooth Movement**: Position updates in real-time
7. **Visual Feedback**: Shadow intensifies while dragging
8. **Button Protection**: Clicking buttons doesn't trigger drag

### Technical Details

**State Management**:
- `position`: Stores custom position (null = default CSS position)
- `isDragging`: Boolean flag for drag state
- `dragOffset`: Tracks mouse offset within panel for smooth dragging

**Event Flow**:
1. `onMouseDown` → Capture initial position, set isDragging=true
2. Document `mousemove` → Update position while dragging
3. Document `mouseup` → End drag, set isDragging=false
4. `useEffect` cleanup → Remove listeners when done

**Boundary Constraints**:
- Left edge: `x >= 0`
- Right edge: `x <= window.innerWidth - 320`
- Top edge: `y >= 0`
- Bottom edge: `y <= window.innerHeight - 100`

**Button Safety**:
```jsx
if (e.target.closest('button')) return;
```
Prevents drag from starting when clicking close button or other controls.

---

## Features

✅ **Draggable Header**: Grab anywhere on purple gradient header  
✅ **Button Protection**: Close button and other controls still work  
✅ **Boundary Constraints**: Panel stays within viewport  
✅ **Visual Feedback**: Cursor changes + shadow enhancement  
✅ **Smooth Movement**: Real-time position updates  
✅ **Default Position**: Starts at standard location if not moved  
✅ **Text Selection Disabled**: Clean dragging without text highlights  
✅ **Event Cleanup**: Proper listener removal to prevent memory leaks

---

## Testing Checklist

### Basic Dragging
- [ ] Open Lighting Panel
- [ ] Hover over header → verify grab cursor (✋)
- [ ] Click and drag header → panel moves
- [ ] Release mouse → panel stays in new position
- [ ] Verify grabbing cursor (✊) while dragging

### Button Safety
- [ ] Click close button → panel closes (no drag)
- [ ] Click toggle buttons → they work (no drag)
- [ ] Click Add Light → works (no drag)
- [ ] Only header area triggers drag

### Boundary Testing
- [ ] Drag to far left → stops at left edge
- [ ] Drag to far right → stops at right edge
- [ ] Drag to top → stops at top edge
- [ ] Drag to bottom → stops with space remaining
- [ ] Panel never goes off-screen

### Visual Feedback
- [ ] Shadow intensifies while dragging
- [ ] Cursor changes to grabbing while dragging
- [ ] Smooth movement without jitter
- [ ] Text doesn't get selected during drag

### Edge Cases
- [ ] Drag quickly → panel keeps up
- [ ] Drag outside viewport → panel stays within bounds
- [ ] Resize window → panel repositions if needed
- [ ] Open/close/reopen → remembers position within session

---

## Future Enhancements (Optional)

### Position Persistence
Store panel position in localStorage:
```jsx
// Save position on change
React.useEffect(() => {
  if (position.x !== null) {
    localStorage.setItem('lightingPanelPosition', JSON.stringify(position));
  }
}, [position]);

// Load position on mount
React.useEffect(() => {
  const saved = localStorage.getItem('lightingPanelPosition');
  if (saved) {
    setPosition(JSON.parse(saved));
  }
}, []);
```

### Double-Click Reset
Reset to default position on header double-click:
```jsx
const handleDoubleClick = () => {
  setPosition({ x: null, y: null });
};

<div 
  className="lighting-panel-header"
  onMouseDown={handleMouseDown}
  onDoubleClick={handleDoubleClick}
>
```

### Touch Support
Add mobile/tablet support:
```jsx
const handleTouchStart = (e) => {
  if (e.target.closest('button')) return;
  const touch = e.touches[0];
  // ... similar to handleMouseDown
};

const handleTouchMove = (e) => {
  const touch = e.touches[0];
  // ... similar to handleMouseMove
};
```

---

## Impact

**User Experience**: ✅ Significantly Improved
- Panel no longer blocks important map areas
- Users can position for optimal workflow
- Multi-monitor support improved

**Code Quality**: ✅ Clean Implementation
- Proper event cleanup
- Boundary protection
- Button safety

**Performance**: ✅ Excellent
- Minimal re-renders (only on drag)
- Event listeners added/removed efficiently
- No memory leaks

**Maintainability**: ✅ Easy to Extend
- Clear state management
- Well-commented logic
- Easy to add persistence or touch support

---

*Implemented: 2025-01-10*  
*Feature: Draggable Lighting Panel*  
*Status: ✅ COMPLETE - Ready for Testing*
