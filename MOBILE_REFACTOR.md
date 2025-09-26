# Mobile Refactor & Responsive Optimization Blueprint

_Last updated: 2025-09-26_

## 1. Executive Summary (AI Agent Optimized)
The app is already strong on desktop (clear modular CSS, dark/light theming, structured component separation). Mobile support exists only minimally (one breakpoint at 700px hiding the send button on larger screens). The current layout will work on small screens but wastes vertical space, relies on hover affordances, and risks interaction friction (small tap targets, layered popovers near edges). This plan introduces a staged, low-risk refactor emphasizing:

- Viewport-adaptive layout (safe-area, keyboard-aware input bar, reduce vertical chrome)
- Touch-first affordances (larger hit zones, no hover dependency, sticky action bar)
- Performance & battery (trim shadows, avoid unnecessary paints, emoji/menu virtualization if needed)
- Accessibility & motion preferences
- Progressive enhancement (coarse pointer & reduced-motion media queries)
- Future optional: offline-ready + PWA mobile polish

The backlog is split into: Foundation → Layout & Interaction → Performance → Accessibility → QA & Telemetry → Stretch Ideas.

## 2. Current Strengths ("Finished" Baseline Capabilities)
These are existing assets we can leverage (do NOT rework unless conflicts arise):
- Theming: Central variable system (`:root`, `.light-theme`) with semantic tokens.
- Modular CSS separation (ChatMessage.* splits, tooltips isolated, menu/reactions extracted).
- Message list structure already flex-column with `min-width:0` safeguards.
- Chat input bar refactor: grid-based “three-column” bar groundwork present.
- Tooltip system centralized for consistency.
- Reaction system & reply context already visually distinct.
- Shadow / elevation system mostly consistent (can downscale for mobile without redesigning).
- Animations use cubic-bezier easing (can offer reduced-motion fallbacks easily).
- Z-index layering model implicitly defined (menu 1200, modal 1300) — predictable.

## 3. Pain Points & Mobile Gaps
| Area | Issue | Impact |
|------|-------|--------|
| Breakpoints | Only one breakpoint (700px) used narrowly | Limited true responsiveness
| Tap Targets | Many controls sized ~32-40px but some (icons, reactions) near minimum | Risk of missed taps
| Hover Reliance | Reactions & menu appear on hover | Touch users must rely on alternate trigger (not clearly defined)
| Input Bar | Potential keyboard overlap on iOS Safari; no safe-area handling | Usability friction
| Vertical Space | Top/bottom padding + shadows increase scroll churn | Less message density on small screens
| Emoji/Menu | Fixed-position popovers may collide with viewport edges on narrow screens | Clipping / scroll trap risk
| Shadows & Blur | Heavy blur/backdrop + multi-layer shadows | Battery + repaint cost on low-end devices
| Motion | No `prefers-reduced-motion` overrides yet | Accessibility gap
| Scroll Behavior | No momentum optimizations or `content-visibility` | Potential jank on large histories
| Orientation | No adaptive changes for landscape keyboards | Suboptimal chat usable area
| Safe Areas | No `env(safe-area-inset-*)` usage | iOS notch overlap risk
| Accessibility | No explicit focus/tap outlines tuned for mobile | Discoverability & compliance risk
| Performance | Emoji picker & menu always styled; potential unnecessary DOM retention | Memory / parse cost

## 4. Recommended CSS / Structural Enhancements
### 4.1 Breakpoint & Layout Strategy
Introduce layered approach:
- Ultra-small (<360px): Stack icons above input or compress side buttons.
- Base mobile (360–599px): Single-line bar; hide non-essential icons behind a 3-dot menu.
- Phablet (600–899px): Current layout with optional second utility icon.
- Desktop (≥900px): Expanded spacing and hover affordances.

Consider container queries (future) for embedding chat in other shells.

### 4.2 Chat Input / Keyboard-Safe Behavior
Add:
```
.chat-input-area {
  padding-bottom: calc(env(safe-area-inset-bottom, 0) + 4px);
  background: var(--bg-secondary);
  position: sticky; bottom: 0; /* inside scroll container */
}
```
Add JS assist to add `.keyboard-open` class on mobile virtual keyboard show (observed via resize heuristics); reduce shadows & condense height in that mode.

### 4.3 Touch vs Hover
Use:
```
@media (hover: none) and (pointer: coarse) {
  .reaction-buttons { opacity:1; position:static; background:transparent; padding:0; border:none; }
  .reaction-btn { background: var(--bg-light); }
}
```
Or provide a single “+” button expanding reaction choices in a bottom sheet on mobile.

### 4.4 Hit Area Normalization
Ensure minimum 44x44 logical pixels. Wrap small emoji/menu triggers:
```
.bar-icon-btn { min-width:44px; min-height:44px; }
```

### 4.5 Reduced Motion
```
@media (prefers-reduced-motion: reduce) {
  * { animation-duration:0.01ms !important; animation-iteration-count:1 !important; transition:none !important; }
  .message-menu, .typing-bubble { animation:none; }
}
```

### 4.6 Scroll & Rendering Performance
- Add `content-visibility: auto; contain-intrinsic-size: 180px;` to message items for long histories (progressively enhance).
- Use `will-change` sparingly only on animated ephemeral elements (tooltip fade in) — remove after animation via JS.
- Limit backdrop-filter usage (replace with semi-opaque backgrounds on mobile).

### 4.7 Light / Dark Contrast Review
Audit contrast for light theme emoji active states & reaction chips (WCAG AA). Slightly darken border colors in light mode.

### 4.8 Shadow Scaling
Mobile preset:
```
:root.mobile { --elev-1: 0 2px 6px rgba(0,0,0,0.25); }
.message-menu { box-shadow: var(--elev-2-mobile); }
```

### 4.9 Safe Area Insets
Apply to menus & modals near edges:
```
.message-menu { margin: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left); }
```

### 4.10 Orientation Adjustments
Landscape: reduce vertical padding + shrink avatar column:
```
@media (orientation: landscape) and (max-height:480px) {
  :root { --message-left-col-width: 44px; }
  .chat-input-area { padding: 4px 6px calc(env(safe-area-inset-bottom,0) + 2px); }
}
```

### 4.11 Font & Fluid Scaling
Implement a clamp for base chat body:
```
body { font-size: clamp(14px, 3.4vw, 16px); }
```

### 4.12 Edge Popover Avoidance
Add adaptive menu reposition logic (JS) + CSS arrow variant or shift class `.menu-edge-adjust` (already using mode-up/down). Add horizontal constraint to avoid clipping.

### 4.13 Accessibility & Focus
Provide visible focus style for keyboard/touch assistive tech:
```
:focus-visible { outline:2px solid var(--primary-color); outline-offset:2px; }
```

### 4.14 Progressive Enhancement Flags
Add root classes: `.mobile`, `.coarse-pointer`, `.reduced-motion` to branch minor adjustments without huge cascade complexity.

## 5. Action Plan (Phased)
### Phase 0 – Baseline Audit (Done / Ongoing)
- [x] Identify existing breakpoints & layout constraints
- [x] Catalog hover-dependent interactions

### Phase 1 – Structural & Layout
- [x] Introduce responsive breakpoint map & variables
- [x] Make input bar sticky with safe-area padding
- [x] Refactor reaction hover → tap model on coarse pointers
- [x] Normalize icon/tap target sizes (≥44px)

### Phase 2 – Performance
- [x] Reduce mobile shadows/backdrop-filter (initial shadow scale applied)
- [x] Add `content-visibility` to message list items (root opt-in toggle via perf mode)
- [x] Defer heavy emoji picker (dynamic import / portal only when opened)
- [x] Audit & implement bundle splitting for rarely used modals (Settings & UserProfileModal lazily loaded)

### Phase 3 – Accessibility & Preferences
- [x] Add `prefers-reduced-motion` CSS overrides
- [x] Add focus-visible outlines & increased contrast adjustments (outline baseline added)
- [x] Provide alt-level semantics for reaction counts (ARIA group + live region implemented)

### Phase 4 – Interaction Polish
- [x] Adaptive popover reposition logic for narrow widths (edge detection + shift class)
- [x] Keyboard overlap mitigation (virtual keyboard heuristic + layout adjustments)
- [x] Long-press to react (touch long-press primary reaction)

### Phase 5 – QA & Telemetry
- [x] Add viewport & pointer type logging (anonymized) to prioritize real usage
- [x] Performance metrics: first interaction delay, scroll latency
 - [x] Lighthouse baseline script (added script scaffold `scripts/lighthouse-baseline.js` – integrate into CI later)
  - Groundwork: telemetry queue + log API in `ReactionBar.js` & env telemetry.

### Phase 6 – Stretch / Nice-to-Have (Active)
- [ ] Offline cache recent messages (IndexedDB draft design)
- [ ] Mini attachment tray over input bar (UX stub)
- [ ] Inline image compression for mobile uploads (canvas/web worker plan)
- [ ] Visual regression snapshots (moved from Phase 5 – implement via Playwright + story capture)
- [ ] PWA shell & basic service worker (cache static assets, fallback page)
- [ ] Adaptive battery saver mode (auto-disable heavy effects on low-end heuristics)
 - [ ] Tap-to-reveal reaction bar on mobile (implemented WIP – needs analytics & a11y review)
 - [ ] Collapsible / icon-triggered search bar on small screens (implemented WIP – refine focus trap)
 - [ ] Header vertical stacking & spacing reduction for <600px
 - [ ] Optional swipe gesture to reveal reactions (explore feasibility)
 - [ ] Message action sheet (bottom sheet modal alternative on mobile)
 - [ ] Sticky day/date divider mini headers
 - [ ] Inline skeleton shimmer for image loading on slow networks

### Phase 6 – Stretch / Nice-to-Have (Backlog Continuation)
- (See active list above; once implemented, migrate to Finished Tasks.)

## 6. Proposed File / Code Changes (Candidate List)
| File | Change Type | Summary |
|------|-------------|---------|
| `App.css` | Update | Introduce root mobile variables & reduced motion block
| `ChatInput.css` | Update | Sticky bar, safe-area, tap target sizing, coarse pointer variants
| `ChatMessage.css` | Update | content-visibility, adjusted horizontal gap on small screens
| `ChatMessage.reactions.css` | Update | Always-visible or alternative layout under coarse pointer
| `ChatMessage.menu.css` | Update | Edge margin using safe-area, reduce shadow on mobile
| New `responsive.css` | Add | Consolidate breakpoint system & future container queries
| JS utility hook | Add | `useViewportInfo` to set root classes (.mobile, .coarse-pointer...)

## 7. Risk & Mitigation
| Risk | Mitigation |
|------|------------|
| Layout shift when making bar sticky | Reserve height via `min-height` before switching mode |
| Performance regression from new selectors | Keep mobile overrides shallow (root class scoping) |
| Over-reliance on JS for detection | Provide CSS-only fallbacks using media queries |
| Accessibility regressions in reactions | Add ARIA labels & maintain focus order |

## 8. Measurement Strategy
- Use Chrome Performance panel on a mid-tier Android profile (CPU 4x throttled) to compare before/after scroll FPS.
- Track memory diff (heap snapshot) pre/post opening emoji picker.
- Lighthouse mobile score target: ≥ 90 Performance, ≥ 95 Accessibility.
- Capture CLS before/after sticky input changes.

## 9. Implementation Ordering (Granular Tasks)
1. Add root detection hook + classes.
2. Add `responsive.css` with new breakpoints & import early.
3. Adjust ChatInput for sticky + safe area.
4. Provide coarse pointer reaction fallback.
5. Add reduced motion & focus-visible.
6. Add content-visibility & measure.
7. Optimize shadows/backdrop filters.
8. Telemetry & QA harness.
9. Stretch features.

## 10. Finished Tasks (Recognized as Complete Already)
- [x] Modular CSS decomposition (menus, reactions, tooltips separated)
- [x] Theming system (dark/light variable tokens)
- [x] Grid-based message bar groundwork
- [x] Central tooltip animations
- [x] Reply context visual differentiation
- [x] Z-index layering & isolation for modals/menus
- [x] Reaction bar unification (emoji / reply / menu buttons uniform sizing)
- [x] Telemetry: environment snapshot, first interaction, scroll latency sampling
- [x] Long-press reaction & edge popover repositioning

## 11. Unfinished / To-Do Tasks (Actionable Backlog)
- [ ] Define & document standard breakpoint map
- [ ] Add `responsive.css`
- [ ] Apply sticky + safe-area padding to input
- [ ] Provide coarse pointer reaction UX
- [ ] Normalize tap target sizes
- [ ] Add reduced-motion overrides
- [ ] Add focus-visible outlines
- [ ] Optimize mobile shadows
- [ ] Introduce safe-area margins to popovers/menus
- [ ] Implement content-visibility optimization
- [ ] Add viewport detection hook
- [ ] Reposition logic for menus on narrow widths
- [ ] Keyboard overlap handling
- [x] Logging / telemetry for pointer & viewport usage
- [x] Lighthouse regression baseline script
- [ ] Adaptive landscape layout adjustments

## 12. Feature Ideas (Exploratory – Not Yet Prioritized)
- Inline swipe-to-reply gesture (left/right) on mobile
- Haptic feedback on reaction tap (via WebHaptics / vibration API fallback)
- Collapsible date dividers on scroll
- Compact mode toggle (denser message spacing)
- Attachment preview carousel for multiple images
- Quick emoji row pinned above keyboard (recently used)
- Voice message capture (long press mic button)
- Smart image compression & EXIF strip pre-upload
- Offline queue for unsent messages (retry banner)
- Battery saver mode (disables blurs & complex animations automatically)

## 13. Code Snippet Appendix (Draft Implementations)
### 13.1 Root Mobile Class Hook (React Skeleton)
```js
// src/hooks/useViewportInfo.js
import { useEffect } from 'react';
export function useViewportInfo() {
  useEffect(() => {
    const root = document.documentElement;
    function apply() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const coarse = matchMedia('(pointer: coarse)').matches;
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      root.classList.toggle('mobile', w < 600);
      root.classList.toggle('coarse-pointer', coarse);
      root.classList.toggle('short-vh', h < 540);
      root.classList.toggle('reduced-motion', reduced);
    }
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, []);
}
```

### 13.2 Responsive CSS Skeleton
```css
/* src/responsive.css */
:root { --bp-xs: 360px; --bp-sm: 600px; --bp-md: 900px; --bp-lg: 1200px; }
@media (max-width: 599px) { .message { --message-horizontal-gap: 10px; } }
@media (max-width: 359px) { .bar-icon-btn span.label { display:none; } }
html.mobile .chat-input-area { box-shadow: 0 -2px 8px rgba(0,0,0,0.3); }
html.coarse-pointer .reaction-buttons { /* fallback layout */ }
```

## 14. Maintenance Notes
- Keep mobile overrides additive; avoid rewriting desktop base.
- Use root classes to limit selector specificity creep.
- Periodically prune legacy commented code blocks after verifying parity.

## 15. Success Criteria
- FID / INP < 120ms on mid-tier mobile
- No clipped menus at <360px width
- 0 accessibility critical issues (axe-core scan)
- Reaction action reachable within 1 tap (≤ 2 taps for secondary reactions)
- CPU time for scroll < baseline after content-visibility adoption

---
Prepared by: AI Agent Mobile Optimization Pass

_This document is intended as a living artifact. Update checkboxes and append measurement data as phases complete._
