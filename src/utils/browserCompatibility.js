/**
 * Browser Compatibility Detection and Polyfills
 *
 * Detects browser capabilities for voice chat features and provides
 * compatibility information for WebRTC, Web Audio API, and other features.
 */

/**
 * Detect the current browser
 */
export const detectBrowser = () => {
  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes("firefox")) {
    return {
      name: "Firefox",
      isFirefox: true,
      isChrome: false,
      isSafari: false,
      isEdge: false,
      isMobile: /android|iphone|ipad|ipod/.test(userAgent),
    };
  }

  if (userAgent.includes("safari") && !userAgent.includes("chrome")) {
    return {
      name: "Safari",
      isFirefox: false,
      isChrome: false,
      isSafari: true,
      isEdge: false,
      isMobile: /iphone|ipad|ipod/.test(userAgent),
    };
  }

  if (userAgent.includes("edg/") || userAgent.includes("edge")) {
    return {
      name: "Edge",
      isFirefox: false,
      isChrome: false,
      isSafari: false,
      isEdge: true,
      isMobile: false,
    };
  }

  if (userAgent.includes("chrome")) {
    return {
      name: "Chrome",
      isFirefox: false,
      isChrome: true,
      isSafari: false,
      isEdge: false,
      isMobile: /android/.test(userAgent),
    };
  }

  return {
    name: "Unknown",
    isFirefox: false,
    isChrome: false,
    isSafari: false,
    isEdge: false,
    isMobile: /mobile|android|iphone|ipad|ipod/.test(userAgent),
  };
};

/**
 * Check WebRTC support
 */
export const checkWebRTCSupport = () => {
  const hasGetUserMedia = !!(
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia ||
    (navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  );

  const hasRTCPeerConnection = !!(
    window.RTCPeerConnection ||
    window.webkitRTCPeerConnection ||
    window.mozRTCPeerConnection
  );

  return {
    supported: hasGetUserMedia && hasRTCPeerConnection,
    getUserMedia: hasGetUserMedia,
    peerConnection: hasRTCPeerConnection,
    mediaDevices: !!navigator.mediaDevices,
  };
};

/**
 * Check Web Audio API support
 */
export const checkAudioAPISupport = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;

  return {
    supported: !!AudioContext,
    oscillatorNode:
      !!AudioContext &&
      typeof AudioContext.prototype.createOscillator === "function",
    gainNode:
      !!AudioContext && typeof AudioContext.prototype.createGain === "function",
  };
};

/**
 * Get normalized getUserMedia function
 */
export const getUserMedia = (constraints) => {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    return navigator.mediaDevices.getUserMedia(constraints);
  }

  // Fallback for older browsers
  const legacyGetUserMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia;

  if (!legacyGetUserMedia) {
    return Promise.reject(
      new Error("getUserMedia is not supported in this browser")
    );
  }

  return new Promise((resolve, reject) => {
    legacyGetUserMedia.call(navigator, constraints, resolve, reject);
  });
};

/**
 * Get normalized RTCPeerConnection constructor
 */
export const getRTCPeerConnection = () => {
  return (
    window.RTCPeerConnection ||
    window.webkitRTCPeerConnection ||
    window.mozRTCPeerConnection
  );
};

/**
 * Check if browser supports required features for voice chat
 */
export const checkVoiceChatCompatibility = () => {
  const browser = detectBrowser();
  const webrtc = checkWebRTCSupport();
  const audio = checkAudioAPISupport();

  const compatible = webrtc.supported && audio.supported;
  const warnings = [];
  const errors = [];

  // Browser-specific warnings
  if (browser.isSafari) {
    warnings.push("Safari may require user interaction before audio playback");
    if (browser.isMobile) {
      warnings.push("iOS Safari has limitations on background audio");
    }
  }

  if (browser.isFirefox) {
    warnings.push(
      "Firefox uses a different WebRTC implementation - testing recommended"
    );
  }

  if (browser.isMobile) {
    warnings.push(
      "Mobile browsers may have battery and performance limitations"
    );
  }

  // Feature errors
  if (!webrtc.supported) {
    errors.push("WebRTC is not supported - voice chat will not work");
  }

  if (!audio.supported) {
    errors.push(
      "Web Audio API is not supported - notification sounds will not work"
    );
  }

  if (!navigator.mediaDevices) {
    errors.push(
      "MediaDevices API is not available - microphone access may fail"
    );
  }

  // Check secure context (HTTPS required for getUserMedia)
  if (
    window.location.protocol !== "https:" &&
    window.location.hostname !== "localhost"
  ) {
    errors.push(
      "HTTPS is required for microphone access (except on localhost)"
    );
  }

  return {
    compatible,
    browser,
    features: {
      webrtc,
      audio,
    },
    warnings,
    errors,
    recommendation: compatible
      ? "Voice chat should work in this browser"
      : "Voice chat is not fully supported in this browser",
  };
};

/**
 * Initialize Audio Context with browser compatibility
 * Safari requires user gesture to initialize AudioContext
 */
export const initAudioContext = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;

  if (!AudioContext) {
    throw new Error("Web Audio API is not supported");
  }

  const context = new AudioContext();
  const browser = detectBrowser();

  // Safari requires resume() after user gesture
  if (browser.isSafari && context.state === "suspended") {
    return {
      context,
      needsUserGesture: true,
      resume: () => context.resume(),
    };
  }

  return {
    context,
    needsUserGesture: false,
    resume: () => Promise.resolve(),
  };
};

/**
 * Test audio playback capability
 */
export const testAudioPlayback = async () => {
  try {
    const { context, needsUserGesture, resume } = initAudioContext();

    if (needsUserGesture) {
      await resume();
    }

    // Create a brief test tone
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    gainNode.gain.value = 0.1;
    oscillator.frequency.value = 440; // A4 note

    oscillator.start();
    oscillator.stop(context.currentTime + 0.1);

    return {
      success: true,
      message: "Audio playback is working",
    };
  } catch (error) {
    return {
      success: false,
      message: `Audio playback failed: ${error.message}`,
      error,
    };
  }
};

/**
 * Get recommended WebRTC configuration based on browser
 */
export const getRecommendedRTCConfig = () => {
  const browser = detectBrowser();

  const baseConfig = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  // Firefox-specific optimizations
  if (browser.isFirefox) {
    return {
      ...baseConfig,
      bundlePolicy: "max-bundle",
      rtcpMuxPolicy: "require",
    };
  }

  // Safari-specific optimizations
  if (browser.isSafari) {
    return {
      ...baseConfig,
      iceTransportPolicy: "all",
    };
  }

  return baseConfig;
};

/**
 * Get recommended audio constraints based on browser and network
 */
export const getRecommendedAudioConstraints = (quality = "high") => {
  const browser = detectBrowser();

  const baseConstraints = {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    video: false,
  };

  // Quality presets
  const qualitySettings = {
    low: { sampleRate: 16000, channelCount: 1 },
    medium: { sampleRate: 32000, channelCount: 1 },
    high: { sampleRate: 48000, channelCount: 1 },
  };

  // Mobile optimizations
  if (browser.isMobile) {
    return {
      ...baseConstraints,
      audio: {
        ...baseConstraints.audio,
        ...qualitySettings["medium"], // Use medium quality on mobile
      },
    };
  }

  return {
    ...baseConstraints,
    audio: {
      ...baseConstraints.audio,
      ...(qualitySettings[quality] || qualitySettings["high"]),
    },
  };
};

/**
 * Log compatibility information to console
 */
export const logCompatibilityInfo = () => {
  const compat = checkVoiceChatCompatibility();

  console.group("🔊 Voice Chat Compatibility");
  console.log("Browser:", compat.browser.name);
  console.log("Compatible:", compat.compatible ? "✅" : "❌");
  console.log(
    "WebRTC Support:",
    compat.features.webrtc.supported ? "✅" : "❌"
  );
  console.log(
    "Audio API Support:",
    compat.features.audio.supported ? "✅" : "❌"
  );

  if (compat.warnings.length > 0) {
    console.group("⚠️ Warnings");
    compat.warnings.forEach((w) => console.warn(w));
    console.groupEnd();
  }

  if (compat.errors.length > 0) {
    console.group("❌ Errors");
    compat.errors.forEach((e) => console.error(e));
    console.groupEnd();
  }

  console.log("Recommendation:", compat.recommendation);
  console.groupEnd();

  return compat;
};

const browserCompatibility = {
  detectBrowser,
  checkWebRTCSupport,
  checkAudioAPISupport,
  checkVoiceChatCompatibility,
  getUserMedia,
  getRTCPeerConnection,
  initAudioContext,
  testAudioPlayback,
  getRecommendedRTCConfig,
  getRecommendedAudioConstraints,
  logCompatibilityInfo,
};

export default browserCompatibility;
