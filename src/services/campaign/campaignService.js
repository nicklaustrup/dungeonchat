import {
  collection,
  addDoc,
  setDoc,
  doc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  getDoc,
  increment,
  arrayUnion,
} from "firebase/firestore";

/**
 * Campaign Service
 * Handles all campaign-related Firestore operations
 */

export async function createCampaign(firestore, campaignData, dmId) {
  try {
    // Validate required fields
    if (!campaignData.name || !campaignData.description) {
      throw new Error("Campaign name and description are required");
    }

    if (!dmId) {
      throw new Error("DM ID is required");
    }

    // Get DM user info to add name to campaign
    const dmDoc = await getDoc(doc(firestore, "userProfiles", dmId));
    const dmData = dmDoc.exists() ? dmDoc.data() : {};
    const dmName = dmData.username || dmData.displayName || "Unknown DM";

    // Create campaign document
    const campaignRef = await addDoc(collection(firestore, "campaigns"), {
      ...campaignData,
      dmId,
      dmName,
      currentPlayers: 1,
      members: [dmId], // Track members for easy querying
      status: "recruiting",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastActivity: serverTimestamp(),
    });

    // Create default general channel
    await setDoc(
      doc(firestore, "campaigns", campaignRef.id, "channels", "general"),
      {
        id: "general",
        name: "General Chat",
        description: "Main campaign discussion",
        type: "text",
        visibility: "all",
        createdAt: serverTimestamp(),
        createdBy: dmId,
      }
    );

    // Add DM as first member
    await setDoc(doc(firestore, "campaigns", campaignRef.id, "members", dmId), {
      userId: dmId,
      role: "dm",
      status: "active",
      joinedAt: serverTimestamp(),
      lastActive: serverTimestamp(),
    });

    // Update user campaigns tracking
    await setDoc(
      doc(firestore, "userCampaigns", dmId),
      {
        activeCampaigns: [campaignRef.id],
        dmCampaigns: [campaignRef.id],
        lastViewedCampaign: campaignRef.id,
      },
      { merge: true }
    );

    return campaignRef;
  } catch (error) {
    console.error("Error creating campaign:", error);
    throw error;
  }
}

export async function joinCampaign(
  firestore,
  campaignId,
  userId,
  characterInfo = {}
) {
  try {
    // Check if character name is already taken in this campaign
    if (characterInfo.characterName) {
      const existingMembers = await getCampaignMembers(firestore, campaignId);
      const nameExists = existingMembers.some(
        (member) =>
          member.characterName &&
          member.characterName.toLowerCase() ===
            characterInfo.characterName.toLowerCase() &&
          member.userId !== userId
      );

      if (nameExists) {
        throw new Error(
          `The character name "${characterInfo.characterName}" is already taken in this campaign. Please choose a different name.`
        );
      }
    }

    // Add user as campaign member
    await setDoc(doc(firestore, "campaigns", campaignId, "members", userId), {
      userId,
      role: "player",
      status: "active",
      joinedAt: serverTimestamp(),
      lastActive: serverTimestamp(),
      ...characterInfo,
    });

    // Update campaign to include user in members array and increment player count
    await updateDoc(doc(firestore, "campaigns", campaignId), {
      members: arrayUnion(userId),
      currentPlayers: increment(1),
      updatedAt: serverTimestamp(),
    });

    // Update user campaigns tracking
    await setDoc(
      doc(firestore, "userCampaigns", userId),
      {
        activeCampaigns: [campaignId], // TODO: Merge with existing campaigns
        lastViewedCampaign: campaignId,
      },
      { merge: true }
    );

    return true;
  } catch (error) {
    console.error("Error joining campaign:", error);
    throw error;
  }
}

export async function searchCampaigns(firestore, filters = {}) {
  try {
    // Simplest possible query - just filter by visibility
    // No orderBy to avoid index requirements
    let q = query(
      collection(firestore, "campaigns"),
      where("visibility", "==", "public")
    );

    const snapshot = await getDocs(q);
    let campaigns = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Update dmName to use current username if available
    const dmUpdates = new Map();
    for (const campaign of campaigns) {
      if (campaign.dmId && !dmUpdates.has(campaign.dmId)) {
        try {
          const dmDoc = await getDoc(
            doc(firestore, "userProfiles", campaign.dmId)
          );
          if (dmDoc.exists()) {
            const dmData = dmDoc.data();
            const currentDmName =
              dmData.username || dmData.displayName || "Unknown DM";
            dmUpdates.set(campaign.dmId, currentDmName);
          }
        } catch (error) {
          console.warn(
            "Failed to fetch DM profile for campaign:",
            campaign.id,
            error
          );
        }
      }
    }

    // Apply DM name updates
    campaigns = campaigns.map((campaign) => ({
      ...campaign,
      dmName: dmUpdates.get(campaign.dmId) || campaign.dmName || "Unknown DM",
    }));

    // Apply all filtering and sorting client-side
    // Filter by status client-side
    campaigns = campaigns.filter((campaign) =>
      ["recruiting", "active"].includes(campaign.status)
    );

    // Apply filters client-side to avoid complex indexing
    if (filters.gameSystem) {
      campaigns = campaigns.filter(
        (campaign) => campaign.gameSystem === filters.gameSystem
      );
    }

    // Add tag filter if specified
    if (filters.tags && filters.tags.length > 0) {
      campaigns = campaigns.filter((campaign) =>
        filters.tags.every(
          (tag) => campaign.tags && campaign.tags.includes(tag)
        )
      );
    }

    // Apply search term filter if specified
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      campaigns = campaigns.filter(
        (campaign) =>
          campaign.name.toLowerCase().includes(searchLower) ||
          campaign.description.toLowerCase().includes(searchLower) ||
          campaign.gameSystem.toLowerCase().includes(searchLower)
      );
    }

    // Sort by creation date (most recent first) - client-side
    campaigns.sort((a, b) => {
      const dateA = a.createdAt?.toDate
        ? a.createdAt.toDate()
        : new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate
        ? b.createdAt.toDate()
        : new Date(b.createdAt || 0);
      return dateB - dateA;
    });

    return campaigns;
  } catch (error) {
    console.error("Error searching campaigns:", error);
    throw error;
  }
}

export async function getCampaign(firestore, campaignId) {
  try {
    const campaignDoc = await getDoc(doc(firestore, "campaigns", campaignId));
    if (!campaignDoc.exists()) {
      throw new Error("Campaign not found");
    }
    return {
      id: campaignDoc.id,
      ...campaignDoc.data(),
    };
  } catch (error) {
    console.error("Error getting campaign:", error);
    throw error;
  }
}

export async function getCampaignMembers(firestore, campaignId) {
  try {
    const membersSnapshot = await getDocs(
      collection(firestore, "campaigns", campaignId, "members")
    );

    // Fetch user profile data for each member
    const membersWithProfiles = await Promise.all(
      membersSnapshot.docs.map(async (memberDoc) => {
        const memberData = { id: memberDoc.id, ...memberDoc.data() };

        try {
          // Get user profile data
          const profileDoc = await getDoc(
            doc(firestore, "userProfiles", memberData.userId)
          );
          if (profileDoc.exists()) {
            const profileData = profileDoc.data();
            memberData.displayName = profileData.displayName || "Unknown User";
            memberData.username = profileData.username || null;
            memberData.photoURL = profileData.photoURL || null;
            memberData.email = profileData.email || null;
          } else {
            memberData.displayName = "Unknown User";
          }
        } catch (profileError) {
          console.warn(
            "Could not fetch profile for user:",
            memberData.userId,
            profileError
          );
          memberData.displayName = "Unknown User";
        }

        return memberData;
      })
    );

    return membersWithProfiles;
  } catch (error) {
    console.error("Error getting campaign members:", error);
    throw error;
  }
}

export async function getCampaignChannels(firestore, campaignId) {
  try {
    const channelsSnapshot = await getDocs(
      collection(firestore, "campaigns", campaignId, "channels")
    );
    return channelsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting campaign channels:", error);
    throw error;
  }
}

// Additional functions needed by the dashboard components

export async function leaveCampaign(firestore, campaignId, userId) {
  try {
    // Remove user from campaign members
    await deleteDoc(doc(firestore, "campaigns", campaignId, "members", userId));

    // Update campaign player count
    await updateDoc(doc(firestore, "campaigns", campaignId), {
      currentPlayers: increment(-1),
      updatedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error("Error leaving campaign:", error);
    throw error;
  }
}

export async function removeCampaignMember(firestore, campaignId, memberId) {
  try {
    // Remove member from campaign
    await deleteDoc(
      doc(firestore, "campaigns", campaignId, "members", memberId)
    );

    // Update campaign player count
    await updateDoc(doc(firestore, "campaigns", campaignId), {
      currentPlayers: increment(-1),
      updatedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error("Error removing campaign member:", error);
    throw error;
  }
}

export async function updateCampaignMember(
  firestore,
  campaignId,
  memberId,
  updates
) {
  try {
    await updateDoc(
      doc(firestore, "campaigns", campaignId, "members", memberId),
      {
        ...updates,
        lastActive: serverTimestamp(),
      }
    );

    return true;
  } catch (error) {
    console.error("Error updating campaign member:", error);
    throw error;
  }
}

export async function createCampaignChannel(
  firestore,
  campaignId,
  channelData
) {
  try {
    const channelRef = doc(
      collection(firestore, "campaigns", campaignId, "channels")
    );
    await setDoc(channelRef, {
      ...channelData,
      id: channelRef.id,
      campaignId,
      createdAt: serverTimestamp(),
      createdBy: channelData.createdBy,
      messageCount: 0,
    });

    return {
      id: channelRef.id,
      ...channelData,
      campaignId,
      createdAt: serverTimestamp(),
      messageCount: 0,
    };
  } catch (error) {
    console.error("Error creating campaign channel:", error);
    throw error;
  }
}

export async function deleteCampaignChannel(firestore, campaignId, channelId) {
  try {
    // Don't allow deleting the general channel
    const channelDoc = await getDoc(
      doc(firestore, "campaigns", campaignId, "channels", channelId)
    );
    if (channelDoc.exists() && channelDoc.data().id === "general") {
      throw new Error("Cannot delete the general channel");
    }

    await deleteDoc(
      doc(firestore, "campaigns", campaignId, "channels", channelId)
    );
    return true;
  } catch (error) {
    console.error("Error deleting campaign channel:", error);
    throw error;
  }
}

/**
 * Get all campaigns for a specific user
 */
export async function getUserCampaigns(firestore, userId) {
  try {
    const q = query(
      collection(firestore, "campaigns"),
      where("members", "array-contains", userId)
    );

    const snapshot = await getDocs(q);
    const campaigns = [];

    for (const docSnapshot of snapshot.docs) {
      const campaignData = { id: docSnapshot.id, ...docSnapshot.data() };

      // Get user's role in this campaign
      const memberDocRef = doc(
        firestore,
        "campaigns",
        docSnapshot.id,
        "members",
        userId
      );
      const memberDoc = await getDoc(memberDocRef);
      if (memberDoc.exists()) {
        campaignData.userRole = memberDoc.data().role;
      }

      campaigns.push(campaignData);
    }

    return campaigns;
  } catch (error) {
    console.error("Error getting user campaigns:", error);
    throw error;
  }
}

/**
 * Get a specific campaign by ID
 */
export async function getCampaignById(firestore, campaignId) {
  try {
    const campaignDoc = await getDoc(doc(firestore, "campaigns", campaignId));

    if (!campaignDoc.exists()) {
      throw new Error("Campaign not found");
    }

    return { id: campaignDoc.id, ...campaignDoc.data() };
  } catch (error) {
    console.error("Error getting campaign by ID:", error);
    throw error;
  }
}
