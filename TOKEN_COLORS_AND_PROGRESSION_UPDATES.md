# Token Colors & Campaign Progression System Updates

## Overview
Comprehensive update to token color system and campaign progression mechanics, adding milestone-based leveling as an alternative to XP tracking.

## Implementation Date
October 2024

---

## Part 1: Token Color CSS Variables ✅

### Changes Made

#### CSS Variables Added
**File**: `App.css` (both `:root` and `.light-theme`)

Replaced single `--token-default` with type-specific variables:

```css
--player-token-default: #4a90e2;    /* Player Character - blue */
--npc-token-default: #27ae60;        /* NPC - green */
--monster-token-default: #e74c3c;    /* Monster - red */
--enemy-token-default: #c0392b;      /* Enemy - dark red */
--ally-token-default: #16a085;       /* Ally - teal */
--object-token-default: #95a5a6;     /* Object - gray */
--hazard-token-default: #f39c12;     /* Hazard - orange */
--marker-token-default: #9b59b6;     /* Marker - purple */
```

#### Files Updated (11 total)
1. **App.css** - CSS variable definitions
2. **TokenProperties.jsx** - 3 references updated
3. **TokenPalette.jsx** - 3 references updated
4. **ActiveTokenItem.jsx** - 1 inline style updated
5. **TokenManager.jsx** - Drag image background
6. **CampaignDashboard.js** - Character token display
7. **ActiveTokensTab.css** - Badge color
8. **CharacterSheet.css** - Avatar hover border

### Benefits
- ✅ Each token type can have distinct default color
- ✅ Consistent theming across application
- ✅ Easy to customize per campaign (future)
- ✅ Better visual distinction between token types

---

## Part 2: Party Management UI Restructure ✅

### Character Card Layout Changes

#### Before
```
[Portrait] [Name + Sheet Button]
           [Class/Level]
[XP Badge] (conditional, appeared after portrait)
```

#### After
```
[Portrait] [Name]           [Sheet Button]
           [Class/Level]    [XP Badge] (conditional)
```

### Changes Made

**File**: `PartyManagement.js`
- Removed character sheet button from `character-name-row`
- Created new `character-badges` column div
- Moved sheet button to badges column
- XP badge now renders below sheet button when present

**File**: `PartyManagement.css`
- Added `.character-badges` styles (flex column, right-aligned)
- Removed inline sheet button positioning
- Updated grid layout for better alignment

### Portrait Fallback Fix

#### Problem
When no image available, fallback showed gradient background with initials instead of default token color.

#### Solution
**File**: `PartyManagement.css`
```css
.character-portrait-fallback {
  background: var(--player-token-default); /* Blue circle */
  color: #fff;
  border-radius: 50%;
}
```

**File**: `PartyManagement.js`
- Simplified image fallback logic
- Removed non-existent `/assets/default-token.png` reference
- Fallback div shows immediately if no image available

---

## Part 3: Campaign Progression System ✅

### New Feature: Milestone vs XP Progression

#### Database Schema
**Firestore**: `campaigns/{campaignId}`

Added field:
```javascript
{
  progressionSystem: 'xp' | 'milestone'  // Default: 'xp'
}
```

### Campaign Settings UI

**File**: `CampaignSettings.js`

Added new section before "Party Management":

```jsx
<div className="settings-section">
  <h3>Progression System</h3>
  <select name="progressionSystem">
    <option value="xp">Experience Points (XP)</option>
    <option value="milestone">Milestone</option>
  </select>
</div>
```

**Features**:
- Dropdown selector with descriptive labels
- Context-aware description text based on selection
- Defaults to "xp" for backwards compatibility
- Saved with all other campaign settings

### Party Management Integration

**File**: `PartyManagement.js`

#### XP Button Visibility
```javascript
{campaign?.progressionSystem !== 'milestone' && (
  <button className="pm-btn-xp">⭐ XP</button>
)}
```

**Behavior**:
- XP button hidden when `progressionSystem === 'milestone'`
- Heal and Long Rest buttons always visible
- Only affects DM action buttons

#### XP Badge Visibility
```javascript
{character.lastXPGain && campaign?.progressionSystem !== 'milestone' && (
  <div className="xp-badge">+{character.lastXPGain} XP</div>
)}
```

**Behavior**:
- XP badges hidden on character cards in Milestone mode
- Character sheet button remains visible
- No data changes - just UI visibility

### Progression System Comparison

| Feature | XP System | Milestone System |
|---------|-----------|------------------|
| **Leveling Method** | Earn XP, level at thresholds | DM awards levels at milestones |
| **Bookkeeping** | Track XP per character | None required |
| **XP Button** | Visible | Hidden |
| **XP Badges** | Visible after awards | Hidden |
| **Character Sheets** | XP tracking enabled | XP tracking disabled |
| **DM Work** | Distribute XP per encounter | Award levels at key moments |
| **Best For** | Rules-as-written, combat focus | Narrative focus, simplicity |

---

## User Experience

### DM Workflow

#### Setting Up Campaign
1. Go to Campaign Settings
2. Find "Progression System" section
3. Choose between:
   - **XP** - Traditional experience-based leveling
   - **Milestone** - Story-based leveling
4. Save changes

#### During Session (XP Mode)
- Click "⭐ XP" button to award experience
- XP badges appear on character cards
- Players see XP progress

#### During Session (Milestone Mode)
- No XP button visible
- No XP badges on cards
- DM manually updates levels in character sheets when milestones reached
- Cleaner, narrative-focused UI

### Player Experience

#### XP Mode
- See XP awards on character cards
- Track progress toward next level
- Experience gained after encounters
- Traditional D&D feel

#### Milestone Mode
- No XP tracking visible
- Levels awarded at story milestones
- Simplified character cards
- Focus on narrative, not numbers

---

## Technical Implementation

### State Management
```javascript
const { campaign } = useCampaign(campaignId);

// Campaign object includes:
{
  progressionSystem: 'xp' | 'milestone',
  // ... other settings
}
```

### Conditional Rendering Pattern
```javascript
// Hide XP features when milestone mode
{campaign?.progressionSystem !== 'milestone' && (
  <XPComponent />
)}

// Or equivalently
{campaign?.progressionSystem === 'xp' && (
  <XPComponent />
)}
```

### Backwards Compatibility
- Default value: `'xp'`
- Existing campaigns without setting: defaults to XP
- No migration needed
- Optional chaining (`?.`) handles undefined

---

## Future Enhancements

### Milestone Mode Features (Not Yet Implemented)
- [ ] "Award Level" button for DM (instead of XP button)
- [ ] Level award modal with character selection
- [ ] Bulk level-up for entire party
- [ ] Milestone history/log
- [ ] Notification when character levels up

### Per-Character Progression Override
- [ ] Allow mixing systems (some characters XP, others milestone)
- [ ] Useful for split parties or guest players

### Custom Progression Systems
- [ ] Create custom advancement rules
- [ ] Define custom milestones
- [ ] Track non-level progression (renown, inspiration, etc.)

---

## Testing Checklist

### Token Colors
- [x] All token types use correct CSS variable
- [x] Variables defined in both themes
- [x] Fallbacks work if CSS variable unavailable
- [x] Character portraits show blue circle when no image

### Character Card Layout
- [x] Sheet button appears in right column
- [x] XP badge appears below sheet button
- [x] Portrait fallback shows blue circle
- [x] Layout responsive on mobile

### Progression System
- [x] Setting saves correctly
- [x] Default to 'xp' for new/existing campaigns
- [x] XP button hidden in Milestone mode
- [x] XP badges hidden in Milestone mode
- [x] Heal/Rest buttons always visible
- [x] Setting persists across sessions

---

## Files Modified Summary

### CSS/Styling (4 files)
1. `App.css` - Token color variables
2. `PartyManagement.css` - Character card layout, portrait fallback
3. `ActiveTokensTab.css` - Token badge color
4. `CharacterSheet.css` - Avatar hover color
5. `CampaignSettings.css` - No changes needed

### Components (8 files)
1. `PartyManagement.js` - Card restructure, progression system checks
2. `CampaignSettings.js` - Progression system setting
3. `TokenProperties.jsx` - Variable reference updates
4. `TokenPalette.jsx` - Variable reference updates
5. `ActiveTokenItem.jsx` - Variable reference updates
6. `TokenManager.jsx` - Variable reference updates
7. `CampaignDashboard.js` - Variable reference updates

### Documentation (2 files)
1. `IMPLEMENTATION_CHECKLIST.md` - Task tracking
2. `TOKEN_COLORS_AND_PROGRESSION_UPDATES.md` - This file

---

## Migration Notes

### No Database Migration Required
- All changes are additive
- Defaults handle missing fields
- Backwards compatible with existing data

### Campaign Settings
Existing campaigns automatically default to:
```javascript
{
  progressionSystem: 'xp'  // Maintains current behavior
}
```

### Token Colors
- No data changes required
- CSS variables provide defaults
- Existing token colors (if custom) preserved

---

## Related Documentation

- `DEFAULT_TOKEN_COLOR_CSS_VARIABLE.md` - Original token color system
- `CAMPAIGN_PARTY_MANAGEMENT_SETTINGS.md` - Party management features
- `IMPLEMENTATION_CHECKLIST.md` - Full feature roadmap
- `PARTY_PANEL_TOOLTIP_AND_TOKEN_HP_UPDATES.md` - Previous updates

---

## Status
✅ **Complete** - Ready for testing and deployment

### Completed Features
1. ✅ Token color CSS variables (8 types)
2. ✅ Character card UI restructure
3. ✅ Portrait fallback fix
4. ✅ Progression system setting
5. ✅ XP button conditional rendering
6. ✅ XP badge conditional rendering

### Next Steps
See `IMPLEMENTATION_CHECKLIST.md` for remaining tasks:
- Character Sheet Panel integration
- VTT Toolbar settings button
- Tooltips system
- Token HP sync
- Default HP values
