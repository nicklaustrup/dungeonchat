import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';

/**
 * Campaign Request Service
 *
 * Manages join requests for campaigns that are full or invite-only.
 *
 * Data Model:
 * /campaignRequests/{requestId}
 *   - campaignId: string
 *   - userId: string
 *   - username: string
 *   - characterName: string
 *   - characterClass: string (optional)
 *   - message: string (optional)
 *   - status: 'pending' | 'approved' | 'denied'
 *   - createdAt: timestamp
 *   - processedAt: timestamp | null
 *   - processedBy: string | null (DM who approved/denied)
 */

/**
 * Create a join request for a campaign
 * @param {Object} firestore - Firestore instance
 * @param {string} campaignId - Campaign ID
 * @param {string} userId - User ID
 * @param {Object} requestData - Request data (characterName, characterClass, message)
 * @returns {Promise<Object>} Created request document
 */
export async function createJoinRequest(firestore, campaignId, userId, requestData) {
  // Check if user already has a pending request for this campaign
  const existingRequest = await getJoinRequest(firestore, campaignId, userId);
  if (existingRequest && existingRequest.status === 'pending') {
    throw new Error('You already have a pending request for this campaign');
  }

  // Get user profile for username
  const userDoc = await getDoc(doc(firestore, 'userProfiles', userId));
  const userData = userDoc.exists() ? userDoc.data() : {};
  const username = userData.username || userData.displayName || 'Unknown User';

  // Create request document
  const requestRef = await addDoc(collection(firestore, 'campaignRequests'), {
    campaignId,
    userId,
    username,
    characterName: requestData.characterName || '',
    characterClass: requestData.characterClass || '',
    message: requestData.message || '',
    status: 'pending',
    createdAt: serverTimestamp(),
    processedAt: null,
    processedBy: null
  });

  return {
    id: requestRef.id,
    campaignId,
    userId,
    username,
    ...requestData,
    status: 'pending',
    createdAt: new Date(),
    processedAt: null,
    processedBy: null
  };
}

/**
 * Get a join request for a specific user and campaign
 * @param {Object} firestore - Firestore instance
 * @param {string} campaignId - Campaign ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Request document or null
 */
export async function getJoinRequest(firestore, campaignId, userId) {
  const requestsRef = collection(firestore, 'campaignRequests');
  const q = query(
    requestsRef,
    where('campaignId', '==', campaignId),
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  // Get the most recent request (in case there are multiple)
  const docs = snapshot.docs.sort((a, b) => {
    const aTime = a.data().createdAt?.toMillis() || 0;
    const bTime = b.data().createdAt?.toMillis() || 0;
    return bTime - aTime;
  });

  const mostRecent = docs[0];
  return {
    id: mostRecent.id,
    ...mostRecent.data()
  };
}

/**
 * Get all pending join requests for a campaign
 * @param {Object} firestore - Firestore instance
 * @param {string} campaignId - Campaign ID
 * @returns {Promise<Array>} Array of pending request objects
 */
export async function getPendingRequests(firestore, campaignId) {
  const requestsRef = collection(firestore, 'campaignRequests');
  const q = query(
    requestsRef,
    where('campaignId', '==', campaignId),
    where('status', '==', 'pending')
  );

  const snapshot = await getDocs(q);
  const requests = [];

  snapshot.forEach(doc => {
    requests.push({
      id: doc.id,
      ...doc.data()
    });
  });

  // Sort by creation date (oldest first)
  return requests.sort((a, b) => {
    const aTime = a.createdAt?.toMillis() || 0;
    const bTime = b.createdAt?.toMillis() || 0;
    return aTime - bTime;
  });
}

/**
 * Get all join requests for a user (across all campaigns)
 * @param {Object} firestore - Firestore instance
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of request objects
 */
export async function getUserRequests(firestore, userId) {
  const requestsRef = collection(firestore, 'campaignRequests');
  const q = query(
    requestsRef,
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(q);
  const requests = [];

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();

    // Fetch campaign info
    const campaignDoc = await getDoc(doc(firestore, 'campaigns', data.campaignId));
    const campaignData = campaignDoc.exists() ? campaignDoc.data() : null;

    requests.push({
      id: docSnap.id,
      ...data,
      campaign: campaignData ? {
        id: data.campaignId,
        name: campaignData.name,
        gameSystem: campaignData.gameSystem
      } : null
    });
  }

  // Sort by creation date (newest first)
  return requests.sort((a, b) => {
    const aTime = a.createdAt?.toMillis() || 0;
    const bTime = b.createdAt?.toMillis() || 0;
    return bTime - aTime;
  });
}

/**
 * Approve a join request
 * @param {Object} firestore - Firestore instance
 * @param {string} requestId - Request ID
 * @param {string} dmId - DM user ID
 * @returns {Promise<void>}
 */
export async function approveJoinRequest(firestore, requestId, dmId) {
  const requestRef = doc(firestore, 'campaignRequests', requestId);
  const requestDoc = await getDoc(requestRef);

  if (!requestDoc.exists()) {
    throw new Error('Request not found');
  }

  const requestData = requestDoc.data();

  if (requestData.status !== 'pending') {
    throw new Error('Request has already been processed');
  }

  // Update request status
  await updateDoc(requestRef, {
    status: 'approved',
    processedAt: serverTimestamp(),
    processedBy: dmId
  });

  return requestData;
}

/**
 * Deny a join request
 * @param {Object} firestore - Firestore instance
 * @param {string} requestId - Request ID
 * @param {string} dmId - DM user ID
 * @returns {Promise<void>}
 */
export async function denyJoinRequest(firestore, requestId, dmId) {
  const requestRef = doc(firestore, 'campaignRequests', requestId);
  const requestDoc = await getDoc(requestRef);

  if (!requestDoc.exists()) {
    throw new Error('Request not found');
  }

  const requestData = requestDoc.data();

  if (requestData.status !== 'pending') {
    throw new Error('Request has already been processed');
  }

  // Update request status
  await updateDoc(requestRef, {
    status: 'denied',
    processedAt: serverTimestamp(),
    processedBy: dmId
  });
}

/**
 * Cancel a join request (by the requester)
 * @param {Object} firestore - Firestore instance
 * @param {string} requestId - Request ID
 * @param {string} userId - User ID (must match the request's userId)
 * @returns {Promise<void>}
 */
export async function cancelJoinRequest(firestore, requestId, userId) {
  const requestRef = doc(firestore, 'campaignRequests', requestId);
  const requestDoc = await getDoc(requestRef);

  if (!requestDoc.exists()) {
    throw new Error('Request not found');
  }

  const requestData = requestDoc.data();

  // Verify the user owns this request
  if (requestData.userId !== userId) {
    throw new Error('You can only cancel your own requests');
  }

  if (requestData.status !== 'pending') {
    throw new Error('Can only cancel pending requests');
  }

  // Delete the request
  await deleteDoc(requestRef);
}

/**
 * Clean up old processed requests (approved/denied older than 30 days)
 * @param {Object} firestore - Firestore instance
 * @returns {Promise<number>} Number of deleted requests
 */
export async function cleanupOldRequests(firestore) {
  const requestsRef = collection(firestore, 'campaignRequests');
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get all processed requests
  const q = query(
    requestsRef,
    where('status', 'in', ['approved', 'denied'])
  );

  const snapshot = await getDocs(q);
  let deletedCount = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const processedAt = data.processedAt?.toDate();

    if (processedAt && processedAt < thirtyDaysAgo) {
      await deleteDoc(doc(firestore, 'campaignRequests', docSnap.id));
      deletedCount++;
    }
  }

  return deletedCount;
}

const campaignRequestService = {
  createJoinRequest,
  getJoinRequest,
  getPendingRequests,
  getUserRequests,
  approveJoinRequest,
  denyJoinRequest,
  cancelJoinRequest,
  cleanupOldRequests
};

export default campaignRequestService;
