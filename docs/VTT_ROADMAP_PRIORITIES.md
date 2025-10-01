# VTT Development Roadmap - Priority Order
**Last Updated**: October 1, 2025

## 🎉 Recently Completed (Phase 4)

### Core Features
- ✅ **Draggable Map Toolbar** - Move anywhere on map, minimize, settings panel
- ✅ **Floating Chat Panel** - Pop out, resize, drag, dock back to sidebar
- ✅ **Custom Ping/Pen Colors** - Color pickers in toolbar settings
- ✅ **Pointer Tool** - Selection mode without drawing
- ✅ **Ruler Tool** - Measure distances in grid squares and feet (DM only)

### Polish & Animations
- ✅ **Ping Flash Animation** - Bright white flash → custom color → fade
- ✅ **Smaller Pings** - Reduced from 20px to 12px radius
- ✅ **Dismissible Help Tooltip** - Close button to remove hint

### Bug Fixes
- ✅ **Toolbar Drag Fixed** - No more cursor jumping/shifting
- ✅ **Chat Reactions** - Identified permission issue (requires campaign membership)

---

## 🔥 High Priority (Next 2 Weeks)

### 1. Ruler Tool Enhancements
**Current Status**: Basic implementation complete
**Needed Improvements**:
- [ ] Click through to tokens without selecting them
- [ ] Snap-to-grid option
- [ ] Persistent/pin measurement mode
- [ ] Keyboard shortcut (R key)

**Estimated Effort**: 1-2 days

---

### 2. Shape Drawing Tools
**Why**: Essential for marking spell effects, areas, zones

**Tools to Implement**:
- [ ] **Circle** - AOE spells (fireball, healing word)
- [ ] **Rectangle** - Rooms, zones, barriers
- [ ] **Cone** - Breath weapons, spells
- [ ] **Line** - Walls, boundaries

**Features**:
- Custom color per shape
- Adjustable opacity
- Snap to grid option
- Temporary (5-10s fade) or persistent
- DM-only visibility vs all players
- Delete/clear tools

**Technical Requirements**:
- New `shapeService` for Firestore CRUD
- Shape rendering layer in MapCanvas
- Shape toolbar section in MapToolbar
- Real-time sync with onSnapshot

**Data Structure**:
```javascript
{
  id: string,
  type: 'circle' | 'rectangle' | 'cone' | 'line',
  geometry: {
    circle: { x, y, radius },
    rectangle: { x, y, width, height },
    cone: { x, y, direction, length, angle },
    line: { x1, y1, x2, y2 }
  },
  color: string,
  opacity: number,
  persistent: boolean,
  visibleTo: 'dm' | 'all',
  createdBy: userId,
  createdAt: timestamp,
  expiresAt: timestamp? // If temporary
}
```

**Estimated Effort**: 5-6 days

---

### 3. Token Status Effects
**Why**: Track combat conditions visually

**Features**:
- [ ] Condition icons (poisoned, stunned, prone, blessed, etc.)
- [ ] Color-coded token borders (red = damaged, green = healing)
- [ ] Concentration indicator
- [ ] Multiple conditions stack
- [ ] Hover for condition descriptions
- [ ] DM can toggle visibility

**Icon Set** (D&D 5e):
- 💀 Poisoned
- 😵 Stunned
- 🛌 Prone
- ✨ Blessed
- 🔥 Burning
- 🧊 Frozen
- 😨 Frightened
- ⚔️ Concentrating

**Data Structure**:
```javascript
token: {
  // ... existing fields
  conditions: ['poisoned', 'stunned', 'blessed'],
  concentrating: boolean,
  conditionsVisibleToPlayers: boolean
}
```

**Rendering**:
- Icons as small badges on top-right of token
- Border color changes based on conditions
- Stack up to 4 visible icons, "+X" for more

**Estimated Effort**: 4-5 days

---

### 4. Token Health Bars
**Why**: Quick visual HP tracking without opening sheets

**Features**:
- [ ] Optional HP bar above/below token
- [ ] Color-coded (green → yellow → red)
- [ ] Show/hide current/max numbers
- [ ] DM can hide from players per-token
- [ ] Temp HP as separate segment
- [ ] Smooth transitions on HP change

**Visual Design**:
```
Token Image
[==========>    ] 45/60 HP
  ^green   ^red
  ^^^^^^^^^^^^^ gradient based on percentage
```

**Data Structure**:
```javascript
token: {
  // ... existing fields
  hp: {
    current: 45,
    max: 60,
    temp: 5,
    showBarToPlayers: false,
    showNumbersToPlayers: false
  }
}
```

**Color Logic**:
- 100-70%: Green (#4ade80)
- 69-40%: Yellow (#fbbf24)
- 39-15%: Orange (#fb923c)
- 14-0%: Red (#ef4444)

**Estimated Effort**: 2-3 days

---

### 5. Grid Configuration Panel
**Why**: Different maps need different grid settings

**Features**:
- [ ] Grid size slider (25-100px)
- [ ] Grid type (square, hex, none)
- [ ] Grid color picker
- [ ] Grid opacity slider
- [ ] Snap-to-grid toggle
- [ ] Save as map default
- [ ] Show/hide grid

**UI Design**:
- Floating panel or modal
- DM-only access
- Live preview of changes
- Apply to current map or all maps

**Estimated Effort**: 2-3 days

---

## 🎯 Medium Priority (Weeks 3-4)

### 6. Token Context Menu
Right-click menu for quick actions:
- Edit Properties
- Duplicate Token
- Delete Token
- Hide/Show from Players
- Add Status Effect
- Adjust HP
- Link to Character Sheet
- Set Initiative

**Estimated Effort**: 2-3 days

---

### 7. Map Layers System
Separate visual layers with individual controls:
1. Background (map image)
2. Grid
3. Terrain/Environment
4. Fog of War
5. Tokens
6. Status Effects
7. Shapes/Measurements
8. Pings
9. DM Notes

**Features**:
- Toggle visibility per layer
- Lock/unlock layers
- Adjust opacity per layer
- Reorder layers

**Estimated Effort**: 4-5 days

---

### 8. Undo/Redo System
Track and revert actions:
- Token movements
- Token creation/deletion
- Drawing/shape actions
- Fog reveals
- Map changes

**Keyboard Shortcuts**:
- Ctrl+Z: Undo
- Ctrl+Shift+Z: Redo

**Estimated Effort**: 3-4 days

---

## 📊 Low Priority (Future Enhancements)

### 9. Keyboard Shortcuts
- P: Ping tool
- D: Pen tool
- A: Arrow tool
- R: Ruler tool
- Esc: Cancel action
- Delete: Delete selected
- Ctrl+C/V: Copy/paste token
- Space+Drag: Pan map

**Estimated Effort**: 2-3 days

---

### 10. Map Library Enhancements
- Folders/categories
- Tags/labels
- Search/filter
- Better thumbnails
- Duplicate maps
- Export/import
- Map templates

**Estimated Effort**: 3-4 days

---

### 11. Token URL Import
Import tokens from image URLs:
- Paste URL to create token
- Auto-download and upload to Storage
- Support popular token sites
- Batch import

**Estimated Effort**: 2 days

---

### 12. Ambient Audio System
Immersive soundscapes:
- Background music
- Ambient sound effects
- Per-map audio
- Volume controls
- Playlists
- Player-side controls

**Estimated Effort**: 4-5 days

---

## 📅 Sprint Planning

### Current Sprint (Week 1-2)
**Focus**: Essential combat tools

1. **Ruler improvements** (1-2 days)
2. **Shape drawing tools** (5-6 days)
3. **Testing & polish** (1-2 days)

**Total**: 7-10 days

---

### Next Sprint (Week 3-4)
**Focus**: Token enhancements

1. **Token status effects** (4-5 days)
2. **Token health bars** (2-3 days)
3. **Grid configuration** (2-3 days)
4. **Testing & polish** (1-2 days)

**Total**: 9-13 days

---

### Sprint 3 (Week 5-6)
**Focus**: UX improvements

1. **Token context menu** (2-3 days)
2. **Undo/redo system** (3-4 days)
3. **Keyboard shortcuts** (2-3 days)
4. **Testing & polish** (1-2 days)

**Total**: 8-12 days

---

## 🎯 Success Metrics

Track these to measure impact:
- Tool usage frequency (which tools are used most)
- Average session duration
- Tokens per map
- Shapes drawn per session
- User feedback scores
- Bug reports per feature

---

## 🚀 User Feedback Needed

Before implementing, gather feedback on:
1. Should shapes auto-expire or be persistent by default?
2. Should HP bars be visible to players by default?
3. Which status effects are most commonly used?
4. Preferred grid size defaults?
5. Most needed keyboard shortcuts?

---

## 📝 Technical Considerations

### Performance
- Limit max shapes per map (100?)
- Viewport culling for off-screen elements
- Debounce token position updates
- Batch Firestore writes

### Security
- Validate shape geometry server-side
- Prevent abuse (spam shapes)
- Rate limit drawing actions
- DM-only features properly gated

### Data Migration
- Existing tokens need HP structure added
- Maps need grid config defaults
- Backwards compatibility for old saves

---

## 🎨 Design Philosophy

**Guiding Principles**:
1. **DM Control**: DMs decide what players see
2. **Performance First**: Don't slow down gameplay
3. **Intuitive UI**: Tools should be self-explanatory
4. **Keyboard + Mouse**: Support both input methods
5. **Mobile Eventually**: Plan for tablet support
6. **Real-Time Sync**: Everything syncs across all clients
7. **Undo-able**: Most actions should be reversible

---

## 📚 Related Documentation

- `VTT_PHASE_4_ENHANCEMENTS.md` - Detailed feature specs
- `VTT_BUG_FIXES_PHASE_4.md` - Recent bug fixes
- `STYLE_GUIDE.md` - UI/UX standards
- `firestore.rules` - Security rules
- `src/services/vtt/` - Service layer code

---

## ✅ Implementation Checklist

Use this for each new feature:
- [ ] Design mockups/wireframes
- [ ] Data structure defined
- [ ] Firestore service created
- [ ] Real-time sync implemented
- [ ] UI components created
- [ ] Keyboard shortcuts added
- [ ] DM/Player permissions correct
- [ ] Error handling
- [ ] Loading states
- [ ] Mobile-friendly (if applicable)
- [ ] Documentation updated
- [ ] Tests written
- [ ] User testing
- [ ] Performance profiling
- [ ] Security review
- [ ] Deploy & monitor

---

**Last Updated**: October 1, 2025
**Next Review**: October 8, 2025
**Contributors**: Development Team
