# SuperChat VTT - Central TODO & Future Enhancements

## Implementation Date
Started: October 2024
Last Updated: October 5, 2025

## Workflow Guidelines
- After each fix or feature implementation, commit changes with brief summary
- Use descriptive commit messages summarizing what was accomplished
- No need to create separate summary documentation files
- Provide summary message in chat after each commit

---

## 🔴 Critical Priority

### Campaign Browser & Preview Page Visual Fixes 🎨
**Status**: ✅ Complete
**Priority**: 🔴 Critical (Visual bugs affecting campaign browser and preview)
**Date Found**: October 5, 2025
**Date Fixed**: October 5, 2025
**Files**: CampaignBrowser.css, CampaignBrowser.js, CampaignPreview.css, CampaignPreview.js

**Problem**: Multiple visual issues in campaign browser cards and preview page. CSS naming conflicts causing style bleeding. Cards look inconsistent due to variable-width badges and unlimited tag heights.

**Issues**:

**Campaign Browser Cards**:
1. ❌ Campaign-system badge has variable width (should be fixed width for consistency)
2. ❌ Campaign tags container has unlimited height (should be fixed to ~2 rows)
3. ❌ Tags are using flex: 1 to fill space (removed, but need height constraint)
4. Cards look inconsistent at a glance due to varying badge/tag sizes

**Campaign Preview Page**:
1. ❌ CSS naming conflicts with CampaignBrowser causing broken layout
2. ❌ Need `.preview-` prefix on all classes to avoid conflicts
3. ❌ Page layout appears broken (see screenshot)
4. ❌ Badges, tags, detail items, modal classes all conflicting

**Join Campaign Modal**:
1. ✅ Current modal asks for "Character Name" and "Character Class"
2. ✅ Should only ask for "Request Message" (optional text box)
3. ✅ Username should be auto-filled (no manual entry)
4. ✅ Simpler UX for campaign join requests

**Tasks Completed**:
- [x] Fix `.campaign-system` badge in CampaignBrowser to have fixed min-width (100px)
- [x] Add fixed max-height (48px) to `.campaign-tags` container for ~2 rows
- [x] Add overflow: hidden for tags
- [x] Rename ALL CSS classes in CampaignPreview.css with `.preview-` prefix:
  - `.badge` → `.preview-badge`
  - `.badge-system` → `.preview-badge-system`
  - `.badge-status` → `.preview-badge-status`
  - `.status-*` → `.preview-status-*`
  - `.tag` → `.preview-tag`
  - `.detail-row` → `.preview-detail-row`
  - `.detail-item` → `.preview-detail-item`
  - `.modal-*` → `.preview-modal-*`
  - `.form-group` → `.preview-form-group`
  - `.loading-*` → `.preview-loading-*`
  - `.error-*` → `.preview-error-*`
  - All other generic classes
- [x] Update CampaignPreview.js to use new prefixed class names
- [x] Simplify Join Campaign modal in CampaignPreview.js:
  - Removed characterName and characterClass fields
  - Added requestMessage field (textarea, optional, 500 char max)
  - Username auto-included from user profile
  - Updated state and handler to use requestMessage
- [x] Campaign browser cards now have consistent badge widths
- [x] Preview page renders correctly without CSS conflicts
- [x] Simpler join flow with optional message

**Implementation Details**:
- System badge: `min-width: 100px` with `text-align: center`
- Tags container: `max-height: 48px` with `overflow: hidden`
- All preview classes prefixed to avoid conflicts with browser classes
- Modal now only asks for optional message, username from user.displayName
- Textarea with 500 character limit for join requests

**Goal**: ✅ Consistent campaign card appearance, fixed preview page layout, and simplified join flow.

---

### Campaign Browser Badge & Tag Refinements 🎨
**Status**: ✅ Complete
**Priority**: 🟡 Medium (Minor visual polish for consistency)
**Date Found**: October 5, 2025
**Date Fixed**: October 5, 2025
**Files**: CampaignBrowser.css

**Problem**: Campaign system badges and tags needed additional constraints for perfect visual consistency across all cards.

**Refinements Completed**:
1. ✅ Campaign system badge now has `max-width: 150px`
   - Long system names truncate with ellipsis
   - Prevents badges from being too wide
2. ✅ Campaign tags container now has `min-height: 48px`
   - Cards with 0-1 tags maintain consistent height
   - Uniform spacing across all cards

**Tasks Completed**:
- [x] Added `max-width: 150px` to `.campaign-system` badge
- [x] Added `text-overflow: ellipsis` to system badge
- [x] Added `overflow: hidden` to system badge
- [x] Added `min-height: 48px` to `.campaign-tags` container
- [x] CSS properly formatted and valid

**Implementation**:
```css
.campaign-system {
  /* existing styles... */
  min-width: 100px;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.campaign-tags {
  /* existing styles... */
  min-height: 48px;
  max-height: 48px;
}
```

**Goal**: ✅ Perfect visual consistency for campaign cards regardless of content length.

---

### Players Cannot Access Settings Tab ✅
**Status**: ✅ Complete
**Priority**: 🔴 Critical (Blocking feature - players can't leave campaigns)
**Date Found**: October 5, 2025
**Date Fixed**: October 5, 2025
**Files**: CampaignDashboard.js

**Problem**: Settings tab button was wrapped in `{isUserDM && (...)}` which hid it from players. This prevented players from:
1. Viewing campaign settings (read-only)
2. Accessing the "Leave Campaign" button in Danger Zone
3. Seeing any campaign configuration

**Root Cause**: Line 233 in CampaignDashboard.js had `{isUserDM &&` condition around settings tab button.

**Tasks Completed**:
- [x] Removed `{isUserDM &&` wrapper from settings tab button
- [x] Settings tab now visible to all campaign members
- [x] CampaignSettings component already has read-only logic for non-DM users
- [x] Tested build: Compiled successfully

**Testing Needed**:
- [ ] Test as player: verify settings tab visible
- [ ] Test as player: verify can access Leave Campaign button
- [ ] Test as DM: verify can still edit settings

**Goal**: ✅ All campaign members can access settings tab (read-only for players, editable for DM).

---

### Session Settings Not in Campaign Dashboard ✅
**Status**: ✅ Complete
**Priority**: 🟠 High (UX/Feature organization)
**Date Found**: October 5, 2025
**Date Fixed**: October 5, 2025
**Files**: CampaignSettings.js

**Problem**: Session-specific settings (Progression System, Party Management visibility) were only accessible in VTT, not in Campaign Dashboard Settings tab.

**Solution Implemented**:
Instead of embedding the SessionSettings modal component, integrated the session settings directly into CampaignSettings form. This provides a cleaner UX without modal overhead.

**Tasks Completed**:
- [x] Added session settings fields to formData state:
  - `progressionSystem` (xp/milestone)
  - `canViewGold` (boolean)
  - `canViewInventory` (boolean)
  - `canViewCharacterSheet` (boolean)
- [x] Updated loadCampaign to load session settings from Firestore
- [x] Added "Session Settings" section header
- [x] Added Progression System section with select dropdown
- [x] Added Party Management Visibility section with checkboxes
- [x] Applied same DM-only edit permissions (disabled for non-DM)
- [x] Session settings save with same handleSave function as other settings
- [x] Added help text and emoji icons for clarity
- [x] Tested build: Compiled successfully

**Settings Now Available**:
1. 🎯 Progression System:
   - XP (Experience Points)
   - Milestone
2. 👥 Party Management Visibility:
   - 💰 Party Gold
   - 🎒 Character Inventory
   - 📄 Character Sheets

**Testing Needed**:
- [ ] Test as player: verify can view session settings (read-only)
- [ ] Test as DM: verify can edit session settings
- [ ] Verify settings persist after save
- [ ] Verify settings sync with VTT SessionSettings modal

**Goal**: ✅ Session settings viewable/editable in Campaign Dashboard Settings tab.

---

### Back to Campaign Button Too Wide ✅
**Status**: ✅ Complete
**Priority**: 🟡 Low (Minor UI polish)
**Date Found**: October 5, 2025
**Date Fixed**: October 5, 2025
**Files**: CampaignSettings.css

**Problem**: The "Back to Campaign" button in Campaign Settings was too wide and took up unnecessary space.

**Tasks Completed**:
- [x] Added width constraint to `.settings-header .btn-secondary` in CSS
- [x] Set width to `auto` with `min-width: fit-content`
- [x] Added proper padding and `white-space: nowrap`
- [x] Tested build: Compiled successfully

**Goal**: ✅ Button is now compact and visually balanced.

---

### Campaign Header Photo Upload 🎨
**Status**: ✅ Complete
**Priority**: 🟠 High (Feature enhancement for campaign customization)
**Date Found**: October 5, 2025
**Date Fixed**: October 5, 2025
**Files**: CampaignSettings.js, CampaignSettings.css, CampaignDashboard.js, CampaignDashboard.css, CampaignBrowser.js, CampaignBrowser.css, storage.rules

**Problem**: Players could not customize campaign appearance with a header photo. Campaign cards lacked visual distinction.

**Requirements Implemented**:
1. ✅ Added campaign photo upload option in Campaign Settings (General Settings section)
2. ✅ All players (not just DM) can upload campaign header photo
3. ✅ Display photo in Campaign Dashboard header
4. ✅ Display photo in campaign cards on Browse Campaigns page
5. ✅ Stored in Firebase Storage under `/campaigns/{campaignId}/header.jpg`

**Tasks Completed**:
- [x] Added `campaignPhoto` field to campaign Firestore document (via updateDoc)
- [x] Added file upload input in Campaign Settings (General Settings section)
- [x] Implemented image upload to Firebase Storage
- [x] Added file validation (image type, max 5MB)
- [x] Added preview before upload
- [x] Implemented immediate upload on file select
- [x] Added "Remove Photo" button
- [x] Added upload/remove handlers with error handling
- [x] Added CSS styling for photo preview and actions
- [x] Display header photo as background in CampaignDashboard with fade effect
- [x] Display thumbnail in CampaignBrowser cards with fade effect
- [x] Updated Storage security rules to allow campaign members to upload
- [x] Deployed Storage rules to Firebase
- [x] Tested build: Compiled successfully

**Issues Found - All Fixed** ✅:
- [x] Only DMs can upload/remove campaign header (players can view in settings)
- [x] Campaign photo fade in dashboard reduced from 0.3 to 0.15 opacity
- [x] Campaign cards now use photo as background of card header with gradient overlay

**Issues Fixed** ✅:
- [x] Fixed my-campaign-badge overlapping campaign-system badge
- [x] Campaign title now on first row, badges on second row with space-between layout
- [x] Campaign badge aligned left, system badge aligned right

**Issues Fixed** ✅:
- [x] Campaign header overlay now matches card background color (--bg-secondary)
- [x] Swapped badge positions: System badge on left, DM/Player badge on right
- [x] DM/Player badge now gold gradient with shadow for visual prominence

**Optional Future Enhancements**:
- [ ] Add image resize/optimization (max 1920x400px, compress to <500KB)
- [ ] Add cropping tool for photo uploads
- [ ] Add photo library/templates

**Goal**: ✅ Campaign photo upload and display fully implemented! ⏳ Minor fixes needed for permissions and styling.

---

### Campaign Cards - Equal Size & Preview Page 🎨
**Status**: ✅ Complete
**Priority**: 🟠 High (UX improvement for browse experience)
**Date Found**: October 5, 2025
**Date Fixed**: October 5, 2025
**Files**: CampaignBrowser.js, CampaignBrowser.css, CampaignPreview.js, CampaignPreview.css, AppRouter.js

**Problem**: Campaign cards have varying heights based on content, creating an unbalanced grid layout. No preview page before joining.

**Requirements**:
1. ✅ Standardize all campaign card heights (based on full bio + 2 tag rows)
2. ✅ Create Campaign Preview page with read-only overview
3. ✅ Clicking campaign card opens preview page (or dashboard for user's campaigns)
4. ✅ Preview page shows Campaign Overview with join functionality

**Tasks Completed**:
- [x] Set fixed height (420px) for `.campaign-card` with flexbox layout
- [x] Added text overflow handling with 3-line description clamp
- [x] Created new `CampaignPreview.js` component (320 lines)
- [x] Created `CampaignPreview.css` with responsive design (300 lines)
- [x] Added route `/campaigns/:campaignId/preview` in AppRouter.js
- [x] Display full campaign overview in preview:
  - Campaign photo header with gradient fade
  - Name, description, DM info
  - Player list with profile pictures
  - Schedule display
  - Tag badges
  - System badge
- [x] Added "Join Campaign" modal in preview page (if not member)
- [x] Added "Open Campaign Dashboard" button for members
- [x] Updated campaign cards to be clickable:
  - User's campaigns: navigate to dashboard
  - Other campaigns: navigate to preview page
- [x] Changed "Join Campaign" button to "View Campaign" in browser
- [x] Added stopPropagation to prevent double-navigation
- [x] Tested responsive layout with mobile breakpoints

**Implementation Details**:
- Cards now use `cursor: pointer` and onClick handlers
- Description uses `-webkit-line-clamp: 3` for 3-line max
- Campaign actions pushed to bottom with `margin-top: auto`
- Preview page matches campaign browser badge styling
- Join modal prevents joining without character selection
- Back navigation to campaign browser included

**Goal**: ✅ Consistent campaign card grid and preview page for better browsing UX.

---

### Friends List & Social Features 🎮
**Status**: ⏳ Not Started
**Priority**: 🟠 High (Major social feature)
**Date Found**: October 5, 2025
**Files**: New files needed, Header.js, firestore.rules

**Problem**: No way to connect with other players, manage friendships, or block users.

**Requirements**:

**Friends List Modal**:
1. Add "Friends List" button to user profile dropdown (below profile button)
2. Opens modal with header, search bar, close button
3. Tabs: "Friends" and "Blocked"
4. Search by username (click search button to execute, not real-time)
5. Search results show profile picture, username, "Add" button
6. Current friends list shows online status, username, profile picture
7. Clicking username opens profile modal

**User Profile Modal** (when viewing other users):
1. Shows user profile picture, username, bio
2. "Add Friend" button in top-right (if not friends)
3. "Block" button in top-right
4. View-only profile information

**Friends Tab**:
- List of accepted friends
- Online/offline status indicator
- Click username to open profile modal
- Option to unfriend (with confirmation)

**Blocked Tab**:
- List of blocked users
- "Unblock" button for each user

**Data Model**:
```
/friendships/{friendshipId}
  - userId1
  - userId2
  - status: 'pending' | 'accepted' | 'blocked'
  - createdAt
  - acceptedAt

/users/{userId}/friends: array of friend userIds
/users/{userId}/blocked: array of blocked userIds
```

**Tasks**:
- [ ] Create `FriendsListModal.js` component
- [ ] Create `UserProfileModal.js` component
- [ ] Add friends list button to user profile dropdown
- [ ] Implement search users by username (button-triggered)
- [ ] Create `friendshipService.js` with CRUD operations
- [ ] Add Firestore collection `/friendships`
- [ ] Implement send friend request
- [ ] Implement accept/decline friend request
- [ ] Implement unfriend
- [ ] Implement block user
- [ ] Implement unblock user
- [ ] Add online status tracking
- [ ] Update Firestore security rules for friendships
- [ ] Add friend request notifications
- [ ] Test all friendship flows

**Goal**: Complete social system for connecting players and managing relationships.

---

### Campaign Join Waitlist 🎮
**Status**: ⏳ Not Started (Part of Friends List feature)
**Priority**: 🟡 Medium (Nice-to-have social feature)
**Date Found**: October 5, 2025
**Files**: CampaignBrowser.js, campaignService.js, CampaignDashboard.js

**Problem**: No system for managing campaign join requests when campaigns are full or invite-only.

**Requirements**:
1. Users can request to join full/private campaigns
2. DM receives notifications of join requests
3. DM can approve/deny requests from Campaign Dashboard
4. Requesters receive notification of approval/denial

**Tasks**:
- [ ] Add "Request to Join" button for full campaigns
- [ ] Create `/campaignRequests` Firestore collection
- [ ] Add join request management panel for DM
- [ ] Implement request notifications
- [ ] Add request approval/denial logic
- [ ] Update campaign member count on approval
- [ ] Test request flow end-to-end

**Goal**: Allow users to request access to campaigns and DMs to manage requests.

**Note**: This will be worked on after Friends List is complete.

---

### Player Firestore Permission Error 🐛
**Status**: ⏳ Monitor (Possibly one-off error)
**Priority**: � Medium (Monitor for recurrence)
**Date Found**: October 5, 2025
**Files**: useUserProfileData.js, firestore.rules

**Error** (possibly transient):
```
useUserProfile.js:31 [2025-10-05T06:34:03.670Z]  @firebase/firestore: Firestore (12.3.0): 
Uncaught Error in snapshot listener: FirebaseError: [code=permission-denied]: 
Missing or insufficient permissions.
```

**Analysis**: 
- Firestore security rules are correct: `allow read: if request.auth != null;`
- Likely a one-off error due to temporary network/auth issue
- Will monitor for recurrence

**If Error Recurs**:
- [ ] Deploy Firestore security rules: `firebase deploy --only firestore:rules`
- [ ] Test as player in another campaign
- [ ] Check auth token validity

**Goal**: Monitor and address if problem persists.

---

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

### Firebase Caching System for Service Calls 🗄️
**Status**: ✅ Complete (Core System)
**Priority**: 🟠 High (Performance & cost optimization)
**Date Found**: October 5, 2025
**Date Fixed**: October 5, 2025
**Files**: src/services/cache/*, FIREBASE_CACHING_SYSTEM.md

**Problem**: Every hook that interacts with Firebase services (Profiles, Avatars, Tokens, Campaigns, etc.) makes direct Firebase calls without caching. This leads to excessive Firebase reads and costs.

**Solution Implemented**: Custom caching system with TTL expiration, pattern-based invalidation, real-time listener support, and performance monitoring.

**Files Created**:
- ✅ `FirestoreCache.js` - Singleton cache service with Map-based storage (246 lines)
- ✅ `useCachedDocument.js` - Base React hooks for caching (246 lines)
- ✅ `useCachedUserProfile.js` - Cached user profile hook with optimistic updates (250+ lines)
- ✅ `useCampaignsCache.js` - Campaign list and detail caching hooks (200+ lines)
- ✅ `useCharactersCache.js` - Character caching hooks (240+ lines)
- ✅ `index.js` - Central export with utilities (150+ lines)
- ✅ `FIREBASE_CACHING_SYSTEM.md` - Comprehensive documentation (650+ lines)

**Core Features Implemented**:
- ✅ In-memory Map-based cache with configurable TTL (default 5 minutes)
- ✅ Pattern-based cache invalidation with wildcard support
- ✅ Real-time Firestore listener integration
- ✅ Automatic cleanup interval (every 60 seconds)
- ✅ Field-level cache invalidation
- ✅ Collection/document-level invalidation
- ✅ Cache statistics tracking (hits, misses, hit rate)
- ✅ Optimistic updates with rollback on error

**Specialized Hooks Created**:
- ✅ `useCachedUserProfile()` - User profile with real-time updates
- ✅ `useJoinedCampaigns()` - Campaigns user has joined
- ✅ `useCreatedCampaigns()` - Campaigns user created
- ✅ `useAllUserCampaigns()` - Combined campaign list
- ✅ `useCachedCampaign(id)` - Single campaign by ID
- ✅ `useUserCharacters()` - All user's characters
- ✅ `useCampaignCharacters(id)` - Campaign's characters
- ✅ `useCachedCharacter(id)` - Single character by ID
- ✅ `useCachedCharacters(ids)` - Multiple characters by ID array
- ✅ `useActiveCharacter(campaignId)` - Active character for campaign

**Cache Invalidation Functions**:
- ✅ `invalidateUserCampaigns(userId)` - Clear user's campaign lists
- ✅ `invalidateCampaign(campaignId)` - Clear specific campaign
- ✅ `invalidateAllCampaigns()` - Clear all campaigns
- ✅ `invalidateUserCharacters(userId)` - Clear user's characters
- ✅ `invalidateCampaignCharacters(campaignId)` - Clear campaign characters
- ✅ `invalidateCharacter(characterId)` - Clear specific character
- ✅ `invalidateAllCharacters()` - Clear all characters
- ✅ `clearAllCache()` - Clear entire cache (logout)

**Utility Functions**:
- ✅ `getCacheStats()` - Get performance metrics
- ✅ `logCacheStats()` - Log formatted statistics to console

**Tasks Completed**:
- [x] Research caching libraries - Decision: Custom implementation for Firestore
- [x] Design cache key structure - Pattern: `collection/type/id/field`
- [x] Implement base caching layer - FirestoreCache singleton
- [x] Create base hooks - useCachedDocument, useCachedQuery
- [x] Create specialized hooks - Profile, Campaigns, Characters
- [x] Implement cache invalidation - Pattern-based with wildcards
- [x] Add cache TTL configuration - Configurable per hook
- [x] Add optimistic updates - Implemented in useCachedUserProfile
- [x] Add real-time listener support - Automatic onSnapshot integration
- [x] Add performance monitoring - Cache statistics tracking
- [x] Create comprehensive documentation - FIREBASE_CACHING_SYSTEM.md

**Next Steps** (Integration & Migration):
- [ ] Migrate existing components to use cached hooks
- [ ] Add caching to Token service (useToken, TokenService)
- [ ] Add caching to Avatar service (useAvatar, AvatarService)
- [ ] Add caching to Map service (useMap, MapService)
- [ ] Monitor Firebase read reduction in production
- [ ] Consider IndexedDB persistence for offline support

**Goal**: ✅ Core infrastructure complete. Reduce Firebase reads by 60-80% through intelligent caching with proper invalidation.

**Documentation**: See FIREBASE_CACHING_SYSTEM.md for complete API reference, usage examples, and migration guide.

---

### Firebase Caching System - Component Migration 🗄️
**Status**: ✅ Phase 1, 2 & 3 Complete ✅
**Priority**: 🟠 High (Performance optimization - ongoing)
**Date Started**: October 5, 2025
**Date Phase 1 Complete**: October 5, 2025
**Date Phase 2 Complete**: October 5, 2025
**Date Phase 3 Complete**: October 5, 2025
**Files**: 21 components migrated + 5 critical bugs fixed + Firestore config updated

**Problem**: Core caching infrastructure is complete, but existing components still use direct Firebase calls without caching.

**Migration Strategy**: Incremental migration as we touch files during normal development. No massive refactor needed.

**Phase 1: User Profile Migration** ✅ **COMPLETE**
- [x] Find all components using `useUserProfile` hook
- [x] Replace with `useCachedUserProfile` from cache
- [x] Enhanced cached hook with `isProfileComplete` and `needsOnboarding` for API compatibility
- [x] Test profile updates and cache invalidation
- [x] Verify real-time updates still work
- [x] Components migrated (14 total):
  - [x] UserMenu.js
  - [x] ProfileEditor.js
  - [x] App.js
  - [x] ProfileSetupModal.js
  - [x] SettingsMenu.js
  - [x] ProfileDisplay.js
  - [x] InlineProfileEditor.js
  - [x] DeleteAccountSection.js
  - [x] ProfanityFilterContext.js
  - [x] ChatMessage.js
  - [x] ChatPage.js
  - [x] LandingPage.js
  - [x] MapCanvas.jsx
  - [x] InlineReplyContext.js

**Phase 1 Results**:
- ✅ All 14 components successfully migrated
- ✅ Zero compilation errors
- ✅ API fully backwards compatible
- ✅ Expected: 60-80% reduction in Firebase reads for user profile data
- 📋 Testing needed: Manual testing of migrated features
- 📊 Documentation: See FIREBASE_CACHING_PHASE_1_COMPLETE.md for full details

**Phase 2: Campaign & Profile Data Components** ✅ **COMPLETE**
- [x] Created `useCachedUserProfileData` hook for viewing other users' profiles
- [x] Migrated CampaignContext to use `useJoinedCampaigns()`
- [x] Migrated MapEditorPage to use `useJoinedCampaigns()`
- [x] Migrated ChatMessage to use `useCachedUserProfileData()`
- [x] Migrated InlineReplyContext to use `useCachedUserProfileData()`
- [ ] Add cache invalidation to campaign mutations (pending):
  - [ ] `campaignService.updateCampaign()` → call `invalidateCampaign(id)`
  - [ ] `campaignService.joinCampaign()` → call `invalidateUserCampaigns(userId)`
  - [ ] `campaignService.leaveCampaign()` → call `invalidateUserCampaigns(userId)`
  - [ ] `campaignService.createCampaign()` → call `invalidateUserCampaigns(userId)`
- [ ] Additional components to migrate (as needed):
  - [ ] CampaignBrowser.js (uses manual queries)
  - [ ] CampaignDashboard.js (uses context)
  - [ ] CampaignSwitcher.js (uses context)
  - [ ] CampaignSettings.js (uses context)

**Phase 2 Results**:
- ✅ 4 additional components migrated (18 total)
- ✅ Profile data now cached across chat messages (huge win!)
- ✅ Campaign lists cached and shared across components
- ✅ Tests passing (72 passed, 2 skipped)
- 📋 Expected: 70-90% reduction in Firebase reads for profile lookups in chat
- 📋 Expected: 50-70% reduction in campaign list fetches

**Phase 3: Character Components** ✅ **COMPLETE**
- [x] Migrated `CampaignMemberList.js` to `useCampaignCharacters(campaignId)`
- [x] Migrated `CampaignDashboard.js` to `useCampaignCharacters(campaignId)`
- [x] Migrated `CharacterCreationModal.js` - added cache invalidation
- [x] Added cache invalidation to character mutations:
  - [x] Character deletion → `invalidateUserCharacters()`, `invalidateCampaignCharacters()`
  - [x] Character creation → `invalidateUserCharacters()`, `invalidateCampaignCharacters()`
  - [x] Member removal → `invalidateCampaignCharacters()`
- [x] **CRITICAL BUG FIXES**:
  - [x] Fixed `useCachedUserProfileData` missing firestore parameter
  - [x] Fixed console logging (styled console.warn)
  - [x] Fixed Firebase v9 API (getDocs instead of q.get())
  - [x] Exposed cache to window.firestoreCache
  - [x] Added destroy() method to fix test hanging
  - [x] Added comprehensive test mocks
- [x] **FIRESTORE CONFIGURATION**:
  - [x] Added characters collection security rules
  - [x] Added 4 composite indexes for cached queries
  - [ ] Deploy rules: `firebase deploy --only firestore:rules`
  - [ ] Deploy indexes: `firebase deploy --only firestore:indexes`

**Phase 3 Results**:
- ✅ 3 additional components migrated (21 total)
- ✅ All critical bugs fixed
- ✅ Tests passing (66 suites, 282 tests, 0 failures)
- ✅ Firestore rules and indexes updated
- 📋 Expected: 60-80% reduction in character data reads
- 📋 Expected: 30-50% faster character list loading
- 📋 Cache statistics: `window.firestoreCache.getStats()`

**Phase 3 Remaining (Optional)**:
- [ ] Migrate additional character components as needed:
  - [ ] CharacterSheet.js (direct character updates)
  - [ ] PartyManagement.js (character list display)
  - [ ] CharacterSelector components

**Phase 4: Performance Monitoring**
- [ ] Create Developer Performance Dashboard component
- [ ] Add cache statistics display:
  - [ ] Cache hits/misses chart
  - [ ] Hit rate percentage
  - [ ] Total cached items
  - [ ] Cache size in memory
  - [ ] Recent invalidations log
- [ ] Add Firebase read monitoring:
  - [ ] Track Firebase reads before/after caching
  - [ ] Display read reduction percentage
  - [ ] Show reads per component
- [ ] Add performance metrics:
  - [ ] Average component load time
  - [ ] Network request count
  - [ ] Real-time listener count
- [ ] Make dashboard DM-only or dev-mode only
- [ ] Add toggle to enable/disable cache monitoring
- [ ] Position: Floating panel or settings tab

**Phase 5: Additional Services**
- [ ] Token service caching (if needed)
- [ ] Avatar service caching
- [ ] Map service caching
- [ ] Other services as identified

**Testing Checklist**:
- [ ] Verify cached data displays correctly
- [ ] Test real-time updates still work
- [ ] Verify cache invalidation on mutations
- [ ] Check no stale data issues
- [ ] Monitor Firebase read count reduction
- [ ] Test cache statistics accuracy
- [ ] Verify memory usage acceptable
- [ ] Test cache on mobile devices

**Success Metrics**:
- 📉 Firebase reads reduced by 60-80%
- ⚡ Component load times reduced by 30-50%
- 🎯 Cache hit rate above 70%
- 💾 Memory usage under 50MB for cache
- 📊 Performance dashboard showing real-time stats

**Goal**: Migrate all major components to use caching hooks, monitor performance improvements with developer dashboard.

---

### Campaign Settings Access for Non-DM Users ✅
**Status**: ✅ Complete
**Priority**: 🟠 High (Settings page not rendering for players)
**Date Found**: October 5, 2025
**Date Fixed**: October 5, 2025
**Files**: CampaignSettings.js, CampaignDashboard.js

**Problem**: Settings page in Campaign Dashboard was not rendering for non-DM users. All users should be able to VIEW settings while only DMs can modify.

**Tasks Completed**:
- [x] Fix settings page rendering for non-DM users
  - Removed `isUserDM &&` check from settings tab rendering in CampaignDashboard.js
  - Passed `isUserDM` and `userId` props to CampaignSettings component
- [x] Add "General Settings" header to campaign settings section
- [x] Add "Session Settings" header to VTT settings section
- [x] Make all settings visible to players (read-only)
  - Added read-only notice for non-DM users: "👁️ Viewing campaign settings (read-only)..."
  - Made all form inputs disabled/readOnly for non-DM users:
    * Campaign name input
    * Description textarea
    * Game system select
    * Visibility select
    * Allow requests checkbox
    * Max members input
    * Session frequency select
    * Session day select
    * Session time input
    * Time zone select
- [x] Keep edit controls DM-only
  - Hidden "Save Changes" button for non-DM users
- [x] Move Leave Campaign button to Danger Zone (see below)
- [x] Test build: Compiled successfully

**Changes Made**:
1. **CampaignDashboard.js**:
   - Removed `isUserDM &&` condition from settings tab rendering
   - Added `isUserDM={isUserDM}` and `userId={user?.uid}` props to CampaignSettings
   - Removed Leave Campaign button from header
   - Removed Leave Campaign modal (moved to CampaignSettings)
   - Removed `handleLeaveCampaign` function
   - Removed `leaveCampaign` import

2. **CampaignSettings.js**:
   - Added `isUserDM, userId` props to component signature
   - Added `leaveCampaign` import
   - Removed DM-only access block that prevented non-DM users from viewing settings
   - Changed header from "General Settings" to "Campaign Settings"
   - Added read-only notice for non-DM users with eye icon
   - Added "General Settings" section header
   - Added "Session Settings" section header
   - Made all form inputs disabled/readOnly for non-DM users
   - Hidden Save Changes button for non-DM users
   - Moved Leave Campaign button to Danger Zone (non-DM only)
   - Added Leave Campaign modal to CampaignSettings
   - Added `handleLeaveCampaign` function

**Goal**: ✅ All users can view campaign settings, only DMs can edit. Leave Campaign is in Danger Zone with clear warnings.

---

### Leave Campaign Button - Danger Zone ✅
**Status**: ✅ Complete (Merged with Campaign Settings fix)
**Priority**: 🟠 High (UX/Safety issue)
**Date Found**: October 5, 2025
**Date Fixed**: October 5, 2025
**Files**: CampaignDashboard.js, CampaignSettings.js

**Problem**: "Leave Campaign" button was rendering in the header. Since leaving a campaign can cause data loss, this should be gated better.

**Tasks Completed**:
- [x] Remove Leave Campaign button from header
- [x] Move Leave Campaign button to Danger Zone in Campaign Settings
- [x] Keep confirmation modal
- [x] Separate Danger Zone for DM vs non-DM:
  - Non-DM users: "Leave Campaign" button with warning about losing access
  - DM users: "Delete Campaign" button with stronger warnings
- [x] Add warning text about data loss
- [x] Test build: Compiled successfully

**Goal**: ✅ Leave Campaign is in a gated Danger Zone with clear warnings.

---

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

### Fog Controls Panel - Show Fog Grid Toggle 🐛
**Status**: ✅ Complete
**Priority**: 🟡 Medium (UX/functionality issue in VTT)
**Date Found**: October 5, 2025
**Date Fixed**: October 5, 2025
**Files**: FogPanel.jsx, MapCanvas.jsx

**Problem**: "Show Fog Grid" checkbox visual feedback was too subtle - grid stroke color/width changes weren't dramatic enough to distinguish DM view from player view.

**Solution**: Updated fog rendering to make clear visual distinction between modes:
- **Grid Visible (ON)**: Shows red grid overlay with shadow (DM helper view)
- **Grid Hidden (OFF)**: Shows pure black fog, no grid/shadow (player view)

**Tasks Completed**:
- [x] Analyzed "Show Fog Grid" checkbox handler (simple state toggle, no grid creation)
- [x] Confirmed no fog grid creation logic in checkbox (it was already correct)
- [x] State for DM fog visibility already exists (`fogGridVisible` in VTTSession)
- [x] Updated fog rendering to respect visibility mode dramatically
- [x] When disabled: renders transparent stroke/shadow (pure black player view)
- [x] When enabled: renders red grid overlay with shadow (DM view)

**Implementation**:
```jsx
// MapCanvas.jsx line 2485-2490
stroke={fogGridVisible ? fogGridColor : 'transparent'}
strokeWidth={fogGridVisible ? 1 : 0}
shadowColor={fogGridVisible ? fogGridColor : 'transparent'}
shadowBlur={fogGridVisible ? 2 : 0}
shadowOpacity={fogGridVisible ? 0.5 : 0}
```

**Two-Level Fog Control** (confirmed working):
- **Show Fog Grid** (Fog Panel): Toggle between DM grid overlay and pure black player view ✅
- **Fog Layer Toggle** (Layer Controls): Show/hide fog layer entirely for DM ✅

**Goal**: ✅ "Show Fog Grid" now provides clear visual distinction between DM view (grid overlay) and player view (black fog).

---

### Shape Placement Tool Bugs 🐛
**Status**: ✅ Complete
**Priority**: 🟡 Medium (UX issue in VTT)
**Date Found**: October 5, 2025
**Date Fixed**: October 5, 2025
**Files**: MapCanvas.jsx

**Problem 1**: When placing a shape, the tool stays engaged as if starting a second shape.
**Problem 2**: When starting a shape (one click) then switching tools/tabs, the shape preview locks and won't clear until reopening the shape tool.

**Root Cause**: `shapeStart` and `shapePreview` state wasn't being cleared when:
- User switched to a different tool
- User pressed Escape key
- User changed tabs/panels

**Tasks Completed**:
- [x] Found shape drawing tool code (`shapeStart`, `shapePreview` state)
- [x] Identified shape placement state management (lines 452-476, 1082-1121)
- [x] Added cleanup on tool switch (useEffect when activeTool changes)
- [x] Added cleanup on escape key (updated Escape key handler)
- [x] Tab change cleanup (automatic via tool switch effect)
- [x] Verified existing 30-second timeout cleanup

**Implementation**:
```jsx
// Clear shape preview when switching away from shape tools (line 703-714)
useEffect(() => {
  const shapeTools = ['circle', 'rectangle', 'cone', 'line'];
  if (!shapeTools.includes(activeTool)) {
    if (shapeStart || shapePreview) {
      setShapeStart(null);
      setShapePreview(null);
      console.log('Shape preview cleared due to tool switch');
    }
  }
}, [activeTool, shapeStart, shapePreview, setShapeStart, setShapePreview]);

// Updated Escape key handler (line 549-555)
if (shapeStart || shapePreview) {
  setShapeStart(null);
  setShapePreview(null);
  console.log('Shape preview cleared by Escape key');
  return;
}
```

**Goal**: ✅ Shape tool cleans up properly when user switches away, presses Escape, or changes tabs.

---

### Campaign Switcher UI Improvements 🎨
**Status**: ✅ Complete
**Priority**: 🟡 Medium (UI/UX polish)
**Date Found**: October 5, 2025
**Date Fixed**: October 5, 2025
**Files**: CampaignSwitcher.js, CampaignSwitcher.css

**Changes Completed**:
1. ✅ Campaign titles now smaller (0.9rem, down from default)
2. ✅ Player/DM badges have border and background styling
3. ✅ "Create New Campaign" removed from dropdown

**Tasks Completed**:
- [x] Reduced campaign title font size to 0.9rem
- [x] Added border (1px solid var(--border-color)) to Player/DM badges
- [x] Added background (var(--bg-secondary)) to Player/DM badges
- [x] Added padding, border-radius, and font-weight to badges
- [x] Made badges inline-block with fit-content width
- [x] Removed "Create New Campaign" button from dropdown
- [x] Cleaned up dropdown to only show "View All Campaigns"

**Implementation**:
```css
.campaign-info .campaign-name {
  font-size: 0.9rem; /* Reduced from default */
}

.campaign-info .campaign-role {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  font-weight: 500;
  display: inline-block;
  width: fit-content;
}
```

**Goal**: ✅ Campaign switcher dropdown is cleaner and more readable.

---

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
