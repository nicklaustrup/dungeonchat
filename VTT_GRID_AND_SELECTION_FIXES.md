# VTT Grid Snapping and Selection Visibility Fixes

## Overview
This document outlines the implementation plan for two remaining VTT issues:
1. **Player Token Selection Visibility**: Make player token selections visible to other players
2. **Grid Snap Adjustment**: Tokens and fog of war should snap/adjust when DM changes grid settings
3. **Fog Management Tool**: Add DM-only tool to manually create/remove fog of war nodes

## Current State Analysis

### Token Selection System
- **Location**: `VTTSession.jsx` manages `selectedTokenId` state
- **Propagation**: `selectedTokenId` passed to `MapCanvas` via `onTokenSelect` callback
- **Issue**: Selection state is local only, not synced to Firestore
- **Visibility**: Only the selecting user sees the token highlight

### Grid System  
- **Storage**: Map document contains `gridSize`, `gridOffsetX`, `gridOffsetY`
- **Snap Function**: `maybeSnapPoint()` in `MapCanvas.jsx` (line 248)
- **Token Positioning**: Tokens have absolute `position: {x, y}` coordinates
- **Issue**: When grid changes, existing token positions don't update

### Fog of War System
- **Storage**: `campaigns/{id}/vtt/{mapId}/fog/current`
- **Structure**: Flattened array `visibility[]`, with `gridWidth` and `gridHeight`
- **Grid-based**: Each fog cell corresponds to a grid cell
- **Issue**: Fog dimensions don't adjust when grid size changes

---

## Issue #2: Player Token Selection Visibility

### Requirements
- Player selections should be visible to ALL users (DM + players)
- Show visual indicator (colored ring/glow) around selected tokens
- Display player name/color near selected token
- Only players can see other players' selections (not DM selections)

### Implementation Strategy

#### Step 1: Create Token Selection Service
**File**: `src/services/vtt/tokenSelectionService.js`

```javascript
/**
 * Token Selection Service
 * Manages real-time token selection state for collaborative visibility
 */
export const tokenSelectionService = {
  /**
   * Update user's token selection
   * @param {Firestore} firestore
   * @param {string} campaignId
   * @param {string} mapId  
   * @param {string} userId
   * @param {string} username
   * @param {string|null} tokenId - null to clear selection
   */
  async updateSelection(firestore, campaignId, mapId, userId, username, tokenId) {
    const selectionRef = doc(firestore, 'campaigns', campaignId, 'vtt', mapId, 'selections', userId);
    
    if (tokenId === null) {
      await deleteDoc(selectionRef);
    } else {
      await setDoc(selectionRef, {
        userId,
        username,
        tokenId,
        updatedAt: serverTimestamp(),
        expiresAt: Date.now() + 30000 // 30 second TTL
      });
    }
  },

  /**
   * Subscribe to all users' token selections
   * @param {Firestore} firestore
   * @param {string} campaignId
   * @param {string} mapId
   * @param {string} currentUserId - Filter out own selection
   * @param {Function} callback - Called with array of selections
   */
  subscribeToSelections(firestore, campaignId, mapId, currentUserId, callback) {
    const selectionsRef = collection(firestore, 'campaigns', campaignId, 'vtt', mapId, 'selections');
    
    return onSnapshot(selectionsRef, (snapshot) => {
      const selections = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(sel => 
          sel.userId !== currentUserId && // Exclude own selection
          sel.expiresAt > Date.now() // Remove expired
        );
      
      callback(selections);
    });
  },

  /**
   * Clear selection on unmount/disconnect
   */
  async clearSelection(firestore, campaignId, mapId, userId) {
    const selectionRef = doc(firestore, 'campaigns', campaignId, 'vtt', mapId, 'selections', userId);
    await deleteDoc(selectionRef);
  }
};
```

#### Step 2: Add Firestore Security Rules
**File**: `firestore.rules` (add to maps subcollection around line 233)

```plaintext
// Token selections (player selections visible to all)
match /selections/{userId} {
  // All campaign members + DM can see selections
  allow read: if member or DM

  // Users can only create/update their own selection
  allow create, update: if request.auth.uid == userId && isMember
  
  // Users can delete their own selection
  allow delete: if request.auth.uid == userId
}
```

#### Step 3: Integrate into MapCanvas
**File**: `src/components/VTT/Canvas/MapCanvas.jsx`

```javascript
// Add imports
import { tokenSelectionService } from '../../../services/vtt/tokenSelectionService';

// Add state (around line 120)
const [otherUsersSelections, setOtherUsersSelections] = useState([]);

// Add subscription effect (around line 585)
useEffect(() => {
  if (!firestore || !campaignId || !gMap?.id || !user?.uid) return;

  const unsubscribe = tokenSelectionService.subscribeToSelections(
    firestore,
    campaignId,
    gMap.id,
    user.uid,
    (selections) => setOtherUsersSelections(selections)
  );

  return () => {
    unsubscribe();
    tokenSelectionService.clearSelection(firestore, campaignId, gMap.id, user.uid);
  };
}, [firestore, campaignId, gMap?.id, user?.uid]);

// Update handleTokenClick to broadcast selection (around line 895)
const handleTokenClick = useCallback((tokenId, e) => {
  // ... existing code ...
  
  if (onTokenSelect) {
    onTokenSelect(tokenId);
    
    // Broadcast selection to other users
    if (user?.uid && user?.displayName && firestore && campaignId && gMap?.id) {
      tokenSelectionService.updateSelection(
        firestore,
        campaignId,
        gMap.id,
        user.uid,
        user.displayName,
        tokenId
      ).catch(err => console.debug('Error updating selection:', err));
    }
  }
}, [activeTool, onTokenSelect, user, firestore, campaignId, gMap?.id]);

// Render selection indicators (in Tokens Layer around line 1400)
{/* Other users' token selections */}
{otherUsersSelections.map(selection => {
  const token = tokens.find(t => t.id === selection.tokenId);
  if (!token) return null;
  
  // Generate color from username
  const selectionColor = stringToColor(selection.username);
  
  return (
    <Group key={selection.userId}>
      {/* Selection ring */}
      <Circle
        x={token.position.x}
        y={token.position.y}
        radius={(token.size?.width || 50) / 2 + 5}
        stroke={selectionColor}
        strokeWidth={3}
        dash={[8, 4]}
        opacity={0.8}
        listening={false}
      />
      {/* Username label */}
      <Text
        x={token.position.x - 30}
        y={token.position.y + (token.size?.height || 50) / 2 + 10}
        text={selection.username}
        fontSize={12}
        fill={selectionColor}
        stroke="#000"
        strokeWidth={1}
        listening={false}
      />
    </Group>
  );
})}
```

#### Step 4: Helper Function for Username Colors
```javascript
// Add to MapCanvas or utils
function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, 70%, 60%)`;
}
```

---

## Issue #4: Grid Snap Adjustment + Fog Management

### Part A: Token Grid Snapping on Grid Change

#### Requirements
- When DM adjusts `gridSize`, `gridOffsetX`, or `gridOffsetY`, all tokens should snap to new grid
- Maintain relative grid position (e.g., token at grid cell [5, 3] stays at [5, 3])
- Apply to all tokens on map (staged and revealed)

#### Implementation Strategy

**File**: `src/services/vtt/tokenService.js` (add new function)

```javascript
/**
 * Snap all tokens to new grid settings
 * Maintains relative grid position
 */
async snapAllTokensToGrid(firestore, campaignId, mapId, oldGrid, newGrid) {
  const tokensRef = collection(firestore, 'campaigns', campaignId, 'vtt', mapId, 'tokens');
  const snapshot = await getDocs(tokensRef);
  
  const batch = writeBatch(firestore);
  
  snapshot.docs.forEach(doc => {
    const token = doc.data();
    
    // Calculate old grid cell position
    const oldGridX = Math.floor((token.position.x - oldGrid.offsetX) / oldGrid.size);
    const oldGridY = Math.floor((token.position.y - oldGrid.offsetY) / oldGrid.size);
    
    // Calculate new position in same grid cell
    const newX = oldGridX * newGrid.size + newGrid.offsetX + newGrid.size / 2;
    const newY = oldGridY * newGrid.size + newGrid.offsetY + newGrid.size / 2;
    
    batch.update(doc.ref, {
      position: { x: newX, y: newY }
    });
  });
  
  await batch.commit();
}
```

**File**: `src/components/VTT/Canvas/MapCanvas.jsx` (update grid configurator)

```javascript
// In GridConfigurator onUpdate callback (around line 2033)
onUpdate={async (updates) => {
  const oldGrid = {
    size: gMap.gridSize || 50,
    offsetX: gMap.gridOffsetX || 0,
    offsetY: gMap.gridOffsetY || 0
  };
  
  const newGrid = {
    size: updates.gridSize ?? oldGrid.size,
    offsetX: updates.gridOffsetX ?? oldGrid.offsetX,
    offsetY: updates.gridOffsetY ?? oldGrid.offsetY
  };
  
  // Check if grid dimensions changed
  const gridChanged = 
    oldGrid.size !== newGrid.size ||
    oldGrid.offsetX !== newGrid.offsetX ||
    oldGrid.offsetY !== newGrid.offsetY;
  
  setMapLive(m => m ? { ...m, ...updates } : m);
  
  try {
    await mapService.updateMap(firestore, campaignId, gMap.id, updates);
    
    // Snap tokens to new grid if changed
    if (gridChanged) {
      await tokenService.snapAllTokensToGrid(
        firestore,
        campaignId,
        gMap.id,
        oldGrid,
        newGrid
      );
    }
  } catch (e) {
    console.error('Failed to update grid settings', e);
  }
}}
```

### Part B: Fog of War Grid Adjustment

#### Requirements
- When grid changes, fog of war dimensions should adjust
- Preserve revealed areas as best as possible
- Re-calculate fog grid based on new `gridSize`

#### Implementation Strategy

**File**: `src/services/vtt/fogOfWarService.js` (add function)

```javascript
/**
 * Adjust fog of war grid to new dimensions
 * Attempts to preserve revealed areas
 */
async adjustFogToNewGrid(firestore, campaignId, mapId, mapWidth, mapHeight, newGridSize) {
  const fogRef = doc(firestore, 'campaigns', campaignId, 'vtt', mapId, 'fog', 'current');
  const fogSnap = await getDoc(fogRef);
  
  if (!fogSnap.exists()) return;
  
  const oldFog = fogSnap.data();
  const oldGridSize = (mapWidth / oldFog.gridWidth); // Infer old grid size
  
  // Calculate new grid dimensions
  const newGridWidth = Math.ceil(mapWidth / newGridSize);
  const newGridHeight = Math.ceil(mapHeight / newGridSize);
  
  // Create new visibility array
  const newVisibility = Array(newGridWidth * newGridHeight).fill(false);
  
  // Transfer old visibility data (best effort)
  for (let oldY = 0; oldY < oldFog.gridHeight; oldY++) {
    for (let oldX = 0; oldX < oldFog.gridWidth; oldX++) {
      const oldIndex = oldY * oldFog.gridWidth + oldX;
      
      if (oldFog.visibility[oldIndex]) {
        // Calculate world position of old cell center
        const worldX = oldX * oldGridSize + oldGridSize / 2;
        const worldY = oldY * oldGridSize + oldGridSize / 2;
        
        // Find new grid cell at same world position
        const newX = Math.floor(worldX / newGridSize);
        const newY = Math.floor(worldY / newGridSize);
        
        if (newX >= 0 && newX < newGridWidth && newY >= 0 && newY < newGridHeight) {
          const newIndex = newY * newGridWidth + newX;
          newVisibility[newIndex] = true;
        }
      }
    }
  }
  
  await setDoc(fogRef, {
    visibility: newVisibility,
    gridWidth: newGridWidth,
    gridHeight: newGridHeight,
    enabled: oldFog.enabled,
    updatedAt: new Date().toISOString()
  });
}
```

**Integration**: Call this function after grid update in GridConfigurator:

```javascript
// After snapAllTokensToGrid
if (gridChanged && fogOfWarEnabled) {
  await fogOfWarService.adjustFogToNewGrid(
    firestore,
    campaignId,
    gMap.id,
    gMap.width,
    gMap.height,
    newGrid.size
  );
}
```

### Part C: DM Fog Management Tool

#### Requirements
- DM-only tool in Map Tools section
- Click to toggle fog visibility for individual grid cells
- Brush mode: click-drag to paint fog on/off
- Undo/redo support

#### Implementation Strategy

**File**: `src/hooks/vtt/useCanvasTools.js` (add fog tool)

```javascript
// Add to tools list (around line 16)
const [activeTool, setActiveTool] = useState(defaultTool);
const [fogBrushMode, setFogBrushMode] = useState('reveal'); // 'reveal' | 'conceal'
```

**File**: `src/components/VTT/Canvas/MapCanvas.jsx` (add fog tool handlers)

```javascript
// Add state for fog editing (around line 130)
const [fogEditStart, setFogEditStart] = useState(null);
const [editingFog, setEditingFog] = useState(false);

// Handle fog tool click (in handleStageMouseDown around line 750)
if (activeTool === 'fogEdit' && isDM && map.gridEnabled && fogData?.enabled) {
  const gridX = Math.floor(mapX / map.gridSize);
  const gridY = Math.floor(mapY / map.gridSize);
  
  setFogEditStart({ gridX, gridY });
  setEditingFog(true);
  
  // Toggle fog at click point
  const newVisibility = fogData.visibility.map(row => [...row]);
  newVisibility[gridY][gridX] = !newVisibility[gridY][gridX];
  
  await fogOfWarService.updateFogOfWar(firestore, campaignId, map.id, newVisibility);
}

// Handle fog brush drag (in handleStageMouseMove around line 800)
if (activeTool === 'fogEdit' && editingFog && fogEditStart && fogData?.enabled) {
  const gridX = Math.floor(mapX / map.gridSize);
  const gridY = Math.floor(mapY / map.gridSize);
  
  // Check if moved to new grid cell
  if (gridX !== fogEditStart.gridX || gridY !== fogEditStart.gridY) {
    const newVisibility = fogData.visibility.map(row => [...row]);
    
    // Set based on brush mode
    const revealMode = fogBrushMode === 'reveal';
    newVisibility[gridY][gridX] = revealMode;
    
    await fogOfWarService.updateFogOfWar(firestore, campaignId, map.id, newVisibility);
    
    setFogEditStart({ gridX, gridY });
  }
}

// Handle fog edit end (in handleStageMouseUp around line 850)
if (activeTool === 'fogEdit' && editingFog) {
  setEditingFog(false);
  setFogEditStart(null);
}
```

**File**: Add fog tool button to MapCanvas toolbar (wherever tool buttons are rendered)

```javascript
{isDM && (
  <button
    className={`tool-button ${activeTool === 'fogEdit' ? 'active' : ''}`}
    onClick={() => setActiveTool('fogEdit')}
    title="Edit Fog of War"
  >
    🌫️
  </button>
)}
```

---

## Testing Checklist

### Token Selection Visibility
- [ ] Player A selects token → Player B sees selection ring
- [ ] Player B selects different token → Player A sees both selections
- [ ] DM selection not visible to players (or separate color)
- [ ] Selection persists across page refresh
- [ ] Selection auto-clears after 30 seconds
- [ ] Username label displays near selected token
- [ ] Each user has unique color

### Grid Snap Adjustment
- [ ] Change grid size → all tokens snap to new grid cells
- [ ] Change grid offset → all tokens adjust accordingly
- [ ] Tokens maintain relative grid position
- [ ] Staged tokens also adjust
- [ ] Works with various grid sizes (25, 50, 75, 100)

### Fog Grid Adjustment
- [ ] Change grid size → fog dimensions recalculate
- [ ] Revealed areas approximately preserved
- [ ] Fog renders correctly with new dimensions
- [ ] Player view updates correctly
- [ ] DM can still see full map

### Fog Management Tool
- [ ] DM can toggle fog cells on/off
- [ ] Click-drag paints fog
- [ ] Brush mode switches (reveal/conceal)
- [ ] Changes visible to all users in real-time
- [ ] Tool only available to DM
- [ ] Works with different grid sizes

---

## Implementation Priority

1. **HIGH**: Token Selection Visibility (#2)
   - Enhances multiplayer collaboration
   - Prevents confusion about who is controlling which token
   - Relatively isolated change

2. **MEDIUM**: Grid Snap Adjustment (#4A + #4B)
   - Important for maintaining map consistency
   - Affects all tokens and fog
   - Requires careful testing

3. **LOW**: Fog Management Tool (#4C)
   - Nice-to-have for DM control
   - Workaround exists (reinitialize fog)
   - Can be added incrementally

---

## Notes

- All changes maintain backward compatibility
- Existing maps/tokens continue to work
- Real-time sync ensures all users see updates immediately
- 30-second TTL prevents stale selections from cluttering UI
- Grid adjustment preserves game state as much as possible
