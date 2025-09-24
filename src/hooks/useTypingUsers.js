import React from 'react';
import { ref as databaseRef, onValue } from 'firebase/database';

/**
 * useTypingUsers
 * Subscribes to a Realtime Database path (default 'typing') and returns
 * an array of other users currently typing (excludes current user).
 *
 * @param {Object} params
 * @param {import('firebase/database').Database} params.rtdb - Realtime Database instance
 * @param {string|undefined} params.currentUid - UID of current authenticated user
 * @param {string} [params.path='typing'] - Path to listen on
 * @returns {Array<{ uid: string, displayName: string }>} typing users list
 */
export function useTypingUsers({ rtdb, currentUid, path = 'typing' }) {
  const [typingUsers, setTypingUsers] = React.useState([]);

  React.useEffect(() => {
    if (!rtdb) return; // No database available
    const typingRef = databaseRef(rtdb, path);
    const unsubscribe = onValue(typingRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setTypingUsers([]);
        return;
      }
      const list = Object.entries(data)
        .filter(([uid, info]) => uid !== currentUid && info && info.typing)
        .map(([uid, info]) => ({ uid, displayName: info.displayName || 'Anonymous' }));
      setTypingUsers(list);
    }, (error) => {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[useTypingUsers] onValue error:', error);
      }
      setTypingUsers([]);
    });
    return () => unsubscribe();
  }, [rtdb, currentUid, path]);

  return typingUsers;
}

export default useTypingUsers;