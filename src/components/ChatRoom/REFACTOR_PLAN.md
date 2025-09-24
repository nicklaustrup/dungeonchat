# ChatRoom Refactor Plan

_Last updated: 2025-09-24_

## Goals
- Reduce `ChatRoom.js` size & cognitive load
- Separate concerns: data, UI, side-effects, interactions
- Improve testability & reusability via custom hooks/components
- Prepare for performance enhancements (virtualization, pagination)
- Remove duplicated state & race conditions

---
## Concern Breakdown & Targets
| Concern | Current State | Refactor Target |
|---------|---------------|-----------------|
| Firestore messages query, sorting, pagination | Inline in component with `messageLimit` state & scroll handler | `useChatMessages` hook handling query, limit batching, sorting |
| Search filtering | Inline `useMemo` | `useMessageSearch` hook |
| Scroll position, auto-scroll, new message tracking | Multiple effects (`lastMessageCount`, `hasNewMessages`, `newMessagesCount`, `isAtBottom`) | `useAutoScroll` hook consolidating logic |
| Typing users (Realtime DB) | Effect inline | `useTypingUsers` hook |
| Drag & drop (image detection & global listeners) | Handlers + effect inline | `useDragAndDropImages` hook returning `bind` props |
| Reply selection & sanitization | Inline handler `handleReply` | `useReplyState` hook |
| Presentation (message list, typing indicator, overlays) | Mixed with logic | Extract pure components |

---
## Proposed Hooks
### 1. `useChatMessages({ firestore, limitBatchSize = 25, maxLimit = 100 })`
**Responsibility:** Compose Firestore query, manage incremental loading, return normalized messages.
**Returns:** `{ messages, loadMore, hasMore, isInitialLoading }`

### 2. `useMessageSearch(messages, searchTerm)`
**Responsibility:** Case-insensitive text filtering (pass-through on images or no term).
**Returns:** `filteredMessages`

### 3. `useAutoScroll({ containerRef, anchorRef, items, bottomThreshold = 50 })`
**Responsibility:** Scroll listener, initial scroll, new message counting when user scrolled up.
**Returns:** `{ isAtBottom, hasNew, newCount, scrollToBottom }`

### 4. `useTypingUsers({ rtdb, currentUid })`
**Responsibility:** Subscribe to `/typing`, exclude current user.
**Returns:** `typingUsers` array

### 5. `useDragAndDropImages({ onImage })`
**Responsibility:** Track drag state, detect images (MIME + extension fallback), global leave/drop reset.
**Returns:** `{ isDragActive, imageReady, bind }`

### 6. `useReplyState(getDisplayName)`
**Responsibility:** Manage `replyingTo` object, sanitize fields, derive type.
**Returns:** `{ replyingTo, setReplyTarget, clearReply }`

(Optional future) `useInfiniteScrollTop`, `useVirtualizedMessages`, `useNewMessageSound`.

---
## Proposed Components
| Component | Purpose | Props |
|-----------|---------|-------|
| `MessageList` | Render list + highlight search + empty state | `messages, searchTerm, replyingToId, onReply, onViewProfile` |
| `TypingIndicator` | Show animated typing dots | `users` |
| `ScrollToBottomButton` | Sticky scroll-to-bottom / new messages indicator | `visible, hasNew, newCount, onClick` |
| `DragOverlay` | Fullscreen overlay during drag | `active, ready` |
| `ReplyPreview` (optional) | Show reply context above input | `message, onCancel` |
| `LoadOlderTrigger` (optional) | IntersectionObserver sentinel | `onVisible, loading` |

---
## Example Hook Sketches
### Drag & Drop
```js
function useDragAndDropImages({ onImage }) {
  const [isDragActive, setActive] = React.useState(false);
  const [imageReady, setReady] = React.useState(false);
  const counterRef = React.useRef(0);

  const detectImages = React.useCallback(dt => {
    if (!dt?.items) return false;
    return Array.from(dt.items).some(item => {
      if (item.kind !== 'file') return false;
      if (item.type?.startsWith('image/')) return true;
      const file = item.getAsFile?.();
      return file && /\.(png|jpe?g|gif|webp|bmp|svg|heic|heif|avif)$/i.test(file.name);
    });
  }, []);

  React.useEffect(() => {
    const handleWindowLeave = e => {
      if (!e.relatedTarget || e.clientX <= 0 || e.clientY <= 0) {
        counterRef.current = 0; setActive(false); setReady(false);
      }
    };
    const reset = () => { counterRef.current = 0; setActive(false); setReady(false); };
    window.addEventListener('dragleave', handleWindowLeave);
    window.addEventListener('drop', reset);
    return () => {
      window.removeEventListener('dragleave', handleWindowLeave);
      window.removeEventListener('drop', reset);
    };
  }, []);

  const bind = {
    onDragEnter(e) { e.preventDefault(); counterRef.current++; if (!isDragActive) setActive(true); setReady(detectImages(e.dataTransfer)); },
    onDragOver(e) { e.preventDefault(); if (!isDragActive) setActive(true); const r = detectImages(e.dataTransfer); if (r !== imageReady) setReady(r); },
    onDragLeave(e) { e.preventDefault(); counterRef.current--; if (counterRef.current <= 0) { setActive(false); setReady(false); } },
    onDrop(e) { e.preventDefault(); const file = e.dataTransfer.files?.[0]; if (file?.type.startsWith('image/') && onImage) onImage(file); counterRef.current = 0; setActive(false); setReady(false); }
  };

  return { isDragActive, imageReady, bind };
}
```

### Auto Scroll
```js
function useAutoScroll({ containerRef, anchorRef, items, bottomThreshold = 50 }) {
  const [isAtBottom, setAtBottom] = React.useState(true);
  const [newCount, setNewCount] = React.useState(0);
  const prevLenRef = React.useRef(0);
  const initialRef = React.useRef(true);

  const scrollToBottom = React.useCallback((behavior = 'smooth') => {
    anchorRef.current?.scrollIntoView({ behavior, block: 'end' });
  }, []);

  React.useEffect(() => {
    const el = containerRef.current; if (!el) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const dist = scrollHeight - (scrollTop + clientHeight);
      const atBottom = dist < bottomThreshold;
      setAtBottom(atBottom);
      if (atBottom) setNewCount(0);
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [bottomThreshold]);

  React.useEffect(() => {
    if (!items.length) return;
    if (initialRef.current) {
      scrollToBottom('auto');
      initialRef.current = false;
    } else if (items.length > prevLenRef.current) {
      const diff = items.length - prevLenRef.current;
      if (isAtBottom) scrollToBottom('smooth');
      else setNewCount(c => c + diff);
    }
    prevLenRef.current = items.length;
  }, [items, isAtBottom, scrollToBottom]);

  return { isAtBottom, hasNew: newCount > 0, newCount, scrollToBottom };
}
```

---
## Incremental Migration Steps
1. Create hooks folder & add `useDragAndDropImages` (low risk) → replace inline handlers.
2. Extract presentational components (`TypingIndicator`, `ScrollToBottomButton`, `DragOverlay`).
3. Implement `useTypingUsers` & remove inline effect.
4. Implement `useReplyState`; replace `handleReply` + inline sanitation.
5. Implement `useChatMessages` (carry over limit logic); remove `messageLimit` & Firestore logic from component.
6. Implement `useAutoScroll`; remove multiple scroll/new-message effects & related state.
7. Implement `useMessageSearch` to isolate filtering.
8. Replace top-load-on-scroll with IntersectionObserver sentinel (`useInfiniteScrollTop`).
9. (Optional) Introduce virtualization if message count large.
10. Cleanup: remove obsolete refs (`dragCounter`, etc. now internal), pruning logs.

---
## State Changes Matrix (Before → After)
| Old State | New Source |
|-----------|------------|
| `messageLimit` | Inside `useChatMessages` |
| `lastMessageCount` | Internal ref inside `useAutoScroll` |
| `hasNewMessages` | Derived `hasNew` from `useAutoScroll` |
| `newMessagesCount` | `newCount` from `useAutoScroll` |
| `isAtBottom` | From `useAutoScroll` |
| `typingUsers` | From `useTypingUsers` |
| `replyingTo` | From `useReplyState` |
| `isDragActive`, `imageDragReady` | From `useDragAndDropImages` |

---
## Performance & Future Enhancements
- Virtualize with `react-virtuoso` or `react-window` once baseline refactor done.
- Add `useInfiniteScrollTop` for cleaner pagination trigger (IntersectionObserver).
- Optionally batch Firestore reads or switch to server-side pagination.
- Add accessibility (aria-live region for new messages, button labels).

---
## Potential Bugs Addressed
| Issue | Resolution |
|-------|------------|
| Duplicate effects updating message counters | Single hook manages lifecycle |
| Rapid messageLimit increments near top | Debounce / sentinel approach in `useInfiniteScrollTop` |
| Fallback key using array index | Enforce `id` presence upstream; filter invalid docs |
| Drag leave false positives | Hook can refine window leave heuristics |

---
## Done Definition for Refactor
- `ChatRoom.js` under 120 lines (logic orchestration only)
- All listed hooks implemented & unit-testable (where practical)
- No duplicate state representing the same concept
- Clear separation: hooks (logic), components (render), context (Firebase)
- Zero console noise in production mode

---
## Open Questions (To Validate During Implementation)
- Max historical messages to load? (Currently capped at 100). Should this be configurable?
- Need message grouping (by day/user) before virtualization? If yes, possibly a `useGroupedMessages` hook.
- Should reply target survive route changes / be stored in URL hash?

---
## Next Immediate Step
Implement Step 1: add `useDragAndDropImages` hook & replace inline drag handlers.

---
## Tracking Checklist
- [x] Hook: `useDragAndDropImages` – extracted drag logic, removed inline handlers/states from `ChatRoom.js`.
- [x] Components: TypingIndicator / ScrollToBottomButton / DragOverlay
- [x] Hook: `useTypingUsers`
- [x] Hook: `useReplyState`
- [x] Hook: `useChatMessages`
- [x] Hook: `useAutoScroll`
- [x] Hook: `useMessageSearch`
- [x] Infinite scroll sentinel
- [x] Cleanup obsolete code & logs
- [ ] Consider virtualization

---
Feel free to append notes or decisions below:

> Notes:
> - Step 1 complete: extracted drag & drop into `useDragAndDropImages`, added wrapper for proper border scoping & disabled scrolling during drag.
> - Step 2 complete: extracted TypingIndicator, ScrollToBottomButton, DragOverlay into separate memoized components reducing ChatRoom UI clutter.
> - Step 3 complete: implemented `useTypingUsers` hook and removed inline Realtime DB typing effect/state.
> - Step 4 complete: added `useReplyState` hook; removed inline reply sanitation logic in `ChatRoom.js`.
> - Step 5 complete: implemented `useChatMessages`; removed inline Firestore query, limit state & manual reversing.
> - Step 6 complete: implemented `useAutoScroll`; removed multiple scroll/new message effects & consolidated into hook, simplified `ChatRoom` scroll logic to only handle top pagination trigger.
> - Infinite scroll sentinel: added `useInfiniteScrollTop` with IntersectionObserver replacing scrollTop polling; top loader sentinel inserted above message list.
> - Step 7 complete: implemented `useMessageSearch`; removed inline filtering `useMemo` from `ChatRoom.js`.
> - Initial cleanup begun: removed unused `initialLoadRef` and added sentinel styling.
> - MessageList extracted: moved message rendering, typing indicator, empty state, and sentinel into `MessageList` component; `ChatRoom` now focuses on orchestration. Cleaned unused imports.
> - Cleanup pass: stripped legacy comments, removed unused imports, centralized message rendering. Added `sr-only` utility.
> - Accessibility: added roles (log, article, dialog), aria-live regions for new messages, keyboard handlers for reactions & profile/image actions, improved alt text & aria labels.
> - Performance quick wins: introduced `getAvatarURL` helper with in-memory cache; added lazy/async decoding for avatars & shared images to reduce initial network and rendering cost.
