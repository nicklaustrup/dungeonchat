import { 
  collection, 
  addDoc, 
  setDoc, 
  doc, 
  serverTimestamp,
  query,
  where,
  getDocs,
  getDoc
} from 'firebase/firestore';

/**
 * Campaign Service
 * Handles all campaign-related Firestore operations
 */

export async function createCampaign(firestore, campaignData, dmId) {
  try {
    // Validate required fields
    if (!campaignData.name || !campaignData.description) {
      throw new Error('Campaign name and description are required');
    }
    
    if (!dmId) {
      throw new Error('DM ID is required');
    }
    
    // Create campaign document
    const campaignRef = await addDoc(collection(firestore, 'campaigns'), {
      ...campaignData,
      dmId,
      currentPlayers: 1,
      status: 'recruiting',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastActivity: serverTimestamp()
    });

    // Create default general channel
    await setDoc(doc(firestore, 'campaigns', campaignRef.id, 'channels', 'general'), {
      id: 'general',
      name: 'General Chat',
      description: 'Main campaign discussion',
      type: 'text',
      visibility: 'all',
      createdAt: serverTimestamp(),
      createdBy: dmId
    });

    // Add DM as first member
    await setDoc(doc(firestore, 'campaigns', campaignRef.id, 'members', dmId), {
      userId: dmId,
      role: 'dm',
      status: 'active',
      joinedAt: serverTimestamp(),
      lastActive: serverTimestamp()
    });

    // Update user campaigns tracking
    await setDoc(doc(firestore, 'userCampaigns', dmId), {
      activeCampaigns: [campaignRef.id],
      dmCampaigns: [campaignRef.id],
      lastViewedCampaign: campaignRef.id
    }, { merge: true });

    return campaignRef;
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }
}

export async function joinCampaign(firestore, campaignId, userId, characterInfo = {}) {
  try {
    // Add user as campaign member
    await setDoc(doc(firestore, 'campaigns', campaignId, 'members', userId), {
      userId,
      role: 'player',
      status: 'active',
      joinedAt: serverTimestamp(),
      lastActive: serverTimestamp(),
      ...characterInfo
    });

    // Update user campaigns tracking
    await setDoc(doc(firestore, 'userCampaigns', userId), {
      activeCampaigns: [campaignId], // TODO: Merge with existing campaigns
      lastViewedCampaign: campaignId
    }, { merge: true });

    // TODO: Update campaign currentPlayers count

    return true;
  } catch (error) {
    console.error('Error joining campaign:', error);
    throw error;
  }
}

export async function searchCampaigns(firestore, filters = {}) {
  try {
    // Simplest possible query - just filter by visibility
    // No orderBy to avoid index requirements
    let q = query(
      collection(firestore, 'campaigns'),
      where('visibility', '==', 'public')
    );

    const snapshot = await getDocs(q);
    let campaigns = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Apply all filtering and sorting client-side
    // Filter by status client-side
    campaigns = campaigns.filter(campaign => 
      ['recruiting', 'active'].includes(campaign.status)
    );

    // Apply filters client-side to avoid complex indexing
    if (filters.gameSystem) {
      campaigns = campaigns.filter(campaign => 
        campaign.gameSystem === filters.gameSystem
      );
    }

    // Add tag filter if specified
    if (filters.tags && filters.tags.length > 0) {
      campaigns = campaigns.filter(campaign => 
        filters.tags.every(tag => campaign.tags && campaign.tags.includes(tag))
      );
    }

    // Apply search term filter if specified
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      campaigns = campaigns.filter(campaign => 
        campaign.name.toLowerCase().includes(searchLower) ||
        campaign.description.toLowerCase().includes(searchLower) ||
        campaign.gameSystem.toLowerCase().includes(searchLower)
      );
    }

    // Sort by creation date (most recent first) - client-side
    campaigns.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return dateB - dateA;
    });

    return campaigns;
  } catch (error) {
    console.error('Error searching campaigns:', error);
    throw error;
  }
}

export async function getCampaign(firestore, campaignId) {
  try {
    const campaignDoc = await getDoc(doc(firestore, 'campaigns', campaignId));
    if (!campaignDoc.exists()) {
      throw new Error('Campaign not found');
    }
    return {
      id: campaignDoc.id,
      ...campaignDoc.data()
    };
  } catch (error) {
    console.error('Error getting campaign:', error);
    throw error;
  }
}

export async function getCampaignMembers(firestore, campaignId) {
  try {
    const membersSnapshot = await getDocs(
      collection(firestore, 'campaigns', campaignId, 'members')
    );
    return membersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting campaign members:', error);
    throw error;
  }
}

export async function getCampaignChannels(firestore, campaignId) {
  try {
    const channelsSnapshot = await getDocs(
      collection(firestore, 'campaigns', campaignId, 'channels')
    );
    return channelsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting campaign channels:', error);
    throw error;
  }
}