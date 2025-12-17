// New lightweight audio module using pre-recorded mp3 assets.
// Keeps legacy export names for backwards test compatibility.

import messageMp3 from "../assets/audio/message.mp3";
import notificationMp3 from "../assets/audio/notification.mp3";
import tapM4a from "../assets/audio/tap.m4a";

// Internal store
const _audioMap = {};
let _preloaded = false;

function preload() {
  if (_preloaded) return;
  _audioMap.message = new Audio(messageMp3); // sending message
  _audioMap.notification = new Audio(notificationMp3); // incoming message
  _audioMap.tap = new Audio(tapM4a); // typing tap (m4a preferred)
  // Set base volumes (can be tuned later)
  _audioMap.message.volume = 0.6;
  _audioMap.notification.volume = 0.65;
  _audioMap.tap.volume = 0.25;
  _preloaded = true;
}

export const ensureAudioReady = () => {
  try {
    preload();
  } catch (_) {
    /* ignore */
  }
};

function playAudio(key, enabled, { clone = false } = {}) {
  if (!enabled) return;
  preload();
  const base = _audioMap[key];
  if (!base) return;
  try {
    const el = clone ? base.cloneNode(true) : base;
    if (!clone) {
      el.currentTime = 0;
    }
    const p = el.play();
    if (p && typeof p.catch === "function") p.catch(() => {}); // swallow autoplay errors
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn("[sound] play error", key, e);
    }
  }
}

// Public modern API
export const playSendMessageSound = (enabled) => playAudio("message", enabled);
export const playReceiveMessageSound = (enabled) =>
  playAudio("notification", enabled);
export const playTapSound = (enabled) =>
  playAudio("tap", enabled, { clone: true });

// Continuous typing tap loop (lightweight scheduler)
let _typingLoop = null;
let _typingLoopActive = false;
let _typingLoopVolume = 0.18; // default quieter than single tap (previous 0.25 base, further reduced)

export function startTypingTapLoop(
  enabled,
  { minDelay = 100, maxDelay = 300, volume = 0.18 } = {}
) {
  if (!enabled) return;
  preload();
  _typingLoopVolume = volume;
  stopTypingTapLoop();
  _typingLoopActive = true;
  const schedule = () => {
    if (!_typingLoopActive) return;
    // adjust volume each tick (clone uses base element's volume)
    if (_audioMap.tap) _audioMap.tap.volume = _typingLoopVolume;
    playTapSound(true);
    const delay = Math.random() * (maxDelay - minDelay) + minDelay;
    _typingLoop = setTimeout(schedule, delay);
  };
  schedule();
}

export function stopTypingTapLoop() {
  _typingLoopActive = false;
  if (_typingLoop) {
    clearTimeout(_typingLoop);
    _typingLoop = null;
  }
}

// Legacy compatibility exports (old code/tests)
export const playNotificationSound = playSendMessageSound; // previously used for "send"
export const playTypingSound = (enabled) => playTapSound(enabled);
// Re-export loop controls for hooks/components
export const beginTypingLoop = startTypingTapLoop;
export const endTypingLoop = stopTypingTapLoop;
