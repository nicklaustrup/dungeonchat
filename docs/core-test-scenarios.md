# Core User Flow Test Scenarios

## Extracted from Current Test Suite

_Based on analysis of 18 existing test cases across 6 files_

## Primary User Flows (Must Work)

### 1. **At Bottom → New Message**

```
GIVEN: User is at bottom (0-10px from bottom)
WHEN: New message arrives
THEN:
  - Auto-scroll to show message
  - unreadCount remains 0
  - hasNew remains false
```

### 2. **Scrolled Up → New Message**

```
GIVEN: User scrolled up >10px from bottom
WHEN: New message arrives
THEN:
  - NO auto-scroll (position maintained)
  - unreadCount increments by 1
  - hasNew becomes true
```

### 3. **Multiple Messages While Scrolled Up**

```
GIVEN: User scrolled up >10px
WHEN: Multiple messages arrive sequentially
THEN:
  - Position remains stable (no auto-scroll)
  - unreadCount increments for each message
  - hasNew stays true
```

### 4. **Return to Bottom**

```
GIVEN: User has unread messages (hasNew=true)
WHEN: User scrolls back to bottom (0-10px)
THEN:
  - unreadCount resets to 0
  - hasNew becomes false
  - Auto-scroll resumes for future messages
```

### 5. **Pagination Does Not Interfere**

```
GIVEN: User is at bottom, then loads older messages
WHEN: New message arrives after pagination
THEN:
  - Behavior same as scenario #1 (auto-scroll, no unread)
  - Pagination should not reset "was at bottom" state
```

## Edge Cases (Should Handle)

### 6. **Multiple Rapid Pagination Events**

```
GIVEN: User loads older messages multiple times in succession
WHEN: New message arrives
THEN: Read status preserved based on original bottom position
```

### 7. **Image Messages**

```
GIVEN: New message contains images
WHEN: Images load and change content height
THEN: Maintain appropriate scroll position adjustments
```

### 8. **Initial Load**

```
GIVEN: Chat loads for first time
WHEN: Messages hydrate
THEN:
  - Scroll to bottom
  - unreadCount starts at 0
  - Auto-scroll enabled
```

## Anti-Patterns (Current Issues to Fix)

### ❌ **Threshold Confusion**

Current tests have inconsistent expectations:

- Some expect read behavior at 25px from bottom
- Others expect unread at 30px from bottom
- Different thresholds in different test files

### ❌ **Test-Specific Behavior**

```javascript
// This should NOT exist in production code
el.__IS_PAGINATION_SCENARIO_TEST__ = true;
```

### ❌ **Complex State Verification**

Tests currently verify internal ref states instead of user-visible behavior

## Simplified Test Requirements

### Test Structure

```javascript
describe('User Scroll Behavior', () => {
  test('User at bottom gets auto-scroll on new message', async () => {
    // Setup: position user at bottom
    // Action: add new message
    // Assert: scrolled to show message, no unread count
  });

  test('User scrolled up gets unread button on new message', async () => {
    // Setup: position user 50px from bottom
    // Action: add new message
    // Assert: position unchanged, unread count = 1
  });
});
```

### What to Test

✅ **User-visible behavior**: scroll position, unread count, button state
✅ **Real DOM interactions**: actual scroll events, element dimensions
✅ **Integration scenarios**: pagination + new messages together

### What NOT to Test

❌ **Internal refs**: `atBottomOnLastAppendRef`, `suppressAutoRef`, etc.
❌ **Implementation details**: number of RAF calls, timeout values
❌ **Debug information**: logging, trace data

## Success Metrics for New Tests

1. **Reduced test count**: From 18 tests across 6 files to ~8 focused tests in 2 files
2. **Behavior-focused**: Test what users experience, not internal state
3. **No test-specific production code**: Zero `__IS_TEST__` type flags
4. **Cross-browser reliable**: Same expectations on all platforms
5. **Easy to understand**: Any developer can read tests and understand expected UX

## Migration Strategy

### Phase 1: Create New Test Suite

- Build `useAutoScrollV2.test.js` with simplified scenarios
- Focus on the 8 core flows above
- Use real DOM scrolling, not mocked dimensions

### Phase 2: Validate Behavior Parity

- Run both old and new implementations side-by-side
- Ensure new implementation passes behavior-focused tests
- Document any intentional behavior changes

### Phase 3: Remove Legacy Tests

- Delete all 6 old test files
- Remove test-specific code from production
- Clean up debug utilities

---

_Analysis Date: 2025-09-26_
_Next: Build useAutoScrollV2 implementation_
