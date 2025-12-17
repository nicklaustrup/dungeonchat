/**
 * Dice History Service
 * Handles dice roll history tracking and statistics for campaigns
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
} from "firebase/firestore";

/**
 * Get dice roll history for a campaign
 * @param {Object} firestore - Firestore instance
 * @param {string} campaignId - Campaign ID
 * @param {number} limitCount - Number of recent rolls to fetch
 * @returns {Array} Array of dice roll data with metadata
 */
export async function getCampaignDiceHistory(
  firestore,
  campaignId,
  limitCount = 50
) {
  try {
    if (!campaignId) {
      // For lobby/general chat, get from main messages collection
      const q = query(
        collection(firestore, "messages"),
        where("type", "==", "dice_roll"),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().createdAt?.toDate?.() || new Date(),
      }));
    }

    // For campaign chat, search across all channels
    const campaignRef = doc(firestore, "campaigns", campaignId);
    const channelsSnapshot = await getDocs(collection(campaignRef, "channels"));

    const allRolls = [];

    // Fetch dice rolls from all channels
    for (const channelDoc of channelsSnapshot.docs) {
      try {
        const q = query(
          collection(campaignRef, "channels", channelDoc.id, "messages"),
          where("type", "==", "dice_roll"),
          orderBy("createdAt", "desc"),
          limit(limitCount)
        );

        const snapshot = await getDocs(q);
        const channelRolls = snapshot.docs.map((doc) => ({
          id: doc.id,
          channelId: channelDoc.id,
          channelName: channelDoc.data().name || channelDoc.id,
          ...doc.data(),
          timestamp: doc.data().createdAt?.toDate?.() || new Date(),
        }));

        allRolls.push(...channelRolls);
      } catch (channelError) {
        console.warn(
          `Error fetching dice rolls from channel ${channelDoc.id}:`,
          channelError
        );
        // Continue with other channels if one fails
      }
    }

    // Sort all rolls by timestamp and limit
    return allRolls
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limitCount);
  } catch (error) {
    console.error("Error fetching dice history:", error);

    // If indexes are still building, provide a helpful error message
    if (
      error.code === "failed-precondition" &&
      error.message.includes("index")
    ) {
      throw new Error(
        "Dice history indexes are still building. Please wait a few minutes and try again."
      );
    }

    // Re-throw other errors
    throw error;
  }
}

/**
 * Get dice roll statistics for a campaign
 * @param {Object} firestore - Firestore instance
 * @param {string} campaignId - Campaign ID
 * @param {string} userId - User ID (optional, for user-specific stats)
 * @returns {Object} Statistics object
 */
export async function getCampaignDiceStatistics(
  firestore,
  campaignId,
  userId = null
) {
  const rolls = await getCampaignDiceHistory(firestore, campaignId, 200); // Get more data for stats

  let filteredRolls = rolls;
  if (userId) {
    filteredRolls = rolls.filter((roll) => roll.uid === userId);
  }

  if (filteredRolls.length === 0) {
    return {
      totalRolls: 0,
      averageRoll: 0,
      highestRoll: 0,
      lowestRoll: 0,
      criticalHits: 0,
      criticalFails: 0,
      mostUsedDie: null,
      rollsByType: {},
      recentActivity: [],
    };
  }

  // Calculate statistics
  const rollTotals = filteredRolls.map((roll) => roll.diceData?.total || 0);
  const totalRolls = filteredRolls.length;
  const averageRoll =
    rollTotals.reduce((sum, total) => sum + total, 0) / totalRolls;
  const highestRoll = Math.max(...rollTotals);
  const lowestRoll = Math.min(...rollTotals);

  // Count criticals
  const criticalHits = filteredRolls.filter(
    (roll) =>
      roll.diceData?.individual?.includes(20) &&
      roll.diceData?.notation?.includes("d20")
  ).length;

  const criticalFails = filteredRolls.filter(
    (roll) =>
      roll.diceData?.individual?.includes(1) &&
      roll.diceData?.notation?.includes("d20")
  ).length;

  // Count die types
  const rollsByType = {};
  filteredRolls.forEach((roll) => {
    const notation = roll.diceData?.notation || "unknown";
    rollsByType[notation] = (rollsByType[notation] || 0) + 1;
  });

  // Find most used die
  const mostUsedDie =
    Object.entries(rollsByType).sort(([, a], [, b]) => b - a)[0]?.[0] || null;

  // Recent activity (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const recentActivity = filteredRolls.filter(
    (roll) => roll.timestamp > weekAgo
  ).length;

  return {
    totalRolls,
    averageRoll: Math.round(averageRoll * 100) / 100,
    highestRoll,
    lowestRoll,
    criticalHits,
    criticalFails,
    mostUsedDie,
    rollsByType,
    recentActivity,
  };
}

/**
 * Get user-specific dice statistics across all campaigns
 * @param {Object} firestore - Firestore instance
 * @param {string} userId - User ID
 * @returns {Object} User's dice statistics
 */
export async function getUserDiceStatistics(firestore, userId) {
  // This would require more complex querying
  // For now, we'll implement per-campaign stats
  // Future enhancement: aggregate user stats across campaigns
  return {
    totalRolls: 0,
    campaignStats: {},
    favoriteNotation: null,
    totalCriticals: 0,
  };
}
