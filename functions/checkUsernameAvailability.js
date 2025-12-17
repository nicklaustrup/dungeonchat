const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {getApps, initializeApp} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");

// Initialize Firebase Admin only if not already initialized
if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

/**
 * Cloud Function to check username availability
 * This runs with admin privileges to read the usernames collection
 */
exports.checkUsernameAvailability = onCall(
    {
      region: "us-central1", // Adjust region as needed
      cors: true,
    },
    async (request) => {
    // Verify user is authenticated
      if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be authenticated");
      }

      const {username} = request.data;
      const currentUserId = request.auth.uid;

      // Validate input
      if (!username || typeof username !== "string") {
        throw new HttpsError(
            "invalid-argument",
            "Username is required and must be a string",
        );
      }

      // Validate username format
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(username)) {
        return {
          available: false,
          error:
          "Username must be 3-20 characters long and contain only " +
          "letters, numbers, and underscores",
        };
      }

      // Reserved usernames
      const reservedUsernames = [
        "admin",
        "administrator",
        "root",
        "system",
        "support",
        "help",
        "api",
        "www",
        "mail",
        "email",
        "test",
        "guest",
        "user",
        "mod",
        "moderator",
        "staff",
        "team",
        "official",
        "bot",
        "null",
        "undefined",
      ];

      if (reservedUsernames.includes(username.toLowerCase())) {
        return {
          available: false,
          error: "This username is reserved and cannot be used",
        };
      }

      try {
      // Check if username exists in usernames collection
        const usernameDoc = await db
            .collection("usernames")
            .doc(username.toLowerCase())
            .get();

        if (usernameDoc.exists) {
          const data = usernameDoc.data();

          // Check if it's deleted (soft delete)
          if (data.deleted) {
            return {
              available: true,
              error: null,
            };
          }

          // Check if it belongs to the current user
          if (data.uid === currentUserId) {
            return {
              available: true,
              error: null,
            };
          }

          // Username is taken by another user
          return {
            available: false,
            error: "Username is already taken",
          };
        }

        // Username is available
        return {
          available: true,
          error: null,
        };
      } catch (error) {
        console.error("Error checking username availability:", error);
        throw new HttpsError("internal", "Failed to check username availability");
      }
    },
);
