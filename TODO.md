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
