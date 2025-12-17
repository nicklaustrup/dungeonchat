import React from "react";
import { setTyping, refreshPresence } from "../services/presenceService";
import { beginTypingLoop, endTypingLoop } from "../utils/sound";

/**
 * Manages typing indicator + presence refresh with throttled self typing sound.
 */
export function useTypingPresence({ rtdb, user, soundEnabled }) {
  const lastTypingStateRef = React.useRef(false);
  const inactivityTimerRef = React.useRef(null);
  const silenceStopTimerRef = React.useRef(null); // quick stop for tap loop
  const typingLoopRunningRef = React.useRef(false);

  const updateTyping = React.useCallback(
    (isTyping) => {
      if (!user) return;
      if (lastTypingStateRef.current === isTyping) return; // avoid redundant writes
      lastTypingStateRef.current = isTyping;
      setTyping(rtdb, {
        uid: user.uid,
        displayName: user.displayName,
        typing: isTyping,
      });
    },
    [rtdb, user]
  );

  const handleInputActivity = React.useCallback(
    (textLength) => {
      if (!user) return;
      const isTyping = textLength > 0;
      updateTyping(isTyping); // updates lastTypingStateRef.current internally
      refreshPresence(rtdb, { uid: user.uid });

      // Clear previous inactivity timer
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);

      if (isTyping) {
        // Auto-clear typing after 6s of inactivity
        inactivityTimerRef.current = setTimeout(() => {
          updateTyping(false);
          endTypingLoop();
          typingLoopRunningRef.current = false;
        }, 6000);
      } else {
        // If text length is 0, immediately stop typing indicator
        updateTyping(false);
        endTypingLoop();
        typingLoopRunningRef.current = false;
        return; // Exit early to avoid sound logic
      }

      // Continuous typing loop (start when user starts typing, stop on inactivity timeout)
      if (soundEnabled) {
        // Start loop on any key activity if not running
        if (isTyping && !typingLoopRunningRef.current) {
          beginTypingLoop(true, { minDelay: 100, maxDelay: 300, volume: 0.14 });
          typingLoopRunningRef.current = true;
        }
        // Quick stop scheduling: if no new keystroke within 100-300ms, stop loop (pause effect)
        if (silenceStopTimerRef.current)
          clearTimeout(silenceStopTimerRef.current);
        const delay = 100 + Math.random() * 200; // 100-300ms
        silenceStopTimerRef.current = setTimeout(() => {
          // Only stop if we haven't received more characters (handleInputActivity not called again)
          if (typingLoopRunningRef.current && lastTypingStateRef.current) {
            // Pause loop but keep typing presence state until inactivity timer clears
            endTypingLoop();
            typingLoopRunningRef.current = false;
          }
        }, delay);
        if (!isTyping && typingLoopRunningRef.current) {
          // if user erased all text, stop immediately
          endTypingLoop();
          typingLoopRunningRef.current = false;
        }
      }
    },
    [user, rtdb, soundEnabled, updateTyping]
  );

  React.useEffect(
    () => () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (silenceStopTimerRef.current)
        clearTimeout(silenceStopTimerRef.current);
      endTypingLoop();
    },
    []
  );

  return { handleInputActivity };
}
