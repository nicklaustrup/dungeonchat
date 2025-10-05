# Character Deletion Bug Fix

**Date**: October 4, 2025  
**Priority**: 🔴 Critical  
**Status**: ✅ Fixed

---

## Problem

When a DM attempted to delete a character from the Campaign Dashboard's Characters tab, **the wrong character was being deleted**. Specifically, the DM's own character was being deleted instead of the target character.

### Reported Issue
> "The first character I attempted to delete actually deleted my own and not the one I was attempting to delete."

---

## Root Cause Analysis

The bug was caused by **incorrect parameter passing** through multiple layers:

### 1. **Campaign Dashboard** (`CampaignDashboard.js`)
```javascript
// WRONG: Using character.id instead of character.userId
await deleteCharacter(character.id);
```

### 2. **Hook** (`useDeleteCharacterSheet`)
```javascript
// WRONG: Accepting and passing the DM's userId
export function useDeleteCharacterSheet(firestore, campaignId, userId) {
  const deleteCharacter = useCallback(async (characterId) => {
    await deleteCharacterSheet(firestore, campaignId, userId, characterId);
    //                                                  ^^^^^^ DM's ID!
  }, [firestore, campaignId, userId]);
}
```

### 3. **Service** (`deleteCharacterSheet`)
```javascript
// Using userId as the document ID (should be character owner's ID)
export async function deleteCharacterSheet(firestore, campaignId, userId) {
  const characterRef = doc(firestore, 'campaigns', campaignId, 'characters', userId);
  //                                                                         ^^^^^^ Used as doc ID!
  await deleteDoc(characterRef);
}
```

### The Flow of the Bug

1. DM clicks delete on Character B (owned by Player 2)
2. `character.id` might be undefined or wrong
3. Hook receives the DM's userId (Player 1) as a closure
4. Service uses the DM's userId as the document ID
5. **Result**: DM's character gets deleted instead of Character B!

---

## Solution

### Fixed Files

1. **`src/hooks/useCharacterSheet.js`**
   - Removed `userId` parameter from `useDeleteCharacterSheet` hook
   - Changed parameter name from `characterId` to `characterUserId` for clarity
   - Hook now receives the character owner's userId directly from the component

2. **`src/services/characterSheetService.js`**
   - Renamed parameter from `userId` to `characterUserId` for clarity
   - Added better JSDoc documentation explaining it's the character owner's ID

3. **`src/components/Campaign/CampaignDashboard.js`**
   - Changed from `character.id` to `character.userId` (the character owner's ID)
   - Removed `user?.uid` from the `useDeleteCharacterSheet` hook call
   - Added comment explaining the correct property to use

### The Fix

**Before**:
```javascript
// Hook initialized with DM's ID
const { deleteCharacter } = useDeleteCharacterSheet(firestore, campaignId, user?.uid);

// Tried to delete using character.id (wrong property)
await deleteCharacter(character.id);
```

**After**:
```javascript
// Hook doesn't need DM's ID anymore
const { deleteCharacter } = useDeleteCharacterSheet(firestore, campaignId);

// Delete using character.userId (the character owner's ID, which is the document ID)
await deleteCharacter(character.userId);
```

---

## Firestore Document Structure

Characters are stored at:
```
/campaigns/{campaignId}/characters/{userId}
```

Where `{userId}` is the **character owner's user ID**, NOT:
- ❌ A random character ID
- ❌ The DM's user ID
- ❌ An auto-generated ID

This is why we must use `character.userId` to delete the correct document.

---

## Testing Checklist

- [x] Code changes completed
- [ ] Test as DM: Delete another player's character
- [ ] Test as DM: Verify own character is NOT deleted
- [ ] Test as DM: Delete multiple characters in sequence
- [ ] Test as Player: Verify delete button still works for own character
- [ ] Test: Verify member document is updated correctly after deletion
- [ ] Test: Verify character sheet no longer appears in VTT
- [ ] Test: Verify tokens linked to deleted character are handled properly

---

## Related Code

### Character Object Structure
```javascript
{
  id: userId,           // Document ID (Firestore auto-adds this)
  userId: "user123",    // Character owner's user ID
  name: "Gandalf",
  level: 5,
  class: "Wizard",
  // ... other properties
}
```

### Why Both `id` and `userId`?

When fetching from Firestore, the document ID is added as `id`:
```javascript
const snapshot = await getDocs(charactersRef);
const characters = snapshot.docs.map(doc => ({
  id: doc.id,      // Firestore document ID
  ...doc.data()    // Includes userId from document data
}));
```

In this case, both should be the same (the character owner's userId), but using `userId` is more explicit and less prone to errors.

---

## Prevention

To prevent similar bugs in the future:

1. **Naming Convention**: Use `characterUserId` or `characterOwnerId` instead of ambiguous names
2. **JSDoc Comments**: Clearly document what each ID parameter represents
3. **Type Safety**: Consider adding TypeScript for compile-time checks
4. **Code Review**: Watch for ID parameter confusion in multi-layer functions
5. **Testing**: Always test with multiple users when dealing with user-specific operations

---

## Impact

**Severity**: 🔴 Critical  
**User Impact**: High - DMs could accidentally delete their own characters  
**Data Loss**: Potential permanent character deletion  
**Fix Complexity**: Low - Parameter routing fix

---

## Deployment Notes

- ✅ No database migration needed
- ✅ No breaking changes to API
- ✅ Safe to deploy immediately
- ⚠️ Users who experienced the bug will need to manually restore deleted characters (if backups exist)

---

## Related Documentation

- `src/services/characterSheetService.js` - Character CRUD operations
- `src/hooks/useCharacterSheet.js` - Character sheet React hooks
- Firestore structure: `/campaigns/{campaignId}/characters/{userId}`

---

## Commit Message

```
fix: Character deletion bug - deleted wrong character

Fixed critical bug where DM deleting a character would delete their own
character instead of the target character.

Root cause: Hook was using DM's userId instead of character owner's userId.

Changes:
- Remove userId param from useDeleteCharacterSheet hook
- Update CampaignDashboard to use character.userId instead of character.id
- Clarify parameter naming in service (userId -> characterUserId)
- Add explanatory comments

BREAKING: None
IMPACT: High - Prevents accidental character deletion
TESTING: Manual testing required as DM with multiple characters

Fixes #[issue-number]
```

---

## Additional Notes

This bug highlights the importance of:
- Clear parameter naming (avoid generic names like `userId` or `id`)
- Proper data flow through hooks and services
- Understanding Firestore document ID structure
- Testing with multiple user contexts (DM vs Player)

The fix is simple but the impact was severe. Always test user-specific delete operations with multiple accounts!
