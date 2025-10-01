# Token Enhancement Implementation Plan

## Overview
Major VTT improvements for token interaction, combat readiness, and DM character management.

## Features

### 1. Token Movement Visuals ✨
**Status**: In Progress

#### Ghost Placeholder
- Semi-transparent copy of token remains at start position during drag
- Helps DM/players track original position
- Fades out on drag end

#### Movement Ruler
- Line drawn from start position to current drag position
- Shows distance in feet (5ft per grid square)
- Color-coded for combat:
  - **Green**: Within movement range (speed - terrain)
  - **Red**: Exceeds movement range
  - **Default (white/yellow)**: Out of combat

#### Grid-based Movement Validation
- When snap-to-grid enabled during combat:
  - **Green cells**: Valid moves (within speed)
  - **Red cells**: Invalid moves (too far)
- Accounts for:
  - Character speed
  - Status effects (restrained, prone, slowed)
  - Difficult terrain (future)

**Files to Modify**:
- `TokenSprite.jsx` - Add ghost rendering, drag state
- `MapCanvas.jsx` - Track drag start, calculate distance, render ruler
- New: `MovementRuler.jsx` - Ruler component with distance calculation
- New: `useTokenMovement.js` - Hook for movement validation logic

---

### 2. Quick HP Adjustment 🩸
**Status**: In Progress

#### Context Menu Enhancement
- Add up/down caret buttons next to HP display
- Click ⬆️ to add 1 HP
- Click ⬇️ to subtract 1 HP
- Visual feedback on HP change
- No modal/input needed for small adjustments

**Files to Modify**:
- `TokenContextMenu.jsx` - Add caret buttons, handle quick adjust
- `TokenContextMenu.css` - Style for inline HP controls

---

### 3. Enhanced Token Manager 📋
**Status**: Planned

#### Full Character Sheet Integration
DM can click token → "Open in Token Manager" to access:

**Attributes Tab**:
- STR, DEX, CON, INT, WIS, CHA
- Proficiency bonus
- Armor Class (AC)
- Initiative bonus
- Speed

**Skills & Abilities Tab**:
- Spell list with spell slots
- Special abilities
- Actions, Bonus Actions, Reactions
- Passive Perception

**Inventory Tab**:
- Items carried
- Equipment slots (armor, weapons)
- Weight/encumbrance
- DM can add loot to token inventory

**Combat Tab**:
- Current HP/Max HP/Temp HP
- Hit Dice
- Death Saves
- Conditions/Status Effects
- Exhaustion level

**Files to Create**:
- `TokenAttributesPanel.jsx` - Attributes editor
- `TokenSkillsPanel.jsx` - Skills and spells
- `TokenInventoryPanel.jsx` - Inventory management
- `TokenCombatPanel.jsx` - Combat stats
- Update `TokenManager.jsx` - Add tabbed interface

---

## Implementation Order

### Phase 1: Movement Visuals (Current)
1. ✅ Create `MovementRuler.jsx` component
2. ✅ Create `useTokenMovement.js` hook
3. ✅ Update `TokenSprite.jsx` for ghost + drag tracking
4. ✅ Update `MapCanvas.jsx` for ruler rendering
5. ✅ Add grid validation overlay
6. ✅ Test with combat/non-combat scenarios

### Phase 2: Quick HP (Next)
1. Update `TokenContextMenu.jsx` - Add ⬆️⬇️ buttons
2. Style inline HP controls
3. Test increment/decrement
4. Add animation for HP changes

### Phase 3: Enhanced Token Manager (Final)
1. Design tab interface for TokenManager
2. Create attribute panel with D&D stat block
3. Create skills/spells panel
4. Create inventory panel with drag-drop
5. Integrate with character sheet service
6. Add loot distribution system

---

## Technical Notes

### Movement Validation Logic
```javascript
// Calculate distance moved (in feet)
const gridSize = 50; // pixels per square
const feetPerSquare = 5;
const distancePixels = Math.sqrt(dx*dx + dy*dy);
const distanceFeet = (distancePixels / gridSize) * feetPerSquare;

// Check if within movement range
const characterSpeed = token.speed || 30; // feet
const hasRestrained = token.statusEffects?.some(e => e.name === 'Restrained');
const effectiveSpeed = hasRestrained ? characterSpeed / 2 : characterSpeed;

const isValidMove = distanceFeet <= effectiveSpeed;
```

### Grid Cell Validation
- Calculate which grid cells token will occupy
- For each cell, check distance from start
- Color accordingly (green/red)
- Only show during combat encounters

### Status Effects That Affect Movement
- Restrained: Speed halved
- Grappled: Speed = 0
- Prone: Costs extra movement to stand
- Slowed: Speed halved
- Hasted: Speed doubled
- Encumbered: Speed reduced by 10ft

---

## Dependencies
- React Konva for canvas rendering
- Firestore for token data persistence
- Initiative service for combat state detection
- Character sheet service (existing or new)

---

## Testing Checklist
- [ ] Ghost token appears during drag
- [ ] Ruler shows correct distance
- [ ] Green/red coloring works in combat
- [ ] Snap-to-grid validation shows correct cells
- [ ] HP carets increment/decrement correctly
- [ ] Token Manager tabs switch properly
- [ ] Attributes save to Firestore
- [ ] Inventory items can be added/removed
- [ ] Loot distribution works for multiple players

---

## Future Enhancements
- Pathfinding with obstacles
- Area of effect templates
- Automatic difficult terrain detection
- Token vision cones
- Line of sight calculations
