# Quick Integration Guide - TokenManager Camera & Light Editing

## 🔌 Required Integration for Phases 1 & 2

The new TokenManager features are **complete** but need 3 handlers from the parent component (VTTSession.jsx or MapCanvas parent).

---

## Step 1: Add Camera Centering Handler

### In VTTSession.jsx (or wherever MapCanvas/TokenManager are rendered):

```javascript
/**
 * Center camera on specific map coordinates
 * Called from Active tab when user clicks Focus button
 */
const handleCenterCamera = (x, y) => {
  const stage = stageRef.current; // Or however you access the Konva stage
  if (!stage) {
    console.warn('Cannot center camera: stage ref not available');
    return;
  }
  
  // Get stage dimensions
  const width = stage.width();
  const height = stage.height();
  
  // Calculate position to center viewport on (x, y)
  // Formula: centerPos = (stageDimension / 2) - (targetPos * scale)
  const newPos = {
    x: width / 2 - x * stageScale,
    y: height / 2 - y * stageScale
  };
  
  // Update stage position
  setStagePos(newPos);
  
  console.log(`Centered camera on (${x}, ${y})`);
};
```

**If using useCanvasViewport hook**:
```javascript
const { centerOnPoint } = useCanvasViewport({ ... });

const handleCenterCamera = (x, y) => {
  const stage = stageRef.current;
  if (!stage) return;
  
  centerOnPoint(x, y, stage.width(), stage.height());
};
```

---

## Step 2: Add Light Editor Handler

### If you have a light editor modal:

```javascript
const [showLightEditorModal, setShowLightEditorModal] = useState(false);
const [selectedLight, setSelectedLight] = useState(null);

/**
 * Open light editor modal for specific light
 * Called from Active tab when user clicks Edit button on light
 */
const handleOpenLightEditor = (light) => {
  console.log('Opening light editor for:', light.name || light.type);
  setSelectedLight(light);
  setShowLightEditorModal(true);
};
```

### If you DON'T have a light editor modal yet:

```javascript
/**
 * Placeholder - opens light panel and selects light
 * TODO: Create dedicated light editor modal
 */
const handleOpenLightEditor = (light) => {
  console.log('TODO: Open light editor for:', light.name || light.type);
  
  // For now, just open the lighting panel
  setShowLightingPanel(true);
  
  // Optional: Center camera on the light
  if (light.position) {
    handleCenterCamera(light.position.x, light.position.y);
  }
};
```

---

## Step 3: Add Token Selection Handler

### If you already have token selection:

```javascript
// You probably already have this!
const handleTokenSelect = (tokenId) => {
  setSelectedTokenId(tokenId);
};
```

### If you need to add it:

```javascript
const [selectedTokenId, setSelectedTokenId] = useState(null);

/**
 * Select a token for editing
 * Called from Active tab when user clicks Edit button on token
 */
const handleTokenSelect = (tokenId) => {
  console.log('Selected token:', tokenId);
  setSelectedTokenId(tokenId);
};
```

---

## Step 4: Pass Props to TokenManager

```jsx
<TokenManager
  campaignId={campaignId}
  mapId={map?.id}
  selectedToken={selectedToken}
  onTokenCreated={handleTokenCreated}
  onTokenUpdated={handleTokenUpdated}
  onTokenDeleted={handleTokenDeleted}
  onTokenDeselect={handleTokenDeselect}
  onTokenSelect={handleTokenSelect}           // ← NEW (Step 3)
  onCenterCamera={handleCenterCamera}         // ← NEW (Step 1)
  onOpenLightEditor={handleOpenLightEditor}   // ← NEW (Step 2)
  onClose={handleCloseTokenManager}
/>
```

---

## 🎯 Testing After Integration

### Test Camera Centering:
1. Deploy several tokens to different areas of the map
2. Open Token Manager → Active tab
3. Click 🎯 Focus button on a token far from current view
4. **Expected**: Camera smoothly centers on that token
5. Repeat for lights

### Test Token Editing:
1. Open Token Manager → Active tab
2. Click ✏️ Edit button on a token
3. **Expected**: Token Manager switches to Palette tab with that token selected

### Test Light Editing:
1. Open Token Manager → Active tab
2. Click ✏️ Edit button on a light
3. **Expected**: Light editor modal opens OR lighting panel opens (depends on your implementation)

---

## 🐛 Troubleshooting

### Camera centering doesn't work:
- Check that `stageRef.current` is not null
- Verify `stageScale` is accessible in scope
- Ensure `setStagePos` updates the Konva Stage position
- Check browser console for error messages

### Light editor doesn't open:
- Verify light editor modal/panel state is wired up
- Check that `handleOpenLightEditor` is called (add console.log)
- Ensure light object has expected properties (id, position, type, etc.)

### Token selection doesn't work:
- Verify `selectedTokenId` state is connected to TokenManager's `selectedToken` prop
- Check that token is properly passed to `selectedToken` prop
- Ensure TokenPalette component receives and displays selected token

---

## 📚 Reference

### Stage Position Calculation:
```
centerX = (stageWidth / 2) - (targetX * scale)
centerY = (stageHeight / 2) - (targetY * scale)
```

This formula centers the viewport so that point (targetX, targetY) appears in the middle of the screen.

### Viewport State Management:
- `stagePos` = { x, y } in screen pixels
- `stageScale` = zoom level (1 = 100%, 0.5 = 50%, 2 = 200%)
- Stage coordinates = (screenX - stagePos.x) / stageScale

---

## ✅ Integration Complete Checklist

- [ ] Added `handleCenterCamera` function
- [ ] Added `handleOpenLightEditor` function  
- [ ] Added `handleTokenSelect` function (or verified existing)
- [ ] Passed all 3 props to TokenManager
- [ ] Tested camera centering on token
- [ ] Tested camera centering on light
- [ ] Tested token edit button
- [ ] Tested light edit button
- [ ] Verified no console errors
- [ ] Verified Active tab displays tokens/lights

---

**Once complete, you're ready for Phase 3!** 🚀

Phase 3 will make lights selectable directly on the canvas (like tokens), and Phase 4 will add auto-naming for lights.

---

*Quick Reference Guide*
*For: TOKEN_MANAGER_PHASE_1_2_COMPLETE.md*
*Date: 2025-01-10*
