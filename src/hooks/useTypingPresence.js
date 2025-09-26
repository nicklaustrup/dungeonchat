import React from 'react';
import { setTyping, refreshPresence } from '../services/presenceService';
import { playTypingSound } from '../utils/sound';

/**
 * Manages typing indicator + presence refresh with throttled self typing sound.
 */
export function useTypingPresence({ rtdb, user, soundEnabled }) {
  const lastSelfTapRef = React.useRef(0);
  const lastTypingStateRef = React.useRef(false);
  const inactivityTimerRef = React.useRef(null);

  const updateTyping = React.useCallback((isTyping) => {
    if (!user) return;
    if (lastTypingStateRef.current === isTyping) return; // avoid redundant writes
    lastTypingStateRef.current = isTyping;
    setTyping(rtdb, { uid: user.uid, displayName: user.displayName, typing: isTyping });
  }, [rtdb, user]);

  const handleInputActivity = React.useCallback((textLength) => {
    if (!user) return;
    const isTyping = textLength > 0;
    updateTyping(isTyping);
    refreshPresence(rtdb, { uid: user.uid });

    // Clear previous inactivity timer
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    // Auto-clear typing after 6s of inactivity
    inactivityTimerRef.current = setTimeout(() => {
      updateTyping(false);
    }, 6000);

    // Typing sound logic (throttled)
    if (!soundEnabled) return;
    const now = Date.now();
    if (textLength === 1) {
      if (now - lastSelfTapRef.current > 800) {
        playTypingSound(true, { self: true, withReverb: true });
        lastSelfTapRef.current = now;
      }
    } else if (textLength > 1 && now - lastSelfTapRef.current > 6000) {
      playTypingSound(true, { self: true, withReverb: true });
      lastSelfTapRef.current = now;
    }
  }, [user, rtdb, soundEnabled, updateTyping]);

  React.useEffect(() => () => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
  }, []);

  return { handleInputActivity };
}
