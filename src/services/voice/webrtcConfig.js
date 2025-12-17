/**
 * WebRTC Configuration
 * Provides ICE server configuration for peer connections
 */

/**
 * Get WebRTC configuration with ICE servers
 * @returns {Object} RTCConfiguration object
 */
export const getWebRTCConfig = () => {
  return {
    iceServers: [
      // Google's public STUN servers (free, reliable)
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:19302" },
      // Note: TURN servers can be added here later if needed for strict NAT/firewall scenarios
    ],
    iceCandidatePoolSize: 10, // Pre-gather ICE candidates for faster connections
  };
};

/**
 * Audio constraints for getUserMedia
 * Optimized for voice chat quality
 */
export const getAudioConstraints = () => {
  return {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      // Optional: uncomment for specific sample rates
      // sampleRate: 48000,
      // channelCount: 1
    },
    video: false, // Voice only for now
  };
};

/**
 * Audio quality presets
 */
export const AudioQuality = {
  LOW: {
    sampleRate: 16000,
    channelCount: 1,
    bitrate: 24000,
  },
  MEDIUM: {
    sampleRate: 24000,
    channelCount: 1,
    bitrate: 32000,
  },
  HIGH: {
    sampleRate: 48000,
    channelCount: 1,
    bitrate: 64000,
  },
};
