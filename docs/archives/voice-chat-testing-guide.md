# Voice Chat Manual Testing Guide - Phase 4

## Overview
Comprehensive manual testing guide for all voice chat features including basic functionality, PTT, settings, DM controls, notifications, and edge cases.

---

## Pre-Test Setup

### Requirements
- [ ] Two or more user accounts
- [ ] Multiple browsers (Chrome, Firefox, Safari)
- [ ] Mobile device for mobile testing
- [ ] Network throttling tools
- [ ] Microphone access permission

### Test Campaign Setup
1. Create a test campaign with 2+ users
2. Assign one user as DM
3. Ensure Firebase configured
4. Open console to monitor logs

---

## Quick Test Checklist

### Core Features (Must Test)
- [ ] Join/Leave voice chat
- [ ] Mute/Unmute
- [ ] Multi-user communication
- [ ] PTT mode enable/disable
- [ ] PTT transmission (spacebar)
- [ ] Voice settings modal
- [ ] DM mute/kick controls
- [ ] Join/leave notifications
- [ ] Mobile responsive layout

### Browser Compatibility (Must Test)
- [ ] Chrome/Edge ✅ (Primary)
- [ ] Firefox
- [ ] Safari Desktop
- [ ] Safari iOS
- [ ] Chrome Android

### Network Conditions (Should Test)
- [ ] Good network (>1Mbps)
- [ ] Medium network (500Kbps-1Mbps)
- [ ] Poor network (<500Kbps)
- [ ] Connection drop/recovery

---

## Detailed Test Cases

### 1. Join Voice Chat

**Test 1A: First Time Join**
```
Steps:
1. Navigate to campaign
2. Click "Voice Chat" tab
3. Click "Join Voice" button
4. Allow microphone permission

Expected:
✅ Permission prompt appears
✅ Button changes to "Leave Voice"
✅ User in participants list
✅ Join sound plays
✅ Join notification shows
✅ Green "Connected" indicator
```

**Test 1B: Rejoin After Leave**
```
Steps:
1. Join voice (as above)
2. Leave voice
3. Join again immediately

Expected:
✅ Rejoins successfully
✅ No permission prompt (already granted)
✅ State updates correctly
✅ Notifications appear
```

---

### 2. Push-to-Talk

**Test 2A: Enable PTT**
```
Steps:
1. Join voice chat
2. Click "Enable PTT"

Expected:
✅ Button → "Disable PTT"
✅ PTT indicator appears
✅ Shows "Hold SPACE to Talk"
✅ Auto-muted
✅ Saved to localStorage
```

**Test 2B: PTT Transmission**
```
Steps:
1. Enable PTT
2. Hold SPACEBAR
3. Speak
4. Release SPACEBAR

Expected:
✅ Indicator → "Transmitting"
✅ Bright green color
✅ Pulse animation
✅ Others hear during hold
✅ Muted when released
✅ Page doesn't scroll
```

**Test 2C: PTT in Text Input**
```
Steps:
1. Enable PTT
2. Click chat input
3. Type message with spaces
4. Send message

Expected:
✅ Spacebar creates spaces (not PTT)
✅ PTT inactive in input
✅ No accidental transmission
✅ Message sent correctly
```

---

### 3. Voice Settings

**Test 3A: Open/Close Modal**
```
Steps:
1. Click settings (gear) icon
2. Modal opens
3. Click overlay to close

Expected:
✅ Modal centered
✅ Dark overlay visible
✅ Current settings shown
✅ Closes on overlay click
```

**Test 3B: Change Quality**
```
Steps:
1. Open settings
2. Change quality: Low → Medium → High
3. Save settings

Expected:
✅ Dropdown updates
✅ Saved to localStorage
✅ Saved to Firestore
✅ Quality changes applied
```

**Test 3C: Toggle Features**
```
Steps:
1. Open settings
2. Toggle each feature on/off
3. Save

Expected:
✅ Smooth toggle animation
✅ Settings saved
✅ Audio processing updates
```

---

### 4. DM Controls

**Test 4A: DM Panel Visibility**
```
Setup: DM + Non-DM accounts

Test as DM:
✅ See gold "DM Controls" panel
✅ See all participants
✅ Can expand controls

Test as Non-DM:
✅ NO DM Controls visible
✅ Only see normal controls
```

**Test 4B: Force Mute**
```
Steps (as DM):
1. Expand participant
2. Click "Force Mute"

Expected:
✅ Target user muted
✅ Cannot self-unmute
✅ Mute icon shows
✅ Button → "Unmute User"
```

**Test 4C: Kick User**
```
Steps (as DM):
1. Click "Kick from Voice"
2. Confirm dialog

Expected:
✅ Confirmation appears
✅ User removed from voice
✅ Leave notification
✅ User can rejoin later
```

---

### 5. Notifications

**Test 5A: Join Notifications**
```
Setup: User A in voice, User B joins

Observer User A sees:
✅ Toast notification
✅ "[Name] joined voice chat"
✅ Green color + user-plus icon
✅ Join sound (ascending tones)
✅ Auto-dismiss after 3s
```

**Test 5B: Multiple Notifications**
```
Steps:
1. Have 3 users join quickly

Expected:
✅ Notifications stack vertically
✅ Each independently dismisses
✅ No overlap
✅ Sounds don't overlap badly
```

**Test 5C: Self Sounds**
```
Steps:
1. Join voice yourself

Expected:
✅ Hear YOUR join sound
✅ NO toast for self
✅ Hear YOUR leave sound on exit
```

---

### 6. UI/UX Testing

**Test 6A: Dashboard View**
```
Steps:
1. Open Voice Chat tab in dashboard
2. Resize window

Expected:
✅ 100% width/height
✅ Proper scrolling
✅ Responsive layout
✅ No overflow issues
```

**Test 6B: Floating Panel**
```
Steps:
1. Open floating voice panel
2. Check layout

Expected:
✅ Fixed position
✅ Width: 380px
✅ Proper padding (16px)
✅ Buttons comfortable
✅ No edge touching
```

**Test 6C: Mobile Layout**
```
Device: Phone/Tablet

Expected:
✅ Touch-friendly buttons (44px+)
✅ Readable text
✅ No overlap
✅ Buttons wrap properly
✅ Settings modal full-screen
```

---

### 7. Network Conditions

**Test 7A: Good Network**
```
Setup: No throttling

Expected:
✅ Clear audio
✅ No lag
✅ No disconnects
✅ Smooth experience
```

**Test 7B: Poor Network**
```
Setup: Chrome DevTools → Slow 3G

Expected:
✅ Connection succeeds (slower)
✅ Audio quality may reduce
✅ Some lag acceptable
✅ Stays stable
```

**Test 7C: Connection Drop**
```
Steps:
1. Join voice
2. Disconnect network
3. Wait 5s
4. Reconnect

Expected:
✅ Detects disconnect
✅ Shows "Reconnecting..."
✅ Auto-reconnects
✅ Resumes session
```

---

### 8. Edge Cases

**Test 8A: Rapid Join/Leave**
```
Steps:
1. Join → Leave → Join → Leave (5x fast)

Expected:
✅ No crashes
✅ State updates correctly
✅ No notification spam
✅ Firestore updates properly
```

**Test 8B: Multiple Tabs**
```
Steps:
1. Open campaign in 2 tabs
2. Join in Tab 1
3. Check Tab 2

Expected:
✅ Both show joined state
✅ No duplicate audio
✅ Changes sync
✅ Leave updates both
```

**Test 8C: Browser Refresh**
```
Steps:
1. Join voice
2. Change settings
3. Refresh (F5)

Expected:
✅ Must rejoin voice
✅ Settings preserved
✅ PTT preference kept
✅ No errors
```

---

### 9. Security Testing

**Test 9A: Non-Member Access**
```
Setup: User NOT in campaign

Steps:
1. Try to join voice chat

Expected:
✅ Access denied
✅ Clear error message
✅ No interface visible
```

**Test 9B: Non-DM Restrictions**
```
Setup: Non-DM user

Steps:
1. Join voice
2. Try DM controls

Expected:
✅ DM controls not visible
✅ Firestore blocks actions
✅ Error if attempted via API
```

**Test 9C: XSS Prevention**
```
Setup: Username with <script> tags

Expected:
✅ Tags stripped
✅ No script execution
✅ Plain text display
✅ No errors
```

---

### 10. Performance

**Test 10A: Load Time**
```
Check:
- Page loads < 3s
- Voice code lazy-loads
- No blocking resources
- Reasonable bundle size
```

**Test 10B: Memory**
```
Steps:
1. Join/leave 10 times
2. Monitor memory graph

Expected:
✅ Returns to baseline
✅ No continuous growth
✅ No leaked listeners
✅ Audio contexts closed
```

**Test 10C: CPU Usage**
```
Monitor:
- Idle: < 30%
- Talking: < 50%
- No spikes
- Good on low-end devices
```

---

## Bug Reporting

When finding bugs, document:

```markdown
**Title**: [Short description]
**Severity**: Critical/High/Medium/Low
**Browser**: [Chrome 120.0 / Firefox / Safari]

**Steps to Reproduce**:
1. 
2. 
3. 

**Expected**: 
**Actual**: 
**Screenshots**: [If applicable]
**Console Errors**: [Copy errors]
```

---

## Browser-Specific Notes

### Chrome/Edge ✅
- Primary development browser
- All features should work perfectly
- Best WebRTC support

### Firefox 🟡
- Good WebRTC support
- May need testing for compatibility
- Check audio quality

### Safari Desktop 🟡
- Requires user gesture for AudioContext
- Test notification sounds carefully
- Check all audio features

### Safari iOS 🟡
- AutoPlay restrictions
- Background audio limitations
- Orientation changes
- Touch interactions

### Chrome Android 🟡
- Battery considerations
- Background behavior
- Permission handling

---

## Test Results Template

```markdown
# Voice Chat Test Results

**Date**: [Date]
**Tester**: [Name]
**Build**: [Version/Commit]

## Summary
- Total Tests: X
- Passed: X
- Failed: X
- Blocked: X

## Browser Results
- Chrome: ✅ Pass
- Firefox: ✅ Pass
- Safari: 🟡 Minor issues
- Mobile: 🔴 Failed

## Critical Issues
1. [Issue description]
2. [Issue description]

## Recommendations
- [Recommendation 1]
- [Recommendation 2]
```

---

## Testing Priority

### P0 (Must Test Before Launch)
1. Join/Leave basic flow
2. Mute/Unmute
3. PTT basic function
4. Chrome/Edge compatibility
5. Security (DM controls)

### P1 (Should Test)
1. Settings modal
2. All browsers
3. Mobile responsive
4. Network conditions
5. Notifications

### P2 (Nice to Test)
1. Edge cases
2. Performance metrics
3. Accessibility
4. Long sessions
5. Maximum participants

---

**Total Test Cases: 45+**

*Good luck testing! 🧪*
