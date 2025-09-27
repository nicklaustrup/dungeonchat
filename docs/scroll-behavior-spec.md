# Chat Scroll & Unread Message Behavior Specification

## Overview
This document defines the intended behavior for automatic scrolling and unread message counting in the chat interface.

## Core User Scenarios

### 1. **User at Bottom - New Message Arrives**
**When**: User is at or very near the bottom (within 10px) when a new message arrives
**Expected**: 
- Auto-scroll to show the new message
- No unread count increment
- No "X New Messages" button appears

### 2. **User Scrolled Up - New Message Arrives**
**When**: User has scrolled up more than 10px from bottom when new message arrives
**Expected**:
- NO auto-scroll (user stays at current position)
- Unread count increments by 1
- "X New Messages" button appears/updates

### 3. **User Returns to Bottom**
**When**: User manually scrolls back to bottom (within 10px)
**Expected**:
- Unread count resets to 0
- "X New Messages" button disappears
- Auto-scroll behavior resumes for future messages

### 4. **Pagination (Loading Older Messages)**
**When**: User scrolls to top and loads older messages
**Expected**:
- Scroll position maintained relative to previously visible messages
- Does NOT affect unread count
- Does NOT reset auto-scroll behavior
- Does NOT trigger "X New Messages" button

### 5. **Multiple Messages While Scrolled Up**
**When**: Multiple messages arrive while user is scrolled up
**Expected**:
- Unread count increments for each message
- Button text updates: "1 New Message" → "2 New Messages" → etc.
- User position remains stable

## Technical Requirements

### Single Source of Truth
- **One threshold**: 10px from bottom for all decisions
- **Clear states**: `AtBottom` | `ScrolledUp`
- **Simple logic**: If at bottom → auto-scroll, else → increment unread

### State Management
```javascript
// Simplified state model
{
  isAtBottom: boolean,        // within 10px of bottom
  unreadCount: number,        // number of unseen messages
  hasNewMessages: boolean     // unreadCount > 0
}
```

### Performance Requirements
- Scroll events debounced to max 60fps
- No unnecessary re-renders
- Efficient cleanup of event listeners

## Edge Cases & Clarifications

### Image Messages
- Same behavior as text messages
- May need additional scroll adjustments after image loads
- Auto-scroll should account for content height changes

### Very Fast Message Streams
- Batch unread count updates to avoid excessive button text changes
- Maintain scroll position stability

### Browser Variations
- Account for sub-pixel rendering differences
- Test on mobile Safari, Chrome, Firefox
- Handle different zoom levels gracefully

### Initial Load
- Always start at bottom
- No unread count on initial hydration
- Auto-scroll enabled by default

## Anti-Patterns to Avoid

❌ **Multiple overlapping thresholds** (2px, 8px, 12px, 30px, etc.)
❌ **Test-specific code paths** in production
❌ **Complex state machines** with unclear transitions  
❌ **Race conditions** between scroll events and message updates
❌ **Suppression flags** that persist unexpectedly

## Success Criteria

✅ User scrolled up never gets auto-scrolled unexpectedly
✅ Unread button appears immediately when user is >10px from bottom
✅ Button disappears immediately when user returns to bottom  
✅ Pagination never interferes with unread counting
✅ Behavior is identical across all browsers and devices
✅ Code is simple enough for any developer to understand and modify

## Open Questions

1. Should there be a maximum unread count display? (e.g., "99+ New Messages")
2. Should unread messages have different behavior for @mentions vs regular messages?
3. Should we persist unread count across page refreshes?
4. Should there be keyboard shortcuts for scroll-to-bottom?

---

*Last updated: 2025-09-26*
*Next: Create simplified implementation based on this spec*