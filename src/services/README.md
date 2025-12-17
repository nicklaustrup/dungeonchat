# Services

This directory contains the service layer for DungeonChat, providing abstractions over Firebase operations and business logic.

## Structure

```
services/
├── firebase.js           # Firebase initialization and config
├── campaign/             # Campaign CRUD operations
├── vtt/                  # VTT services (maps, tokens, fog, lighting)
├── cache/                # Firebase caching layer
├── presence/             # User presence and typing indicators
├── friendships/          # Friend management
└── profiles/             # User profile operations
```

## Key Services

### `firebase.js`

- **Purpose**: Initialize Firebase app and export configured services
- **Exports**: `auth`, `firestore`, `storage`, `database` (RTDB), `analytics`
- **Usage**: Import Firebase services from this file throughout the app
- **Note**: Do not modify without guidance; config migration to `.env.local` planned

### `campaign/`

- **Purpose**: Campaign creation, updates, member management
- **Key Functions**:
  - `createCampaign(data)` - Create new campaign
  - `updateCampaign(campaignId, data)` - Update campaign
  - `addMember(campaignId, userId)` - Add member (uses transaction)
  - `removeMember(campaignId, userId)` - Remove member (uses transaction)
- **Pattern**: Always use transactions for member list updates

### `vtt/`

- **Purpose**: Virtual tabletop operations (maps, tokens, fog of war, lighting)
- **Submodules**:
  - `mapService.js` - Map CRUD operations
  - `tokenService.js` - Token positioning and management
  - `fogService.js` - Fog of war operations
  - `lightingService.js` - Dynamic lighting calculations
- **Pattern**: Real-time subscriptions for multiplayer sync

### `cache/`

- **Purpose**: Caching layer for Firestore data to reduce reads
- **Key Functions**:
  - `getCachedDocument(path)` - Get document with cache
  - `invalidateCache(path)` - Clear cache entry
- **Pattern**: Used by hooks like `useCampaignCache`

### `presence/`

- **Purpose**: Real-time presence and typing indicators
- **Database**: Uses RTDB (not Firestore) for ephemeral state
- **Key Functions**:
  - `setUserPresence(userId, online)` - Update presence
  - `setTypingIndicator(userId, typing)` - Set typing status
- **Pattern**: Always use `onDisconnect()` for cleanup

### `profiles/`

- **Purpose**: User profile management
- **Key Functions**:
  - `createUserProfile(uid, data)` - Create profile after auth
  - `updateUserProfile(uid, updates)` - Update profile
  - `checkUsernameAvailability(username)` - Check unique username
- **Pattern**: Username uniqueness checked via Cloud Function

## Common Patterns

### Transaction Usage

Always use transactions for concurrent updates:

```javascript
import { runTransaction } from 'firebase/firestore';

await runTransaction(firestore, async (transaction) => {
  const campaignRef = doc(firestore, 'campaigns', campaignId);
  const campaignDoc = await transaction.get(campaignRef);
  const members = campaignDoc.data().members;
  transaction.update(campaignRef, { members: [...members, newUserId] });
});
```

### Server Timestamps

Always use server timestamps for createdAt/updatedAt:

```javascript
import { serverTimestamp } from 'firebase/firestore';

await setDoc(docRef, {
  ...data,
  createdAt: serverTimestamp(),
});
```

### Error Handling

All services should include error handling:

```javascript
try {
  await firestoreOperation();
} catch (error) {
  console.error('Operation failed:', error);
  throw error; // Re-throw for component handling
}
```

### RTDB Presence Pattern

Use onDisconnect for cleanup:

```javascript
import { ref, set, onDisconnect } from 'firebase/database';

const presenceRef = ref(database, `presence/${uid}`);
await set(presenceRef, { online: true });
await onDisconnect(presenceRef).set({ online: false });
```

## Testing

Services should be tested with Firebase emulators:

```bash
firebase emulators:start
npm test -- src/services/
```

## Security Considerations

- Never expose Firebase config keys in this directory
- All write operations should have corresponding security rules
- Validate input data before writing to Firestore
- Use transactions for any concurrent updates
- Check user permissions before sensitive operations

## Adding a New Service

1. Create service file: `services/<domain>/<serviceName>.js`
2. Export named functions (avoid default exports)
3. Add error handling and logging
4. Update this README with service description
5. Add corresponding security rules in `firestore.rules`
6. Write tests with emulators
7. Update `docs/schemas/` if new document types added
