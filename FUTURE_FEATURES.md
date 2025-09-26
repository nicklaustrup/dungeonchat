# Future Features & AI Implementation Backlog

This file is optimized for future AI Agents & contributors. Each feature spec is intentionally concise and **action oriented** (what to build, where to build it, how to validate). Implemented items have been removed from the backlog (e.g. reactions, dark mode toggle, basic pagination, typing indicator, basic presence, image messages, reply threading-lite, accessibility baseline improvements).

## Table of Contents
1. [Core Messaging](#core-messaging)
2. [User Identity & Social Graph](#user-identity--social-graph)
3. [Private & Structured Conversations](#private--structured-conversations)
4. [Engagement & Personalization](#engagement--personalization)
5. [Mobile & Responsive Enhancements](#mobile--responsive-enhancements)
6. [Reliability, Offline & Performance](#reliability-offline--performance)
7. [Security, Safety & Compliance](#security-safety--compliance)
8. [Discovery & Growth](#discovery--growth)
9. [Observability & Analytics](#observability--analytics)
10. [Developer Experience](#developer-experience)
11. [Data Modeling Patterns](#data-modeling-patterns)
12. [Security Rule Templates](#security-rule-templates)
13. [Push & PWA Strategy](#push--pwa-strategy)
14. [Testing Strategy](#testing-strategy)
15. [Performance Watchpoints](#performance-watchpoints)
16. [Phased Roadmap Snapshot](#phased-roadmap-snapshot)

---

## Spec Template (Use For New Features)
```
Title: <Feature Name>
Goal: <1 sentence problem statement>
Data Model: <Collections / docs / indexes>
Client Changes: <Components / hooks to add or extend>
Security Rules: <Rule summary + invariants>
Acceptance Criteria:
	- [ ] <Measurable outcome 1>
	- [ ] <Outcome 2>
Telemetry: <Events / metrics to log>
Risks & Mitigations: <short list>
```

---

## Core Messaging
| Feature | Summary | Notes / Modeling Hints |
|---------|---------|------------------------|
| Message Edit (with audit) | Allow author edits within 15m; show `edited` badge | Keep original text in subcollection `revisions` (optional) |
| Soft Delete | Author can mark message deleted; retain for moderation | `deleted: true` + keep text for moderators (rules restrict non-mod reviewers) |
| Read Receipts (Room) | Per-user last read timestamp | Store in `/rooms/{roomId}/members/{uid}.lastReadAt` |
| Read Receipts (Per-Message Count) | Show small read avatars for small rooms (<10) | Derive lazily; avoid hot writes per receipt—client aggregate pass |
| Pinned Messages | Room-level curated list | `/rooms/{roomId}.pinnedMessageIds` (array) or subcollection for ordering |
| Starred (User Personal) | User bookmarks across rooms | `/users/{uid}/starred/{messageId}` mirror snapshot |
| Rich Formatting (Markdown Subset) | Bold / italics / inline code / links | Sanitize with DOMPurify; store original + rendered html cache (optional) |
| File Attachments | Non-image docs (PDF, txt) | Metadata doc + Storage path; restrict size & type |
| Voice Notes | Short audio clips | Capture, compress (Opus), upload; waveform precomputed client-side |
| Scheduled / Delayed Send | User sets future time | Cloud Function scheduled via Firestore trigger & a queue collection |
| Bulk Import (Admin) | Seed historical messages | Batch write / backfill script + rate limiting |

---

## User Identity & Social Graph
| Feature | Summary | Data Model |
|---------|---------|-----------|
| User Profiles | Avatar, bio, status message, time zone | `/users/{uid}` extends current doc (displayName, photoURL, bio, tz, statusMsg) |
| Username Handle Reservation | Unique `@handle` for mentions | Enforce uniqueness via lowercased `handles/{handle}` doc referencing uid |
| Friend Requests | Directed request accept/deny flow | `/friendRequests/{requestId}` with from, to, status; derived friend list collection |
| Friends List / Roster | List accepted friends; presence overlay | `/users/{uid}/friends/{friendUid}` doc storing since + lastInteractedAt |
| Blocking / Muting | Prevent DM + hide messages | `/users/{uid}/blocks/{blockedUid}`; rule denies reads of blocked user messages (optional client filter) |
| Profile Privacy Levels | Public / Friends / Private | Field on user doc; queries filter by allowed scope |

---

## Private & Structured Conversations
| Feature | Summary | Modeling |
|---------|---------|---------|
| Direct Messages (DM) | 1:1 channel separate from public rooms | Deterministic roomId = hash(sorted uids) in `rooms` collection with `type: 'dm'` |
| Group DMs | Ad-hoc small groups (<=15) | `rooms.type = 'group'`, membership array or subcollection `/rooms/{id}/members` |
| Mentions & Notifications | `@handle` parsing; highlight & notify | Store mention references `/mentions/{id}` with messageId + targetUid |
| Threaded Replies (Full) | Expand partial reply model to full thread view | Parent message `replyCount` + query by `parentId` index |
| Message Permalinks | Deep link to a message & scroll into view | Route param `?mid=` triggers fetch + scroll anchor |
| Channel Topics / Descriptions | Contextual info at header | `rooms.topic` + `updatedAt` |
| Room Roles & Permissions | Owner / moderator roles | Role map in `/rooms/{roomId}.roles[uid] = 'mod'` |

---

## Engagement & Personalization
| Feature | Summary | Notes |
|---------|---------|-------|
| Draft Persistence | Per-room unsent text | localStorage key `draft:<roomId>` -> sync later |
| Theming Persistence | Remember theme + system auto | Save `theme` in localStorage + honor `prefers-color-scheme` |
| Notification Preferences | Per-sound volume + mute sets | `/users/{uid}/preferences` doc |
| Smart Reply Suggestions | ML lightweight suggestions (optional) | Local simple n-gram / API stub—opt-in |
| Custom Emoji / Packs | Upload & curate | Storage path `emoji/{uid}/...`; metadata collection for indexing |
| Presence Detail Panel | Show current users in room (live) | Combine RTDB presence & Firestore membership |
| Activity Badges | New / active rooms indicator | Cache unread counts + highlight in room list |

---

## Mobile & Responsive Enhancements
Migrated outstanding tasks from former `MOBILE_REFACTOR.md` (file removed after migration).

| Task | Description | Notes |
|------|------------|-------|
| Offline cache recent messages | IndexedDB cache hydrate on load | Use room scoped store; limit N messages |
| Mini attachment tray | Quick access (camera, file, emoji) | Collapsible panel above input |
| Inline image compression (mobile) | Reduce upload size | Canvas or Web Worker (quality target) |
| Visual regression snapshots | Playwright or Storybook capture | Integrate in CI gating |
| PWA shell & basic service worker | Offline shell + static asset caching | Workbox generateSW + runtime caching images |
| Adaptive battery saver mode | Disable heavy effects heuristically | Detect low-end via FPS / memory sniff |
| Tap-to-reveal reaction bar (mobile) | Reduce clutter; explicit affordance | Analytics: open rate, dwell |
| Collapsible / icon-triggered search bar | Space saving on small widths | Auto-focus expansion animation |
| Header vertical spacing reduction | Condense <600px | Adjust CSS vars |
| Optional swipe gesture for reactions | Horizontal swipe on message | Prototype; ensure a11y fallback |
| Message action sheet | Bottom sheet alternative to context menu | Portal + focus trap |
| Sticky day/date dividers | Keep context during scroll | IntersectionObserver + position: sticky |
| Inline skeleton shimmer for images | Better perceived perf | Prefers-reduced-motion respected |
| Breakpoint map formalization | Centralized responsive tokens | `responsive.css` + exported constants |
| Safe-area sticky input finalized | Ensure keyboard & notch safe | iOS 15+ env vars |
| Coarse pointer reaction UX | Non-hover fallback fully shipped | Toggle presence & analytics |
| Normalize tap target sizes | 44px min across interactives | Audit test |
| Reduced-motion overrides | Provide complete coverage | Verify no large motion left |
| Focus-visible outlines | Consistent accessibility baseline | Check high contrast mode |
| Optimized mobile shadows | Lighter elevation tokens | Perf measure before/after |

---

## Reliability, Offline & Performance
| Feature | Summary | Notes |
|---------|---------|-------|
| Optimistic Offline Queue | Queue & replay sends | Leverage Firestore persistence & custom retry journal |
| Virtualized Message List | Large history performance | Use `react-virtuoso` or `react-window` abstraction wrapper hook |
| Local Image Lazy Transform | Downscale before upload | Worker off main thread |
| Rate Limiting (Client Hint) | Prevent accidental spam | Client debouncing + UI warnings |
| Intelligent Listener Detach | Pause listeners when tab hidden | Page visibility + focus events |
| Session Resume Fast Path | Rehydrate from IndexedDB before network | Boot metric improvement |
| Performance Budget Alerts | Failing Lighthouse threshold triggers CI warning | GitHub Action annotation |

---

## Security, Safety & Compliance
| Feature | Summary | Notes |
|---------|---------|-------|
| Refined Firestore Rules | Enforce immutability & constraints | See templates below |
| Abuse / Profanity Filter | Pre-write moderation | Cloud Function + allow override for mods |
| Moderator Console | Review flagged / deleted messages | `/moderation/flags` collection |
| Message Flagging | User can flag message | Write to `/flags/{id}` referencing messageId |
| Rate Limiting (Server) | Per-IP / per-uid sliding window | RTDB counters or external cache |
| GDPR / Data Export | User export of their messages | Cloud Function aggregator + Storage bundle |
| Data Retention Policies | TTL for ephemeral rooms or DMs | Scheduled Function deleting aged docs |
| E2EE Opt-In Rooms | End-to-end encrypted mode | libsodium sealed boxes; trade off server-side search |
| Audit Log (Admins) | Track privileged actions | Append-only `/auditLogs` collection |

---

## Discovery & Growth
| Feature | Summary | Notes |
|---------|---------|-------|
| Public Room Directory | Browse discoverable rooms | Indexed by `visibility = 'public'` |
| Invitation Tokens | Join via short-lived token | Signed token doc w/ expiration |
| Trending Rooms | Rank by recent message velocity | Cloud Function periodic scoring |
| External Search Integration | Full-text search external index | Export messages to Algolia/Meilisearch |
| Unread Counts | Badge counts for sidebar | Approximate using lastReadAt delta |
| Email / Push Re-engagement | Weekly digest or push summary | Cloud Function batching |

---

## Observability & Analytics
| Feature | Summary | Notes |
|---------|---------|-------|
| Structured Event Logging | Standard schema (category, action, meta) | `telemetry/` util wrapper |
| Error Monitoring | Sentry or equivalent | DSN via env; scrub PII |
| Performance Tracing | TTFMP, input latency, scroll jank | `performance.mark` instrumentation |
| Feature Flag Metrics | Exposure vs conversion tracking | Tie to Remote Config / Firestore config doc |
| Health Dashboard | Basic admin UI | Aggregate Firestore counts, error rates |

---

## Developer Experience
| Feature | Summary | Notes |
|---------|---------|-------|
| Central `useMessages(roomId)` Hook | Encapsulate pagination + virtualization | Simplify component usage |
| Zod Env Validation | Fail fast misconfig | `config/env.ts` (future TS) |
| Pre-commit Hooks | Lint + type + test changed | Husky + lint-staged (extend) |
| Feature Flags Framework | Simple `useFlag('name')` | Backed by Remote Config or Firestore doc |
| Storybook Visual Regression | Snapshot baseline gating | Playwright / Chromatic hybrid |
| API Surface Docs | Auto-generated component MDX | Storybook Docs + compodoc style |
| Test Data Seeds | Script to populate dev DB | `scripts/seed.js` |

---

## Data Modeling Patterns
### Reactions
Current inline map works; consider migrating high-churn to subcollection if contention observed.

### Read Receipts
Per-user last read timestamp; derive counts on client (avoid fan-out writes).

### Threads
Flat list with `parentId`; index `(roomId, parentId, createdAt)`.

### Social Graph
Friendship edges symmetrical: maintain both sides or derive on query; prefer storing both docs for simpler queries.

---

## Security Rule Templates
Pseudo illustrating invariants (NOT final syntax):
```js
function isAuthor() { return request.auth != null && request.auth.uid == resource.data.authorId; }
function withinEditWindow() { return request.time < resource.data.createdAt + duration.value(15, 'm'); }

match /messages/{id} {
	allow create: if request.resource.data.createdAt == request.time
		&& request.resource.data.authorId == request.auth.uid
		&& request.resource.data.text.size() <= 2000;
	allow update: if isAuthor() && withinEditWindow() && request.resource.data.text.size() <= 2000;
	allow delete: if isAuthor() || isModerator();
}
```

---

## Push & PWA Strategy
| Concern | Plan |
|---------|------|
| Service Worker | Workbox precache + runtime cache avatars/images |
| Push Opt-In Timing | Prompt after first successful send or 2 visits |
| Token Storage | `/users/{uid}.fcmTokens` map keyed by device hash |
| Notification Filtering | Skip active room viewers (presence) |
| Background Sync | Retry unsent queue when reconnecting |

---

## Testing Strategy
| Level | Focus |
|-------|-------|
| Unit | Formatting utils, reaction toggle, queue logic |
| Integration | send → edit → react → paginate → read receipt update |
| E2E | Auth → join → DM → mention → pin → mobile viewport |
| Performance | Virtualized list render budget under threshold |
| Security | Emulator rule tests (valid vs invalid mutations) |

---

## Performance Watchpoints
* Keep message query narrow: `orderBy(createdAt desc).limit(N)` backward paginate.
* Detach listeners on tab hidden (visibility API).
* Debounce typing & presence writes (>=2s).
* Avoid large unbounded arrays (prefer subcollections for >50 churn items).
* Use `content-visibility` & virtualization for large histories.

---

## Phased Roadmap Snapshot
| Phase | Focus | Representative Slice (Pick 1–3 at a time) |
|-------|-------|-------------------------------------------|
| 1 | Trust & Editing | Edit, soft delete, refined rules |
| 2 | Social Graph | Profiles, friend requests, DMs |
| 3 | Engagement | Pins, unread counts, mentions, notifications |
| 4 | Scale & Perf | Virtualization, offline cache, listener hygiene |
| 5 | Safety & Moderation | Flagging, moderation console, abuse filter |
| 6 | Advanced UX | Threads expansion, scheduled send, voice notes |
| 7 | Growth & Analytics | Directory, trending, metrics dashboards |

---

## Notes
Prioritize delivering **thin vertical slices** that include: data model + client UI + rules + tests + telemetry. Avoid starting several medium/high effort features simultaneously. Keep this file pruned—remove an item immediately after production verification.


---

## Core Messaging Enhancements

| Feature | Description | Notes |
|---------|-------------|-------|
| Message Status | Sent / delivered / read receipts | Use per-user read marker document |
| Threading / Replies | Nested or flat reply model | Lazy-load replies; show reply count |
| Pinned & Starred | Highlight or personal save | Room-level pinned list; user-level starred collection |
| File & Media Support | Attach images/files | Storage + metadata doc; generate thumbnails |
| Voice Notes | Audio snippets | Record → compress → upload; optional waveform |
| Mobile Optimizations | Long-press (mobile) to open menu. | Have AI do it |

### Additional Considerations
- Message formatting (Markdown subset) pairs well with edit functionality.
- Soft-deleting retains moderation/audit possibilities.

---

## Engagement & Personalization
- User Profiles (avatar, bio, status); cache locally.
- Presence & Last Seen (Realtime DB ephemeral mirrored to Firestore for coarse status).
- Nickname / Display Name validation + uniqueness.
- Draft Persistence (LocalStorage/IndexedDB keyed by room id).
- Markdown Formatting (bold, italics, inline/code blocks) with sanitization (DOMPurify).
- Theming (Light / Dark / System) via CSS variables + persisted preference.
- Internationalization scaffold (i18next or react-intl) early to avoid string fragmentation.
- Per-User Mute (Future): Allow muting specific users' notification sounds while still displaying their messages.\
	Implementation sketch: maintain a local (and optionally synced) mutedUserIds set. When a new message arrives, suppress `playReceiveMessageSound` if `message.uid` is muted. UI: contextual menu action "Mute @User" with undo in a settings panel. Persist to localStorage first; later sync via `/users/{uid}/preferences` document. Accessibility: still announce new messages to screen readers.
- Volume Adjuster (Future): Settings modal slider(s) for master volume (and potentially per sound category: send, receive, typing). Persist in localStorage; apply by scaling each audio element's base volume. Provide live preview button with reduced motion consideration.

---

## Scalability & Performance
### Pagination & Rendering
- Infinite Scroll with `limit` + `startAfter` windows.
- Virtualized Message List (react-window / react-virtuoso) for large histories.

### Index & Query Hygiene
- Composite indexes: `(roomId, createdAt desc)` etc.
- Restrict listeners to minimal query windows.

### Cost Optimization
- Local cache (IndexedDB) of recent N messages.
- Detach listeners when tab hidden.
- Use server timestamps; avoid redundant document updates.

### Bulk Operations
- Batch writes for multi-message initialization or imports.
- Consider rate limiting multi-write client flows.

---

## Reliability & Offline
- Offline Queueing (Firestore persistence + optimistic UI with rollback logic).
- Retry & Backoff for transient Firestore/storage errors.
- Service Worker / PWA shell caching (Workbox). Cache avatars/media thumbnails.
- Push Notifications (FCM) with topic or per-room token mapping.

---

## Security & Privacy
- Refined Firestore Rules (membership, message length, immutable authorId, server timestamp enforcement).
- Rate Limiting (Cloud Function; per-IP / per-UID sliding window counters in RTDB or external store).
- Profanity / Abuse Filter (Perspective API or local banned-word list pre-write moderation function).
- Audit & Moderation Tools (flagged messages collection; moderator role via custom claims).
- Message Retention Policies (TTL purge scheduler / ephemeral rooms).
- Optional End-to-End Encryption (libsodium) – compromises search/moderation; isolate encrypted room mode.

---

## Discovery & Growth
- Room Directory (public vs private visibility flags).
- Invitation Tokens for gated entry.
- Direct Messages (deterministic channel ID = sorted user IDs hash).
- Mentions / Notifications (parse `@username`; store mention references for unread counters).
- Unread Counts (per-room `lastReadAt` per user; query messages after timestamp).
- Message Permalinks (deep link → scroll to message anchor).

---

## Observability & Analytics
- Frontend Error Monitoring (Sentry / Crashlytics Web).
- Performance Tracing (Firebase Performance SDK: cold start, first message render).
- Engagement Metrics (Cloud Function: DAU, messages per room, retention cohorts).
- Feature Flags (Firestore config doc or Firebase Remote Config for gradual rollout).

---

## Accessibility & Quality
- Keyboard Navigation (focus management, Enter vs Shift+Enter logic, shortcuts palette).
- ARIA Roles & Live Regions (announce new messages, polite vs assertive strategies).
- Media Alt Text Prompts for image uploads.
- Mobile Reaction Long-Press (Implemented) ✅
- Adaptive Popover Edge Repositioning (Implemented) ✅
- Keyboard Overlap Mitigation / Sticky Input Refinement (Implemented) ✅
- Reduced Motion & Focus Outline Enhancements (Implemented) ✅
- Telemetry & Lighthouse Baseline (In Progress) 🟡
- Visual Regression Harness (Planned) 🟡
 - Visual Regression Snapshots for key breakpoints (moved from Phase 5 checklist) 🔄
- Automated Testing (units, RTL integration, E2E flows for send → reaction → pagination).

---

## Developer Experience & Architecture
- Central Hook: `useMessages(roomId)` encapsulating pagination + snapshot management.
- Lightweight State Management (React Query for cache & background refetching).
- Environment & Config Validation (.env + zod schema at startup).
- CI Pipeline (lint → test → build → preview deploy cadence).
- Automatic Code Formatting (Prettier + ESLint + lint-staged pre-commit hook).

---

## Priority Matrix (Impact vs Effort)

### High Impact / Low Effort
- Typing Indicators
- Dark Mode
- Message Delete / Edit
- Pagination
- Refined Rules

### High Impact / Medium Effort
- Reactions
- Presence
- Push Notifications
- External Search Integration
- Unread Counts

### High Impact / High Effort
- Threading
- E2EE Mode
- Self-Hosted Full-Text Search
- Moderation Console

### Medium Impact / Low Effort
- Draft Persistence
- Theming Polish
- Keyboard Shortcuts
- Profile Avatars

### Medium Impact / Medium Effort
- Virtualized List
- Analytics Dashboards
- Feature Flags

---

## Phased Roadmap
| Phase | Focus | Key Items |
|-------|-------|-----------|
| 1 | Polish & UX | Typing, edit/delete, reactions, dark mode, pagination, improved rules |
| 2 | Engagement & Retention | Presence, unread counts, push notifications, avatars, draft persistence |
| 3 | Scale & Performance | Virtualization, offline caching, search integration, cost optimization |
| 4 | Advanced Collaboration | Threads, mentions, DMs, pinned messages, permalinks |
| 5 | Safety & Privacy | Moderation tools, abuse filtering, retention policies, optional E2EE |
| 6 | Observability & Growth | Metrics dashboards, feature flags, A/B experiments |

---

## Firestore Data Modeling Tips
### Reactions
- Option A (Inline Map): `reactions: { ":thumbsup:": [uid1, uid2] }` (fast read; contention risk with large arrays).
- Option B (Subcollection): `/rooms/{roomId}/messages/{msgId}/reactions/{emoji}` → `{ users: [uid...] }` reduces write contention; can add counts.

### Read Receipts
- Per-user document: `/rooms/{roomId}/members/{uid}` with `lastReadAt` timestamp.
- Unread count = query messages where `createdAt > lastReadAt` (limit for badge, do not count all for scalability—use approximation).

### Threads
- Flat collection: messages have optional `parentId`; index `(roomId, parentId, createdAt)`.
- Reply count denormalized in parent message (increment via transaction or function).

### Presence
- Realtime DB ephemeral: `/status/{uid}` → `{ state: 'online'|'offline', lastChanged }`.
- Cloud Function mirror → Firestore `users/{uid}.status` for coarse queries.

---

## Security Rule Enhancements
Conceptual rules (pseudo):
```js
// Enforce server timestamp & immutability
allow create: if request.resource.data.createdAt == request.time
	&& request.resource.data.authorId == request.auth.uid
	&& request.resource.data.text.size() <= 2000;

allow update: if request.auth.uid == resource.data.authorId
	&& request.time < resource.data.createdAt + duration.value(15, 'm')
	&& request.resource.data.diff(resource.data).changedKeys().hasOnly(['text', 'edited'])
	&& request.resource.data.text.size() <= 2000;

allow delete: if request.auth.uid == resource.data.authorId || isModerator();
```
> Actual Firestore security rules syntax will differ; implement with functions for reuse.

---

## PWA & Push Strategy
- Service Worker: precache shell, runtime caching for avatars & thumbnails.
- Push Permission Prompt: delay until meaningful engagement (e.g., user sends first message).
- FCM Token Storage: `/users/{uid}.fcmTokens` (array or map keyed by device fingerprint).
- Notification Trigger: Cloud Function on new message, ignore sending to users active in the room (optional presence list).

---

## Testing Strategy
### Unit
- Text formatting utilities
- Reaction toggle logic
- Pagination helpers

### Integration (React Testing Library)
- Send message flow (input → Firestore mutation → render)
- Edit & delete propagation
- Reaction add/remove updates

### E2E (Cypress / Playwright)
- Auth sign-in → join room → send → react → paginate back
- Typing indicator visibility
- Dark mode persistence between sessions

### Emulator Usage
- Use Firebase emulators for Firestore, Auth, Functions in CI: `firebase emulators:exec "npm test"`.

---

## Performance Watchpoints
- Query Narrowing: Always `orderBy('createdAt', 'desc').limit(N)`; paginate backward.
- Listener Lifecycle: Unsubscribe on room change / tab hidden.
- Typing Indicator Debounce: Write at most every 2–3 seconds or on input idle.
- Avoid Large Arrays: Use subcollections for high-churn reaction/presence data.
- Local Cache: Hydrate initial message window from IndexedDB before network.

---

## Notes
- Select a thin vertical slice per phase; avoid starting multiple medium/high-effort features simultaneously.
- Introduce observability early if rollout risk increases (e.g., before E2EE or threading). 

---

## Changelog (for this Document)
- Structured original flat list into hierarchical sections, added tables, clarifications, and implementation nuances.

Core Messaging Enhancements

Typing Indicators: Presence subcollection or RTDB hybrid; low effort, high UX impact.
Message Status: sent / delivered / read receipts using per-user read marker doc; medium complexity.
Edit & Delete: Allow edits (retain original timestamp + edited flag), soft delete with tombstone; audit log optional.
Reactions: Store as map (emoji -> userIds[]) or reaction docs; denormalize counts for fast rendering.
Threading / Replies: Parent message reference + lightweight reply count; lazy-load thread on demand.
Pinned & Starred Messages: Room-level pinned doc list; user-level starred collection.
Search: Firestore full-text limits; integrate Algolia or Meilisearch (export via Cloud Function trigger).
File & Media Support: Upload to Storage with metadata doc; generate image thumbnails and size limits.
Voice Notes: Record -> compress -> upload; waveform preview (optional).
Engagement & Personalization

User Profiles: Avatar (Storage), bio, status; cache in local state.
Presence & Last Seen: Use Realtime Database ephemeral presence + mirror coarse status to Firestore.
Custom Nicknames / Display Names: Already have modal—extend to uniqueness + validation.
Message Draft Persistence: LocalStorage keyed by room id.
Message Formatting: Markdown subset (bold, code blocks) sanitized (DOMPurify).
Theming (Light/Dark/System): CSS variables + persisted preference.
Internationalization: react-intl or i18next scaffolding early to avoid string sprawl.
Scalability & Performance

Pagination + Infinite Scroll: Query windowing (limit + startAfter); reverse scroll anchor preserving.
Virtualized Message List: react-window or react-virtuoso to handle large histories.
Firestore Index Hygiene: Pre-create composite indexes for (roomId, createdAt desc).
Cost Optimization:
Cache last N messages locally (IndexedDB) to reduce initial reads.
Use server timestamps and avoid unnecessary listeners (detach when tab hidden).
Batch Writes & Bulk Imports: Wrap multi-message actions in batched writes; consider rate limiting.
Reliability & Offline

Offline Queueing: Enable Firestore persistence; maintain optimistic UI with rollback on failure.
Retry & Backoff Strategy: Central utility for transient errors.
Service Worker / PWA: Add workbox for caching shell + message avatars; offline indicator in header.
Push Notifications: FCM for background new message notifications (per-room subscription).
Security & Privacy

Refine Firestore Rules: Enforce per-room membership, message length, createdAt server timestamp, immutable authorId.
Rate Limiting: Cloud Function with per-IP / per-UID sliding window (store counters in RTDB or Redis proxy).
Profanity / Abuse Filter: Moderation pipeline (Perspective API or local banned-word list).
Audit / Moderation Tools: Flag message docs, moderator role in custom claims.
Message Retention Policies: TTL (scheduled Cloud Function to purge after X days) or ephemeral rooms.
Encryption Options: Client-side E2EE (libsodium) optional room mode; tradeoffs: search & moderation harder.
Discovery & Growth

Room Directory / Invitations: Private vs public rooms; invite tokens.
User-to-User Direct Messages: Deterministic channel id from sorted user IDs.
Mentions / Notifications: Parse @username; store mention references for quick unread counts.
Unread Counts & Badge: Per-room lastReadAt; query diff for unread number.
Message Linking / Permalinks: Shareable URL with deep-load single message and scrollIntoView.
Observability & Analytics

Frontend Error Monitoring: Sentry or Firebase Crashlytics (web) integration.
Performance Tracing: Firebase Performance SDK for cold start, first message load.
Engagement Metrics: Cloud Function exports daily active users, messages per room.
Feature Flags: Simple Firestore config doc or remote config for gradual rollouts.
Accessibility & Quality

Keyboard Navigation: Focus traps, shortcuts (e.g., press Enter vs Shift+Enter).
ARIA Roles for Messages & Live Region: Announce new messages to screen readers.
Media Alt Text Prompts: Add text input when uploading images.
Automated Testing:
Unit: message utils, formatting.
Integration: React Testing Library for ChatRoom flows.
E2E: Playwright/Cypress sign-in -> send -> reaction -> pagination.
Developer Experience & Architecture

Central Message Hook: useMessages(roomId) encapsulating pagination, presence of listeners.
State Management: Keep light; maybe React Query for caching Firestore docs.
Env & Config Separation: .env (with fallback) and runtime validation (zod).
CI Pipeline: Lint → test → build; preview deployments (e.g., Vercel/Netlify).
Automatic Code Formatting: Prettier + ESLint with pre-commit hook (lint-staged).
Approximate Priority Matrix (Impact vs Effort)

High Impact / Low Effort: Typing indicators, dark mode, message delete/edit, pagination, refined rules.
High Impact / Medium Effort: Reactions, presence, push notifications, search (if using external index), unread counts.
High Impact / High Effort: Threading, E2EE mode, full-text search self-hosted, moderation console.
Medium Impact / Low Effort: Draft persistence, theming, keyboard shortcuts, profile avatars.
Medium Impact / Medium Effort: Virtualized list, analytics dashboards, feature flags.
Suggested Roadmap (Phased)

Phase 1 (Polish & UX): Typing indicator, edit/delete, reactions, dark mode, pagination, improved rules.
Phase 2 (Engagement & Retention): Presence, unread counts, push notifications, avatars/profiles, draft persistence.
Phase 3 (Scale & Performance): Virtualization, offline caching, search integration, cost optimization passes.
Phase 4 (Advanced Collaboration): Threads, mentions, DMs, pinned messages, permalinks.
Phase 5 (Safety & Privacy): Moderation tools, abuse filtering, retention policies, optional E2EE rooms.
Phase 6 (Observability & Growth): Metrics dashboards, feature flags, A/B on formatting features.
Firestore Modeling Tips (Select Features)

Reactions: /rooms/{roomId}/messages/{msgId}/reactions (doc: emoji -> [uid]) or a reactions map in message. If concurrency high, per-emoji doc to avoid contention.
Read Receipts: For group chats, per-user lastReadAt in /rooms/{roomId}/members/{uid}; compute unread by querying messages > timestamp.
Threads: /rooms/{roomId}/messages/{parentId}/replies/{replyId} or flat collection with parentId field + index on (roomId, parentId, createdAt). Flat simplifies querying counts.
Presence: Realtime DB path /status/{uid} ephemeral; Cloud Function mirror to Firestore users/{uid}.status for coarse-grain.
Security Rule Enhancements (Conceptual)

Enforce request.resource.data.createdAt == request.time (serverTimestamp) and immutability.
Limit message length: request.resource.data.text.size() <= 2000.
Allow edits only within X minutes or only text field if same authorId.
Deny if contains disallowed substrings (basic list) — or better handle in Cloud Function before write.
PWA & Push

Add service worker (custom or CRA’s) to intercept message fetch caching strategy.
Prompt for notification permission after meaningful interaction.
Use FCM tokens stored in /users/{uid}.fcmTokens. Cloud Function triggers on new message to send selective notifications (exclude active room participants).
Testing Strategy Expansion

Snapshot tests minimal; favor behavior tests (send message → appears → reaction updates).
Mock Firestore with emulator for integration tests; seed rooms + messages.
Add GitHub Actions to run firebase emulators:exec "npm test".
Performance Watchpoints

Avoid broad listeners: always apply orderBy('createdAt','desc').limit(n) and paginate.
Debounce typing indicator writes (e.g., only write every 2–3s or on pause).
Use onSnapshot unsubscribes on route change / tab hidden to reduce billed minutes.

---

## Additional Ideas (Appended During Mobile Phase 2)

| Idea | Description | Notes |
|------|-------------|-------|
| Content Visibility Toggle | Runtime toggle (settings) to enable/disable `content-visibility` for A/B perf measurement | Controlled via root class `enable-content-visibility` |
| Compact Mode | Reduce vertical padding + avatar size on mobile landscape | Could pair with virtualized list later |
| Battery Saver Mode | Auto-disable blurs & heavy shadows when `navigator.getBattery()` low | Fallback heuristic if API unsupported |
| Emoji Recent Cache | Store last 16 used emoji in localStorage for quick bar | Prefetch subset to reduce picker open cost |
| Lazy Emoji Picker Import | Dynamic import only when user first opens emoji menu | Reduces initial JS payload |
| Haptic Feedback Wrapper | Abstract vibration / haptics for reactions & long-press | Progressive enhancement only |
| Lazy Emoji Picker (Implemented) | Now dynamically imported on demand | Further enhancement: prefetch on idle |
| Performance Mode Toggle (Implemented) | User toggle adds content-visibility for messages | Could auto-enable on low-end heuristics |
| Long-Press Reply | Long-press message triggers reply context on mobile | Prevents accidental menu open |
| Gesture Swipe to Scroll Bottom | Small upward swipe near bottom reveals quick-scroll button | Accessibility: keep existing button too |
| Accessibility Audit Script | Automated `axe-core` run in CI on Storybook stories | Surfaces regressions early |
| Performance Markers | Insert `performance.mark` around message render batches | Enables INP analysis |