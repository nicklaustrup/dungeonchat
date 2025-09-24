# Future Features & Roadmap

> Curated, structured list of potential enhancements for the chat application. Organized for clarity, prioritization, and implementation planning.

## Table of Contents
1. [Core Messaging Enhancements](#core-messaging-enhancements)
2. [Engagement & Personalization](#engagement--personalization)
3. [Scalability & Performance](#scalability--performance)
4. [Reliability & Offline](#reliability--offline)
5. [Security & Privacy](#security--privacy)
6. [Discovery & Growth](#discovery--growth)
7. [Observability & Analytics](#observability--analytics)
8. [Accessibility & Quality](#accessibility--quality)
9. [Developer Experience & Architecture](#developer-experience--architecture)
10. [Priority Matrix](#priority-matrix-impact-vs-effort)
11. [Phased Roadmap](#phased-roadmap)
12. [Firestore Data Modeling Tips](#firestore-data-modeling-tips)
13. [Security Rule Enhancements](#security-rule-enhancements)
14. [PWA & Push Strategy](#pwa--push-strategy)
15. [Testing Strategy](#testing-strategy)
16. [Performance Watchpoints](#performance-watchpoints)

---

## Core Messaging Enhancements

| Feature | Description | Notes |
|---------|-------------|-------|
| Typing Indicators | Show who is typing | Presence subcollection or Realtime DB hybrid |
| Message Status | Sent / delivered / read receipts | Use per-user read marker document |
| Edit & Delete | Allow edits + soft delete | Preserve original timestamp; mark `edited` flag |
| Reactions | Emoji reactions per message | Map (emoji → userIds[]) or per-emoji docs for contention |
| Threading / Replies | Nested or flat reply model | Lazy-load replies; show reply count |
| Pinned & Starred | Highlight or personal save | Room-level pinned list; user-level starred collection |
| Search | Full-text lookup | External index (Algolia / Meilisearch) via trigger |
| File & Media Support | Attach images/files | Storage + metadata doc; generate thumbnails |
| Voice Notes | Audio snippets | Record → compress → upload; optional waveform |

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