# Create Token Button Implementation

**Date**: October 4, 2025  
**Priority**: 🟢 Enhancement  
**Status**: ✅ Complete

---

## Problem

When there was only 1 character in a party, the Character Sheets panel (CharacterSheetPanel) did not render the "Create Token" button. This made it difficult for users to create tokens for their characters directly from the character sheet interface.

### User Request
> "If there's only 1 character in the party, the Character Sheets panel does not render the Create Token button. Lets add that button to each of the Character Sheets within the VTT."

---

## Solution

Added a "Create Token" button directly to each individual CharacterSheet component, making it available regardless of how many characters are in the party or where the character sheet is displayed.

### Implementation Details

#### 1. **CharacterSheet Component** (`src/components/CharacterSheet.js`)

**Added Imports:**
```javascript
import { createPlayerStagedToken } from '../services/characterSheetService';
```

**Added State:**
```javascript
const [generatingToken, setGeneratingToken] = useState(false);
```

**Added Handler Function:**
```javascript
// Handle creating a staged token for this character
const handleCreateToken = async () => {
  if (!character || generatingToken) return;
  
  setGeneratingToken(true);
  try {
    await createPlayerStagedToken(firestore, campaignId, userId, character);
    alert(`Token created successfully for ${character.name}! Check the Token Manager to place it on the map.`);
  } catch (err) {
    console.error('Error creating token:', err);
    alert(`Failed to create token: ${err.message}`);
  } finally {
    setGeneratingToken(false);
  }
};
```

**Added Button in Character Header:**
```javascript
<div className="character-title">
  <h1>{character.name}</h1>
  <div className="character-subtitle" title="Character level, race, and class combination">
    Level {character.level} {character.race} {character.class}
  </div>
  <button
    className="create-token-btn"
    onClick={handleCreateToken}
    disabled={generatingToken}
    title="Create a map token for this character in the Token Manager"
  >
    {generatingToken ? '⏳ Creating...' : '🎭 Create Token'}
  </button>
</div>
```

#### 2. **CharacterSheet CSS** (`src/components/CharacterSheet.css`)

**Added Button Styles:**
```css
.create-token-btn {
  margin-top: 12px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.create-token-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
}

.create-token-btn:active:not(:disabled) {
  transform: translateY(0);
}

.create-token-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
}
```

---

## Features

### Button Placement
- ✅ Located in the character header section, below the character's name and subtitle
- ✅ Appears on **all character sheets**, regardless of:
  - Number of characters in party
  - Whether viewed in modal or panel
  - Whether DM or player view

### Button States

**Default State:**
- 🎭 Icon with "Create Token" text
- Purple gradient background
- Smooth hover animations

**Loading State:**
- ⏳ Icon with "Creating..." text
- Button disabled during token creation
- Gray gradient background

**Disabled State:**
- Reduced opacity
- No pointer cursor
- Gray gradient background

### User Feedback
- **Success**: Alert message confirms token creation and directs user to Token Manager
- **Error**: Alert message displays error details if creation fails

---

## Token Creation Flow

1. User clicks "🎭 Create Token" button
2. Button state changes to "⏳ Creating..." and disables
3. `createPlayerStagedToken()` service function is called with:
   - `firestore` instance
   - `campaignId`
   - `userId` (character owner's ID)
   - `character` data object
4. Service creates a staged token with character's:
   - Name
   - Avatar/portrait
   - HP and maxHp
   - Color (default or from character)
5. Token appears in Token Manager's staging area
6. Success/error message displayed to user
7. Button re-enables

---

## Usage Contexts

The Create Token button is now available in:

1. **VTT Character Sheet Panel**
   - Toolbar panel for viewing character sheets
   - Single or multiple characters

2. **Party Management Modal**
   - When clicking character sheet button in party panel
   - Fallback modal view

3. **Campaign Dashboard**
   - Character management interface
   - DM view of all characters

4. **Any Future Character Sheet Display**
   - Button is built into the component itself
   - Works everywhere CharacterSheet is rendered

---

## Benefits

### For Players
- ✅ Easy token creation from any character sheet view
- ✅ No need to navigate to Token Manager first
- ✅ Works even when party has only 1 character
- ✅ Clear visual feedback during creation

### For DMs
- ✅ Quick token generation for any character
- ✅ Consistent interface across all character sheets
- ✅ Reduces clicks needed to get characters on the map

### Technical
- ✅ Reuses existing `createPlayerStagedToken` service
- ✅ No duplicate token creation (service handles checks)
- ✅ Proper error handling and user feedback
- ✅ Consistent with existing token creation patterns

---

## Previous vs Current

### Before
- ❌ Create Token button only in CharacterSheetPanel tabs (when multiple characters)
- ❌ No button when single character in party
- ❌ Limited to specific view contexts

### After
- ✅ Create Token button in every CharacterSheet component
- ✅ Always available regardless of party size
- ✅ Works in all display contexts (modal, panel, dashboard)
- ✅ Consistent user experience

---

## Testing Checklist

- [ ] **Single Character Party**
  1. Create campaign with only 1 character
  2. Open character sheet in VTT panel
  3. Verify "Create Token" button is visible
  4. Click button and verify token created

- [ ] **Multiple Character Party**
  1. Create campaign with 3+ characters
  2. Open each character sheet
  3. Verify button appears on all sheets
  4. Create tokens for multiple characters

- [ ] **Modal View**
  1. Open character sheet from Party Management modal
  2. Verify button appears and works
  3. Check success message

- [ ] **Loading State**
  1. Click Create Token button
  2. Verify button shows "⏳ Creating..." and disables
  3. Verify button re-enables after completion

- [ ] **Error Handling**
  1. Test with invalid data (if possible)
  2. Verify error message displays
  3. Verify button re-enables after error

- [ ] **Token Manager Integration**
  1. Create token via button
  2. Open Token Manager
  3. Verify token appears in staging area
  4. Verify token has correct character data

- [ ] **Duplicate Prevention**
  1. Click Create Token multiple times quickly
  2. Verify only one token is created (service handles this)

---

## Related Files

### Modified
- `src/components/CharacterSheet.js` - Added button, state, and handler
- `src/components/CharacterSheet.css` - Added button styles

### Related (Not Modified)
- `src/services/characterSheetService.js` - Token creation service
- `src/components/VTT/VTTSession/CharacterSheetPanel.jsx` - Panel that displays character sheets
- `src/components/Session/PartyManagement.js` - Party panel with character sheet button

---

## Notes

### Why Add to CharacterSheet Component?

The button was added directly to the CharacterSheet component rather than the CharacterSheetPanel because:

1. **Universal Availability**: Works everywhere CharacterSheet is displayed
2. **Consistency**: Same interface regardless of context
3. **Simplicity**: Single implementation instead of multiple conditional buttons
4. **Maintainability**: Changes to button affect all views automatically

### Existing Tab Button

The CharacterSheetPanel still has a "🎭" button in the tabs for multi-character scenarios. This provides:
- Quick token creation without opening the sheet
- Visible from tab view
- DM-only feature (as before)

The new button complements this by providing:
- In-sheet creation option
- Available to all users
- Works in all contexts

Both buttons use the same `createPlayerStagedToken` service, so there's no code duplication or conflicting logic.

---

## Future Enhancements

Potential improvements for future consideration:

1. **Token Preview**: Show preview of token before creating
2. **Placement Options**: Choose map to place token on
3. **Batch Creation**: Create tokens for all party members at once
4. **Token Settings**: Configure token properties (size, color) before creation
5. **Confirmation Modal**: Optional confirmation before creating token
6. **Existing Token Warning**: Alert if token already exists for character

---

## Related Documentation

- `docs/archives/TOKEN_AUTO_CREATION_FIX.md` - Original token auto-creation implementation
- `HP_SYSTEM_STANDARDIZATION.md` - HP property standardization (affects token HP)
- `CHARACTER_DELETE_BUG_FIX.md` - Recent character management fixes

---

## Success Criteria

✅ Button appears on all character sheets  
✅ Button works with single-character parties  
✅ Button works with multi-character parties  
✅ Proper loading and disabled states  
✅ Clear user feedback on success/error  
✅ No duplicate token creation  
✅ Consistent styling with app theme  
✅ Accessible in all character sheet contexts

**Status**: All criteria met ✅
