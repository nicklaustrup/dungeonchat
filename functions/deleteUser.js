/**
 * Cloud Function for deleting a user and cleaning up all associated data
 *
 * This function is triggered when a user requests account deletion.
 * It removes the user from Firebase Auth and cleans up all their data across:
 * - Firestore collections
 * - Realtime Database
 * - Campaign memberships and ownership
 * - Messages and reactions
 * - Tokens and character data
 */

const {onCall, HttpsError} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// Get Firestore and RTDB references
const db = admin.firestore();
const rtdb = admin.database();

/**
 * Deletes a user account and all associated data
 * @param {Object} request - The Cloud Functions request object
 * @returns {Promise<Object>} Result of the deletion operation
 */
exports.deleteUser = onCall(async (request) => {
  const {auth} = request;

  // Verify the user is authenticated
  if (!auth) {
    throw new HttpsError(
        "unauthenticated",
        "User must be authenticated to delete their account.",
    );
  }

  const userId = auth.uid;
  console.log(`Starting deletion process for user: ${userId}`);

  try {
    // Use a batch for atomic operations where possible
    const batch = db.batch();
    const deletionResults = {
      userId,
      deletedAt: admin.firestore.FieldValue.serverTimestamp(),
      collections: {},
    };

    // 1. Delete user profile
    console.log("Deleting user profile...");
    const userProfileRef = db.collection("userProfiles").doc(userId);
    const userProfile = await userProfileRef.get();
    if (userProfile.exists()) {
      batch.delete(userProfileRef);
      deletionResults.collections.userProfile = true;
    }

    // 2. Delete username entry
    console.log("Deleting username entry...");
    if (userProfile.exists() && userProfile.data().username) {
      const usernameRef = db
          .collection("usernames")
          .doc(userProfile.data().username);
      batch.delete(usernameRef);
      deletionResults.collections.username = true;
    }

    // 3. Delete presence data from RTDB
    console.log("Deleting presence data...");
    await rtdb.ref(`presence/${userId}`).remove();
    deletionResults.collections.presence = true;

    // 4. Delete user's messages (mark as deleted or anonymize)
    console.log("Anonymizing user messages...");
    const messagesQuery = db.collection("messages").where("uid", "==", userId);
    const messagesSnapshot = await messagesQuery.get();
    messagesSnapshot.forEach((doc) => {
      // Instead of deleting, anonymize the messages
      batch.update(doc.ref, {
        displayName: "[Deleted User]",
        photoURL: null,
        uid: "deleted_user",
      });
    });
    deletionResults.collections.messages = messagesSnapshot.size;

    // Commit the batch operations so far
    await batch.commit();
    console.log("Basic data deleted successfully");

    // 5. Handle campaign-related data
    console.log("Processing campaign data...");
    await cleanupCampaignData(userId, deletionResults);

    // 6. Delete user from Firebase Auth (must be last)
    console.log("Deleting user from Firebase Auth...");
    await admin.auth().deleteUser(userId);
    deletionResults.authDeleted = true;

    console.log(`User deletion completed successfully: ${userId}`);
    return {
      success: true,
      message: "User account and all associated data have been deleted.",
      details: deletionResults,
    };
  } catch (error) {
    console.error("Error deleting user:", error);
    throw new HttpsError(
        "internal",
        `Failed to delete user account: ${error.message}`,
    );
  }
});

/**
 * Cleans up all campaign-related data for a user
 * @param {string} userId - The user ID to clean up
 * @param {Object} deletionResults - Object to track deletion results
 */
async function cleanupCampaignData(userId, deletionResults) {
  deletionResults.campaigns = {
    owned: 0,
    memberOf: 0,
    charactersDeleted: 0,
  };

  // Get all campaigns where user is DM
  const ownedCampaignsQuery = db
      .collection("campaigns")
      .where("dmId", "==", userId);
  const ownedCampaigns = await ownedCampaignsQuery.get();

  // Get all campaigns where user is a member
  const memberCampaignsQuery = db
      .collectionGroup("members")
      .where("userId", "==", userId);
  const memberDocs = await memberCampaignsQuery.get();

  // Delete campaigns owned by the user
  for (const campaignDoc of ownedCampaigns.docs) {
    const campaignId = campaignDoc.id;
    console.log(`Deleting owned campaign: ${campaignId}`);

    try {
      await deleteCampaignAndSubcollections(campaignId);
      deletionResults.campaigns.owned++;
    } catch (error) {
      console.error(`Error deleting campaign ${campaignId}:`, error);
    }
  }

  // Remove user from campaigns they're a member of
  for (const memberDoc of memberDocs.docs) {
    const campaignId = memberDoc.ref.parent.parent.id;
    console.log(`Removing user from campaign: ${campaignId}`);

    try {
      await removeUserFromCampaign(campaignId, userId);
      deletionResults.campaigns.memberOf++;
    } catch (error) {
      console.error(`Error removing user from campaign ${campaignId}:`, error);
    }
  }

  // Delete user's character sheets across all campaigns
  const charactersQuery = db
      .collectionGroup("characters")
      .where("userId", "==", userId);
  const characters = await charactersQuery.get();

  for (const charDoc of characters.docs) {
    await charDoc.ref.delete();
    deletionResults.campaigns.charactersDeleted++;
  }

  // Clean up userCampaigns tracking
  const userCampaignsRef = db.collection("userCampaigns").doc(userId);
  await userCampaignsRef.delete();
}

/**
 * Deletes a campaign and all its subcollections
 * @param {string} campaignId - The campaign ID to delete
 */
async function deleteCampaignAndSubcollections(campaignId) {
  const campaignRef = db.collection("campaigns").doc(campaignId);

  // Delete all subcollections
  const subcollections = [
    "members",
    "channels",
    "characters",
    "sessions",
    "encounters",
    "schedule",
    "maps",
    "audio",
    "vtt",
    "mapTokens",
  ];

  for (const subcollection of subcollections) {
    await deleteCollection(campaignRef.collection(subcollection));
  }

  // Delete the campaign document itself
  await campaignRef.delete();
}

/**
 * Removes a user from a campaign and updates member count
 * @param {string} campaignId - The campaign ID
 * @param {string} userId - The user ID to remove
 */
async function removeUserFromCampaign(campaignId, userId) {
  const campaignRef = db.collection("campaigns").doc(campaignId);
  const memberRef = campaignRef.collection("members").doc(userId);

  // Delete member document
  await memberRef.delete();

  // Update campaign members array and count
  await campaignRef.update({
    members: admin.firestore.FieldValue.arrayRemove(userId),
    currentPlayers: admin.firestore.FieldValue.increment(-1),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Delete user's tokens in campaign VTT maps
  const tokensQuery = db
      .collectionGroup("tokens")
      .where("ownerId", "==", userId);
  const tokens = await tokensQuery.get();

  for (const tokenDoc of tokens.docs) {
    // Check if token belongs to this campaign's maps
    const tokenCampaignId = tokenDoc.ref.parent.parent.parent.parent.id;
    if (tokenCampaignId === campaignId) {
      await tokenDoc.ref.delete();
    }
  }

  // Delete user's messages in campaign channels
  const channelsSnapshot = await campaignRef.collection("channels").get();
  for (const channelDoc of channelsSnapshot.docs) {
    const messagesQuery = channelDoc.ref
        .collection("messages")
        .where("uid", "==", userId);
    const messages = await messagesQuery.get();

    for (const msgDoc of messages.docs) {
      // Anonymize instead of delete to preserve conversation context
      await msgDoc.ref.update({
        displayName: "[Deleted User]",
        photoURL: null,
        uid: "deleted_user",
      });
    }
  }
}

/**
 * Recursively deletes all documents in a collection
 * @param {Object} collectionRef - Firestore collection reference
 * @param {number} batchSize - Number of documents to delete per batch
 */
async function deleteCollection(collectionRef, batchSize = 100) {
  const query = collectionRef.limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve, reject);
  });
}

/**
 * Deletes documents in batches
 * @param {Object} query - Firestore query
 * @param {Function} resolve - Promise resolve function
 * @param {Function} reject - Promise reject function
 */
async function deleteQueryBatch(query, resolve, reject) {
  try {
    const snapshot = await query.get();

    if (snapshot.size === 0) {
      resolve();
      return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    // Recursively delete next batch
    process.nextTick(() => {
      deleteQueryBatch(query, resolve, reject);
    });
  } catch (error) {
    reject(error);
  }
}
