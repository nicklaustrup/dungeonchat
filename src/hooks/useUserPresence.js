import { useEffect, useState } from 'react';
import { ref as databaseRef, onValue } from 'firebase/database';
import { useFirebase } from '../services/FirebaseContext';

// Internal registries to ensure only one RTDB subscription per uid
const subscribers = new Map(); // uid -> Set<setOnlineFn>
const unsubscribeMap = new Map(); // uid -> unsubscribe function
const lastStatusMap = new Map(); // uid -> boolean (online)

export default function useUserPresence(uid) {
  const { rtdb } = useFirebase();
  const [online, setOnline] = useState(false);

  useEffect(() => {
    if (!uid || !rtdb) return;    
    let setFns = subscribers.get(uid);
    if (!setFns) {
      setFns = new Set();
      subscribers.set(uid, setFns);
    }
    setFns.add(setOnline);

    if (!unsubscribeMap.has(uid)) {
      const presenceRef = databaseRef(rtdb, `presence/${uid}`);
      const unsubscribe = onValue(presenceRef, (snapshot) => {
        const data = snapshot.val();
        const isOnline = !!data?.online;
        lastStatusMap.set(uid, isOnline);
        const currentSubs = subscribers.get(uid);
        if (currentSubs) {
          currentSubs.forEach(fn => fn(isOnline));
        }
      });
      unsubscribeMap.set(uid, unsubscribe);
    }

    // Immediately hydrate with cached status if available (prevents 'offline' flash)
    if (lastStatusMap.has(uid)) {
      setOnline(lastStatusMap.get(uid));
    }

    return () => {
      const currentSet = subscribers.get(uid);
      if (currentSet) {
        currentSet.delete(setOnline);
        if (currentSet.size === 0) {
          const unsubscribe = unsubscribeMap.get(uid);
            if (unsubscribe) unsubscribe();
          unsubscribeMap.delete(uid);
          subscribers.delete(uid);
          lastStatusMap.delete(uid);
        }
      }
    };
  }, [uid, rtdb]);

  return online;
}
