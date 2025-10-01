# Virtual Tabletop (VTT) Documentation

Welcome to the Virtual Tabletop system documentation for DungeonChat!

## 📚 Documentation Index

### 1. [Strategy Document](./VIRTUAL_TABLETOP_STRATEGY.md)
**Comprehensive technical strategy and architecture**
- Full system architecture
- Complete data model (Firestore, Storage, RTDB)
- All feature modules (7 core modules)
- Real-time sync strategy
- Security & access control
- Performance optimization
- UI design concepts
- Integration with existing systems
- Full implementation phases (14 weeks)
- Risk mitigation
- Cost analysis

**Use this for:** Understanding the complete vision, technical decisions, and long-term roadmap.

---

### 2. [MVP Scope & Implementation Plan](./VTT_MVP_SCOPE.md) ⭐ START HERE
**Focused 6-week MVP plan**
- **Core MVP Features:**
  - Map upload + adjustable grid
  - Player & enemy tokens
  - Real-time updates
  - Basic pinging system
- **Stretch Goals:**
  - Live cursor tracking
  - Player token movement
  - Snap-to-grid
- **Post-MVP Features:** Fog of war, drawing tools, measurements, etc.
- Simplified data model
- 4 implementation phases (6 weeks)
- User stories
- Success criteria

**Use this for:** Actual implementation planning, prioritization, and execution.

---

### 3. [Tech Stack Comparison](./VTT_TECH_STACK_COMPARISON.md)
**Library options and recommendations**
- **Canvas Rendering:**
  - Konva.js (Recommended ⭐)
  - Fabric.js
  - PixiJS
  - Plain Canvas
  - Three.js
- **Supporting Libraries:**
  - Image handling (use-image)
  - File upload (react-dropzone)
  - Color picker (react-colorful)
  - Icons (react-icons)
  - Utilities (uuid, lodash)
- Comparison matrix
- Bundle size analysis
- Performance benchmarks
- Installation commands

**Use this for:** Understanding why we chose Konva.js and what alternatives exist.

---

### 4. [Quick Start Guide](./VTT_QUICK_START_GUIDE.md)
**Step-by-step implementation guide**
- Installation commands
- Firestore schema setup
- Security rules updates
- Directory structure
- Component checklist (all phases)
- Code snippets to get started:
  - MapCanvas component
  - Map service
  - Grid layer
  - Map uploader
- Testing checklist
- Common issues & solutions
- Next steps

**Use this for:** Beginning implementation, Phase 1 kickoff, developer onboarding.

---

## 🎯 Recommended Reading Order

### For Product/Strategy Discussion:
1. **MVP Scope** - Understand what we're building first
2. **Strategy Document** - See the full vision
3. **Tech Stack** - Understand technology choices

### For Implementation:
1. **Quick Start Guide** - Install dependencies and get coding
2. **MVP Scope** - Reference feature requirements
3. **Strategy Document** - Reference architecture details as needed
4. **Tech Stack** - Look up library-specific details

---

## 🚀 Implementation Timeline

| Week | Phase | Focus |
|------|-------|-------|
| 1-2 | Phase 1 | Map Editor Foundation |
| 3-4 | Phase 2 | Token System |
| 5 | Phase 3 | Real-Time View & Ping |
| 6 | Phase 4 | Integration & Polish |
| 7+ | Phase 5 | Stretch Goals (Optional) |

**Total MVP: 6 weeks**

---

## 📦 MVP Feature Breakdown

### ✅ Must Have (MVP)
- Map upload & storage
- Adjustable grid overlay
- Player & enemy tokens
- Drag-to-move tokens
- Save maps to library
- Real-time updates
- Basic pinging

### 🎯 Stretch Goals
- Live cursor tracking
- Player token movement permissions
- Snap-to-grid

### ❌ Post-MVP (Future)
- Fog of War
- Drawing tools
- Measurement tools
- Token conditions & HP
- Encounter deployment
- Initiative integration
- Advanced features

---

## 🛠 Tech Stack Summary

### Frontend
- **React 19** (existing)
- **Konva.js + react-konva** (canvas rendering)
- **use-image** (image loading)
- **react-dropzone** (file upload)
- **react-colorful** (color picker)
- **uuid** (ID generation)
- **lodash.debounce** (utilities)

### Backend
- **Firestore** (data storage)
- **Firebase Storage** (images)
- **Cloud Functions** (image processing - future)

### Bundle Impact
- ~476KB minified (~151KB gzipped)
- ~500ms load time on 3G

---

## 📂 Project Structure (After Implementation)

```
src/
├── components/
│   └── VTT/
│       ├── MapEditor/
│       │   ├── MapEditor.jsx
│       │   ├── MapUploader.jsx
│       │   ├── GridConfigurator.jsx
│       │   └── MapSaveDialog.jsx
│       ├── MapLibrary/
│       │   ├── MapLibrary.jsx
│       │   └── MapCard.jsx
│       ├── Canvas/
│       │   ├── MapCanvas.jsx
│       │   ├── GridLayer.jsx
│       │   └── CanvasControls.jsx
│       ├── TokenManager/
│       │   ├── TokenManager.jsx
│       │   ├── TokenPalette.jsx
│       │   ├── TokenUploader.jsx
│       │   ├── TokenSprite.jsx
│       │   └── TokenProperties.jsx
│       └── MapViewer/
│           ├── MapViewer.jsx
│           └── PingIndicator.jsx
├── services/
│   └── vtt/
│       ├── mapService.js
│       ├── tokenService.js
│       └── pingService.js
└── hooks/
    └── vtt/
        ├── useMapEditor.js
        ├── useCanvas.js
        ├── useTokens.js
        ├── useMapSync.js
        ├── useTokenSync.js
        └── usePing.js
```

---

## 🔐 Security Considerations

### Firestore Rules
- Campaign members can read maps/tokens
- Only DM can write maps/tokens
- Validation of data types

### Storage Rules
- 20MB map image limit
- 5MB token image limit
- Image file types only
- Campaign member read access
- DM write access

---

## 🧪 Testing Strategy

### Unit Tests
- Service functions (mapService, tokenService)
- Utility functions (grid calculations)

### Component Tests
- MapUploader file validation
- GridConfigurator state changes
- TokenSprite rendering

### Integration Tests
- Map creation flow (upload → save → load)
- Token placement flow (create → place → move)
- Real-time sync (DM action → Player sees update)

### E2E Tests
- Full DM workflow (create map → add tokens → save)
- Full Player workflow (view map → see updates → ping)

---

## 📊 Success Metrics

### Performance
- Map load time: < 5 seconds (2000x2000px)
- Token movement latency: < 500ms
- Frame rate: 30+ FPS with 20 tokens
- Ping latency: < 500ms

### Adoption
- 70%+ of campaigns create a map
- Average 2+ maps per campaign
- 4.5+ star rating for VTT feature

---

## 🐛 Known Issues & Limitations (MVP)

### By Design (Post-MVP)
- No fog of war
- No drawing tools
- No measurement tools
- No token conditions/HP display
- Players can't move tokens
- Grid is square only (no hex)
- Tokens are 1x1 only (no large creatures)

### Technical Limitations
- Max 20MB map images
- Max 100 tokens per map
- 3-second ping duration (not configurable)

---

## 🔮 Future Roadmap

### Phase 2 (Post-MVP)
- Fog of War (manual)
- Drawing tools (freehand, shapes)
- Token conditions & HP bars
- Encounter deployment

### Phase 3 (3-6 months)
- Automatic fog of war (vision-based)
- Measurement tools
- Initiative tracker integration
- Advanced token features (auras, vision)

### Phase 4 (6-12 months)
- Mobile optimization
- Map templates
- Token marketplace
- AI map generation

---

## 💬 Questions?

If you have questions about:
- **Features & Scope** → See [MVP Scope](./VTT_MVP_SCOPE.md)
- **Architecture & Design** → See [Strategy Document](./VIRTUAL_TABLETOP_STRATEGY.md)
- **Libraries & Tools** → See [Tech Stack Comparison](./VTT_TECH_STACK_COMPARISON.md)
- **Getting Started** → See [Quick Start Guide](./VTT_QUICK_START_GUIDE.md)

---

**Ready to build? Start with the [Quick Start Guide](./VTT_QUICK_START_GUIDE.md)! 🎲🗺️**
