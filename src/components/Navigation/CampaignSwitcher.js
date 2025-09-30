import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCampaign } from '../../contexts/CampaignContext';
import './CampaignSwitcher.css';

function CampaignSwitcher() {
  const navigate = useNavigate();
  const { userCampaigns, recentCampaigns, currentCampaign, switchCampaign, loading } = useCampaign();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleCampaignSelect = async (campaignId) => {
    await switchCampaign(campaignId);
    navigate(`/campaign/${campaignId}`);
    setIsOpen(false);
  };

  const handleViewAllCampaigns = () => {
    navigate('/campaigns');
    setIsOpen(false);
  };

  const handleCreateCampaign = () => {
    navigate('/create-campaign');
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className="campaign-switcher loading">
        <span>Loading...</span>
      </div>
    );
  }

  if (userCampaigns.length === 0) {
    return (
      <div className="campaign-switcher no-campaigns">
        <button onClick={handleCreateCampaign} className="create-first-campaign-btn">
          Create Your First Campaign
        </button>
      </div>
    );
  }

  return (
    <div className="campaign-switcher" ref={dropdownRef}>
      <button 
        className={`campaign-switcher-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="campaign-icon">⚔️</span>
        <span className="campaign-name">
          {currentCampaign ? currentCampaign.name : 'Select Campaign'}
        </span>
        <span className="dropdown-arrow">▼</span>
      </button>

      {isOpen && (
        <div className="campaign-dropdown">
          {recentCampaigns.length > 0 && (
            <>
              <div className="dropdown-section">
                <div className="dropdown-header">Recent Campaigns</div>
                {recentCampaigns.map(campaign => (
                  <button
                    key={campaign.id}
                    className={`campaign-item ${currentCampaign?.id === campaign.id ? 'active' : ''}`}
                    onClick={() => handleCampaignSelect(campaign.id)}
                  >
                    <div className="campaign-info">
                      <span className="campaign-name">{campaign.name}</span>
                      <span className="campaign-role">
                        {campaign.userRole === 'dm' ? '👑 DM' : '🎭 Player'}
                      </span>
                    </div>
                    <span className="campaign-status">{campaign.status}</span>
                  </button>
                ))}
              </div>
              <div className="dropdown-divider" />
            </>
          )}

          <div className="dropdown-section">
            <button 
              className="dropdown-action"
              onClick={handleViewAllCampaigns}
            >
              
              View All Campaigns ({userCampaigns.length})
            </button>
            <button 
              className="dropdown-action"
              onClick={handleCreateCampaign}
            >
              
              Create New Campaign
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CampaignSwitcher;