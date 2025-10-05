# Party Panel Sidebar Enhancement Plan

**Date:** October 4, 2025  
**Component:** PartyManagement  
**Files:** `PartyManagement.js`, `PartyManagement.css`

---

## Overview
Enhance the Party Management sidebar panel with character sheet previews, inventory placeholder, improved member strip with portraits, and proper container constraints.

---

## Implementation Phases

### ✅ Phase 1: CSS Container Constraints
**Goal:** Prevent party-management div from extending beyond sidebar-content

**Tasks:**
- [x] Add max-width constraint to `.party-management`
- [x] Ensure responsive behavior when sidebar is resized
- [x] Test with various sidebar widths

**Technical Details:**
- Set `max-width: 100%` on `.party-management`
- Add `box-sizing: border-box` to prevent overflow
- Ensure all child elements respect parent width

**Status:** ✅ COMPLETE - Added max-width, box-sizing, and overflow-x:hidden

---

### ✅ Phase 2: Member Strip Character Portraits
**Goal:** Add character portraits to member chips

**Tasks:**
- [x] Add portrait image element to member chips
- [x] Style portrait with circular/rounded design
- [x] Implement fallback for missing portraits
- [x] Adjust chip layout to accommodate portrait
- [x] Ensure portrait scales properly

**Technical Details:**
- Add `avatarUrl` or `portraitUrl` field check
- Use CSS for circular cropping
- Fallback to initials or default icon
- Position portrait on left side of chip

**Status:** ✅ COMPLETE - Added portrait with 48x48 size, gradient fallback with initials

---

### ✅ Phase 3: Active Member Selection State
**Goal:** Add visual indicator for selected/active member

**Tasks:**
- [x] Add state for selected character ID
- [x] Add CSS class for active member chip
- [x] Implement border/highlight on active chip
- [x] Handle click events to set active member
- [x] Ensure only one member can be active at a time

**Technical Details:**
- State: `const [selectedCharacterId, setSelectedCharacterId] = useState(null)`
- CSS: `.member-chip.active { border: 2px solid var(--primary-color); }`
- Add visual distinction (e.g., blue border, shadow)

**Status:** ✅ COMPLETE - Active state with blue border and shadow, smooth transitions

---

### ✅ Phase 4: Character Sheet Preview Panel
**Goal:** Display character sheet details when member is selected

**Tasks:**
- [x] Create character sheet preview section
- [x] Display character portrait (larger version)
- [x] Show level, experience, class, and race
- [x] Style with card layout
- [x] Add "View Full Sheet" button
- [x] Handle case when no character is selected

**Technical Details:**
- Conditional render based on `selectedCharacterId`
- Layout: Portrait + Stats Grid
- Stats to show:
  - Level
  - Experience / Next Level
  - Class
  - Race
  - Ability Scores (abbreviated)
  - Proficiency Bonus
- Button to open full character sheet (future feature)

**Status:** ✅ COMPLETE - Full preview with 64x64 portrait, all ability scores, experience, proficiency, and close button

---

### ✅ Phase 5: Inventory Placeholder
**Goal:** Add inventory section with "Coming Soon" message

**Tasks:**
- [x] Create inventory section below character sheet
- [x] Add "Inventory" header
- [x] Display "Coming Soon" message
- [x] Style as card/panel
- [x] Add appropriate spacing

**Technical Details:**
- Simple card with:
  - Header: "📦 Inventory"
  - Body: "Coming Soon - Inventory management will be available in a future update"
- Styled consistently with other panels
- Subtle styling to indicate it's a placeholder

**Status:** ✅ COMPLETE - Dashed border placeholder with icon and coming soon message

---

### ⬜ Phase 6: Full Character Sheet Modal/Sidebar
**Goal:** Implement "View Full Sheet" functionality

**Tasks:**
- [ ] Create modal or expanded sidebar view
- [ ] Display complete character sheet data
- [ ] Include all abilities, skills, spells, etc.
- [ ] Add close/back button
- [ ] Ensure responsive design

**Technical Details:**
- Could be modal overlay or replace sidebar content
- Fetch full character data if not already loaded
- Organized tabs/sections:
  - Overview
  - Abilities & Skills
  - Equipment & Inventory
  - Spells (if applicable)
  - Background & Features

---

## Progress Tracker

| Phase | Status | Completion Date | Notes |
|-------|--------|-----------------|-------|
| 1. Container Constraints | ✅ Complete | Oct 4, 2025 | Max-width applied |
| 2. Member Portraits | ✅ Complete | Oct 4, 2025 | Portrait with fallback initials |
| 3. Active Selection | ✅ Complete | Oct 4, 2025 | Blue border on active chip |
| 4. Character Preview | ✅ Complete | Oct 4, 2025 | Full stats with abilities |
| 5. Inventory Placeholder | ✅ Complete | Oct 4, 2025 | Coming soon message |
| 6. Full Character Sheet | ⬜ Not Started | - | Future enhancement |

---

## Technical Considerations

### Character Data Structure
Based on the existing code, characters have:
- `id`, `name`, `level`, `class`
- `race` (may need to add if missing)
- `currentHP`, `maxHP`, `armorClass`
- `experience`, `gold`
- `abilityScores` (object with str, dex, con, wis, int, cha)
- `avatarUrl` or similar (check database schema)

### Sidebar Width Management
- Current sidebar can be resized by user
- Need to ensure content adapts gracefully
- Use responsive grid/flex layouts
- Test with minimum and maximum sidebar widths

### State Management
- Selected character state at PartyManagement level
- Consider lifting state if needed for other features
- Ensure performance with real-time Firebase updates

### Styling Consistency
- Match existing VTT theme (dark mode support)
- Use existing CSS variables
- Maintain visual hierarchy
- Smooth transitions for interactions

---

## Implementation Complete! ✅

All phases (1-5) have been successfully implemented:

1. ✅ Phase 1 - Container Constraints
2. ✅ Phase 2 - Character Portraits with Fallback
3. ✅ Phase 3 - Active Member Selection
4. ✅ Phase 4 - Character Sheet Preview
5. ✅ Phase 5 - Inventory Placeholder

## Next Steps (Testing & Future)
1. Test with real character data in the application
2. Verify portrait URLs work with database schema
3. Test responsive behavior at various screen sizes
4. Plan Phase 6 (Full Character Sheet Modal)
5. Consider implementing inventory system
