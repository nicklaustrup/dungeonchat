# Lighting Placement & Control Guide

## Overview
The lighting system now supports intuitive drag-and-drop placement and interactive control of light sources, making it easy for DMs to create and manage dynamic lighting on their maps.

## Quick Start

### Placing New Lights

1. **Open Lighting Panel**
   - Click "FX Library" button (next to Edit Token)
   - Select "Lighting" from dropdown

2. **Choose a Preset**
   - Scroll to "Quick Place Lights" section
   - Click any preset button:
     - 🔥 **Torch** - Orange flickering light (40ft radius)
     - 🏮 **Lantern** - Amber steady light (30ft radius)
     - 🕯️ **Candle** - Gold flickering light (10ft radius)
     - ✨ **Light Spell** - White bright light (40ft radius)
     - 🔵 **Magical** - Blue pulsing light (30ft radius)
     - 🟣 **Purple** - Purple pulsing light (30ft radius)

3. **Place on Map**
   - After clicking preset, your cursor shows a preview:
     - Outer glow ring (shows light radius)
     - Bright center dot (shows placement point)
     - Dashed border (exact radius indicator)
   - Preview follows mouse with grid snapping
   - Click anywhere on map to place light
   - Tool automatically returns to pointer mode

### Moving Existing Lights

1. **Select Pointer Tool** (default)
2. **Find Light Marker**
   - Look for colored circles at light positions
   - Color matches the light's color
   - White stroke for visibility
3. **Drag to Move**
   - Click and drag the marker
   - Position snaps to grid automatically
   - Release to save new position

### Deleting Lights

**Method 1: Context Menu**
- Right-click light marker
- Select "🗑️ Delete Light"
- Confirm deletion

**Method 2: Lighting Panel**
- Open Lighting Panel
- Find light in "Light Sources" list
- Click 🗑️ icon
- Confirm deletion

## Features

### Visual Preview During Placement
- **Outer Glow Ring**: Shows effective light radius (10% opacity)
- **Inner Bright Center**: Shows exact placement point (8px)
- **Dashed Border**: Shows radius boundary
- **Color Matched**: Preview uses preset's color
- **Grid Snapping**: Auto-aligns to grid squares

### Interactive Light Markers
- **Visibility**: Only visible to DM
- **Color Coded**: Matches light source color
- **Draggable**: Move lights after placement
- **Grid Snap**: Positions snap to grid
- **Context Menu**: Right-click for options
- **Hover Feedback**: Cursor changes to "move"

### Light Presets
Each preset includes:
- **Type**: Point light (radial)
- **Color**: Hex color code
- **Radius**: Grid units (converted to pixels)
- **Intensity**: 0.0-1.0 brightness
- **Effects**: Flicker, pulse, or steady
- **Falloff**: Realistic light dimming

## Technical Details

### Grid Snapping
- Uses existing `maybeSnapPoint()` function
- Aligns to nearest grid intersection
- Respects grid size setting
- Works for both placement and dragging

### State Management
- Placement tool: `activeTool = 'placeLight'`
- Preview position: `lightPreviewPos`
- Light data: `placingLight`
- Uses `useLighting` hook for CRUD operations
- Optimistic UI updates for instant feedback

### Rendering Layers
- **Preview**: Rendered in Drawing & Effects Layer
- **Light Effect**: Rendered in Lighting Layer
- **Control Markers**: Rendered in Token Layer
- **Context Menu**: DOM overlay (z-index: 10000)

## Workflow Examples

### Example 1: Torch in Dungeon
1. Click "FX Library" → "Lighting"
2. Enable lighting (ON button)
3. Click "🔥 Torch" preset
4. Click map at entrance
5. Drag torch marker to adjust position
6. Light follows character if attached to token

### Example 2: Candelabra Setup
1. Place first candle at position
2. Click "🕯️ Candle" preset again
3. Place second candle nearby
4. Repeat for all candles
5. Each light has independent control

### Example 3: Magical Area
1. Click "🔵 Magical" preset
2. Place at ritual circle center
3. Light pulses with animation
4. Move if needed by dragging marker

## Tips & Tricks

### Precise Positioning
- Zoom in for fine control
- Use grid snapping for alignment
- Preview shows exact radius before placing
- Drag to adjust after placement

### Light Combinations
- Mix multiple light types for atmosphere
- Layer lights for dynamic effects
- Use different colors for mood
- Combine flickering and steady lights

### Performance
- Lights use GPU-accelerated rendering
- Flicker/pulse animations are efficient
- Multiple lights render smoothly
- No performance impact on other tools

### Workflow Optimization
- Keep Lighting Panel open while setting up scene
- Use Quick Place for common lights
- Use "Add Light" button for custom lights
- Right-click to quickly remove mistakes

## Common Issues

### Light Not Appearing
- ✅ Check "Enable Lighting" is ON
- ✅ Ensure you're in DM mode
- ✅ Light might be outside visible area
- ✅ Check light intensity isn't 0

### Can't Drag Light
- ✅ Must be in Pointer tool mode
- ✅ Only DM can drag lights
- ✅ Lighting must be enabled
- ✅ Try clicking directly on marker

### Preview Not Showing
- ✅ Must click preset button first
- ✅ Move mouse over map area
- ✅ Check activeTool is 'placeLight'
- ✅ Preview clears after placement

## Keyboard Shortcuts
*(Not yet implemented - planned for Phase 2)*

- `L` - Toggle lighting panel
- `ESC` - Cancel light placement
- `Delete` - Remove selected light
- `Ctrl+Z` - Undo last light change

## Related Documentation

- [FX Library Implementation](./FX_LIBRARY_IMPLEMENTATION.md) - Complete lighting system
- [Lighting Quick Start](./FX_LIBRARY_QUICK_START.md) - Basic usage
- [VTT Phase 1 Setup](./VTT_PHASE_1_SETUP.md) - Initial lighting setup

## Version History

### v1.0 - October 1, 2025
- ✅ Quick Place preset palette
- ✅ Visual preview during placement
- ✅ Draggable light controls
- ✅ Right-click context menu
- ✅ Grid snapping for all operations
- ✅ Optimistic UI updates

### Planned for v1.1
- 🔄 Edit light properties after placement
- 🔄 Attach lights to tokens
- 🔄 Copy/paste lights
- 🔄 Light templates/favorites
- 🔄 Undo/redo support

## Commits

- `7c4dd2e` - Initial drag-and-drop placement with preview
- `6356cd9` - Added draggable controls and context menu
