# Firebase Data Architecture

Complete reference for all Firebase collections, RTDB paths, and Storage buckets in DungeonChat.

## Firestore Collections

### Top-Level Collections

#### `/campaigns/{campaignId}`

D&D campaigns with members, settings, and game state.

- **Schema**: [campaign.json](./campaign.json)
- **Indexes**: visibility, status, lastActivity, members (array-contains)
- **Subcollections**: members, channels, characters, sessions, encounters, schedule, maps, voiceRooms, audio

#### `/userProfiles/{userId}`

User profile data including friends and blocked users.

- **Schema**: [userProfile.json](./userProfile.json)
- **Indexes**: username (unique lookup)
- **Security**: Users can read all profiles, write only their own

#### `/characters/{characterId}`

Top-level character storage (independent of campaigns).

- **Schema**: [character.json](./character.json)
- **Indexes**: campaignId, userId, level, class
- **Note**: Characters can also exist as campaign subcollection

#### `/friendships/{friendshipId}`

Friend requests and block relationships between users.

- **Schema**: [friendship.json](./friendship.json)
- **Security**: Users can only access friendships they're involved in

#### `/campaignRequests/{requestId}`

Requests to join campaigns.

- **Schema**: [campaignRequest.json](./campaignRequest.json)
- **Security**: Users see own requests, DMs see requests for their campaigns

#### `/usernames/{username}`

Username availability tracking (for uniqueness).

- **Structure**: `{ uid: string }`
- **Security**: Read-only for checking availability

#### `/messages/{messageId}` _(Legacy)_

Top-level messages collection (being phased out in favor of campaign subcollections).

- **Schema**: [message.json](./message.json)
- **Note**: New messages should use `/campaigns/{id}/channels/{id}/messages/`

#### `/userCampaigns/{userId}`

Quick lookup of campaigns a user belongs to.

- **Structure**: `{ campaigns: string[] }`
- **Security**: Users can only read/write their own

### Campaign Subcollections

#### `/campaigns/{campaignId}/members/{userId}`

Campaign membership tracking.

- **Structure**: `{ userId: string, role: string, joinedAt: Timestamp }`
- **Security**: DM can write, all members can read

#### `/campaigns/{campaignId}/channels/{channelId}`

Campaign chat channels (general, out-of-character, etc.).

- **Subcollection**: `messages/{messageId}` - Channel messages
- **Security**: Campaign members can read, DM can manage channels

#### `/campaigns/{campaignId}/channels/{channelId}/messages/{messageId}`

Campaign channel messages.

- **Schema**: [message.json](./message.json)
- **Indexes**: type, createdAt, uid
- **Security**: Members can create own messages, update reactions

#### `/campaigns/{campaignId}/characters/{userId}`

Player character sheets for the campaign.

- **Schema**: [character.json](./character.json)
- **Security**: Players can edit own characters, DM can edit any

#### `/campaigns/{campaignId}/sessions/{sessionDocId}`

Session data including initiative tracker, session notes.

- **Documents**: `initiative`, `currentSession`, `session-{date}`
- **Security**: DM can write all, members can read all, members can update initiative

#### `/campaigns/{campaignId}/encounters/{encounterId}`

Encounter templates and active encounters.

- **Structure**: `{ name, monsters[], isTemplate, difficulty }`
- **Security**: DM only

#### `/campaigns/{campaignId}/schedule/{eventId}`

Campaign schedule (sessions, milestones, events).

- **Structure**: `{ title, date, type, availability: { [userId]: boolean } }`
- **Security**: DM manages, members can update availability

#### `/campaigns/{campaignId}/maps/{mapId}`

VTT maps for the campaign.

- **Schema**: [map.json](./map.json)
- **Subcollections**: shapes, lights, boundaries, shapePreviews
- **Security**: DM only for write, all members read

#### `/campaigns/{campaignId}/maps/{mapId}/shapes/{shapeId}`

Drawn shapes on maps (circles, rectangles, cones, lines).

- **Structure**: `{ type, x, y, width, height, color, createdBy }`
- **Security**: Members can create own shapes, only creator/DM can delete

#### `/campaigns/{campaignId}/maps/{mapId}/lights/{lightId}`

Dynamic lighting sources on maps.

- **Structure**: `{ x, y, range, color, intensity, type }`
- **Security**: DM only

#### `/campaigns/{campaignId}/maps/{mapId}/boundaries/{boundaryId}`

Movement restrictions (walls, doors).

- **Structure**: `{ points: [[x,y]], type: 'wall'|'door' }`
- **Security**: DM only (invisible to players)

#### `/campaigns/{campaignId}/maps/{mapId}/shapePreviews/{userId}`

Real-time shape preview for collaborative drawing.

- **Structure**: Same as shapes, ephemeral
- **Security**: Users can only write their own preview

#### `/campaigns/{campaignId}/vtt/{mapId}/tokens/{tokenId}`

VTT tokens on maps.

- **Schema**: [token.json](./token.json)
- **Security**: DM full control, players can move own PC tokens

#### `/campaigns/{campaignId}/vtt/{mapId}/pings/{pingId}`

Temporary map markers for pointing.

- **Structure**: `{ x, y, userId, timestamp }`
- **TTL**: Auto-delete after 3 seconds
- **Security**: Members can create own pings

#### `/campaigns/{campaignId}/vtt/{mapId}/fog/{fogDocId}`

Fog of war coverage data.

- **Structure**: `{ revealedAreas: [[x,y,width,height]] }`
- **Security**: DM creates, members can read

#### `/campaigns/{campaignId}/vtt/{mapId}/drawings/{drawingId}`

Pen strokes and arrows drawn on map.

- **Structure**: `{ type, points: [[x,y]], color, width, createdBy }`
- **Security**: Members create own, DM can delete any

#### `/campaigns/{campaignId}/voiceRooms/{roomId}`

Voice chat rooms within campaign.

- **Schema**: [voiceRoom.json](./voiceRoom.json)
- **Subcollections**: participants, recordings
- **Security**: Members can create/join, DM and creator can delete

#### `/campaigns/{campaignId}/voiceRooms/{roomId}/participants/{userId}`

Active voice participants.

- **Structure**: `{ userId, joinedAt, muted, deafened }`
- **Security**: Users can add/remove themselves

#### `/campaigns/{campaignId}/audio/{trackId}`

Ambient audio tracks for campaigns.

- **Structure**: `{ name, url, volume, loop, playing }`
- **Security**: DM only

## Realtime Database (RTDB) Paths

### `/presence/{userId}`

Real-time user presence tracking.

- **Schema**: [presence.json](./presence.json)
- **Structure**: `{ online: boolean, lastSeen: number, displayName, photoURL }`
- **Pattern**: Use `onDisconnect()` to set offline
- **Security**: All can read, users write own

### `/typing/{uid}`

Real-time typing indicators.

- **Schema**: [typing.json](./typing.json)
- **Structure**: `{ typing: boolean, displayName, timestamp, campaignId? }`
- **Pattern**: Debounce (300-500ms), auto-clear after 3s
- **Security**: All can read, users write own

### `/voiceSignaling/{campaignId}/{roomId}/{userId}`

WebRTC signaling data for voice chat.

- **Schema**: See [voiceRoom.json](./voiceRoom.json)
- **Structure**:
  ```
  {
    offers: { [fromUserId]: "SDP offer" },
    answers: { [fromUserId]: "SDP answer" },
    iceCandidates: { [fromUserId]: ["candidate"] },
    presence: { connected: boolean }
  }
  ```
- **Security**: Users write own data, read all in room

## Firebase Storage Buckets

### `/profile-pictures/{userId}/*`

User profile pictures.

- **Max size**: 5MB
- **Types**: images only
- **Security**: User uploads own, all can read

### `/images/{userId}/*`

Chat message images.

- **Max size**: 10MB
- **Types**: images only
- **Security**: User uploads own, all can read

### `/campaigns/{campaignId}/maps/*`

VTT map images.

- **Max size**: 20MB
- **Types**: images only
- **Security**: DM uploads, all campaign members read

### `/campaigns/{campaignId}/tokens/*`

VTT token images.

- **Max size**: 5MB
- **Types**: images only
- **Security**: DM uploads, all campaign members read

### `/characters/{campaignId}/{userId}/*`

Character avatar images.

- **Max size**: 5MB
- **Types**: images only
- **Security**: User uploads own, all authenticated users read

## Data Flow Patterns

### Message Creation

1. User creates message in UI
2. Write to `/campaigns/{id}/channels/{id}/messages/` with `serverTimestamp()`
3. Real-time listener updates UI for all users
4. Typing indicator cleared

### Token Movement

1. Player drags PC token
2. Update `/campaigns/{id}/vtt/{mapId}/tokens/{tokenId}` with new x,y
3. Real-time sync to all campaign members
4. Fog of war auto-reveals if enabled

### Presence Tracking

1. User signs in
2. Write to `/presence/{uid}` with `online: true`
3. Set `onDisconnect()` to `online: false, lastSeen: serverTimestamp()`
4. All users see real-time presence updates

### Friendship Management

1. User sends friend request
2. Create `/friendships/{id}` with `status: 'pending'`
3. Friend accepts: update to `status: 'accepted'`
4. Update both users' `friends[]` arrays via transaction

### Campaign Join Request

1. User requests to join campaign
2. Create `/campaignRequests/{id}` with `status: 'pending'`
3. DM approves: update to `status: 'approved'`
4. Add user to `/campaigns/{id}/members/{userId}`
5. Add campaign to `/userCampaigns/{userId}`

## Composite Indexes

Required composite indexes from `firestore.indexes.json`:

```json
[
  {
    "collection": "campaigns",
    "fields": ["visibility", "status", "lastActivity"]
  },
  { "collection": "campaigns", "fields": ["members", "lastActivityAt"] },
  { "collection": "messages", "fields": ["type", "createdAt"] },
  { "collection": "characters", "fields": ["campaignId", "userId"] },
  { "collection": "characters", "fields": ["uid", "createdAt"] },
  { "collection": "encounters", "fields": ["isTemplate", "createdAt"] }
]
```

## Migration Notes

- **Legacy `/messages/`**: Being phased out, use campaign channels
- **Token structure**: Migrated from `/mapTokens/` to `/vtt/tokens/`
- **Character storage**: Can exist at top-level or campaign subcollection (dual location)

## Related Files

- [firestore.rules](../../firestore.rules) - Security rules
- [firestore.indexes.json](../../firestore.indexes.json) - Composite indexes
- [database.rules.json](../../database.rules.json) - RTDB security rules
- [storage.rules](../../storage.rules) - Storage security rules
