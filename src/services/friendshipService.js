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
import { firestore } from './firebase';

/**
 * Friendship Service
 *
 * Manages friend requests, friendships, and blocked users.
 *
 * Data Model:
 * /friendships/{friendshipId}
 *   - userId1: string (alphabetically first user ID)
 *   - userId2: string (alphabetically second user ID)
 *   - status: 'pending' | 'accepted' | 'blocked'
 *   - initiatorId: string (user who sent the request)
 *   - createdAt: timestamp
 *   - acceptedAt: timestamp | null
 *
 * /users/{userId}
 *   - friends: array of friend user IDs
 *   - blocked: array of blocked user IDs
 */

/**
 * Normalize user IDs to ensure consistent ordering
 * Always returns [smaller, larger] alphabetically
 */
function normalizeUserIds(userId1, userId2) {
  return userId1 < userId2
    ? [userId1, userId2]
    : [userId2, userId1];
}

/**
 * Search users by username
 * @param {string} searchTerm - Username to search for (partial match)
 * @returns {Promise<Array>} Array of user profile objects
 */
export async function searchUsersByUsername(searchTerm) {
  if (!searchTerm || searchTerm.trim().length === 0) {
    return [];
  }

  const searchLower = searchTerm.toLowerCase().trim();

  // Query usernames collection for matches
  const usernamesRef = collection(firestore, 'usernames');
  const q = query(usernamesRef);
  const snapshot = await getDocs(q);

  // Filter results in memory for partial matches
  const matchingUserIds = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    const username = data.username?.toLowerCase() || '';
    const userId = data.userId || data.uid;

    // Only add if we have both username and userId
    if (username.includes(searchLower) && userId) {
      matchingUserIds.push(userId);
    }
  });

  // Fetch user profiles for matching user IDs (limit to first 20)
  const limitedUserIds = matchingUserIds.slice(0, 20);
  const userProfiles = [];

  for (const userId of limitedUserIds) {
    if (!userId) continue; // Skip if userId is undefined/null

    const userDoc = await getDoc(doc(firestore, 'userProfiles', userId));
    if (userDoc.exists()) {
      userProfiles.push({
        id: userId,
        ...userDoc.data()
      });
    }
  }

  return userProfiles;
}

/**
 * Get friendship document between two users (if exists)
 * @param {string} userId1
 * @param {string} userId2
 * @returns {Promise<Object|null>} Friendship document or null
 */
export async function getFriendship(userId1, userId2) {
  const [normalizedId1, normalizedId2] = normalizeUserIds(userId1, userId2);

  const friendshipsRef = collection(firestore, 'friendships');
  const q = query(
    friendshipsRef,
    where('userId1', '==', normalizedId1),
    where('userId2', '==', normalizedId2)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data()
  };
}

/**
 * Send a friend request
 * @param {string} fromUserId - User sending the request
 * @param {string} toUserId - User receiving the request
 * @returns {Promise<Object>} Created friendship document
 */
export async function sendFriendRequest(fromUserId, toUserId) {
  if (fromUserId === toUserId) {
    throw new Error('Cannot send friend request to yourself');
  }

  // Check if friendship already exists
  const existing = await getFriendship(fromUserId, toUserId);
  if (existing) {
    if (existing.status === 'accepted') {
      throw new Error('Already friends');
    }
    if (existing.status === 'pending') {
      throw new Error('Friend request already sent');
    }
    if (existing.status === 'blocked') {
      throw new Error('Cannot send friend request to blocked user');
    }
  }

  const [normalizedId1, normalizedId2] = normalizeUserIds(fromUserId, toUserId);

  const friendshipData = {
    userId1: normalizedId1,
    userId2: normalizedId2,
    status: 'pending',
    initiatorId: fromUserId,
    createdAt: serverTimestamp(),
    acceptedAt: null
  };

  const friendshipsRef = collection(firestore, 'friendships');
  const docRef = await addDoc(friendshipsRef, friendshipData);

  return {
    id: docRef.id,
    ...friendshipData
  };
}

/**
 * Accept a friend request
 * @param {string} friendshipId - Friendship document ID
 * @param {string} acceptingUserId - User accepting the request
 * @returns {Promise<void>}
 */
export async function acceptFriendRequest(friendshipId, acceptingUserId) {
  const friendshipRef = doc(firestore, 'friendships', friendshipId);
  const friendshipDoc = await getDoc(friendshipRef);

  if (!friendshipDoc.exists()) {
    throw new Error('Friendship not found');
  }

  const friendship = friendshipDoc.data();

  // Verify the accepting user is the recipient
  if (friendship.initiatorId === acceptingUserId) {
    throw new Error('Cannot accept your own friend request');
  }

  // Verify status is pending
  if (friendship.status !== 'pending') {
    throw new Error('Friend request is not pending');
  }

  // Update friendship to accepted
  await updateDoc(friendshipRef, {
    status: 'accepted',
    acceptedAt: serverTimestamp()
  });

  // Update both users' friends arrays
  const user1Ref = doc(firestore, 'userProfiles', friendship.userId1);
  const user2Ref = doc(firestore, 'userProfiles', friendship.userId2);

  const user1Doc = await getDoc(user1Ref);
  const user2Doc = await getDoc(user2Ref);

  const user1Friends = user1Doc.data()?.friends || [];
  const user2Friends = user2Doc.data()?.friends || [];

  // Add to friends arrays if not already there
  if (!user1Friends.includes(friendship.userId2)) {
    await updateDoc(user1Ref, {
      friends: [...user1Friends, friendship.userId2]
    });
  }

  if (!user2Friends.includes(friendship.userId1)) {
    await updateDoc(user2Ref, {
      friends: [...user2Friends, friendship.userId1]
    });
  }
}

/**
 * Decline a friend request
 * @param {string} friendshipId - Friendship document ID
 * @returns {Promise<void>}
 */
export async function declineFriendRequest(friendshipId) {
  const friendshipRef = doc(firestore, 'friendships', friendshipId);
  await deleteDoc(friendshipRef);
}

/**
 * Unfriend a user (remove friendship)
 * @param {string} userId1
 * @param {string} userId2
 * @returns {Promise<void>}
 */
export async function unfriend(userId1, userId2) {
  const friendship = await getFriendship(userId1, userId2);

  if (!friendship) {
    throw new Error('Friendship not found');
  }

  if (friendship.status !== 'accepted') {
    throw new Error('Not currently friends');
  }

  // Delete friendship document
  await deleteDoc(doc(firestore, 'friendships', friendship.id));

  // Remove from both users' friends arrays
  const user1Ref = doc(firestore, 'userProfiles', friendship.userId1);
  const user2Ref = doc(firestore, 'userProfiles', friendship.userId2);

  const user1Doc = await getDoc(user1Ref);
  const user2Doc = await getDoc(user2Ref);

  const user1Friends = (user1Doc.data()?.friends || []).filter(id => id !== friendship.userId2);
  const user2Friends = (user2Doc.data()?.friends || []).filter(id => id !== friendship.userId1);

  await updateDoc(user1Ref, { friends: user1Friends });
  await updateDoc(user2Ref, { friends: user2Friends });
}

/**
 * Block a user
 * @param {string} blockingUserId - User doing the blocking
 * @param {string} blockedUserId - User being blocked
 * @returns {Promise<void>}
 */
export async function blockUser(blockingUserId, blockedUserId) {
  if (blockingUserId === blockedUserId) {
    throw new Error('Cannot block yourself');
  }

  // Check if already blocked
  const userRef = doc(firestore, 'userProfiles', blockingUserId);
  const userDoc = await getDoc(userRef);
  const blocked = userDoc.data()?.blocked || [];

  if (blocked.includes(blockedUserId)) {
    throw new Error('User already blocked');
  }

  // Add to blocked array
  await updateDoc(userRef, {
    blocked: [...blocked, blockedUserId]
  });

  // If friends, remove friendship
  const friendship = await getFriendship(blockingUserId, blockedUserId);
  if (friendship && friendship.status === 'accepted') {
    await unfriend(blockingUserId, blockedUserId);
  }

  // Update or create friendship document with blocked status
  if (friendship) {
    await updateDoc(doc(firestore, 'friendships', friendship.id), {
      status: 'blocked',
      acceptedAt: null
    });
  } else {
    const [normalizedId1, normalizedId2] = normalizeUserIds(blockingUserId, blockedUserId);
    await addDoc(collection(firestore, 'friendships'), {
      userId1: normalizedId1,
      userId2: normalizedId2,
      status: 'blocked',
      initiatorId: blockingUserId,
      createdAt: serverTimestamp(),
      acceptedAt: null
    });
  }
}

/**
 * Unblock a user
 * @param {string} blockingUserId - User who blocked
 * @param {string} blockedUserId - User who was blocked
 * @returns {Promise<void>}
 */
export async function unblockUser(blockingUserId, blockedUserId) {
  // Remove from blocked array
  const userRef = doc(firestore, 'userProfiles', blockingUserId);
  const userDoc = await getDoc(userRef);
  const blocked = (userDoc.data()?.blocked || []).filter(id => id !== blockedUserId);

  await updateDoc(userRef, {
    blocked: blocked
  });

  // Delete blocked friendship document
  const friendship = await getFriendship(blockingUserId, blockedUserId);
  if (friendship && friendship.status === 'blocked') {
    await deleteDoc(doc(firestore, 'friendships', friendship.id));
  }
}

/**
 * Get all friends for a user
 * @param {string} userId
 * @returns {Promise<Array>} Array of friend user profiles
 */
export async function getFriends(userId) {
  const userRef = doc(firestore, 'userProfiles', userId);
  const userDoc = await getDoc(userRef);
  const friendIds = userDoc.data()?.friends || [];

  if (friendIds.length === 0) {
    return [];
  }

  // Fetch all friend profiles
  const friendProfiles = [];
  for (const friendId of friendIds) {
    const friendDoc = await getDoc(doc(firestore, 'userProfiles', friendId));
    if (friendDoc.exists()) {
      friendProfiles.push({
        id: friendId,
        ...friendDoc.data()
      });
    }
  }

  return friendProfiles;
}

/**
 * Get pending friend requests for a user (received)
 * @param {string} userId
 * @returns {Promise<Array>} Array of pending request objects with user profiles
 */
export async function getPendingFriendRequests(userId) {
  const friendshipsRef = collection(firestore, 'friendships');

  // We need to do two separate queries because of Firestore composite filter limitations
  // Query 1: userId1 == userId AND status == 'pending'
  const q1 = query(
    friendshipsRef,
    where('userId1', '==', userId),
    where('status', '==', 'pending')
  );

  // Query 2: userId2 == userId AND status == 'pending'
  const q2 = query(
    friendshipsRef,
    where('userId2', '==', userId),
    where('status', '==', 'pending')
  );

  const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);
  const requests = [];

  // Process results from both queries
  const allDocs = [...snapshot1.docs, ...snapshot2.docs];

  for (const docSnap of allDocs) {
    const data = docSnap.data();
    const initiatorId = data.initiatorId;

    // Only include requests where this user is NOT the initiator (received requests)
    if (initiatorId !== userId) {
      // Fetch initiator profile
      const initiatorDoc = await getDoc(doc(firestore, 'userProfiles', initiatorId));

      if (initiatorDoc.exists()) {
        requests.push({
          id: docSnap.id,
          friendship: data,
          from: {
            id: initiatorId,
            ...initiatorDoc.data()
          }
        });
      }
    }
  }

  return requests;
}

/**
 * Get sent friend requests (pending, sent by user)
 * @param {string} userId
 * @returns {Promise<Array>} Array of sent request objects with user profiles
 */
export async function getSentFriendRequests(userId) {
  const friendshipsRef = collection(firestore, 'friendships');

  const q = query(
    friendshipsRef,
    where('status', '==', 'pending'),
    where('initiatorId', '==', userId)
  );

  const snapshot = await getDocs(q);
  const requests = [];

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const recipientId = data.userId1 === userId ? data.userId2 : data.userId1;

    // Fetch recipient profile
    const recipientDoc = await getDoc(doc(firestore, 'userProfiles', recipientId));

    if (recipientDoc.exists()) {
      requests.push({
        id: docSnap.id,
        friendship: data,
        to: {
          id: recipientId,
          ...recipientDoc.data()
        }
      });
    }
  }

  return requests;
}

/**
 * Get blocked users for a user
 * @param {string} userId
 * @returns {Promise<Array>} Array of blocked user profiles
 */
export async function getBlockedUsers(userId) {
  const userRef = doc(firestore, 'userProfiles', userId);
  const userDoc = await getDoc(userRef);
  const blockedIds = userDoc.data()?.blocked || [];

  if (blockedIds.length === 0) {
    return [];
  }

  // Fetch all blocked user profiles
  const blockedProfiles = [];
  for (const blockedId of blockedIds) {
    const blockedDoc = await getDoc(doc(firestore, 'userProfiles', blockedId));
    if (blockedDoc.exists()) {
      blockedProfiles.push({
        id: blockedId,
        ...blockedDoc.data()
      });
    }
  }

  return blockedProfiles;
}

/**
 * Check friendship status between two users
 * @param {string} userId1
 * @param {string} userId2
 * @returns {Promise<string>} Status: 'friends' | 'pending_sent' | 'pending_received' | 'blocked' | 'none'
 */
export async function getFriendshipStatus(userId1, userId2) {
  if (userId1 === userId2) {
    return 'self';
  }

  const friendship = await getFriendship(userId1, userId2);

  if (!friendship) {
    return 'none';
  }

  if (friendship.status === 'accepted') {
    return 'friends';
  }

  if (friendship.status === 'blocked') {
    return 'blocked';
  }

  if (friendship.status === 'pending') {
    // Check if user1 sent the request
    if (friendship.initiatorId === userId1) {
      return 'pending_sent';
    } else {
      return 'pending_received';
    }
  }

  return 'none';
}
const friendshipService = {
  searchUsersByUsername,
  getFriendship,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  unfriend,
  blockUser,
  unblockUser,
  getFriends,
  getPendingFriendRequests,
  getSentFriendRequests,
  getBlockedUsers,
  getFriendshipStatus
};

export default friendshipService;