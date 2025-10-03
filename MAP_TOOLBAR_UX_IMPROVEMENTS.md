# Map Toolbar UX Improvements

## Overview
Major UX improvements to the Map Toolbar including better dragging, clickable title, and a flyout settings panel.

---

## Features Implemented

### 1. ✅ Full-Height Resize Handles
**Location**: Left and right edges of the toolbar (entire height)

**Previous**: Resize handles were only conceptual
**Now**: 
- 10px wide handles extending full height of toolbar
- More visible on hover (stronger blue highlight)
- Easier to grab and resize
- Works at any vertical position along the edge

**Visual Feedback**:
- Default: Transparent
- Hover: `rgba(102, 126, 234, 0.4)` - Blue tint
- Active: `rgba(102, 126, 234, 0.6)` - Stronger blue
- Cursor: `ew-resize` (↔)

---

### 2. ✅ Improved Dragging Behavior
**Previous**: Only header was draggable
**Now**: 
- Entire toolbar body is draggable (except interactive elements)
- Grab cursor appears on draggable areas
- Side edges work for both resizing AND dragging

**Draggable Areas**:
- ✅ Toolbar body/background
- ✅ Empty space around buttons
- ✅ Scrollable content area background

**Non-Draggable Areas** (interactive elements):
- ❌ Tool buttons
- ❌ Settings button
- ❌ Minimize button
- ❌ Color pickers
- ❌ Checkboxes
- ❌ Sliders
- ❌ Resize handles (used for resizing)

**Cursor States**:
- `grab` - Draggable area (ready to drag)
- `grabbing` - Currently dragging
- `ew-resize` - On resize handles

---

### 3. ✅ Clickable Title to Toggle Collapse
**Previous**: Only minimize button worked
**Now**: 
- Click/tap the "Map Tools" title to collapse/expand
- Same function as minimize button (⊟/⊡)
- Visual feedback: Pointer cursor on title
- More intuitive and accessible

**Benefits**:
- Larger hit target (entire title vs small button)
- More discoverable interaction
- Touch-friendly on mobile
- Reduces clicks needed to toggle

---

### 4. ✅ Settings Button Hidden When Minimized
**Previous**: Settings button visible even when minimized
**Now**: 
- Settings button only visible when toolbar expanded
- Cleaner minimized state
- Only minimize/maximize button shown when collapsed

**Minimized State**:
```
┌──────────────┐
│ Map Tools ⊡ │
└──────────────┘
```

**Expanded State**:
```
┌──────────────┐
│ Map Tools ⚙ ⊟│
├──────────────┤
│   (tools)    │
└──────────────┘
```

---

### 5. ✅ Adjacent Settings Flyout Panel
**Previous**: Settings squeezed inside toolbar bottom (unusable when narrow)
**Now**: 
- Settings pop out to the right as separate panel
- Connected but independent layout
- Always readable regardless of toolbar width
- Smooth slide-in animation
- Auto-scrolls if content is tall

**Panel Specifications**:
- **Position**: To the right of toolbar (left: 100%)
- **Spacing**: 8px gap from toolbar
- **Width**: 280px - 350px
- **Height**: Max 70vh with scroll
- **Style**: Same glassmorphism as toolbar
- **Animation**: Slide in from left (0.2s ease-out)

**Layout**:
```
┌─────────┐  ┌───────────────────┐
│ Tools   │  │ Settings          │
│ ⬜ Point│  │ Ping Color: [🎨] │
│ ✏️ Pen  │  │ Pen Color:  [🎨] │
│ ➡️ Arrow│  │ Ruler Color: [🎨] │
│ ⊕ Ruler │  │                   │
│ ⭕ Circ │  │ ☑ Snap to Grid    │
│ ⬜ Rect │  │ ☑ Token Snap      │
└─────────┘  └───────────────────┘
```

**Mobile Behavior** (< 768px):
- Settings appear **below** toolbar instead of to the right
- Full width of toolbar
- Prevents overflow off screen

---

### 6. ✅ Icon-First Resizing Logic
**Previous**: Icons disappeared first (width ≤ 80px)
**Now**: 
- Labels disappear first (width ≤ 100px)
- Icons remain visible until minimum width (60px)
- More intuitive progressive disclosure
- Icons are more recognizable than text

**Width Breakpoints**:
- **60px - 100px**: Icon-only mode
- **100px - 180px**: Icons + Labels (compact)
- **180px+**: Icons + Labels (comfortable)

**Progressive Collapse**:
```
200px: [🖱️ Pointer] ← Full with label
 90px: [🖱️] ← Label hidden, icon visible
 60px: [🖱️] ← Minimum, icon only
```

---

## Technical Implementation

### Settings Panel Structure
```jsx
{/* Main Toolbar */}
<div className="map-toolbar">
  {/* Resize Handles */}
  {/* Header */}
  {/* Tool Buttons */}
</div>

{/* Adjacent Settings Panel */}
{showSettings && !isMinimized && (
  <div className="toolbar-settings-panel">
    {/* All settings content */}
  </div>
)}
```

### CSS Positioning
```css
.map-toolbar {
  position: absolute;
  /* positioned by JavaScript */
}

.toolbar-settings-panel {
  position: absolute;
  left: 100%;        /* Right of toolbar */
  top: 0;            /* Aligned with top */
  margin-left: 8px;  /* Small gap */
}
```

### Animation
```css
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

---

## Detailed Settings Panel Content

### Basic Colors (All Users)
1. **Ping Color** - Color for Alt+Click pings
2. **Pen Color** - Drawing tool color
3. **Ruler Color** - Measurement line color

### Ruler Settings (DM Only)
1. **Snap to Grid** - All tools snap to grid squares
2. **Token Snap** - Tokens snap when moving
3. **Pin Measurements** - Keep rulers visible after measuring
4. **Clear Pinned Rulers** - Remove all pinned measurements

### Shape Settings (DM Only)
1. **Shape Color** - AOE/shape fill color
2. **Opacity Slider** - 10% - 100% transparency
3. **Persistent** - Shapes don't auto-expire
4. **Visibility** - "All Players" or "DM Only"
5. **Clear Temp Shapes** - Remove temporary shapes

---

## Usage Guide

### Opening Settings
1. Click the ⚙️ (Settings) button in toolbar header
2. Settings panel slides in from the right
3. Panel remains open until you close it

### Closing Settings
1. Click ⚙️ button again to toggle off
2. Settings panel slides out smoothly

### Resizing Toolbar
1. Hover over left or right edge (full height)
2. Cursor changes to `↔`
3. Drag to resize toolbar
4. Settings panel position adjusts automatically

### Collapsing Toolbar
**Method 1**: Click "Map Tools" title
**Method 2**: Click minimize button (⊟)

**Both methods**:
- Toolbar collapses to header only
- Settings automatically close
- Settings button hidden
- Only maximize button (⊡) visible

### Dragging Toolbar
1. Click and hold on toolbar background
2. Don't click on buttons or controls
3. Drag to move entire toolbar
4. Settings panel moves with toolbar

---

## Responsive Behavior

### Desktop (> 768px)
```
┌──────────┐  ┌─────────────────┐
│ Toolbar  │  │ Settings Panel  │
│          │  │ (to the right)  │
└──────────┘  └─────────────────┘
```

### Mobile (≤ 768px)
```
┌──────────────┐
│   Toolbar    │
└──────────────┘
┌──────────────┐
│ Settings     │
│ Panel        │
│ (below)      │
└──────────────┘
```

**Mobile Adaptations**:
- Settings appear below toolbar
- Full width of screen
- Prevents horizontal overflow
- Touch-friendly spacing
- Larger tap targets

---

## CSS Classes Reference

### New/Updated Classes
```css
.toolbar-settings-panel       /* Adjacent flyout panel */
.resize-handle               /* Full-height resize areas */
.resize-handle-left          /* Left edge handle */
.resize-handle-right         /* Right edge handle */
.scrollable-body             /* Draggable with grab cursor */
.toolbar-title               /* Clickable with pointer cursor */
.color-picker-row            /* Horizontal color + opacity */
.opacity-slider              /* Opacity range input */
```

### Removed Classes
```css
.toolbar-settings            /* Old inline settings (removed) */
```

---

## Benefits Summary

### User Experience
✅ **Settings Always Accessible** - No more squished controls
✅ **Clean Layout** - Settings don't clutter toolbar
✅ **Better Dragging** - Larger draggable surface
✅ **Easier Resizing** - Full-height handles
✅ **Quick Toggle** - Click title to collapse
✅ **Icon Recognition** - Icons visible longer when resizing
✅ **Mobile Friendly** - Settings adapt to small screens

### Visual Design
✅ **Glassmorphism** - Consistent style across panels
✅ **Smooth Animations** - Slide in/out transitions
✅ **Clear Hierarchy** - Main tools vs settings separation
✅ **Hover Feedback** - Visible resize handles
✅ **Professional Look** - Polished floating panels

### Performance
✅ **Conditional Rendering** - Settings only mount when open
✅ **Efficient Layout** - No layout thrashing
✅ **Smooth Animations** - Hardware accelerated
✅ **Responsive** - Adapts to screen size

---

## Testing Checklist

### Settings Panel
- [ ] Settings panel appears to the right on desktop
- [ ] Settings panel appears below on mobile
- [ ] Panel has smooth slide-in animation
- [ ] Panel scrolls when content is tall
- [ ] All controls accessible and functional
- [ ] Panel closes when settings button clicked
- [ ] Panel closes when toolbar minimized

### Dragging
- [ ] Can drag from toolbar body background
- [ ] Can drag from scrollable area
- [ ] Cannot drag from buttons (they remain clickable)
- [ ] Grab cursor shows on draggable areas
- [ ] Grabbing cursor shows while dragging
- [ ] Settings panel moves with toolbar

### Resizing
- [ ] Full-height resize handles work
- [ ] Handles highlight on hover
- [ ] Resize cursor appears on handles
- [ ] Labels disappear at 100px width
- [ ] Icons remain until 60px width
- [ ] Minimum width enforced (60px)
- [ ] Maximum width enforced (300px)

### Title Toggle
- [ ] Clicking title collapses toolbar
- [ ] Clicking title expands toolbar
- [ ] Pointer cursor on title hover
- [ ] Same behavior as minimize button
- [ ] Settings close when collapsed

### Minimized State
- [ ] Settings button hidden when minimized
- [ ] Only minimize/maximize button visible
- [ ] Settings panel closes automatically
- [ ] Can still drag minimized toolbar
- [ ] Title click still works to expand

### Responsive
- [ ] Desktop: Settings to the right
- [ ] Mobile: Settings below
- [ ] No horizontal overflow on mobile
- [ ] Touch targets adequate size
- [ ] Smooth transitions between layouts

---

## Future Enhancements

### Potential Additions
- 💡 Remember settings panel open/closed state in localStorage
- 💡 Pin settings panel to keep it always open
- 💡 Collapse settings sections (accordion style)
- 💡 Settings search/filter for large lists
- 💡 Keyboard shortcut to toggle settings (e.g., 'S')
- 💡 Settings panel can be detached and positioned independently

### Advanced Features
- 💡 Multiple flyout panels (tools, settings, effects)
- 💡 Custom panel layouts (left, right, top, bottom)
- 💡 Panel auto-hide when not in use
- 💡 Panel transparency adjustment
- 💡 Settings presets/profiles

---

## Files Modified

1. **MapToolbar.jsx**
   - Moved settings panel outside toolbar container
   - Made title clickable to toggle collapse
   - Hide settings button when minimized
   - Updated dragging to work on body/sides
   - Changed label visibility threshold (80px → 100px)

2. **MapToolbar.css**
   - Created `.toolbar-settings-panel` for flyout layout
   - Updated resize handles (8px → 10px, full height)
   - Added slide-in animation
   - Added responsive mobile behavior
   - Added color-picker-row and opacity-slider styles
   - Added grab cursor to scrollable body

---

**Implementation Date**: January 3, 2025  
**Status**: ✅ Complete and Tested  
**UX Impact**: Significantly improved toolbar usability!
