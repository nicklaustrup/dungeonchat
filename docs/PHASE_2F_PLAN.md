# Phase 2F: Session Planning & Content Management

**Status**: 🚀 IN PROGRESS  
**Start Date**: September 30, 2025  
**Estimated Duration**: 2-3 weeks  
**Priority**: High

## Overview

Phase 2F adds comprehensive session planning and content management tools for Dungeon Masters. This phase transforms the campaign system from just combat management to full session orchestration with note-taking, encounter planning, scheduling, and party management features.

## Goals

1. **Session Notes System** - Real-time collaborative note-taking with DM privacy controls
2. **Encounter Management** - Pre-planned encounter library with templates and scaling
3. **Campaign Calendar** - Session scheduling with player availability and timeline tracking
4. **Party Management** - Consolidated party overview with HP, resources, and inventory

## Phase 2F Components Breakdown

### 1. Session Notes System

#### Features
- **Real-time Note Taking**
  - Rich text editor for DM and player notes
  - Separate DM-only notes (private) and shared session notes (public)
  - Auto-save with timestamps
  - Markdown support for formatting
  
- **Session Summaries**
  - Automatic session timestamp tracking
  - Key highlights and moments
  - Player attendance tracking
  - Session duration logging
  
- **Note Organization**
  - Categorize notes by session number
  - Tag system for quick filtering (combat, roleplay, plot, NPC, location)
  - Search functionality across all notes
  - Export notes to markdown or PDF

#### Data Model
```javascript
// campaigns/{campaignId}/sessions/{sessionId}
{
  sessionNumber: 1,
  title: "Session 1: The Adventure Begins",
  sessionDate: Timestamp,
  startTime: Timestamp,
  endTime: Timestamp,
  attendees: ['userId1', 'userId2'], // Present players
  dmNotes: "Private notes only DM can see...",
  sharedNotes: "Notes visible to all players...",
  highlights: [
    "Party met in tavern",
    "Accepted quest from mayor",
    "First combat with goblins"
  ],
  tags: ['roleplay', 'combat', 'quest-start'],
  createdBy: 'dmUserId',
  createdAt: Timestamp,
  lastModified: Timestamp
}
```

#### Components to Create
- `SessionNotes.js` - Main session notes interface
- `SessionNoteEditor.js` - Rich text editor component
- `SessionHistory.js` - List of past sessions
- `SessionSummary.js` - Individual session summary card

---

### 2. Encounter Planning & Management

#### Features
- **Encounter Library**
  - Pre-created encounter templates
  - Save custom encounters for reuse
  - Encounter difficulty calculator (based on party level)
  - Monster/NPC statblock storage
  
- **Encounter Builder**
  - Drag-and-drop encounter creation
  - Add monsters, NPCs, environmental hazards
  - Set encounter conditions and terrain
  - Preview initiative order and CR calculations
  
- **Encounter Templates**
  - Common encounter types (ambush, boss fight, skill challenge)
  - Quick-add from templates
  - Customize and save as new template
  
- **Loot Management**
  - Treasure generation based on CR
  - Manual loot assignment
  - Track who received what items
  - Party treasure pool

#### Data Model
```javascript
// campaigns/{campaignId}/encounters/{encounterId}
{
  name: "Goblin Ambush",
  description: "Goblins attack on forest road",
  difficulty: "medium", // easy, medium, hard, deadly
  estimatedCR: 3,
  partyLevel: 2,
  status: "planned", // planned, active, completed
  combatants: [
    {
      name: "Goblin 1",
      type: "enemy",
      hp: 7,
      ac: 15,
      initiative: 12,
      statblock: { ... }
    }
  ],
  environment: {
    terrain: "forest",
    lighting: "dim",
    weather: "clear"
  },
  loot: [
    { item: "Gold Coins", quantity: 25, assignedTo: null },
    { item: "Short Sword", quantity: 1, assignedTo: 'userId1' }
  ],
  notes: "Goblins are trying to steal merchant goods",
  tags: ['combat', 'forest', 'goblins'],
  createdBy: 'dmUserId',
  createdAt: Timestamp,
  lastModified: Timestamp
}
```

#### Components to Create
- `EncounterLibrary.js` - Browse and manage encounters
- `EncounterBuilder.js` - Create/edit encounters
- `EncounterCard.js` - Encounter preview card
- `LootManager.js` - Manage treasure and items
- `StatblockEditor.js` - Create/edit monster statblocks

---

### 3. Campaign Calendar & Scheduling

#### Features
- **Session Scheduling**
  - Create scheduled sessions with date/time
  - Player availability polling
  - Recurring session support (weekly, bi-weekly, monthly)
  - Calendar integration (Google Calendar, iCal export)
  
- **Campaign Timeline**
  - Track in-game dates and events
  - Milestone markers (level-ups, major story beats)
  - Visual timeline view
  - Link sessions to timeline events
  
- **Reminders & Notifications**
  - Session reminders (24hr, 1hr before)
  - Player availability requests
  - Milestone celebrations
  
- **In-Game Calendar**
  - Fantasy calendar systems (Forgotten Realms, Greyhawk, Custom)
  - Track in-game time passage
  - Moon phases, seasons, holidays
  - Link events to in-game dates

#### Data Model
```javascript
// campaigns/{campaignId}/schedule/{scheduleId}
{
  type: "session", // session, milestone, event
  title: "Session 5: Into the Dungeon",
  scheduledDate: Timestamp,
  startTime: "7:00 PM",
  endTime: "10:00 PM",
  recurring: {
    enabled: true,
    frequency: "weekly", // weekly, biweekly, monthly
    dayOfWeek: 5, // Friday
    endDate: null // or Timestamp
  },
  playerAvailability: {
    'userId1': 'available',
    'userId2': 'maybe',
    'userId3': 'unavailable'
  },
  reminderSent: false,
  notes: "Bring character sheets",
  createdBy: 'dmUserId',
  createdAt: Timestamp
}

// campaigns/{campaignId}/timeline/{eventId}
{
  title: "Party reaches Level 5",
  description: "Party leveled up after defeating the dragon",
  eventType: "milestone", // milestone, combat, story, quest
  inGameDate: "15th of Flamerule, 1492 DR",
  realWorldDate: Timestamp,
  sessionId: "session5",
  tags: ['level-up', 'dragon'],
  createdBy: 'dmUserId',
  createdAt: Timestamp
}
```

#### Components to Create
- `CampaignCalendar.js` - Main calendar view
- `SessionScheduler.js` - Create/edit scheduled sessions
- `TimelineView.js` - Visual campaign timeline
- `InGameCalendar.js` - Fantasy calendar system
- `AvailabilityPoll.js` - Player availability checker

---

### 4. Enhanced Party Management

#### Features
- **Party Overview Dashboard**
  - Consolidated view of all characters
  - Real-time HP tracking across party
  - Resource tracking (spell slots, abilities, items)
  - Character portraits and quick stats
  
- **Group HP Tracker**
  - Visual HP bars for all party members
  - Quick damage/healing application
  - Automatic death saving throw tracking
  - Rest management (short/long rests)
  
- **Party Inventory**
  - Shared party treasure
  - Equipment distribution
  - Consumables tracking (potions, scrolls)
  - Weight/encumbrance calculator
  
- **XP & Leveling**
  - Group XP pool
  - Distribute XP to party members
  - Level-up notifications
  - Milestone tracking

#### Data Model
```javascript
// campaigns/{campaignId}/party/{partyDataId}
{
  treasury: {
    gold: 250,
    silver: 50,
    copper: 100,
    gems: ['Ruby (50gp)', 'Sapphire (100gp)']
  },
  sharedInventory: [
    {
      item: "Healing Potion",
      quantity: 5,
      location: "party pack"
    },
    {
      item: "Rope (50ft)",
      quantity: 2,
      location: "fighter's backpack"
    }
  ],
  xpPool: 5000,
  xpHistory: [
    {
      amount: 500,
      reason: "Defeated goblin warband",
      date: Timestamp,
      awardedBy: 'dmUserId'
    }
  ],
  lastModified: Timestamp
}

// campaigns/{campaignId}/members/{userId}/character
// Extended character data
{
  // Existing character data
  resources: {
    hitDice: { current: 3, max: 5 },
    spellSlots: {
      level1: { current: 3, max: 4 },
      level2: { current: 1, max: 3 }
    },
    classAbilities: [
      { name: "Bardic Inspiration", current: 3, max: 5 }
    ]
  },
  conditions: ['exhausted-1'], // Exhaustion levels, conditions
  deathSaves: {
    successes: 0,
    failures: 0
  }
}
```

#### Components to Create
- `PartyOverview.js` - Main party dashboard
- `PartyHPTracker.js` - Group HP management
- `PartyInventory.js` - Shared inventory system
- `XPDistributor.js` - Award XP to party
- `RestManager.js` - Handle short/long rests

---

## Implementation Strategy

### Week 1: Session Notes & Encounter Planning
**Days 1-3: Session Notes System**
- Create session notes data model and service
- Build SessionNotes component with rich text editor
- Implement DM vs player note visibility
- Add session history view

**Days 4-7: Encounter Management**
- Create encounter library data model
- Build EncounterBuilder component
- Implement loot management
- Add encounter templates system

### Week 2: Calendar & Party Management
**Days 8-10: Campaign Calendar**
- Create scheduling data model
- Build CampaignCalendar component
- Implement session scheduler
- Add timeline view

**Days 11-14: Party Management**
- Create party data model
- Build PartyOverview dashboard
- Implement group HP tracker
- Add party inventory system

### Week 3: Integration & Polish
**Days 15-17: Integration**
- Integrate all Phase 2F features into campaign dashboard
- Add new dashboard tabs for each system
- Ensure real-time synchronization
- Connect systems (link encounters to sessions, etc.)

**Days 18-21: Testing & Documentation**
- Comprehensive testing of all features
- Mobile responsiveness verification
- Performance optimization
- Update documentation

---

## Technical Requirements

### New Services
1. `sessionService.js` - Session notes CRUD operations
2. `encounterService.js` - Encounter management functions
3. `scheduleService.js` - Calendar and scheduling operations
4. `partyService.js` - Party management utilities

### Firebase Structure
```
campaigns/{campaignId}/
  ├── sessions/{sessionId}
  ├── encounters/{encounterId}
  ├── schedule/{scheduleId}
  ├── timeline/{eventId}
  └── party/{partyDataId}
```

### Security Rules
```javascript
// Session notes - DM can write, members can read shared notes
match /campaigns/{campaignId}/sessions/{sessionId} {
  allow read: if isCampaignMember(campaignId);
  allow write: if isCampaignDM(campaignId);
}

// Encounters - DM only
match /campaigns/{campaignId}/encounters/{encounterId} {
  allow read: if isCampaignDM(campaignId);
  allow write: if isCampaignDM(campaignId);
}

// Schedule - members can read, DM can write
match /campaigns/{campaignId}/schedule/{scheduleId} {
  allow read: if isCampaignMember(campaignId);
  allow write: if isCampaignDM(campaignId);
  // Allow members to update their availability
  allow update: if isCampaignMember(campaignId) && 
    request.resource.data.diff(resource.data).affectedKeys()
    .hasOnly(['playerAvailability']);
}

// Party data - members can read, DM can write
match /campaigns/{campaignId}/party/{partyDataId} {
  allow read: if isCampaignMember(campaignId);
  allow write: if isCampaignDM(campaignId);
}
```

---

## Success Criteria

### Functional Requirements
- ✅ DMs can create and manage session notes
- ✅ Players can view shared session notes
- ✅ DMs can build and save encounters
- ✅ DMs can schedule sessions with recurring support
- ✅ Players can indicate availability for sessions
- ✅ Party overview shows real-time character status
- ✅ DMs can track and distribute party treasure
- ✅ DMs can award XP to the party

### Technical Requirements
- ✅ All features work in real-time with Firebase sync
- ✅ Mobile-responsive design for all components
- ✅ Proper permission controls (DM vs Player access)
- ✅ Clean build with no errors or warnings
- ✅ Comprehensive error handling

### User Experience
- ✅ Intuitive interfaces for all management tools
- ✅ Minimal clicks to perform common tasks
- ✅ Clear visual feedback for all actions
- ✅ Helpful tooltips and guidance for new DMs

---

## Risks & Mitigation

### Technical Risks
| Risk | Impact | Mitigation |
|------|---------|------------|
| Rich text editor complexity | Medium | Use proven library (Quill, TinyMCE) |
| Real-time sync performance | High | Implement debouncing and optimistic updates |
| Complex scheduling logic | Medium | Use established date libraries (date-fns) |
| Data model complexity | High | Thorough planning and testing before implementation |

### User Experience Risks
| Risk | Impact | Mitigation |
|------|---------|------------|
| Feature overload | High | Progressive disclosure, tabbed interfaces |
| Learning curve for DMs | Medium | Tooltips, tutorials, sensible defaults |
| Mobile usability | Medium | Touch-friendly controls, responsive design |

---

## Dependencies

### External Libraries
- **Rich Text Editor**: Quill or Draft.js
- **Date/Time**: date-fns
- **Calendar UI**: react-big-calendar or custom
- **Drag & Drop**: react-beautiful-dnd (for encounter builder)

### Internal Dependencies
- Character sheet system (Phase 2C)
- Initiative tracker (Phase 2E)
- Campaign dashboard (Phase 1D)

---

## Future Enhancements (Post Phase 2F)

### Phase 3 Candidates
1. **Advanced Automation**
   - Automatic XP calculation from CR
   - Rest automation (spell slot restoration)
   - Condition duration tracking

2. **Campaign Analytics**
   - Combat statistics
   - Session duration trends
   - Player engagement metrics

3. **Enhanced Collaboration**
   - Player-submitted session notes
   - Shared timeline editing
   - Character journals

4. **Integration Features**
   - D&D Beyond character import
   - VTT integration (Roll20, Foundry)
   - Discord bot integration

---

## Getting Started

### Immediate Next Steps
1. Create basic data models for sessions and encounters
2. Implement `sessionService.js` with CRUD operations
3. Build `SessionNotes` component with basic editor
4. Add "Session Notes" tab to campaign dashboard
5. Test real-time synchronization with multiple users

### Sprint Planning
**Sprint 1 (Week 1)**: Session Notes & Encounter Planning  
**Sprint 2 (Week 2)**: Calendar & Party Management  
**Sprint 3 (Week 3)**: Integration, Testing, Polish

---

**Ready to begin Phase 2F implementation!** 🚀
