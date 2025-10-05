# Party Management & Campaign Settings Implementation Checklist

## Implementation Date
October 2024

---

## Phase 1: CSS Variables & UI Structure ✅

### Token Color CSS Variables ✅
- [x] Renamed `--token-default` to `--player-token-default`
- [x] Added `--npc-token-default: #27ae60`
- [x] Added `--monster-token-default: #e74c3c`
- [x] Added `--enemy-token-default: #c0392b`
- [x] Added `--ally-token-default: #16a085`
- [x] Added `--object-token-default: #95a5a6`
- [x] Added `--hazard-token-default: #f39c12`
- [x] Added `--marker-token-default: #9b59b6`
- [x] Updated all references in components (7 files)

### Party Management UI Updates ✅
- [x] Made xp-badge div permanent (character-badges column)
- [x] Moved character sheet button to character-badges column
- [x] Fixed character-portrait-fallback to show default token (blue circle)
- [x] Updated CSS for character-badges layout
- [x] XP badge now renders in second row when present

---

## Phase 2: Campaign Settings Enhancements ✅

### Milestone vs XP System ✅
- [x] Add "Progression System" section to CampaignSettings
- [x] Add toggle/select: "XP-Based" or "Milestone-Based"
- [x] Store setting in campaign document (`progressionSystem`)
- [x] Default to "XP-Based" for backwards compatibility
- [x] Update PartyManagement to hide XP button when Milestone mode
- [x] Update character cards to hide XP badges when Milestone mode
- [ ] Add "Award Level" button for Milestone mode (DM only) - Future enhancement
- [ ] Create level award modal for Milestone progression - Future enhancement

### Party Management Settings (Already Implemented) ✅
- [x] Added Party Management section to Campaign Settings
- [x] canViewGold toggle (default: false)
- [x] canViewInventory toggle (default: false)
- [x] canViewCharacterSheet toggle (default: false)
- [x] Permission checks implemented in PartyManagement

---

## Phase 3: Character Sheet Panel Integration ⏳

### Character Sheet Button Behavior ⏳
- [ ] Find CharacterSheetPanel component in VTT toolbar
- [ ] Understand panel open/close mechanism
- [ ] Update character sheet button in PartyManagement:
  - [ ] Instead of opening modal, trigger panel open
  - [ ] Pass selected characterUserId to panel
  - [ ] Panel should open to that character's sheet
- [ ] Test: Clicking button opens toolbar panel, not modal

### VTT Toolbar Campaign Settings Button ⏳
- [ ] Find VTT toolbar structure (VTTSession.jsx)
- [ ] Locate Exit button position
- [ ] Add Campaign Settings button next to Exit
- [ ] Create settings access mechanism:
  - Option A: Route to settings page
  - Option B: Modal overlay with settings
  - Option C: Sidebar panel with settings
- [ ] Ensure DM-only access
- [ ] Add appropriate icon and tooltip

---

## Phase 4: Tooltips System ⏳

### Toolbar Tooltips ⏳
**File**: VTTSession.jsx (toolbar buttons)
- [ ] Add `data-tooltip` attribute to each button
- [ ] Add `ref={setTooltipPosition}` callback
- [ ] Replace `title` attributes

**Buttons to update**:
- [ ] Maps button
- [ ] Edit Token button
- [ ] Player View button
- [ ] Fog of War button
- [ ] FX Library button
- [ ] Token Manager button
- [ ] Grid Settings button
- [ ] Campaign Settings button (new)
- [ ] Exit button

### Canvas Control Tooltips ⏳
**File**: MapCanvas.jsx (canvas controls)
- [ ] Zoom in button
- [ ] Zoom out button
- [ ] Fit to screen button
- [ ] Pan mode button
- [ ] Selection mode button
- [ ] Any other canvas controls

### Map Toolbar Tooltips ⏳
**File**: MapToolbar.jsx
- [ ] Layer controls
- [ ] Drawing tools
- [ ] Measurement tools
- [ ] Any other map tools

---

## Phase 5: Token HP Sync System ⏳

### Token Service Updates ⏳
**File**: `src/services/vtt/tokenService.js`

- [ ] Add `characterId` field to token documents
- [ ] Link tokens to character sheets on creation
- [ ] Modify `updateTokenHP` function:
  - [ ] Check if token has characterId
  - [ ] If yes, update character sheet HP instead
  - [ ] Token HP becomes read-only (derived from character)
- [ ] Create `syncTokenHPFromCharacter` function
- [ ] Add Firestore listener in useTokens hook:
  - [ ] Subscribe to character HP changes
  - [ ] Update token display when character HP changes
- [ ] Implement `getTokenWithCharacterHP` helper

### Character Sheet Updates ⏳
**File**: CharacterSheet.js

- [ ] Update HP modification to trigger token sync
- [ ] When HP changes, find associated tokens
- [ ] Update all tokens linked to this character
- [ ] Real-time bidirectional sync

### Architecture
```
Character Sheet (Source of Truth)
         ↓
    HP Changes
         ↓
Firestore Character Document
         ↓
    Token Listener
         ↓
  Token Display Updates
```

---

## Phase 6: Default HP System ⏳

### Character Creation ⏳
**File**: CharacterSheet.js (or character creation service)

- [ ] Set default HP values on new character:
  ```javascript
  currentHP: 10,
  maxHP: 10
  ```
- [ ] Update character creation forms
- [ ] Update character import/migration

### Token Creation ⏳
**File**: tokenService.js

- [ ] Set default HP on new token creation:
  ```javascript
  hp: 10,
  maxHp: 10
  ```
- [ ] Apply to all token types:
  - [ ] Player tokens
  - [ ] Monster tokens
  - [ ] NPC tokens
  - [ ] Enemy tokens

### Monster/NPC Creation ⏳
**Files**: Monster service, NPC service (if separate)

- [ ] Set default HP: 10/10
- [ ] Update monster templates
- [ ] Update NPC templates

---

## Phase 7: Testing & Validation ⏳

### Token Colors Testing
- [ ] Verify all token types display correct default colors
- [ ] Test theme switching (dark/light)
- [ ] Verify CSS variable fallbacks work

### Party Management Testing
- [ ] Character cards display correctly with badges column
- [ ] Character sheet button in right position
- [ ] XP badge appears below button when present
- [ ] Portrait fallback shows blue circle
- [ ] All permission checks work correctly

### Campaign Settings Testing
- [ ] Milestone vs XP system toggle works
- [ ] UI adapts to selected progression system
- [ ] Settings persist correctly
- [ ] All party management toggles work

### Tooltips Testing
- [ ] All toolbar buttons show tooltips
- [ ] Tooltips position correctly (below when possible)
- [ ] Tooltips work on hover and touch
- [ ] No tooltip overlap issues

### Token HP Sync Testing
- [ ] HP changes in character sheet update tokens
- [ ] Multiple tokens linked to same character sync
- [ ] Token HP updates reflect in character sheet
- [ ] No circular update loops
- [ ] Performance acceptable with many tokens

### Default HP Testing
- [ ] New characters have 10/10 HP
- [ ] New tokens have 10/10 HP
- [ ] New monsters/NPCs have 10/10 HP
- [ ] Existing entities unaffected

---

## Priority Order

### High Priority (Do First)
1. ✅ CSS Variables (Complete)
2. ✅ Party Management UI (Complete)
3. 🔄 Campaign Settings - Milestone System (In Progress)
4. ⏳ Character Sheet Panel Integration

### Medium Priority
5. ⏳ VTT Toolbar Settings Button
6. ⏳ Default HP System
7. ⏳ Token HP Sync

### Lower Priority
8. ⏳ Tooltips (already partially implemented)

---

## Notes & Decisions

### Campaign Settings as Central Hub
Campaign Settings page is becoming the central configuration point for many systems:
- Party visibility controls
- Progression system (XP vs Milestone)
- Future: Combat rules, rest mechanics, death saves, etc.

### Milestone System Benefits
- Simplifies progression (no XP tracking)
- Reduces bookkeeping for DM
- Focuses on narrative milestones
- Still allows optional XP for flavor text

### Token HP Sync Architecture
- Character sheet = source of truth
- Tokens subscribe to character HP changes
- One-way sync: Character → Token
- Prevents desync issues
- Supports multiple tokens per character (summons, polymorph, etc.)

---

## Files to Modify Summary

### Already Modified ✅
- App.css (CSS variables)
- TokenProperties.jsx
- TokenPalette.jsx
- ActiveTokenItem.jsx
- TokenManager.jsx
- CampaignDashboard.js
- ActiveTokensTab.css
- CharacterSheet.css
- PartyManagement.js
- PartyManagement.css
- CampaignSettings.js
- CampaignSettings.css

### To Modify ⏳
- CampaignSettings.js (Milestone system)
- VTTSession.jsx (toolbar button, tooltips)
- MapCanvas.jsx (tooltips)
- MapToolbar.jsx (tooltips)
- tokenService.js (HP sync, default HP)
- CharacterSheet.js (HP sync, default HP)
- Character creation services
- Monster/NPC services

---

## Status Legend
- ✅ Complete
- 🔄 In Progress
- ⏳ Pending
- ❌ Blocked
- 🔍 Needs Investigation

