# Token HP Sync System - Implementation Complete ✅

**Date**: October 4, 2025  
**Status**: ✅ Implemented and Ready for Testing

---

## Overview

The Token HP Sync System establishes **character sheets as the single source of truth for HP**, with all linked tokens automatically syncing in real-time. This eliminates data inconsistency and provides a seamless experience where updating HP in one location updates it everywhere.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Character Sheet (Source of Truth)         │
│                  Firestore: campaigns/{id}/characters/{uid}  │
│                  Fields: currentHitPoints, hitPointMaximum   │
└────────────────────────────┬────────────────────────────────┘
                             │
                             │ Real-time Listener (onSnapshot)
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                     useTokens Hook                           │
│  - Listens to character HP changes                           │
│  - Identifies all tokens linked to character                 │
│  - Calls tokenService.syncTokenHPFromCharacter()             │
└────────────────────────────┬────────────────────────────────┘
                             │
                             │ Batch Update
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│               Multiple Tokens (Derived Data)                 │
│           Firestore: campaigns/{id}/vtt/{mapId}/tokens/      │
│                Fields: hp, maxHp (synced from character)     │
│                Links: characterId, userId                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Components

### 1. **tokenService.js** - Core Logic

#### **updateHP()** - Modified to Sync with Character
```javascript
/**
 * Update HP (clamped 0..maxHp when maxHp provided)
 * If token is linked to a character, updates character sheet instead
 * 
 * @param {boolean} fromCharacterSync - Prevents circular updates
 */
async updateHP(firestore, campaignId, mapId, tokenId, deltaOrValue, isAbsolute, fromCharacterSync)
```

**Flow**:
1. Fetch token data
2. Calculate new HP value
3. **If token has characterId + userId**:
   - Update character sheet (source of truth)
   - Return immediately (token will be updated by listener)
4. **Otherwise**: Update token directly (for non-linked tokens like enemies/NPCs)

**Circular Update Prevention**:
- The `fromCharacterSync` flag prevents infinite loops
- When character listener calls `syncTokenHPFromCharacter()`, it won't trigger another character update

#### **syncTokenHPFromCharacter()** - New Function
```javascript
/**
 * Sync token HP from character sheet (character is source of truth)
 * Called by listeners when character HP changes
 */
async syncTokenHPFromCharacter(firestore, campaignId, mapId, tokenId, characterData)
```

**Purpose**:
- Updates token HP to match character HP
- Called automatically by character listeners in `useTokens`
- Does NOT update character (prevents circular updates)

#### **getTokensByCharacter()** - New Function
```javascript
/**
 * Get all tokens linked to a specific character
 * Used for bulk HP sync when character HP changes
 */
async getTokensByCharacter(firestore, campaignId, mapId, characterId, userId)
```

**Purpose**:
- Finds all tokens for a specific character
- Supports multiple tokens per character (e.g., duplicates on different maps)
- Uses compound query: `characterId == X AND userId == Y`

---

### 2. **useTokens.js** - Real-time Sync Hook

#### **setupCharacterListeners()** - New Function
```javascript
/**
 * Set up character HP listeners for tokens linked to characters
 * When character HP changes, automatically sync to all linked tokens
 */
const setupCharacterListeners = useCallback(async (tokenList) => { ... })
```

**How It Works**:
1. **Identify Unique Characters**:
   - Iterate through all tokens
   - Create Set of unique userId values (characters)
   - Only listen to characters that have tokens on current map

2. **Cleanup Old Listeners**:
   - Remove listeners for characters no longer on map
   - Prevent memory leaks

3. **Add New Listeners**:
   - For each unique character, create Firestore listener
   - Listen to: `campaigns/{campaignId}/characters/{userId}`
   - On character HP change → sync all linked tokens

4. **Token Sync**:
   - Find all tokens with matching userId + characterId
   - Call `tokenService.syncTokenHPFromCharacter()` for each
   - Updates happen automatically (no page refresh needed)

**Performance**:
- Only creates ONE listener per character (not per token)
- Listeners are reused across multiple tokens
- Example: 5 tokens of same character = 1 listener (not 5)

---

## Data Model

### **Token Document** (`campaigns/{campaignId}/vtt/{mapId}/tokens/{tokenId}`)
```javascript
{
  tokenId: string,
  name: string,
  type: 'pc' | 'enemy' | 'npc' | 'object',
  imageUrl: string,
  position: { x: number, y: number },
  size: { width: number, height: number },
  rotation: number,
  color: string,
  
  // Linking fields (NEW/IMPORTANT)
  characterId: string | null,  // References character (same as userId for PCs)
  userId: string | null,        // Owner of token
  
  // HP fields (synced from character if linked)
  hp: number,                   // Current HP (derived from character if linked)
  maxHp: number,                // Max HP (derived from character if linked)
  
  // Other fields
  statusEffects: array,
  isHidden: boolean,
  staged: boolean,
  createdBy: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### **Character Document** (`campaigns/{campaignId}/characters/{userId}`)
```javascript
{
  name: string,
  class: string,
  race: string,
  level: number,
  experience: number,
  
  // HP fields (SOURCE OF TRUTH)
  currentHitPoints: number,     // Current HP (source of truth)
  hitPointMaximum: number,      // Max HP (source of truth)
  temporaryHitPoints: number,   // Temp HP
  
  // Avatar fields
  avatarUrl: string,            // Custom character avatar
  photoURL: string,             // User profile photo (fallback)
  portraitUrl: string,          // Default token image (fallback)
  
  // Other character data
  abilities: object,
  skills: object,
  proficiencies: array,
  equipment: array,
  spells: array,
  ...
}
```

---

## User Flows

### **Flow 1: Player Updates HP on Character Sheet**
```
1. Player opens character sheet
2. Player changes HP: 25 → 20 (took 5 damage)
3. CharacterSheet.js calls handleHitPointChange(20)
4. Updates Firestore: campaigns/{campaignId}/characters/{userId}
5. Character listener in useTokens detects change
6. Finds all tokens linked to this character (e.g., 2 tokens on current map)
7. Calls syncTokenHPFromCharacter() for each token
8. Token HP updates: 25 → 20 (automatically)
9. All players see token HP change in real-time
```

**Result**: ✅ Character sheet and all tokens show 20/10 HP

---

### **Flow 2: DM Updates HP on Token (Right-click Menu)**
```
1. DM right-clicks token on map
2. DM selects "Adjust HP" → enters -5 (took 5 damage)
3. MapCanvas calls tokenService.updateHP(tokenId, -5, false)
4. tokenService.updateHP() checks: token has characterId?
5. YES → Updates character sheet instead: campaigns/{id}/characters/{userId}
6. Character listener in useTokens detects change
7. Syncs HP to ALL tokens linked to this character (including this one)
8. Token HP updates via listener (not direct update)
```

**Result**: ✅ Character sheet is source of truth, token reflects character HP

---

### **Flow 3: DM Updates HP on Enemy Token (No Character)**
```
1. DM right-clicks enemy token
2. DM selects "Adjust HP" → enters -10
3. MapCanvas calls tokenService.updateHP(tokenId, -10, false)
4. tokenService.updateHP() checks: token has characterId?
5. NO → Updates token HP directly (no character sheet)
6. Token HP updated immediately
```

**Result**: ✅ Enemy token HP updated (not linked to character)

---

### **Flow 4: Multiple Tokens of Same Character**
```
Scenario: Player has 2 tokens on map (duplicate character for some reason)

1. Player updates character sheet HP: 30 → 25
2. Character listener detects change
3. Finds ALL tokens with matching userId + characterId
4. Syncs BOTH tokens: Token A and Token B
5. Both tokens now show 25/30 HP
```

**Result**: ✅ All tokens stay in sync with character sheet

---

## Circular Update Prevention

### **The Problem**:
```
Player Token HP Update → Character Sheet Update → 
  Character Listener Fires → Token HP Update → 
    Character Sheet Update → INFINITE LOOP 💥
```

### **The Solution**:
```javascript
// In tokenService.updateHP():
if (characterId && userId && !fromCharacterSync) {
  // Update character sheet (source of truth)
  await updateDoc(characterRef, { currentHitPoints: newHp });
  return; // Don't update token directly
}

// In tokenService.syncTokenHPFromCharacter():
await updateDoc(tokenRef, { hp: characterData.currentHitPoints });
// Does NOT call updateHP() or update character
```

**Key Points**:
- Token HP changes → Update character only
- Character HP changes → Update tokens only
- Never do both in same operation
- `fromCharacterSync` flag ensures one-way flow

---

## Performance Considerations

### **Listener Efficiency**
```
Scenario: 5 player tokens on map (same player, multiple copies)

OLD (inefficient):
- 5 token listeners × 5 character listeners = 25 total listeners 💀

NEW (optimized):
- 5 token listeners (one per token)
- 1 character listener (shared across all tokens) ✅
Total: 6 listeners
```

**Optimization Strategy**:
- `characterListenersRef` tracks active listeners
- Only ONE listener per unique character
- Listener is created when first token appears
- Listener is removed when last token is removed

### **Firestore Costs**
```
Read Costs:
- Initial token load: N reads (N = number of tokens)
- Character HP update: 1 write + N token updates (N = tokens per character)

Typical Scenario (5-player party, 1 token each):
- 5 token reads on map load
- Player takes damage: 1 character write + 1 token write = 2 writes total
```

**Cost Savings**:
- Character sheet is ALWAYS source of truth (no duplicate HP storage)
- Token HP is derived, not independent
- Updates propagate automatically (no manual sync needed)

---

## Edge Cases Handled

### **1. Token Without Character (Enemies, NPCs, Objects)**
- Token has `characterId: null` or `userId: null`
- HP updates directly on token (no character sync)
- Normal token behavior

### **2. Character Deleted While Tokens Exist**
- Character listener detects deletion
- Listener removed from `characterListenersRef`
- Tokens remain with last known HP values
- DM can continue updating token HP directly

### **3. Multiple Tokens Per Character**
- All tokens linked to same character
- All tokens sync when character HP changes
- Example: Player has "Shadow Clone" spell with 3 copies

### **4. Token Created Before Character**
- Token has `characterId` and `userId`
- Character listener waits for character document
- When character created, listener activates and syncs HP

### **5. Network Latency**
- Character HP updated
- Listener may take 100-500ms to propagate
- UI shows optimistic update (instant feedback)
- Firestore syncs in background

### **6. Offline Mode**
- Character HP updated while offline
- Firestore queues update locally
- When online, update propagates to tokens
- Listeners activate after reconnect

---

## Testing Checklist

### **Character Sheet HP Updates**
- [ ] Update HP on character sheet → token HP updates automatically
- [ ] Increase HP on character sheet → token HP increases
- [ ] Decrease HP on character sheet → token HP decreases
- [ ] Set HP to 0 on character sheet → token HP becomes 0

### **Token HP Updates (Player Token)**
- [ ] Right-click token → Adjust HP → character sheet updates
- [ ] Token takes damage → character HP decreases
- [ ] Token heals → character HP increases
- [ ] Multiple tokens of same character → all sync together

### **Token HP Updates (Enemy Token)**
- [ ] Right-click enemy token → Adjust HP → token updates directly
- [ ] Enemy HP change does NOT affect character sheets
- [ ] Enemy HP persists across page refresh

### **Multiple Tokens**
- [ ] Create 2 tokens of same character
- [ ] Update character HP → both tokens update
- [ ] Update token A HP → character updates → token B syncs
- [ ] Delete token A → token B still syncs with character

### **Edge Cases**
- [ ] Create token without character → HP updates directly
- [ ] Delete character → tokens remain with last HP
- [ ] Token on map A, update character → token on map B also syncs
- [ ] Network disconnect → updates queue and sync when reconnect

### **Performance**
- [ ] 10 tokens on map → only 1-2 character listeners active
- [ ] Remove all tokens → all character listeners cleaned up
- [ ] Switch maps → old listeners cleaned up, new ones created
- [ ] Monitor Firestore console → verify read/write counts

---

## Migration Notes

### **Existing Tokens**
- ✅ All existing tokens already have `characterId` and `userId` fields
- ✅ `characterId` set during token creation in `characterSheetService.js`
- ✅ No data migration needed - system works with existing data

### **Backwards Compatibility**
- ✅ Tokens without `characterId` → HP updates directly (old behavior)
- ✅ Tokens with `characterId` → HP syncs from character (new behavior)
- ✅ No breaking changes

---

## Future Enhancements

### **Potential Improvements**
- [ ] Add "Unlink Token" button (allows independent HP for token)
- [ ] Add "Link Token to Character" feature (retroactively link)
- [ ] Show character HP in token tooltip on hover
- [ ] Add visual indicator when token is linked to character
- [ ] Sync other character stats (AC, speed, conditions)
- [ ] Add "Temp HP" support for tokens
- [ ] Add death save tracking sync
- [ ] Add conditions/status effects sync

---

## Files Modified

### **Modified Files**:
1. `src/services/vtt/tokenService.js`
   - Updated `updateHP()` with character sync logic
   - Added `syncTokenHPFromCharacter()` function
   - Added `getTokensByCharacter()` function

2. `src/hooks/vtt/useTokens.js`
   - Added `characterListenersRef` to track listeners
   - Added `setupCharacterListeners()` function
   - Integrated character listeners into token loading flow

### **Unchanged Files** (Already Correct):
- `src/services/characterSheetService.js` - Already sets `characterId` on token creation
- `src/components/CharacterSheet.js` - Already updates character HP correctly
- `src/models/CharacterSheet.js` - Already has HP fields

---

## Summary

### **What We Built** ✅
- ✅ Character sheets are source of truth for HP
- ✅ Tokens automatically sync HP from character in real-time
- ✅ Player tokens update character when HP changes
- ✅ Enemy tokens update directly (not linked)
- ✅ Multiple tokens per character all stay in sync
- ✅ Circular updates prevented via `fromCharacterSync` flag
- ✅ Efficient listeners (1 per character, not per token)
- ✅ No data migration needed (works with existing data)

### **Benefits** 🎯
- ✅ **Consistency**: HP always matches between character sheet and tokens
- ✅ **Real-time**: Updates propagate instantly to all players
- ✅ **Flexible**: Supports multiple tokens per character
- ✅ **Efficient**: Minimal Firestore reads/writes
- ✅ **Backwards Compatible**: Old tokens still work
- ✅ **Maintainable**: Clean separation of concerns

### **Next Steps** 🚀
1. Test in development environment
2. Create test campaign with multiple players
3. Verify HP sync works in all scenarios
4. Monitor Firestore console for performance
5. Deploy to production
6. Update user documentation

---

**Implementation Date**: October 4, 2025  
**Status**: ✅ Complete - Ready for Testing  
**Priority**: Medium (Per TODO.md)

