import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCampaign } from '../../contexts/CampaignContext';
import './Breadcrumb.css';

function Breadcrumb() {
  const location = useLocation();
  const { currentCampaign } = useCampaign();
  
  // Only show breadcrumbs for campaign-related pages
  if (!location.pathname.startsWith('/campaign/')) {
    return null;
  }

  const campaignId = location.pathname.split('/')[2];
  const isInChat = location.pathname.includes('/chat');
  const channelId = location.pathname.split('/')[4] || 'general';

  return (
    <nav className="breadcrumb">
      <ol className="breadcrumb-list">
        <li className="breadcrumb-item">
          <Link to="/campaigns" className="breadcrumb-link">
            Campaigns
          </Link>
        </li>
        
        <li className="breadcrumb-separator">›</li>
        
        <li className="breadcrumb-item">
          <Link 
            to={`/campaign/${campaignId}`} 
            className="breadcrumb-link"
          >
            {currentCampaign?.name || 'Campaign'}
          </Link>
        </li>
        
        {isInChat && (
          <>
            <li className="breadcrumb-separator">›</li>
            <li className="breadcrumb-item active">
              <span className="breadcrumb-current">
                {getChannelDisplayName(channelId)}
              </span>
            </li>
          </>
        )}
      </ol>
    </nav>
  );
}

function getChannelDisplayName(channelId) {
  const channelNames = {
    'general': 'General',
    'ooc': 'Out of Character',
    'character-discussion': 'Character Discussion',
    'dm-only': 'DM Only'
  };
  
  return channelNames[channelId] || channelId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export default Breadcrumb;