# Map Library Accessibility Enhancement

## Overview
Fixed an accessibility issue where DMs couldn't access the Map Library button when no map was active in the VTT session. The canvas control buttons (including Map Library) only appeared when a map was selected, leaving DMs unable to select an initial map.

## Problem
- Canvas controls are rendered conditionally based on `activeMap` existence
- When `activeMap` is null, the entire canvas controls section doesn't render
- DMs couldn't select their first map without the Map Library button
- Players saw an empty placeholder but DMs had no call-to-action

## Solution
Added a Map Library button to the "no-map-placeholder" div that appears when no map is active, making it the first thing DMs see when entering a session without an active map.

## Changes Made

### 1. State Management (VTTSession.jsx)
- **Lifted `showMapLibrary` state** from MapCanvas to VTTSession
- Added `onToggleMapLibrary` handler to pass to MapCanvas
- State is now managed at the session level for consistent access

### 2. No-Map Placeholder Enhancement (VTTSession.jsx)
Added Map Library button to the placeholder:
```jsx
{isUserDM && (
  <button 
    className="map-library-cta-button"
    onClick={() => setShowMapLibrary(true)}
  >
    <FiMap size={20} />
    Open Map Library
  </button>
)}
```

**Features:**
- Only renders for DMs (conditional on `isUserDM`)
- Uses purple gradient matching VTT theme
- Icon + text for clarity
- Opens MapLibraryPanel directly

### 3. MapLibraryPanel Integration (VTTSession.jsx)
Moved MapLibraryPanel rendering from MapCanvas to VTTSession:
```jsx
{isUserDM && showMapLibrary && (
  <MapLibraryPanel
    firestore={firestore}
    campaignId={campaignId}
    open={showMapLibrary}
    onClose={() => setShowMapLibrary(false)}
    onSelect={(map) => {
      handleMapSelect(map.id);
      setShowMapLibrary(false);
    }}
  />
)}
```

**Rationale:**
- MapLibraryPanel can now be accessed from multiple locations
- Works both when no map is active and when map is active
- Consistent behavior regardless of map state

### 4. MapCanvas Refactoring
**Removed:**
- Local `showMapLibrary` state
- MapLibraryPanel component rendering
- MapLibraryPanel import

**Updated:**
- Function signature now includes `showMapLibrary` and `onToggleMapLibrary` props
- Map Library button now calls `onToggleMapLibrary` instead of local state setter
- Button still shows active state based on `showMapLibrary` prop

### 5. Styling (VTTSession.css)
Added `.map-library-cta-button` class:
```css
.map-library-cta-button {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  color: white;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}
```

**Features:**
- Purple gradient matching VTT theme (#667eea → #764ba2)
- Large, prominent button for clear call-to-action
- Smooth hover animations (lift + shadow increase)
- Icon sized at 1.3rem for visibility
- Flexible layout with gap for icon/text spacing

## File Changes Summary

### Modified Files
1. **src/components/VTT/VTTSession/VTTSession.jsx**
   - Added MapLibraryPanel import
   - Added `showMapLibrary` state
   - Passed props to MapCanvas
   - Added Map Library button to no-map-placeholder
   - Rendered MapLibraryPanel in floating panels section

2. **src/components/VTT/Canvas/MapCanvas.jsx**
   - Removed local `showMapLibrary` state
   - Removed MapLibraryPanel import and rendering
   - Updated Map Library button to use prop callback
   - Function signature now accepts showMapLibrary/onToggleMapLibrary props

3. **src/components/VTT/VTTSession/VTTSession.css**
   - Added `.map-library-cta-button` styles

### Documentation Created
- MAP_LIBRARY_ACCESSIBILITY.md (this file)

## User Experience Flow

### Before Fix
1. DM enters VTT session with no active map
2. Sees "no-map-placeholder" with text only
3. No way to open Map Library
4. Must manually navigate away or refresh

### After Fix
1. DM enters VTT session with no active map
2. Sees "no-map-placeholder" with prominent "Open Map Library" button
3. Clicks button → MapLibraryPanel opens
4. Selects map → Map becomes active
5. Canvas controls appear with continued Map Library access

## Technical Notes

### State Lifting Pattern
The `showMapLibrary` state was lifted from MapCanvas to VTTSession because:
- Multiple components need to control the panel (placeholder button + canvas button)
- MapLibraryPanel is now rendered at session level
- Maintains single source of truth for panel state

### Conditional Rendering
The Map Library button in the placeholder:
- Only renders when `isUserDM === true`
- Players still see basic placeholder message
- Prevents confusion for player role

### Panel Positioning
MapLibraryPanel is rendered in the "floating panels" section alongside:
- PartyPanel
- ChatPanel
- LightingPanel

This ensures consistent z-index layering and positioning behavior.

## Testing Checklist

- [ ] DM can see Map Library button when no map is active
- [ ] Button opens MapLibraryPanel correctly
- [ ] Selecting a map closes panel and activates map
- [ ] Canvas controls appear after map selection
- [ ] Map Library button in canvas controls still works
- [ ] Button styling matches VTT theme
- [ ] Players don't see the button (player role check)
- [ ] Panel closes when clicking "X" or pressing Escape
- [ ] No console errors when opening/closing panel

## Related Features
- **Sidebar Improvements** (SIDEBAR_IMPROVEMENTS.md)
- **Grid Sync & Fog Panel** (GRID_SYNC_AND_FOG_PANEL_IMPLEMENTATION.md)

## Future Enhancements
- Add keyboard shortcut (e.g., Ctrl+M) to open Map Library
- Show map preview thumbnails in placeholder area
- Add "Recent Maps" quick access in placeholder
- Persist last selected map for quick session startup
