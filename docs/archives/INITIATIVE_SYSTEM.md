# Initiative System Documentation

This document explains the Initiative Tracking subsystem and how it aligns with the broader Campaign System Strategy.

## Purpose
Provide a per-campaign real-time combat tracker that supports:
- Turn order sequencing
- Round progression
- Combatant HP, conditions, type (player / npc / enemy)
- DM-only controls (start/end combat, advance/rewind turns)
- Future extensibility (dice rolling, session logs, character sheet integration)

## Firestore Data Model
Document path (one per campaign):
```
/campaigns/{campaignId}/sessions/initiative
```
Fields:
```
combatants: [
  {
    id: string,            // unique id cmb_<timestamp>_<rand> or character_*
    name: string,
    initiative: number,    // higher first
    maxHP?: number,
    currentHP?: number,
    type: 'character' | 'npc' | 'enemy',
    conditions: string[]
  }
]
currentTurn: number          // index into sorted combatants array
round: number                 // >= 1
isActive: boolean             // combat state
createdAt: serverTimestamp
lastModified: serverTimestamp
```

## Lifecycle
1. First add initializes document automatically (transactional)
2. DM adds combatants (manual or future: character imports / auto-rolls)
3. DM Starts Combat -> sorts by initiative descending, resets currentTurn = 0, round = 1
4. Next Turn -> increments index; rolls to next round when index wraps
5. End Combat -> isActive=false, currentTurn=0 (combatants retained for restart/edit)

## Concurrency & Integrity
All mutating operations now use Firestore `runTransaction` to avoid race conditions:
- Add / Remove combatant
- HP update
- Condition add/remove

Prevents:
- Duplicate combatant IDs
- Lost updates during simultaneous HP or condition edits

## Security (Assumptions)
Firestore rules should restrict writes under `/campaigns/{campaignId}/sessions/initiative` to:
- DM: full read/write
- Players: read, limited sub-field updates (future enhancement if needed)

## UI Components
- `InitiativeButton` (summary status) subscribes to document.
- `InitiativeTracker` full panel with DM controls + real-time list.

## API (initiativeService)
| Function | Description |
|----------|------------|
| getInitiativeRef | Returns doc ref (no side effects) |
| ensureInitiativeDocument | Idempotently creates doc if missing |
| getInitiativeData | Lazy initialize + return data |
| addCombatant | Transactional append with duplicate guard |
| removeCombatant | Transactional removal + turn index normalization |
| updateCombatantHP | Transactional bounded update |
| addCondition/removeCondition | Transactional condition management |
| startCombat | Sort & activate (requires >=1 combatant) |
| endCombat | Deactivate |
| nextTurn/previousTurn | Turn navigation w/ round logic |
| subscribeToInitiative | Snapshot listener wrapper |

## Error Handling
Service throws user-friendly errors; UI currently surfaces generic messages.
Recommended follow-up: map error codes to toasts / inline banners.

## Planned Enhancements (from Campaign Strategy)
- Character sheet integration: auto-populate HP & initiative (roll + modifier)
- Session logs: persist combat events (turn changes, HP deltas) to a `sessions/{sessionId}/combatLog` collection
- Dice rolling integration for initiative + attacks
- Campaign calendar cross-linking encounters
- DM tools: condition presets & bulk apply

## Migration Notes
If older code referenced a different path (`/session/initiative`), ensure all instances updated to `/sessions/initiative` and redeploy rules.

## Integration Checklist
- [x] Path correctness (even segment count)
- [x] Auto initialization
- [x] Transaction safety
- [x] Unique combatant IDs
- [ ] Security rules enforcement (verify deployed)
- [ ] Unit tests / integration tests (future)

## Quick Usage Example
```js
const ref = initiativeService.getInitiativeRef(firestore, campaignId);
await initiativeService.addCombatant(firestore, campaignId, {
  id: 'cmb_temp',
  name: 'Goblin',
  initiative: 14,
  type: 'enemy',
  conditions: []
});
await initiativeService.startCombat(firestore, campaignId);
await initiativeService.nextTurn(firestore, campaignId);
```

## Testing Suggestions
1. Parallel adds (open two browsers) – ensure no duplicate / lost combatants
2. Rapid turn navigation while adding HP adjustments – verify consistency
3. Remove current combatant at last index – turn wraps to 0 safely
4. Add conditions quickly from two clients – no duplicates

---
Feel free to extend this doc as new combat features ship.
