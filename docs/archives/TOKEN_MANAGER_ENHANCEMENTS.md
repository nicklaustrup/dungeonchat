# Token Manager Enhancements

## Overview
Major improvements to token management interface and UX, consolidating functionality and adding quality-of-life features.

## Changes Implemented

### 1. ✅ Removed Delete Token Button from Header
**File:** `VTTSession.jsx`

**Change:** Removed redundant "Delete Token" button from the toolbar header since this functionality is already available in the right-click context menu.

**Benefit:** Cleaner toolbar UI, reduces duplicate controls.

---

### 2. ✅ Green Movement Ruler
**File:** `TokenSprite.jsx`

**Change:** Changed ruler line color from white (`#ffffff`) to green (`#22c55e`) for better visibility and player-friendly appearance.

**Visual:** 
- Before: White dashed line
- After: Green dashed line (matches player theme)

**Benefit:** More intuitive visual feedback during token movement, green indicates "go" action.

---

### 3. ✅ HP Quick Adjustment Buttons
**File:** `TokenContextMenu.jsx`
**CSS:** `TokenContextMenu.css`

**Change:** Added caret up/down buttons next to HP display for quick ±1 HP adjustments.

**Features:**
- ▲ (Up Caret): Increase HP by 1 (green color)
- ▼ (Down Caret): Decrease HP by 1 (red color)
- Positioned inline next to HP value for quick access
- Original manual input field still available for larger adjustments

**CSS Added:**
```css
.hp-quick-adjust { display:flex; gap:2px; margin-left:auto; }
.hp-btn { background:#333; border:1px solid #444; color:#22c55e; width:24px; height:20px; border-radius:3px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:10px; padding:0; }
.hp-btn:hover { background:#444; }
.hp-btn.hp-decrease { color:#ef4444; }
```

**Benefit:** Faster HP tracking during combat, no need to type for small adjustments.

---

### 4. ✅ Consolidated Token Manager Interface
**Files:** `TokenManager.jsx`, `TokenPalette.jsx`
**CSS:** `TokenPalette.css`

#### A. Removed Redundant Properties Tab
**Before:** 
- Palette Tab: Create new tokens
- Properties Tab: Edit selected token

**After:**
- Palette Tab: Create new tokens OR edit selected token (dual-purpose)
- Properties tab removed (redundant functionality)

#### B. Palette Now Pre-fills with Selected Token
When a token is selected on the map:
- Palette tab automatically activates
- Form pre-fills with token's current values:
  - Name
  - Type (PC, NPC, Monster, etc.)
  - Color
  - Size
- Tab label shows "(Editing)" indicator
- Shows token preview image if available
- "Create Token" button changes to "Save Changes"
- Changes tracked, button only enabled when modifications exist

#### C. Added Character Sheet & Inventory Buttons
**New UI Elements:**
- 📋 Character Sheet button
- 🎒 Inventory button
- Grid layout for easy access
- Placeholder views with "coming soon" messaging

**Features Planned:**
- Character Sheet: DM-editable attributes for on-the-fly modifications during games
- Inventory: Track items, equipment, and loot

**CSS Added:**
```css
.token-info-header - Editing indicator banner
.token-preview-mini - 50x50px token image preview
.token-actions-grid - 2-column button grid
.token-action-button - Action button styling
.feature-placeholder - Coming soon messaging
```

#### D. Commented Out Settings Tab
**Code:**
```jsx
{/* Settings tab commented out - may come back later
<button
  className={`tab-button ${activeView === 'settings' ? 'active' : ''}`}
  onClick={() => setActiveView('settings')}
>
  ⚙️ Settings
</button>
*/}
```

**Reason:** Pending feature, keeping code structure for future implementation.

---

## Technical Implementation Details

### State Management
**TokenPalette.jsx** now handles:
- `selectedToken` prop (passed from TokenManager)
- `hasChanges` state (tracks modifications)
- `showCharacterSheet` state
- `showInventory` state

### Effects Added
```jsx
// Populate form when token is selected
React.useEffect(() => {
  if (selectedToken) {
    setTokenName(selectedToken.name || '');
    setSelectedType(selectedToken.type || 'pc');
    setSelectedColor(selectedToken.color || '#4a90e2');
    setSize(selectedToken.size?.width ? selectedToken.size.width / 50 : 1);
    setHasChanges(false);
  }
}, [selectedToken]);

// Track changes when editing
React.useEffect(() => {
  if (selectedToken) {
    const currentSize = selectedToken.size?.width ? selectedToken.size.width / 50 : 1;
    const changed = 
      tokenName !== selectedToken.name ||
      selectedColor !== selectedToken.color ||
      size !== currentSize ||
      selectedType !== selectedToken.type;
    setHasChanges(changed);
  }
}, [tokenName, selectedColor, size, selectedType, selectedToken]);
```

### Save/Create Logic
```jsx
const handleSaveOrCreate = () => {
  if (selectedToken) {
    // Update existing token
    const pixelSize = size * 50;
    const updates = {
      name: tokenName.trim(),
      type: selectedType,
      color: selectedColor,
      size: { width: pixelSize, height: pixelSize },
      updatedAt: new Date(),
    };
    const tokenId = selectedToken.id || selectedToken.tokenId;
    onUpdateToken(tokenId, updates);
    setHasChanges(false);
  } else {
    // Create new token (existing logic)
    onCreateToken(tokenData);
  }
};
```

---

## User Experience Improvements

### Before
1. Select token → Properties tab opens → Edit values → Save
2. Delete token via toolbar button (requires selection)
3. White ruler line (low contrast on light backgrounds)
4. Manual HP input for every adjustment

### After
1. Select token → Palette auto-loads with values → Edit → Save (one less tab)
2. Delete token via right-click menu (natural workflow)
3. Green ruler line (better visibility, intuitive color)
4. Quick HP buttons for ±1, manual input for larger changes
5. Access to character sheet and inventory (coming soon)

---

## Benefits Summary

✅ **Reduced UI Clutter:** Removed redundant Delete Token button and Properties tab

✅ **Faster Workflows:** Quick HP adjustment buttons, consolidated editing interface

✅ **Better Visual Feedback:** Green ruler matches player action theme

✅ **Foundation for Growth:** Character sheet and inventory buttons ready for implementation

✅ **Consistent UX:** Right-click menu is now the primary action hub for tokens

✅ **Less Clicks:** Auto-switching to Palette when token selected eliminates extra tab navigation

---

## Future Enhancements Prepared

### Character Sheet Editor (Planned)
- View/edit full character attributes
- DM can modify values mid-game
- Quick access from Token Manager
- Integration with token stats

### Inventory Manager (Planned)
- Track items, equipment, weapons
- Loot assignment
- Weight/encumbrance tracking
- Quick access from Token Manager

### Settings Tab (Reserved)
- Advanced token configuration
- Permission settings
- Automation rules
- Integration options

---

## Testing Checklist

- [x] Delete Token button removed from header
- [x] Right-click menu still has Delete option
- [x] Ruler renders green during token drag
- [x] HP up/down buttons work (±1 adjustment)
- [x] Palette pre-fills when token selected
- [x] Save Changes button appears when editing
- [x] Save Changes only enabled when values change
- [x] Character Sheet button shows placeholder
- [x] Inventory button shows placeholder
- [x] Settings tab commented out (not visible)
- [x] No console errors
- [x] All files lint clean

---

## Files Modified

1. `VTTSession.jsx` - Removed Delete Token button
2. `TokenSprite.jsx` - Changed ruler color to green
3. `TokenContextMenu.jsx` - Added HP quick adjust buttons
4. `TokenContextMenu.css` - HP button styling
5. `TokenManager.jsx` - Updated to pass selectedToken to Palette
6. `TokenPalette.jsx` - Added editing mode, character sheet/inventory buttons
7. `TokenPalette.css` - Added styling for new features

---

## Code Quality

- All changes backward compatible
- No breaking changes to token data structure
- Proper state management with React hooks
- CSS follows existing patterns
- Accessibility maintained (titles, aria labels)
- Clean separation of concerns

---

**Date:** October 1, 2025
**Status:** ✅ Complete - Ready for testing
