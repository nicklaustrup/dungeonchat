# Campaign Party Management Settings

## Overview
Added DM-controlled campaign settings for managing what information players can view in the Party Panel during VTT sessions.

## Implementation Date
December 2024

---

## Features Added

### 1. Campaign Settings: Party Management Section

**Location**: Campaign Settings page (accessible from Campaign Dashboard)

**New Settings** (all default to `false`):
- **Can View Gold**: Allow players to see party gold in the party overview
- **Can View Inventory**: Allow players to see inventory items on character cards (currently removed from UI, ready for future re-implementation)
- **Can View Character Sheet**: Allow players to open character sheets for other party members

### 2. Permission System in Party Panel

**Modified Component**: `PartyManagement.js`

**Behavior**:
- **DM**: Always sees all information regardless of settings
- **Players**: Can only see information based on campaign settings

#### Gold Display
- **Condition**: `(isUserDM || campaign?.canViewGold)`
- Party overview wealth metric only displays if DM or setting enabled

#### Character Sheet Button
- **Condition**: `(isUserDM || character.userId === user?.uid || campaign?.canViewCharacterSheet)`
- Players can always open their own character sheet
- Players can open other character sheets only if setting enabled
- DM can open any character sheet

#### Inventory (Ready for Future Use)
- Setting exists: `canViewInventory`
- Currently inventory section is completely hidden from non-DM users
- When re-implementing inventory display, use: `(isUserDM || campaign?.canViewInventory)`

---

## Technical Implementation

### Database Schema

**Firestore Document**: `campaigns/{campaignId}`

Added fields:
```javascript
{
  canViewGold: false,           // boolean, default false
  canViewInventory: false,      // boolean, default false
  canViewCharacterSheet: false  // boolean, default false
}
```

### Files Modified

#### 1. `CampaignSettings.js`
**Changes**:
- Added three new form fields to state initialization
- Added Party Management section to form with toggles
- Auto-saves to Firestore with other campaign settings

**New State Properties**:
```javascript
formData: {
  // ...existing fields
  canViewGold: false,
  canViewInventory: false,
  canViewCharacterSheet: false
}
```

**UI Section**:
```jsx
<div className="settings-section">
  <h3>Party Management</h3>
  <p className="section-description">
    Control what information players can view in the Party Panel during sessions.
  </p>
  
  {/* Three checkbox toggles with descriptions */}
</div>
```

#### 2. `CampaignSettings.css`
**Changes**:
- Added styles for new section description and field descriptions
- `.section-description`: Muted text for section explanations
- `.settings-subsection-label`: Bold label for subsections
- `.field-description`: Smaller muted text for field help text

#### 3. `PartyManagement.js`
**Changes**:
- Updated `useCampaign` hook to retrieve full `campaign` object
- Added permission checks to gold display
- Added permission checks to character sheet button

**Key Logic**:
```javascript
const { campaign, isUserDM } = useCampaign(campaignId);

// Gold display
{wealth && (isUserDM || campaign?.canViewGold) && <div>...</div>}

// Character sheet button
{(isUserDM || character.userId === user?.uid || campaign?.canViewCharacterSheet) && (
  <button>📋</button>
)}
```

---

## User Flow

### DM Configuring Settings

1. Navigate to Campaign Dashboard
2. Go to Campaign Settings (or Settings tab)
3. Scroll to "Party Management" section
4. Toggle desired player permissions:
   - ✅ Enable "Party Gold" to let players see wealth stats
   - ✅ Enable "Character Sheets" to let players view each other's sheets
   - ❌ Leave disabled to restrict access (default)
5. Click "Save Changes"
6. Settings apply immediately to all active VTT sessions

### Player Experience

**With Settings Disabled (Default)**:
- ❌ Cannot see party gold in overview
- ❌ Cannot open other players' character sheets
- ✅ Can see their own character card
- ✅ Can open their own character sheet
- ❌ Cannot see inventory (currently hidden for all non-DM)

**With Settings Enabled**:
- ✅ Can see party gold (if `canViewGold` enabled)
- ✅ Can open any party member's character sheet (if `canViewCharacterSheet` enabled)
- ✅ Can see inventory items (if `canViewInventory` enabled and UI implemented)

---

## Security Considerations

### Access Control
- ✅ Settings are DM-only in `CampaignSettings` component
- ✅ Firestore rules should enforce DM-only write access to campaign settings
- ✅ UI uses conditional rendering (not data filtering)

### Recommended Firestore Rules
```javascript
match /campaigns/{campaignId} {
  allow read: if isSignedIn() && 
    (resource.data.dmId == request.auth.uid || 
     request.auth.uid in resource.data.members);
     
  allow update: if isSignedIn() && 
    resource.data.dmId == request.auth.uid;
}
```

**Note**: The UI only hides elements; players can still access data via Firestore queries. For true data security, implement server-side rules or Firestore security rules to filter character data.

---

## Testing Checklist

### As DM
- [ ] Open Campaign Settings
- [ ] See "Party Management" section
- [ ] All three toggles default to unchecked
- [ ] Can check/uncheck each toggle
- [ ] Click "Save Changes" - settings persist
- [ ] Refresh page - settings remain

### As Player (Default Settings)
- [ ] Open Party Panel in VTT session
- [ ] Cannot see party gold in overview
- [ ] See character sheet button (📋) only on own character
- [ ] Cannot see inventory section (already hidden)
- [ ] Can open own character sheet

### As Player (Settings Enabled)
- [ ] DM enables all three toggles
- [ ] Player refreshes or rejoins session
- [ ] Can see party gold in overview
- [ ] See character sheet buttons on all characters
- [ ] Can open any character sheet
- [ ] (When inventory UI added) Can see inventory items

---

## Future Enhancements

### 1. Inventory Re-implementation
- Currently inventory is completely hidden from non-DM
- When adding back inventory display:
  ```javascript
  {(isUserDM || campaign?.canViewInventory) && (
    <div className="character-inventory">
      {/* inventory UI */}
    </div>
  )}
  ```

### 2. Additional Settings
Potential future toggles:
- `canViewHP`: Show/hide HP values on character cards
- `canViewAC`: Show/hide AC values
- `canViewProficiency`: Show/hide proficiency bonus
- `canEditPartyGold`: Allow players to modify party gold
- `canManageInventory`: Allow players to add/remove items

### 3. Role-Based Permissions
- Per-character permissions (e.g., treasurer can manage gold)
- Player role system (co-DM, assistant DM)

### 4. Real-time Updates
- Settings changes auto-refresh active sessions
- Toast notification when DM changes permissions

### 5. VTT Toolbar Access
- Add Campaign Settings button in VTT toolbar
- Quick-access modal for settings during session

---

## Related Components

- `PartyManagement.js` - Party panel in VTT session
- `CampaignSettings.js` - DM campaign configuration
- `useCampaign.js` - Hook for campaign data and permissions
- `CharacterSheet.js` - Character sheet modal

---

## Notes

### Default Behavior
All settings default to `false` for maximum privacy/control. DM must explicitly enable features for players.

### Backwards Compatibility
- Uses optional chaining (`campaign?.canViewGold`) to handle old campaigns
- Defaults to `false` if setting doesn't exist
- No migration needed for existing campaigns

### Performance
- Campaign data is already loaded via `useCampaign` hook
- No additional Firestore queries needed
- Real-time sync via Firestore snapshot listener

---

## Related Documentation

- `PARTY_PANEL_TOOLTIP_AND_TOKEN_HP_UPDATES.md` - Previous party panel updates
- `IMPLEMENTATION_PLAN_TOKEN_ENHANCEMENTS.md` - Overall token system plan
- Campaign Dashboard documentation (if exists)

---

## Status
✅ **Complete** - Ready for testing and deployment

All three settings implemented with full permission checks. Inventory setting is ready for future use when inventory UI is re-added to party panel.
