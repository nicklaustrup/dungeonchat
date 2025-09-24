# Known Bugs & Open Issues

_Last updated: 2025-09-24_

## Summary
This document tracks currently observed defects and behavior gaps in the chat application that remain unresolved (deferred to later). Each entry includes a brief description, reproduction steps, expected vs actual behavior, suspected root cause(s), and proposed next actions.

---
## 1. Auto-scroll: Near-bottom incoming text does NOT snap
**Status:** Open / Reproducible
- **Repro:** Client A scrolls to within ~150px of bottom (but not fully at bottom). Client B sends a text message. Client A's view does not scroll; new message appears just below the fold.
- **Expected:** Automatic smooth (or immediate) scroll into view when within proximity window.
- **Actual:** No scroll unless user manually clicks the scroll-to-bottom button or sends a message themselves.
- **Hypotheses:**
  - Distance heuristic runs before layout settles (timing vs measurement race).
  - IntersectionObserver root mismatch or anchor not intersecting due to zero-height anchor edge case.
  - `lastDistanceRef` capturing stale value before message DOM node height applies.
- **Next Actions:**
  1. Log `scrollTop`, `clientHeight`, `scrollHeight` pre/post append.
  2. Replace proximity check with: `(scrollHeight - (scrollTop + clientHeight)) <= MAX(200px, 0.25 * clientHeight)`.
  3. Fallback: if within window, force `container.scrollTop = scrollHeight` after a `requestAnimationFrame` + `setTimeout(..., 0)` chain.

## 2. New message counter jumps after pagination
**Status:** Open / Reproducible
- **Repro:** Scroll up enough to trigger historical pagination. New older messages load; later, a real new message arrives; counter sometimes jumps to a large number (e.g. 17).
- **Expected:** Counter increments only by actual unseen appended messages.
- **Actual:** Counter includes some portion of previously loaded older batch.
- **Hypotheses:**
  - Pagination detection using only last message ID is insufficient when Firestore reorders or when previously trimmed tail changes after re-fetch.
  - `prevLenRef` updated at the wrong phase relative to reversing order.
- **Next Actions:**
  1. Track first & last IDs (pair) + maintain a sliding window of known IDs.
  2. Derive new appended IDs by set difference rather than relying solely on length delta.
  3. Ignore increases where new IDs are all already in historical (prepend) position.

## 3. Incoming image near bottom does NOT auto-scroll
**Status:** Open / Reproducible
- **Repro:** At (or just above) bottom; another client sends image. Even after it loads (up to 1s), viewport does not snap.
- **Expected:** After image element height finalizes, bottom anchor scrolled into view.
- **Actual:** Stays offset; manual scroll required.
- **Hypotheses:**
  - Load listeners only attached to images present at effect run; newly inserted image misses handler (timing of query selection).
  - Multi-pass scroll timings (120/400/900ms) insufficient for network-delayed load.
  - Observer threshold too small (0.01) thus not intersecting when anchor ends just outside viewport.
- **Next Actions:**
  1. Attach load handler directly when rendering message (via component prop) to call a provided `onMediaSettled` callback.
  2. Add ResizeObserver on container and bottom anchor to trigger re-check.
  3. Increase observer threshold array to `[0, 0.01, 0.1]` or abandon IO in favor of post-layout diff.

## 4. Reaction update permission errors (Firestore 400 / Missing or insufficient permissions)
**Status:** Open / Intermittent
- **Repro:** Non-author user clicks reaction; console shows permission error.
- **Expected:** Reaction toggles (update to `reactions` map) succeed.
- **Actual:** Security rule denies some updates.
- **Hypotheses:**
  - Rule requires `request.resource.data.keys().hasOnly(resource.data.keys())` — added keys ordering or metadata differences cause mismatch.
  - Firestore server timestamps / transforms not present in `resource` vs `request.resource` cause diff in allowable keys.
  - Reactions map removed (empty) leading to key elimination not allowed by rule.
- **Next Actions:**
  1. Relax rule: allow either unchanged key set OR key set minus `reactions` (when removing last reaction) OR key set plus `reactions` (if previously absent).
  2. Enforce structure with `allow update: if !('reactions' in resource.data) || !('reactions' in request.resource.data) || request.resource.data.reactions is map`.
  3. Add client-side retry with transaction merging latest `reactions` to reduce contention.

## 5. COOP popup warnings (Cross-Origin-Opener-Policy)
**Status:** Cosmetic / Low
- **Repro:** Auth popup open/close sequence logs warnings about `window.close` and `window.closed` blocked.
- **Impact:** No functional break; console noise.
- **Next Actions:**
  - None required. Optionally suppress by using redirect flow or ensure no post-close polling.

## 6. ARIA hidden / focus conflict (scroll-to-bottom button)
**Status:** Accessibility Issue
- **Repro:** While focus is on scroll-to-bottom button during hide animation, console logs warning about `aria-hidden` ancestor.
- **Cause:** Button likely gets an `aria-hidden` or CSS state conflicting while retaining focus.
- **Next Actions:**
  1. On hide transition start, move focus to a safe element (e.g. message container) if button is focused.
  2. Prefer `inert` attribute instead of `aria-hidden` for full interaction suppression.

## 7. Potential anchor zero-height / unreliable intersection
**Status:** Related to Issues 1 & 3
- **Repro:** Anchor `<span />` may have no height, decreasing intersection reliability.
- **Next Actions:** Add `style={{ display: 'block', height: '1px' }}` or use a sentinel div.

---
## Backlog / Proposed Fix Order
1. Stabilize new message detection (Issue 2) using ID set diff.
2. Deterministic near-bottom detection & forced snap (Issues 1 & 3).
3. Refine Firestore reaction rule (Issue 4) with flexible key-set logic.
4. Accessibility cleanup (Issue 6).
5. Minor anchor structural adjustments (Issue 7).
6. Defer popup COOP warnings (Issue 5).

## Instrumentation To Add (When Resuming)
- Structured debug logger (feature-flagged) capturing scroll metrics around message append.
- React Profiler mark or console.group around message list renders.
- Firestore rule simulator test script for reaction updates (sample before/after JSON).

## Acceptance Criteria For Closure
- Near-bottom (<=200px) always auto-scrolls within 2 animation frames of message commit.
- Paginating older content never increments new message count.
- Image messages auto-scroll within 1000ms of full load if near bottom.
- Reaction toggles succeed for non-author; invalid field changes remain blocked.
- No accessibility warnings for hidden focused elements.

---
## Notes
This file should be updated as issues are resolved or re-scoped. When a fix is applied, move the entry to a CHANGELOG or mark with a resolution date.
