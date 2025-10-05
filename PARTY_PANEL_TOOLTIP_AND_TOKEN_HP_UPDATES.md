# Party Panel & Token HP Updates - Implementation Summary

## ✅ Changes Completed

### 1. Tooltip Width Increase
- **File**: `PartyManagement.css`
- **Changed**: `max-width: 250px` → `max-width: 320px`
- **Added**: `min-width: 120px` for better consistency
- **Result**: Wider tooltips that are easier to read, especially for party composition warnings

### 2. Member Chip Portrait Border Removal
- **File**: `PartyManagement.css`
- **Changed**: Removed `border: 1px solid` from `.mc-portrait`
- **Changed**: Set `background: transparent` (was `var(--bg-light)`)
- **Result**: Clean token images without borders

### 3. Improved Portrait Fallback Logic
- **File**: `PartyManagement.js`
- **Updated**: Portrait priority for member chips and character cards
- **Priority Order**:
  1. `character.avatarUrl` (uploaded to character sheet)
  2. `character.portraitUrl` (legacy field)
  3. `character.photoURL` (user profile picture)
  4. `/assets/default-token.png` (default player token)
  5. Initials fallback (colored circle with letters)
- **Implementation**: Uses `<img>` with `onError` handler to cascade through fallbacks

### 4. Character Sheet Button for Own Character
- **File**: `PartyManagement.js`
- **Added**: 📋 button in character card header (right-aligned)
- **Visibility**: Only shown on logged-in user's own character
- **Functionality**: Opens CharacterSheet modal
- **Styling**: New `.pm-btn-sheet-link` class with hover effects
- **Integration**: Uses existing CharacterSheet component with modal overlay

### 5. Character Sheet Modal Integration
- **Files**: `PartyManagement.js`, `PartyManagement.css`
- **Added**: Character sheet modal state management
- **Imported**: `CharacterSheet` component
- **Props**: Uses `firestore`, `storage`, `campaignId`, `userId`
- **UI**: Full-screen modal with click-outside-to-close

## 🔧 Still To Do

### 6. Make Toolbar & Canvas Control Tooltips Render Below
- **Target Files**: 
  - `MapCanvas.jsx` (canvas control buttons)
  - `MapToolbar.jsx` (toolbar buttons)
  - `VTTSession.jsx` (toolbar center buttons)
- **Approach**: Add `data-tooltip` attributes with `ref={setTooltipPosition}` callbacks
- **Buttons to Update**:
  * Layers button
  * Maps button
  * Edit Token button  
  * Player View button
  * Fog button
  * FX Library button
  * Token Manager button
  * Zoom controls
  * Grid config button
  * Settings button

### 7. Token HP Sync with Character Sheets
- **Target File**: `src/services/vtt/tokenService.js`
- **Current Behavior**: Tokens have independent HP stored in token document
- **Desired Behavior**: Tokens fetch HP from character sheet as source of truth
- **Implementation Steps**:
  1. Update `createToken()` to link to character sheet via `characterId` or `userId`
  2. Add `getTokenWithCharacterHP()` function that joins token + character data
  3. Update `updateHP()` to write back to character sheet instead of token
  4. Add real-time listener that syncs token HP when character sheet HP changes
  5. Set default HP to 10/10 for all new entities (characters, monsters, NPCs)

### 8. Default HP for All Entities
- **Target Files**:
  - `src/models/CharacterSheet.js` (default character template)
  - `src/services/vtt/tokenService.js` (token creation)
  - Any monster/NPC creation services
- **Change**: Set `currentHP: 10, maxHP: 10` as default instead of null/0

## Implementation Notes

### Tooltip System
The custom tooltip system uses:
- `[data-tooltip]` attribute for tooltip text
- `[data-tooltip-position="top|bottom"]` for positioning
- `setTooltipPosition()` ref callback that:
  * Detects if element is in top 50% of parent container
  * Sets `data-tooltip-position="bottom"` for top-half elements
  * Sets `data-tooltip-position="top"` for bottom-half elements
- CSS transitions for smooth appearance

### Character Sheet Integration
The character sheet modal:
- Reuses existing `CharacterSheet` component
- Provides `storage` prop for avatar uploads
- Passes correct `userId` for the character being viewed
- Uses modal overlay that can be closed by clicking outside or X button

### Token-Character HP Sync Architecture
Proposed bidirectional sync:
```javascript
// Option 1: Token stores reference, fetches from character
token: {
  characterId: 'user123',
  // No HP fields - always fetch from character
}

// Option 2: Token caches HP but syncs from character
token: {
  characterId: 'user123',
  currentHP: 45, // Cached from character
  maxHP: 60,     // Cached from character
  lastSyncedAt: timestamp
}

// Option 3: HP writes go to character, token subscribes
// This is the cleanest - single source of truth
character: {
  currentHP: 45,
  maxHP: 60
}
// Token component subscribes to character HP changes
```

## Testing Checklist

- [x] Tooltip width increased and readable
- [x] MC portrait border removed
- [x] Portrait fallback cascade works (avatar → portrait → photo → default)
- [x] Character sheet button appears only on own character
- [x] Character sheet button opens modal correctly
- [x] Modal displays character sheet properly
- [x] Modal closes on X click and outside click
- [ ] Toolbar tooltips render below buttons in top half
- [ ] Canvas control tooltips render below buttons in top half  
- [ ] Token HP fetches from character sheet
- [ ] Token HP updates write to character sheet
- [ ] Character sheet HP changes sync to tokens
- [ ] Default HP is 10/10 for new characters
- [ ] Default HP is 10/10 for new monsters/NPCs

## Files Modified

1. ✅ `src/components/Session/PartyManagement.js` - Added character sheet integration
2. ✅ `src/components/Session/PartyManagement.css` - Tooltip width, portrait styles, sheet button
3. ⏳ `src/components/VTT/Canvas/MapCanvas.jsx` - Add tooltips to canvas buttons
4. ⏳ `src/components/VTT/Canvas/MapToolbar.jsx` - Add tooltips to toolbar buttons
5. ⏳ `src/components/VTT/VTTSession/VTTSession.jsx` - Add tooltips to toolbar center
6. ⏳ `src/services/vtt/tokenService.js` - HP sync with character sheets
7. ⏳ `src/models/CharacterSheet.js` - Default HP values
8. ⏳ `src/hooks/vtt/useTokens.js` - Real-time HP sync

## Related Documentation

- CHARACTER_TOKEN_IMAGES_IMPLEMENTATION.md - Avatar priority system
- PARTY_PANEL_COMPLETE_DOCS.md - Party panel features
- PARTY_PANEL_VISUAL_GUIDE.md - UI components guide
