/**
 * Voice Room Service
 * Manages voice room data in Firestore
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
  query,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';

/**
 * Create or ensure a voice room exists
 */
export async function createVoiceRoom(firestore, campaignId, roomId = 'voice-general', roomData = {}) {
  try {
    const roomRef = doc(firestore, 'campaigns', campaignId, 'voiceRooms', roomId);
    const roomDoc = await getDoc(roomRef);
    
    if (!roomDoc.exists()) {
      await setDoc(roomRef, {
        id: roomId,
        name: roomData.name || 'Campaign Voice Chat',
        type: 'voice',
        campaignId,
        status: 'inactive',
        participants: [],
        maxParticipants: roomData.maxParticipants || 8,
        settings: {
          requirePushToTalk: false,
          audioQuality: 'high',
          echoCancellation: true,
          noiseSuppression: true,
          ...roomData.settings
        },
        permissions: {
          allowedRoles: ['dm', 'player'],
          canSpeak: ['dm', 'player'],
          canMute: ['dm'],
          ...roomData.permissions
        },
        createdBy: roomData.createdBy || null,
        createdAt: serverTimestamp(),
        lastActivity: serverTimestamp()
      });
      console.log(`[VoiceRoom] Created voice room ${roomId}`);
    }
    
    return roomRef;
  } catch (error) {
    console.error('[VoiceRoom] Error creating voice room:', error);
    throw error;
  }
}

/**
 * Get voice room data
 */
export async function getVoiceRoom(firestore, campaignId, roomId) {
  try {
    const roomRef = doc(firestore, 'campaigns', campaignId, 'voiceRooms', roomId);
    const roomDoc = await getDoc(roomRef);
    
    if (roomDoc.exists()) {
      return { id: roomDoc.id, ...roomDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('[VoiceRoom] Error getting voice room:', error);
    throw error;
  }
}

/**
 * Listen to voice room changes
 */
export function listenToVoiceRoom(firestore, campaignId, roomId, callback) {
  const roomRef = doc(firestore, 'campaigns', campaignId, 'voiceRooms', roomId);
  
  return onSnapshot(roomRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('[VoiceRoom] Error listening to voice room:', error);
  });
}

/**
 * Join a voice room
 */
export async function joinRoom(firestore, campaignId, roomId, userId, userData = {}) {
  try {
    // Fetch user profile data
    let username = userData.username || 'Anonymous';
    let displayName = 'Anonymous';
    let profilePictureURL = userData.photoURL || null;
    
    try {
      const profileRef = doc(firestore, 'userProfiles', userId);
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        const profileData = profileSnap.data();
        username = profileData.username || 'Anonymous';
        displayName = profileData.displayName || profileData.username || 'Anonymous';
        profilePictureURL = profileData.profilePictureURL || null;
      }
    } catch (profileError) {
      console.warn('[VoiceRoom] Could not fetch user profile:', profileError);
    }

    // Fetch character name from campaign member data
    let characterName = null;
    try {
      const memberRef = doc(firestore, 'campaigns', campaignId, 'members', userId);
      const memberSnap = await getDoc(memberRef);
      if (memberSnap.exists()) {
        const memberData = memberSnap.data();
        characterName = memberData.characterName || null;
      }
    } catch (memberError) {
      console.warn('[VoiceRoom] Could not fetch campaign member data:', memberError);
    }

    // Update voice room participants list
    const roomRef = doc(firestore, 'campaigns', campaignId, 'voiceRooms', roomId);
    await updateDoc(roomRef, {
      participants: arrayUnion(userId),
      status: 'active',
      lastActivity: serverTimestamp()
    });

    // Create participant document with profile data
    const participantRef = doc(firestore, 'campaigns', campaignId, 'voiceRooms', roomId, 'participants', userId);
    await setDoc(participantRef, {
      userId,
      username: username,
      displayName: displayName,
      photoURL: profilePictureURL,
      characterName: characterName,
      role: userData.role || 'player',
      joinedAt: serverTimestamp(),
      isSpeaking: false,
      isMuted: false,
      isDeafened: false,
      audioLevel: 0,
      connectionQuality: 'good'
    });

    console.log(`[VoiceRoom] User ${userId} joined room ${roomId}`);
  } catch (error) {
    console.error('[VoiceRoom] Error joining room:', error);
    throw error;
  }
}

/**
 * Leave a voice room
 */
export async function leaveRoom(firestore, campaignId, roomId, userId) {
  try {
    // Remove from participants list
    const roomRef = doc(firestore, 'campaigns', campaignId, 'voiceRooms', roomId);
    await updateDoc(roomRef, {
      participants: arrayRemove(userId),
      lastActivity: serverTimestamp()
    });

    // Delete participant document
    const participantRef = doc(firestore, 'campaigns', campaignId, 'voiceRooms', roomId, 'participants', userId);
    await deleteDoc(participantRef);

    // Check if room should be set to inactive
    const roomDoc = await getDoc(roomRef);
    if (roomDoc.exists() && roomDoc.data().participants.length === 0) {
      await updateDoc(roomRef, {
        status: 'inactive'
      });
    }

    console.log(`[VoiceRoom] User ${userId} left room ${roomId}`);
  } catch (error) {
    console.error('[VoiceRoom] Error leaving room:', error);
    throw error;
  }
}

/**
 * Update participant data
 */
export async function updateParticipant(firestore, campaignId, roomId, userId, updates) {
  try {
    const participantRef = doc(firestore, 'campaigns', campaignId, 'voiceRooms', roomId, 'participants', userId);
    await updateDoc(participantRef, updates);
  } catch (error) {
    console.error('[VoiceRoom] Error updating participant:', error);
    throw error;
  }
}

/**
 * Listen to voice room participants
 */
export function listenToParticipants(firestore, campaignId, roomId, callback) {
  const participantsRef = collection(firestore, 'campaigns', campaignId, 'voiceRooms', roomId, 'participants');
  const q = query(participantsRef);
  
  return onSnapshot(q, (snapshot) => {
    const participants = [];
    snapshot.forEach((doc) => {
      participants.push({ id: doc.id, ...doc.data() });
    });
    callback(participants);
  }, (error) => {
    console.error('[VoiceRoom] Error listening to participants:', error);
  });
}

/**
 * Get all participants in a room
 */
export async function getParticipants(firestore, campaignId, roomId) {
  try {
    const participantsRef = collection(firestore, 'campaigns', campaignId, 'voiceRooms', roomId, 'participants');
    const q = query(participantsRef);
    const snapshot = await getDocs(q);
    
    const participants = [];
    snapshot.forEach((doc) => {
      participants.push({ id: doc.id, ...doc.data() });
    });
    
    return participants;
  } catch (error) {
    console.error('[VoiceRoom] Error getting participants:', error);
    throw error;
  }
}

/**
 * Mute/unmute a participant (DM only)
 */
export async function muteParticipant(firestore, campaignId, roomId, userId, muted = true) {
  try {
    await updateParticipant(firestore, campaignId, roomId, userId, {
      isMuted: muted
    });
    console.log(`[VoiceRoom] ${muted ? 'Muted' : 'Unmuted'} participant ${userId}`);
  } catch (error) {
    console.error('[VoiceRoom] Error muting participant:', error);
    throw error;
  }
}

/**
 * Kick a participant from voice (DM only)
 */
export async function kickFromVoice(firestore, campaignId, roomId, userId) {
  try {
    await leaveRoom(firestore, campaignId, roomId, userId);
    console.log(`[VoiceRoom] Kicked participant ${userId} from voice`);
  } catch (error) {
    console.error('[VoiceRoom] Error kicking participant:', error);
    throw error;
  }
}
