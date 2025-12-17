# Firestore Data Schemas

This directory contains JSON schemas and documentation for all Firestore document types used in DungeonChat.

## Available Schemas

### Firestore Collections

- **[campaign.json](./campaign.json)** - Campaigns with members and settings
- **[userProfile.json](./userProfile.json)** - User profiles with friends and blocked users
- **[message.json](./message.json)** - Chat messages with reactions and replies
- **[character.json](./character.json)** - D&D 5e character sheets
- **[token.json](./token.json)** - VTT tokens on maps
- **[map.json](./map.json)** - VTT map documents
- **[friendship.json](./friendship.json)** - Friend/block relationships
- **[campaignRequest.json](./campaignRequest.json)** - Campaign join requests
- **[voiceRoom.json](./voiceRoom.json)** - Voice chat rooms

### Realtime Database (RTDB)

- **[presence.json](./presence.json)** - Real-time user presence
- **[typing.json](./typing.json)** - Real-time typing indicators

### Architecture Overview

- **[DATA_ARCHITECTURE.md](./DATA_ARCHITECTURE.md)** - Complete Firebase data architecture

## Document Examples

### Message Document

**Firestore Path:** `/campaigns/{campaignId}/messages/{messageId}`

**Example:**

```javascript
{
  id: "msg123",
  text: "Hello world",
  imageURL?: "https://storage.googleapis.com/...",
  createdAt: Timestamp(2025, 10, 14, 12, 30, 0),
  uid: "user123",
  displayName: "DragonSlayer42",
  photoURL: "https://lh3.googleusercontent.com/...",
  reactions: {
    "👍": ["uid1", "uid2"],
    "❤️": ["uid3"],
    "🎲": ["uid1"]
  },
  replyTo?: {
    id: "msg122",
    text: "Who's ready for tonight's session?",
    uid: "user456",
    displayName: "DungeonMaster"
  }
}
```

**Required Fields:**

- `id` - Message ID (string)
- `createdAt` - Firestore server timestamp
- `uid` - Author's user ID (string)
- `displayName` - Author's display name (string)
- Must have either `text` OR `imageURL` (at least one)

**Optional Fields:**

- `text` - Message text content (string, max 5000 chars)
- `imageURL` - URL to uploaded image (string, valid URL)
- `photoURL` - Author's profile photo (string, valid URL)
- `reactions` - Map of emoji to array of user IDs (object)
- `replyTo` - Reference to original message (object)

**Security Rules:**

- Users can only create messages with their own `uid`
- Only message author can delete their own messages
- Reactions updated via transactions to prevent race conditions
- `createdAt` must be `serverTimestamp()`

**Indexing:**

- Composite index: `createdAt DESC` for pagination

---

### User Profile Document

**Firestore Path:** `/userProfiles/{userId}`

**Example:**

```javascript
{
  uid: "user123",
  username: "dragonslayer42",
  displayName: "DragonSlayer42",
  bio: "Experienced D&D player, lover of dragons and dice. DM for 10+ years!",
  photoURL: "https://lh3.googleusercontent.com/...",
  friends: ["uid456", "uid789", "uid012"],
  blocked: ["uid999"],
  createdAt: Timestamp(2025, 1, 15, 10, 0, 0),
  updatedAt: Timestamp(2025, 10, 14, 12, 0, 0)
}
```

**Required Fields:**

- `uid` - Firebase Auth user ID (string)
- `username` - Unique username (string, 3-20 alphanumeric + underscore)
- `displayName` - User's display name (string)
- `createdAt` - Firestore server timestamp

**Optional Fields:**

- `bio` - User biography (string, max 500 chars)
- `photoURL` - Profile photo URL (string, valid URL)
- `friends` - Array of friend user IDs (array of strings)
- `blocked` - Array of blocked user IDs (array of strings)
- `updatedAt` - Last update timestamp (Firestore timestamp)

**Security Rules:**

- Users can only read/write their own profile
- Username must be unique (checked via Cloud Function)
- Profile creation happens after Firebase Auth signup
- Friends array updated via transactions

**Indexing:**

- Single field index: `username ASC` for username lookups

---

### Campaign Document

**Firestore Path:** `/campaigns/{campaignId}`

**Example:**

```javascript
{
  id: "campaign123",
  name: "The Lost Mines of Phandelver",
  description: "A classic D&D adventure for new players. Join us as we explore the dangerous mines!",
  dmId: "user123",
  members: ["user123", "user456", "user789", "user012"],
  settings: {
    isPublic: false,
    allowJoinRequests: true,
    maxMembers: 6
  },
  createdAt: Timestamp(2025, 9, 1, 18, 0, 0),
  updatedAt: Timestamp(2025, 10, 14, 12, 0, 0)
}
```

**Required Fields:**

- `id` - Campaign ID (string)
- `name` - Campaign name (string, 1-100 chars)
- `dmId` - Dungeon Master's user ID (string)
- `members` - Array of member user IDs including DM (array of strings)
- `createdAt` - Firestore server timestamp

**Optional Fields:**

- `description` - Campaign description (string, max 1000 chars)
- `settings` - Campaign settings object
  - `isPublic` - Public visibility (boolean, default: false)
  - `allowJoinRequests` - Allow join requests (boolean, default: true)
  - `maxMembers` - Max member count (number, 2-20, default: 6)
- `updatedAt` - Last update timestamp (Firestore timestamp)

**Subcollections:**

- `/campaigns/{campaignId}/messages/{messageId}` - Chat messages
- `/campaigns/{campaignId}/characters/{characterId}` - Player characters
- `/campaigns/{campaignId}/tokens/{tokenId}` - VTT tokens
- `/campaigns/{campaignId}/maps/{mapId}` - VTT maps

**Security Rules:**

- Only DM can update campaign settings
- Members can read campaign data
- DM can add/remove members
- Members array updated via transactions

**Indexing:**

- Composite index: `createdAt DESC` for browsing
- Array-contains index: `members` for user's campaigns query

---

## Using Schemas in Code

### Validating Data Against Schema

You can use these JSON schemas with validation libraries:

```javascript
import Ajv from 'ajv';
import messageSchema from './docs/schemas/message.json';

const ajv = new Ajv();
const validate = ajv.compile(messageSchema);

const isValid = validate(messageData);
if (!isValid) {
  console.error(validate.errors);
}
```

### TypeScript Type Generation

Generate TypeScript types from schemas:

```bash
npm install -g json-schema-to-typescript
json2ts -i docs/schemas/message.json -o src/types/Message.ts
```

### Testing with Schemas

Use schemas in tests to ensure data consistency:

```javascript
import { validateMessage } from '../validators';

test('creates valid message document', () => {
  const message = {
    id: 'test123',
    text: 'Test message',
    createdAt: serverTimestamp(),
    uid: 'user123',
    displayName: 'TestUser',
  };

  expect(validateMessage(message)).toBe(true);
});
```

## Schema Maintenance

When updating schemas:

1. Update the JSON schema file
2. Update security rules in `firestore.rules`
3. Update this README with new examples
4. Update TypeScript types if using TypeScript
5. Update tests to reflect schema changes
6. Run schema validation tests
7. Deploy updated rules: `firebase deploy --only firestore:rules`

## Related Files

- [firestore.rules](../../firestore.rules) - Security rules implementation
- [firestore.indexes.json](../../firestore.indexes.json) - Composite indexes
- [.agent/agent-config.json](../../.agent/agent-config.json) - AI agent configuration
- [CLAUDE.md](../../CLAUDE.md) - Project documentation
