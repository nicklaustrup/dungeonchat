<div align="center">
	<h1>SuperChat</h1>
	<p><strong>Firebase-powered real‑time chat</strong> showcasing pragmatic architecture, performance-aware patterns, and an AI-friendly roadmap for iterative feature growth.</p>
	<p>
		<a href="#quickstart">Quickstart</a> ·
		<a href="#contributing">Contributing</a> ·
		<a href="#features">Features</a> ·
		<a href="#roadmap">Roadmap</a> ·
		<a href="#license">License</a>
	</p>
</div>

---

## Why This Project Exists
SuperChat is a learning + experimentation sandbox for modern, incrementally scalable chat features using:
* Firestore (persistent canonical message & room state)
* Realtime Database (ephemeral presence / typing)
* Storage (media uploads)
* Cloud Functions (future: moderation, scheduled send, push notifications)

The repo is intentionally optimized for future human & AI contributors:
* Clearly scoped feature backlog (`FUTURE_FEATURES.md`)
* Minimal but expressive component boundaries
* Hook-oriented data / UI composition (`useAutoScroll`, `useInfiniteScrollTop`, etc.)
* Explicit docs for security, performance, and testing strategy

---

## Current Core Features <a id="features"></a>
| Category | Feature | Notes |
|----------|---------|-------|
| Auth | Google Sign-In | Popup flow via Firebase Auth |
| Messaging | Real-time stream | Firestore query ordered by `createdAt` |
| Messaging | Pagination (incremental) | Expands window when scrolling upward |
| Messaging | Text & Images | Client-side compression for images |
| Messaging | Inline Replies (lightweight) | `replyTo` snapshot for context |
| Reactions | Emoji reactions | Inline map `{ emoji: [uids...] }` |
| Presence | Online + typing indicator | RTDB paths; debounced writes |
| Theming | Light / Dark toggle | Body class; persistence roadmap |
| Accessibility | Focus management baseline | Reaction list ARIA roles |
| Tooling | Storybook + tests scaffold | Visual & a11y tests expanding |

For upcoming enhancements see `FUTURE_FEATURES.md`.

---

## Tech Stack
| Layer | Choice | Rationale |
|-------|--------|-----------|
| UI | React (CRA) | Simplicity + fast iteration |
| State | Local hooks + Firebase SDK | Avoid early heavy state mgmt |
| Backend as a Service | Firebase (Firestore, RTDB, Storage, Auth) | Real-time + structured queries |
| Build | CRA scripts | Zero-config baseline |
| Testing | Jest + React Testing Library | Unit + integration coverage |
| Visual/A11y (planned) | Playwright / Chromatic | Regression gates |
| Deployment | Firebase Hosting / App Hosting | CDN + serverless integration |

---

## Quickstart <a id="quickstart"></a>
1. Clone & install
```bash
git clone https://github.com/<your-org-or-user>/superchat.git
cd superchat
npm install
```
2. Configure Firebase: copy `.env.example` → `.env` and fill `REACT_APP_*` values.
3. Run locally
```bash
npm start
```
4. (Optional) Build
```bash
npm run build
```
5. (Optional) Deploy (classic hosting)
```bash
firebase deploy --only hosting
```

---

## Development Workflow
| Step | Action |
|------|--------|
| 1 | Create an issue (feature / bug) with clear scope |
| 2 | Branch `feat/<name>` or `fix/<name>` |
| 3 | Implement + add/update tests (unit + integration where applicable) |
| 4 | Run lint & tests locally (`npm run lint && npm test`) |
| 5 | Submit PR referencing issue; CI runs build + tests + (future) visual regressions |
| 6 | Review: focus on data modeling, rule safety, performance |
| 7 | Squash merge; deployment pipeline publishes build |

Commit Convention: `type: short description` where `type ∈ { feat | fix | docs | refactor | perf | test | chore }`.

---

## Contributing <a id="contributing"></a>
We welcome incremental, well-tested improvements. Before starting a larger feature, **open an issue or comment on an existing one** to avoid scope collisions.

Good first issues (examples):
* Persist theme to `localStorage`
* Add draft message persistence per room
* Implement message edit window & `edited` badge
* Add unit tests for reaction edge cases

Guidelines:
* Prefer thin vertical slices (data + UI + rule + test) over broad partial implementations
* Include security rule updates & corresponding emulator tests when adding new writes
* Add telemetry hook stubs (even if no backend store yet) for new interaction types
* Keep bundle size in mind—lazy load heavy optional UI (emoji picker, modals)

AI Agents: Follow the spec template in `FUTURE_FEATURES.md`. Always add acceptance criteria + test coverage.

---

## Testing
| Level | Tool | Examples |
|-------|------|----------|
| Unit | Jest | Formatting, reaction toggling |
| Integration | RTL | Send → appears, reply association |
| Accessibility | Jest + axe (planned) | Reaction list semantics |
| Visual (planned) | Playwright / Chromatic | Message layout variants |
| E2E (future) | Playwright | Auth → DM → pagination |

Run locally:
```bash
npm test
```

---

## Deployment
Primary: Firebase Hosting / App Hosting
* Build: `npm run build` produces `build/`
* Deploy hosting only: `firebase deploy --only hosting`
* Deploy functions (if modified): `firebase deploy --only functions`

Security rules & indexes should be reviewed prior to major feature deploys:
```bash
firebase deploy --only firestore:rules,database,storage
```

---

## Roadmap Snapshot <a id="roadmap"></a>
See `FUTURE_FEATURES.md` for the living backlog. Near-term slice: message edit + soft delete, profiles + friend requests, offline cache, read receipts, moderation primitives.

---

## Architecture Overview
| Concern | Service | Reason |
|---------|---------|-------|
| Durable history | Firestore | Query + index flexibility |
| Ephemeral state | Realtime DB | Low-latency presence / typing |
| Media | Storage | Scalable uploads + rules |
| Future async | Cloud Functions | Push, moderation, scheduled tasks |

Message docs include: `text`, `uid`, `createdAt (server)`, optional `imageURL`, `replyTo`, `reactions`.

---

## Performance & A11y Philosophy
* Optimize for perceived responsiveness: early paint + incremental hydration of history
* Keep auto-scroll deterministic (scroll heuristics tested in hooks)
* Provide accessible semantics (live regions for reactions, focus-visible styles)
* Add instrumentation before complex features (threads, virtualization)

---

## License <a id="license"></a>
MIT © 2025 SuperChat Contributors. See `LICENSE` for details.

---

## Security & Responsible Disclosure
No authentication secrets stored in repo. If you find a vulnerability in rules or data exposure, open a **private** issue or email the maintainer before public disclosure.

---

## A Note to Future AI Contributors
1. Read `FUTURE_FEATURES.md` to select an open slice.
2. Add or update tests FIRST when feasible.
3. Implement code + rules simultaneously to prevent drift.
4. Update docs & remove completed backlog items immediately.

Ship small. Measure. Iterate.

---

Happy building! 🚀

<div align="center">
	<h1>SuperChat</h1>
	<p>A modern Firebase-powered real‑time chat application built with React.</p>
	<p>
		<strong>Status:</strong> MVP in progress · Core messaging, reactions, image upload, presence, typing indicator, light/dark theme.
	</p>
</div>

---

## Table of Contents
1. [Overview](#overview)
2. [Current Features](#current-features)
3. [Near-Term Roadmap](#near-term-roadmap)
4. [Architecture](#architecture)
5. [Data Model (Current)](#data-model-current)
6. [Getting Started](#getting-started)
7. [Available Scripts](#available-scripts)
8. [Development Workflow](#development-workflow)
9. [Contributing](#contributing)
10. [Testing](#testing)
11. [Environment & Configuration](#environment--configuration)
12. [Future Features (Full List)](#future-features-full-list)
13. [License](#license)

---

## Overview
SuperChat is a learning & productivity oriented chat app showcasing pragmatic Firebase usage (Firestore + Realtime Database + Storage + Auth) with progressive enhancements (reactions, inline replies, presence, image handling, theme switching). The repository is structured for iterative growth toward a more fully featured collaboration tool.

Core goals:
- Keep initial architecture simple & observable
- Demonstrate hybrid Firestore (persistent) + RTDB (ephemeral state) patterns
- Provide a base for experimenting with performance & UX improvements (pagination, virtualization, offline, etc.)

---

## Current Features
| Category | Feature | Notes |
|----------|---------|-------|
| Auth | Google OAuth sign-in | Firebase Auth (Popup) |
| Messages | Real-time streaming | Firestore collection `messages` (ordered by `createdAt`) |
| Messages | Incremental pagination | Increases query limit on scroll near top |
| Messages | Text & image messages | Drag & drop or file picker; client-side compression |
| Messages | Inline replies | Lightweight embedded `replyTo` snapshot in message doc |
| Messages | Emoji reactions | Stored as `reactions: { emoji: [uid...] }` map |
| Messages | Local search filter | Client-side filter of loaded window |
| UX | Typing indicator | RTDB path `typing/{uid}` with debounce via input events |
| Presence | Online status | RTDB `presence/{uid}` with `onDisconnect` cleanup |
| UI | Light/Dark theme toggle | Body class swap; state persisted in memory (future: localStorage) |
| Media | Image preview modal | Full-size overlay on click |
| Accessibility | Basic keyboard send | Enter = send; (Shift+Enter roadmap) |
| Feedback | Notification sound toggle | Optional audio on send (file in `utils/sound.js`) |

Planned near-term improvements are tracked in `FUTURE_FEATURES.md`.

---

## Near-Term Roadmap
Focused slice from the broader roadmap (Phase 1 & early Phase 2 items):

| Priority | Item | Rationale |
|----------|------|-----------|
| High | Edit / soft delete messages | Improves trust & moderation flexibility |
| High | Refined security rules | Protect data integrity & limit abuse |
| High | Unread counts (per user) | Improves re-engagement |
| Medium | Dark theme persistence | Consistent UX across sessions |
| Medium | Draft persistence | Prevent accidental loss during navigation |
| Medium | Optimistic offline queue | Foundation for PWA experience |

For the full roadmap, see: [`FUTURE_FEATURES.md`](./FUTURE_FEATURES.md).

---

## Architecture
### Frontend
- React + `react-scripts` (CRA) for simplicity
- Component domains: `ChatRoom`, `ChatInput`, `ChatHeader`, authentication wrappers
- Stateless display vs stateful coordination (e.g., `ChatPage` lifts shared state)
- Hooks from `react-firebase-hooks` for Firestore collections

### Firebase Usage
| Concern | Service | Purpose |
|---------|---------|---------|
| Persistent chat data | Firestore | Message storage, ordering, reactions, reply references |
| Ephemeral presence / typing | Realtime Database | Faster ephemeral writes & disconnection semantics |
| Authentication | Auth | Google sign-in/out |
| Media storage | Storage | User-uploaded images (compressed client-side) |
| (Planned) Notifications | FCM | Push notifications for background engagement |

### State Split Rationale
- Firestore: durable, queryable history & structured message fields
- RTDB: low-latency ephemeral status (presence, typing) without impacting Firestore pricing or index design

---

## Data Model (Current)
```
messages (collection)
	- id: string (auto)
	- text?: string
	- imageURL?: string
	- createdAt: Timestamp (server)
	- uid: string (author)
	- photoURL: string
	- displayName: string
	- reactions: { [emoji: string]: string[] }  // userId arrays
	- replyTo?: { id, text?, imageURL?, type, uid, displayName }

RTDB:
presence/{uid} -> { online: boolean, lastSeen: serverTimestamp, displayName, photoURL }
typing/{uid}   -> { typing: boolean, displayName, timestamp }

storage:
images/{uid}/{timestamp}.jpg
```

---

## Getting Started
### Prerequisites
- Node.js (LTS recommended)
- Firebase project (create at https://console.firebase.google.com)
- Enable: Authentication (Google), Firestore, Realtime Database, Storage

### 1. Clone & Install
```bash
git clone https://github.com/<your-org-or-user>/superchat.git
cd superchat
npm install
```

### 2. Configure Firebase
Create a `.env.local` (future enhancement) or edit `src/services/firebase.js` with your project credentials. Current setup in-code for simplicity; migration to env planned.

### 3. Run Locally
```bash
npm start
```
Opens at `http://localhost:3000`.

### 4. (Optional) Emulators
Add a `firebase.json` / `firestore.rules` / `storage.rules` (already present) then:
```bash
firebase emulators:start
```
Adjust initialization to point to emulators (future toggle).

---

## Available Scripts
| Script | Command | Purpose |
|--------|---------|---------|
| Start | `npm start` | Launch dev server |
| Build | `npm run build` | Production build (minified) |
| Test | `npm test` | Jest (watch mode) |
| Eject | `npm run eject` | CRA config exposure (irreversible) |

---

## Development Workflow
1. Create issue (feature or bug) using templates in `.github/ISSUE_TEMPLATE/`
2. Branch naming: `feat/<short-name>` or `fix/<short-name>`
3. Implement & add/update tests
4. Submit PR using `pull_request_template.md`
5. Review: focus on data integrity, rule safety, performance of queries
6. Merge squash (preferred) → deploy

---

## Contributing
### Ground Rules
- Keep features incremental; avoid large multi-feature PRs
- Prefer Firestore transactions or atomic updates when mutating shared state (future: counters)
- No secrets committed; plan migration of config to env vars

### Suggested First Issues
- Persist theme to `localStorage`
- Add optimistic UI for image upload placeholder
- Add message edit (inline) with `edited` flag

### Commit Message Convention
`<type>: <short description>` where type ∈ { feat | fix | docs | refactor | perf | test | chore }

---

## Testing
Currently light (CRA default + `@testing-library`). Planned expansions:
- Unit: formatting utilities, reaction toggling
- Integration: send → appears, reply highlighting, reaction updates
- E2E (future): Cypress/Playwright with Firebase Emulators

Run tests:
```bash
npm test
```

---

## Environment & Configuration
| Aspect | Current | Planned |
|--------|---------|---------|
| Firebase config | In source (`firebase.js`) | `.env.local` + runtime validation (zod) |
| Feature flags | Hard-coded | Firestore `config` doc / Remote Config |
| Theming | In-memory state | Persist + system preference detection |
| Search | Client filter | External index (Algolia/Meilisearch) |

---

## Future Features (Full List)
The comprehensive roadmap with modeling notes lives in [`FUTURE_FEATURES.md`](./FUTURE_FEATURES.md). Highlights include threading, unread counts, edit/delete, moderation tools, offline caching, push notifications, and optional end‑to‑end encryption.

---

## License
Currently unlicensed (all rights reserved by default). Add a LICENSE file (e.g., MIT) if external contributions are desired.

---

## Maintainer Notes
- When adding new Firestore fields, backfill existing docs or guard for undefined in UI.
- Avoid broad unbounded listeners; always apply `limit` + ordering.
- Consider analytics instrumentation before large UX changes.

---

## Quick Start TL;DR
```bash
git clone <repo>
cd superchat
npm install
npm start
```
Sign in with Google → send a message → add a reaction → drag in an image.

---

Happy chatting! ✨



## Scroll Behavior

This application uses an optimized scroll behavior system (`useAutoScrollV2`) that provides:
- Intelligent auto-scroll when users are at the bottom
- Unread message tracking when scrolled up
- Smooth performance with minimal memory usage

See `docs/final-scroll-architecture.md` for complete documentation.
