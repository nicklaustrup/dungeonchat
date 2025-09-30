import React from 'react';
import { useNavigate } from 'react-router-dom';
import './CampaignChatHeader.css';

function CampaignChatHeader({ campaign, channelName = 'General', onBackToDashboard }) {
  const navigate = useNavigate();

  const handleBackClick = () => {
    if (onBackToDashboard) {
      onBackToDashboard();
    } else if (campaign?.id) {
      navigate(`/campaign/${campaign.id}`);
    }
  };

  if (!campaign) return null;

  return (
    <div className="campaign-chat-header">
      <div className="campaign-chat-header-content">
        <button 
          className="back-to-dashboard-btn"
          onClick={handleBackClick}
          title="Back to Campaign Dashboard"
        >
          ← Dashboard
        </button>
        
        <div className="campaign-info">
          <h2 className="campaign-name">{campaign.name}</h2>
          <span className="channel-name">#{channelName}</span>
        </div>
        
        <div className="campaign-meta">
          <span className="member-count">
            {campaign.currentPlayers || 0} members
          </span>
          <span className={`campaign-status status-${campaign.status}`}>
            {campaign.status}
          </span>
        </div>
      </div>
    </div>
  );
}

export default CampaignChatHeader;