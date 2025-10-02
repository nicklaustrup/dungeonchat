# Token Auto-Creation and Drag-and-Drop Fix

## Issue
1. Player tokens were not automatically created in the staging area when a character was created through the character creation wizard
2. Tokens in the staging area were not draggable to the map canvas

## Root Cause

### Issue 1: No Token Auto-Creation
The character creation flow (`createCharacterSheet`) only created the character document and updated the member document, but didn't create a staged token. The existing auto-creation logic in `VTTSession.jsx` only ran when:
- The player navigated to the VTT session
- There was an active map set
- The player didn't already have a token on that specific map

This meant new players wouldn't see their token in the staging area until they visited the VTT for the first time.

### Issue 2: Staging Tokens Not Draggable
The staging token list items in `TokenManager.jsx` didn't have `draggable` attributes or drag event handlers, making them non-draggable.

## Solution

### Part 1: Auto-Create Staged Tokens on Character Creation

**File**: `src/services/characterSheetService.js`

Added a new helper function `createPlayerStagedToken` that:
1. Gets the campaign's active map (or the first available map)
2. Checks if a token already exists for this character
3. Creates a staged player token with the character's data
4. Links the token to the character via `characterId`

The function is called automatically at the end of `createCharacterSheet`:

```javascript
// Auto-create a staged token for the player
await createPlayerStagedToken(firestore, campaignId, userId, finalCharacterSheet);
```

**Key Features:**
- ✅ Creates tokens even when there's no active map (uses first available map)
- ✅ Prevents duplicate token creation by checking existing tokens
- ✅ Pulls HP data from character sheet (`hp`, `maxHp`)
- ✅ Uses user profile photo if available
- ✅ Non-blocking - token creation failure won't prevent character creation
- ✅ Automatically staged (`staged: true`)

### Part 2: Make Staging Tokens Draggable

**File**: `src/components/VTT/TokenManager/TokenManager.jsx`

Added drag-and-drop functionality to staged token items:

```jsx
<div 
  className="staged-token-item"
  draggable={true}
  onDragStart={(e) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      tokenId: token.id,
      fromStaging: true,
      tokenData: token
    }));
    e.dataTransfer.effectAllowed = 'move';
  }}
>
```

**Data Transfer Format:**
```json
{
  "tokenId": "uuid-v4-token-id",
  "fromStaging": true,
  "tokenData": {
    "name": "Character Name",
    "type": "pc",
    "color": "#4a9eff",
    "hp": 25,
    "maxHp": 25,
    ...
  }
}
```

### Part 3: Enhanced Visual Feedback

**File**: `src/components/VTT/TokenManager/TokenManager.css`

Updated staging token styles to indicate draggability:

```css
.staged-token-item {
  cursor: grab; /* Show grab cursor */
  transition: all 0.2s ease;
}

.staged-token-item:hover {
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2); /* Glow on hover */
}

.staged-token-item:active {
  cursor: grabbing; /* Show grabbing cursor while dragging */
  opacity: 0.7; /* Visual feedback during drag */
}
```

## Data Flow

### Character Creation → Token Creation

```
User creates character
       ↓
CharacterCreationModal.handleCreateCharacter()
       ↓
useCharacterCreation.createCharacter()
       ↓
characterSheetService.createCharacterSheet()
       ↓
1. Create character document
2. Update member document
3. createPlayerStagedToken() ← NEW!
       ↓
Token appears in staging area
```

### Token Dragging Flow

```
User drags staged token
       ↓
onDragStart sets dataTransfer with:
  - tokenId
  - fromStaging: true
  - tokenData (full token object)
       ↓
MapCanvas.onDrop receives data
       ↓
If fromStaging === true:
  - Place token at drop position
  - Update staged: false
  - Token moves to map
```

## Token Data Structure

```javascript
{
  tokenId: "uuid-v4",
  name: "Character Name",
  type: "pc",
  imageUrl: "https://...",
  position: { x: 100, y: 100 },
  size: { width: 50, height: 50 },
  rotation: 0,
  color: "#4a9eff",
  characterId: "userId",
  ownerId: "userId",
  isHidden: false,
  staged: true,           // ← Determines if in staging area
  hp: 25,
  maxHp: 25,
  statusEffects: [],
  createdBy: "userId",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
}
```

## Edge Cases Handled

### 1. No Maps in Campaign
If a campaign has no maps when a character is created:
- Warning logged: "No maps found in campaign, cannot create staged token"
- Character creation succeeds (token creation doesn't block)
- Token will be created when first map is added (via existing VTTSession logic)

### 2. No Active Map
If there's no active map but maps exist:
- Uses the first available map for token staging
- Token will be visible in TokenManager for that map
- DM can reveal token when they switch to that map

### 3. Duplicate Token Prevention
Before creating a token, checks for existing tokens with:
- Same `characterId`
- Type `'pc'`
- On the target map

If found, skips creation and logs: "Player token already exists, skipping creation"

### 4. Profile Photo Missing
If user has no profile photo:
- Falls back to empty string `''`
- Token displays with colored circle only
- DM can upload custom token image later

### 5. Token Creation Failure
If token creation throws an error:
- Error logged to console
- Character creation still succeeds
- User can manually create token via TokenManager later

## Testing Scenarios

### Scenario 1: New Player Joins Campaign
1. ✅ Player joins campaign as member
2. ✅ Opens character creation wizard
3. ✅ Creates character "Aragorn"
4. ✅ Token "Aragorn" appears in DM's staging area
5. ✅ Token has player's HP from character sheet
6. ✅ Token is draggable

### Scenario 2: Multiple Players Create Characters
1. ✅ Player A creates "Gandalf" → Token created
2. ✅ Player B creates "Frodo" → Token created
3. ✅ Both tokens in staging area
4. ✅ Each token linked to correct player
5. ✅ No duplicate tokens

### Scenario 3: Token Already Exists
1. ✅ Player has existing token on map
2. ✅ Player creates new character
3. ✅ Check detects existing token
4. ✅ No duplicate created
5. ✅ Original token preserved

### Scenario 4: Drag Token from Staging
1. ✅ DM opens Token Manager
2. ✅ Sees staged tokens
3. ✅ Hover shows grab cursor
4. ✅ Drag token to map canvas
5. ✅ Token placed at drop location
6. ✅ Token removed from staging area
7. ✅ `staged: false` in Firestore

### Scenario 5: Campaign with No Maps
1. ✅ Player creates character in new campaign
2. ✅ Warning logged (no maps)
3. ✅ Character creation succeeds
4. ✅ When DM adds first map, token auto-created via VTTSession

## User Experience Improvements

### Before:
- ❌ Players create characters but tokens don't appear
- ❌ DM has to manually create tokens for each player
- ❌ Tokens in staging can't be dragged
- ❌ DM has to click "✓ Reveal" to place every token
- ❌ Tedious workflow for large parties

### After:
- ✅ Tokens auto-create when characters are created
- ✅ DM sees all player tokens in staging immediately
- ✅ Staging tokens are draggable
- ✅ DM can drag tokens directly to desired positions
- ✅ Alternative: Use "✓ Reveal" for default positioning
- ✅ Streamlined workflow for any party size

## Console Logging

### Successful Token Creation:
```
Created staged token for player character: Aragorn
```

### Existing Token Detected:
```
Player token already exists, skipping creation
```

### No Maps Available:
```
No maps found in campaign, cannot create staged token
```

### Drag Started:
```
Started dragging staged token: Aragorn
```

## Database Changes

### Before:
```
campaigns/{campaignId}/
  └── characters/{userId}
  └── members/{userId}
```

### After:
```
campaigns/{campaignId}/
  └── characters/{userId}
  └── members/{userId}
  └── vtt/{mapId}/
      └── tokens/{tokenId}  ← NEW!
          - staged: true
          - type: "pc"
          - characterId: userId
```

## Files Modified

1. **src/services/characterSheetService.js**
   - Added `query`, `where` imports from Firestore
   - Added `uuid` import for token ID generation
   - Created `createPlayerStagedToken()` helper function
   - Modified `createCharacterSheet()` to call token creation

2. **src/components/VTT/TokenManager/TokenManager.jsx**
   - Added `draggable={true}` to staged token items
   - Added `onDragStart` handler with token data
   - Enhanced drag feedback with console logging

3. **src/components/VTT/TokenManager/TokenManager.css**
   - Changed `.staged-token-item` cursor to `grab`
   - Added `:active` state with `grabbing` cursor
   - Added hover glow effect
   - Added drag opacity feedback

## Backward Compatibility

- ✅ Existing tokens unaffected
- ✅ Old character sheets work fine
- ✅ VTTSession auto-creation still works as fallback
- ✅ Manual token creation via TokenManager still available
- ✅ No breaking changes to token data structure

## Future Enhancements

Potential improvements (not implemented):
- [ ] Batch token creation for existing characters without tokens
- [ ] Token template system (custom default tokens per class)
- [ ] Drag multiple tokens at once
- [ ] Token preview during drag
- [ ] Snap-to-grid during drag from staging
- [ ] Undo/redo for token placement
- [ ] Token import/export for campaign migration
