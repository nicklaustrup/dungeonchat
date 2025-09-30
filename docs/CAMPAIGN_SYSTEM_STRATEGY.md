# Campaign System Strategy Document

## Overview

This document outlines the strategic approach for implementing a campaign-based chat system for DungeonChat, transforming it from a single general chat room into a multi-campaign D&D platform where users can create and join specific campaign instances, each with their own isolated chat channels.

## Current State Analysis

### Existing Architecture
- **Single Chat Room**: All users currently join a shared global chat room
- **Firebase Stack**: Firestore (messages), RTDB (presence/typing), Auth (Google OAuth), Storage (images)
- **Data Collections**:
  - `messages` - Global message collection
  - `userProfiles` - User profile data
  - `usernames` - Username availability tracking
  - `presence` - User presence data
- **Key Components**: `ChatPage`, `ChatRoom`, `ChatInput`, `ChatHeader`
- **State Management**: Context-based with `ChatStateContext`

### Current User Flow
1. User signs in with Google OAuth
2. Automatically joined to the general chat room
3. Can send messages, reactions, replies, images
4. Real-time presence and typing indicators

## Strategic Vision

### Goal
Transform DungeonChat into a campaign-centric platform where:
- Users can create D&D campaigns (as Dungeon Masters)
- Players can discover and join campaigns
- Each campaign has isolated chat channels
- General lobby exists for campaign discovery and general discussion
- Rich campaign metadata supports D&D-specific features

### Core Principles
1. **Preserve Current UX**: Existing chat functionality remains intact within campaign contexts
2. **Progressive Enhancement**: Add campaign features without breaking existing user flows
3. **Scalable Architecture**: Design for future D&D-specific features (character sheets, dice rolling, etc.)
4. **Social Discovery**: Enable players to find campaigns and DMs to find players

## Phase 1: Foundation & Data Model

### 1.1 Data Architecture

#### New Collections

```javascript
// campaigns/{campaignId}
{
  id: 'auto-generated',
  name: 'The Lost Mines of Phandelver',
  description: 'A classic D&D 5e adventure for new players...',
  dmId: 'user123', // Dungeon Master's uid
  maxPlayers: 6,
  currentPlayers: 3,
  visibility: 'public', // 'public', 'private', 'invite-only'
  gameSystem: 'D&D 5e', // 'D&D 5e', 'Pathfinder', 'Custom', etc.
  campaignImage: 'https://storage.../campaign-image.jpg',
  settings: {
    allowSpectators: false,
    requireApproval: true,
    allowPlayerInvites: false
  },
  status: 'recruiting', // 'recruiting', 'active', 'completed', 'paused'
  createdAt: Timestamp,
  updatedAt: Timestamp,
  lastActivity: Timestamp,
  tags: ['beginner-friendly', 'roleplay-heavy', 'weekly']
}

// campaigns/{campaignId}/members/{userId}
{
  userId: 'user456',
  role: 'player', // 'dm', 'player', 'spectator'
  status: 'active', // 'pending', 'active', 'invited', 'banned'
  joinedAt: Timestamp,
  lastActive: Timestamp,
  characterName: 'Thorin Ironforge', // Optional
  characterClass: 'Fighter', // Optional
  notes: 'Prefers evening sessions' // DM notes
}

// campaigns/{campaignId}/channels/{channelId}
{
  id: 'general', // 'general', 'character-discussion', 'ooc', custom names
  name: 'General Chat',
  description: 'Main campaign discussion',
  type: 'text', // Future: 'voice', 'dice-rolling'
  visibility: 'all', // 'all', 'players-only', 'dm-only'
  createdAt: Timestamp,
  createdBy: 'user123'
}

// campaigns/{campaignId}/channels/{channelId}/messages/{messageId}
{
  // Extends existing message schema
  text: 'Rolling for initiative!',
  uid: 'user456',
  displayName: 'Alice',
  campaignId: 'campaign123',
  channelId: 'general',
  // ... existing message fields (reactions, replies, etc.)
}

// userCampaigns/{userId}
{
  activeCampaigns: ['campaign1', 'campaign2'],
  dmCampaigns: ['campaign3'],
  favoriteCampaigns: ['campaign4'],
  lastViewedCampaign: 'campaign1',
  campaignInvites: ['campaign5']
}
```

#### Modified Collections

```javascript
// userProfiles/{userId} - Extend existing
{
  // ... existing fields
  campaignPreferences: {
    gameSystems: ['D&D 5e', 'Pathfinder'],
    playerType: 'social', // 'tactical', 'social', 'exploration', 'mixed'
    availability: 'evenings-weekends',
    experienceLevel: 'beginner'
  },
  dmProfile: {
    isDM: false,
    dmRating: 4.5,
    campaignsRun: 3,
    dmStyle: 'story-focused' // 'story-focused', 'tactical', 'sandbox'
  }
}
```

### 1.2 Firebase Security Rules Extension

```javascript
// Add to existing firestore.rules
match /campaigns/{campaignId} {
  // Anyone can read public campaigns
  allow read: if request.auth != null && 
    (resource.data.visibility == 'public' || 
     exists(/databases/$(database)/documents/campaigns/$(campaignId)/members/$(request.auth.uid)));
  
  // Only DM can create/update campaign
  allow create: if request.auth != null && 
    request.auth.uid == request.resource.data.dmId;
  allow update: if request.auth != null && 
    request.auth.uid == resource.data.dmId;
    
  match /members/{userId} {
    allow read: if request.auth != null;
    allow write: if request.auth != null && 
      (request.auth.uid == userId || 
       request.auth.uid == get(/databases/$(database)/documents/campaigns/$(campaignId)).data.dmId);
  }
  
  match /channels/{channelId}/messages/{messageId} {
    allow read: if request.auth != null && 
      exists(/databases/$(database)/documents/campaigns/$(campaignId)/members/$(request.auth.uid));
    allow create: if request.auth != null && 
      request.auth.uid == request.resource.data.uid &&
      exists(/databases/$(database)/documents/campaigns/$(campaignId)/members/$(request.auth.uid));
  }
}

match /userCampaigns/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

### 1.3 URL Routing Strategy

```
Current: /chat
Proposed:
- / (landing/campaign discovery)
- /lobby (general chat - existing functionality)
- /campaigns (campaign browser)
- /campaign/{campaignId} (campaign dashboard)
- /campaign/{campaignId}/chat (campaign chat - reuses existing ChatPage)
- /campaign/{campaignId}/chat/{channelId} (specific channel)
- /create-campaign (campaign creation)
- /profile (user profile with campaign preferences)
```

## Phase 2: Core Implementation

### 2.1 Campaign Management Components

#### New Components Needed

```javascript
// src/components/Campaign/
├── CampaignBrowser.js         // Browse/search campaigns
├── CampaignCard.js            // Campaign preview card
├── CampaignDashboard.js       // Campaign overview page
├── CampaignCreator.js         // Create new campaign form
├── CampaignSettings.js        // DM campaign configuration
├── CampaignMemberList.js      // View campaign members
├── ChannelSidebar.js          // Channel navigation
├── JoinCampaignModal.js       // Join campaign flow
└── LeaveCampaignModal.js      // Leave campaign confirmation

// src/components/Navigation/
├── CampaignNavbar.js          // Top navigation with campaign context
└── CampaignSwitcher.js        // Quick campaign switching dropdown
```

#### Modified Components

```javascript
// src/pages/ChatPage.js - Make campaign-aware
function ChatPage({ campaignId, channelId }) {
  // Add campaign context
  // Modify message queries to filter by campaign/channel
  // Update presence tracking to be campaign-scoped
}

// src/hooks/useChatMessages.js - Extend for campaigns
export function useChatMessages({ 
  firestore, 
  campaignId = null, 
  channelId = 'general',
  limitBatchSize = 25, 
  maxLimit = 1000 
}) {
  // Modify collection reference based on campaign context
  const messagesRef = React.useMemo(() => {
    if (!firestore) return null;
    
    if (campaignId) {
      // Campaign-specific messages
      return collection(firestore, 'campaigns', campaignId, 'channels', channelId, 'messages');
    } else {
      // Global lobby messages (existing)
      return collection(firestore, 'messages');
    }
  }, [firestore, campaignId, channelId]);
  
  // Rest of implementation remains the same
}
```

### 2.2 State Management Extension

```javascript
// src/contexts/CampaignContext.js - New context
export const CampaignContext = createContext(null);

export function CampaignProvider({ children }) {
  const [currentCampaign, setCurrentCampaign] = useState(null);
  const [userCampaigns, setUserCampaigns] = useState([]);
  const [currentChannel, setCurrentChannel] = useState('general');
  
  // Campaign-related actions
  const joinCampaign = useCallback(async (campaignId) => { /* ... */ }, []);
  const leaveCampaign = useCallback(async (campaignId) => { /* ... */ }, []);
  const switchCampaign = useCallback((campaignId) => { /* ... */ }, []);
  const switchChannel = useCallback((channelId) => { /* ... */ }, []);
  
  return (
    <CampaignContext.Provider value={{
      currentCampaign,
      userCampaigns,
      currentChannel,
      joinCampaign,
      leaveCampaign,
      switchCampaign,
      switchChannel
    }}>
      {children}
    </CampaignContext.Provider>
  );
}

export const useCampaign = () => useContext(CampaignContext);
```

### 2.3 Service Layer Extensions

```javascript
// src/services/campaignService.js - New service
export async function createCampaign(firestore, campaignData, dmId) {
  const campaignRef = await addDoc(collection(firestore, 'campaigns'), {
    ...campaignData,
    dmId,
    currentPlayers: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastActivity: serverTimestamp()
  });
  
  // Create default general channel
  await addDoc(collection(firestore, 'campaigns', campaignRef.id, 'channels'), {
    id: 'general',
    name: 'General Chat',
    description: 'Main campaign discussion',
    type: 'text',
    visibility: 'all',
    createdAt: serverTimestamp(),
    createdBy: dmId
  });
  
  // Add DM as first member
  await setDoc(doc(firestore, 'campaigns', campaignRef.id, 'members', dmId), {
    userId: dmId,
    role: 'dm',
    status: 'active',
    joinedAt: serverTimestamp(),
    lastActive: serverTimestamp()
  });
  
  return campaignRef;
}

export async function joinCampaign(firestore, campaignId, userId, characterInfo = {}) {
  // Implementation for joining campaigns
}

export async function searchCampaigns(firestore, filters = {}) {
  // Implementation for campaign discovery
}
```

## Phase 3: Migration Strategy

### 3.1 Backward Compatibility

1. **Preserve General Chat**: Keep existing `/messages` collection as "lobby" chat
2. **Gradual Migration**: Allow users to access both old and new systems during transition
3. **Data Preservation**: No existing user data or messages are lost

### 3.2 Migration Steps

1. **Deploy Campaign Infrastructure** (no user-facing changes)
   - Add new collections and security rules
   - Deploy campaign service functions
   - Add campaign context (unused initially)

2. **Soft Launch Campaign Features**
   - Add campaign creation for DMs
   - Add campaign browser (discoverable but not prominent)
   - Keep existing chat as default entry point

3. **Feature Promotion**
   - Add campaign switcher to main navigation
   - Update onboarding to highlight campaigns
   - Add campaign recommendations

4. **Full Transition**
   - Make campaigns the primary entry point
   - Rebrand general chat as "Lobby"
   - Add migration prompts for existing users

### 3.3 User Communication

- **In-app notifications**: Inform about new campaign features
#### Stretch goals:
- **Migration incentives**: Special badges for early campaign adopters
- **Tutorial flow**: Guide DMs through campaign creation process

## Phase 4: D&D-Specific Enhancements

### 4.1 Campaign-Specific Features

```javascript
// Future enhancements to build on campaign foundation
- Character sheet integration
- Dice rolling with campaign history
- Session notes and summaries
- Initiative tracking
- Campaign calendar/scheduling
- Map and image sharing per campaign
- DM tools (NPC notes, plot tracking)
- Campaign stats and analytics
```

### 4.2 Social Features

```javascript
// Community building features
- DM ratings and reviews
- Player testimonials
- Campaign showcases
- Looking-for-group (LFG) board
- Mentorship matching (experienced DMs with new players)
```

## Technical Implementation Details

### Required New Hooks

```javascript
// src/hooks/useCampaigns.js
export function useCampaigns(userId) {
  // Fetch user's campaigns and memberships
}

// src/hooks/useCampaignMembers.js
export function useCampaignMembers(campaignId) {
  // Real-time campaign member list
}

// src/hooks/useCampaignChannels.js
export function useCampaignChannels(campaignId) {
  // Channel list for campaign
}

// src/hooks/useCampaignSearch.js
export function useCampaignSearch(filters) {
  // Search and filter campaigns
}
```

### Database Indexes Needed

```javascript
// Firestore composite indexes
campaigns:
  - (visibility, status, lastActivity DESC)
  - (gameSystem, visibility, status)
  - (tags array-contains, visibility, status)
  - (dmId, status, createdAt DESC)

campaigns/{campaignId}/members:
  - (status, role, joinedAt)

campaigns/{campaignId}/channels/{channelId}/messages:
  - (createdAt DESC) // Same as existing messages
```

### Performance Considerations

1. **Lazy Loading**: Only load campaign data when needed
2. **Pagination**: Campaign browsing and member lists
3. **Caching**: Cache user's active campaigns locally
4. **Optimistic Updates**: Immediate UI feedback for join/leave actions

## Risk Assessment & Mitigation

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|---------|-------------|------------|
| Complex data migration | High | Medium | Phased rollout with backward compatibility |
| Performance degradation | Medium | Low | Careful indexing and lazy loading |
| Security rule complexity | High | Medium | Thorough testing and rule validation |
| State management complexity | Medium | Medium | Gradual context introduction |

### Product Risks

| Risk | Impact | Probability | Mitigation |
|------|---------|-------------|------------|
| User adoption resistance | High | Medium | Preserve familiar UX, gradual introduction |
| DM engagement required | High | High | DM onboarding incentives and tools |
| Campaign discovery challenge | Medium | Medium | Robust search and recommendation system |
| Content moderation scaling | Medium | Low | Leverage existing moderation, per-campaign delegation |

## Success Metrics

### Technical Metrics
- Database performance maintains <100ms query times
- No increase in error rates during migration
- 99.9% uptime during rollout phases

### Product Metrics
- 50% of existing users create or join a campaign within 30 days
- Average of 2.5 campaigns per active user
- 80% DM retention rate (DMs who create campaigns remain active)
- 60% campaign completion rate (campaigns that reach "active" status)

## Timeline Estimate

- **Phase 1 (Foundation)**: 3-4 weeks
  - Data model design and implementation
  - Security rules and basic services
  - Database setup and testing

- **Phase 2 (Core Implementation)**: 4-6 weeks
  - Campaign management components
  - Modified chat components for campaign context
  - User interface integration

- **Phase 3 (Migration & Polish)**: 2-3 weeks
  - Backward compatibility testing
  - User migration flows
  - Documentation and onboarding

- **Phase 4 (D&D Enhancements)**: Future roadmap
  - Campaign-specific features
  - Advanced D&D tooling integration
  - Social and discovery features

**Total estimated time for core campaign system: 9-13 weeks**

## Conclusion

This campaign system strategy provides a comprehensive path from the current single-room chat to a full-featured D&D campaign platform. The phased approach ensures minimal disruption to existing users while building a foundation for rich D&D-specific features. The architecture is designed to scale with the community and provides clear extension points for future enhancements.

The key to success will be maintaining the excellent chat experience users already enjoy while gradually introducing the value of campaign-based organization and D&D-specific community features.

---

## 🚀 CODEBASE PREPARATION COMPLETED

### Infrastructure Setup Complete ✅

**Completed Preparations:**
1. ✅ **React Router Installed** - Added routing capability with `react-router-dom`
2. ✅ **Folder Structure Created** - New directories for campaign components and services
3. ✅ **Base Router Infrastructure** - `AppRouter.js` with campaign routing patterns
4. ✅ **Campaign Context** - `CampaignContext.js` with state management foundation
5. ✅ **Placeholder Components** - Basic campaign components for immediate routing
6. ✅ **Navigation Component** - `AppNavigation.js` with campaign/lobby switching
7. ✅ **Modified Core Components** - `ChatPage`, `ChatRoom`, `useChatMessages` support campaign context
8. ✅ **Campaign Service Layer** - Basic CRUD operations for campaigns
9. ✅ **Extended Security Rules** - Firestore rules support campaign collections
10. ✅ **Backward Compatibility** - Existing chat now accessible at `/lobby`

**Current URL Structure:**
- `/` - Landing page with navigation options (default route)
- `/lobby` - General chat (existing functionality)
- `/campaigns` - Campaign browser (functional)
- `/create-campaign` - Campaign creation (functional)
- `/campaign/:id` - Campaign dashboard (placeholder)
- `/campaign/:id/chat` - Campaign chat (routes to ChatPage with campaign context)

**Development Status:**
- ✅ Application compiles and runs without errors
- ✅ Routing infrastructure functional
- ✅ Existing chat functionality preserved
- ✅ Campaign context plumbing in place
- 🔄 Ready for Phase 1 implementation

### Next Steps for Implementation:

**Phase 1A: Campaign Creation ✅ COMPLETED**
1. ✅ Built functional `CampaignCreator` component with comprehensive form validation
2. ✅ Implemented complete campaign creation service with Firestore integration
3. ✅ Added campaign creation success/error handling with loading states
4. ✅ Created comprehensive test suites for campaign creation functionality
5. ✅ Verified application builds successfully and routes function correctly

**Current Implementation Status:**
- **CampaignCreator Component**: Fully functional with form validation, tag selection, privacy settings, and error handling
- **Campaign Service**: Complete CRUD operations with proper data validation and error handling
- **Test Coverage**: Comprehensive test suites created for both component and service layers
- **Build Status**: Application compiles and builds successfully
- **User Flow**: Users can navigate to `/create-campaign` and create campaigns with full validation

**Phase 1B: Campaign Discovery ✅ COMPLETED**
1. ✅ Built functional `CampaignBrowser` component with comprehensive search and filter capabilities
2. ✅ Implemented enhanced campaign discovery service with filtering by game system, tags, and text search
3. ✅ Added sophisticated campaign joining functionality with character creation modal
4. ✅ Created responsive campaign cards displaying key campaign information
5. ✅ Added advanced filtering with tag selection and game system dropdown
6. ✅ Implemented client-side filtering for complex search scenarios
7. ✅ Created comprehensive test suite for campaign browser functionality

**Current Implementation Status:**
- **CampaignBrowser Component**: Fully functional with search, filtering, campaign cards, and join modal
- **Campaign Service**: Enhanced with sophisticated search and filtering capabilities
- **Join Campaign Flow**: Complete with character name/class input and validation
- **Responsive Design**: Optimized for both desktop and mobile viewing
- **Test Coverage**: Comprehensive test suites for both component and service layers
- **Build Status**: Application compiles and builds successfully
- **User Flow**: Users can browse campaigns at `/campaigns`, filter by various criteria, and join campaigns with character information

**Phase 1C: Campaign Dashboard (NEXT - 1 week)**
1. 🔄 Build campaign overview with member management
2. 🔄 Add channel navigation and management
3. 🔄 Implement campaign settings for DMs
4. 🔄 Test full campaign workflow end-to-end

**Additional Enhancement: Landing Page ✅ COMPLETED**
1. ✅ Created attractive landing page with navigation options
2. ✅ Added visual cards for Lobby, Browse Campaigns, and Create Campaign
3. ✅ Implemented responsive design with modern gradient background
4. ✅ Added navigation link in header to return to landing page
5. ✅ Set landing page as default route (/) for authenticated users
6. ✅ Created comprehensive test suite for landing page functionality

The codebase has successfully completed **Phase 1A Campaign Creation** and is ready for **Phase 1B Campaign Discovery** implementation!