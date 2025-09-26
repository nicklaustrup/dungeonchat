// Presence & typing related realtime database helpers
import { ref as databaseRef, set as rtdbSet, update as rtdbUpdate, serverTimestamp as rtdbServerTimestamp } from 'firebase/database';

export function setTyping(rtdb, { uid, displayName, typing }) {
  if (!uid) return;
  const userTypingRef = databaseRef(rtdb, `typing/${uid}`);
  rtdbSet(userTypingRef, {
    typing: !!typing,
    displayName: displayName || 'Anonymous',
    timestamp: rtdbServerTimestamp()
  });
}

export function refreshPresence(rtdb, { uid }) {
  if (!uid) return;
  const presenceRef = databaseRef(rtdb, `presence/${uid}`);
  rtdbUpdate(presenceRef, { online: true, lastSeen: Date.now() }).catch(() => {});
}
