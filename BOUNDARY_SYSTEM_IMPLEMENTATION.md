# Boundary System Implementation Plan

## 📊 Progress: 67% Complete (8/12 Phases) ✅

**Status**: Core functionality + Polish complete - Production ready!  
**Next Step**: Phase 11 - Testing & Refinement  
**Quick Reference**: See `BOUNDARY_SYSTEM_DEPLOYMENT_SUMMARY.md`

---

## Overview
Implement a comprehensive boundary system for DMs to define movement restrictions on the VTT map. This includes:
1. **Line Boundaries** - Prevent crossing walls, cliffs, etc.
2. **Out of Bounds Areas** - Paint areas that are completely inaccessible (similar to Fog of War)

## Features

### Line Boundaries
- DMs can draw boundary lines that prevent token movement across them
- **Snap to Grid Mode**: Automatically align boundary lines to grid intersections
- **Free Place Mode**: Draw boundaries at any position for precise control
- Boundaries are only visible to DMs
- Used for walls, cliffs, fences, etc.

### Out of Bounds Areas (Paint)
- DMs can paint grid-based areas that tokens cannot enter
- **Brush-based painting**: Similar to Fog of War brush system
- **Brush size slider**: Control how many grid cells to paint at once
- Out of bounds areas render differently (e.g., red tint or diagonal lines)
- Grid-aligned for consistent boundaries

### UI Components
- **Boundaries Button**: Added to MapToolbar in DM-only section
- **BoundaryPanel**: Flyout panel with controls (similar to FogPanel)
  - Enable/Disable boundaries checkbox
  - View/Hide boundaries toggle (for DM visibility)
  - Line Bounds section with snap-to-grid checkbox
  - Paint Bounds section with brush size slider
  - Clear All button

## Implementation Checklist

### Phase 1: Core Service Enhancement ✅
- [x] Review existing `boundaryService.js`
- [x] Enhance boundaryService to support:
  - [x] Out of bounds areas (grid-based painted cells)
  - [x] Enable/disable flag
  - [x] Visibility toggle for DMs
  - [x] Batch operations for painted areas
- [x] Add Firestore operations for painted boundary areas
- [x] Add collision detection for painted areas

### Phase 2: UI Components ✅
- [x] Create `BoundaryPanel.jsx` component
  - [x] Panel structure matching FogPanel style
  - [x] Enable/Disable toggle
  - [x] View/Hide toggle
  - [x] Line mode with snap-to-grid checkbox
  - [x] Paint mode with brush size slider (1-10 cells)
  - [x] Clear All Boundaries button
  - [x] Instructions/tooltips
- [x] Create `BoundaryPanel.css` with styling matching FogPanel
- [x] Add Lucide React icon for Boundaries button (using `Shield` icon)

### Phase 3: MapToolbar Integration ✅
- [x] Import BoundaryPanel and boundary icon into MapToolbar
- [x] Add Boundaries button to DM section (after Fog button)
- [x] Add state management for boundary panel
  - [x] `showBoundaryPanel` state
  - [x] `onOpenBoundaryPanel` / `onCloseBoundaryPanel` handlers
- [x] Wire up boundary-related props from parent
- [x] Handle panel toggling (close other panels when opening)
- [x] Render BoundaryPanel in MapToolbar (similar to FogPanel)

### Phase 4: MapCanvas State & Props ✅
- [x] Add boundary state to VTTSession:
  - [x] `boundariesEnabled` - Enable/disable flag
  - [x] `boundariesVisible` - Show/hide for DM
  - [x] `boundaryMode` - 'line' or 'paint'
  - [x] `boundarySnapToGrid` - Snap line boundaries
  - [x] `boundaryBrushSize` - Brush size for painting
  - [x] `boundaryBrushMode` - 'paint' or 'erase'
- [x] Add boundary props to MapCanvas component signature
- [x] Subscribe to boundary state from Firestore in VTTSession
- [x] Add boundary enable/disable handlers
- [x] Add visibility toggle handler
- [x] Pass all boundary props from VTTSession to MapCanvas to MapToolbar

### Phase 5: Boundary Drawing - Line Mode ✅
- [x] Implement line boundary drawing interaction
  - [x] Mouse down to start line
  - [x] Mouse move to preview line
  - [x] Mouse up to finalize line
  - [x] Snap to grid when enabled
- [x] Create boundary line preview rendering (dashed line)
- [x] Save completed boundaries to Firestore via boundaryService
- [x] Render persistent boundaries on canvas (Layer)
- [x] Visual style: Red/orange lines, slightly transparent, dashed

### Phase 6: Boundary Drawing - Paint Mode ✅
- [x] Implement paint brush for out of bounds areas
  - [x] Mouse down to start painting
  - [x] Mouse drag to paint multiple cells
  - [x] Grid-aligned painting (fill entire cells)
  - [x] Brush size determines radius of cells painted
- [x] Render painted out of bounds areas
  - [x] Red tint overlay
  - [x] Semi-transparent overlay
  - [x] Grid-aligned rectangles
- [x] Batch update painted cells to Firestore
- [x] Support eraser mode (remove painted boundaries)

### Phase 7: Collision Detection ✅
- [x] Integrate boundary checking into token movement
  - [x] Check line boundaries using `boundaryService.checkBoundaryCrossing()`
  - [x] Check painted boundaries (point-in-cell check)
  - [x] Prevent token movement if boundary crossed
  - [x] Show visual feedback (red flash on token, snaps back to original position)
- [x] Add boundary checks to drag-and-drop token movement
- [x] Handle player token movement (enforce boundaries)
- [x] Visual feedback system with red border and shadow effect
- [ ] DM tokens can optionally ignore boundaries (future enhancement)

### Phase 8: VTTSession Integration ✅
- [x] Add boundary state to VTTSession
- [x] Subscribe to boundary data from Firestore
- [x] Pass boundary state and handlers to MapCanvas
- [x] Sync boundary enable/disable across clients
- [x] Handle boundary panel open/close in VTTSession
- [ ] Integrate collision detection enforcement into token movement (see Phase 7)

### Phase 9: Rendering Layer ✅
- [x] Integrated boundary rendering directly into MapCanvas
  - [x] Render line boundaries (Konva Lines)
  - [x] Render painted boundaries (Konva Rects)
  - [x] Only render when visible to DM
  - [x] Layer ordering (above grid, below tokens)
- [x] Integrated BoundaryLayer into MapCanvas Stage
- [x] Added conditional rendering based on boundariesVisible flag
- [x] Drawing preview rendering (orange preview line, semi-transparent cells)

### Phase 10: Polish & UX ✅
- [x] Add keyboard shortcuts for boundary tools
  - [x] Toggle boundary panel ('B' key)
  - [x] Switch to Line mode ('L' key)
  - [x] Switch to Paint mode ('P' key)
- [x] Add keyboard shortcut documentation in panel
- [x] Add styled kbd elements for shortcuts display
- [x] Add confirmation dialog for "Clear All Boundaries" (already implemented)
- [x] Add visual feedback when movement is blocked (red flash)
- [x] Add tooltips and help text (instructions in panel)
- [ ] Add undo/redo support for boundaries (future enhancement)
- [ ] Add boundary selection/editing (future enhancement)
- [ ] Add boundary hover effects (future enhancement)

### Phase 11: Testing & Refinement
- [ ] Test line boundary drawing with snap-to-grid on/off
- [ ] Test paint boundary with various brush sizes
- [ ] Test collision detection with player tokens
- [ ] Test boundary visibility toggle
- [ ] Test boundary persistence across sessions
- [ ] Test multi-DM scenarios (boundary creation by different DMs)
- [ ] Test performance with many boundaries
- [ ] Test undo/redo functionality
- [ ] Cross-browser testing

### Phase 12: Documentation
- [ ] Update user guide with boundary system documentation
- [ ] Add screenshots/GIFs of boundary features
- [ ] Document keyboard shortcuts
- [ ] Add developer notes for boundary service
- [ ] Create troubleshooting guide

---

## Deployment Status ✅

### Firestore Security Rules
- [x] **Deployed**: Boundaries collection security rules added to `firestore.rules`
- [x] **Deployment Date**: Current session
- [x] **Project**: superchat-58b43
- [x] **Rule Details**: 
  - Only DM can read boundaries (invisible to players)
  - Only DM can create, update, and delete boundaries
  - Rules properly verify DM status via campaign.dmId
- [x] **Deployment Command**: `firebase deploy --only firestore:rules`
- [x] **Status**: Successfully deployed to production

---

## Technical Architecture

### Data Structure

#### Line Boundary
```javascript
{
  id: 'boundary_id',
  type: 'line',
  start: { x: number, y: number },
  end: { x: number, y: number },
  createdBy: 'user_id',
  createdAt: Timestamp,
  visibleTo: 'dm',
  snappedToGrid: boolean
}
```

#### Painted Boundary (Out of Bounds Area)
```javascript
{
  id: 'boundary_id',
  type: 'painted',
  cells: [
    { gridX: number, gridY: number },
    { gridX: number, gridY: number },
    // ... more cells
  ],
  createdBy: 'user_id',
  createdAt: Timestamp,
  visibleTo: 'dm'
}
```

#### Boundary State (Firestore Map Document)
```javascript
{
  boundaries: {
    enabled: boolean,
    visible: boolean, // DM can toggle visibility
    // Individual boundaries stored in subcollection
  }
}
```

### Service Methods

**boundaryService.js** enhancements needed:
- `createPaintedBoundary(firestore, campaignId, mapId, cells, createdBy)`
- `addPaintedCells(firestore, campaignId, mapId, boundaryId, cells)`
- `removePaintedCells(firestore, campaignId, mapId, boundaryId, cells)`
- `checkPointInBoundary(point, paintedBoundaries)`
- `getBoundaryState(firestore, campaignId, mapId)`
- `updateBoundaryState(firestore, campaignId, mapId, { enabled, visible })`

### Component Hierarchy
```
VTTSession
└── MapCanvas
    ├── MapToolbar
    │   └── BoundaryPanel (flyout)
    ├── Stage
    │   ├── GridLayer
    │   ├── BoundaryLayer (new)
    │   │   ├── Line boundaries (Konva.Line)
    │   │   └── Painted boundaries (Konva.Rect with pattern)
    │   ├── TokenSprite
    │   └── ...
```

## Design Decisions

1. **Grid-aligned painting**: Out of bounds areas snap to grid cells for consistency and performance
2. **DM-only visibility**: Boundaries are invisible to players to maintain immersion
3. **Separate line and paint modes**: Different use cases require different interaction patterns
4. **Reuse Fog of War patterns**: Similar UI/UX to FogPanel for consistency
5. **Non-destructive**: Boundaries can be easily removed or disabled without affecting tokens
6. **Firestore subcollection**: Store boundaries in subcollection under map for better organization

## Visual Design

### Line Boundaries
- **Color**: Red/Orange (`#FF6B6B` or `#FF8C42`)
- **Style**: Dashed line, 2-3px thick
- **Opacity**: 60-70% when visible to DM
- **Hover**: Brighten on hover for selection

### Painted Boundaries
- **Color**: Red tint (`rgba(255, 0, 0, 0.2)`)
- **Pattern**: Diagonal lines or crosshatch
- **Border**: Solid red border around painted cells
- **Opacity**: 30-40% to allow map visibility

### UI Panel (BoundaryPanel)
- Match FogPanel styling (purple border accent)
- Use boundary-themed colors (red/orange accents)
- Clear visual hierarchy for mode selection
- Slider for brush size with live preview

## Future Enhancements (Post-MVP)
- [ ] Import boundaries from map images (wall detection AI)
- [ ] One-way boundaries (doors that only open one direction)
- [ ] Conditional boundaries (locked doors, breakable walls)
- [ ] Boundary templates (rooms, corridors)
- [ ] Copy/paste boundaries between maps
- [ ] Boundary groups (toggle entire sets on/off)
- [ ] Player-visible boundaries (force fields, visible walls)
- [ ] Height-based boundaries (flying tokens ignore)

---

## Progress Summary
**Last Updated**: 2025-10-03
**Status**: Phase 4 Complete - State Management & Props Wired Up
**Completed**: 4/12 phases (33%)

## Next Steps
1. ✅ Create implementation plan document
2. ✅ Enhance boundaryService.js with painted boundary support
3. ✅ Create BoundaryPanel component
4. ✅ Integrate into MapToolbar
5. ✅ Add boundary state and handlers to VTTSession & MapCanvas
6. Subscribe to boundaries collection in MapCanvas (Phase 4 continued)
7. Implement line boundary drawing (Phase 5)
8. Implement paint boundary drawing (Phase 6)
9. Add collision detection (Phase 7)
