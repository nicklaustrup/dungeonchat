# HP Sync System - Debugging Console Logs Added

**Date**: October 4, 2025  
**Priority**: 🔴 Critical  
**Status**: 🟡 Debugging Phase

---

## Problem

HP updates are not syncing correctly across the system:
1. **Token → Character Sheet/Party Panel**: Right-clicking token and changing HP does NOT update character sheet or party panel
2. **Character Sheet → Token**: Updating character sheet HP updates party panel but NOT tokens  
3. **Performance Issue**: Token right-click +/- buttons send multiple Firebase updates

---

## Debugging Approach

Added comprehensive console logs throughout the HP sync system to trace the flow of HP updates and identify where the sync is breaking.

---

## Console Log Markers

Each system component has a unique emoji marker for easy visual scanning:

| Component | Emoji | Purpose |
|-----------|-------|---------|
| **tokenService.js** | 🔷 | Token service operations |
| **CharacterSheet.js** | 🟢 | Character sheet HP changes |
| **useTokens.js** | 🟣 | Token hook and character listeners |
| **Success** | ✅ | Successful operations |
| **Error** | ❌ | Failed operations |
| **Warning** | ⚠️ | Warning conditions |

---

## Files Modified

### 1. `src/services/vtt/tokenService.js`

#### `updateHP()` function
**Added logs:**
- 🔷 Function called with parameters (tokenId, delta/value, isAbsolute, fromCharacterSync)
- 🔷 Current token data (characterId, userId, currentHP, maxHP, name)
- 🔷 Calculated new HP value
- 🔷 Whether token is linked to character
- ✅ Character sheet updated successfully
- ❌ Error updating character HP
- 🔷 Updating token directly (non-linked or fallback)
- ✅ Token updated directly

#### `syncTokenHPFromCharacter()` function
**Added logs:**
- 🔶 Function called with token ID and character HP data
- ✅ Token HP synced successfully  
- ❌ Error syncing token HP from character

### 2. `src/components/CharacterSheet.js`

#### `handleHitPointChange()` function
**Added logs:**
- 🟢 Function called with userId, character name, old/new HP, maxHP
- ✅ Character HP updated in Firestore
- ❌ Error updating hit points

### 3. `src/hooks/vtt/useTokens.js`

#### `setupCharacterListeners()` function
**Added logs:**
- 🟣 Setting up listeners for N tokens
- 🟣 Found N unique characters with linked tokens
- 🟣 Character HP changed (userId, name, hp, maxHp)
- 🟣 Found N linked tokens with details
- ❌ Error listening to character HP
- ❌ Error setting up character listeners

---

## Expected Flow

### Scenario 1: Token HP Change → Character Sheet

```
User clicks token right-click +/- button
    ↓
🔷 tokenService.updateHP called
    ↓
🔷 Current token data logged (with characterId/userId)
    ↓
🔷 Token linked to character, updating character sheet
    ↓
✅ Character sheet updated
    ↓
🟣 useTokens: Character HP changed (listener triggered)
    ↓
🟣 useTokens: Found linked tokens
    ↓
🔶 tokenService.syncTokenHPFromCharacter called
    ↓
✅ Token HP synced successfully
```

### Scenario 2: Character Sheet HP Change → Token

```
User changes HP in character sheet input
    ↓
🟢 CharacterSheet.handleHitPointChange called
    ↓
✅ Character HP updated in Firestore
    ↓
🟣 useTokens: Character HP changed (listener triggered)
    ↓
🟣 useTokens: Found linked tokens
    ↓
🔶 tokenService.syncTokenHPFromCharacter called (for each token)
    ↓
✅ Token HP synced successfully
```

---

## How to Debug

### Step 1: Test Token → Character Sheet Sync

1. Open browser console
2. Right-click a token
3. Click +/- HP buttons
4. Watch for these logs in order:
   - 🔷 tokenService.updateHP called
   - 🔷 Token linked to character, updating character sheet
   - ✅ Character sheet updated
   - 🟣 useTokens: Character HP changed
   - 🟣 useTokens: Found linked tokens
   - 🔶 tokenService.syncTokenHPFromCharacter called
   - ✅ Token HP synced successfully

5. **If sync breaks, look for:**
   - Missing 🔷 log → Token update not triggered
   - Missing ✅ character sheet updated → Write failed
   - Missing 🟣 character HP changed → Listener not set up
   - Missing 🟣 found linked tokens → Token not properly linked
   - Missing 🔶 sync called → syncTokenHPFromCharacter not invoked
   - ❌ errors → Check error messages

### Step 2: Test Character Sheet → Token Sync

1. Open character sheet
2. Change HP value in input
3. Watch for these logs:
   - 🟢 CharacterSheet.handleHitPointChange called
   - ✅ Character HP updated in Firestore
   - 🟣 useTokens: Character HP changed
   - 🟣 useTokens: Found linked tokens
   - 🔶 tokenService.syncTokenHPFromCharacter called
   - ✅ Token HP synced successfully

4. **If sync breaks, look for:**
   - Missing 🟢 log → Input change handler not triggered
   - Missing ✅ Firestore update → Write failed
   - Missing 🟣 character HP changed → Listener not set up
   - Found 0 linked tokens → Token missing characterId/userId
   - Missing 🔶 sync called → Not iterating through tokens
   - ❌ errors → Check error messages

### Step 3: Check Token Linking

Look for logs showing token characterId and userId:
```
🔷 tokenService.updateHP: Current token data: {
  characterId: "user123",  // Should exist for PC tokens
  userId: "user123",       // Should match characterId
  currentHp: 25,
  maxHp: 50,
  tokenName: "Gandalf"
}
```

If characterId or userId is null/undefined, the token is not properly linked.

---

## Common Issues to Look For

### Issue 1: Token Not Linked to Character
**Symptoms:**
- 🔷 Token updating directly (no character link)
- characterId or userId is null

**Cause:** Token created without proper character linking

**Fix:** Ensure `createPlayerStagedToken` sets both `characterId` and `ownerId`

### Issue 2: Character Listener Not Set Up
**Symptoms:**
- No 🟣 logs after character HP changes
- Character HP changes but tokens don't update

**Cause:** `setupCharacterListeners` not called or failed

**Fix:** Check useTokens hook initialization

### Issue 3: Circular Updates
**Symptoms:**
- Same log repeating infinitely
- Multiple sync calls for single update

**Cause:** `fromCharacterSync` flag not working

**Fix:** Verify syncTokenHPFromCharacter doesn't trigger updateHP

### Issue 4: Token List Stale
**Symptoms:**
- 🟣 Found 0 linked tokens (but token exists)
- Token exists on map but not in tokenList

**Cause:** tokenList not updated when listener fires

**Fix:** Ensure tokenList is current in setupCharacterListeners

---

## Next Steps

After identifying the issue via console logs:

1. **Fix the broken sync point**
2. **Add "Apply" button optimization** (prevent multiple Firebase writes)
3. **Custom HP input styling** (replace default HTML spinners)
4. **Test all sync scenarios**
5. **Remove debug logs** (or set to debug-only mode)

---

## Performance Notes

### Current Behavior (Problematic)
- Token +/- button: **Immediate Firebase write on every click**
- Character sheet input: **Immediate Firebase write on every change**
- Result: 100 clicks = 100 Firestore writes

### Target Behavior (After Fix)
- Token +/- button: **Store locally, write on "Apply"**
- Character sheet input: **Debounce or Apply button**
- Result: N clicks + 1 Apply = 1 Firestore write

---

## Files to Update Next

After debugging is complete:

1. **TokenContextMenu.jsx** - Add Apply button, local state
2. **CharacterSheet.js** - Add debounce or Apply button
3. **CharacterSheet.css** - Custom HP input buttons (up/down carets)

---

## Related Documentation

- `HP_SYSTEM_STANDARDIZATION.md` - HP property standardization
- `TODO.md` - HP Sync System Debugging & Optimization section

---

## Testing Checklist

- [ ] Token HP +/- → Console shows full sync flow
- [ ] Character sheet HP → Console shows full sync flow
- [ ] Party panel HP → Console shows full sync flow
- [ ] Identify broken sync point from console logs
- [ ] Fix identified issue
- [ ] Verify all syncs work after fix
- [ ] Add Apply button optimization
- [ ] Custom HP input styling
- [ ] Remove or disable debug logs

---

## Success Criteria

✅ Console logs reveal exact point where sync breaks  
✅ All sync flows traced from start to finish  
✅ Errors clearly visible in console with context  
✅ Can identify missing characterId/userId  
✅ Can verify listener setup  
✅ Can track Firebase write operations  

**Status**: Debugging logs added, ready for testing ✅
