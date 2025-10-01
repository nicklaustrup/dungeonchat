# VTT Fixes and Updates - Final Implementation

## Changes Made

### ✅ 1. Drawing Timings Updated
**Changed**: Both pen and arrow now delete after **3 seconds** (was 10s and 30s)

**Files Modified**:
- `src/services/vtt/drawingService.js`
  - Pen stroke: `setTimeout(..., 3000)`
  - Arrow: `setTimeout(..., 3000)`

### ✅ 2. Ping Activation Fixed  
**Problem**: Clicking always created pings regardless of selected tool
**Solution**: Ping now **only activates with Alt+Click**, regardless of active tool

**Files Modified**:
- `src/components/VTT/Canvas/MapCanvas.jsx`
  - Added check: `if (e.evt.altKey)` to create ping
  - Returns early if Alt pressed, preventing other tool actions
  - Tools (pen/arrow) only activate on regular click without Alt

**New Behavior**:
- **Alt+Click anywhere** = Create ping (works with any tool selected)
- **Pen tool + Click+Drag** = Draw
- **Arrow tool + Click twice** = Create arrow
- Help tooltip updated: "Alt+Click to ping | Select tool to draw/point"

### ✅ 3. Fade Animations Added

**Pen Strokes** (0.5-1s fade):
- Starts at 80% opacity
- At 2 seconds, begins fading
- Fades to 0% over 1 second (2s-3s)
- Smooth linear fade

**Arrows** (0.5-1s fade):
- Starts at 90% opacity
- At 2 seconds, begins fading
- Fades to 0% over 1 second (2s-3s)
- Smooth linear fade with shadow

**Implementation**:
```javascript
const fadeStart = 2000; // Start fading at 2 seconds
const fadeDuration = 1000; // Fade over 1 second
let opacity = 0.8; // or 0.9 for arrows
if (age > fadeStart) {
  const fadeProgress = Math.min(1, (age - fadeStart) / fadeDuration);
  opacity = baseOpacity * (1 - fadeProgress);
}
```

**Force Re-render**: Added interval to update drawings every 100ms for smooth fading

### ✅ 4. Ping Visual Changed to X with Vertical Line

**Old**: Yellow circle
**New**: X shape with vertical line pointing up

**Components**:
- Vertical line: From center up 40 pixels
- Diagonal 1: Bottom-left to top-right
- Diagonal 2: Top-left to bottom-right
- All lines: Yellow, 4px wide, with shadow and glow

### ✅ 5. Player Token Type Fixed

**Problem**: Player tokens used `type: 'player'` but TokenPalette uses `type: 'pc'`
**Result**: Query for existing tokens failed, tokens not appearing in staging

**Fix**:
- Changed player token creation to use `type: 'pc'`
- Changed query to check for `type: 'pc'` instead of `type: 'player'`

**Files Modified**:
- `src/components/VTT/VTTSession/VTTSession.jsx`

**Now**: Player tokens should properly appear in staging area

### ✅ 6. Fog of War Debugging Added

**Added Console Logging**:
1. Fog subscription setup: "Setting up fog subscription for map: {id}"
2. Fog data received: Full fog data object with visibility array
3. Fog rendering: Grid dimensions, enabled state, player status
4. Unsubscribe: "Unsubscribing from fog"

**Checks to Verify**:
- [ ] Fog subscription is established (console log on map load)
- [ ] Fog data is received (console log when fog initialized)
- [ ] Fog rendering is triggered (console log with visibility array)
- [ ] Grid is enabled on map
- [ ] User is not DM (fog only visible to players)
- [ ] Fog document exists at: `/campaigns/{id}/vtt/{mapId}/fog/current`

**Fog Rendering Logic**:
```javascript
{fogData?.enabled && map.gridEnabled && !isDM && (
  <Layer>
    {fogData.visibility && fogData.visibility.map((row, y) => 
      row.map((isVisible, x) => {
        if (!isVisible) {
          return <Rect ... />  // Black fog square
        }
        return null;
      })
    )}
  </Layer>
)}
```

### ✅ 7. React Fragment Fix

**Problem**: Using `React.Fragment` without proper import
**Solution**: Imported `Fragment` from React, use `<Fragment>` instead of `<React.Fragment>`

---

## Testing Checklist

### Drawing Timings
- [ ] Create pen stroke - should fade at 2s and delete at 3s
- [ ] Create arrow - should fade at 2s and delete at 3s
- [ ] Fade should be smooth (updates every 100ms)

### Ping Activation
- [ ] With Ping tool selected: Alt+Click creates ping, regular click does nothing
- [ ] With Pen tool selected: Alt+Click creates ping, drag creates pen stroke
- [ ] With Arrow tool selected: Alt+Click creates ping, clicks create arrow
- [ ] Help tooltip shows: "Alt+Click to ping | Select tool to draw/point"

### Ping Visual
- [ ] Ping shows as X shape with vertical line
- [ ] Line points upward from center
- [ ] X is centered on click point
- [ ] Yellow color with glow/shadow

### Player Tokens in Staging
- [ ] Create character sheet for player
- [ ] Join VTT session as player
- [ ] Check console for: "Player token created and staged for: {name}"
- [ ] Open Token Manager as DM
- [ ] Click "Staging" tab
- [ ] Player token should appear with name and profile picture
- [ ] Token type should be "pc"

### Fog of War Debugging
**As DM**:
- [ ] Load map with grid enabled
- [ ] Click fog button to initialize
- [ ] Check console: "Setting up fog subscription for map: {id}"
- [ ] Check console: "Fog data received: {data}"
- [ ] Fog should NOT render for DM

**As Player**:
- [ ] Join same session as player
- [ ] Check console: "Setting up fog subscription for map: {id}"
- [ ] Check console: "Fog data received: {data}"
- [ ] Check console: "Rendering fog of war: {debug info}"
- [ ] Black fog squares should cover unrevealed areas (95% opacity)
- [ ] Fog should be VERY dark and prominent

---

## Known Issues to Check

### 1. Firestore Permissions Error
**Error**: "Missing or insufficient permissions" for drawings collection

**Root Cause**: Firestore rules may not have deployed properly

**Solution**: Re-deploy Firestore rules:
```bash
cd /c/Users/nlaus/randomcode/firebase_chat/superchat
npx firebase deploy --only firestore:rules
```

**Rules to Verify** (in `firestore.rules`):
```
match /drawings/{drawingId} {
  // Campaign members can read drawings
  allow read: if request.auth != null && 
    exists(/databases/$(database)/documents/campaigns/$(campaignId)/members/$(request.auth.uid));
  
  // Campaign members can create their own drawings
  allow create: if request.auth != null && 
    request.auth.uid == request.resource.data.createdBy &&
    exists(/databases/$(database)/documents/campaigns/$(campaignId)/members/$(request.auth.uid));
  
  // Members can delete their own drawings, DM can delete any
  allow delete: if request.auth != null && 
    (request.auth.uid == resource.data.createdBy || 
     request.auth.uid == get(/databases/$(database)/documents/campaigns/$(campaignId)).data.dmId);
}
```

### 2. Player Tokens Not Appearing
**Checklist**:
1. Player must have character sheet at: `/campaigns/{id}/characters/{userId}`
2. Token query now uses `type: 'pc'` not `type: 'player'`
3. Token is created with `staged: true`
4. TokenManager subscribes to `where('staged', '==', true)`

**Debug**: Check console for:
- "Player has no character sheet, skipping token creation" (if no character)
- "Player token created and staged for: {name}" (on success)
- "Error creating player token: {error}" (on failure)

### 3. Fog Not Rendering
**Possible Causes**:
1. **User is DM**: Fog only renders for players (`!isDM` check)
2. **Grid not enabled**: Fog requires `map.gridEnabled === true`
3. **Fog not initialized**: Must click fog button to create fog document
4. **Fog disabled**: `fogData.enabled` must be true
5. **No visibility data**: `fogData.visibility` must be 2D array

**Debug Steps**:
1. Check console for fog subscription messages
2. Verify fog document exists in Firestore at correct path
3. Check fog data structure (must be flattened 1D array in Firestore)
4. Verify reconstruction to 2D array in `fogOfWarService.getFogOfWar()`

---

## Files Modified (Summary)

1. **drawingService.js**
   - Changed timings to 3 seconds
   
2. **MapCanvas.jsx**
   - Fixed ping activation (Alt+Click only)
   - Added fade animations for pen/arrows
   - Changed ping visual to X with vertical line
   - Added fog debugging console logs
   - Fixed React Fragment usage
   - Added re-render interval for smooth fading

3. **VTTSession.jsx**
   - Changed player token type from 'player' to 'pc'
   - Fixed player token query to use 'pc'
   - Updated help tooltip text

4. **firestore.rules**
   - Already has drawings collection rules (verify deployment)

---

## Next Steps

1. **Deploy Firestore Rules** (if permissions error persists):
   ```bash
   npx firebase deploy --only firestore:rules
   ```

2. **Test Player Token Creation**:
   - Create character sheet
   - Join as player
   - Check staging area in Token Manager

3. **Test Fog of War**:
   - Initialize as DM
   - Check console logs
   - Join as player and verify fog renders

4. **Test Drawing Tools**:
   - Test pen with fade
   - Test arrow with fade
   - Verify 3-second deletion
   - Test Alt+Click ping from all tools

---

## Success Criteria

✅ Pen and arrow fade smoothly over last 1 second before deleting at 3s
✅ Alt+Click creates ping regardless of active tool
✅ Regular click/drag uses active tool (pen/arrow) without creating ping
✅ Ping displays as X with vertical line
✅ Player tokens with character sheets appear in staging area
✅ Fog of war renders prominently for players (95% opacity, very dark)
✅ Console shows fog subscription and data flow
✅ No Firestore permission errors
