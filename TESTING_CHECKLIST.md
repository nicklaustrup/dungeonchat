# 🧪 Token Manager - Bug Fix Testing Checklist

## Pre-Test Setup

- [ ] Open your VTT application
- [ ] Load a campaign with a map
- [ ] Open Developer Console (F12)
- [ ] Have DM permissions enabled
- [ ] Have at least 2-3 tokens deployed
- [ ] Have at least 1-2 lights placed

---

## ✅ Bug 1: Camera Centering

### Test Steps
1. [ ] Open Token Manager
2. [ ] Click Active tab
3. [ ] Click 🎯 Focus button on a token

**Expected Result**:
- [ ] Camera smoothly centers on the token
- [ ] Token becomes visible in center of viewport
- [ ] Console shows: "Centered camera on (x, y)"
- [ ] NO error message in console

4. [ ] Click 🎯 Focus button on a light

**Expected Result**:
- [ ] Camera smoothly centers on the light
- [ ] Light becomes visible in center of viewport
- [ ] Console shows: "Centered camera on (x, y)"

5. [ ] Click ✏️ Edit button on a light

**Expected Result**:
- [ ] Camera centers on light
- [ ] Lighting Panel opens
- [ ] Light is selected for editing

**Pass Criteria**: ✅ All 3 scenarios work without console errors

---

## ✅ Bug 2: Ghost Token Visibility

### Test Steps
1. [ ] Look at any deployed token on the map (not dragging)

**Expected Result**:
- [ ] Token shows normal appearance
- [ ] NO dashed circle visible
- [ ] NO ghost placeholder

2. [ ] Click and start dragging a token (don't release)

**Expected Result**:
- [ ] Ghost appears at starting position (dashed circle)
- [ ] Line connects ghost to current position
- [ ] Distance label shows movement

3. [ ] Release the token

**Expected Result**:
- [ ] Ghost disappears immediately
- [ ] Token stays at new position
- [ ] NO ghost remains visible

**Pass Criteria**: ✅ Ghost only visible DURING drag operation

---

## ✅ Bug 3: Light Marker Size

### Test Steps
1. [ ] Zoom to 100% (1:1 scale)
2. [ ] Look at light sources on map

**Expected Result**:
- [ ] Light markers are small and subtle (~8-10px visual size)
- [ ] NOT giant dots covering map details
- [ ] White center dot is tiny (~3px)
- [ ] Markers don't overwhelm the map

3. [ ] Click on a light marker

**Expected Result**:
- [ ] Blue dashed selection ring appears (larger, ~20px)
- [ ] Marker becomes slightly more opaque/visible
- [ ] Still not overwhelming

4. [ ] Click same light again to deselect

**Expected Result**:
- [ ] Selection ring disappears
- [ ] Marker returns to subtle appearance

**Pass Criteria**: ✅ Lights are subtle but clickable, selection is clear

---

## ✅ Bug 4: Section Header Scrolling

### Test Steps
1. [ ] Open Token Manager → Active tab
2. [ ] Deploy at least 10+ tokens to create scroll

**Expected Result**:
- [ ] "Tokens" section header visible at top
- [ ] List of tokens below header

3. [ ] Scroll down through the token list

**Expected Result**:
- [ ] "Tokens" header stays fixed at top
- [ ] Header has solid background (not transparent)
- [ ] Token items scroll behind the header
- [ ] Header text remains readable

4. [ ] Continue scrolling to "Lights" section

**Expected Result**:
- [ ] "Lights" header stays fixed when it reaches top
- [ ] Same solid background behavior
- [ ] Light items scroll behind header

**Pass Criteria**: ✅ Headers stay fixed and readable, content scrolls behind

---

## ✅ Bug 5: Token Deselection in Active Tab

### Test Steps
1. [ ] Click on a token on the map to select it

**Expected Result**:
- [ ] Token has selection indicator
- [ ] Token Manager shows token in Palette tab

2. [ ] Click Active tab

**Expected Result**:
- [ ] Token automatically deselects
- [ ] NO selection indicator on map
- [ ] Active tab shows clean, full list
- [ ] No token highlighted/selected in list

3. [ ] Select a token again
4. [ ] Click Palette tab

**Expected Result**:
- [ ] Token stays selected (correct behavior for Palette)
- [ ] Palette shows selected token's properties

**Pass Criteria**: ✅ Active tab deselects, other tabs preserve selection

---

## ✅ Bug 6: Responsive Tab Layout

### Test Steps
1. [ ] Token Manager sidebar at normal width (~420px)

**Expected Result**:
- [ ] All 3 tabs visible: "🎭 Staging (N)" "🎨 Palette" "⚡ Active"
- [ ] Full text labels showing
- [ ] No horizontal overflow

2. [ ] Drag resize handle to narrow sidebar (~380px)

**Expected Result**:
- [ ] All 3 tabs still visible
- [ ] Text may compress slightly
- [ ] No tabs cut off or hidden

3. [ ] Further narrow to ~340px

**Expected Result**:
- [ ] All 3 tabs still accessible
- [ ] May show more icon, less text
- [ ] Responsive layout kicks in
- [ ] No horizontal scroll needed

4. [ ] Return to normal width

**Expected Result**:
- [ ] Tabs return to full labels
- [ ] Smooth transition

**Pass Criteria**: ✅ All tabs visible at all practical widths

---

## ✅ Bug 7: Edit Button Behavior (Partial)

### Test Steps
1. [ ] Open Active tab
2. [ ] Click ✏️ Edit on a PC/NPC/Enemy token

**Expected Result**:
- [ ] Console shows: "TODO: Open character sheet for [name]"
- [ ] Token becomes selected
- [ ] Switches to Palette tab (fallback)

3. [ ] Click ✏️ Edit on an Object/Hazard/Marker token

**Expected Result**:
- [ ] Token becomes selected
- [ ] Switches to Palette tab
- [ ] Can edit token properties

4. [ ] Click ✏️ Edit on a light

**Expected Result**:
- [ ] Lighting Panel opens
- [ ] Light is selected for editing
- [ ] Camera centers on light (from Bug 1 fix)

**Pass Criteria**: ✅ Edit behavior appropriate for each type, TODO logged for future

---

## 🎯 Overall Testing

### Integration Test
1. [ ] Complete workflow: Create → Deploy → Focus → Edit
2. [ ] Create token in Palette
3. [ ] Reveal to map from Staging
4. [ ] Switch to Active tab (should deselect)
5. [ ] Click Focus to center camera
6. [ ] Click Edit to modify token
7. [ ] All steps work smoothly

### Performance Test
1. [ ] Deploy 20+ tokens
2. [ ] Place 5+ lights
3. [ ] Switch between tabs
4. [ ] Scroll through Active list
5. [ ] Click Focus on various items
6. [ ] Check for lag or slowness

**Expected Result**:
- [ ] Smooth performance
- [ ] No noticeable lag
- [ ] Responsive UI

### Cross-Feature Test
1. [ ] Select token → Click light → Token deselects
2. [ ] Select light → Click token → Light deselects
3. [ ] Open Lighting Panel → Light selection works
4. [ ] Camera centering from both Focus buttons
5. [ ] Ghost tokens only during drag

**Pass Criteria**: ✅ All features work together harmoniously

---

## 📊 Test Results

| Bug | Test Status | Notes |
|-----|-------------|-------|
| 1. Camera Centering | ⬜ Pass ⬜ Fail | |
| 2. Ghost Tokens | ⬜ Pass ⬜ Fail | |
| 3. Light Size | ⬜ Pass ⬜ Fail | |
| 4. Scroll Headers | ⬜ Pass ⬜ Fail | |
| 5. Token Deselection | ⬜ Pass ⬜ Fail | |
| 6. Responsive Tabs | ⬜ Pass ⬜ Fail | |
| 7. Edit Behavior | ⬜ Pass ⬜ Fail | |

**Overall Status**: ⬜ All Pass ⬜ Some Fail

---

## 🐛 If Tests Fail

### Camera Centering Not Working
- Check console for "Camera center function assigned to ref"
- Verify `cameraCenterRef` exists in VTTSession
- Check `onCenterCamera` prop is passed correctly

### Ghosts Still Visible
- Check `showGhost={false}` in MapCanvas.jsx
- Verify TokenSprite props
- Look for any overrides

### Lights Too Large
- Verify LightingLayer.jsx has `radius={8}`
- Check for any inline style overrides
- Confirm changes were saved

### Headers Not Fixed
- Check ActiveTokensTab.css
- Verify `position: sticky` and `z-index: 10`
- Ensure solid background color

### Tabs Overflow
- Check TokenManager.css responsive rules
- Verify media queries exist
- Test at various widths

---

## ✅ Success!

If all tests pass:
1. ✅ Mark this checklist complete
2. ✅ Document any edge cases found
3. ✅ Ready to proceed to Phase 4
4. ✅ Or start user acceptance testing

---

*Generated: 2025-01-10*  
*Use this checklist to verify all bug fixes*  
*Report any failures for further investigation*
