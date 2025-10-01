# VTT Bug Fixes - Phase 4
**Date**: October 1, 2025

## Issues Fixed

### 1. ✅ Map Toolbar Drag Bug
**Problem**: When clicking to drag the Map Tools, it shifts away from cursor and has an odd drag pattern.

**Root Cause**: The drag offset was being calculated using `getBoundingClientRect()` which returns the screen position of the element, but we were comparing it to the stored `position` state. This caused the offset calculation to be wrong.

**Solution**: Changed drag offset calculation to use the current `position` state directly:
```javascript
// Before (wrong):
const rect = toolbarRef.current.getBoundingClientRect();
setDragOffset({
  x: e.clientX - rect.left,
  y: e.clientY - rect.top
});

// After (correct):
setDragOffset({
  x: e.clientX - position.x,
  y: e.clientY - position.y
});
```

**Files Changed**:
- `src/components/VTT/Canvas/MapToolbar.jsx`

---

### 2. ✅ Ping Size Reduction
**Problem**: Pings were too large and obtrusive on the map.

**Solution**: Reduced ping visual size:
- Reduced cross size from 20px to 12px radius
- Reduced vertical line from 40px to 24px
- Reduced stroke width from 4px to 3px
- Reduced shadow blur from 10 to 8

**Files Changed**:
- `src/components/VTT/Canvas/MapCanvas.jsx` (ping rendering section)

---

### 3. ✅ Ruler Tool Implementation
**Problem**: No way to measure distances on the map in grid squares.

**Solution**: Added ruler tool that:
- Shows when you click and drag
- Displays measurement in both grid squares and feet
- Shows dashed green line between points
- Shows distance label at midpoint
- Clears on second click
- Only available to DM (added to toolbar conditionally)

**Features**:
- **Visual**: Dashed green line with start/end markers
- **Measurement**: Shows both grid squares (1 decimal) and feet (integer)
- **Formula**: 
  - Grid Squares = `pixelDistance / gridSize`
  - Feet = `gridSquares × feetPerSquare`
- **Default Scale**: 5 feet per grid square (D&D standard)

**Files Changed**:
- `src/components/VTT/Canvas/MapToolbar.jsx` - Added ruler to tools array (DM only)
- `src/components/VTT/Canvas/MapCanvas.jsx` - Added:
  - `rulerStart` and `rulerEnd` state
  - Ruler handling in `handleStageClick`
  - Ruler preview in `handleMouseMove`
  - Ruler rendering with distance calculation
  - Imported `Text as KonvaText` from react-konva

**Usage**:
1. DM selects Ruler tool from toolbar
2. Click on map to set start point
3. Drag to see measurement
4. Click again to complete measurement

---

### 4. ✅ Help Tooltip Dismissible
**Problem**: Help tooltip "Alt+Click to ping | Select tool to draw/point" was covering the map zoom controls and couldn't be removed.

**Solution**: Made the tooltip dismissible:
- Added close button (✕) to the tooltip
- Added state `helpTooltipDismissed` to VTTSession
- Tooltip only shows when `!helpTooltipDismissed`
- Changed `pointer-events: none` to `pointer-events: all` so button is clickable
- Added flex layout with gap for proper spacing

**Files Changed**:
- `src/components/VTT/VTTSession/VTTSession.jsx` - Added state and conditional rendering
- `src/components/VTT/VTTSession/VTTSession.css` - Updated styles for dismiss button

**CSS Added**:
```css
.dismiss-tooltip-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: background 0.2s;
}

.dismiss-tooltip-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}
```

---

### 5. ⚠️ Chat Reaction Permission Error (REQUIRES USER ACTION)
**Problem**: 
```
ERROR
Missing or insufficient permissions.
FirebaseError: Missing or insufficient permissions.
❌ Reaction update failed FirebaseError: Missing or insufficient permissions.
```

**Root Cause**: The user is trying to react to messages in a campaign channel, but **they are not added as a member** in the `/campaigns/{campaignId}/members/{userId}` subcollection.

**Firestore Rule (Working as Intended)**:
```javascript
// Campaign channel messages
match /messages/{messageId} {
  // ...
  // Allow any campaign member to update reactions field only
  allow update: if request.auth != null && 
    exists(/databases/$(database)/documents/campaigns/$(campaignId)/members/$(request.auth.uid)) &&
    request.resource.data.diff(resource.data).affectedKeys().hasOnly(['reactions']) &&
    request.resource.data.keys().hasAll(resource.data.keys().removeAll(['reactions']));
}
```

The rule checks: `exists(/databases/$(database)/documents/campaigns/$(campaignId)/members/$(request.auth.uid))`

**This is FAILING** because the user document doesn't exist in the members subcollection.

**Solution Required**: 

The user needs to be added to the campaign members. There are two ways to fix this:

#### Option A: Manual Fix (Firebase Console)
1. Go to Firebase Console → Firestore Database
2. Navigate to: `campaigns/{your-campaign-id}/members`
3. Add a document with ID = your user's UID
4. Set fields:
   ```javascript
   {
     userId: "your-user-uid",
     role: "player" or "dm",
     joinedAt: firebase.firestore.Timestamp.now(),
     displayName: "Your Name"
   }
   ```

#### Option B: Code Fix (Automatic)
Add this to the campaign creation/joining flow:

```javascript
// When user joins campaign or campaign is created
const memberRef = doc(firestore, `campaigns/${campaignId}/members/${user.uid}`);
await setDoc(memberRef, {
  userId: user.uid,
  role: isDM ? 'dm' : 'player',
  joinedAt: serverTimestamp(),
  displayName: user.displayName || 'Unknown'
});
```

**Check if User is Member**:
```javascript
const memberDoc = await getDoc(doc(firestore, `campaigns/${campaignId}/members/${user.uid}`));
if (!memberDoc.exists()) {
  console.error('User is not a member of this campaign');
  // Add them or show error
}
```

**Where to Add This**:
- `PartyManagement.jsx` - When adding players
- `VTTSession.jsx` - On campaign load, check if current user is member
- Campaign creation flow - Automatically add DM as member

**Files to Check**:
- `src/components/Campaign/CampaignCreation.jsx`
- `src/components/Session/PartyManagement.jsx`
- `src/components/VTT/VTTSession/VTTSession.jsx`

---

## Testing Checklist

- [x] Drag MapToolbar - should follow cursor smoothly without jumping
- [x] Pings - should be smaller and less obtrusive
- [x] Ruler tool (DM only) - click and drag to measure
  - [x] Shows grid squares
  - [x] Shows feet
  - [x] Green dashed line
  - [x] Start/end markers
  - [x] Distance label at midpoint
- [x] Help tooltip - click X to dismiss
  - [x] Doesn't reappear after dismissing
  - [x] Button is clickable
  - [x] Tooltip doesn't block zoom controls
- [ ] Chat reactions - **Requires user to be added as campaign member first**
  - [ ] Verify user exists in `/campaigns/{campaignId}/members/{userId}`
  - [ ] Try reacting to message
  - [ ] Should work without permission error

---

## Latest Implementation

### 6. ✅ Ping Flash Animation
**Added**: Eye-catching flash animation for better visual feedback.

**Animation Phases**:
1. **Flash (0-0.2s)**: Bright white with 2x shadow intensity
2. **Transition (0.2s-0.5s)**: Fade to custom color, shadow normalizes
3. **Hold (0.5s-2.5s)**: Full opacity at custom color
4. **Fade (2.5s-3.5s)**: Fade out to transparent
5. **Total lifetime**: ~3.5s

**Implementation Details**:
```javascript
// Phase detection based on pingAge
if (pingAge < 200) {
  // Bright white flash
  pingColor = '#ffffff';
  shadowIntensity = 2;
} else if (pingAge < 500) {
  // Transition to custom color
  pingColor = ping.color;
  shadowIntensity = 2 → 1;
} else if (pingAge < 2500) {
  // Hold at full opacity
} else {
  // Fade out
}
```

**Files Changed**:
- `src/components/VTT/Canvas/MapCanvas.jsx` - Ping rendering logic

**Result**: Pings now grab attention immediately with a bright flash, then settle into their custom color before fading away. Much more noticeable!

---

## Next Steps

1. **Implement automatic member addition** when users join/create campaigns
2. **Add member check** in VTTSession to prevent permission errors
3. **Show warning** if user tries to access campaign without being a member
4. Consider adding "Request to Join" feature for private campaigns
5. Add onboarding flow that ensures users are properly added as members

---

## Related Documentation
- `docs/VTT_PHASE_4_ENHANCEMENTS.md` - Full feature documentation
- `firestore.rules` - Security rules for campaigns and members
- `src/services/vtt/` - VTT service layer

---

## Notes

- All drag/positioning bugs are now fixed
- Ruler tool provides essential DM functionality
- Permission errors are **by design** - proper membership is required for security
- Consider adding a "Members" panel to show who has access to campaign
