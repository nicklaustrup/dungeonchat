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

