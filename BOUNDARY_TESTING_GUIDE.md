# Boundary System - Quick Testing Guide

## 🎯 How to Test Collision Detection

### Prerequisites
- Be logged in as a DM
- Have a map loaded in VTT
- Have grid enabled (recommended)

---

## Test 1: Line Boundary Collision

### Setup
1. Click the **Boundaries** button (Shield icon) in the MapToolbar
2. Check **Enable Boundaries**
3. Check **Show Boundaries**
4. Select **Line** mode
5. Check **Snap to Grid** (recommended)

### Test Steps
1. Draw a line boundary across a wall or corridor:
   - Click at one end of the wall
   - Drag to the other end
   - Release to create the boundary
   - You should see a red dashed line

2. Place a token on one side of the boundary:
   - Select pointer tool
   - Drag a token from the token library onto the map
   - Or use an existing token

3. Try to drag the token across the boundary:
   - Click and drag the token toward the boundary line
   - Try to cross the line
   - **Expected Result**: 
     - Token flashes red for ~300ms
     - Token snaps back to starting position
     - Console logs: "Token [id] movement blocked by boundary"

4. Move token parallel to boundary:
   - Drag token along the wall (parallel to boundary)
   - **Expected Result**: 
     - Movement is allowed
     - No red flash

### Success Criteria
✅ Line boundary appears as red dashed line  
✅ Token cannot cross boundary  
✅ Token flashes red when blocked  
✅ Token snaps back to original position  
✅ Movement parallel to boundary works  

---

## Test 2: Painted Boundary Collision

### Setup
1. Open Boundaries panel
2. Select **Paint** mode
3. Set **Brush Size** to 3
4. Click **Paint** button (green)

### Test Steps
1. Paint an out-of-bounds area:
   - Click and drag on the map to paint cells
   - Paint a 5x5 area or larger
   - You should see red semi-transparent rectangles

2. Try to drag a token into the painted area:
   - Place a token outside the painted area
   - Drag it toward the painted cells
   - **Expected Result**:
     - Token flashes red
     - Token snaps back
     - Cannot enter painted area

3. Try to drag token already inside painted area:
   - Place a token inside the painted boundary
   - Try to drag it to a different painted cell
   - **Expected Result**:
     - Token is trapped (all moves blocked)

4. Erase some cells:
   - Click **Erase** button (red)
   - Drag over some painted cells
   - Cells should be removed

5. Move token through erased path:
   - Try moving token through the erased cells
   - **Expected Result**:
     - Movement allowed through erased cells
     - Still blocked by remaining painted cells

### Success Criteria
✅ Painted areas appear as red semi-transparent rectangles  
✅ Token cannot enter painted boundaries  
✅ Token flashes red when blocked  
✅ Erase mode removes cells correctly  
✅ Movement through erased cells works  

---

## Test 3: Enable/Disable Toggle

### Test Steps
1. Create some boundaries (line or painted)
2. Try to cross a boundary - should be blocked
3. Uncheck **Enable Boundaries** in panel
4. Try to cross the same boundary
   - **Expected Result**: Movement allowed (boundaries not enforced)
5. Re-check **Enable Boundaries**
6. Try to cross again
   - **Expected Result**: Movement blocked again

### Success Criteria
✅ Unchecking Enable allows crossing boundaries  
✅ Re-checking Enable enforces boundaries again  
✅ No errors in console during toggle  

---

## Test 4: Show/Hide Toggle

### Test Steps
1. Create some boundaries
2. Check **Show Boundaries** (default)
   - **Expected Result**: Boundaries visible as red lines/rectangles
3. Uncheck **Show Boundaries**
   - **Expected Result**: Boundaries disappear from canvas
4. Try to cross a boundary (while hidden)
   - **Expected Result**: Still blocked even though invisible
5. Re-check **Show Boundaries**
   - **Expected Result**: Boundaries reappear

### Success Criteria
✅ Show toggle controls visibility  
✅ Boundaries still enforced when hidden  
✅ No visual artifacts during toggle  

---

## Test 5: Multi-Token Testing

### Test Steps
1. Create a boundary
2. Place 3-4 tokens near the boundary
3. Try to drag all tokens across boundary in quick succession
   - Drag token 1 → blocked, flashes red
   - Drag token 2 → blocked, flashes red
   - Drag token 3 → blocked, flashes red
   - **Expected Result**: Each token independently flashes and snaps back

### Success Criteria
✅ Multiple tokens can be tested simultaneously  
✅ Each token gets individual collision detection  
✅ Visual feedback works independently for each token  
✅ No performance issues  

---

## Test 6: Grid Offset Testing

### Test Steps
1. Set grid offset (e.g., X: 25, Y: 25)
2. Create painted boundaries (paint mode)
3. Verify cells align with adjusted grid
4. Try to move token into painted cells
   - **Expected Result**: Collision detection still works correctly

### Success Criteria
✅ Painted boundaries align with offset grid  
✅ Collision detection accounts for offset  
✅ Token blocked correctly even with offset  

---

## Test 7: Snap-to-Grid Variations

### Test Steps
1. **With snap-to-grid ON**:
   - Create line boundary with snap enabled
   - Draw boundary - should snap to grid intersections
   - Try to cross - should be blocked

2. **With snap-to-grid OFF**:
   - Create line boundary with snap disabled
   - Draw boundary at arbitrary position
   - Try to cross - should still be blocked

3. **Token movement with snap ON**:
   - Enable token snap
   - Try to cross boundary
   - Token should snap to grid when released

4. **Token movement with snap OFF**:
   - Disable token snap
   - Try to cross boundary
   - Token should move freely (but still blocked by boundary)

### Success Criteria
✅ Boundaries work with snap enabled  
✅ Boundaries work with snap disabled  
✅ Collision detection independent of snap setting  

---

## Test 8: Player Perspective

### Test Steps
1. Log in as DM, create boundaries
2. Log in as a player (different browser/incognito)
3. Try to view boundaries
   - **Expected Result**: Boundaries invisible to player
4. Try to move a player-owned token across boundary
   - **Expected Result**: 
     - Token blocked (collision enforced)
     - Token flashes red
     - Boundaries still invisible

### Success Criteria
✅ Boundaries completely invisible to players  
✅ Collision detection still enforced for players  
✅ Visual feedback works for players  
✅ No boundary data in player's console/network  

---

## Test 9: Clear All Boundaries

### Test Steps
1. Create multiple boundaries (lines and painted)
2. Click **Clear All Boundaries** button
3. Confirm any dialog (if present)
   - **Expected Result**:
     - All boundaries removed from canvas
     - All boundaries deleted from Firestore
     - Token movement no longer blocked

### Success Criteria
✅ All boundaries removed visually  
✅ All boundaries deleted from database  
✅ Movement works normally after clear  

---

## Test 10: Persistence Testing

### Test Steps
1. Create several boundaries
2. Try to cross them - should be blocked
3. Refresh the page (F5)
4. Wait for map to load
5. Try to cross boundaries again
   - **Expected Result**: Still blocked

### Success Criteria
✅ Boundaries persist after refresh  
✅ Collision detection still works  
✅ Enable/disable state persists  

---

## 🐛 Common Issues & Solutions

### Issue: Token doesn't snap back
**Cause**: Boundaries might not be enabled  
**Solution**: Check "Enable Boundaries" in panel

### Issue: No red flash effect
**Cause**: Visual feedback state not updating  
**Solution**: Check console for errors, refresh page

### Issue: Boundaries not visible
**Cause**: "Show Boundaries" unchecked or not logged in as DM  
**Solution**: Check visibility toggle, verify DM status

### Issue: Can cross boundaries
**Cause**: Boundaries disabled or not synced from Firestore  
**Solution**: Enable boundaries, check Firestore console

### Issue: Performance lag with many boundaries
**Cause**: Too many boundaries on map  
**Solution**: Use Clear All and create fewer boundaries

---

## 📊 Expected Console Output

### Successful Collision
```
Token token_abc123 movement blocked by boundary
```

### Boundary Created
```
(from boundaryService) Boundary created with ID: boundary_xyz789
```

### Boundary State Changed
```
(from VTTSession) Boundary state updated: {enabled: true, visible: true}
```

---

## ✅ All Tests Pass?

If all tests pass, **Phase 7 is successfully implemented!**

Next steps:
- Test with real gameplay scenarios
- Gather user feedback
- Proceed to Phase 10 (Polish & UX)

---

## 🎮 Real-World Test Scenarios

### Scenario 1: Prison Cells
- Create line boundaries for prison cell bars
- Players should not be able to walk through bars
- DM can create "door open" by removing boundary

### Scenario 2: Cliff Edge
- Paint boundary along cliff edge
- Players cannot walk off cliff
- Creates natural movement restriction

### Scenario 3: Building Interior
- Create line boundaries for all walls
- Players navigate through doorways
- Cannot shortcut through walls

### Scenario 4: Hazardous Zone
- Paint boundary for lava/acid/trap area
- Players cannot enter dangerous zone
- DM can remove boundary when hazard is disabled

---

**Happy Testing!** 🎉
