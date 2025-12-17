/**
 * Security Utilities for Voice Chat
 *
 * Provides security validation and sanitization functions
 */

/**
 * Sanitize username to prevent XSS
 */
export const sanitizeUsername = (username) => {
  if (!username || typeof username !== "string") {
    return "";
  }

  // Remove HTML tags
  const withoutTags = username.replace(/<[^>]*>/g, "");

  // Remove script-like content
  const withoutScripts = withoutTags.replace(/javascript:/gi, "");

  // Trim and limit length
  return withoutScripts.trim().substring(0, 50);
};

/**
 * Validate that user is DM of the campaign
 */
export const validateDMPermission = async (campaignId, userId, firestore) => {
  try {
    const campaignDoc = await firestore
      .collection("campaigns")
      .doc(campaignId)
      .get();

    if (!campaignDoc.exists) {
      return {
        valid: false,
        error: "Campaign not found",
      };
    }

    const campaign = campaignDoc.data();

    if (campaign.dmId !== userId) {
      return {
        valid: false,
        error: "User is not the DM of this campaign",
      };
    }

    return {
      valid: true,
      campaign,
    };
  } catch (error) {
    console.error("DM validation error:", error);
    return {
      valid: false,
      error: error.message,
    };
  }
};

/**
 * Validate that user is a member of the campaign
 */
export const validateCampaignMembership = async (
  campaignId,
  userId,
  firestore
) => {
  try {
    const memberDoc = await firestore
      .collection("campaigns")
      .doc(campaignId)
      .collection("members")
      .doc(userId)
      .get();

    if (!memberDoc.exists) {
      return {
        valid: false,
        error: "User is not a member of this campaign",
      };
    }

    return {
      valid: true,
      member: memberDoc.data(),
    };
  } catch (error) {
    console.error("Membership validation error:", error);
    return {
      valid: false,
      error: error.message,
    };
  }
};

/**
 * Rate limiter class
 */
export class RateLimiter {
  constructor(maxAttempts = 5, windowMs = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.attempts = new Map();
  }

  /**
   * Check if action is allowed
   */
  isAllowed(key) {
    const now = Date.now();
    const userAttempts = this.attempts.get(key) || [];

    // Remove old attempts outside the window
    const recentAttempts = userAttempts.filter(
      (timestamp) => now - timestamp < this.windowMs
    );

    if (recentAttempts.length >= this.maxAttempts) {
      return {
        allowed: false,
        retryAfter: Math.ceil((recentAttempts[0] + this.windowMs - now) / 1000),
      };
    }

    // Add new attempt
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);

    return {
      allowed: true,
      remaining: this.maxAttempts - recentAttempts.length,
    };
  }

  /**
   * Clear attempts for a key
   */
  clear(key) {
    this.attempts.delete(key);
  }

  /**
   * Clear all attempts
   */
  clearAll() {
    this.attempts.clear();
  }
}

/**
 * Validate voice settings object
 */
export const validateVoiceSettings = (settings) => {
  const validQualities = ["low", "medium", "high"];

  const errors = [];

  if (!settings || typeof settings !== "object") {
    return {
      valid: false,
      errors: ["Settings must be an object"],
    };
  }

  if (!validQualities.includes(settings.audioQuality)) {
    errors.push("Invalid audio quality. Must be low, medium, or high");
  }

  if (typeof settings.echoCancellation !== "boolean") {
    errors.push("echoCancellation must be a boolean");
  }

  if (typeof settings.noiseSuppression !== "boolean") {
    errors.push("noiseSuppression must be a boolean");
  }

  if (typeof settings.autoGainControl !== "boolean") {
    errors.push("autoGainControl must be a boolean");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Secure random ID generator
 */
export const generateSecureId = () => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
};

/**
 * Validate participant data
 */
export const validateParticipantData = (data, userId) => {
  const errors = [];

  if (!data || typeof data !== "object") {
    return {
      valid: false,
      errors: ["Participant data must be an object"],
    };
  }

  if (data.userId !== userId) {
    errors.push("userId does not match authenticated user");
  }

  if (!data.username || typeof data.username !== "string") {
    errors.push("username is required and must be a string");
  } else if (data.username.length > 50) {
    errors.push("username must be 50 characters or less");
  }

  if (typeof data.isMuted !== "boolean") {
    errors.push("isMuted must be a boolean");
  }

  if (!(data.joinedAt instanceof Date) && isNaN(Date.parse(data.joinedAt))) {
    errors.push("joinedAt must be a valid date");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Check for suspicious activity patterns
 */
export const detectSuspiciousActivity = (activities) => {
  const warnings = [];

  // Check for rapid join/leave cycles
  const joinLeaveCount = activities.filter(
    (a) => a.type === "join" || a.type === "leave"
  ).length;

  if (joinLeaveCount > 10) {
    warnings.push("Excessive join/leave activity detected");
  }

  // Check for rapid mute/unmute
  const muteCount = activities.filter(
    (a) => a.type === "mute" || a.type === "unmute"
  ).length;

  if (muteCount > 20) {
    warnings.push("Excessive mute/unmute activity detected");
  }

  // Check for rapid notification triggers
  const notificationCount = activities.filter(
    (a) => a.type === "notification"
  ).length;

  if (notificationCount > 30) {
    warnings.push("Excessive notification activity detected");
  }

  return {
    suspicious: warnings.length > 0,
    warnings,
  };
};

/**
 * Content Security Policy helper
 */
export const getVoiceCSPDirectives = () => {
  return {
    "default-src": ["'self'"],
    "connect-src": [
      "'self'",
      "wss://*.firebaseio.com",
      "https://*.googleapis.com",
      "https://stun.l.google.com:19302",
    ],
    "media-src": ["'self'", "mediastream:"],
    "script-src": ["'self'", "'unsafe-inline'"],
    "style-src": ["'self'", "'unsafe-inline'"],
  };
};

/**
 * Audit log entry creator
 */
export const createAuditLog = (action, userId, campaignId, details = {}) => {
  return {
    action,
    userId,
    campaignId,
    timestamp: new Date(),
    details,
    userAgent: navigator.userAgent,
    ip: null, // Would be populated server-side
  };
};

/**
 * Rate limiters for different actions
 */
export const rateLimiters = {
  join: new RateLimiter(5, 60000), // 5 joins per minute
  mute: new RateLimiter(10, 60000), // 10 mutes per minute
  kick: new RateLimiter(3, 60000), // 3 kicks per minute
  settings: new RateLimiter(10, 60000), // 10 settings changes per minute
};

const voiceSecurity = {
  sanitizeUsername,
  validateDMPermission,
  validateCampaignMembership,
  validateVoiceSettings,
  validateParticipantData,
  generateSecureId,
  detectSuspiciousActivity,
  getVoiceCSPDirectives,
  createAuditLog,
  RateLimiter,
  rateLimiters,
};

export default voiceSecurity;
