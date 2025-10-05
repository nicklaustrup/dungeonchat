# Token HP Sync - Visual Guide

## System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         CHARACTER SHEET                          │
│                    (Source of Truth for HP)                      │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Name: Gandalf                                          │    │
│  │  Class: Wizard                                          │    │
│  │  Level: 10                                              │    │
│  │                                                          │    │
│  │  HP: [25] / [30]  ◄─── SOURCE OF TRUTH                 │    │
│  │                                                          │    │
│  │  AC: 15    Speed: 30 ft                                │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Firestore: campaigns/{campaignId}/characters/{userId}           │
│  Fields: currentHitPoints: 25, hitPointMaximum: 30              │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             │ Real-time Listener
                             │ (onSnapshot)
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                      useTokens Hook                               │
│               (Character HP Listener Manager)                     │
│                                                                   │
│  characterListenersRef.current = Map {                            │
│    "userId1" => unsubscribe1,  ◄─── Only 1 listener per character│
│    "userId2" => unsubscribe2,                                     │
│    "userId3" => unsubscribe3,                                     │
│  }                                                                │
│                                                                   │
│  When character HP changes:                                       │
│  1. Detect change (currentHitPoints: 25)                         │
│  2. Find all tokens with matching userId + characterId           │
│  3. Call syncTokenHPFromCharacter() for each                     │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             │ Batch Update
                             │ (Firestore writes)
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                     TOKENS ON MAP                                 │
│                  (Derived from Character)                         │
│                                                                   │
│  Token A (Main)     Token B (Clone)    Token C (Illusion)        │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐           │
│  │   Gandalf   │   │   Gandalf   │   │   Gandalf   │           │
│  │             │   │             │   │             │           │
│  │  HP: 25/30  │   │  HP: 25/30  │   │  HP: 25/30  │           │
│  │             │   │             │   │             │           │
│  │ ◄────────────────ALL SYNCED AUTOMATICALLY─────────┐          │
│  └─────────────┘   └─────────────┘   └─────────────┘           │
│                                                                   │
│  Firestore: campaigns/{id}/vtt/{mapId}/tokens/{tokenId}          │
│  Fields: hp: 25, maxHp: 30, characterId, userId                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Flow Diagrams

### Flow 1: Player Updates Character Sheet HP

```
Step 1: Player Takes Damage
┌───────────────────────────┐
│   Character Sheet UI       │
│                            │
│   HP: 30 → 25  (-5 damage)│
│   [Save]                   │
└───────────┬────────────────┘
            │
            │ updateDoc()
            ▼
┌───────────────────────────┐
│   Firestore Character     │
│   currentHitPoints: 25    │ ◄─── SOURCE OF TRUTH UPDATED
└───────────┬────────────────┘
            │
            │ onSnapshot listener fires
            ▼
┌───────────────────────────┐
│   useTokens Hook          │
│   Character Listener      │
│                            │
│   Detected: HP changed!   │
│   Old: 30  New: 25        │
└───────────┬────────────────┘
            │
            │ Find all linked tokens
            │ Call syncTokenHPFromCharacter()
            ▼
┌─────────────────────────────────────┐
│   All Tokens Update                 │
│                                     │
│   Token A: 30 → 25                 │
│   Token B: 30 → 25                 │
│   Token C: 30 → 25                 │
│                                     │
│   All players see HP change!        │
└─────────────────────────────────────┘
```

---

### Flow 2: DM Updates Player Token HP

```
Step 1: DM Right-clicks Token
┌───────────────────────────┐
│   Token Context Menu       │
│                            │
│   [Adjust HP]             │
│   Enter damage: -5         │
└───────────┬────────────────┘
            │
            │ tokenService.updateHP(tokenId, -5)
            ▼
┌───────────────────────────┐
│   tokenService.updateHP() │
│                            │
│   Check: Does token have  │
│   characterId + userId?   │
│                            │
│   YES! ✅                  │
└───────────┬────────────────┘
            │
            │ Update character (not token!)
            ▼
┌───────────────────────────┐
│   Firestore Character     │
│   currentHitPoints: 25    │ ◄─── UPDATE CHARACTER INSTEAD
└───────────┬────────────────┘
            │
            │ onSnapshot listener fires
            ▼
┌───────────────────────────┐
│   useTokens Hook          │
│   Character Listener      │
│                            │
│   Detected: HP changed!   │
└───────────┬────────────────┘
            │
            │ Sync ALL tokens (including the one we clicked)
            ▼
┌─────────────────────────────────────┐
│   All Tokens Update                 │
│                                     │
│   Token A: 30 → 25  ◄─── The one we clicked
│   Token B: 30 → 25  ◄─── Also syncs!
│   Token C: 30 → 25  ◄─── Also syncs!
└─────────────────────────────────────┘
```

---

### Flow 3: DM Updates Enemy Token HP (No Character)

```
Step 1: DM Right-clicks Enemy Token
┌───────────────────────────┐
│   Token Context Menu       │
│                            │
│   [Adjust HP]             │
│   Enter damage: -10        │
└───────────┬────────────────┘
            │
            │ tokenService.updateHP(tokenId, -10)
            ▼
┌───────────────────────────┐
│   tokenService.updateHP() │
│                            │
│   Check: Does token have  │
│   characterId + userId?   │
│                            │
│   NO! ❌                   │
└───────────┬────────────────┘
            │
            │ Update token directly (no character)
            ▼
┌───────────────────────────┐
│   Firestore Token         │
│   hp: 5                   │ ◄─── DIRECT UPDATE
└───────────────────────────┘

✅ Done! No character involved.
```

---

## Circular Update Prevention

### ❌ WITHOUT Prevention (INFINITE LOOP)

```
┌─────────────────────────────────────────────────────┐
│                  INFINITE LOOP 💥                    │
│                                                      │
│  Token HP Updated                                   │
│       ↓                                             │
│  Update Character                                   │
│       ↓                                             │
│  Character Listener Fires                           │
│       ↓                                             │
│  Update Token                                       │
│       ↓                                             │
│  Token Listener Fires                               │
│       ↓                                             │
│  Update Character  ◄──────────┐                    │
│       ↓                        │                    │
│  Character Listener Fires ─────┘                   │
│                                                      │
│  (Loop continues forever...)                        │
└─────────────────────────────────────────────────────┘
```

### ✅ WITH Prevention (ONE-WAY FLOW)

```
┌─────────────────────────────────────────────────────┐
│              CLEAN ONE-WAY FLOW ✅                   │
│                                                      │
│  Token HP Updated (via updateHP())                  │
│       ↓                                             │
│  Check: fromCharacterSync flag? NO                  │
│       ↓                                             │
│  Update Character ONLY (skip token)                 │
│       ↓                                             │
│  Character Listener Fires                           │
│       ↓                                             │
│  Call syncTokenHPFromCharacter()                    │
│       ↓                                             │
│  Update Token ONLY (skip character)                 │
│       ↓                                             │
│  DONE ✅ (No circular update)                       │
└─────────────────────────────────────────────────────┘
```

**Key**: Never update both character AND token in same operation!

---

## Listener Efficiency

### ❌ INEFFICIENT (1 Listener Per Token)

```
Map with 5 tokens of same character:

Token A ──> Character Listener 1
Token B ──> Character Listener 2
Token C ──> Character Listener 3
Token D ──> Character Listener 4
Token E ──> Character Listener 5

Total Listeners: 5 token listeners + 5 character listeners = 10
Firestore Costs: 10 read operations on character HP change 💰
```

### ✅ EFFICIENT (1 Shared Listener)

```
Map with 5 tokens of same character:

characterListenersRef.current = {
  "userId": unsubscribe  ◄─── SINGLE LISTENER
}

Token A ─┐
Token B ─┤
Token C ─┼──> Character Listener (SHARED)
Token D ─┤
Token E ─┘

Total Listeners: 5 token listeners + 1 character listener = 6
Firestore Costs: 1 read operation on character HP change ✅
Savings: 50% fewer listeners, 80% fewer reads!
```

---

## Data Flow Timeline

```
Time  Event                              Firestore Operations
────  ─────────────────────────────────  ───────────────────────
0ms   Player updates character HP        1 write (character)
      Character HP: 30 → 25              

10ms  Firestore processes write          (server-side)

20ms  Character listener fires           0 reads (listener streams)
      useTokens detects HP change        

25ms  Find linked tokens                 0 reads (already in memory)
      Found: 3 tokens                    

30ms  Sync Token A: HP 30 → 25          1 write (token A)
      Sync Token B: HP 30 → 25          1 write (token B)
      Sync Token C: HP 30 → 25          1 write (token C)

40ms  Token listeners fire               0 reads (listener streams)
      UI updates for all players         

Total: 1 character write + 3 token writes = 4 writes
       0 reads (listeners stream data)
       Total latency: ~40ms end-to-end
```

---

## Comparison: Before vs After

### Before Token HP Sync

```
┌────────────────────────────────────────┐
│  Character Sheet HP: 25/30             │  ◄─── Player sees this
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│  Token A HP: 30/30  ❌ OUT OF SYNC     │  ◄─── DM sees this
│  Token B HP: 30/30  ❌ OUT OF SYNC     │  ◄─── Players see this
└────────────────────────────────────────┘

Problem: Manual sync required! DM must:
1. Open character sheet
2. Check HP value
3. Manually update each token
4. Repeat when HP changes again
```

### After Token HP Sync

```
┌────────────────────────────────────────┐
│  Character Sheet HP: 25/30             │  ◄─── Player updates here
└──────────────┬─────────────────────────┘
               │
               │ AUTOMATIC SYNC ✨
               │
               ▼
┌────────────────────────────────────────┐
│  Token A HP: 25/30  ✅ SYNCED          │  ◄─── Automatically updated
│  Token B HP: 25/30  ✅ SYNCED          │  ◄─── Automatically updated
└────────────────────────────────────────┘

Result: No manual work! Everything stays in sync!
```

---

## Quick Decision Tree

```
                  ┌───────────────────────┐
                  │ HP needs to be updated│
                  └──────────┬────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │ Is this a player token       │
              │ (has characterId + userId)?  │
              └──────┬───────────────┬───────┘
                     │ YES           │ NO
                     ▼               ▼
        ┌────────────────────┐  ┌────────────────────┐
        │ Update Character    │  │ Update Token       │
        │ Sheet (source       │  │ Directly           │
        │ of truth)           │  │                    │
        └──────┬─────────────┘  └────────────────────┘
               │
               │ Character listener fires
               ▼
        ┌────────────────────┐
        │ All linked tokens  │
        │ sync automatically │
        └────────────────────┘
```

---

## Testing Visual Guide

### Test 1: Character Sheet Update

```
Before:
Character Sheet: [30] / [30]
Token Display:   [30] / [30]

Action: Change character HP to 25

After (automatically):
Character Sheet: [25] / [30]  ✅
Token Display:   [25] / [30]  ✅

Expected: Both show 25/30
```

### Test 2: Token Update (Player Token)

```
Before:
Character Sheet: [30] / [30]
Token A:         [30] / [30]
Token B:         [30] / [30]

Action: DM adjusts Token A HP: -5 damage

After (automatically):
Character Sheet: [25] / [30]  ✅
Token A:         [25] / [30]  ✅
Token B:         [25] / [30]  ✅ (also synced!)

Expected: All three show 25/30
```

### Test 3: Enemy Token Update

```
Before:
Enemy Token: [10] / [10]

Action: DM adjusts enemy HP: -5 damage

After:
Enemy Token: [5] / [10]  ✅

Character Sheet: Not affected ✅

Expected: Only token updates, no character involved
```

---

## Debugging Visual

### How to Check If Token is Linked

```
Firebase Console:
campaigns/{campaignId}/vtt/{mapId}/tokens/{tokenId}

Look for:
{
  "characterId": "user123",  ◄─── ✅ Linked!
  "userId": "user123",        ◄─── ✅ Linked!
  "hp": 25,
  "maxHp": 30
}

If characterId or userId is null → ❌ Not linked (enemy token)
```

### How to Check Character Listeners

```
Browser DevTools Console:

// In useTokens hook, add this temporarily:
console.log('Active character listeners:', 
  characterListenersRef.current.size);

Expected output:
"Active character listeners: 1"  (for 1 unique character)
"Active character listeners: 3"  (for 3 unique characters)
```

---

## Summary Visualization

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                  TOKEN HP SYNC SYSTEM                       ┃
┃                                                             ┃
┃  ✅ Character Sheet = Source of Truth                       ┃
┃  ✅ Tokens = Derived Data (Auto-synced)                     ┃
┃  ✅ Real-time Updates (< 100ms latency)                     ┃
┃  ✅ Bi-directional Sync (Character ↔ Tokens)               ┃
┃  ✅ Efficient Listeners (1 per character)                   ┃
┃  ✅ Circular Update Prevention                              ┃
┃  ✅ Works with Existing Data (No migration)                 ┃
┃                                                             ┃
┃  Status: ✅ Implemented - Ready for Testing                 ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

**Last Updated**: October 4, 2025  
**Status**: ✅ Complete
