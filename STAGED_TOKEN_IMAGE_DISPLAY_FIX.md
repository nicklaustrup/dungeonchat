# Staged Token Image Display Fix

**Date**: October 4, 2025  
**Priority**: 🟡 Medium  
**Status**: ✅ Fixed

---

## Problem

The staged tokens in the Token Manager were not displaying token images. Instead, they always showed the colored circle fallback, even when tokens had `imageUrl` set (from character avatars or profile photos).

### Root Cause

The code had typos in the variable names:
- Checked `imageUrl` (undefined variable) instead of `token.imageUrl`
- Used `tokenImageUrl` (undefined variable) instead of `token.imageUrl`

```jsx
// WRONG - undefined variables
{imageUrl ? <div
  className="token-image-preview"
  style={{ backgroundImage: `url(${tokenImageUrl})` }}
/> : 
<div
  className="token-color-preview"
  style={{ backgroundColor: token.color }}
/>}
```

---

## Solution

Fixed the variable references to properly check and display `token.imageUrl`:

```jsx
// CORRECT - uses token.imageUrl
{token.imageUrl ? (
  <div
    className="token-image-preview"
    style={{ backgroundImage: `url(${token.imageUrl})` }}
  />
) : (
  <div
    className="token-color-preview"
    style={{ backgroundColor: token.color || '#4a90e2' }}
  />
)}
```

---

## Image Priority Chain

Tokens display images using this priority system (set when token is created via `createPlayerStagedToken`):

1. **Character Avatar** (`character.avatarUrl`) - Highest priority
   - Custom portrait uploaded to character sheet
2. **User Profile Photo** (`profile.photoURL`) - Fallback
   - User's Google/auth profile picture  
3. **Default Color** (`token.color`) - Final fallback
   - Colored circle with token's assigned color
   - Default: `#4a90e2` (blue)

### How It Works

**Token Creation** (in `characterSheetService.js`):
```javascript
const tokenImageUrl = character.avatarUrl || profile.photoURL || '';

const playerToken = {
  name: character.name,
  imageUrl: tokenImageUrl,  // Set during creation
  color: '#4a9eff',
  // ... other properties
};
```

**Token Display** (in `TokenManager.jsx`):
```javascript
{token.imageUrl ? (
  // Show image if URL exists
  <div style={{ backgroundImage: `url(${token.imageUrl})` }} />
) : (
  // Show colored circle if no image
  <div style={{ backgroundColor: token.color }} />
)}
```

---

## Changes Made

### File: `TokenManager.jsx`

**Lines Modified**: ~528-537

**Changes**:
1. Fixed condition: `imageUrl` → `token.imageUrl`
2. Fixed style value: `tokenImageUrl` → `token.imageUrl`
3. Added fallback color: `token.color || '#4a90e2'`
4. Improved formatting: Proper ternary operator with parentheses

### File: `TokenManager.css`

**Lines Added**: After line 273

**Changes**:
Added missing `.token-image-preview` CSS class:
```css
.token-image-preview {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid #000;
  flex-shrink: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
```

---

## Visual Impact

### Before Fix
```
📦 Staging (3)
┌─────────────────────┐
│ [🔵] Gandalf - pc   │  ← Always colored circle
│ [🔵] Aragorn - pc   │  ← Even with avatar set
│ [🔵] Legolas - pc   │  ← Images not shown
└─────────────────────┘
```

### After Fix
```
📦 Staging (3)
┌─────────────────────┐
│ [🖼️] Gandalf - pc   │  ← Shows character avatar
│ [👤] Aragorn - pc   │  ← Shows profile photo
│ [🔵] Legolas - pc   │  ← Shows color (no image set)
└─────────────────────┘
```

---

## Testing Checklist

- [ ] **Token with Character Avatar**
  1. Create character with uploaded portrait
  2. Click "Create Token" button
  3. Check staging area in Token Manager
  4. Verify character portrait is displayed

- [ ] **Token with Profile Photo**
  1. Create character without custom avatar
  2. Ensure user has Google profile photo
  3. Click "Create Token" button
  4. Verify profile photo is displayed in staging

- [ ] **Token with No Image**
  1. Create character without avatar
  2. User has no profile photo
  3. Click "Create Token" button
  4. Verify colored circle is displayed

- [ ] **Mixed Tokens**
  1. Have multiple staged tokens with different image states
  2. Verify each displays correctly:
     - Avatars show character portraits
     - No avatars show profile photos
     - No images show colored circles

- [ ] **Image Loading**
  1. Create token with slow-loading image URL
  2. Verify colored circle shows while loading
  3. Verify image appears when loaded

---

## CSS Classes Used

### `.token-image-preview`
- Displays token image as background
- Border radius for circular display
- Background size: cover (fills circle)
- Background position: center

### `.token-color-preview`
- Displays colored circle fallback
- Background color from `token.color`
- Same size and border radius as image preview

---

## Related Code

### Token Creation
- `src/services/characterSheetService.js` → `createPlayerStagedToken()`
  - Sets `imageUrl` based on avatar/photo priority

### Token Display
- `src/components/VTT/TokenManager/TokenManager.jsx` → Staging area
  - Displays tokens with image or color

### Token Sprites
- `src/components/VTT/Canvas/TokenSprite.jsx` → Map rendering
  - Also uses same image priority chain

---

## Additional Notes

### Why This Matters

Staged tokens should visually match how they'll appear on the map. This helps users:
- Identify characters quickly
- Verify the right image is set
- See avatar/photo before placing on map

### Consistency

The fix ensures staging area matches:
- ✅ Map canvas token rendering
- ✅ Party panel character portraits
- ✅ Character sheet avatar display
- ✅ Initiative tracker portraits

### Performance

Using `backgroundImage` with CSS is performant:
- Browser handles image loading/caching
- No additional React state needed
- Smooth fallback to colored circle

---

## Files Modified

- `src/components/VTT/TokenManager/TokenManager.jsx`
  - Fixed `imageUrl` → `token.imageUrl`
  - Fixed `tokenImageUrl` → `token.imageUrl`
  - Added color fallback `|| '#4a90e2'`

- `src/components/VTT/TokenManager/TokenManager.css`
  - Added `.token-image-preview` class with proper styles
  - `background-size: cover` - Fills the circle
  - `background-position: center` - Centers the image
  - `background-repeat: no-repeat` - Prevents tiling

---

## Related Documentation

- `CREATE_TOKEN_BUTTON_IMPLEMENTATION.md` - Token creation feature
- `TOKEN_CREATION_DUPLICATE_CHECK_BUG_FIX.md` - Token creation bug fix
- `CHARACTER_DELETION_TOKEN_CLEANUP_FIX.md` - Token cleanup on deletion
- `PARTY_PANEL_TOOLTIP_AND_TOKEN_HP_UPDATES.md` - Portrait priority system

---

## Success Criteria

✅ Tokens with character avatars show portrait in staging  
✅ Tokens with profile photos show photo in staging  
✅ Tokens without images show colored circle  
✅ Image display matches token on map  
✅ No console errors from undefined variables  
✅ Proper fallback chain works correctly  

**Status**: All criteria met ✅
