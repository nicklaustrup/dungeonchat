# Fog Brush Quick Start Guide

## Overview
The fog brush allows DMs to manually reveal or conceal areas of the map with intuitive click-and-drag painting.

## Opening the Fog Panel

1. Click the fog button in the toolbar (DM only)
2. Fog panel appears with controls

## Brush Controls

### Enable/Disable Fog
- Checkbox at top of panel
- Must be enabled for brush to work

### Brush Mode (Buttons with Icons)
Two mutually exclusive buttons:

```
┌─────────────────────────────────┐
│  [👁 Reveal]  [☁ Conceal]      │
└─────────────────────────────────┘
```

- **Reveal** (Eye icon): Makes fog transparent (players can see)
- **Conceal** (Cloud icon): Makes fog opaque (players cannot see)
- Only one mode active at a time
- Active button has gradient purple background

### Brush Size Slider
```
Brush Size: 3 cells
[────●────────────]
1                 10
```

- Range: 1-10 grid cells
- Larger brush = bigger area affected
- Cursor grows with brush size

### Quick Actions
```
┌──────────────────────────────────┐
│ [☀ Reveal All] [👁‍🗨 Conceal All] │
└──────────────────────────────────┘
```

- **Reveal All**: Instantly reveal entire map
- **Conceal All**: Instantly conceal entire map

## Using the Brush

### Step 1: Select Mode
Click either "Reveal" or "Conceal" button

### Step 2: Adjust Brush Size (Optional)
Drag slider to desired size

### Step 3: Paint
- **Cursor changes** to show active mode:
  - Reveal mode: 👁 Gold eye icon
  - Conceal mode: ☁ Blue cloud icon
- **Click and drag** on map to paint
- Cursor size grows with brush size

### Visual Feedback
```
Brush Size 1:  👁 (small cursor)
Brush Size 5:  👁 (medium cursor)
Brush Size 10: 👁 (large cursor)
```

## Console Logs for Debugging

All fog brush operations log to console with `[FOG BRUSH]` prefix:

```javascript
[FOG BRUSH] Brush active state: true (panel: true, enabled: true, fogData: true)
[FOG BRUSH] Mouse down - starting fog brush painting
[FOG BRUSH] Painting at grid cell: 5, 8 with brush size: 3 mode: reveal
[FOG BRUSH] Updated 7 cells
[FOG BRUSH] Mouse up - stopping fog brush painting
```

### Useful Console Filters
In browser console, filter by:
- `[FOG BRUSH]` - See all fog brush activity
- `[FOG BRUSH] Error` - See only errors

## Troubleshooting

### Brush Not Working?

Check console logs for activation state:
```
[FOG BRUSH] Brush active state: false (panel: true, enabled: false, fogData: true)
                                       ↑ Check these values
```

Requirements:
1. ✓ Must be DM
2. ✓ Fog panel must be open (`showFogPanel: true`)
3. ✓ Fog must be enabled (`fogOfWarEnabled: true`)
4. ✓ Fog data must exist (`fogData: true`)

### Cursor Not Changing?

- Check if fog panel is open
- Verify fog is enabled in panel
- Ensure you're hovering over the map canvas

### Painting Wrong Mode?

- Check which button is highlighted (has gradient background)
- Click the correct mode button
- Console logs show current mode

### Updates Not Syncing?

Check console for:
```
[FOG BRUSH] Error painting fog: [error message]
```

Common issues:
- Firestore permissions
- Network connectivity
- Invalid grid coordinates

## Tips & Tricks

### Efficient Painting
- Use larger brush for open areas
- Use smaller brush for precise edges
- Switch modes frequently for detail work

### Quick Workflow
1. Open fog panel (`Shift+F`)
2. Select mode with keyboard shortcuts (planned)
3. Adjust brush size with mouse wheel (planned)
4. Paint away!

### Performance
- Brush automatically batches updates
- Skips redundant cell updates
- Optimized for smooth painting

## Technical Details

### Grid Calculation
```javascript
// Accounts for grid offset and padding
const adjustedX = mapX - offsetX;
const adjustedY = mapY - offsetY;
const gridX = Math.floor(adjustedX / gridSize) + 1; // +1 for padding
const gridY = Math.floor(adjustedY / gridSize) + 1;
```

### Circular Brush Pattern
```
Size 3 brush paints in radius pattern:
    . . ■ . .
    . ■ ■ ■ .
    ■ ■ ● ■ ■  ← Center
    . ■ ■ ■ .
    . . ■ . .
```

### Real-time Sync
- Updates immediately via Firestore
- All connected players see changes
- Optimistic updates for smooth UX
