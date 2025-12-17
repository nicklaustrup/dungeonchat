import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { ref as databaseRef, onValue } from "firebase/database";
import { useFirebase } from "./FirebaseContext";

// Presence states: 'online' | 'away' | 'offline'
export const PresenceContext = createContext(null);

export function PresenceProvider({
  children,
  awayAfterSeconds: propAway = 300,
}) {
  const { rtdb, auth } = useFirebase();
  const [presenceMap, setPresenceMap] = useState(new Map()); // uid -> { state, lastSeen, online }
  const [typingMap, setTypingMap] = useState(() => new Map()); // uid -> true
  const subscribed = useRef(false);
  const typingSubscribed = useRef(false);
  const lastUpdateRef = useRef(0);
  const updateDebounceRef = useRef(null);
  // Lazy individual listeners if root access restricted by rules
  const perUserPresenceSubs = useRef(new Map()); // uid -> unsubscribe
  const perUserTypingSubs = useRef(new Map()); // uid -> unsubscribe

  const awayAfterSeconds = propAway;

  // Memoized state computation to avoid unnecessary Map operations
  const computePresenceState = useCallback((data, now, awayThreshold) => {
    const rawLast = data.lastSeen;
    const lastSeen =
      typeof rawLast === "number" ? rawLast : rawLast?.toMillis?.() || 0;
    const ageSec = (now - lastSeen) / 1000;
    let state = "offline";
    if (data.online) {
      state = ageSec > awayThreshold ? "away" : "online";
    } else if (ageSec < awayThreshold) {
      state = "away";
    }
    return { state, lastSeen, online: !!data.online };
  }, []);

  // Debounced presence map update to reduce re-renders
  const debouncedSetPresenceMap = useCallback((updateFn) => {
    if (updateDebounceRef.current) {
      clearTimeout(updateDebounceRef.current);
    }
    updateDebounceRef.current = setTimeout(() => {
      setPresenceMap(updateFn);
      updateDebounceRef.current = null;
    }, 50); // 50ms debounce
  }, []);

  // Subscribe to presence snapshots with optimized Map operations
  useEffect(() => {
    if (!rtdb || subscribed.current) return;
    subscribed.current = true;
    const presenceRef = databaseRef(rtdb, "presence");
    const off = onValue(presenceRef, (snap) => {
      const val = snap.val() || {};
      const now = Date.now();

      // Optimized Map creation - pre-calculate size
      const entries = Object.entries(val);
      const nextMap = new Map();

      // Batch process all presence updates
      for (const [uid, data] of entries) {
        const presenceState = computePresenceState(data, now, awayAfterSeconds);
        nextMap.set(uid, presenceState);
      }

      // Ensure self presence
      const selfUid = auth?.currentUser?.uid;
      if (selfUid && !nextMap.has(selfUid)) {
        nextMap.set(selfUid, { state: "online", lastSeen: now, online: true });
      }

      lastUpdateRef.current = now;
      debouncedSetPresenceMap(() => nextMap);
    });
    return () => off();
  }, [
    rtdb,
    awayAfterSeconds,
    auth,
    computePresenceState,
    debouncedSetPresenceMap,
  ]);

  // Aggregate typing indicators in one listener with debouncing
  useEffect(() => {
    if (!rtdb || typingSubscribed.current) return;
    typingSubscribed.current = true;
    const typingRef = databaseRef(rtdb, "typing");
    const off = onValue(typingRef, (snap) => {
      const val = snap.val() || {};
      const next = new Map();

      // Batch process typing updates
      for (const [uid, data] of Object.entries(val)) {
        if (data && data.typing) {
          next.set(uid, true);
        }
      }

      setTypingMap((prev) => {
        // Only update if typing state actually changed
        if (prev.size !== next.size) return next;
        for (const uid of next.keys()) {
          if (!prev.has(uid)) return next;
        }
        for (const uid of prev.keys()) {
          if (!next.has(uid)) return next;
        }
        return prev; // No changes, return same reference
      });
    });
    return () => off();
  }, [rtdb]);

  // Periodic recompute for away transitions with optimization
  useEffect(() => {
    const interval = setInterval(() => {
      setPresenceMap((prev) => {
        const now = Date.now();
        let changed = false;
        const updated = new Map();

        // Optimized presence state update
        for (const [uid, info] of prev) {
          const ageSec = (now - info.lastSeen) / 1000;
          let desired = info.state;
          if (info.online) {
            desired = ageSec > awayAfterSeconds ? "away" : "online";
          } else {
            desired = ageSec > awayAfterSeconds ? "offline" : "away";
          }
          if (desired !== info.state) {
            changed = true;
            updated.set(uid, { ...info, state: desired });
          } else {
            updated.set(uid, info);
          }
        }
        return changed ? updated : prev;
      });
    }, 30000); // 30s tick
    return () => clearInterval(interval);
  }, [awayAfterSeconds]);

  const ensureSubscribed = useCallback(
    (uid) => {
      if (!uid || !rtdb) return;
      if (!perUserPresenceSubs.current.has(uid)) {
        const pRef = databaseRef(rtdb, `presence/${uid}`);
        const off = onValue(pRef, (snap) => {
          const data = snap.val();
          if (!data) return;
          const now = Date.now();
          const presenceState = computePresenceState(
            data,
            now,
            awayAfterSeconds
          );

          setPresenceMap((prev) => {
            const next = new Map(prev);
            next.set(uid, presenceState);
            return next;
          });
        });
        perUserPresenceSubs.current.set(uid, off);
      }
      if (!perUserTypingSubs.current.has(uid)) {
        const tRef = databaseRef(rtdb, `typing/${uid}`);
        const offT = onValue(tRef, (snap) => {
          const data = snap.val();
          setTypingMap((prev) => {
            const next = new Map(prev);
            const wasTyping = prev.has(uid);
            const isTyping = data && data.typing;

            if (isTyping) {
              next.set(uid, true);
            } else {
              next.delete(uid);
            }

            // Only return new Map if there's actually a change
            if (wasTyping !== isTyping) {
              return next;
            }
            return prev;
          });
        });
        perUserTypingSubs.current.set(uid, offT);
      }
    },
    [rtdb, awayAfterSeconds, computePresenceState]
  );

  const getPresence = useCallback(
    (uid) => {
      if (!uid) return { state: "offline", lastSeen: 0, online: false };
      const base =
        presenceMap.get(uid) ||
        (auth?.currentUser?.uid === uid
          ? { state: "online", lastSeen: Date.now(), online: true }
          : { state: "offline", lastSeen: 0, online: false });
      if (typingMap.has(uid)) {
        return { ...base, state: "online", typing: true };
      }
      return base;
    },
    [presenceMap, typingMap, auth?.currentUser?.uid]
  );

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      presenceMap,
      getPresence,
      ensureSubscribed,
      awayAfterSeconds,
      typingMap,
    }),
    [presenceMap, getPresence, ensureSubscribed, awayAfterSeconds, typingMap]
  );

  return (
    <PresenceContext.Provider value={contextValue}>
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence(uid) {
  const ctx = useContext(PresenceContext);
  if (!ctx) throw new Error("usePresence must be used within PresenceProvider");
  const { ensureSubscribed, getPresence } = ctx;
  // Subscribe lazily after first render
  React.useEffect(() => {
    if (uid) ensureSubscribed(uid);
  }, [uid, ensureSubscribed]);
  return getPresence(uid);
}

export function usePresenceMeta() {
  const ctx = useContext(PresenceContext);
  if (!ctx)
    throw new Error("usePresenceMeta must be used within PresenceProvider");
  return ctx;
}

export default PresenceContext;
