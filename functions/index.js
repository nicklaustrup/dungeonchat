/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { setGlobalOptions } = require('firebase-functions');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const filter = require('leo-profanity');
const admin = require('firebase-admin');

// Initialize Firebase Admin once for all functions
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// Import username availability checker (after admin init)
const { checkUsernameAvailability } = require('./checkUsernameAvailability');

// Import user deletion function
const { deleteUser } = require('./deleteUser');

// Export the username availability function
exports.checkUsernameAvailability = checkUsernameAvailability;

// Export the user deletion function
exports.deleteUser = deleteUser;

// DISABLED: Profanity filtering moved to client-side for user viewing preferences
// Server-side filtering was removed to allow content freedom with user-controlled display filtering

// exports.detectEvilUsers = onDocumentCreated(
//     "messages/{messageId}",
//     async (event) => {
//       const {text, uid} = event.data.data();

//       // Check if the message contains profanity
//       if (!filter.check(text)) return;

//       // Get user profile to check profanity filter preference
//       let userProfile = null;
//       try {
//         const userProfileDoc = await db.collection("userProfiles").doc(uid).get();
//         userProfile = userProfileDoc.exists ? userProfileDoc.data() : null;
//       } catch (error) {
//         console.warn("Could not fetch user profile for profanity check:", error);
//       }

//       // If user has profanity filter disabled, don't modify the message
//       if (userProfile && userProfile.profanityFilterEnabled === false) {
//         console.log("Profanity detected but user has filter disabled:", uid);
//         return;
//       }

//       // Get the cleaned version for logging
//       const cleaned = filter.clean(text);

//       // Update the message to indicate profanity was removed
//       await event.data.ref.update({
//         text: "[removed: profanity]",
//       });

//       // COMMENTED OUT: Banning functionality disabled for now
//       // Future enhancement: Add back if needed with proper moderation workflow
//       /*
//       await db.collection("banned").doc(uid).set({
//         bannedAt: admin.firestore.FieldValue.serverTimestamp(),
//         reason: "profanity",
//       });
//       */

//       console.log(
//           "Removed profane message by " + uid + ": " + cleaned,
//       );
//     },
// );

setGlobalOptions({ maxInstances: 10 });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
