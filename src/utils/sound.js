// --- Audio Core (singleton + unlock + master gain) ---
let _audioCtx = null;
let _masterGain = null;
let _unlocked = false;
// let _debugId = 0; // removed to satisfy ESLint (was unused)

function createContext() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  const ctx = new AC();
  _masterGain = ctx.createGain();
  _masterGain.gain.value = 0.9; // global headroom
  _masterGain.connect(ctx.destination);
  setupUnlock(ctx);
  return ctx;
}

function getCtx() {
  if (_audioCtx) return _audioCtx;
  _audioCtx = createContext();
  return _audioCtx;
}

function setupUnlock(ctx) {
  if (_unlocked) return;
  const unlock = () => {
    if (!ctx) return;
    if (ctx.state === 'suspended') { ctx.resume().catch(()=>{}); }
    // Play a tiny silent buffer to satisfy iOS
    const buffer = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buffer; src.connect(ctx.destination); src.start(0);
    _unlocked = true;
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
    window.removeEventListener('touchstart', unlock);
  };
  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', unlock, { passive: true });
  window.addEventListener('touchstart', unlock, { passive: true });
}

export const ensureAudioReady = () => { getCtx(); };

export const playNotificationSound = (soundEnabled) => {
  if (!soundEnabled) return;
  try {
    const audioContext = getCtx();
    if (!audioContext) return;
    if (audioContext.state === 'suspended') audioContext.resume().catch(()=>{});
  const now = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(540, now + 0.28);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.35, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.5);
    osc.connect(gain); gain.connect(_masterGain || audioContext.destination);
    osc.start(now);
    osc.stop(now + 0.52);
    // cleanup handled by GC when nodes end
  } catch (error) {
    console.error('❌ Error playing sound:', error);
  }
};

// Soft typing indication sound. Options:
//  - multiple: boolean (play two staggered blips if true)
//  - count: number of new typers (can influence pitch spread)
export const playTypingSound = (soundEnabled, { multiple = false, count = 1, self = false, withReverb = true } = {}) => {
  if (!soundEnabled) return;
  try {
    const audioContext = getCtx();
    if (!audioContext) return;
    if (audioContext.state === 'suspended') audioContext.resume().catch(()=>{});

    // Prepare (or reuse) a very soft impulse response for subtle space
    if (withReverb && !_audioCtx._typingConvolver) {
      const length = Math.floor(audioContext.sampleRate * 0.28); // ~280ms tail
      const impulse = audioContext.createBuffer(2, length, audioContext.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const data = impulse.getChannelData(ch);
        for (let i = 0; i < length; i++) {
          // Decaying random noise (soft, filtered feel)
          const decay = Math.pow(1 - i / length, 2.8); // faster quadratic decay
          const rnd = (Math.random() * 2 - 1) * 0.35; // low amplitude
            data[i] = rnd * decay;
        }
      }
      const convolver = audioContext.createConvolver();
      convolver.normalize = true;
      convolver.buffer = impulse;
      _audioCtx._typingConvolver = convolver;
      // impulse created once and reused
    }
    const convolver = _audioCtx._typingConvolver || null;

    // Updated design: satisfying soft tapping
    const baseTime = audioContext.currentTime + 0.01; // slight offset to avoid blocking
    const taps = self ? 1 : (multiple ? 4 : 3);
    // Relative loudness per tap (first is strongest)
    const loudness = self ? [0.42] : (multiple ? [1.0, 0.72, 0.55, 0.4] : [1.0, 0.68, 0.48]);
    const baseFreq = (self ? 320 : 360) + Math.min(count, 5) * 8; // subtle pitch lift with more typers

    for (let i = 0; i < taps; i++) {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const hp = audioContext.createBiquadFilter(); // trim lows for a clearer tap
      const pan = audioContext.createStereoPanner ? audioContext.createStereoPanner() : null;

      osc.type = 'triangle';
      hp.type = 'highpass';
      hp.frequency.setValueAtTime(180, baseTime);

      // Slight per-tap pitch variance + tiny downward glide for natural feel
      const startFreq = baseFreq + i * 18 + (Math.random() * 12 - 6);
      const endFreq = startFreq - 70;
      const start = baseTime + i * 0.085; // spacing between taps (~85ms)
      const end = start + 0.18; // short life
      osc.frequency.setValueAtTime(startFreq, start);
      osc.frequency.exponentialRampToValueAtTime(Math.max(120, endFreq), end);

      // Envelope: ultra-fast attack, quick decay
      const peak = 0.18 * loudness[i];
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(peak, start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);

      // Random subtle stereo pan per tap (-0.35 .. 0.35) and slight additional delay variation
      const drift = (Math.random() * 0.02) - 0.01; // +/-10ms drift
      const panVal = (Math.random() * 0.7) - 0.35;
      if (pan) pan.pan.setValueAtTime(panVal, start);

      // Routing with optional reverb (wet/dry mix)
      const dryGain = audioContext.createGain();
      const wetGain = audioContext.createGain();
      dryGain.gain.setValueAtTime(self ? 0.55 : 0.85, baseTime);
      wetGain.gain.setValueAtTime(withReverb ? (self ? 0.12 : 0.18) : 0, baseTime);

      osc.connect(gain);
      gain.connect(hp);
      if (pan) {
        hp.connect(pan);
        pan.connect(dryGain);
        if (withReverb && convolver) pan.connect(convolver);
      } else {
        hp.connect(dryGain);
        if (withReverb && convolver) hp.connect(convolver);
      }
      dryGain.connect(_masterGain || audioContext.destination);
      if (withReverb && convolver) {
        convolver.connect(wetGain);
        wetGain.connect(_masterGain || audioContext.destination);
      }

      osc.start(start + drift);
      osc.stop(end + 0.02);
  // (debug counter removed)
    }
  } catch (e) {
    console.warn('⚠️ playTypingSound error:', e);
  }
};
// playTestSound removed now that audio confirmed working
