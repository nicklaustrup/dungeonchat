# Fog of War Brush Implementation

## Overview
Implemented fully functional fog of war brush reveal and conceal features with visual feedback and debugging capabilities.

## Changes Made

### 1. Fixed LightingPanel useEffect Warning
**File**: `src/components/VTT/Lighting/LightingPanel.jsx`

- Fixed React warning about useEffect dependencies changing size
- Updated `handleMouseMove` callback to properly include `dragOffset.x` and `dragOffset.y` in dependencies
- This resolves the console error about array size changing between renders

### 2. Upgraded Fog Panel UI
**File**: `src/components/VTT/Canvas/FogPanel.jsx`

#### Changes:
- **Replaced checkboxes with buttons**: Brush mode is now selected via mutually exclusive buttons
- **Added Lucide React icons**:
  - `Eye` icon for Reveal mode
  - `Cloud` icon for Conceal mode
  - `Sun` icon for Reveal All action
  - `EyeOff` icon for Conceal All action
- **Improved button styling**: Active button state now has gradient background and shadow

### 3. Implemented Fog Brush Painting Functionality
**File**: `src/components/VTT/Canvas/MapCanvas.jsx`

#### New State Variables:
```javascript
const [isFogBrushing, setIsFogBrushing] = useState(false); // Track if actively painting
const [fogBrushActive, setFogBrushActive] = useState(false); // Track if fog brush tool is enabled
const [lastFogCell, setLastFogCell] = useState(null); // Prevent redundant updates
```

#### New Functions:
- **`paintFogAtPointer(e)`**: Core painting function that:
  - Calculates grid cell position from mouse pointer
  - Applies circular brush pattern based on brush size
  - Updates fog visibility in Firestore
  - Includes console logging for debugging
  - Handles both reveal and conceal modes

#### Updated Mouse Handlers:
- **`handleMouseDown`**: Initiates fog brushing when fog brush is active
- **`handleMouseMove`**: Continues painting while dragging
- **`handleMouseUp`**: Stops fog brushing

#### New useEffect Hook:
```javascript
useEffect(() => {
  const shouldActivate = isDM && showFogPanel && fogOfWarEnabled && fogData?.enabled;
  setFogBrushActive(shouldActivate);
  // ... reset state when deactivated
}, [isDM, showFogPanel, fogOfWarEnabled, fogData]);
```

### 4. Custom Cursor Feedback
**File**: `src/components/VTT/Canvas/MapCanvas.jsx`

#### Dynamic Cursor:
- **Reveal mode**: Eye icon cursor (gold color) that scales with brush size
- **Conceal mode**: Cloud/X icon cursor (blue color) that scales with brush size
- Cursor size grows proportionally with brush size (up to 48px max)
- SVG-based custom cursors embedded as data URLs

#### Stage Component Updates:
- Set `draggable` to false when fog brush is active
- Dynamic cursor style based on fog brush state and mode

### 5. Enhanced CSS Styling
**File**: `src/components/VTT/Canvas/FogPanel.css`

- Added gradient background to active brush mode button
- Added box shadow for better visual feedback
- Added slight transform on hover and active states

## Console Logging

Added comprehensive console logging for debugging:

```javascript
console.log('[FOG BRUSH] Brush active state:', shouldActivate, ...);
console.log('[FOG BRUSH] Mouse down - starting fog brush painting');
console.log('[FOG BRUSH] Painting at grid cell:', centerGridX, centerGridY, ...);
console.log('[FOG BRUSH] Updated', cellsChanged, 'cells');
console.log('[FOG BRUSH] Mouse up - stopping fog brush painting');
console.error('[FOG BRUSH] Error painting fog:', err);
```

All fog brush logs are prefixed with `[FOG BRUSH]` for easy filtering.

## How It Works

1. **Activation**: Fog brush automatically activates when:
   - User is DM
   - Fog panel is open
   - Fog of war is enabled
   - Fog data exists

2. **Painting**: 
   - Click and drag on the map to paint fog
   - Brush paints in circular pattern based on brush size
   - Mode determines if cells are revealed (visible) or concealed (hidden)
   - Only one mode can be active at a time

3. **Visual Feedback**:
   - Custom cursor changes based on mode
   - Cursor size grows with brush size
   - Active button shows gradient and shadow
   - Real-time fog updates visible to all players

4. **Grid Calculation**:
   - Accounts for grid offset
   - Adds +1 to grid coordinates for padding cells
   - Validates bounds before updating
   - Skips redundant updates for same cell

## Testing Checklist

- [x] Fog brush activates when panel opens
- [x] Fog brush deactivates when panel closes
- [x] Reveal mode cursor shows eye icon
- [x] Conceal mode cursor shows cloud icon
- [x] Cursor size increases with brush size
- [x] Only one mode button active at a time
- [x] Click and drag reveals/conceals fog
- [x] Brush size affects area painted
- [x] Changes sync in real-time
- [x] Console logs help with debugging
- [x] useEffect warning resolved
- [x] Buttons have lucide-react icons

## Known Limitations

1. **Cursor Size**: Maximum cursor size is 48px to avoid performance issues
2. **Grid Dependency**: Requires grid to be enabled for accurate positioning
3. **DM Only**: Feature only available to DM as intended

## Future Enhancements

1. Add brush shape options (circle, square)
2. Add brush softness/feathering
3. Add undo/redo for fog changes
4. Add fog presets (quick patterns)
5. Add keyboard shortcuts for mode switching
6. Add visual brush preview overlay on canvas
