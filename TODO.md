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

### Friends List & Social Features 🎮
**Status**: ✅ Complete
**Priority**: 🟠 High (Major social feature)
**Date Started**: October 5, 2025
**Date Completed**: October 5, 2025
**Files**: FriendsListModal.js, UserProfileModal.js, UserMenu.js, friendshipService.js, firestore.rules

**Problem**: No way to connect with other players, manage friendships, or block users.

**Implementation**:

**Friends List Modal**:
1. ✅ Added "Friends List" button to user profile dropdown
2. ✅ Modal with header, search bar, close button
3. ✅ Tabs: "Friends", "Pending", and "Blocked"
4. ✅ Search by username (button-triggered, not real-time)
5. ✅ Search results show profile picture, username, "Add Friend" button
6. ✅ Current friends list shows online status, username, profile picture
7. ✅ Clicking username opens profile modal

**User Profile Modal** (when viewing other users):
1. ✅ Shows user profile picture, username, bio
2. ✅ "Add Friend" button (if not friends)
3. ✅ "Block"/"Unblock" button
4. ✅ View-only profile information
5. ✅ Shows friendship status (friends, pending, blocked)

**Friends Tab**:
- ✅ List of accepted friends
- ✅ Online/offline/away status indicator
- ✅ Click username to open profile modal
- ✅ Option to unfriend (with confirmation)

**Pending Tab**:
- ✅ Received friend requests section
- ✅ Accept/Decline buttons for received requests
- ✅ Sent friend requests section
- ✅ View pending status for sent requests

**Blocked Tab**:
- ✅ List of blocked users
- ✅ "Unblock" button for each user

**Data Model**:
```
/friendships/{friendshipId}
  - userId1
  - userId2
  - status: 'pending' | 'accepted' | 'blocked'
  - initiatorId
  - createdAt
  - acceptedAt

/userProfiles/{userId}/friends: array of friend userIds
/userProfiles/{userId}/blocked: array of blocked userIds
```

**Tasks Completed**:
- [x] Create `FriendsListModal.js` component
- [x] Create `UserProfileModal.js` component
- [x] Add friends list button to user profile dropdown
- [x] Implement search users by username (button-triggered)
- [x] Create `friendshipService.js` with CRUD operations
- [x] Add Firestore collection `/friendships`
- [x] Implement send friend request
- [x] Implement accept/decline friend request
- [x] Implement unfriend
- [x] Implement block user
- [x] Implement unblock user
- [x] Add online status tracking
- [x] Update Firestore security rules for friendships

**Future Enhancements**:
- [ ] Add friend request notifications (toast/badge)
- [ ] Add friend online/offline notifications
- [ ] Add recent activity feed

**Goal**: ✅ Complete social system for connecting players and managing relationships.

---

### Campaign Join Waitlist 🎮
**Status**: ✅ Complete
**Priority**: 🟡 Medium (Nice-to-have social feature)
**Date Started**: October 5, 2025
**Date Completed**: October 5, 2025
**Files**: CampaignBrowser.js, campaignRequestService.js, JoinRequestsPanel.js, firestore.rules

**Problem**: No system for managing campaign join requests when campaigns are full or invite-only.

**Implementation**:

**User Features**:
1. ✅ "Request to Join" button for full campaigns
2. ✅ Request modal with character info and message to DM
3. ✅ View pending request status on campaign cards
4. ✅ Ability to cancel pending requests

**DM Features**:
1. ✅ JoinRequestsPanel component for Campaign Dashboard
2. ✅ View all pending join requests
3. ✅ Approve requests (automatically adds user to campaign)
4. ✅ Deny requests
5. ✅ See requester info, character details, and message

**Data Model**:
```
/campaignRequests/{requestId}
  - campaignId: string
  - userId: string
  - username: string
  - characterName: string
  - characterClass: string (optional)
  - message: string (optional)
  - status: 'pending' | 'approved' | 'denied'
  - createdAt: timestamp
  - processedAt: timestamp | null
  - processedBy: string | null
```

**Tasks Completed**:
- [x] Add "Request to Join" button for full campaigns
- [x] Create `/campaignRequests` Firestore collection
- [x] Create campaignRequestService.js with CRUD operations
- [x] Create JoinRequestsPanel component for DM
- [x] Add request approval/denial logic
- [x] Update campaign member count on approval (via joinCampaign)
- [x] Add Firestore security rules for campaignRequests

**Future Enhancements**:
- [ ] Real-time notifications for DM when new requests arrive
- [ ] Notification to requester when request is approved/denied
- [ ] Request expiration (auto-deny after X days)
- [ ] Request history view for users

**Goal**: ✅ Allow users to request access to campaigns and DMs to manage requests.

---

### Clickable Usernames 🎮
**Status**: ✅ Complete
**Priority**: 🟠 High (Major UX improvement)
**Date Started**: October 5, 2025
**Date Completed**: October 5, 2025
**Files**: FriendsListModal.js, CampaignBrowser.js, CampaignPreview.js, CampaignDashboard.js, CampaignMemberList.js, VoiceChatPanel.js, clickable-username.css

**Problem**: Usernames displayed throughout the app were not interactive, making it difficult to view user profiles quickly.

**Implementation**:

**Locations Made Clickable**:
1. ✅ Friends list (all tabs: Friends, Pending, Blocked)
2. ✅ Campaign browser page (DM names)
3. ✅ Campaign preview page (DM names)
4. ✅ Campaign dashboard Overview tab (DM names)
5. ✅ Campaign dashboard Members tab (all member names)
6. ✅ Voice chat modal (participant names)

**Styling**:
- ✅ Blue color (#1976d2) for clickable usernames
- ✅ Darker blue (#0d47a1) on hover
- ✅ Pointer cursor to indicate clickability
- ✅ Underline text decoration on hover
- ✅ Dark theme support (lighter blue #64b5f6)
- ✅ Smooth transition animations

**User Experience**:
- Clicking any username opens UserProfileModal
- Shows user profile, friendship status, and actions
- Consistent behavior across entire application
- Visual cues make it clear usernames are interactive

**Tasks Completed**:
- [x] Create global `clickable-username.css` with reusable styles
- [x] Add clickable DM names in CampaignBrowser
- [x] Add clickable DM names in CampaignPreview
- [x] Add clickable DM names in Campaign Dashboard Overview
- [x] Add clickable member names in Campaign Dashboard Members tab
- [x] Add clickable participant names in Voice Chat Panel
- [x] Add clickable usernames in FriendsListModal (all tabs)
- [x] Import and add UserProfileModal to all components
- [x] Remove duplicate FriendsListModal.js file
- [x] Update styling with blue colors for better visibility

**Goal**: ✅ Make all usernames throughout the app clickable to quickly view user profiles and manage friendships.

---

### Player Firestore Permission Error 🐛
**Status**: ⏳ Monitor (Possibly one-off error)
**Priority**: 🟡 Medium (Monitor for recurrence)
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

## 🟠 High Priority

### Token, Player, and DM Inventory System 🎒
**Status**: ⏳ Not Started
**Priority**: 🟠 High (Core gameplay feature)
**Date Started**: TBD
**Files**: InventorySystem.js, ItemManager.js, TokenInventory.js, CharacterSheet.js, PartyManagement.js

**Description**: Comprehensive inventory management system for tokens, players, and DM-controlled items.

**Features**:

**Token Inventory**:
- [ ] Each token can carry items
- [ ] Weight/capacity limits based on character stats
- [ ] Quick access inventory panel on token selection
- [ ] Drag-and-drop items between tokens
- [ ] Equipment slots (weapons, armor, accessories)
- [ ] Consumables vs permanent items

**Player Inventory (Character Sheet)**:
- [ ] Full inventory management in character sheet
- [ ] Item categories (weapons, armor, potions, misc)
- [ ] Item search and filtering
- [ ] Sort by name, weight, value, type
- [ ] Equipped items visualization
- [ ] Currency tracking (gold, silver, copper)
- [ ] Encumbrance calculation

**DM Inventory Controls**:
- [ ] View all player inventories
- [ ] Add/remove items from any inventory
- [ ] Award loot to party or individuals
- [ ] Create custom items on-the-fly
- [ ] Item templates library
- [ ] Bulk item operations

**Item Properties**:
- [ ] Name, description, icon/image
- [ ] Weight, value, rarity
- [ ] Item type (weapon, armor, consumable, etc.)
- [ ] Magical properties/effects
- [ ] Quantity/stackable
- [ ] Attunement requirements

**Data Model**:
```
/campaigns/{campaignId}/items/{itemId}
  - name: string
  - description: string
  - type: string
  - weight: number
  - value: number
  - rarity: string
  - quantity: number
  - properties: object
  - createdBy: string (DM userId)

/campaigns/{campaignId}/characters/{characterId}/inventory
  - items: array of itemIds with quantities
  - equipped: object (slot -> itemId)
  - currency: { gold, silver, copper }
  - capacity: number
  - encumbrance: number

/campaigns/{campaignId}/tokens/{tokenId}/inventory
  - items: array (if different from character)
  - quickAccess: array of itemIds
```

**Tasks**:
- [ ] Design inventory data model
- [ ] Create InventorySystem.js component
- [ ] Create ItemManager.js for CRUD operations
- [ ] Add inventory to CharacterSheet
- [ ] Add inventory panel to token selection
- [ ] Implement drag-and-drop functionality
- [ ] Add weight/capacity calculations
- [ ] Create item templates library
- [ ] Add DM inventory controls
- [ ] Implement `canViewInventory` permission
- [ ] Add inventory to Party Panel (conditional)
- [ ] Create item icons/images system
- [ ] Add Firestore security rules for items

**Goal**: Complete inventory management system for all tokens, players, and DM oversight.

---

### Item Creation and Player Trade System 🤝
**Status**: ⏳ Not Started
**Priority**: 🟠 High (Depends on Inventory System)
**Date Started**: TBD
**Files**: ItemCreator.js, TradeModal.js, itemService.js, tradeService.js

**Description**: Allow DMs to create custom items and players to trade items with each other.

**Item Creation (DM Only)**:
- [ ] Item creation modal with form
- [ ] Name, description, icon selection
- [ ] Type selection (weapon, armor, potion, etc.)
- [ ] Weight and value inputs
- [ ] Rarity selection (common, uncommon, rare, etc.)
- [ ] Magical properties editor
- [ ] Custom stat modifiers (AC, damage, etc.)
- [ ] Image upload for custom items
- [ ] Save to item templates library
- [ ] Duplicate existing items
- [ ] Import from D&D 5e SRD items

**Player Trade System**:
- [ ] Initiate trade with another player
- [ ] Trade request notification
- [ ] Trade window with both inventories
- [ ] Drag items to trade offer
- [ ] Include currency in trades
- [ ] Both players must confirm trade
- [ ] Cancel trade at any time
- [ ] Trade history log
- [ ] DM can view/approve/reject trades (optional setting)
- [ ] Trade restrictions (cannot trade quest items, etc.)

**Item Templates Library**:
- [ ] Pre-made item templates (D&D 5e SRD)
- [ ] Custom DM-created templates
- [ ] Search and filter templates
- [ ] Categories and tags
- [ ] Quick add from library
- [ ] Export/import item sets

**Data Model**:
```
/campaigns/{campaignId}/itemTemplates/{templateId}
  - name, description, properties (same as items)
  - isGlobal: boolean (available to all campaigns)
  - createdBy: string (DM userId)

/campaigns/{campaignId}/trades/{tradeId}
  - initiatorId: string
  - recipientId: string
  - initiatorItems: array of { itemId, quantity }
  - recipientItems: array of { itemId, quantity }
  - initiatorCurrency: { gold, silver, copper }
  - recipientCurrency: { gold, silver, copper }
  - initiatorConfirmed: boolean
  - recipientConfirmed: boolean
  - status: 'pending' | 'completed' | 'cancelled'
  - createdAt: timestamp
  - completedAt: timestamp | null
```

**Tasks**:
- [ ] Create ItemCreator.js component
- [ ] Add item creation modal for DM
- [ ] Implement item templates library
- [ ] Import D&D 5e SRD items
- [ ] Create TradeModal.js component
- [ ] Create tradeService.js with trade logic
- [ ] Implement trade request system
- [ ] Add trade notifications
- [ ] Implement drag-and-drop for trades
- [ ] Add trade confirmation flow
- [ ] Create trade history view
- [ ] Add DM trade oversight controls (optional)
- [ ] Add Firestore security rules for trades

**Goal**: Full item creation system for DMs and player-to-player trading functionality.

---

### Firebase Caching System - Component Migration 🗄️
**Status**: ✅ Phase 1, 2 & 3 Complete ✅
**Priority**: 🟠 High (Performance optimization - ongoing)
**Date Completed**: October 5, 2025
**Files**: 21 components migrated + 5 critical bugs fixed + Firestore config updated

**Remaining Tasks**:

**Deploy Firestore Configuration**:
- [ ] Deploy rules: `firebase deploy --only firestore:rules`
- [ ] Deploy indexes: `firebase deploy --only firestore:indexes`

**Add Cache Invalidation to Campaign Mutations**:
- [ ] `campaignService.updateCampaign()` → call `invalidateCampaign(id)`
- [ ] `campaignService.joinCampaign()` → call `invalidateUserCampaigns(userId)`
- [ ] `campaignService.leaveCampaign()` → call `invalidateUserCampaigns(userId)`
- [ ] `campaignService.createCampaign()` → call `invalidateUserCampaigns(userId)`

**Optional Character Components** (migrate as needed):
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

**Goal**: Migrate all major components to use caching hooks, monitor performance improvements with developer dashboard.

---

### Notifications System 🔔
**Status**: ⏳ Not Started
**Priority**: 🟠 High (Important UX feature)
**Date Started**: TBD
**Files**: NotificationsDropdown.js, NotificationService.js, UserMenu.js, firestore.rules

**Description**: Comprehensive notification system to keep users informed of important events.

**Notification Types**:
- [ ] Friend requests (new, accepted, declined)
- [ ] New messages in campaigns
- [ ] Campaign invitations
- [ ] Join request responses (approved/denied)
- [ ] Trade requests and completions
- [ ] Item awarded by DM
- [ ] Level up notifications
- [ ] Session starting soon
- [ ] Mentioned in chat (@username)
- [ ] System announcements

**UI Components**:
- [ ] Notification bell icon in header (next to user menu)
- [ ] Badge showing unread count
- [ ] Dropdown panel with notification list
- [ ] Mark individual as read
- [ ] Mark all as read button
- [ ] Clear all notifications
- [ ] Click notification to navigate to relevant page
- [ ] Notification settings link

**Notification Item Display**:
- [ ] Icon based on type
- [ ] Title and description
- [ ] Timestamp ("5 minutes ago")
- [ ] Read/unread indicator
- [ ] Action buttons (Accept/Decline, View, etc.)
- [ ] Delete individual notification

**Real-time Updates**:
- [ ] Real-time listener for new notifications
- [ ] Toast notification for urgent items (optional)
- [ ] Sound notification (optional, user setting)
- [ ] Desktop notifications (optional, user setting)
- [ ] Notification badge updates in real-time

**Data Model**:
```
/userProfiles/{userId}/notifications/{notificationId}
  - type: string (friend_request, campaign_message, etc.)
  - title: string
  - message: string
  - icon: string (emoji or icon name)
  - read: boolean
  - actionUrl: string (navigate on click)
  - actionData: object (additional data for actions)
  - createdAt: timestamp
  - expiresAt: timestamp | null
  - senderId: string | null (who triggered it)
  - senderName: string | null
```

**Tasks**:
- [ ] Create NotificationsDropdown.js component
- [ ] Add notification bell to header (UserMenu area)
- [ ] Create NotificationService.js
- [ ] Implement real-time listener
- [ ] Add notification badge with count
- [ ] Implement mark as read functionality
- [ ] Add notification creation helpers
- [ ] Integrate with friend request system
- [ ] Integrate with campaign messaging
- [ ] Integrate with trade system
- [ ] Add notification settings (see Player Settings)
- [ ] Add Firestore security rules for notifications
- [ ] Implement notification expiration/cleanup
- [ ] Add toast notifications (optional)
- [ ] Add sound and desktop notifications (optional)

**Goal**: Keep users informed of important events with a comprehensive notification system.

---

### Player Settings Modal ⚙️
**Status**: ⏳ Not Started
**Priority**: 🟠 High (Important for user privacy and experience)
**Date Started**: TBD
**Files**: PlayerSettingsModal.js, UserMenu.js, userSettingsService.js

**Description**: Comprehensive settings modal allowing players to customize their experience and privacy.

**Settings Categories**:

**Privacy Settings**:
- [ ] Profile visibility (public, friends only, private)
- [ ] Show email in profile (toggle)
- [ ] Show last active status (toggle)
- [ ] Who can send friend requests (everyone, friends of friends, no one)
- [ ] Block incoming friend requests (toggle)
- [ ] Who can view character sheets (everyone, friends, campaign members only)
- [ ] Who can send campaign invites (everyone, friends only)

**Notification Settings**:
- [ ] Enable/disable notifications (master toggle)
- [ ] Friend request notifications (toggle)
- [ ] Campaign message notifications (toggle)
- [ ] Mention notifications (toggle)
- [ ] Trade notifications (toggle)
- [ ] DM announcement notifications (toggle)
- [ ] Email notifications (toggle)
- [ ] Desktop notifications (toggle)
- [ ] Sound notifications (toggle)
- [ ] Notification sound selection

**Display Settings**:
- [ ] Theme preference (light, dark, auto)
- [ ] Chat message size (small, medium, large)
- [ ] Show dice roll animations (toggle)
- [ ] Show profile pictures in chat (toggle)
- [ ] Compact mode for lists (toggle)
- [ ] Reduced motion (accessibility)
- [ ] High contrast mode (accessibility)

**Chat Settings**:
- [ ] Profanity filter enabled (toggle)
- [ ] Enter to send messages (toggle vs Ctrl+Enter)
- [ ] Show typing indicators (toggle)
- [ ] Message preview length
- [ ] Auto-scroll chat (toggle)

**Gameplay Settings**:
- [ ] Default dice roll visibility (public, private, DM only)
- [ ] Show HP on tokens (toggle)
- [ ] Token name display preference (character name, username, both)
- [ ] Grid snap sensitivity
- [ ] Fog of war visibility (DM only)

**Account Settings**:
- [ ] Change username
- [ ] Change password
- [ ] Change email
- [ ] Download my data (GDPR)
- [ ] Delete account (with confirmation)

**UI Structure**:
- [ ] Modal with sidebar navigation
- [ ] Categories in sidebar (Privacy, Notifications, Display, etc.)
- [ ] Settings panel on right with form inputs
- [ ] Save button (or auto-save)
- [ ] Reset to defaults button
- [ ] Search settings functionality

**Data Model**:
```
/userProfiles/{userId}/settings
  - privacy: object
    - profileVisibility: string
    - showEmail: boolean
    - showLastActive: boolean
    - friendRequestsFrom: string
    - blockFriendRequests: boolean
    - characterSheetVisibility: string
    - campaignInvitesFrom: string
  - notifications: object
    - enabled: boolean
    - friendRequests: boolean
    - campaignMessages: boolean
    - mentions: boolean
    - trades: boolean
    - dmAnnouncements: boolean
    - email: boolean
    - desktop: boolean
    - sound: boolean
    - soundType: string
  - display: object
    - theme: string
    - chatMessageSize: string
    - showDiceAnimations: boolean
    - showProfilePictures: boolean
    - compactMode: boolean
    - reducedMotion: boolean
    - highContrast: boolean
  - chat: object
    - profanityFilter: boolean
    - enterToSend: boolean
    - showTypingIndicators: boolean
    - messagePreviewLength: number
    - autoScroll: boolean
  - gameplay: object
    - defaultRollVisibility: string
    - showHpOnTokens: boolean
    - tokenNameDisplay: string
    - gridSnapSensitivity: number
```

**Tasks**:
- [ ] Create PlayerSettingsModal.js component
- [ ] Add "Settings" option to user menu dropdown
- [ ] Design settings categories and layout
- [ ] Create userSettingsService.js
- [ ] Implement privacy settings
- [ ] Implement notification settings
- [ ] Implement display settings
- [ ] Implement chat settings
- [ ] Implement gameplay settings
- [ ] Implement account settings
- [ ] Add settings search functionality
- [ ] Implement auto-save or save button
- [ ] Add reset to defaults functionality
- [ ] Apply settings throughout application
- [ ] Add Firestore security rules for settings
- [ ] Add settings migration for existing users

**Goal**: Comprehensive player settings for privacy, notifications, and user experience customization.

---

## 🟡 Medium Priority

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
- [ ] Session Settings button
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

### Complete Project Audit & Refactoring 🔍
**Status**: ⏳ Not Started
**Priority**: 🔵 Technical (High Impact)
**Date Started**: TBD
**Files**: Multiple (entire codebase)

**Description**: Comprehensive audit of the entire project to improve code quality, reduce technical debt, and optimize performance.

**Audit Categories**:

**1. Duplicate Code Detection**:
- [ ] Identify duplicate logic across components
- [ ] Extract common patterns into reusable hooks
- [ ] Create shared utility functions
- [ ] Consolidate similar components
- [ ] Remove copy-pasted code blocks
- [ ] Document common patterns

**2. Firebase Cache Implementation Opportunities**:
- [ ] Audit all Firestore queries
- [ ] Identify uncached real-time listeners
- [ ] Add caching to remaining components
- [ ] Remove redundant Firebase reads
- [ ] Consolidate duplicate queries
- [ ] Implement query result caching
- [ ] Add cache invalidation strategies

**3. Remove Backwards Compatibility Hacks**:
- [ ] Identify temporary fixes and workarounds
- [ ] Remove deprecated code paths
- [ ] Clean up migration code
- [ ] Remove feature flags for completed features
- [ ] Update data models to current schema
- [ ] Remove fallback logic for old data
- [ ] Document breaking changes

**4. Data Model Streamlining**:
- [ ] Audit Firestore collection structure
- [ ] Identify redundant fields
- [ ] Normalize data where appropriate
- [ ] Remove unused fields
- [ ] Consolidate related collections
- [ ] Optimize indexes
- [ ] Document final data models
- [ ] Create migration plan for schema changes

**5. Documentation Cleanup**:
- [ ] Remove outdated documentation files
- [ ] Consolidate similar docs
- [ ] Update README with current features
- [ ] Create concise feature documentation
- [ ] Remove temporary summary files
- [ ] Standardize documentation format
- [ ] Create single source of truth for each topic
- [ ] Archive old implementation notes

**6. Code Quality Improvements**:
- [ ] Remove unused imports
- [ ] Remove dead code (unreachable)
- [ ] Fix ESLint warnings
- [ ] Standardize error handling
- [ ] Add missing prop types
- [ ] Improve variable naming
- [ ] Add JSDoc comments to services
- [ ] Extract magic numbers to constants

**7. Performance Optimizations**:
- [ ] Identify expensive re-renders
- [ ] Add React.memo where appropriate
- [ ] Optimize expensive computations
- [ ] Reduce bundle size
- [ ] Lazy load heavy components
- [ ] Optimize images and assets
- [ ] Remove unused dependencies

**8. Architectural Improvements**:
- [ ] Separate business logic from UI
- [ ] Create consistent service layer
- [ ] Standardize state management patterns
- [ ] Improve component composition
- [ ] Reduce prop drilling
- [ ] Create custom hooks for common logic
- [ ] Improve error boundaries

**9. Testing Infrastructure**:
- [ ] Add unit tests for critical paths
- [ ] Test all service functions
- [ ] Test custom hooks
- [ ] Add integration tests
- [ ] Test edge cases
- [ ] Improve test coverage reporting

**10. Security Audit**:
- [ ] Review Firestore security rules
- [ ] Check for exposed secrets
- [ ] Validate all user inputs
- [ ] Review authentication flows
- [ ] Check for XSS vulnerabilities
- [ ] Review permission checks
- [ ] Audit third-party dependencies

**Tools to Use**:
- [ ] ESLint for code quality
- [ ] SonarQube for code analysis (optional)
- [ ] Bundle analyzer for size optimization
- [ ] React DevTools Profiler for performance
- [ ] Chrome DevTools for network analysis
- [ ] Lighthouse for overall performance

**Deliverables**:
- [ ] Audit report with findings
- [ ] Prioritized refactoring task list
- [ ] Updated documentation
- [ ] Performance metrics before/after
- [ ] Migration guides for breaking changes
- [ ] Best practices guide

**Goal**: Clean, efficient, maintainable codebase with reduced technical debt and improved performance.

---

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
