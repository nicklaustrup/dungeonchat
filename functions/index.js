
/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const ProfanityFilter = require("profanity-filter");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

exports.detectEvilUsers = onDocumentCreated(
    "messages/{messageId}",
    async (event) => {
        const pf = new ProfanityFilter();
        const {text, uid} = event.data.data();
        if (!pf.isProfane(text)) return;
        const cleaned = pf.clean(text);
        await event.data.ref.update({
            text: "[removed: profanity]",
        });
        await db.collection("banned").doc(uid).set({});
        console.log(
            "Removed profane message by " + uid + ": " + cleaned,
        );
    },
);

setGlobalOptions({maxInstances: 10});

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
