/**
 * Voice Chat Notification Sounds
 * Web Audio API-based sound generation for join/leave events
 */

class NotificationSounds {
  constructor() {
    this.audioContext = null;
    this.enabled = true;
  }

  /**
   * Initialize audio context (user gesture required)
   */
  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  /**
   * Enable or disable notification sounds
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Play a sound with given frequency and duration
   */
  playTone(frequency, duration, volume = 0.3) {
    if (!this.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + duration
    );

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  /**
   * Play join sound (ascending tones)
   */
  playJoinSound() {
    if (!this.enabled || !this.audioContext) return;

    const now = this.audioContext.currentTime;
    
    // First tone: C5
    this.playToneAtTime(523.25, 0.15, 0.3, now);
    
    // Second tone: E5
    this.playToneAtTime(659.25, 0.15, 0.3, now + 0.1);
    
    // Third tone: G5
    this.playToneAtTime(783.99, 0.2, 0.3, now + 0.2);
  }

  /**
   * Play leave sound (descending tones)
   */
  playLeaveSound() {
    if (!this.enabled || !this.audioContext) return;

    const now = this.audioContext.currentTime;
    
    // First tone: G5
    this.playToneAtTime(783.99, 0.15, 0.25, now);
    
    // Second tone: E5
    this.playToneAtTime(659.25, 0.15, 0.25, now + 0.1);
    
    // Third tone: C5
    this.playToneAtTime(523.25, 0.2, 0.25, now + 0.2);
  }

  /**
   * Play tone at specific time
   */
  playToneAtTime(frequency, duration, volume, startTime) {
    if (!this.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(volume, startTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      startTime + duration
    );

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  }

  /**
   * Play error sound
   */
  playErrorSound() {
    if (!this.enabled || !this.audioContext) return;

    const now = this.audioContext.currentTime;
    
    // Error tone: low frequency
    this.playToneAtTime(200, 0.3, 0.4, now);
    this.playToneAtTime(150, 0.3, 0.4, now + 0.15);
  }

  /**
   * Cleanup audio context
   */
  cleanup() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Export singleton instance
export const notificationSounds = new NotificationSounds();
