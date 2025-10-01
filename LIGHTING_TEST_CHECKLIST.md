# 🎯 Phase 1 Testing & Deployment Checklist

## Pre-Testing Setup

### 1. Verify Installation ✅
- [x] All 5 new files created
- [x] MapCanvas.jsx modified
- [x] VTTSession.jsx modified
- [x] Zero compilation errors
- [x] Documentation complete

---

## Testing Checklist

### 2. Basic Functionality Testing

#### A. Panel Access
- [ ] Open VTT session as DM
- [ ] Click 💡 Lighting button in toolbar
- [ ] Verify LightingPanel appears on right side
- [ ] Close panel with X button
- [ ] Re-open panel - should remember state

#### B. Global Lighting Controls
- [ ] Toggle lighting system ON
- [ ] Map should darken
- [ ] Adjust Time of Day slider
- [ ] Verify time emoji updates (🌅☀️🌇🌙)
- [ ] Adjust Ambient Light slider
- [ ] Map brightness should change
- [ ] Toggle lighting OFF
- [ ] Map should return to normal

#### C. Light Creation
- [ ] Click "+ Add Light"
- [ ] Modal should open
- [ ] Click "🔥 Torch" preset
- [ ] All fields populate with torch values
- [ ] Click "Create Light"
- [ ] Light appears in center of map
- [ ] Light appears in light sources list
- [ ] Create 4 more lights with different presets

#### D. Light Editing
- [ ] Click 🔧 Edit on a light
- [ ] Modal opens with current values
- [ ] Change radius
- [ ] Save - light updates on canvas
- [ ] Edit again, change color
- [ ] Save - color updates on canvas
- [ ] Edit again, toggle flicker
- [ ] Save - animation starts/stops

#### E. Light Deletion
- [ ] Click 🗑️ Delete on a light
- [ ] Light removed from canvas
- [ ] Light removed from list
- [ ] Delete all lights one by one
- [ ] List shows empty state

### 3. Advanced Testing

#### F. Multiple Lights
- [ ] Create 5-10 lights on map
- [ ] Lights should blend naturally
- [ ] No performance issues (60fps)
- [ ] All lights visible and animating

#### G. Animation Testing
- [ ] Create flickering torch
- [ ] Verify random intensity variation
- [ ] Create animated magical light
- [ ] Verify smooth pulse effect
- [ ] Create mix of both
- [ ] Both animations work simultaneously

#### H. Time of Day Testing
- [ ] Set time to 6:00 (dawn)
- [ ] Verify 🌅 icon appears
- [ ] Map should be somewhat dark
- [ ] Set time to 12:00 (noon)
- [ ] Verify ☀️ icon appears
- [ ] Map should be bright
- [ ] Set time to 18:00 (dusk)
- [ ] Verify 🌇 icon appears
- [ ] Map darkening
- [ ] Set time to 0:00 (midnight)
- [ ] Verify 🌙 icon appears
- [ ] Map very dark

#### I. Ambient Light Testing
- [ ] Set ambient to 0%
- [ ] Map completely black (except lights)
- [ ] Set ambient to 50%
- [ ] Map half-lit
- [ ] Set ambient to 100%
- [ ] Map fully bright
- [ ] Verify lights still visible at all levels

### 4. Real-time Synchronization

#### J. Multi-Player Testing
- [ ] Open session as DM in browser 1
- [ ] Open same session as Player in browser 2
- [ ] DM creates a light
- [ ] Player sees light appear instantly
- [ ] DM changes time of day
- [ ] Player sees map darken/brighten
- [ ] DM deletes light
- [ ] Player sees light disappear
- [ ] Test with 3-4 players simultaneously

### 5. Edge Cases

#### K. Error Handling
- [ ] Try to create light with invalid color
- [ ] Should reject or fix automatically
- [ ] Close modal without saving
- [ ] No light created
- [ ] Rapid slider adjustments
- [ ] No errors, smooth updates
- [ ] Delete while editing
- [ ] Modal closes gracefully

#### L. Performance Testing
- [ ] Create 15 lights with animations
- [ ] Check browser console for FPS
- [ ] Should maintain 55+ FPS
- [ ] Create 20+ lights
- [ ] Note any performance degradation
- [ ] Test on lower-end device
- [ ] Document minimum specs needed

### 6. Browser Compatibility

#### M. Cross-Browser Testing
- [ ] Test in Chrome (latest)
- [ ] Test in Firefox (latest)
- [ ] Test in Safari (latest)
- [ ] Test in Edge (latest)
- [ ] Test on mobile Chrome
- [ ] Test on mobile Safari
- [ ] Document any browser-specific issues

### 7. UI/UX Testing

#### N. Visual Quality
- [ ] Gradients render smoothly
- [ ] Animations are smooth (no jank)
- [ ] Panel styling looks professional
- [ ] Sliders are responsive
- [ ] Color picker works correctly
- [ ] Modal backdrop blurs correctly

#### O. Accessibility
- [ ] Tab through all controls
- [ ] All elements focusable
- [ ] Focus indicators visible
- [ ] Screen reader compatibility
- [ ] Reduced motion respect
- [ ] Keyboard shortcuts (if any)

---

## Deployment Checklist

### 8. Firestore Security Rules

#### P. Rules Deployment
- [ ] Review `firestore-lighting-rules.rules`
- [ ] Open Firebase Console
- [ ] Navigate to Firestore → Rules
- [ ] Add lighting rules to existing file
- [ ] Test rules in Rules Playground
- [ ] Deploy rules
- [ ] Verify DM can create lights
- [ ] Verify players can read lights
- [ ] Verify players cannot create lights

### 9. Production Deployment

#### Q. Pre-Deploy
- [ ] All tests passed
- [ ] Zero console errors
- [ ] Zero console warnings
- [ ] Documentation reviewed
- [ ] Security rules deployed
- [ ] Backup current production

#### R. Deploy
- [ ] Run `npm run build`
- [ ] Build completes without errors
- [ ] Deploy to hosting
- [ ] Verify deployment successful
- [ ] Test on production URL
- [ ] Monitor for errors

#### S. Post-Deploy
- [ ] Notify users of new feature
- [ ] Share user guide link
- [ ] Monitor for issues
- [ ] Collect initial feedback
- [ ] Document any bugs found

---

## Issue Tracking

### Found Issues

#### High Priority
- [ ] None yet! 🎉

#### Medium Priority
- [ ] None yet! 🎉

#### Low Priority
- [ ] None yet! 🎉

### Feature Requests
- [ ] Click-to-place lights (Phase 2)
- [ ] Attach lights to tokens (Phase 2)
- [ ] Token-based vision (Phase 2)

---

## Sign-Off

### Testing Complete
- [ ] All basic functionality tested
- [ ] All advanced features tested
- [ ] Multi-player sync verified
- [ ] Performance acceptable
- [ ] Cross-browser compatible
- [ ] No critical bugs found

**Tested By**: _________________  
**Date**: _________________  
**Sign**: _________________

### Deployment Complete
- [ ] Security rules deployed
- [ ] Production build successful
- [ ] Live testing complete
- [ ] Documentation shared
- [ ] Users notified

**Deployed By**: _________________  
**Date**: _________________  
**Sign**: _________________

---

## Success Criteria

✅ **All tests pass**  
✅ **Zero critical bugs**  
✅ **Performance > 55 FPS with 15 lights**  
✅ **Real-time sync < 500ms**  
✅ **Works in Chrome, Firefox, Safari, Edge**  
✅ **DMs can create/edit/delete lights**  
✅ **Players can see lights in real-time**  
✅ **Documentation is clear and complete**  

---

## Rollback Plan

### If Critical Issues Found

1. **Immediate**
   - Disable lighting button in toolbar
   - Hide LightingPanel component
   - Announce known issue to users

2. **Short Term**
   - Review error logs
   - Identify root cause
   - Create hotfix branch
   - Test fix thoroughly

3. **Revert**
   - If unfixable quickly, revert deployment
   - Remove lighting button
   - Restore previous build
   - Schedule fix for next sprint

---

## Notes

_Use this section to document any observations, issues, or improvements discovered during testing._

### Testing Notes
- 
- 
- 

### Performance Notes
- 
- 
- 

### User Feedback
- 
- 
- 

---

**Happy Testing! 🧪**

Once all checkboxes are complete, Phase 1 is **production-ready**! 🚀
