import React, { createContext, useContext, useState, useCallback } from 'react';

const CampaignContext = createContext(null);

export function CampaignProvider({ children }) {
  const [currentCampaign, setCurrentCampaign] = useState(null);
  const [userCampaigns, setUserCampaigns] = useState([]);
  const [currentChannel, setCurrentChannel] = useState('general');

  // Placeholder actions - will be implemented later
  const joinCampaign = useCallback(async (campaignId) => {
    console.log('Join campaign:', campaignId);
    // TODO: Implement campaign joining logic
  }, []);

  const leaveCampaign = useCallback(async (campaignId) => {
    console.log('Leave campaign:', campaignId);
    // TODO: Implement campaign leaving logic
  }, []);

  const switchCampaign = useCallback((campaignId) => {
    console.log('Switch to campaign:', campaignId);
    // TODO: Implement campaign switching logic
  }, []);

  const switchChannel = useCallback((channelId) => {
    setCurrentChannel(channelId);
  }, []);

  const value = {
    currentCampaign,
    userCampaigns,
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