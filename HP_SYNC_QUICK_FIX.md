# HP Sync Quick Fix Guide

## 🎯 Problem Found!

Your tokens are **missing the `userId` field**! The HP sync system requires BOTH `characterId` AND `userId`, but your tokens only have `characterId`.

From your console logs:
```javascript
userId: undefined  // ❌ This breaks everything!
```

---

## ✅ What I Fixed

### 1. Token Creation Code
**File:** `src/services/characterSheetService.js`

Added one line:
```javascript
userId: userId,  // ✅ Required for HP sync
```

Now all **new tokens** will work correctly.

### 2. Migration Utility
**File:** `src/utils/fixTokenUserIds.js`

This will fix your **existing 6 tokens** that are missing `userId`.

---

## 🚀 How to Fix Your Existing Tokens

### Quick Method (Easiest)

1. **Open your browser console** (F12)

2. **Run this code once:**

```javascript
// Copy-paste this entire block into console
(async () => {
  const { fixTokenUserIds } = await import('./utils/fixTokenUserIds');
  const { getFirestore } = await import('firebase/firestore');
  
  const firestore = getFirestore();
  const campaignId = 'YOUR_CAMPAIGN_ID_HERE'; // Replace with your campaign ID
  
  const fixed = await fixTokenUserIds(firestore, campaignId);
  console.log(`✅ Fixed ${fixed} tokens! Refresh the page.`);
})();
```

3. **Replace `YOUR_CAMPAIGN_ID_HERE`** with your actual campaign ID (find it in the URL or Firebase)

4. **Press Enter**

5. **Wait for:** `✅ Fixed 6 tokens! Refresh the page.`

6. **Refresh the page**

7. **Done!** HP sync should work now.

---

## ✅ Verify It Worked

After refreshing, open console and look for:

**Before (Broken):**
```
🟣 useTokens.setupCharacterListeners: Found 0 unique characters
```

**After (Fixed):**
```
🟣 useTokens.setupCharacterListeners: Found 6 unique characters with linked tokens
🟣 useTokens: Character listener set up for: Agnakha (xgM4VfIEC1h6osLiXhhYMLVd3c03)
```

---

## 🧪 Test HP Sync

### Test 1: Token → Character
1. Right-click a token
2. Click HP + or - button
3. ✅ Character sheet HP should update
4. ✅ Party panel HP should update

### Test 2: Character → Token
1. Open character sheet
2. Change HP number
3. ✅ Token HP bar should update
4. ✅ Party panel HP should update

---

## 🔍 Expected Console Logs (After Fix)

```
🔷 tokenService.updateHP called: {...}
🔷 tokenService.updateHP: Current token data: {
  characterId: 'xgM4VfIEC1h6osLiXhhYMLVd3c03',
  userId: 'xgM4VfIEC1h6osLiXhhYMLVd3c03',  // ✅ NOW PRESENT!
  ...
}
🔷 tokenService.updateHP: Has character link, updating character sheet
✅ tokenService.updateHP: Character sheet updated, token will sync via listener
🟣 useTokens: Character HP changed: {userId: '...', hp: 11, maxHp: 10}
🟣 useTokens: Found linked tokens: 1 [{id: '...', name: 'Agnakha'}]
🔶 tokenService.syncTokenHPFromCharacter: Syncing token with character HP
✅ tokenService.syncTokenHPFromCharacter: Token synced successfully
```

---

## 📚 Full Documentation

See `HP_SYNC_FIX_MISSING_USERID.md` for complete technical details.

---

## 🤔 Need Help?

If migration fails:
1. Check campaign ID is correct
2. Check you're logged in
3. Check browser console for errors
4. Try the alternative methods in `HP_SYNC_FIX_MISSING_USERID.md`

If HP sync still broken after migration:
1. Verify console shows character listeners being set up
2. Check token has both `characterId` and `userId` in Firestore
3. Check character document exists at `campaigns/{campaignId}/characters/{userId}`
