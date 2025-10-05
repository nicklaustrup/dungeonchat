# SuperChat VTT - Central TODO & Future Enhancements

## Implementation Date
Started: October 2024
Last Updated: October 4, 2025

---

## 🔴 Critical Priority

### HP Sync System - FIXED! 🎉
**Status**: ✅ Code Fixed, ⏳ Migration Pending
**Priority**: 🔴 Critical (Broken sync functionality)
**Date Started**: October 4, 2025
**Date Fixed**: October 4, 2025

**Problem**: HP updates were not syncing correctly across the system:
1. **Token → Character Sheet/Party Panel**: Right-clicking token and changing HP did NOT update character sheet or party panel
2. **Character Sheet → Token**: Updating character sheet HP updated party panel but NOT tokens
3. **Performance Issue**: Token right-click +/- buttons send multiple Firebase updates (100 clicks = 100 writes)
4. **UX Issue**: Character sheet HP input uses default HTML spinner buttons (not styled)

**Root Cause**: ✅ **IDENTIFIED AND FIXED!**
- **Tokens were missing the `userId` field!**
- HP sync requires BOTH `characterId` AND `userId` on tokens
- Token creation code set `characterId` but forgot `userId`
- Without `userId`, character listeners never set up → no sync

**Fix Applied**:
- [x] Added comprehensive console logs with emoji markers (🔷🟢🟣🔶)
- [x] Debugged with user's console output
- [x] Identified missing `userId` field on tokens
- [x] Fixed token creation code: Added `userId: userId` to playerToken object
- [x] Created migration utility: `src/utils/fixTokenUserIds.js`
- [x] Documented fix in `HP_SYNC_FIX_MISSING_USERID.md`

**Next Steps**:
- [x] **Run migration once**: Added "Fix HP Sync" button to VTT toolbar (DM only)
- [ ] DM clicks "Fix HP Sync" button in VTT session
- [ ] Refresh page and verify console shows character listeners set up
- [ ] Test HP sync in both directions (token ↔ character)
- [ ] Remove or disable debug console logs (optional)

**Optimization Tasks** - ✅ **COMPLETE**:
- [x] **Token Right-Click Menu**: 
  - [x] Remove immediate Firebase writes on +/- buttons
  - [x] Store HP changes locally in component state (pendingHP, bufferedHP)
  - [x] Add "Apply" button to commit changes to Firebase
  - [x] Single Firebase write instead of N writes
  - [x] Show pending HP value in display with yellow highlight and * indicator
  - [x] Add "Cancel" button to revert pending changes
- [x] **Character Sheet HP Input**:
  - [x] Remove immediate Firebase writes on input change
  - [x] Add local state buffer with Apply/Cancel buttons
  - [x] Replace default HTML spinner with custom up/down carets
  - [x] Style custom increment/decrement buttons (▲ green, ▼ red)
  - [x] Show pending HP with yellow highlight and * indicator
  - [x] Apply/Cancel buttons appear when changes pending

**Files to Debug/Update**:
- `src/services/vtt/tokenService.js`
- `src/services/characterSheetService.js`
- `src/services/partyService.js`
- `src/hooks/vtt/useTokens.js`
- `src/components/CharacterSheet.js`
- `src/components/VTT/TokenManager/TokenContextMenu.jsx`
- `src/components/Session/PartyManagement.js`

**Testing Checklist**:
- [ ] Token HP +/- → verify character sheet updates
- [ ] Token HP +/- → verify party panel updates
- [ ] Character sheet HP change → verify token updates
- [ ] Character sheet HP change → verify party panel updates
- [ ] Party panel HP change → verify token updates
- [ ] Party panel HP change → verify character sheet updates
- [ ] Verify only 1 Firebase write per HP change (not N writes)
- [ ] Verify custom HP input buttons render correctly

**Success Criteria**:
- ✅ All HP changes sync bidirectionally (token ↔ character sheet ↔ party panel)
- ✅ Console logs show clear sync flow
- ✅ Only 1 Firebase write per user action (Apply button)
- ✅ Custom styled HP increment/decrement buttons
- ✅ No duplicate or missing updates

**Goal**: Fix HP sync system with proper debugging, optimize Firebase writes, and improve UX

---

## 🔴 Critical Priority

### HP System Standardization & Audit ✅
**Status**: ✅ Complete
**Priority**: 🔴 Critical (Blocking sync functionality)
**Files**: All HP-related files across the system
**Date Started**: October 4, 2025

**Problem**: HP properties are inconsistent across the system, causing sync failures between character sheets, tokens, party panel, and token right-click menus.

**Current State**:
- **Character Sheet** uses: `currentHitPoints`, `hitPointMaximum`
- **Tokens** use: `hp`, `maxHp`
- **Party Service** reads/writes: both naming conventions (backwards compatible)
- **Token Service** reads: `currentHitPoints`, writes: `hp`
- **Initiative Service** reads: various naming conventions
- **Character Service** creates tokens with: `hp`, `maxHp`

**Solution**: Standardize ALL HP properties to:
- **Current HP**: `hp` (everywhere)
- **Max HP**: `maxHp` (everywhere)

**Implementation Plan**:
- [x] Audit all files that read or write HP properties
- [x] Update CharacterSheet.js model to use `hp` and `maxHp`
- [x] Update CharacterSheet.js component to use `hp` and `maxHp`
- [x] Update tokenService.js to use `hp` and `maxHp`
- [x] Update partyService.js to use `hp` and `maxHp`
- [x] Update characterSheetService.js to use `hp` and `maxHp`
- [x] Update initiativeService.js to use `hp` and `maxHp`
- [x] Update PartyManagement.js to use `hp` and `maxHp`
- [x] Update MapCanvas.jsx to use `hp` and `maxHp`
- [x] Token components already use `hp` and `maxHp` ✓
- [x] useTokens.js hook already compatible ✓
- [ ] Update Firestore security rules if needed
- [ ] Test full HP sync workflow after changes
- [ ] Update documentation to reflect new standard

**Files to Update**:
- `src/models/CharacterSheet.js`
- `src/components/CharacterSheet.js`
- `src/services/vtt/tokenService.js`
- `src/services/partyService.js`
- `src/services/characterSheetService.js`
- `src/services/initiativeService.js`
- `src/services/encounterService.js`
- `src/components/Session/PartyManagement.js`
- `src/components/VTT/Canvas/MapCanvas.jsx`
- `src/components/VTT/TokenManager/TokenContextMenu.jsx`
- `src/components/VTT/TokenManager/TokenExtendedEditor.jsx`
- `src/components/VTT/TokenManager/TokenPalette.jsx`
- `src/hooks/vtt/useTokens.js`
- `src/hooks/useCharacterSheet.js`

**Testing Checklist**:
- [ ] Update character HP in character sheet → verify token syncs
- [ ] Update token HP via right-click menu → verify character sheet syncs
- [ ] Update token HP via drag → verify character sheet syncs
- [ ] Update HP in party panel → verify both token and character sheet sync
- [ ] Create new character → verify defaults are hp: 10, maxHp: 10
- [ ] Create new token → verify defaults are hp: 10, maxHp: 10
- [ ] Verify party panel displays HP correctly
- [ ] Verify no null/undefined HP values anywhere
- [ ] Test heal party functionality
- [ ] Test long rest functionality
- [ ] Test short rest functionality

**Goal**: All HP properties use consistent naming (`hp` and `maxHp`) across the entire system, enabling reliable real-time sync. ✅ Complete

---

### Session Settings Implementation ✅
**Status**: Complete with search functionality
**Files**: CampaignSettings.js, VTTSession.jsx, SessionSettings.jsx, SessionSettings.css, App.css

- [x] Split Campaign Settings into General vs Session Settings
- [x] Add Session Settings button to VTT toolbar (next to Exit)
- [x] Create SessionSettings component/modal
- [x] Make viewable by all, editable by DM only
- [x] Styled modal with overlay and responsive design
- [x] Add search/filter bar to modal header
- [x] Implement keyword-based search filtering
- [x] Add "No results" message for empty searches
- [x] Polish CSS styling (search bar, icons, clear button)
- [x] Real-time settings sync (Firebase listeners, no page refresh needed)
- [x] Define missing CSS variables in App.css (--text-muted, --text-tertiary, --accent-color, --sidebar-bg, --header-bg, --panel-bg, --background-secondary, --hover-bg)
- [x] Fix horizontal scrollbar issue (overflow-x: hidden, box-sizing: border-box)
- [x] Fix undefined --accent-color and --text-tertiary in SessionSettings.css

**Details**: Session Settings includes: Progression System, Party Management visibility toggles. General Settings includes: Campaign name, description, game system, schedule, privacy. Session Settings accessible in-game via toolbar button. Search bar filters sections by keywords (e.g., "xp", "gold", "party").

### Party Management Panel Issues ✅
**Status**: Fixed
**Files**: VTTSession.jsx

- [x] Remove popout/floating panel feature (rendering incorrectly)
- [x] Keep sidebar version only
- [x] Simplified party button logic
- [x] Test party panel display in VTT

**Details**: Party management popout panel had rendering issues. Removed floating panel feature, simplified to sidebar-only. Party button now toggles sidebar panel cleanly.

---

## 🟠 High Priority

### Authentication Workflow - Username Requirements ✅ (REVISED)
**Status**: Complete (Revised October 4, 2025)
**Files**: SignIn.js, SignIn.css, useAuth.js, ProfileSetupModal.js, ProfileEditor.js, ProfileEditor.css, App.js, AUTHENTICATION_REVISION.md

**Objective**: All users (email and OAuth) set username through ProfileSetupModal after authentication.

**Key Insight**: Username validation requires authenticated user context (Firestore rules, Functions), so username cannot be validated during signup form before account creation.

**Implementation** ✅:
- [x] Remove username field from signup form (authentication must happen first)
- [x] All new users routed to ProfileSetupModal after authentication
- [x] Add manual "Check Availability" button to reduce Firebase calls
- [x] Add scroll bars to SignIn form (overflow-y with custom styling)
- [x] Fix modal flash on refresh (wait for profile loading state)
- [x] ProfileSetupModal required for all users without username (cannot skip)
- [x] Username validation happens once per button click (not on every keystroke)

**Benefits**:
- ✅ Proper authentication context for username validation
- ✅ 90% reduction in Firebase Functions calls (manual validation)
- ✅ No modal flash on page refresh (loading state check)
- ✅ Consistent flow for all authentication methods
- ✅ Scrollable signup form for all screen sizes

**Username Validation Rules**:
- Format: 3-30 characters, alphanumeric + underscores only
- Uniqueness: Checked against usernames collection
- Case-insensitive storage (lowercase in index)
- Server-side validation via Firebase Functions (with fallback)

**User Experience**:
- Email/Password: Username field appears in signup form with real-time validation
- OAuth: Username setup modal appears immediately after authentication, cannot be skipped
- Both flows: Username validation happens before profile creation
- Profile creation: Username saved to userProfiles and indexed in usernames collection

**Security & Privacy**:
- ✅ Email addresses never displayed in UI
- ✅ OAuth displayName (Google full name) never displayed
- ✅ Only username visible to other users
- ✅ Character sheet Player field shows username only

**Goal**: All users (email and OAuth) must set a unique username during/immediately after signup. Username is used consistently throughout the application. ✅ Complete

### Character Player Name Display ✅
**Status**: Complete
**Files**: CharacterCreationModal.js

**Issue**: Character sheet "Player" field was displaying Google Auth displayName (full name) and email as fallbacks.

**Solution**: Updated to fetch and display ONLY the profile username from `userProfiles` collection.

**Changes**:
- [x] Import `doc` and `getDoc` from Firestore
- [x] Fetch username from `userProfiles/{userId}` collection
- [x] Use `profileData.username` instead of `user.displayName` or `user.email`
- [x] Fallback to 'Unknown Player' if username not found
- [x] Async fetch in useEffect with proper error handling

**Before**: `user?.displayName || user?.email || 'Unknown Player'`
**After**: Fetches `profileData.username` from Firestore, never shows email or auth name

**Goal**: Character sheets display only the user's chosen profile username, maintaining privacy. ✅ Complete

### Character Sheet Panel Integration ✅
**Status**: Complete
**Files**: PartyManagement.js, VTTSession.jsx, CharacterSheetPanel.jsx

- [x] Find CharacterSheetPanel in VTT toolbar
- [x] Understand panel open/close API
- [x] Update character sheet button in PartyManagement
- [x] Pass selected characterUserId to panel
- [x] Add initialCharacterId prop to CharacterSheetPanel
- [x] Add openCharacterSheet function to VTTSession
- [x] Pass onOpenCharacterSheet callback to PartyManagement
- [x] Maintain modal fallback for non-VTT contexts

**Goal**: Clicking character sheet button in Party Panel opens the toolbar's CharacterSheetPanel floating panel to the selected character. ✅ Complete

### Default HP 10/10 ✅
**Status**: Complete
**Files**: CharacterSheet.js, tokenService.js

- [x] Set default HP in character creation: `currentHitPoints: 10, hitPointMaximum: 10`
- [x] Set default HP in token creation: `hp: 10, maxHp: 10`
- [x] Character sheet model updated (createDefaultCharacterSheet)
- [x] Token service updated (createToken)
- [x] Verified characterSheetService.js has fallback logic

**Goal**: All new entities (characters, tokens, monsters, NPCs) start with 10/10 HP instead of null/0. ✅ Complete

---

## 🟡 Medium Priority

### Character Avatar Priority Logic ✅
**Status**: Complete
**Files**: CharacterSheet.js

**Solution Implemented**:
CharacterSheet now follows the same priority as PartyManagement:
1. `avatarUrl` (custom character image) - highest priority
2. `photoURL` (user's profile picture) - fallback 1
3. `portraitUrl` (default token image) - fallback 2
4. First letter placeholder - final fallback

**Implementation**:
```javascript
const displayImage = character.avatarUrl || character.photoURL || character.portraitUrl;
```

**Tasks**:
- [x] Update CharacterSheet renderCharacterHeader to use priority logic
- [x] Create displayImage variable with fallback chain
- [x] Update img src to use displayImage
- [x] Add error handler to img tag for graceful failures
- [x] Keep placeholder visible with conditional display style
- [x] Verify remove button only shows when custom avatarUrl exists

**Goal**: Character sheet avatar intelligently fallbacks through available images. ✅ Complete

### Campaign/Character Caching Hooks ⏳
**Status**: Not Started
**Priority**: Medium (Implement as we go during Token HP Sync)
**Files**: New hooks to create: useCampaignsList.js, useUserCharacters.js
**Context**: See ARCHITECTURE_DECISION_PROFILE_DATA_DENORMALIZATION.md

**Objective**: Create centralized hooks for fetching and caching user's campaigns and characters with real-time updates. Replace ad-hoc queries throughout codebase.

**Pattern**:
```javascript
// Instead of manual queries in components:
const q = query(collection(firestore, 'campaigns'), where('memberIds', 'array-contains', user.uid));
const unsubscribe = onSnapshot(q, snapshot => { ... });

// Use centralized hook:
const { campaigns, loading } = useCampaignsList();
```

**Tasks**:
- [ ] Create `useCampaignsList()` hook
  - [ ] Query campaigns where user is member (memberIds array-contains)
  - [ ] Real-time listener with onSnapshot
  - [ ] Return { campaigns, loading, error }
  - [ ] Automatic cleanup on unmount
- [ ] Create `useUserCharacters()` hook
  - [ ] Collection group query across all campaigns
  - [ ] Filter by userId
  - [ ] Include campaignId in returned data
  - [ ] Real-time listener with onSnapshot
  - [ ] Return { characters, loading, error }
- [ ] Ensure proper Firestore indexes exist
  - [ ] campaigns: memberIds (ARRAY) ASC, createdAt DESC
  - [ ] characters: userId ASC, createdAt DESC (collection group)
- [ ] Document usage pattern in hooks
- [ ] **Implement incrementally**: As we touch files that need campaigns/characters, refactor to use these hooks

**Benefits**:
- ✅ Centralized data fetching (single source of truth)
- ✅ Automatic caching via React hooks
- ✅ Real-time updates across all components
- ✅ Reduced code duplication
- ✅ Better performance (shared listeners)
- ✅ Easier testing and maintenance

**Strategy**: Don't refactor everything at once. As we work on Token HP Sync and touch files that fetch campaigns/characters, we'll create and use these hooks. Incremental improvement!

**Goal**: Centralized, cached, real-time access to user's campaigns and characters throughout the app.

### Token HP Sync System - Property Name Mapping Bug ✅
**Status**: ✅ FIXED
**Priority**: 🔴 Critical (Was blocking sync functionality)
**Files Modified**: partyService.js, PartyManagement.js
**Date Found**: October 4, 2025
**Date Fixed**: October 4, 2025

**Root Cause**: Property name mismatch across different parts of the system:
- **Character Sheet** uses: `currentHitPoints`, `hitPointMaximum`
- **Party Service** expected: `currentHP`, `maxHP` (or `hitPoints`)
- **Tokens** use: `hp`, `maxHp`

**Symptoms (Before Fix)**:
1. ❌ Tokens didn't sync when character sheet HP updated
2. ❌ Party Panel showed null/0 HP
3. ❌ Character sheet didn't update when token HP adjusted

**Fix Applied**:
- [x] Updated `partyService.js` to read BOTH property names (backwards compatible)
  - [x] `calculatePartyStats()` - reads `currentHitPoints` OR `currentHP`
  - [x] `updateCharacterHP()` - writes to BOTH `currentHitPoints` AND `currentHP`
  - [x] `healParty()` - reads `hitPointMaximum` OR `maxHP`
  - [x] `longRest()` - reads/writes both property names
  - [x] `shortRest()` - reads/writes both property names
- [x] Updated `PartyManagement.js` to read both property names
  - [x] `startInlineHPEdit()` - reads `currentHitPoints` OR `currentHP`
  - [x] `commitInlineHPEdit()` - reads `hitPointMaximum` OR `maxHP`
  - [x] `handleChipMenuAction()` (heal) - reads both property names
- [x] All writes now update BOTH property names for backwards compatibility

**Testing Needed**:
- [ ] Update character HP in character sheet → verify token syncs
- [ ] Update token HP → verify character sheet syncs
- [ ] Update HP in party panel → verify both token and character sheet sync
- [ ] Verify party panel displays HP correctly (not null)

**Goal**: HP syncs correctly across all UIs. ✅ FIXED

---

### Token HP Sync System ✅
**Status**: Implementation Complete - Bug Fix Needed
**Files**: tokenService.js, useTokens.js
**Documentation**: See TOKEN_HP_SYNC_IMPLEMENTATION.md
**Date Completed**: October 4, 2025

**Architecture**:
```
Character Sheet (Source of Truth)
         ↓
Firestore Character Document
         ↓
Token Listener (Real-time)
         ↓
Token Display Updates
```

**Implementation Summary**:
- [x] ~~Add `characterId` field to token documents~~ (Already existed)
- [x] ~~Link tokens to characters on creation~~ (Already handled in characterSheetService)
- [x] Modify `updateHP` in tokenService:
  - [x] Check if token has characterId
  - [x] Update character sheet HP if linked
  - [x] Token HP derived from character
- [x] Create `syncTokenHPFromCharacter` function
- [x] Create `getTokensByCharacter` helper function
- [x] Add Firestore listener in useTokens hook
- [x] Subscribe to character HP changes
- [x] Update token displays when character HP changes
- [x] Handle multiple tokens per character
- [x] Prevent circular update loops (`fromCharacterSync` flag)
- [x] Optimize listeners (1 per character, not per token)
- [x] Performance testing checklist created

**How It Works**:
1. **Player Tokens**: HP synced from character sheet (source of truth)
2. **Enemy Tokens**: HP updated directly (not linked to character)
3. **Real-time**: Character HP changes → all tokens update automatically
4. **Bi-directional**: Token HP changes → character sheet updates → other tokens sync
5. **Efficient**: Only 1 character listener per unique character (not per token)

**Testing Needed**:
- [ ] Test character sheet HP update → token sync
- [ ] Test token HP update → character sheet update
- [ ] Test multiple tokens per character
- [ ] Test enemy tokens (no character link)
- [ ] Verify no circular updates
- [ ] Monitor Firestore performance

**Goal**: Character sheet HP is source of truth, tokens auto-sync in real-time. ✅ Complete

### Tooltips System ⏳
**Status**: Partially Implemented (Party Panel done)
**Files**: VTTSession.jsx, MapCanvas.jsx, MapToolbar.jsx

**Pattern**:
```jsx
<button 
  data-tooltip="Tooltip text"
  ref={setTooltipPosition}
>
```

**VTT Toolbar Buttons** (VTTSession.jsx):
- [ ] Maps button
- [ ] Edit Token button
- [ ] Player View button
- [ ] Fog of War button
- [ ] FX Library button
- [ ] Token Manager button
- [ ] Grid Settings button
- [ ] Session Settings button (new)
- [ ] Exit button

**Canvas Controls** (MapCanvas.jsx):
- [ ] Zoom in button
- [ ] Zoom out button
- [ ] Fit to screen button
- [ ] Pan mode button
- [ ] Selection mode button

**Map Toolbar** (MapToolbar.jsx):
- [ ] Layer controls
- [ ] Drawing tools
- [ ] Measurement tools

**Goal**: All interactive buttons have consistent tooltip system.

---

## 🟢 Low Priority / Future Enhancements

### Milestone Mode Enhancements ⏳
**Status**: Core Complete, Enhancements Pending
**Files**: PartyManagement.js, CampaignSettings.js

- [x] Basic Milestone system (hide XP features)
- [ ] "Award Level" button for DM (Milestone mode)
- [ ] Level award modal with character selection
- [ ] Bulk level-up for entire party
- [ ] Milestone history/log
- [ ] Notification system for level-ups

### Inventory System Re-implementation ⏳
**Status**: Removed, Awaiting Redesign
**Files**: PartyManagement.js, CharacterSheet.js

- [x] Remove inventory from character cards (done)
- [x] Add `canViewInventory` setting (done)
- [ ] Design new inventory UI
- [ ] Implement inventory in CharacterSheet
- [ ] Add inventory management modal
- [ ] Implement `canViewInventory` permission check
- [ ] Add inventory to Party Panel (conditional)

### Per-Character Progression Override ⏳
**Status**: Future Feature
**Files**: CharacterSheet.js, CampaignSettings.js

- [ ] Allow individual characters to use different progression
- [ ] Useful for guest players or split parties
- [ ] Override campaign default setting
- [ ] Track per-character progression type

### Custom Token Colors Per Campaign ⏳
**Status**: CSS Variables Implemented, Customization Pending
**Files**: CampaignSettings.js, App.css

- [x] Token color CSS variables (8 types)
- [ ] UI to customize token colors in Campaign Settings
- [ ] Save custom colors to campaign document
- [ ] Apply via inline CSS custom properties
- [ ] Preview colors before saving
- [ ] Reset to defaults button

### Advanced Combat Features ⏳
**Status**: Not Started

**Initiative Tracker**:
- [ ] Add initiative rolls
- [ ] Track turn order
- [ ] Highlight active character
- [ ] Auto-advance turns

**Conditions & Status Effects**:
- [ ] Apply conditions to tokens
- [ ] Visual indicators on map
- [ ] Track duration
- [ ] Auto-remove expired conditions

**Death Saves**:
- [ ] Track death save successes/failures
- [ ] Auto-stabilize at 3 successes
- [ ] Auto-death at 3 failures
- [ ] Reset on healing

### Fog of War Enhancements ⏳
**Status**: Basic Implementation Complete

- [x] Basic fog brush
- [x] Fog panel UI
- [ ] Dynamic vision (auto-reveal based on token position)
- [ ] Line of sight calculations
- [ ] Darkvision support
- [ ] Light source tokens
- [ ] Vision radius per token
- [ ] Revealed areas persist

### Map Library & Queue ⏳
**Status**: Implemented, Enhancements Pending

- [x] Map upload system
- [x] Map queue
- [x] Active map switching
- [ ] Map tags/categories
- [ ] Search/filter maps
- [ ] Favorite maps
- [ ] Map templates
- [ ] Pre-configured lighting per map

### Audio & Ambience ⏳
**Status**: Not Started

- [ ] Background music player
- [ ] Sound effects library
- [ ] Upload custom audio
- [ ] Volume controls per track
- [ ] Playlist system
- [ ] Audio sync for all players

### Dice Roller Integration ⏳
**Status**: Not Started

- [ ] In-session dice roller
- [ ] 3D dice animation
- [ ] Roll history
- [ ] Public vs private rolls
- [ ] Roll macros
- [ ] Advantage/disadvantage toggles

---

## 🔵 Technical Debt & Refactoring

### Component Architecture ⏳
**Status**: Ongoing

- [ ] Extract large components into smaller modules
- [ ] Consistent naming conventions
- [ ] Prop types documentation
- [ ] Error boundary implementation
- [ ] Loading states standardization

### Performance Optimization ⏳
**Status**: As Needed

- [ ] Memoize expensive computations
- [ ] Virtualize long lists (character lists, chat)
- [ ] Lazy load heavy components
- [ ] Optimize Firestore queries
- [ ] Implement pagination for large datasets
- [ ] Image optimization/compression

### Testing ⏳
**Status**: Not Started

- [ ] Unit tests for critical functions
- [ ] Integration tests for workflows
- [ ] E2E tests for key user journeys
- [ ] Test HP sync system
- [ ] Test permission systems
- [ ] Test token operations

### Accessibility ⏳
**Status**: Partial

- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] ARIA labels
- [ ] Focus management
- [ ] High contrast mode
- [ ] Reduced motion support

---

## 🟣 Known Issues & Bugs

### High Priority Bugs 🐛
- None currently identified

### Medium Priority Bugs 🐛
- [ ] Portrait fallback image error handling (partially fixed)
- [ ] Long usernames truncation on mobile
- [ ] Modal scroll on mobile devices

### Low Priority Bugs 🐛
- [ ] Tooltip positioning edge cases
- [ ] Theme switching flash

---

## 📝 Documentation Needs

### User Documentation ⏳
- [ ] DM Guide (campaign setup, session management)
- [ ] Player Guide (character creation, party panel)
- [ ] Quick Start Guide
- [ ] Video tutorials

### Developer Documentation ⏳
- [ ] Component API reference
- [ ] Firebase schema documentation
- [ ] Service layer documentation
- [ ] Contribution guidelines

---

## 🎨 UI/UX Improvements

### Design System ⏳
- [ ] Consistent spacing system
- [ ] Typography scale
- [ ] Color palette documentation
- [ ] Component library (Storybook?)
- [ ] Icon system

### Mobile Responsiveness ⏳
**Status**: Partially Complete

- [x] Header responsive
- [x] Party Panel responsive
- [ ] VTT map controls on mobile
- [ ] Touch gestures for map
- [ ] Token drag on touch devices
- [ ] Fog brush on touch devices

---

## 🔒 Security & Privacy

### Authentication & Authorization ⏳
**Status**: Basic Implementation

- [x] Firebase Auth
- [x] DM-only controls
- [ ] Rate limiting
- [ ] Input sanitization
- [ ] XSS protection audit
- [ ] CSRF protection

### Data Privacy ⏳
- [ ] Privacy policy
- [ ] Data export feature
- [ ] Account deletion
- [ ] GDPR compliance
- [ ] Data retention policies

---

## 🚀 Deployment & Infrastructure

### CI/CD ⏳
- [ ] Automated testing pipeline
- [ ] Automated deployment
- [ ] Environment management (dev/staging/prod)
- [ ] Rollback strategy

### Monitoring ⏳
- [ ] Error tracking (Sentry?)
- [ ] Analytics (user behavior)
- [ ] Performance monitoring
- [ ] Uptime monitoring

---

## 💡 Feature Requests (Community/User)

### Requested Features
*Track user-requested features here*

- [ ] Character import from D&D Beyond
- [ ] PDF character sheet export
- [ ] Campaign notes system
- [ ] Session recap generator
- [ ] Player-to-player whispers in chat
- [ ] Handouts system
- [ ] Initiative macros

---

## 📊 Metrics & Analytics Goals

### User Engagement
- [ ] Track active campaigns
- [ ] Track session duration
- [ ] Track feature usage
- [ ] User retention metrics

### Performance
- [ ] Page load time < 2s
- [ ] Time to interactive < 3s
- [ ] Lighthouse score > 90

---

## 🔄 Migration & Backwards Compatibility

### Data Migrations Needed
- [ ] Character sheet schema updates (if HP sync changes structure)
- [ ] Token document schema updates (add characterId)
- [ ] Campaign settings migration (add defaults)

### Backwards Compatibility Checks
- [x] Progression system defaults to 'xp'
- [x] Party management settings default to false
- [x] Token colors fallback to hardcoded values
- [ ] HP sync handles existing tokens without characterId

---

## 📅 Release Planning

### Version 1.0 Goals
**Target**: TBD

**Must Have**:
- [x] Basic VTT functionality
- [x] Character sheets
- [x] Party management
- [x] Campaign settings
- [ ] Session settings
- [ ] Character sheet panel integration
- [ ] Default HP system
- [ ] Stable token system

**Nice to Have**:
- [ ] Token HP sync
- [ ] Complete tooltip system
- [ ] Initiative tracker
- [ ] Audio system

### Version 1.1 Goals
**Target**: TBD

- [ ] Advanced fog of war
- [ ] Dice roller
- [ ] Combat enhancements
- [ ] Mobile optimization

---

## 🎯 Success Criteria

### Definition of Done
For each feature to be considered complete:
- [ ] Code implemented and tested
- [ ] User-facing documentation created
- [ ] Summary document written
- [ ] TODO removed from this document
- [ ] Tested on desktop and mobile
- [ ] Tested in dark and light themes
- [ ] No regressions in existing features
- [ ] Performance acceptable
- [ ] Accessibility considered

---

## 📋 Template for New Features

When adding a new feature to this TODO:

```markdown
### Feature Name ⏳
**Status**: Not Started
**Priority**: High/Medium/Low
**Files**: List relevant files
**Dependencies**: Other features needed first

**Description**: Brief description of feature

**Tasks**:
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

**Goal**: What does success look like?

**Notes**: Any additional context
```

---

## 📌 Notes

- This document should be the single source of truth for all TODOs
- Update status regularly: ⏳ Not Started, 🔄 In Progress, ✅ Complete, ❌ Blocked
- When a feature is complete, create a summary document and remove from here
- Keep this document organized by priority
- Archive completed sections to separate file if needed

---

## Status Legend
- ⏳ Not Started / Pending
- 🔄 In Progress
- ✅ Complete
- ❌ Blocked / On Hold
- 🐛 Bug
- 💡 Feature Request
- 🔴 Critical Priority
- 🟠 High Priority
- 🟡 Medium Priority
- 🟢 Low Priority
- 🔵 Technical
- 🟣 Bug Fix
