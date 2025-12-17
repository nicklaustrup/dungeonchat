/**
 * Signaling Service
 * Handles WebRTC signaling via Firebase Realtime Database
 */

import {
  ref,
  set,
  onValue,
  remove,
  push,
  onChildAdded,
  off,
} from "firebase/database";

export class SignalingService {
  constructor(rtdb) {
    this.rtdb = rtdb;
    this.listeners = new Map(); // Track active listeners for cleanup
  }

  /**
   * Send SDP offer to remote peer
   */
  async sendOffer(campaignId, roomId, fromUser, toUser, offer) {
    const path = `voiceSignaling/${campaignId}/${roomId}/${toUser}/offers/${fromUser}`;
    await set(ref(this.rtdb, path), {
      sdp: offer.sdp,
      type: offer.type,
      timestamp: Date.now(),
    });
    console.log(`[Signaling] Sent offer from ${fromUser} to ${toUser}`);
  }

  /**
   * Send SDP answer to remote peer
   */
  async sendAnswer(campaignId, roomId, fromUser, toUser, answer) {
    const path = `voiceSignaling/${campaignId}/${roomId}/${toUser}/answers/${fromUser}`;
    await set(ref(this.rtdb, path), {
      sdp: answer.sdp,
      type: answer.type,
      timestamp: Date.now(),
    });
    console.log(`[Signaling] Sent answer from ${fromUser} to ${toUser}`);
  }

  /**
   * Send ICE candidate to remote peer
   */
  async sendIceCandidate(campaignId, roomId, fromUser, toUser, candidate) {
    const path = `voiceSignaling/${campaignId}/${roomId}/${toUser}/iceCandidates/${fromUser}`;
    const candidateRef = push(ref(this.rtdb, path));
    await set(candidateRef, {
      candidate: candidate.candidate,
      sdpMLineIndex: candidate.sdpMLineIndex,
      sdpMid: candidate.sdpMid,
      timestamp: Date.now(),
    });
  }

  /**
   * Listen for incoming offers
   */
  listenForOffers(campaignId, roomId, userId, callback) {
    const path = `voiceSignaling/${campaignId}/${roomId}/${userId}/offers`;
    const offersRef = ref(this.rtdb, path);
    const startTime = Date.now();

    const listener = onChildAdded(offersRef, (snapshot) => {
      const fromUser = snapshot.key;
      const offer = snapshot.val();

      if (offer && offer.sdp) {
        // Ignore offers that existed before we started listening
        // This prevents processing stale signals on reconnection
        if (offer.timestamp && offer.timestamp < startTime) {
          console.log(
            `[Signaling] Ignoring stale offer from ${fromUser} ` +
              `(age: ${startTime - offer.timestamp}ms)`
          );
          return;
        }

        console.log(`[Signaling] Received offer from ${fromUser}`);
        callback(fromUser, {
          type: offer.type,
          sdp: offer.sdp,
        });

        // Clean up the offer after processing to prevent re-processing
        remove(snapshot.ref).catch((err) => {
          console.warn(
            `[Signaling] Failed to cleanup offer from ${fromUser}:`,
            err
          );
        });
      }
    });

    this.listeners.set(`offers-${userId}`, { ref: offersRef, listener });
    return listener;
  }

  /**
   * Listen for incoming answers
   */
  listenForAnswers(campaignId, roomId, userId, callback) {
    const path = `voiceSignaling/${campaignId}/${roomId}/${userId}/answers`;
    const answersRef = ref(this.rtdb, path);
    const startTime = Date.now();

    const listener = onChildAdded(answersRef, (snapshot) => {
      const fromUser = snapshot.key;
      const answer = snapshot.val();

      if (answer && answer.sdp) {
        // Ignore answers that existed before we started listening
        // This prevents processing stale signals on reconnection
        if (answer.timestamp && answer.timestamp < startTime) {
          console.log(
            `[Signaling] Ignoring stale answer from ${fromUser} ` +
              `(age: ${startTime - answer.timestamp}ms)`
          );
          return;
        }

        console.log(`[Signaling] Received answer from ${fromUser}`);
        callback(fromUser, {
          type: answer.type,
          sdp: answer.sdp,
        });

        // Clean up the answer after processing to prevent re-processing
        remove(snapshot.ref).catch((err) => {
          console.warn(
            `[Signaling] Failed to cleanup answer from ${fromUser}:`,
            err
          );
        });
      }
    });

    this.listeners.set(`answers-${userId}`, { ref: answersRef, listener });
    return listener;
  }

  /**
   * Listen for incoming ICE candidates
   */
  listenForIceCandidates(campaignId, roomId, userId, callback) {
    const path = `voiceSignaling/${campaignId}/${roomId}/${userId}/iceCandidates`;
    const candidatesRef = ref(this.rtdb, path);

    const listener = onChildAdded(candidatesRef, (snapshot) => {
      const fromUser = snapshot.key;
      snapshot.forEach((candidateSnapshot) => {
        const candidateData = candidateSnapshot.val();
        if (candidateData && candidateData.candidate) {
          console.log(`[Signaling] Received ICE candidate from ${fromUser}`);
          callback(fromUser, {
            candidate: candidateData.candidate,
            sdpMLineIndex: candidateData.sdpMLineIndex,
            sdpMid: candidateData.sdpMid,
          });
        }
      });
    });

    this.listeners.set(`ice-${userId}`, { ref: candidatesRef, listener });
    return listener;
  }

  /**
   * Update presence status
   */
  async updatePresence(campaignId, roomId, userId, status) {
    const path = `voiceSignaling/${campaignId}/${roomId}/${userId}/presence`;
    await set(ref(this.rtdb, path), {
      status, // 'online', 'offline'
      lastSeen: Date.now(),
    });
  }

  /**
   * Listen for presence changes of all users in room
   */
  listenForPresence(campaignId, roomId, callback) {
    const path = `voiceSignaling/${campaignId}/${roomId}`;
    const roomRef = ref(this.rtdb, path);

    const listener = onValue(roomRef, (snapshot) => {
      const presenceData = {};
      snapshot.forEach((userSnapshot) => {
        const userId = userSnapshot.key;
        const presence = userSnapshot.child("presence").val();
        if (presence) {
          presenceData[userId] = presence;
        }
      });
      callback(presenceData);
    });

    this.listeners.set(`presence-${roomId}`, { ref: roomRef, listener });
    return listener;
  }

  /**
   * Clean up signaling data for a user
   */
  async cleanup(campaignId, roomId, userId) {
    const path = `voiceSignaling/${campaignId}/${roomId}/${userId}`;
    await remove(ref(this.rtdb, path));
    console.log(`[Signaling] Cleaned up signaling data for ${userId}`);
  }

  /**
   * Remove all listeners
   */
  removeAllListeners() {
    this.listeners.forEach(({ ref: dbRef, listener }) => {
      off(dbRef, "child_added", listener);
      off(dbRef, "value", listener);
    });
    this.listeners.clear();
    console.log("[Signaling] Removed all listeners");
  }
}
