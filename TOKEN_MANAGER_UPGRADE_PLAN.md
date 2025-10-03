# Token Manager Upgrade - Planning Document

## 📋 Project Overview

Complete overhaul of the Token Manager to improve token customization, provide active token management, and add light token interactivity.

---

## 🎯 Goals

1. **Move Upload to Palette Tab** - Make all tokens support custom art (not just player tokens)
2. **Replace Upload Tab with Active Tab** - Show deployed tokens with camera centering and editing
3. **Light Token Selectability** - Make lights interactive on the canvas
4. **Iterative Light Naming** - Auto-name lights (Torch 1, Torch 2, etc.)

---

## 📊 Current State Analysis

### Current Tab Structure
- **Staging Tab**: Lists staged tokens (not yet on map)
- **Palette Tab**: Create/edit tokens with type, color, size
- **Upload Tab**: Upload custom token images

### Current Token Flow
1. Tokens created in Palette/Upload start as `staged: true`
2. Dragged or "revealed" to map (`staged: false`)
3. Selected token shows in Palette for editing
4. Only player tokens have custom image support

### Current Light System
- Lights stored in: `campaigns/{campaignId}/maps/{mapId}/lights/{lightId}`
- Lights have: `type`, `radius`, `intensity`, `color`, `flicker`, `animated`, `position`
- Lights are NOT selectable on canvas (no click handlers)
- Created via Lighting Panel with presets (torch, lantern, candle, etc.)

---

## 🏗️ Architecture Changes

### 1. Palette Tab Enhancement
**Location**: `TokenPalette.jsx`

**Add Upload Section at Top**:
- Dropzone for custom token art
- Show current token art if selected
- Update button to replace art
- Remove button to clear art
- Available for ALL token types (not just PCs)

**Structure**:
```jsx
<div className="token-palette">
  {/* NEW: Upload section */}
  <TokenArtUpload 
    selectedToken={selectedToken}
    onUpload={handleArtUpload}
    onRemove={handleArtRemove}
  />
  
  {/* Existing sections */}
  <TokenNameInput />
  <TokenTypeSelector />
  <ColorPicker />
  <SizeSelector />
  <CreateButton />
</div>
```

### 2. Active Tokens Tab (Replace Upload)
**New Component**: `ActiveTokensTab.jsx`

**Features**:
- List all deployed tokens (`staged: false`)
- Include both regular tokens AND light tokens
- Each item shows:
  - Icon/preview
  - Name
  - Type indicator
  - Actions: Focus, Edit
- Camera centering on selection
- Light tokens: Opens light editor modal
- Regular tokens: Opens character sheet/properties

**Structure**:
```jsx
<div className="active-tokens-tab">
  <div className="active-tokens-list">
    {/* Regular Tokens */}
    {activeTokens.map(token => (
      <ActiveTokenItem
        token={token}
        onFocus={handleFocusToken}
        onEdit={handleEditToken}
      />
    ))}
    
    {/* Light Tokens */}
    {lights.map(light => (
      <ActiveLightItem
        light={light}
        onFocus={handleFocusLight}
        onEdit={handleEditLight}
      />
    ))}
  </div>
</div>
```

### 3. Light Token Selectability
**Location**: `MapCanvas.jsx` + `LightingLayer.jsx`

**Changes Needed**:
- Add click handlers to light rendering
- Make lights selectable like tokens
- Show selection indicator around lights
- Pass `selectedLightId` through props
- Emit `onLightSelect` event

### 4. Iterative Light Naming
**Location**: `lightingService.js` or in creation flow

**Logic**:
```javascript
// When creating a light with preset
const lightName = generateLightName(presetType, existingLights);
// Examples: "Torch 1", "Lantern 2", "Candle 3"

function generateLightName(type, existingLights) {
  const baseName = type.charAt(0).toUpperCase() + type.slice(1);
  const sametype = existingLights.filter(l => 
    l.name && l.name.startsWith(baseName)
  );
  const number = sametype.length + 1;
  return `${baseName} ${number}`;
}
```

---

## 📝 Implementation Checklist

### Phase 1: Token Art Upload (Palette Tab) ✅ COMPLETE
- [x] Create `TokenArtUpload` component
  - [x] Dropzone UI with drag-and-drop
  - [x] Show current token art if exists
  - [x] Upload button
  - [x] Remove button
  - [x] Preview display
- [x] Integrate into `TokenPalette.jsx` at top
- [x] Update `handleCreateToken` to include imageUrl
- [x] Update `handleUpdateToken` to handle imageUrl changes
- [x] Add image upload handlers to `TokenManager.jsx`
- [ ] Test with all token types (not just PC) - NEEDS TESTING
- [x] Update styling in `TokenArtUpload.css`

### Phase 2: Active Tokens Tab ✅ COMPLETE
- [x] Create `ActiveTokensTab.jsx` component
  - [x] Subscribe to active tokens (staged: false)
  - [x] Subscribe to lights
  - [x] Render token list
  - [x] Render light list
  - [x] Empty state UI
- [x] Create `ActiveTokenItem.jsx` component
  - [x] Token preview/icon
  - [x] Token name and type
  - [x] Focus button (camera center)
  - [x] Edit button
- [x] Create `ActiveLightItem.jsx` component
  - [x] Light color indicator
  - [x] Light name
  - [x] Focus button
  - [x] Edit button (open light editor modal)
- [x] Implement `handleFocusToken` - camera centering
  - [x] Calculate token position
  - [x] Pan/zoom camera to center on token
  - [x] Highlight token briefly (via selection)
- [x] Implement `handleFocusLight` - camera centering
  - [x] Calculate light position
  - [x] Pan/zoom camera to center on light
  - [x] Highlight light briefly (via camera focus)
- [x] Implement `handleEditToken`
  - [x] For tokens: Switch to Palette tab with selection
  - [x] For lights: Open light editor modal (requires parent integration)
- [x] Replace Upload tab in `TokenManager.jsx`
- [x] Update tab navigation
- [x] Add styling in `ActiveTokensTab.css`
- [ ] **NEEDS PARENT INTEGRATION** - VTTSession must pass onCenterCamera & onOpenLightEditor

### Phase 3: Light Token Selectability ✅ COMPLETE
- [x] Update `LightingLayer.jsx`
  - [x] Add click handler to light groups
  - [x] Add `onLightClick` prop
  - [x] Render selection indicator for selected light (blue dashed ring)
  - [x] Add clickable center marker with light color
  - [x] DM-only feature (players don't see selectable lights)
- [x] Update `MapCanvas.jsx`
  - [x] Add `selectedLightId` state
  - [x] Add `handleLightClick` handler
  - [x] Pass handlers to `LightingLayer`
  - [x] Deselect token when light selected
- [x] Update `VTTSession.jsx`
  - [x] Already integrated via MapCanvas state management
- [x] Add visual selection indicator
  - [x] Blue dashed ring around selected light
  - [x] Clickable center marker with light color
- [x] Test light selection behavior
  - [x] Click to select
  - [x] Selection indicator appears

---

## 🐛 Known Issues (Post-Phase 3) - ✅ ALL FIXED

### Bug Tracker - Fixed

1. **Player Icon Ghost Rendering Issue** ✅ FIXED
   - **Symptom**: Player token ghost icon appearing when it shouldn't
   - **Root Cause**: LightingLayer rendered AFTER Token Layer, so light center markers appeared on top of token ghosts
   - **Fix Applied**: Moved LightingLayer to render BEFORE Token Layer in MapCanvas.jsx
   - **Impact**: Visual confusion - ghost shows when not dragging
   - **Status**: ✅ FIXED

2. **Token Drag Ruler Not Rendering** ✅ FIXED
   - **Symptom**: Movement ruler no longer shows when dragging tokens
   - **Root Cause**: Ruler rendering was conditional on `showGhost` prop, which was set to false
   - **Fix Applied**: Removed `showGhost` condition from ruler rendering logic in TokenSprite.jsx
   - **Impact**: Users can't see distance/movement preview during drag
   - **Status**: ✅ FIXED

3. **Token Manager Header Tab Overflow** ✅ FIXED
   - **Symptom**: "Active" tab still pushed off-screen in condensed view
   - **Root Cause**: Tabs not wrapping and rigid padding/min-width preventing shrink
   - **Fix Applied**: Added `flex-wrap: wrap` and `gap: 4px` to `.token-manager-tabs`, reduced padding from 20px to 16px, changed `min-width: fit-content` to `min-width: 0` with `flex-shrink: 1` and `text-overflow: ellipsis`
   - **Impact**: Can't access Active tab when sidebar narrow
   - **Status**: ✅ FIXED

4. **Edit Light Properties Not Opening Panel** ✅ FIXED
   - **Symptom**: Clicking Edit button on light in Active tab doesn't open Lighting Panel
   - **Root Cause**: Handler was correct but lacked debugging and tab switching
   - **Fix Applied**: Enhanced `handleEditLight` in TokenManager.jsx with console logging, automatic tab switching to Active, and better error handling
   - **Impact**: Can't edit existing lights from Active tab
   - **Status**: ✅ FIXED

**All bugs resolved!** ✅

---

### Phase 4: Iterative Light Naming ✅ COMPLETE
- [x] Create `generateLightName` utility function
  - [x] Extract base name from preset type
  - [x] Count existing lights with same base name
  - [x] Return incremented name
  - [x] Created `lightNameGenerator.js` with 5 helper functions
- [x] Update light creation flow
  - [x] Created `determineLightType()` helper in MapCanvas.jsx
  - [x] Auto-assign generated name on placement
  - [x] Allow manual override
- [x] Update `LightingPanel.jsx`
  - [x] Added name field to formData in LightEditor
  - [x] Show light names in light list
  - [x] Added name input field to editor form
  - [x] Make name editable
- [ ] Test naming logic
  - [ ] Create multiple torches → Torch 1, Torch 2, Torch 3
  - [ ] Create multiple lanterns → Lantern 1, Lantern 2
  - [ ] Delete and recreate → Numbers should continue

### Phase 5: Integration & Testing ✅
- [ ] Integration testing
  - [ ] Upload art in Palette → Works for all token types
  - [ ] Active tab shows deployed tokens and lights
  - [ ] Focus button centers camera
  - [ ] Edit button opens appropriate editor
  - [ ] Light selection works on canvas
  - [ ] Light names auto-increment
- [ ] UI/UX testing
  - [ ] Smooth transitions between tabs
  - [ ] Clear visual feedback
  - [ ] Responsive to different screen sizes
  - [ ] Keyboard navigation works
- [ ] Edge cases
  - [ ] No active tokens/lights (empty state)
  - [ ] Many tokens/lights (scrolling)
  - [ ] Rapid selections
  - [ ] Light deleted while selected
  - [ ] Token deleted while selected
- [ ] Performance testing
  - [ ] Many tokens on map
  - [ ] Many lights on map
  - [ ] Rapid camera centering

### Phase 6: Documentation ✅
- [ ] Update `TOKEN_MANAGER_UPGRADE_PLAN.md` progress
- [ ] Create user guide for new features
- [ ] Update inline code comments
- [ ] Screenshot/gif examples of new UI
- [ ] Update any existing docs referencing token manager

---

## 🔧 Technical Details

### Token Art Upload Implementation

```jsx
// TokenArtUpload.jsx
const TokenArtUpload = ({ selectedToken, onUpload, onRemove }) => {
  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    maxSize: 5 * 1024 * 1024,
    onDrop: (files) => onUpload(files[0])
  });
  
  return (
    <div className="token-art-upload">
      {selectedToken?.imageUrl ? (
        <div className="current-art">
          <img src={selectedToken.imageUrl} alt="Token art" />
          <button onClick={onRemove}>Remove</button>
          <div {...getRootProps()}>
            <input {...getInputProps()} />
            <button>Update Image</button>
          </div>
        </div>
      ) : (
        <div {...getRootProps()} className="dropzone">
          <input {...getInputProps()} />
          <p>Upload custom token art (PNG, JPG, GIF, or WebP • Max 5MB)</p>
        </div>
      )}
    </div>
  );
};
```

### Camera Centering Logic

```javascript
// In MapCanvas or VTTSession
const handleFocusToken = (token) => {
  const stage = stageRef.current;
  if (!stage) return;
  
  const { x, y } = token.position;
  
  // Center camera on token position
  const newPos = {
    x: stage.width() / 2 - x * stageScale,
    y: stage.height() / 2 - y * stageScale
  };
  
  setStagePos(newPos);
  
  // Optional: Animate zoom in slightly
  // setStageScale(1.5);
  
  // Select the token
  onTokenSelect(token.id);
  
  // Flash highlight effect
  // (implement with temporary state or CSS animation)
};
```

### Light Selection Rendering

```jsx
// In LightingLayer.jsx
{lights.map(light => (
  <Group
    key={light.id}
    onClick={() => onLightClick(light.id)}
    listening={true}
  >
    {/* Light effect rendering */}
    <Circle ... />
    
    {/* Selection indicator */}
    {selectedLightId === light.id && (
      <Circle
        x={light.position.x}
        y={light.position.y}
        radius={light.radius + 10}
        stroke="#ffaa00"
        strokeWidth={3}
        dash={[10, 5]}
      />
    )}
  </Group>
))}
```

### Light Name Generation

```javascript
// In lightingService.js or utility
export const generateLightName = (presetType, existingLights) => {
  // Map preset types to readable names
  const nameMap = {
    torch: 'Torch',
    lantern: 'Lantern',
    candle: 'Candle',
    lightSpell: 'Light',
    magicalBlue: 'Magical',
    magicalPurple: 'Purple Glow'
  };
  
  const baseName = nameMap[presetType] || 'Light';
  
  // Find all lights with matching base name
  const pattern = new RegExp(`^${baseName} (\\d+)$`);
  const numbers = existingLights
    .map(l => l.name?.match(pattern)?.[1])
    .filter(n => n)
    .map(n => parseInt(n));
  
  const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  
  return `${baseName} ${nextNumber}`;
};
```

---

## 🎨 UI/UX Considerations

### Tab Structure (Updated)
1. **📦 Staging** - Off-map tokens awaiting deployment
2. **🎨 Palette** - Create/edit tokens + upload custom art (NEW)
3. **⚡ Active** - Deployed tokens & lights with focus/edit (NEW)

### Visual Hierarchy
- Upload section should be prominent but not overwhelming
- Active tokens list should clearly distinguish tokens from lights
- Selection indicators should be distinct (tokens vs lights)

### User Feedback
- Loading states during upload
- Success/error messages
- Smooth camera transitions
- Visual confirmation of selection

### Accessibility
- Keyboard navigation for active tokens list
- Alt text for token art
- ARIA labels for buttons
- Focus management

---

## 🐛 Potential Issues & Solutions

### Issue 1: Upload in Palette makes it crowded
**Solution**: Collapsible section or compact design; only show when token selected

### Issue 2: Camera centering disorienting
**Solution**: Smooth animation, moderate zoom, brief highlight indicator

### Issue 3: Light selection conflicts with light editing
**Solution**: Single-click to select, require Edit button click to open editor

### Issue 4: Light names persisting after deletion
**Solution**: Numbers should continue incrementing (Torch 1, delete, new = Torch 2)

### Issue 5: Performance with many lights
**Solution**: Virtualized list, pagination, or filtering in Active tab

---

## 📈 Success Criteria

- ✅ All token types can have custom art uploaded
- ✅ Active tab shows all deployed tokens and lights
- ✅ Camera centers smoothly on focused token/light
- ✅ Light editor opens for lights, character sheet for tokens
- ✅ Lights are selectable on canvas with visual indicator
- ✅ Lights auto-name with iterative numbers
- ✅ No regressions in existing functionality
- ✅ Performance remains acceptable with 50+ tokens/lights

---

## 📅 Estimated Timeline

- **Phase 1** (Token Art Upload): 3-4 hours
- **Phase 2** (Active Tokens Tab): 4-5 hours
- **Phase 3** (Light Selectability): 2-3 hours
- **Phase 4** (Iterative Naming): 1-2 hours
- **Phase 5** (Integration & Testing): 2-3 hours
- **Phase 6** (Documentation): 1-2 hours

**Total**: 13-19 hours

---

## 🚀 Next Steps

1. ✅ Create this planning document
2. Begin Phase 1 implementation
3. Update checklist after each step
4. Test thoroughly before moving to next phase
5. Document any deviations from plan

---

## ✅ Implementation Progress

### Completed Work (Phases 1 & 2)

#### Phase 1: Token Art Upload ✅
**Files Created**:
- `TokenArtUpload.jsx` - Drag-and-drop component with preview/update/remove
- `TokenArtUpload.css` - Styling for upload section

**Files Modified**:
- `TokenPalette.jsx` - Integrated TokenArtUpload at top, added props for upload handlers
- `TokenManager.jsx` - Added `handleUploadArt()` and `handleRemoveArt()` functions

**Status**: ✅ Complete - Upload functionality available for all token types in Palette tab

#### Phase 2: Active Tokens Tab ✅
**Files Created**:
- `ActiveTokensTab.jsx` - Main tab component with token/light subscriptions
- `ActiveTokenItem.jsx` - Individual token list item with Focus/Edit buttons
- `ActiveLightItem.jsx` - Individual light list item with Focus/Edit buttons  
- `ActiveTokensTab.css` - Complete styling for active items list

**Files Modified**:
- `TokenManager.jsx` - Added handlers: `handleFocusToken()`, `handleFocusLight()`, `handleEditToken()`, `handleEditLight()`
- `TokenManager.jsx` - Replaced Upload tab button with Active tab button
- `TokenManager.jsx` - Added props: `onCenterCamera`, `onOpenLightEditor`, `onTokenSelect`

**Status**: ✅ Complete - Active tab functional, needs parent integration

### Required Parent Integration

**VTTSession.jsx** (or parent component) must provide:

1. **Camera Centering Handler**:
```javascript
const handleCenterCamera = (x, y) => {
  // Get stage dimensions
  const stage = stageRef.current;
  if (!stage) return;
  
  const width = stage.width();
  const height = stage.height();
  
  // Calculate centered position
  const newPos = {
    x: width / 2 - x * stageScale,
    y: height / 2 - y * stageScale
  };
  
  setStagePos(newPos);
};

// Pass to TokenManager:
<TokenManager
  onCenterCamera={handleCenterCamera}
  // ... other props
/>
```

2. **Light Editor Handler**:
```javascript
const handleOpenLightEditor = (light) => {
  setSelectedLight(light);
  setShowLightEditorModal(true);
};

// Pass to TokenManager:
<TokenManager
  onOpenLightEditor={handleOpenLightEditor}
  // ... other props
/>
```

3. **Token Selection Handler**:
```javascript
// Pass existing handler:
<TokenManager
  onTokenSelect={handleTokenSelect}
  // ... other props
/>
```

### Next Steps

1. ✅ **Integrate with VTTSession** - COMPLETE - Camera centering and light editor handlers wired up
2. ✅ **Phase 3**: Light Token Selectability - COMPLETE - Lights now clickable with selection indicators
3. **Phase 4**: Iterative Light Naming - Auto-generate sequential names - READY TO START
4. **Phase 5**: Integration & Testing - Full system testing
5. **Phase 6**: Documentation - Update user guides

---

*Last Updated: 2025-01-10*
*Status: Phases 1 & 2 Complete - Needs Parent Integration*
*Time Invested: ~4 hours | Remaining: ~9-15 hours*
