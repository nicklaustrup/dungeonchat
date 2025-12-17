/**
 * Cloud Functions for Voice Chat Security
 *
 * Server-side validation for DM moderation actions
 * These functions should be deployed to Firebase Cloud Functions
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Validate DM Action
 * Helper function to check if user is DM of the campaign
 * @param {string} campaignId - The campaign ID to validate
 * @param {string} userId - The user ID to check DM status for
 * @return {Promise<Object>} Validation result with valid flag and data/error
 */
const validateDMAction = async (campaignId, userId) => {
  try {
    const campaignDoc = await db.collection("campaigns").doc(campaignId).get();

    if (!campaignDoc.exists) {
      return {valid: false, error: "Campaign not found"};
    }

    const campaign = campaignDoc.data();

    if (campaign.dmId !== userId) {
      return {valid: false, error: "User is not the DM of this campaign"};
    }

    return {valid: true, campaign};
  } catch (error) {
    console.error("DM validation error:", error);
    return {valid: false, error: error.message};
  }
};

/**
 * Kick User from Voice Chat
 * Secure server-side user removal with audit logging
 */
exports.kickUserFromVoice = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated to kick users",
    );
  }

  const {campaignId, targetUserId, reason} = data;

  // Validate input
  if (!campaignId || !targetUserId) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "campaignId and targetUserId are required",
    );
  }

  // Validate DM permission
  const validation = await validateDMAction(campaignId, context.auth.uid);

  if (!validation.valid) {
    throw new functions.https.HttpsError("permission-denied", validation.error);
  }

  // Cannot kick yourself
  if (targetUserId === context.auth.uid) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "Cannot kick yourself",
    );
  }

  try {
    const participantRef = db
        .collection("campaigns")
        .doc(campaignId)
        .collection("voiceParticipants")
        .doc(targetUserId);

    const participantDoc = await participantRef.get();

    if (!participantDoc.exists) {
      throw new functions.https.HttpsError(
          "not-found",
          "User is not in voice chat",
      );
    }

    // Mark as kicked (for UI feedback) before deleting
    await participantRef.update({
      kickedAt: admin.firestore.FieldValue.serverTimestamp(),
      kickedBy: context.auth.uid,
      kickReason: reason || "No reason provided",
    });

    // Wait a moment for client to receive the update
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Remove participant
    await participantRef.delete();

    // Log the action
    await db
        .collection("campaigns")
        .doc(campaignId)
        .collection("voiceLogs")
        .add({
          action: "kick",
          performedBy: context.auth.uid,
          targetUser: targetUserId,
          reason: reason || "No reason provided",
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            userAgent: context.rawRequest?.headers["user-agent"],
            ip: context.rawRequest?.ip,
          },
        });

    return {
      success: true,
      message: "User kicked successfully",
    };
  } catch (error) {
    console.error("Kick user error:", error);
    throw new functions.https.HttpsError(
        "internal",
        "Failed to kick user: " + error.message,
    );
  }
});

/**
 * Mute User in Voice Chat
 * Secure server-side mute with audit logging
 */
exports.muteUserInVoice = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated to mute users",
    );
  }

  const {campaignId, targetUserId, muted, reason} = data;

  // Validate input
  if (!campaignId || !targetUserId || typeof muted !== "boolean") {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "campaignId, targetUserId, and muted are required",
    );
  }

  // Validate DM permission
  const validation = await validateDMAction(campaignId, context.auth.uid);

  if (!validation.valid) {
    throw new functions.https.HttpsError("permission-denied", validation.error);
  }

  try {
    const participantRef = db
        .collection("campaigns")
        .doc(campaignId)
        .collection("voiceParticipants")
        .doc(targetUserId);

    const participantDoc = await participantRef.get();

    if (!participantDoc.exists) {
      throw new functions.https.HttpsError(
          "not-found",
          "User is not in voice chat",
      );
    }

    // Update mute status
    await participantRef.update({
      isMuted: muted,
      mutedBy: muted ? context.auth.uid : null,
      muteReason: muted ? reason || "No reason provided" : null,
      mutedAt: muted ? admin.firestore.FieldValue.serverTimestamp() : null,
    });

    // Log the action
    await db
        .collection("campaigns")
        .doc(campaignId)
        .collection("voiceLogs")
        .add({
          action: muted ? "mute" : "unmute",
          performedBy: context.auth.uid,
          targetUser: targetUserId,
          reason: reason || "No reason provided",
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            userAgent: context.rawRequest?.headers["user-agent"],
            ip: context.rawRequest?.ip,
          },
        });

    return {
      success: true,
      message: `User ${muted ? "muted" : "unmuted"} successfully`,
    };
  } catch (error) {
    console.error("Mute user error:", error);
    throw new functions.https.HttpsError(
        "internal",
        "Failed to mute user: " + error.message,
    );
  }
});

/**
 * Get Voice Logs
 * Retrieve audit logs for DM review
 */
exports.getVoiceLogs = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated",
    );
  }

  const {campaignId, limit = 50} = data;

  // Validate input
  if (!campaignId) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "campaignId is required",
    );
  }

  // Validate DM permission
  const validation = await validateDMAction(campaignId, context.auth.uid);

  if (!validation.valid) {
    throw new functions.https.HttpsError("permission-denied", validation.error);
  }

  try {
    const logsSnapshot = await db
        .collection("campaigns")
        .doc(campaignId)
        .collection("voiceLogs")
        .orderBy("timestamp", "desc")
        .limit(Math.min(limit, 100))
        .get();

    const logs = [];
    logsSnapshot.forEach((doc) => {
      logs.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return {
      success: true,
      logs,
    };
  } catch (error) {
    console.error("Get logs error:", error);
    throw new functions.https.HttpsError(
        "internal",
        "Failed to retrieve logs: " + error.message,
    );
  }
});

/**
 * Clean up stale voice participants
 * Scheduled function to remove participants who haven't updated in 5 minutes
 */
exports.cleanupStaleVoiceParticipants = functions.pubsub
    .schedule("every 5 minutes")
    .onRun(async (context) => {
      const fiveMinutesAgo = admin.firestore.Timestamp.fromDate(
          new Date(Date.now() - 5 * 60 * 1000),
      );

      try {
      // Get all campaigns
        const campaignsSnapshot = await db.collection("campaigns").get();

        let totalRemoved = 0;

        for (const campaignDoc of campaignsSnapshot.docs) {
          const campaignId = campaignDoc.id;

          // Get stale participants
          const staleParticipants = await db
              .collection("campaigns")
              .doc(campaignId)
              .collection("voiceParticipants")
              .where("lastUpdate", "<", fiveMinutesAgo)
              .get();

          // Remove stale participants
          const batch = db.batch();
          staleParticipants.forEach((doc) => {
            batch.delete(doc.ref);
          });

          if (staleParticipants.size > 0) {
            await batch.commit();
            totalRemoved += staleParticipants.size;

            console.log(
                `Removed ${staleParticipants.size} stale ` +
              `participants from campaign ${campaignId}`,
            );
          }
        }

        console.log(`Cleanup complete. Total removed: ${totalRemoved}`);
      } catch (error) {
        console.error("Cleanup error:", error);
      }
    });

/**
 * Validate Voice Settings
 * Server-side validation for voice settings
 */
exports.validateVoiceSettings = functions.https.onCall(
    async (data, context) => {
    // Check authentication
      if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "User must be authenticated",
        );
      }

      const {settings} = data;
      const validQualities = ["low", "medium", "high"];

      if (!settings || typeof settings !== "object") {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "settings must be an object",
        );
      }

      if (!validQualities.includes(settings.audioQuality)) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "Invalid audio quality",
        );
      }

      if (
        typeof settings.echoCancellation !== "boolean" ||
      typeof settings.noiseSuppression !== "boolean" ||
      typeof settings.autoGainControl !== "boolean"
      ) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "Invalid settings format",
        );
      }

      // Save validated settings
      try {
        await db
            .collection("users")
            .doc(context.auth.uid)
            .collection("voiceSettings")
            .doc("settings")
            .set(
                {
                  ...settings,
                  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                },
                {merge: true},
            );

        return {
          success: true,
          message: "Settings validated and saved",
        };
      } catch (error) {
        console.error("Settings save error:", error);
        throw new functions.https.HttpsError(
            "internal",
            "Failed to save settings: " + error.message,
        );
      }
    },
);
