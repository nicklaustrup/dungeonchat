# Phase 2.2: Manual Testing Guide

This guide provides step-by-step instructions for manually testing the scroll behavior implementations across different scenarios and environments.

## Setup Instructions

### 1. Environment Configuration

Create or update your `.env.local` file in the project root:

```bash
# Test V1 only
REACT_APP_USE_AUTO_SCROLL_V2=false
REACT_APP_SCROLL_COMPARISON=false

# Test V2 only  
REACT_APP_USE_AUTO_SCROLL_V2=true
REACT_APP_SCROLL_COMPARISON=false

# Test both side-by-side (recommended)
REACT_APP_USE_AUTO_SCROLL_V2=true
REACT_APP_SCROLL_COMPARISON=true
```

### 2. Start Development Server

```bash
npm start
```

The app will open at `http://localhost:3000`

## Testing Scenarios

### Scenario 1: Initial Load Behavior

**Objective**: Verify that both implementations handle initial message loading consistently

**Steps**:
1. Set environment to comparison mode (`REACT_APP_SCROLL_COMPARISON=true`)
2. Start the app and navigate to a chat room
3. Check that messages load and scroll starts at bottom
4. Open browser console to view comparison logs

**Expected Results**:
- Page scrolls to bottom on initial load
- Console shows comparison data with matching `isAtBottom: true`
- No JavaScript errors in console

### Scenario 2: New Message Arrival (User at Bottom)

**Objective**: Test auto-scroll behavior when user is already at the bottom

**Steps**:
1. Ensure you're scrolled to the bottom of the chat
2. Send a new message or wait for a message from another user
3. Observe scroll behavior and console comparison logs

**Expected Results**:
- Page auto-scrolls to show new message
- Both implementations should report `isAtBottom: true` before and after
- Smooth scroll animation (not jarring jump)

### Scenario 3: New Message Arrival (User Scrolled Up)

**Objective**: Test that auto-scroll is prevented when user has scrolled up

**Steps**:
1. Scroll up in the chat (away from bottom)
2. Send a new message or wait for a message from another user  
3. Check that scroll position doesn't change
4. Look for unread message indicator

**Expected Results**:
- No auto-scroll occurs
- Unread count increases (if implemented)
- User maintains their scroll position
- Both implementations should report `isAtBottom: false`

### Scenario 4: Message History Loading

**Objective**: Test scroll behavior during infinite scroll / load more operations

**Steps**:
1. Scroll to the top of the chat to trigger "load more"
2. Wait for older messages to load
3. Observe scroll position maintenance

**Expected Results**:
- User's reading position is maintained during loading
- No unwanted scrolling to top or bottom
- Smooth loading experience

### Scenario 5: Performance Under Load

**Objective**: Test behavior with many messages and rapid updates

**Steps**:
1. Navigate to a chat with many messages (100+)
2. Rapidly send multiple messages
3. Monitor console for performance warnings
4. Check for smooth scrolling behavior

**Expected Results**:
- No noticeable lag or jank
- Consistent auto-scroll behavior
- Memory usage remains stable
- No error messages in console

## Browser and Device Testing

### Desktop Browsers

Test in each of the following browsers:

- [ ] **Chrome** (latest)
- [ ] **Firefox** (latest)  
- [ ] **Safari** (if on Mac)
- [ ] **Edge** (latest)

### Mobile Devices

Test responsive behavior on:

- [ ] **Mobile Chrome** (Android)
- [ ] **Mobile Safari** (iOS)
- [ ] **Mobile Firefox**

#### Mobile-Specific Scenarios:
- Portrait/landscape orientation changes
- Virtual keyboard appearing/disappearing
- Touch scroll behavior
- Pull-to-refresh interactions

## Cross-Environment Testing

### Development vs. Production Build

1. **Development** (`npm start`):
   - Hot reload behavior
   - Development warnings
   - Debug console logs

2. **Production** (`npm run build && npx serve -s build`):
   - Optimized bundle behavior
   - No development warnings
   - Production performance

## Comparison Mode Testing

When `REACT_APP_SCROLL_COMPARISON=true`, monitor console output:

### Expected Console Output Format:
```
🔄 Scroll Implementation Comparison: {
  implementation: 'comparison',
  original: {
    isAtBottom: true,
    newCount: 0,
    hasNew: false,
    // ... other V1 state
  },
  v2: {
    isAtBottom: true, 
    newCount: 0,
    hasNew: false,
    // ... other V2 state
  }
}
```

### Key Comparisons to Monitor:
- [ ] `isAtBottom` values match between implementations
- [ ] `newCount` calculations are consistent
- [ ] `hasNew` flags align properly
- [ ] No significant performance differences

## Issue Identification

### Red Flags to Watch For:

1. **Behavioral Differences**:
   - Different scroll positions between V1 and V2
   - Inconsistent unread counts
   - Different auto-scroll timing

2. **Performance Issues**:
   - Laggy scrolling
   - High CPU usage
   - Memory leaks over time

3. **User Experience Problems**:
   - Jarring scroll jumps
   - Lost reading position
   - Missing unread indicators

### Documentation Template:

When you find an issue, document it using this format:

```markdown
## Issue: [Brief Description]

**Browser**: [Browser Name and Version]
**Device**: [Desktop/Mobile/Tablet - OS]  
**Environment**: [V1 Only / V2 Only / Comparison Mode]
**Reproduction Steps**:
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior**: [What should happen]
**Actual Behavior**: [What actually happened]
**Console Output**: [Any relevant console messages]
**Screenshots**: [If applicable]
```

## Success Criteria

Phase 2.2 is complete when:

- [ ] All scenarios tested on at least 2 different browsers
- [ ] Mobile testing completed on at least 1 device
- [ ] No critical behavioral differences found between V1 and V2  
- [ ] Performance is acceptable across all test environments
- [ ] Comparison mode logs show consistent behavior
- [ ] Any minor differences are documented and acceptable

## Next Steps

After successful completion of manual testing:
- Proceed to Phase 2.3: Performance Analysis
- Document any implementation refinements needed
- Plan transition strategy from V1 to V2