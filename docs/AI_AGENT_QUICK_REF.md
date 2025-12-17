# AI Agent Quick Reference

This guide provides fast answers to common questions and tasks for AI coding agents working on DungeonChat.

## Quick Answers

### "Where do I find...?"

- **Firebase config**: `src/services/firebase.js`
- **Security rules**: `firestore.rules`, `database.rules.json`, `storage.rules`
- **Chat UI**: `src/components/ChatRoom/ChatRoom.js`
- **VTT**: `src/components/VTT/VTTCanvas.js`
- **Scroll logic**: `src/hooks/useAutoScrollV2.js` and `src/hooks/useInfiniteScrollTop.js`
- **Cloud Functions**: `functions/index.js`
- **Data schemas**: `docs/schemas/*.json`
- **Tests**: `src/**/__tests__/` directories
- **Planned work**: `TODO.md`

### "How do I...?"

#### Add a new message feature

1. Update `docs/schemas/message.json` schema
2. Modify write logic in `src/components/ChatInput/` or relevant service
3. Update `firestore.rules` to allow new fields
4. Update `src/components/ChatRoom/Message.js` to display feature
5. Add tests in `src/components/ChatRoom/__tests__/`
6. Test with emulators: `firebase emulators:start`

#### Add a new campaign feature

1. Create service in `src/services/campaign/`
2. Add Firestore subcollection under `/campaigns/{id}/`
3. Update `firestore.rules` with security rules
4. Create React component in `src/components/Campaign/`
5. Import in `CampaignDashboard.js`
6. Write tests
7. Update `TODO.md`

#### Add a new hook

1. Create `src/hooks/use<Name>.js`
2. Follow patterns in `src/hooks/README.md`
3. Add cleanup in useEffect return
4. Create `src/hooks/__tests__/use<Name>.test.js`
5. Document in `src/hooks/README.md`

#### Add a VTT feature

1. Review `docs/VTT_README.md` (if exists)
2. Add service in `src/services/vtt/`
3. Create or modify component in `src/components/VTT/`
4. Add hook in `src/hooks/` if needed
5. Update security rules
6. Test multiplayer sync

#### Update security rules

1. Edit `firestore.rules`, `database.rules.json`, or `storage.rules`
2. Test with emulators: `firebase emulators:start`
3. Deploy: `firebase deploy --only firestore:rules` (or database, storage)
4. Validate no users are blocked from legitimate operations

### "What tests should I run?"

- **After hook changes**: `npm test -- src/hooks/__tests__/`
- **After chat changes**: `npm test -- src/components/ChatRoom/__tests__/`
- **After VTT changes**: `npm test -- src/components/VTT/__tests__/`
- **Before commit**: `npm run test:fast`
- **CI/full suite**: `npm run test:ci`
- **Single test file**: `npm test -- <path/to/test.js>`

### "What's the data model for...?"

- **Full architecture**: `docs/schemas/DATA_ARCHITECTURE.md`
- **Campaigns**: `docs/schemas/campaign.json`
- **User profiles**: `docs/schemas/userProfile.json`
- **Messages**: `docs/schemas/message.json`
- **Characters**: `docs/schemas/character.json`
- **Tokens**: `docs/schemas/token.json`
- **Maps**: `docs/schemas/map.json`
- **Friendships**: `docs/schemas/friendship.json`
- **Campaign requests**: `docs/schemas/campaignRequest.json`
- **Voice rooms**: `docs/schemas/voiceRoom.json`
- **Presence (RTDB)**: `docs/schemas/presence.json`
- **Typing (RTDB)**: `docs/schemas/typing.json`

## Common Patterns

### Firestore Write with Transaction

```javascript
import { runTransaction, doc } from 'firebase/firestore';
import { firestore } from 'src/services/firebase';

await runTransaction(firestore, async (transaction) => {
  const docRef = doc(firestore, 'collection', 'docId');
  const docSnap = await transaction.get(docRef);
  const currentData = docSnap.data();
  transaction.update(docRef, {
    field: [...currentData.field, newItem],
  });
});
```

### Real-time Subscription in Hook

```javascript
import { useEffect, useState } from 'react';
import { onSnapshot, collection } from 'firebase/firestore';
import { firestore } from 'src/services/firebase';

export function useData(path) {
  const [data, setData] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, path), (snapshot) => {
      setData(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    });

    return () => unsubscribe();
  }, [path]);

  return data;
}
```

### RTDB Presence Pattern

```javascript
import { ref, set, onDisconnect } from 'firebase/database';
import { database } from 'src/services/firebase';

const presenceRef = ref(database, `presence/${uid}`);
await set(presenceRef, {
  online: true,
  lastSeen: Date.now(),
});
await onDisconnect(presenceRef).set({
  online: false,
  lastSeen: Date.now(),
});
```

### Component with Error Boundary

```javascript
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error }) {
  return <div>Error: {error.message}</div>;
}

function MyComponent() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <FeatureComponent />
    </ErrorBoundary>
  );
}
```

## Search Commands

```bash
# Find all message-related code
rg "messages" src/ -n

# Find Firestore writes
rg "setDoc|updateDoc|addDoc|deleteDoc" src/ -n

# Find all hooks
ls src/hooks/use*.js

# Find component usage
rg "import.*ChatRoom" src/ -n

# Find security rule
rg "match /campaigns" firestore.rules -A 10

# Find all TODOs in code
rg "TODO|FIXME" src/ -n
```

## Debugging

### Firebase Emulator Issues

```bash
# Clear emulator data
firebase emulators:start --import=./emulator-data --export-on-exit

# Check emulator UI
# Open http://localhost:4000 in browser
```

### React DevTools

- Install React DevTools browser extension
- Use Components tab to inspect state/props
- Use Profiler tab to find performance issues

### Common Errors

**"Permission denied" in Firestore**

- Check `firestore.rules` for the collection
- Ensure user is authenticated
- Verify document path is correct
- Test rules with emulator

**"Cannot read property of undefined"**

- Add optional chaining: `data?.field`
- Add loading state while data fetches
- Check that Firebase subscription is working

**Infinite re-renders**

- Check useEffect dependencies
- Ensure callbacks are wrapped in useCallback
- Verify state updates don't trigger themselves

**Memory leaks**

- Ensure all subscriptions have cleanup (return unsubscribe)
- Clear timers in useEffect cleanup
- Remove event listeners in cleanup

## Safety Checklist

Before committing changes:

- [ ] Updated security rules if data model changed
- [ ] Added/updated tests for new functionality
- [ ] No hardcoded secrets or API keys
- [ ] All useEffect hooks have cleanup functions
- [ ] Error handling and loading states implemented
- [ ] Tested with Firebase emulators
- [ ] Ran `npm run lint` and fixed issues
- [ ] Ran relevant test suite
- [ ] Updated documentation (README, component comments)
- [ ] Updated `TODO.md` if completing planned work

## Getting Help

1. **Check existing code**: Search for similar patterns in codebase
2. **Read docs**: Check `docs/` folder for architecture specs
3. **Review tests**: Tests often show expected usage patterns
4. **Check TODO.md**: May have context on planned features
5. **Review security rules**: Understand data access patterns
6. **Firebase docs**: https://firebase.google.com/docs

## Performance Tips

- Use `React.memo` for expensive components
- Use `useMemo` for expensive calculations
- Use `useCallback` for callbacks passed to children
- Limit Firestore queries with `.limit()`
- Use pagination for large collections
- Cache frequently accessed data
- Debounce rapid updates (typing, scroll)
- Use RTDB for ephemeral state (presence, typing)

## Deployment

```bash
# Deploy everything
firebase deploy

# Deploy specific targets
firebase deploy --only hosting
firebase deploy --only firestore:rules
firebase deploy --only functions
firebase deploy --only functions:functionName

# Preview before deploy
firebase hosting:channel:deploy preview
```
