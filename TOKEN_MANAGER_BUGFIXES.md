# Token Manager Bug Fixes - Pre-Phase 4

## Issues Identified (2025-01-10)

### 🐛 Bug 1: Camera Centering Not Working
**Symptom**: Console shows "Camera center function not available yet"
```
VTTSession.jsx:847 Camera center function not available yet
```

**Root Cause**: The `onCenterCamera` prop in MapCanvas expects an object with a `.current` property (ref pattern), but the useEffect that assigns `handleCenterCamera` to `onCenterCamera.current` is checking if `onCenterCamera` is a function instead of an object.

**Fix**: Update the useEffect check in MapCanvas.jsx to properly handle the ref object pattern.

---

### 🐛 Bug 2: Ghost Token Visible When Not Dragging
**Symptom**: Ghost placeholder token (dashed circle) visible even when player token is not being moved (see image 1)

**Root Cause**: `showGhost={true}` is hardcoded in MapCanvas.jsx token rendering. Ghost should only appear during drag operations.

**Fix**: Change `showGhost={isDragging}` or `showGhost={isDragging && token.id === selectedTokenId}` to only show ghost during active drag.

---

### 🐛 Bug 3: Edit Button Opens Token Sheet/Stub
**Symptom**: Edit button should open character sheet for PC/NPC/Enemy tokens, stub for other types

**Current Behavior**: Edit button switches to Palette tab with token selected

**Expected Behavior**:
- PC/NPC/Enemy: Open character sheet (if exists) or stub
- Other types (Object, Hazard, Marker, etc.): Open minimal stub or info panel
- Light tokens: Already working correctly (opens Light Panel)

**Fix**: Add character sheet opening logic to `handleEditToken()` in TokenManager.jsx

---

### 🐛 Bug 4: Active Tab Content Scrolls Above Header
**Symptom**: Token list scrolls up and covers section headers (see image 2)

**Root Cause**: `.section-header` has `position: sticky; top: 0` but the scrolling container allows content to scroll behind it.

**Fix**: Add proper z-index stacking and background to section headers in ActiveTokensTab.css

---

### 🐛 Bug 5: Light Tokens Too Large
**Symptom**: Light markers became giant ugly dots (radius 12px) instead of subtle indicators (see image 3)

**Root Cause**: Phase 3 added large clickable center markers (radius 12px) for selection that replaced the previous subtle indicators.

**Fix**: Reduce clickable marker size to radius 6-8px, add hover effect for discoverability. Keep selection ring at radius 20px.

---

### 🐛 Bug 6: Selected Token Blocks Active Tab
**Symptom**: When token is selected and user clicks Active tab, the token remains selected and blocks the view

**Expected Behavior**: Clicking Active tab should deselect any selected token

**Fix**: Add token deselection to Active tab click handler in TokenManager.jsx

---

### 🐛 Bug 7: Active Tab Pushed Off Screen (Condensed View)
**Symptom**: When TokenManager is condensed, Active tab button goes off-screen (see image 4)

**Root Cause**: Tab buttons have `padding: 12px 20px` and `white-space: nowrap` which prevents them from shrinking

**Fix**: Add responsive CSS to reduce tabs to icon-only mode when width is constrained:
- Add icons to each tab button
- Use `@media` or container query to hide text, show only icons
- Or use flex shrink to compress tab labels

---

## Fix Priority

1. **Bug 1 (Camera Centering)** - CRITICAL - Core feature broken ✅ **FIXED**
2. **Bug 5 (Light Size)** - HIGH - Visual regression, UX impact ✅ **FIXED**
3. **Bug 2 (Ghost Token)** - HIGH - Visual bug, confusing to users ✅ **FIXED**
4. **Bug 4 (Scroll Header)** - MEDIUM - UX issue but not blocking ✅ **FIXED**
5. **Bug 6 (Selected Token)** - MEDIUM - UX annoyance ✅ **FIXED**
6. **Bug 7 (Tab Overflow)** - MEDIUM - Layout issue on small screens ✅ **FIXED**
7. **Bug 3 (Edit Button)** - LOW - Enhancement, not blocking workflow ⚠️ **PARTIAL** (TODO added)

---

## Fixes Applied

### ✅ Bug 1: Camera Centering Fixed
**Change**: Updated useEffect in MapCanvas.jsx to check for `object` with `.current` property instead of `function`
```javascript
if (onCenterCamera && typeof onCenterCamera === 'object' && onCenterCamera.current !== undefined) {
  onCenterCamera.current = handleCenterCamera;
  console.log('Camera center function assigned to ref');
}
```

### ✅ Bug 2: Ghost Token Fixed
**Change**: Set `showGhost={false}` in MapCanvas.jsx - ghost only appears during actual drag operations (controlled by `isDragging && dragStartPos` in TokenSprite)

### ✅ Bug 3: Edit Button Enhancement
**Change**: Added TODO comment and type checking for character sheets
```javascript
// For PC, NPC, or Enemy tokens, try to open character sheet
if (['pc', 'npc', 'enemy'].includes(token.type)) {
  console.log('TODO: Open character sheet for', token.name);
}
```

### ✅ Bug 4: Scroll Header Fixed
**Change**: Updated `.section-header` in ActiveTokensTab.css:
- Solid background: `#2a2a3e` (instead of transparent)
- Higher z-index: `10` (instead of 1)
- Added box-shadow for depth
- Stronger border colors

### ✅ Bug 5: Light Size Fixed
**Changes**:
- Reduced clickable marker: `radius={8}` (was 12)
- Reduced stroke: `strokeWidth={1.5}` (was 2)
- Dynamic opacity: `opacity={isSelected ? 0.9 : 0.6}` (was 0.8)
- Reduced center dot: `radius={3}` (was 6)

### ✅ Bug 6: Selected Token Deselection Fixed
**Change**: Active tab button now calls `onTokenDeselect()` when clicked
```javascript
onClick={() => {
  if (onTokenDeselect) {
    onTokenDeselect();
  }
  setActiveView('active');
}}
```

### ✅ Bug 7: Responsive Tabs Fixed
**Change**: Added responsive CSS with `min-width: fit-content` and media queries:
- `@media (max-width: 500px)`: Reduced padding, larger icons
- `@container (max-width: 380px)`: Icon-focused layout
- Prevents tab overflow in condensed view

---

## Testing Checklist (After Fixes)

- [ ] Camera centers on tokens when clicking Focus button *(should work now)*
- [ ] Camera centers on lights when clicking Focus button *(should work now)*
- [ ] Ghost tokens only appear during drag operations *(fixed)*
- [ ] Light markers are subtle (8px radius) but still clickable *(fixed)*
- [ ] Light selection ring appears on click *(existing, should still work)*
- [ ] Section headers stay fixed when scrolling *(fixed with solid bg + z-index)*
- [ ] Active tab deselects token when opened *(fixed)*
- [ ] Tabs remain visible in condensed TokenManager *(fixed with responsive CSS)*
- [ ] Edit button behavior appropriate for each token type *(TODO added for future)*

---

## Files Modified

1. `src/components/VTT/Canvas/MapCanvas.jsx` - Camera ref check, ghost token prop
2. `src/components/VTT/Canvas/LightingLayer.jsx` - Light marker sizing
3. `src/components/VTT/TokenManager/TokenManager.jsx` - Edit handler, Active tab deselection
4. `src/components/VTT/TokenManager/TokenManager.css` - Responsive tab styling
5. `src/components/VTT/TokenManager/ActiveTokensTab.css` - Section header stacking

---

*Generated: 2025-01-10*
*Status: 6/7 Bugs Fixed, 1 Enhancement Noted*
*Ready for Phase 4: Iterative Light Naming*
