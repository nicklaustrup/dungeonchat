import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { ref as databaseRef, onValue } from 'firebase/database';
import { useFirebase } from './FirebaseContext';

// Presence states: 'online' | 'away' | 'offline'
const PresenceContext = createContext(null);

export function PresenceProvider({ children, awayAfterSeconds: propAway = 300 }) {
  const { rtdb, auth } = useFirebase();
  const [presenceMap, setPresenceMap] = useState(new Map()); // uid -> { state, lastSeen, online }
  const [typingMap, setTypingMap] = useState(() => new Map()); // uid -> true
  const subscribed = useRef(false);
  const typingSubscribed = useRef(false);
  const lastUpdateRef = useRef(0);
  // Lazy individual listeners if root access restricted by rules
  const perUserPresenceSubs = useRef(new Map()); // uid -> unsubscribe
  const perUserTypingSubs = useRef(new Map()); // uid -> unsubscribe

  const awayAfterSeconds = propAway;

  // Subscribe to presence snapshots
  useEffect(() => {
    if (!rtdb || subscribed.current) return;
    subscribed.current = true;
    const presenceRef = databaseRef(rtdb, 'presence');
    const off = onValue(presenceRef, (snap) => {
      const val = snap.val() || {};
      const now = Date.now();
      const nextMap = new Map();
      Object.entries(val).forEach(([uid, data]) => {
        const rawLast = data.lastSeen;
        const lastSeen = typeof rawLast === 'number' ? rawLast : (rawLast?.toMillis?.() || 0);
        const ageSec = (now - lastSeen) / 1000;
        let state = 'offline';
        if (data.online) {
          state = ageSec > awayAfterSeconds ? 'away' : 'online';
        } else if (ageSec < awayAfterSeconds) {
          state = 'away';
        }
        nextMap.set(uid, { state, lastSeen, online: !!data.online });
      });
      const selfUid = auth?.currentUser?.uid;
      if (selfUid && !nextMap.has(selfUid)) {
        nextMap.set(selfUid, { state: 'online', lastSeen: Date.now(), online: true });
      }
      lastUpdateRef.current = now;
      setPresenceMap(nextMap);
    });
    return () => off();
  }, [rtdb, awayAfterSeconds, auth]);

  // Aggregate typing indicators in one listener
  useEffect(() => {
    if (!rtdb || typingSubscribed.current) return;
    typingSubscribed.current = true;
    const typingRef = databaseRef(rtdb, 'typing');
    const off = onValue(typingRef, (snap) => {
      const val = snap.val() || {};
      const next = new Map();
      Object.entries(val).forEach(([uid, data]) => {
        if (data && data.typing) next.set(uid, true);
      });
      setTypingMap(next);
    });
    return () => off();
  }, [rtdb]);

  // Periodic recompute for away transitions without new RTDB writes
  useEffect(() => {
    const interval = setInterval(() => {
      setPresenceMap(prev => {
        const now = Date.now();
        let changed = false;
        const updated = new Map();
        prev.forEach((info, uid) => {
          const ageSec = (now - info.lastSeen) / 1000;
            let desired = info.state;
            if (info.online) {
              desired = ageSec > awayAfterSeconds ? 'away' : 'online';
            } else {
              desired = ageSec > awayAfterSeconds ? 'offline' : 'away';
            }
            if (desired !== info.state) {
              changed = true;
              updated.set(uid, { ...info, state: desired });
            } else {
              updated.set(uid, info);
            }
        });
        return changed ? updated : prev;
      });
    }, 30000); // 30s tick
    return () => clearInterval(interval);
  }, [awayAfterSeconds]);

  const getPresence = (uid) => {
    if (!uid) return { state: 'offline', lastSeen: 0, online: false };
    // If entry missing and we have rtdb, attempt lazy subscription (in case root read denied)
    if (!presenceMap.has(uid) && rtdb && !perUserPresenceSubs.current.has(uid)) {
      const pRef = databaseRef(rtdb, `presence/${uid}`);
      const off = onValue(pRef, snap => {
        const data = snap.val();
        if (!data) return;
        setPresenceMap(prev => {
          const next = new Map(prev);
            const rawLast = data.lastSeen;
            const lastSeen = typeof rawLast === 'number' ? rawLast : (rawLast?.toMillis?.() || 0);
            const now = Date.now();
            const ageSec = (now - lastSeen)/1000;
            let state = 'offline';
            if (data.online) state = ageSec > awayAfterSeconds ? 'away' : 'online';
            else if (ageSec < awayAfterSeconds) state = 'away';
            next.set(uid, { state, lastSeen, online: !!data.online });
          return next;
        });
      }, { onlyOnce: false });
      perUserPresenceSubs.current.set(uid, off);
    }
    if (!typingMap.has(uid) && rtdb && !perUserTypingSubs.current.has(uid)) {
      const tRef = databaseRef(rtdb, `typing/${uid}`);
      const offT = onValue(tRef, snap => {
        const data = snap.val();
        setTypingMap(prev => {
          const next = new Map(prev);
          if (data && data.typing) next.set(uid, true); else next.delete(uid);
          return next;
        });
      });
      perUserTypingSubs.current.set(uid, offT);
    }
    const base = presenceMap.get(uid) || (auth?.currentUser?.uid === uid ? { state: 'online', lastSeen: Date.now(), online: true } : { state: 'offline', lastSeen: 0, online: false });
    if (typingMap.has(uid)) {
      return { ...base, state: 'online', typing: true };
    }
    return base;
  };

  return (
    <PresenceContext.Provider value={{ presenceMap, getPresence, awayAfterSeconds, typingMap }}>
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence(uid) {
  const ctx = useContext(PresenceContext);
  if (!ctx) throw new Error('usePresence must be used within PresenceProvider');
  return ctx.getPresence(uid);
}

export function usePresenceMeta() {
  const ctx = useContext(PresenceContext);
  if (!ctx) throw new Error('usePresenceMeta must be used within PresenceProvider');
  return ctx;
}

export default PresenceContext;
