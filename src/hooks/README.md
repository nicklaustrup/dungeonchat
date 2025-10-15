# Hooks

Custom React hooks for DungeonChat. These hooks encapsulate Firebase subscriptions, state management, and reusable logic.

## Categories

### Authentication & User
- `useAuth.js` - Firebase authentication state
- `useUserProfile.js` - Current user's profile data
- `usePresence.js` - Real-time user presence tracking

### Campaign & Chat
- `useCampaign.js` - Campaign data and operations
- `useCampaignMembers.js` - Campaign member list with real-time updates
- `useCampaignChatContext.js` - Chat context for campaign messages
- `useMessages.js` - Message subscription and pagination

### Scroll & Pagination
- `useAutoScrollV2.js` - ⭐ Primary scroll behavior for chat
- `useInfiniteScrollTop.js` - ⭐ Top-loading pagination for messages
- `scrollDebugUtils.js` - Debug utilities for scroll behavior

### VTT (Virtual Tabletop)
- `useVTTCanvas.js` - VTT canvas state and operations
- `useTokens.js` - Token management and real-time sync
- `useMaps.js` - Map loading and management
- `useFogOfWar.js` - Fog of war state
- `useLighting.js` - Dynamic lighting calculations

### Performance & Caching
- `useCampaignCache.js` - Cached campaign data
- `useDebounce.js` - Debounce values for performance
- `useThrottle.js` - Throttle function calls

### UI & Interaction
- `useTypingIndicator.js` - Typing indicator management
- `useReactions.js` - Message reactions
- `useDiceRoller.js` - Dice rolling logic

## Critical Hooks

### `useAutoScrollV2.js`
The primary scroll behavior hook for chat. Handles auto-scroll, scroll-to-bottom, and user scroll detection.

**Usage:**
```javascript
const { scrollContainerRef, isAtBottom, scrollToBottom } = useAutoScrollV2({
  messages,
  shouldScrollOnNewMessage: true
});
```

**Key behaviors:**
- Auto-scrolls when new messages arrive (if user is at bottom)
- Detects user scroll and disables auto-scroll
- Provides scroll-to-bottom function
- Uses intersection observer for efficiency

**Testing:** See `__tests__/useAutoScrollV2.test.js`

### `useInfiniteScrollTop.js`
Handles pagination by loading older messages when scrolling to top.

**Usage:**
```javascript
const { 
  messages, 
  loading, 
  hasMore, 
  loadMore,
  scrollContainerRef 
} = useInfiniteScrollTop({
  campaignId,
  limit: 50
});
```

**Key behaviors:**
- Loads messages in batches
- Triggers load when scrolling near top
- Maintains scroll position after load
- Prevents duplicate loads

**Testing:** See `__tests__/useInfiniteScrollTop.test.js`

### `useAuth.js`
Manages Firebase authentication state.

**Usage:**
```javascript
const { user, loading, error } = useAuth();
```

**Returns:**
- `user` - Firebase user object or null
- `loading` - True while auth state initializes
- `error` - Error object if auth fails

## Hook Patterns

### Firebase Subscription Pattern
```javascript
import { useEffect, useState } from 'react';
import { onSnapshot, collection } from 'firebase/firestore';

export function useCollection(collectionPath) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(firestore, collectionPath),
      (snapshot) => {
        setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe(); // Cleanup
  }, [collectionPath]);

  return { data, loading, error };
}
```

### Cleanup Pattern
Always cleanup subscriptions and timers:
```javascript
useEffect(() => {
  const unsubscribe = subscribeToData();
  
  return () => {
    unsubscribe();
  };
}, [dependencies]);
```

### Debounce Pattern
Use for expensive operations:
```javascript
import { useDebounce } from './useDebounce';

export function useSearch(query) {
  const debouncedQuery = useDebounce(query, 500);
  
  useEffect(() => {
    if (debouncedQuery) {
      performSearch(debouncedQuery);
    }
  }, [debouncedQuery]);
}
```

### Ref Pattern for Scroll
Use refs to avoid re-renders:
```javascript
export function useAutoScroll() {
  const scrollRef = useRef(null);
  const isAtBottomRef = useRef(true);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, []);

  return { scrollRef, scrollToBottom };
}
```

## Testing Hooks

### Unit Testing
Use React Testing Library's `renderHook`:
```javascript
import { renderHook } from '@testing-library/react';
import { useAutoScrollV2 } from '../useAutoScrollV2';

test('scrolls to bottom on new message', () => {
  const { result } = renderHook(() => useAutoScrollV2({ messages: [] }));
  // Test logic
});
```

### Mocking Firebase
Mock Firebase in tests:
```javascript
jest.mock('../services/firebase', () => ({
  firestore: mockFirestore,
  auth: mockAuth
}));
```

### Integration Testing
Test with Firebase emulators for real Firebase behavior.

## Adding a New Hook

1. Create file: `src/hooks/use<HookName>.js`
2. Follow existing patterns (cleanup, error handling)
3. Add JSDoc comments for parameters and return values
4. Create test file: `src/hooks/__tests__/use<HookName>.test.js`
5. Update this README with hook description
6. Consider if hook should be added to `src/hooks/index.js` for barrel exports

## Common Issues

### Infinite Loops
Avoid missing dependencies in useEffect:
```javascript
// ❌ Bad: missing dependency
useEffect(() => {
  doSomething(value);
}, []); // 'value' should be in dependencies

// ✅ Good
useEffect(() => {
  doSomething(value);
}, [value]);
```

### Memory Leaks
Always cleanup subscriptions:
```javascript
// ❌ Bad: no cleanup
useEffect(() => {
  onSnapshot(query, handleSnapshot);
}, []);

// ✅ Good
useEffect(() => {
  const unsubscribe = onSnapshot(query, handleSnapshot);
  return () => unsubscribe();
}, []);
```

### Stale Closures
Use refs for values that shouldn't trigger re-renders:
```javascript
// ❌ Bad: callback has stale values
const callback = useCallback(() => {
  console.log(count); // Stale
}, []);

// ✅ Good: use ref or include in deps
const countRef = useRef(count);
countRef.current = count;

const callback = useCallback(() => {
  console.log(countRef.current); // Always current
}, []);
```
