# Token Manager Active Tab - Bug Fixes

## Issues Fixed

### 1. ✅ Center Camera on Token Feature Not Working
**Problem:** Clicking the focus button (🎯) in the Active tab did not center the camera on tokens.

**Root Cause:** The `TokenManager` component was missing the `onCenterCamera` prop that needs to be passed from `VTTSession`.

**Solution:**
- Added `centerCameraRef` ref in `VTTSession.jsx` to hold the camera centering function
- Created `handleCenterCameraOnToken(x, y)` handler in `VTTSession.jsx`
- Created `handleFocusToken(token)` handler in `VTTSession.jsx` to handle token focus clicks
- Passed `onCenterCamera={centerCameraRef}` to `MapCanvas` component
- Passed `onCenterCamera={handleCenterCameraOnToken}` to `TokenManager` component

### 2. ✅ Edit Token Not Loading Data into Palette Tab
**Problem:** Clicking the edit button (✏️) in the Active tab did not load the token's data into the Palette tab.

**Root Cause:** The `TokenManager` component was missing the `onTokenSelect` prop that needs to be passed from `VTTSession`.

**Solution:**
- Passed `onTokenSelect={setSelectedTokenId}` to `TokenManager` component in `VTTSession.jsx`
- The existing `handleEditToken` function in `TokenManager.jsx` already:
  - Calls `onTokenSelect(token.id || token.tokenId)` to select the token
  - Switches to the 'palette' tab with `setActiveView('palette')`
  - The palette tab displays the selected token's data via the `selectedToken` prop

### 3. ✅ Edit Light Feature Integration
**Problem:** The Active tab shows lights but clicking edit on them didn't open the light editor.

**Solution:**
- Created `handleOpenLightEditor(light)` handler in `VTTSession.jsx`
- Passed `onOpenLightEditor={handleOpenLightEditor}` to `TokenManager` component
- The handler opens the lighting panel when a light's edit button is clicked

## Files Modified

### `src/components/VTT/VTTSession/VTTSession.jsx`

**Changes:**
1. Added `centerCameraRef` ref to expose camera centering function
2. Added handler functions:
   - `handleCenterCameraOnToken(x, y)` - Centers camera at coordinates
   - `handleFocusToken(token)` - Focuses camera on token position
   - `handleOpenLightEditor(light)` - Opens lighting panel for editing lights
3. Updated `MapCanvas` props:
   - Added `onCenterCamera={centerCameraRef}` prop
4. Updated `TokenManager` props:
   - Added `onTokenSelect={setSelectedTokenId}` prop
   - Added `onCenterCamera={handleCenterCameraOnToken}` prop
   - Added `onOpenLightEditor={handleOpenLightEditor}` prop

## How It Works Now

### Center Camera on Token (Focus Button 🎯)
1. User clicks focus button on a token in Active tab
2. `ActiveTokenItem` calls `onFocus(token)`
3. `ActiveTokensTab` passes this to `handleFocusToken` in `TokenManager`
4. `TokenManager.handleFocusToken`:
   - Extracts token position
   - Calls `onCenterCamera(x, y)` prop
   - Calls `onTokenSelect(tokenId)` prop
   - Switches to palette tab
5. `VTTSession.handleCenterCameraOnToken` calls the camera center function via the ref
6. `MapCanvas` centers the viewport on the token position

### Edit Token (Edit Button ✏️)
1. User clicks edit button on a token in Active tab
2. `ActiveTokenItem` calls `onEdit(token)`
3. `ActiveTokensTab` passes this to `handleEditToken` in `TokenManager`
4. `TokenManager.handleEditToken`:
   - Calls `onTokenSelect(token.id)` prop
   - Switches to 'palette' tab with `setActiveView('palette')`
5. `VTTSession` updates `selectedTokenId` state via `setSelectedTokenId`
6. The `selectedToken` object is computed and passed to `TokenManager`
7. `TokenPalette` receives the `selectedToken` prop and displays its data
8. User can now edit the token properties in the palette

### Edit Light (Edit Button ✏️ on lights)
1. User clicks edit button on a light in Active tab
2. `ActiveLightItem` calls `onEdit(light)`
3. `ActiveTokensTab` passes this to `handleEditLight` in `TokenManager`
4. `TokenManager.handleEditLight`:
   - Switches to 'active' tab (to keep user in Active tab view)
   - Calls `onOpenLightEditor(light)` prop
5. `VTTSession.handleOpenLightEditor` opens the `LightingPanel`
6. User can edit the light in the lighting panel

## Testing Checklist

- [x] No compilation errors
- [ ] Click focus button (🎯) on a token in Active tab centers camera
- [ ] Click edit button (✏️) on a token in Active tab:
  - Switches to Palette tab
  - Loads token data in the palette
  - Token becomes selected
- [ ] Click focus button (🎯) on a light in Active tab centers camera
- [ ] Click edit button (✏️) on a light in Active tab opens lighting panel

## Technical Notes

### Camera Centering Ref Pattern
The `MapCanvas` component uses a ref pattern for exposing its camera centering function:
- `VTTSession` creates a ref: `const centerCameraRef = useRef(null)`
- Passes it to `MapCanvas`: `<MapCanvas onCenterCamera={centerCameraRef} />`
- `MapCanvas` assigns its internal function: `onCenterCamera.current = handleCenterCamera`
- Other components can call: `centerCameraRef.current(x, y)`

This pattern is used because `MapCanvas` needs to maintain control over viewport state.

### Token Selection Flow
The token selection uses a simple state management pattern:
- `VTTSession` maintains `selectedTokenId` state
- `VTTSession` computes `selectedToken` object from tokens array
- Both `MapCanvas` and `TokenManager` receive these as props
- Changes propagate through the component tree automatically

## Verification

To verify the fixes are working:
1. Open a VTT session with a map
2. Create and place some tokens on the map
3. Open Token Manager and navigate to "Active" tab
4. Verify tokens appear in the list
5. Click the focus button (🎯) - camera should center on the token
6. Click the edit button (✏️) - should switch to Palette tab with token data loaded
7. Make changes to the token - changes should save and be reflected on the map

## Related Files

- `src/components/VTT/TokenManager/TokenManager.jsx` - Main token manager component
- `src/components/VTT/TokenManager/ActiveTokensTab.jsx` - Active tab container
- `src/components/VTT/TokenManager/ActiveTokenItem.jsx` - Individual token item in list
- `src/components/VTT/TokenManager/ActiveLightItem.jsx` - Individual light item in list
- `src/components/VTT/TokenManager/TokenPalette.jsx` - Token editing palette
- `src/components/VTT/Canvas/MapCanvas.jsx` - Map rendering and camera control
- `src/components/VTT/VTTSession/VTTSession.jsx` - Main session container (modified)
