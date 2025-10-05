import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useFirebase } from '../services/FirebaseContext';
import { getCampaignById } from '../services/campaign/campaignService';
import { useJoinedCampaigns } from '../services/cache';

const CampaignContext = createContext(null);

export function CampaignProvider({ children }) {
  const { firestore, user } = useFirebase();
  const [currentCampaign, setCurrentCampaign] = useState(null);
  const [recentCampaigns, setRecentCampaigns] = useState([]);
  const [currentChannel, setCurrentChannel] = useState('general');
  
  // Use cached campaigns hook
  const { campaigns: userCampaigns, loading: campaignsLoading, refresh: refreshCampaigns } = useJoinedCampaigns();

  // Update recent campaigns when userCampaigns changes
  useEffect(() => {
    if (userCampaigns && userCampaigns.length > 0) {
      // Set recent campaigns (last 3 accessed)
      const recent = [...userCampaigns]
        .sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0))
        .slice(0, 3);
      setRecentCampaigns(recent);
    }
  }, [userCampaigns]);

  const joinCampaign = useCallback(async (campaignId) => {
    console.log('Join campaign:', campaignId);
    // This is handled by the CampaignBrowser component
    // We just need to refresh user campaigns after joining
    await refreshCampaigns();
  }, [refreshCampaigns]);

  const leaveCampaign = useCallback(async (campaignId) => {
    console.log('Leave campaign:', campaignId);
    // This is handled by campaign-specific components
    // We just need to refresh user campaigns after leaving
    await refreshCampaigns();
    
    // Clear current campaign if it's the one being left
    if (currentCampaign && currentCampaign.id === campaignId) {
      setCurrentCampaign(null);
    }
  }, [refreshCampaigns, currentCampaign]);

  const switchCampaign = useCallback(async (campaignId) => {
    if (!firestore || !campaignId || !user) return;
    
    try {
      const campaign = await getCampaignById(firestore, campaignId);
      
      // Get user's role in this campaign
      const memberDocRef = doc(firestore, 'campaigns', campaignId, 'members', user.uid);
      const memberDoc = await getDoc(memberDocRef);
      if (memberDoc.exists()) {
        campaign.userRole = memberDoc.data().role;
      }
      
      setCurrentCampaign(campaign);
      setCurrentChannel('general'); // Reset to general channel
      
      // Update recent campaigns
      const updatedRecent = [campaign, ...recentCampaigns.filter(c => c.id !== campaignId)].slice(0, 3);
      setRecentCampaigns(updatedRecent);
    } catch (error) {
      console.error('Error switching campaign:', error);
    }
  }, [firestore, recentCampaigns, user]);

  const switchChannel = useCallback((channelId) => {
    setCurrentChannel(channelId);
  }, []);

  const value = {
    currentCampaign,
    userCampaigns,
    campaignsLoading,
    recentCampaigns,
    currentChannel,
    joinCampaign,
    leaveCampaign,
    switchCampaign,
    switchChannel,
    refreshCampaigns,
    // Internal state setters for later use
    setCurrentCampaign
  };

  return (
    <CampaignContext.Provider value={value}>
      {children}
    </CampaignContext.Provider>
  );
}

export const useCampaign = () => {
  const context = useContext(CampaignContext);
  if (!context) {
    throw new Error('useCampaign must be used within a CampaignProvider');
  }
  return context;
};

export { CampaignContext };
export default CampaignContext;