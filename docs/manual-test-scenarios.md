# Manual Test Scenarios for A/B Validation

## Setup Instructions

### 1. Environment Configuration
```bash
# Test V1 (Original)
echo "REACT_APP_USE_AUTO_SCROLL_V2=false" > .env.local
echo "REACT_APP_SCROLL_COMPARISON=true" >> .env.local

# Test V2 (New)
echo "REACT_APP_USE_AUTO_SCROLL_V2=true" > .env.local  
echo "REACT_APP_SCROLL_COMPARISON=true" >> .env.local
```

### 2. Start the Application
```bash
npm start
```

### 3. Open Browser Console
- Press F12 to open DevTools
- Go to Console tab  
- Look for "🔄 Scroll Implementation Comparison" logs

---

## Test Scenarios

### 📍 **Scenario 1: User at Bottom - New Message**
**Expected Behavior**: Auto-scroll, no unread count

1. Navigate to chat
2. Ensure you're scrolled to the very bottom
3. Send a new message (or simulate message arrival)
4. **Verify**: 
   - ✅ Page auto-scrolls to show new message
   - ✅ No "X New Messages" button appears
   - ✅ `isAtBottom` stays `true` in console logs

### 📍 **Scenario 2: User Scrolled Up - New Message**  
**Expected Behavior**: No auto-scroll, unread count increments

1. Navigate to chat
2. Scroll up about 100-200px (past a few messages)
3. Send a new message
4. **Verify**:
   - ✅ Page does NOT auto-scroll  
   - ✅ "1 New Message" button appears
   - ✅ `isAtBottom` becomes `false`, `newCount` becomes `1`

### 📍 **Scenario 3: Multiple Messages While Scrolled Up**
**Expected Behavior**: Count accumulates, no auto-scroll

1. Navigate to chat  
2. Scroll up 100-200px
3. Send 3 messages in quick succession
4. **Verify**:
   - ✅ No auto-scroll occurs
   - ✅ Button shows "3 New Messages" 
   - ✅ `newCount` increments: 1 → 2 → 3

### 📍 **Scenario 4: Return to Bottom**
**Expected Behavior**: Clear unread count, resume auto-scroll

1. Start with unread messages (from Scenario 3)
2. Click "3 New Messages" button OR manually scroll to bottom
3. Send another new message
4. **Verify**:
   - ✅ Unread button disappears immediately on reaching bottom
   - ✅ New message triggers auto-scroll (back to Scenario 1 behavior)
   - ✅ `newCount` resets to 0, `isAtBottom` becomes `true`

### 📍 **Scenario 5: Pagination (Load Older Messages)**
**Expected Behavior**: No interference with unread logic

1. Navigate to chat, scroll to bottom
2. Scroll to top to load older messages
3. Scroll back to bottom
4. Send a new message  
5. **Verify**:
   - ✅ Loading older messages doesn't create unread count
   - ✅ Behavior matches Scenario 1 (auto-scroll)
   - ✅ Scroll position maintained during pagination

### 📍 **Scenario 6: Mixed Pagination + New Messages**
**Expected Behavior**: Complex interaction handled correctly

1. Navigate to chat, at bottom
2. Scroll up, load older messages
3. Send new message while still scrolled up
4. **Verify**:
   - ✅ New message creates unread count (not auto-scroll)
   - ✅ Pagination doesn't interfere with unread logic

---

## Browser Testing Matrix

Test all scenarios on:

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)  
- [ ] Safari (if on Mac)
- [ ] Edge (latest)

### Mobile Browsers  
- [ ] Chrome Mobile
- [ ] Safari Mobile
- [ ] Firefox Mobile

### Different Screen Sizes
- [ ] Mobile portrait (320px-480px)
- [ ] Mobile landscape (480px-768px)  
- [ ] Tablet (768px-1024px)
- [ ] Desktop (1024px+)

---

## Comparison Analysis

### What to Look For in Console

When `REACT_APP_SCROLL_COMPARISON=true`, look for logs like:
```
🔄 Scroll Implementation Comparison: {
  implementation: "V2 (Active)",
  original: { isAtBottom: false, newCount: 2, hasNew: true },
  v2: { isAtBottom: false, newCount: 2, hasNew: true },
  messagesCount: 25,
  timestamp: "2025-09-26T..."
}
```

### Red Flags 🚨
- **Divergent behavior**: V1 and V2 showing different `isAtBottom` values
- **Count mismatches**: Different `newCount` between implementations
- **Timing issues**: Logs appearing too frequently (performance problems)
- **Error messages**: Console errors from either implementation

### Expected Differences ✅
- **V1 threshold vs V2 threshold**: V1 uses 60px, V2 uses 10px
- **Internal debug data**: V1 has `__debug` object, V2 doesn't
- **Performance**: V2 should have fewer console logs (simpler logic)

---

## Success Criteria

### Phase 2.1 Complete When:
- [ ] All 6 scenarios work identically in both V1 and V2
- [ ] No console errors in either implementation  
- [ ] Performance is equal or better in V2
- [ ] Behavior is consistent across all browsers/devices
- [ ] Feature flag switching works reliably

### Known Acceptable Differences:
1. **Threshold sensitivity**: V2 (10px) vs V1 (variable thresholds)
2. **State complexity**: V2 has simpler internal state
3. **Debug information**: V1 provides more detailed debug data

---

## Troubleshooting

### Environment Not Working?
```bash
# Clear React cache and restart
rm -rf node_modules/.cache
npm start
```

### No Console Logs?
- Check `REACT_APP_SCROLL_COMPARISON=true` in .env.local
- Ensure you're in development mode (`npm start`, not build)
- Check browser console is showing all log levels

### Implementations Behaving Differently?
- This is expected during validation!
- Document the differences in Phase 2 report
- We'll use these findings to refine V2 if needed

---

*Test Date: 2025-09-26*  
*Phase 2.1: A/B Integration & Validation*