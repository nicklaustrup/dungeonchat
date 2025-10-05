# Token HP Sync - Quick Reference Card

## 🎯 TL;DR

**Character sheets are the source of truth for HP. Tokens automatically sync.**

---

## Quick Facts

| **Aspect** | **Details** |
|------------|-------------|
| **Source of Truth** | Character Sheet (`campaigns/{id}/characters/{uid}`) |
| **Token HP** | Derived from character (auto-synced) |
| **Enemy Tokens** | Update directly (no character link) |
| **Real-time** | Yes (Firestore listeners) |
| **Circular Updates** | Prevented via `fromCharacterSync` flag |
| **Performance** | 1 listener per character (not per token) |

---

## User Flows

### ✅ Player Token (Linked to Character)
```
Character HP Change → All Linked Tokens Update Automatically
Token HP Change → Character Sheet Updates → All Tokens Sync
```

### ✅ Enemy Token (No Character)
```
Token HP Change → Token Updates Directly (No Character Involved)
```

---

## Code Examples

### **Update Token HP (Automatically Syncs Character)**
```javascript
import { tokenService } from '../../services/vtt/tokenService';

// Player token takes 5 damage
await tokenService.updateHP(
  firestore,
  campaignId,
  mapId,
  tokenId,
  -5,      // Delta (negative = damage, positive = healing)
  false    // isAbsolute (false = delta, true = set exact value)
);

// Result: Character sheet HP decreases by 5, all tokens sync
```

### **Update Character HP (Automatically Syncs Tokens)**
```javascript
import { updateDoc, doc } from 'firebase/firestore';

// Character heals 10 HP
await updateDoc(doc(firestore, 'campaigns', campaignId, 'characters', userId), {
  currentHitPoints: newHP
});

// Result: All tokens linked to this character update automatically
```

### **Create Token Linked to Character**
```javascript
const playerToken = {
  name: 'Gandalf',
  type: 'pc',
  characterId: userId,     // ✅ Links token to character
  userId: userId,          // ✅ Owner of token
  hp: 25,                  // Initial HP (will sync from character)
  maxHp: 25,
  // ... other fields
};

await tokenService.createToken(firestore, campaignId, mapId, playerToken);

// Result: Token HP will sync with character HP automatically
```

### **Create Enemy Token (No Character)**
```javascript
const enemyToken = {
  name: 'Goblin',
  type: 'enemy',
  characterId: null,       // ❌ No character link
  userId: null,            // ❌ No owner
  hp: 10,                  // Independent HP
  maxHp: 10,
  // ... other fields
};

await tokenService.createToken(firestore, campaignId, mapId, enemyToken);

// Result: Token HP updates independently (no character sync)
```

---

## Key Functions

### **tokenService.updateHP()**
Updates token HP. If token is linked to character, updates character instead.

**Signature**:
```javascript
async updateHP(
  firestore,
  campaignId,
  mapId,
  tokenId,
  deltaOrValue,        // HP change amount or absolute value
  isAbsolute = false,  // true = set exact value, false = add/subtract
  fromCharacterSync = false  // Internal flag (DO NOT USE)
)
```

**Examples**:
```javascript
// Take 5 damage
await tokenService.updateHP(firestore, campaignId, mapId, tokenId, -5, false);

// Heal 10 HP
await tokenService.updateHP(firestore, campaignId, mapId, tokenId, 10, false);

// Set HP to exact value (e.g., full heal)
await tokenService.updateHP(firestore, campaignId, mapId, tokenId, 25, true);
```

### **tokenService.syncTokenHPFromCharacter()**
Internal function. DO NOT CALL DIRECTLY. Called automatically by character listeners.

### **tokenService.getTokensByCharacter()**
Get all tokens linked to a specific character.

**Signature**:
```javascript
async getTokensByCharacter(
  firestore,
  campaignId,
  mapId,
  characterId,
  userId
)
```

---

## Data Model

### **Token Document**
```javascript
{
  tokenId: string,
  name: string,
  type: 'pc' | 'enemy' | 'npc' | 'object',
  
  // HP fields (synced from character if linked)
  hp: number,              // Current HP
  maxHp: number,           // Max HP
  
  // Linking fields
  characterId: string | null,  // Links to character (null for enemies)
  userId: string | null,       // Owner (null for enemies)
  
  // Other fields...
}
```

### **Character Document**
```javascript
{
  name: string,
  class: string,
  race: string,
  level: number,
  
  // HP fields (SOURCE OF TRUTH)
  currentHitPoints: number,    // Current HP
  hitPointMaximum: number,     // Max HP
  temporaryHitPoints: number,  // Temp HP
  
  // Other character data...
}
```

---

## Debugging

### **Check if Token is Linked**
```javascript
const token = await tokenService.getToken(firestore, campaignId, mapId, tokenId);

if (token.characterId && token.userId) {
  console.log('✅ Token is linked to character:', token.userId);
  console.log('Token HP will sync from character sheet');
} else {
  console.log('❌ Token is NOT linked to character');
  console.log('Token HP updates independently');
}
```

### **Find All Tokens for a Character**
```javascript
const tokens = await tokenService.getTokensByCharacter(
  firestore,
  campaignId,
  mapId,
  characterId,
  userId
);

console.log(`Found ${tokens.length} tokens for this character`);
```

### **Check Character HP**
```javascript
const characterRef = doc(firestore, 'campaigns', campaignId, 'characters', userId);
const snap = await getDoc(characterRef);

if (snap.exists()) {
  const char = snap.data();
  console.log('Character HP:', char.currentHitPoints, '/', char.hitPointMaximum);
}
```

---

## Common Issues

### **Issue: Token HP Not Syncing**
**Check**:
1. Does token have `characterId` and `userId`?
2. Does character document exist at `campaigns/{id}/characters/{userId}`?
3. Are character listeners active? (Check `characterListenersRef` in useTokens)

### **Issue: Circular Update Loop**
**Fix**:
- Never call `updateHP()` from inside `syncTokenHPFromCharacter()`
- Never update character from inside token listener
- Use `fromCharacterSync` flag correctly

### **Issue: Multiple Tokens Not Syncing**
**Check**:
- All tokens have same `characterId` AND `userId`
- All tokens are on same map (listeners are per-map)
- Character listener is active for this character

---

## Performance Tips

### **Listener Efficiency**
```
✅ GOOD: 1 character listener for 5 tokens = 6 total listeners
❌ BAD: 5 character listeners (one per token) = 10 total listeners
```

Our implementation uses the GOOD pattern!

### **Firestore Costs**
```
Character HP Update:
- 1 write to character document
- N writes to tokens (N = number of tokens for this character)

Example: 1 player with 1 token
- Character HP change = 1 write to character + 1 write to token = 2 writes
```

---

## Testing Checklist

Quick tests to verify system works:

- [ ] Create player token → verify `characterId` and `userId` set
- [ ] Update character HP → verify token HP updates
- [ ] Update token HP → verify character HP updates
- [ ] Create 2 tokens of same character → both sync together
- [ ] Create enemy token → HP updates independently
- [ ] Delete character → tokens remain with last HP

---

## Files to Know

| **File** | **Purpose** |
|----------|-------------|
| `tokenService.js` | Core token operations (updateHP, sync, create) |
| `useTokens.js` | Hook for token state + character listeners |
| `CharacterSheet.js` | Character HP UI and updates |
| `characterSheetService.js` | Character operations + token creation |

---

## Documentation

- **Full Implementation**: See `TOKEN_HP_SYNC_IMPLEMENTATION.md`
- **Architecture Decision**: See `ARCHITECTURE_DECISION_PROFILE_DATA_DENORMALIZATION.md`
- **Username Caching**: See `USERNAME_CACHING_AND_AUDIT.md`

---

**Last Updated**: October 4, 2025  
**Status**: ✅ Implemented - Ready for Testing
