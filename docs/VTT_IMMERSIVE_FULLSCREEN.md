# VTT Immersive Full-Screen Implementation

## Overview
The Virtual Tabletop (VTT) Session Room has been enhanced to provide a fully immersive, full-screen experience that hides the main app navigation and integrates all existing campaign components.

## Implementation Date
December 2024

## Changes Made

### 1. Full-Screen Layout (VTTSession.jsx)
- **Position**: Changed to `position: fixed` with `top: 0, left: 0, right: 0, bottom: 0`
- **Z-Index**: Set to `9999` to ensure VTT appears above all other UI elements
- **Navigation Hiding**: Added useEffect hook to hide `.app-navigation` and `.breadcrumb` on mount, restore on unmount

```jsx
useEffect(() => {
  // Hide the app navigation and breadcrumb
  const appNav = document.querySelector('.app-navigation');
  const breadcrumb = document.querySelector('.breadcrumb');
  
  if (appNav) appNav.style.display = 'none';
  if (breadcrumb) breadcrumb.style.display = 'none';

  // Restore on unmount
  return () => {
    if (appNav) appNav.style.display = '';
    if (breadcrumb) breadcrumb.style.display = '';
  };
}, []);
```

### 2. Exit Button (VTTSession.jsx)
- **Location**: Top-right toolbar, next to sidebar toggle
- **Icon**: `FiLogOut` with "Exit" label
- **Functionality**: Uses `useNavigate` to return to `/campaign/:campaignId`
- **Styling**: Red accent color (`rgba(231, 76, 60)`) to indicate exit action

```jsx
<button
  className="toolbar-button exit-button"
  onClick={() => navigate(`/campaign/${campaignId}`)}
  title="Exit Session"
>
  <FiLogOut />
  <span>Exit</span>
</button>
```

### 3. Real Component Integration (VTTSession.jsx)
Replaced placeholder panel components with real campaign components:

| Panel | Component | Props | Location |
|-------|-----------|-------|----------|
| **Chat** | `ChatPage` | `campaignContext={true}, showHeader={false}` | `src/pages/ChatPage.js` |
| **Rules** | `CampaignRules` | `campaignId, isUserDM` | `src/components/Campaign/CampaignRules.js` |
| **Party** | `PartyManagement` | `campaignId` | `src/components/Session/PartyManagement.js` |
| **Initiative** | `InitiativeTracker` | `campaignId` | `src/components/Session/InitiativeTracker.js` |
| **Maps** (DM) | `MapQueue` | `campaignId, activeMapId, onMapSelect` | `src/components/VTT/VTTSession/MapQueue.jsx` |
| **Encounters** (DM) | `EncounterBuilder` | `campaignId, mapId` | `src/components/VTT/VTTSession/EncounterBuilder.jsx` |

### 4. Updated Toolbar Icons (VTTSession.jsx)
- **Chat**: `FiMessageSquare` - Session chat
- **Rules**: `FiFileText` - Campaign rules (renamed from "Notes")
- **Party**: `FiUsers` - Party management
- **Initiative**: `FiTarget` - Initiative tracker (new, visible to all players)
- **Maps**: `FiMap` - Map queue (DM only)
- **Encounters**: `FiSettings` - Encounter builder (DM only)
- **Exit**: `FiLogOut` - Exit session

### 5. CSS Enhancements (VTTSession.css)

#### Full-Screen Styling
```css
.vtt-session {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  /* ... other styles ... */
}
```

#### Exit Button Styling
```css
.toolbar-button.exit-button {
  background: rgba(231, 76, 60, 0.3);
  border-color: rgba(231, 76, 60, 0.5);
}

.toolbar-button.exit-button:hover {
  background: rgba(231, 76, 60, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.4);
}
```

#### Sidebar Component Integration
```css
/* Wider sidebar to accommodate components */
.vtt-sidebar {
  width: 420px; /* increased from 320px */
}

/* Adjust imported components to fit sidebar */
.vtt-sidebar > * {
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

/* Hide breadcrumbs and extra headers in embedded components */
.vtt-sidebar .breadcrumb,
.vtt-sidebar .campaign-header {
  display: none;
}
```

## User Experience Flow

### Entering VTT Session
1. User clicks "🎲 Go to Session" from Campaign Dashboard
2. Route navigates to `/campaign/:campaignId/session`
3. VTT loads in full-screen mode
4. App navigation and breadcrumbs hidden automatically
5. All toolbar buttons visible (DM sees additional Maps/Encounters)

### Using VTT Features
1. Click toolbar icon to open panel in left sidebar
2. Panel shows real campaign data (chat messages, party members, etc.)
3. Click same icon again to close panel
4. Sidebar toggle button collapses/expands entire sidebar
5. Center canvas always visible for map and tokens

### Exiting VTT Session
1. Click red "Exit" button in top-right toolbar
2. Navigates back to Campaign Dashboard
3. App navigation and breadcrumbs restored
4. All campaign tabs accessible again

## Technical Architecture

### Component Hierarchy
```
VTTSession
├── Toolbar (top)
│   ├── Left: Toggle + Campaign Name + Role Badge
│   ├── Center: Panel Buttons (Chat, Rules, Party, Initiative, Maps*, Encounters*)
│   └── Right: Token Manager* + Exit Button + Sidebar Toggle
├── Content Area
│   ├── Left Sidebar (collapsible, 420px)
│   │   ├── ChatPage (campaignContext mode)
│   │   ├── CampaignRules
│   │   ├── PartyManagement
│   │   ├── InitiativeTracker
│   │   ├── MapQueue (DM only)
│   │   └── EncounterBuilder (DM only)
│   ├── Center Canvas (flex: 1)
│   │   └── MapCanvas (with tokens)
│   └── Right Sidebar (DM only, conditional)
│       └── TokenManager (when active)
└── CSS: Full-screen overlay (z-index: 9999)

* = DM only
```

### State Management
- **activePanel**: Controls which panel is visible in left sidebar (`'chat' | 'rules' | 'party' | 'initiative' | 'maps' | 'encounter' | null`)
- **showTokenManager**: Boolean for DM token manager visibility
- **isSidebarOpen**: Boolean for left sidebar collapse state
- **campaign**: Campaign data from Firestore
- **isUserDM**: Boolean for DM permissions
- **activeMap**: Current map displayed on canvas
- **selectedTokenId**: Token selected for editing (DM only)

### Navigation Integration
- **Entry Point**: `CampaignDashboard.js` → "🎲 Go to Session" button
- **Route**: `/campaign/:campaignId/session` in `AppRouter.js`
- **Exit**: `navigate(/campaign/${campaignId})` back to dashboard
- **useNavigate**: React Router v7 hook for programmatic navigation

## Testing Checklist

### Full-Screen Experience
- [ ] VTT appears full-screen when entering session
- [ ] App navigation hidden
- [ ] Breadcrumbs hidden
- [ ] No scroll bars on main app body

### Toolbar Functionality
- [ ] Chat panel opens/closes correctly
- [ ] Rules panel shows campaign rules
- [ ] Party panel shows party management
- [ ] Initiative panel shows initiative tracker
- [ ] Maps panel visible to DM only
- [ ] Encounters panel visible to DM only
- [ ] Exit button returns to campaign dashboard

### Component Integration
- [ ] ChatPage shows campaign chat messages
- [ ] CampaignRules displays editable rules (DM) or read-only (players)
- [ ] PartyManagement shows party members and stats
- [ ] InitiativeTracker shows combat initiative order
- [ ] MapQueue allows DM to stage maps
- [ ] EncounterBuilder allows DM to create encounters

### Exit Functionality
- [ ] Exit button navigates back to campaign
- [ ] App navigation restored after exit
- [ ] Breadcrumbs restored after exit
- [ ] Campaign dashboard loads correctly

### Responsive Design
- [ ] Sidebar width appropriate (420px)
- [ ] Components fit within sidebar without overflow issues
- [ ] Toolbar buttons visible on standard monitors (1920x1080)
- [ ] Canvas scales correctly

### Multi-User Testing
- [ ] DM sees all panels (including Maps, Encounters, Token Manager)
- [ ] Players see appropriate panels (Chat, Rules, Party, Initiative)
- [ ] Real-time updates work in all panels
- [ ] Token movements sync between users
- [ ] Chat messages appear in real-time

## Future Enhancements

### Phase 3 Features (Planned)
1. **Ping System**: Click map to show temporary marker to all players
2. **Fog of War**: DM-controlled visibility layer on maps
3. **Rich Chat**: Dice rolling, character emotes, whispers
4. **Audio Integration**: Voice chat, ambient music, sound effects
5. **Map Drawing**: Freehand drawing tools for DM
6. **Session Recording**: Automatic session logs and replays

### UI Improvements
1. **Keyboard Shortcuts**: Hotkeys for panel switching (1-6 for panels, ESC for exit)
2. **Panel Resizing**: Draggable sidebar width
3. **Multiple Panels**: Split view for Chat + Party simultaneously
4. **Minimap**: Small overview of full map in corner
5. **Quick Actions**: Right-click context menus on map/tokens

### Performance Optimizations
1. **Lazy Loading**: Load panels only when opened
2. **Virtual Scrolling**: For large chat/initiative lists
3. **Image Optimization**: Compress map/token images on upload
4. **Caching**: Cache frequently accessed campaign data

## Known Issues

### Resolved
- ✅ Import path errors (useTokens.js) - Fixed
- ✅ Missing FiMap import (MapQueue.jsx) - Fixed
- ✅ Component prop mismatches - Fixed

### Open Issues
- None currently

## Dependencies

### React & Router
- React 19 with hooks
- React Router v7.9.3
- react-icons/fi for UI icons

### Firebase
- Firestore for real-time data
- Firebase Storage for images
- Firebase Auth for user management

### Canvas
- Konva.js for 2D rendering
- react-konva for React integration

### Services
- mapService: Map CRUD operations
- tokenService: Token CRUD operations
- initiativeService: Initiative tracking
- partyService: Party management

## Documentation References
- [VTT MVP Scope](./VTT_MVP_SCOPE.md)
- [VTT Quick Start Guide](./VTT_QUICK_START_GUIDE.md)
- [Phase 2 Completion Report](./PHASE_2_COMPLETION_REPORT.md)
- [Token Integration Guide](./TOKEN_INTEGRATION_GUIDE.md)

## Conclusion
The VTT now provides a fully immersive experience with real campaign data integration. Users can seamlessly enter the session room, access all campaign features through intuitive toolbar buttons, and exit back to the campaign dashboard with a single click. The full-screen design ensures maximum canvas space for gameplay while keeping essential tools accessible in collapsible sidebars.
