# Sidebar Improvements and Map Library Button

## Summary of Changes

This document outlines the improvements made to the VTT sidebar and the addition of the Map Library button.

## Issues Fixed

### 1. Missing Map Library Button
**Problem**: The DM couldn't access the Map Library from the canvas to select/change maps without going through the Maps panel in the sidebar.

**Solution**: 
- Added a "Library" button to the canvas controls (next to Layers)
- Button shows active state (purple) when Map Library panel is open
- Icon: 🗺️ with "Library" text
- Position: Second button in the canvas-controls-top row

### 2. Sidebar Always Visible
**Problem**: The sidebar was always visible by default, taking up screen space even when not needed.

**Solution**:
- Changed default state to `isSidebarOpen = false`
- Sidebar now only appears when a panel button is clicked
- Clicking the same panel button again closes the sidebar
- Better use of screen real estate for the canvas

### 3. Sidebar Not Resizable
**Problem**: The sidebar had a fixed width (420px) which wasn't optimal for all content or screen sizes.

**Solution**:
- Added resize handle on the right edge of the sidebar
- Users can drag the handle to adjust width between 300px - 800px
- Visual feedback: handle highlights on hover (purple/violet)
- Width persists while sidebar is open
- Smooth resize with `ew-resize` cursor

### 4. No Way to Close Sidebar
**Problem**: Users had to click the panel button again to close the sidebar, which wasn't intuitive.

**Solution**:
- Added a close button (×) in the top-right corner of the sidebar header
- Button has hover effects and clear visual feedback
- Clicking close button hides sidebar and clears active panel
- Consistent with other panel close patterns in the app

## New Features

### Sidebar Header
- Added a header bar with gradient background matching the toolbar
- Displays the current panel name with emoji icon:
  - 💬 Chat
  - 📖 Rules
  - 👥 Party
  - 🎲 Initiative
  - 🗺️ Maps
  - ⚔️ Encounters
- Close button positioned in top-right corner

### Resize Functionality
- Drag handle on right edge of sidebar
- Min width: 300px
- Max width: 800px
- Default width: 420px
- Responsive: Adjusts to 320px on smaller screens (< 1200px)

## Files Modified

### 1. `src/components/VTT/VTTSession/VTTSession.jsx`
**State Changes**:
- Changed `isSidebarOpen` default from `true` to `false`
- Added `sidebarWidth` state (default: 420)
- Added `isResizingSidebar` state for drag tracking
- Added `sidebarResizeStartRef` ref for resize calculations

**New Functions**:
- `handleSidebarResizeStart()` - Initiates resize on mousedown
- Added resize event handlers in useEffect

**Logic Changes**:
- Updated `togglePanel()` to always open/close sidebar based on panel state
- Updated MapCanvas width calculation to use dynamic `sidebarWidth`
- Added sidebar header with title and close button
- Added resize handle component

### 2. `src/components/VTT/VTTSession/VTTSession.css`
**New Styles**:
- `.sidebar-header` - Header bar with gradient background
- `.sidebar-title` - Panel title styling
- `.sidebar-close-btn` - Close button with hover effects
- `.sidebar-content` - Content wrapper with scroll
- `.sidebar-resize-handle` - Draggable resize handle

**Updated Styles**:
- `.vtt-sidebar` - Now uses relative positioning, flex layout
- Removed fixed width, added min/max constraints
- Updated scrollbar styles to apply to `.sidebar-content`
- Responsive adjustments for smaller screens

### 3. `src/components/VTT/Canvas/MapCanvas.jsx`
**New Button**:
- Added Map Library button after Layers button
- Shows active state when `showMapLibrary` is true
- Uses FiMap icon with "Library" label
- Purple background when active

## Technical Details

### Resize Implementation
The resize functionality uses:
1. **MouseDown**: Captures starting position and width
2. **MouseMove**: Calculates delta and updates width within bounds
3. **MouseUp**: Ends resize operation
4. Event listeners added/removed via useEffect for cleanup

### Width Calculation
```javascript
width = Math.max(300, Math.min(800, startWidth + deltaX))
```
- Minimum: 300px (readable content)
- Maximum: 800px (prevents taking too much space)
- Smooth updates during drag

### Panel State Management
```javascript
togglePanel(panelName) {
  // If same panel clicked, close sidebar
  // If different panel, keep sidebar open with new content
  setIsSidebarOpen(nextPanel !== null)
}
```

## User Experience Improvements

### Before
- Sidebar always visible (420px fixed)
- No visual feedback for which panel is active
- No way to close sidebar except clicking panel button
- Fixed width not suitable for all content

### After
- Sidebar hidden by default (more canvas space)
- Clear header shows active panel with icon
- Close button provides intuitive way to dismiss
- Resizable to user preference (300-800px)
- Better use of screen real estate
- Active panel state visible in toolbar buttons

## Visual Layout

### Canvas Controls (DM View)
```
[Layers] [Library] [Maps] [Encounters] [Player View] [Fog] [Tokens] [FX Library ▼]
          ↑ NEW
```

### Sidebar Structure
```
┌─────────────────────────────┐
│ 🗺️ Maps                  × │ ← Header with close
├─────────────────────────────┤
│                             │
│   Panel Content             │ ← Scrollable content
│                             │
│                             │
└─────────────────────────────┘
                              ║ ← Resize handle
```

## Testing Checklist

- [x] Map Library button appears in canvas controls
- [x] Map Library button shows active state
- [x] Map Library panel opens when button clicked
- [x] Sidebar hidden by default on page load
- [x] Sidebar opens when panel button clicked
- [x] Sidebar header shows correct panel name
- [x] Close button closes sidebar
- [x] Resize handle visible on sidebar edge
- [x] Resize handle changes cursor on hover
- [x] Sidebar resizes smoothly when dragged
- [x] Width constrained to 300-800px range
- [x] Canvas width updates correctly when sidebar resizes
- [x] Responsive adjustments work on smaller screens
- [x] No console errors

## Future Enhancements

1. **Sidebar Position Memory**: Save sidebar width to localStorage
2. **Keyboard Shortcuts**: ESC to close sidebar, Ctrl+B to toggle
3. **Resize Snap Points**: Snap to common widths (300, 420, 600)
4. **Double-click to Auto-size**: Double-click handle to auto-fit content
5. **Sidebar Tabs**: Switch between panels without closing sidebar
6. **Minimize Button**: Collapse to icon bar instead of hiding completely

## Breaking Changes

None. All changes are backward compatible and improve UX.

---

**Date**: October 2, 2025
**Author**: GitHub Copilot
**Status**: Implementation Complete ✅
