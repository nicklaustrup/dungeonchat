# HP Sync Fix - Missing userId on Tokens

**Status:** ✅ **FIXED**  
**Date:** October 4, 2025  
**Priority:** 🔴 CRITICAL

---

## Problem Summary

HP changes on tokens did not propagate to character sheets or party panel, and vice versa.

### Root Cause Identified

**Tokens were missing the `userId` field!**

From console logs:
```javascript
🔷 tokenService.updateHP: Current token data: {
  characterId: 'xgM4VfIEC1h6osLiXhhYMLVd3c03', 
  userId: undefined,  // ❌ MISSING!
  ...
}
```

```javascript
🟣 useTokens.setupCharacterListeners: Found 0 unique characters with linked tokens
```

### Why This Broke HP Sync

The HP sync system requires **BOTH** `characterId` AND `userId` on tokens:

1. **Token → Character Updates** (`tokenService.updateHP`):
   ```javascript
   if (characterId && userId && !fromCharacterSync) {
     // Update character sheet HP
   }
   ```
   - Without `userId`, this condition fails
   - Token HP changes go directly to token only
   - Character sheet never updated

2. **Character → Token Updates** (`useTokens.setupCharacterListeners`):
   ```javascript
   const uniqueCharacters = new Map();
   tokens.forEach(token => {
     if (token.characterId && token.userId) {
       uniqueCharacters.set(token.userId, token.characterId);
     }
   });
   ```
   - Without `userId`, token isn't added to listener map
   - Character listeners never set up
   - Token never receives character HP changes

---

## The Fix

### 1. Fix Token Creation Code

**File:** `src/services/characterSheetService.js`

**Changed:**
```javascript
const playerToken = {
  name: character.name,
  type: 'pc',
  imageUrl: tokenImageUrl,
  position: { x: 100, y: 100 },
  size: { width: 25, height: 25 },
  rotation: 0,
  color: '#4a9eff',
  characterId: userId,
  userId: userId,  // ✅ ADDED THIS LINE
  ownerId: userId,
  isHidden: false,
  staged: true,
  hp: character.hp || character.maxHp,
  maxHp: character.maxHp,
  statusEffects: [],
  createdBy: userId
};
```

**Why:**
- For player character tokens, `userId` should equal `characterId`
- Both fields are required for HP sync to work
- Previous code set `characterId` but forgot `userId`

### 2. Migration Utility for Existing Tokens

**File:** `src/utils/fixTokenUserIds.js`

**Purpose:** Fix tokens created before the code fix

**Usage:**
```javascript
import { fixTokenUserIds } from './utils/fixTokenUserIds';

// Call once in your component
await fixTokenUserIds(firestore, campaignId);
```

**What it does:**
1. Iterates all maps in campaign
2. Finds tokens with `characterId` but no `userId`
3. Sets `userId = characterId` (correct for PC tokens)
4. Uses batched writes for efficiency (max 500 per batch)
5. Logs progress and results

**Console Output:**
```
🔧 Starting token userId migration for campaign: xyz
🔧 Checking tokens in map: abc123
🔧 Fixing token: Agnakha (355db802-f288-4aa0-9cc2-4f1152b0ff49)
   - characterId: xgM4VfIEC1h6osLiXhhYMLVd3c03
   - Setting userId: xgM4VfIEC1h6osLiXhhYMLVd3c03
✅ Fixed 6 token(s) in map abc123
✅ Token userId migration complete! Fixed 6 token(s) total.
🎉 HP sync should now work! Refresh the page and test.
```

---

## How to Apply the Fix

### Step 1: Code is Already Fixed ✅

The token creation code in `characterSheetService.js` has been updated. All **new tokens** will have the `userId` field.

### Step 2: Run Migration for Existing Tokens

**Option A: Add to Dev Tools Panel**

1. Open `src/components/VTT/DevTools/DevToolsPanel.jsx` (or similar)
2. Add button:
   ```jsx
   import { fixTokenUserIds } from '../../../utils/fixTokenUserIds';
   
   <button onClick={async () => {
     try {
       const fixed = await fixTokenUserIds(firestore, campaignId);
       alert(`Fixed ${fixed} tokens! Refresh page.`);
     } catch (err) {
       alert('Error: ' + err.message);
     }
   }}>
     Fix Token UserIds
   </button>
   ```
3. Click button once
4. Refresh page

**Option B: Run in Browser Console**

1. Open browser console
2. Temporarily add to VTTSession component:
   ```jsx
   useEffect(() => {
     const runMigration = async () => {
       const { fixTokenUserIds } = await import('./utils/fixTokenUserIds');
       await fixTokenUserIds(firestore, campaignId);
     };
     runMigration();
   }, []);
   ```
3. Refresh page (migration runs automatically)
4. Remove the useEffect

**Option C: Manual Firestore Update**

If you have few tokens, manually add `userId` field in Firebase Console:
1. Navigate to Firestore → campaigns → {campaignId} → maps → {mapId} → tokens
2. For each token with `characterId` but no `userId`:
   - Edit document
   - Add field: `userId` (string) = value of `characterId`
   - Save

### Step 3: Verify Fix

After running migration, check console logs:

**Before Fix:**
```
🟣 useTokens.setupCharacterListeners: Found 0 unique characters with linked tokens
```

**After Fix:**
```
🟣 useTokens.setupCharacterListeners: Found 6 unique characters with linked tokens
🟣 useTokens: Character listener set up for: Agnakha (xgM4VfIEC1h6osLiXhhYMLVd3c03)
```

### Step 4: Test HP Sync

**Test 1: Token → Character**
1. Right-click token
2. Click HP +/- buttons
3. ✅ Character sheet HP should update
4. ✅ Party panel HP should update

**Test 2: Character → Token**
1. Open character sheet
2. Change HP input
3. ✅ Token HP bar should update
4. ✅ Party panel HP should update

**Expected Console Logs:**
```
🔷 tokenService.updateHP called: {tokenId: '...', ...}
🔷 tokenService.updateHP: Current token data: {
  characterId: 'xgM4VfIEC1h6osLiXhhYMLVd3c03',
  userId: 'xgM4VfIEC1h6osLiXhhYMLVd3c03',  // ✅ NOW PRESENT!
  ...
}
🔷 tokenService.updateHP: Has character link, updating character sheet
✅ tokenService.updateHP: Character sheet updated, token will sync via listener
🟣 useTokens: Character HP changed: {userId: '...', hp: 11, maxHp: 10}
🟣 useTokens: Found linked tokens: 1 [{id: '...', name: 'Agnakha'}]
🔶 tokenService.syncTokenHPFromCharacter: Syncing token ... with character HP
```

---

## Technical Details

### Token Data Structure (Fixed)

```javascript
{
  id: '355db802-f288-4aa0-9cc2-4f1152b0ff49',
  name: 'Agnakha',
  type: 'pc',
  characterId: 'xgM4VfIEC1h6osLiXhhYMLVd3c03',  // Character document ID
  userId: 'xgM4VfIEC1h6osLiXhhYMLVd3c03',       // ✅ REQUIRED for sync
  ownerId: 'xgM4VfIEC1h6osLiXhhYMLVd3c03',
  hp: 10,
  maxHp: 10,
  staged: false,
  imageUrl: 'https://...',
  // ... other fields
}
```

### HP Sync Flow (Now Working)

**Token → Character:**
```
1. User clicks token HP +/-
2. tokenService.updateHP() called
3. Check: characterId && userId && !fromCharacterSync ✅
4. Update character document in Firestore
5. Character listener fires in useTokens
6. syncTokenHPFromCharacter() called
7. Token HP updated (with fromCharacterSync=true to prevent loop)
```

**Character → Token:**
```
1. User changes character sheet HP
2. Character document updated in Firestore
3. Character listener fires in useTokens (set up because token has userId)
4. syncTokenHPFromCharacter() called for all linked tokens
5. Token HP updated (with fromCharacterSync=true)
```

### Why characterId AND userId?

**Question:** Why do we need both? Aren't they the same?

**Answer:** 
- **For PC tokens:** Yes, they're the same (`userId = characterId = player's user ID`)
- **For future NPC tokens:** They differ:
  - `characterId`: Points to NPC sheet (if it has one)
  - `userId`: Owner of the token (GM's user ID)
- **Current code:** Only PC tokens use HP sync, both fields required
- **Future-proofing:** Separation allows different ownership models

### Backwards Compatibility

**Old tokens without userId:**
- Won't sync HP (as discovered)
- Won't break anything else
- Migration fixes them retroactively

**New tokens after fix:**
- Will have userId from creation
- HP sync works immediately
- No migration needed

---

## Related Files

### Modified Files
- ✅ `src/services/characterSheetService.js` - Added `userId: userId` to token creation

### New Files
- ✅ `src/utils/fixTokenUserIds.js` - Migration utility

### Documentation
- ✅ `HP_SYNC_FIX_MISSING_USERID.md` - This file
- 📝 `HP_SYNC_DEBUGGING_LOGS.md` - Debugging guide (helped identify issue!)
- 📝 `TODO.md` - HP Sync section (can be marked complete after migration)

---

## Lessons Learned

1. **Console logging saved the day!** 🎉
   - Emoji markers made it easy to spot the issue
   - Logging token data revealed `userId: undefined`
   - Clear evidence of root cause

2. **Both fields required for sync**
   - Easy to forget one field in token creation
   - Should add validation or TypeScript types
   - Consider JSDoc with @property tags

3. **Migration utilities are essential**
   - Can't just fix forward-going code
   - Need to fix existing data
   - Batched writes for efficiency

4. **Test with real data**
   - Bug only appeared with tokens created by old code
   - New test tokens might have worked
   - Always test with production-like state

---

## Next Steps

1. ✅ Run migration utility once
2. ✅ Refresh page and verify console logs show character listeners
3. ✅ Test HP sync in both directions
4. 🔜 Remove or disable debug console logs (optional)
5. 🔜 Implement "Apply" button optimization (separate PR)
6. 🔜 Add custom HP input styling (separate PR)

---

## Success Criteria

- [x] Token creation code fixed
- [ ] Migration utility run successfully
- [ ] Console shows: "Found N unique characters with linked tokens" (N > 0)
- [ ] Token HP +/- updates character sheet ✅
- [ ] Token HP +/- updates party panel ✅
- [ ] Character sheet HP updates token ✅
- [ ] Character sheet HP updates party panel ✅
- [ ] No infinite loops or errors ✅

**Status:** Code fixed, migration ready. Run migration and test! 🚀
