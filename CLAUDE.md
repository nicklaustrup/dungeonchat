# CLAUDE.md

## Project Overview

**DungeonChat** DungeonChat is a Firebase-powered real-time D&D Virtual Tabletop (VTT) application built with React. It combines chat functionality, voice chat, campaign management, and a full-featured VTT including maps, tokens, fog of war, lighting, and character management.

## Development Environment

### Working with This Codebase

When making changes:

1. Read relevant architecture docs first in /docs/
2. Check TODO.md for context on planned work
3. Use caching hooks when available
4. Follow existing patterns (see similar components/services)
5. Add tests for new functionality
6. Update TODO.md when completing features
7. Keep documentation concise

### Essential Commands

```bash
npm start              # Start dev server (localhost:3000)
npm test               # Run tests in watch mode
npm run test:ci        # CI tests with coverage
npm run test:fast      # Fast tests without watch
npm run test:changed   # Test only changed files
npm run build          # Production build
npm run lint           # Run ESLint
firebase deploy        # Deploy Cloud Functions
firestore deploy       # Deploy Firestore rules
```

## Project Architecture

### Quick linked project map

**Core Infrastructure:**

- [src/services/firebase.js](./src/services/firebase.js) — Firebase initialization & config
- [firestore.rules](./firestore.rules) — Firestore security rules
- [database.rules.json](./database.rules.json) — RTDB security rules
- [storage.rules](./storage.rules) — Storage security rules
- [functions/](./functions/) — Cloud Functions ([README](./functions/README.md))

**Key Components:**

- [src/components/ChatRoom/ChatRoom.js](./src/components/ChatRoom/ChatRoom.js) — Chat UI entry point
- [src/components/VTT/](./src/components/VTT/) — Virtual tabletop components
- [src/components/Campaign/](./src/components/Campaign/) — Campaign management

**Critical Hooks:**

- [src/hooks/useAuth.js](./src/hooks/useAuth.js) — Authentication state

**Services & Utilities:**

- [src/services/](./src/services/) — Service layer (campaign, VTT, cache)
- [src/utils/](./src/utils/) — Pure utility functions
- [src/contexts/](./src/contexts/) — React context providers

**Documentation:**

- [TODO.md](./TODO.md) — Planned work and feature roadmap
- [docs/schemas/](./docs/schemas/) — JSON schemas for campaigns, messages, userProfile
- [docs/component-registry.md](./docs/component-registry.md) — Component usage and guidelines
- [docs/dependency-map.json](./docs/dependency-map.json) — Dependency map for key files

### Key Architectural Patterns

**Primary Collections:**

- `/campaigns/{id}` - Campaigns with members, settings ([schema](./docs/schemas/campaign.json))
- `/userProfiles/{id}` - User profiles ([schema](./docs/schemas/userProfile.json))
- `/characters/{id}` - Character sheets ([schema](./docs/schemas/character.json))
- `/friendships/{id}` - Friend/block relationships ([schema](./docs/schemas/friendship.json))
- `/campaignRequests/{id}` - Campaign join requests ([schema](./docs/schemas/campaignRequest.json))

**Campaign Subcollections:**

- `channels/{id}/messages/{id}` - Channel messages ([schema](./docs/schemas/message.json))
- `vtt/{mapId}/tokens/{id}` - VTT tokens ([schema](./docs/schemas/token.json))
- `maps/{id}` - VTT maps ([schema](./docs/schemas/map.json))
- `voiceRooms/{id}` - Voice chat rooms ([schema](./docs/schemas/voiceRoom.json))
- `members/{id}`, `characters/{id}`, `sessions/{id}`, `encounters/{id}`, `schedule/{id}`

**RTDB Paths (Ephemeral):**

- `/presence/{userId}` - User online status ([schema](./docs/schemas/presence.json))
- `/typing/{uid}` - Typing indicators ([schema](./docs/schemas/typing.json))
- `/voiceSignaling/{campaignId}/{roomId}` - WebRTC signaling

**Storage Buckets:**

- `/profile-pictures/{userId}/` - Profile photos (5MB limit)
- `/images/{userId}/` - Chat images (10MB limit)
- `/campaigns/{id}/maps/` - VTT maps (20MB limit)
- `/campaigns/{id}/tokens/` - Token images (5MB limit)

**📖 Full data architecture**: [docs/schemas/DATA_ARCHITECTURE.md](./docs/schemas/DATA_ARCHITECTURE.md)

## Data Models & Schemas

Full JSON schemas with validation rules and examples are available in `docs/schemas/`:

- [message.json](./docs/schemas/message.json) - Chat messages with reactions and replies
- [userProfile.json](./docs/schemas/userProfile.json) - User profiles with friends and blocked users
- [campaign.json](./docs/schemas/campaign.json) - Campaigns with members and settings

**Quick Reference:**

```
Message: { id, text?, imageURL?, createdAt, uid, displayName, photoURL?, reactions?, replyTo? }
UserProfile: { uid, username, displayName, bio?, photoURL?, friends[], blocked[], createdAt }
Campaign: { id, name, description, dmId, members[], settings, createdAt }
```
