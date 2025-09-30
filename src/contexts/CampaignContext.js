import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useFirebase } from '../services/FirebaseContext';
import { getUserCampaigns, getCampaignById } from '../services/campaign/campaignService';

const CampaignContext = createContext(null);

export function CampaignProvider({ children }) {
  const { firestore, user } = useFirebase();
  const [currentCampaign, setCurrentCampaign] = useState(null);
  const [userCampaigns, setUserCampaigns] = useState([]);
  const [recentCampaigns, setRecentCampaigns] = useState([]);
  const [currentChannel, setCurrentChannel] = useState('general');

  // Load user's campaigns when user changes
  useEffect(() => {
    if (!user || !firestore) {
      setUserCampaigns([]);
      setRecentCampaigns([]);
      setCurrentCampaign(null);
      return;
    }

    const loadUserCampaigns = async () => {
      try {
        // Add debugging to check authentication state
        console.log('Loading campaigns for user:', user.uid);
        console.log('User auth token exists:', !!user.accessToken);
        
        const campaigns = await getUserCampaigns(firestore, user.uid);
        setUserCampaigns(campaigns);
        
        // Set recent campaigns (last 3 accessed)
        const recent = campaigns
          .sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0))
          .slice(0, 3);
        setRecentCampaigns(recent);
      } catch (error) {
        console.error('Error loading user campaigns:', error);
        
        // More specific error handling
        if (error.code === 'permission-denied') {
          console.error('Permission denied - user may not be properly authenticated or rules may not be deployed');
          console.error('User:', user);
          console.error('User UID:', user?.uid);
        }
      }
    };

    loadUserCampaigns();
  }, [user, firestore]);

  const joinCampaign = useCallback(async (campaignId) => {
    console.log('Join campaign:', campaignId);
    // This is handled by the CampaignBrowser component
    // We just need to refresh user campaigns after joining
    if (user && firestore) {
      const campaigns = await getUserCampaigns(firestore, user.uid);
      setUserCampaigns(campaigns);
    }
  }, [user, firestore]);

  const leaveCampaign = useCallback(async (campaignId) => {
    console.log('Leave campaign:', campaignId);
    // This is handled by campaign-specific components
    // We just need to refresh user campaigns after leaving
    if (user && firestore) {
      const campaigns = await getUserCampaigns(firestore, user.uid);
      setUserCampaigns(campaigns);
      
      // Clear current campaign if it's the one being left
      if (currentCampaign && currentCampaign.id === campaignId) {
        setCurrentCampaign(null);
      }
    }
  }, [user, firestore, currentCampaign]);

  const switchCampaign = useCallback(async (campaignId) => {
    if (!firestore || !campaignId) return;
    
    try {
      const campaign = await getCampaignById(firestore, campaignId);
      setCurrentCampaign(campaign);
      setCurrentChannel('general'); // Reset to general channel
      
      // Update recent campaigns
      const updatedRecent = [campaign, ...recentCampaigns.filter(c => c.id !== campaignId)].slice(0, 3);
      setRecentCampaigns(updatedRecent);
    } catch (error) {
      console.error('Error switching campaign:', error);
    }
  }, [firestore, recentCampaigns]);

  const switchChannel = useCallback((channelId) => {
    setCurrentChannel(channelId);
  }, []);

  const value = {
    currentCampaign,
    userCampaigns,
    recentCampaigns,
    currentChannel,
    joinCampaign,
    leaveCampaign,
    switchCampaign,
    switchChannel,
    // Internal state setters for later use
    setCurrentCampaign,
    setUserCampaigns
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