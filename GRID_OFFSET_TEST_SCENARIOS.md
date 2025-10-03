# Grid Offset Fix - Test Scenarios

## Test Scenario 1: Basic Grid Alignment
**Goal**: Verify tokens snap to the adjusted grid

### Steps:
1. Load a map with a pre-drawn grid that doesn't align with VTT grid
2. Open Grid Configurator (Grid button in toolbar)
3. Adjust Grid Offset X and Y to align VTT grid with map's grid
4. Close Grid Configurator
5. Drag a token onto the map
6. Verify token snaps to the visible grid intersections
7. Drop token and verify it stays aligned with visible grid

**Expected Result**: Token snaps to and stays aligned with the visible adjusted grid, not the original (0,0) based grid.

---

## Test Scenario 2: Fog of War Alignment
**Goal**: Verify fog cells align with adjusted grid

### Steps:
1. Continue from Scenario 1 (grid offsets configured)
2. Enable Fog of War
3. Place a player token on the map
4. Observe revealed fog cells
5. Verify fog cells align with visible grid squares
6. Move player token to different positions
7. Verify fog continues to reveal in correct grid cells

**Expected Result**: Fog cells are revealed in the grid squares where the token is positioned according to the visible grid.

---

## Test Scenario 3: Light Source Fog Reveal
**Goal**: Verify light sources reveal fog in correct cells

### Steps:
1. Continue from Scenario 2 (fog enabled, grid adjusted)
2. Place a light source on the map (Lighting Panel → Add Light)
3. Verify fog reveals around the light in correct grid cells
4. Drag the light to a new position
5. Verify fog reveals in new position's grid cells

**Expected Result**: Fog reveals around the light source in cells aligned with the visible grid.

---

## Test Scenario 4: Ruler Measurements
**Goal**: Verify ruler tool respects adjusted grid

### Steps:
1. Continue from Scenario 1 (grid adjusted)
2. Enable Snap to Grid in Map Toolbar settings
3. Select Ruler tool (Press R or click Ruler button)
4. Click to start ruler
5. Drag to end point
6. Verify ruler snaps to visible grid intersections

**Expected Result**: Ruler start and end points snap to the visible adjusted grid intersections.

---

## Test Scenario 5: Negative Offsets
**Goal**: Verify negative offsets work correctly

### Steps:
1. Open Grid Configurator
2. Set Grid Offset X to -25
3. Set Grid Offset Y to -25
4. Close Grid Configurator
5. Drag a token onto the map
6. Verify token snaps to the shifted grid

**Expected Result**: Grid appears shifted to the upper-left, and tokens snap to this shifted grid.

---

## Test Scenario 6: Large Tokens
**Goal**: Verify multi-cell tokens respect adjusted grid

### Steps:
1. Continue from Scenario 1 (grid adjusted)
2. Create a token with size = gridSize * 2 (e.g., 100px if grid is 50px)
3. Drag the token onto the map
4. Verify token's boundary aligns with visible grid squares
5. Verify token occupies correct number of grid cells

**Expected Result**: Large token's square boundary aligns with the visible adjusted grid, occupying the correct number of cells.

---

## Test Scenario 7: Different Grid Sizes
**Goal**: Verify offsets work with different grid sizes

### Steps:
1. Open Grid Configurator
2. Set Grid Size to 25px
3. Set Grid Offset X to 10
4. Set Grid Offset Y to 10
5. Test token snapping and fog alignment
6. Repeat with Grid Size = 75px and different offsets

**Expected Result**: Offsets work correctly regardless of grid size.

---

## Test Scenario 8: Player View Mode
**Goal**: Verify fog alignment in player view

### Setup:
1. As DM, configure grid offsets
2. Enable fog of war
3. Place player tokens to reveal some areas
4. Enable Player View mode

### Expected Result**: Fog rendering in player view aligns with the adjusted grid.

---

## Edge Cases to Test

### Edge Case 1: Zero Offsets
- Set offsets to 0,0
- Verify everything works as before (backward compatibility)

### Edge Case 2: Large Offsets
- Set offsets near grid size (e.g., offsetX = 45 with gridSize = 50)
- Verify grid wraps correctly

### Edge Case 3: Changing Grid Mid-Session
- Have tokens already placed
- Change grid offsets
- Verify existing tokens don't move (only future snapping uses new offsets)
- Note: Existing fog cells may need to be manually adjusted

### Edge Case 4: Alt Key Override
- Enable Token Snap
- Hold Alt while dragging token
- Verify token moves freely (no snap)
- Release Alt and continue drag
- Verify token snaps back to adjusted grid

---

## Visual Verification Tips

1. **Grid Misalignment**: Upload a map with a visible grid that's slightly offset from (0,0)
2. **High Contrast**: Use a grid color that contrasts well with the map (e.g., bright red #ff0000)
3. **Grid Opacity**: Set grid opacity high enough to clearly see alignment (0.5-0.7)
4. **Token Colors**: Use bright token colors to easily see snap positions
5. **Fog Contrast**: Use dark maps to see fog rendering clearly

---

## Automated Test Ideas (Future)

```javascript
// Test offset snap calculation
function testGridSnap(worldX, gridSize, offset) {
  const adjustedX = worldX - offset;
  const cellX = Math.floor(adjustedX / gridSize);
  const snappedX = cellX * gridSize + offset + gridSize / 2;
  return snappedX;
}

// Test cases
assert(testGridSnap(75, 50, 0) === 75); // No offset: snap to nearest cell center
assert(testGridSnap(75, 50, 25) === 75); // With offset: same result (75 is at cell 1 center)
assert(testGridSnap(50, 50, 25) === 75); // 50 snaps to cell 0 center which is at 75
assert(testGridSnap(100, 50, 25) === 125); // 100 snaps to cell 1 center which is at 125
```
