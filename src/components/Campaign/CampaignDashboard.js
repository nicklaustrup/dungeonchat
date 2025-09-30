import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFirebase } from '../../services/FirebaseContext';
import { leaveCampaign } from '../../services/campaign/campaignService';
import { onSnapshot, doc } from 'firebase/firestore';
import { useCampaignMembers } from '../../hooks/useCampaignMembers';
import CampaignMemberList from './CampaignMemberList';
import ChannelSidebar from './ChannelSidebar';
import CampaignSettings from './CampaignSettings';
import CampaignRules from './CampaignRules';
import './CampaignDashboard.css';

function CampaignDashboard() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const { firestore, user } = useFirebase();
  
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // Use the custom hook for members with real-time updates
  const { members, loading: membersLoading, setMembers } = useCampaignMembers(firestore, campaignId);

  useEffect(() => {
    if (!campaignId || !firestore || !user) return;

    setLoading(true);

    // Listen to campaign changes
    const campaignRef = doc(firestore, 'campaigns', campaignId);
    const unsubscribeCampaign = onSnapshot(campaignRef, 
      (doc) => {
        if (doc.exists()) {
          setCampaign({ id: doc.id, ...doc.data() });
          setError(null);
        } else {
          setError('Campaign not found or you don\'t have access.');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to campaign:', err);
        setError('Failed to load campaign updates.');
        setLoading(false);
      }
    );

    // Cleanup function
    return () => unsubscribeCampaign();
  }, [campaignId, firestore, user]);

  const handleLeaveCampaign = async () => {
    try {
      await leaveCampaign(firestore, campaignId, user.uid);
      navigate('/campaigns');
    } catch (err) {
      console.error('Error leaving campaign:', err);
      setError('Failed to leave campaign. Please try again.');
    }
  };

  const handleJoinChat = () => {
    navigate(`/campaign/${campaignId}/chat`);
  };

  const isUserDM = campaign && user && campaign.dmId === user.uid;
  const userMember = members.find(member => member.userId === user.uid);
  
  // Find DM member info
  const dmMember = members.find(member => member.userId === campaign?.dmId);
  const dmDisplayName = dmMember?.username || dmMember?.displayName || campaign?.dmName || 'Unknown DM';

  if (loading || membersLoading) {
    return (
      <div className="campaign-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="campaign-dashboard">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/campaigns')} className="btn btn-primary">
            Back to Campaigns
          </button>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="campaign-dashboard">
        <div className="error-container">
          <h2>Campaign Not Found</h2>
          <p>This campaign doesn't exist or you don't have access to it.</p>
          <button onClick={() => navigate('/campaigns')} className="btn btn-primary">
            Back to Campaigns
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="campaign-dashboard">
      <div className="campaign-header">
        <div className="campaign-header-content">
          <div className="campaign-info">
            <h1>{campaign.name}</h1>
            <p className="campaign-description">{campaign.description}</p>
            <div className="campaign-meta">
              <span className="game-system">{campaign.gameSystem}</span>
              <span className={`status-badge status-${campaign.status}`}>{campaign.status}</span>
              <span className="player-count">
                {campaign.currentPlayers}/{campaign.maxPlayers} players
              </span>
            </div>
            {campaign.tags && campaign.tags.length > 0 && (
              <div className="campaign-tags">
                {campaign.tags.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            )}
          </div>
          <div className="campaign-actions">
            {!isUserDM && userMember && (
              <button 
                onClick={() => setShowLeaveModal(true)}
                className="btn btn-secondary"
              >
                Leave Campaign
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="campaign-content">
        <div className="campaign-sidebar">
          <nav className="campaign-nav">
            <button 
              className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`nav-item ${activeTab === 'members' ? 'active' : ''}`}
              onClick={() => setActiveTab('members')}
            >
              Members ({members.length})
            </button>
            <button 
              className={`nav-item ${activeTab === 'channels' ? 'active' : ''}`}
              onClick={() => setActiveTab('channels')}
            >
              Channels
            </button>
            <button 
              className={`nav-item ${activeTab === 'rules' ? 'active' : ''}`}
              onClick={() => setActiveTab('rules')}
            >
              Rules & Guidelines
            </button>
            {isUserDM && (
              <button 
                className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                Settings
              </button>
            )}
          </nav>
        </div>

        <div className="campaign-main">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="overview-section">
                <h3>Campaign Details</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Dungeon Master</label>
                    <span>{dmDisplayName}</span>
                  </div>
                  <div className="detail-item">
                    <label>Game System</label>
                    <span>{campaign.gameSystem}</span>
                  </div>
                  <div className="detail-item">
                    <label>Status</label>
                    <span className={`status-badge status-${campaign.status}`}>{campaign.status}</span>
                  </div>
                  <div className="detail-item">
                    <label>Players</label>
                    <span>{campaign.currentPlayers}/{campaign.maxPlayers}</span>
                  </div>
                  <div className="detail-item">
                    <label>Created</label>
                    <span>{campaign.createdAt?.toDate().toLocaleDateString()}</span>
                  </div>
                  <div className="detail-item">
                    <label>Last Activity</label>
                    <span>{campaign.lastActivity?.toDate().toLocaleDateString()}</span>
                  </div>
                  <div className="detail-item detail-item-action">
                    <button 
                      onClick={handleJoinChat}
                      className="btn btn-primary btn-open-chat"
                      disabled={!userMember || userMember.status !== 'active'}
                    >
                      Open Chat
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="overview-section">
                <h3>Recent Activity</h3>
                <div className="activity-list">
                  <div className="activity-item">
                    <span className="activity-icon">🎯</span>
                    <div className="activity-content">
                      <span className="activity-text">Welcome to your campaign!</span>
                      <span className="activity-time">Start chatting to see recent activity here.</span>
                    </div>
                  </div>
                  {campaign?.lastActivity && (
                    <div className="activity-item">
                      <span className="activity-icon">📅</span>
                      <div className="activity-content">
                        <span className="activity-text">Last activity</span>
                        <span className="activity-time">{campaign.lastActivity.toDate().toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}
                  <div className="activity-item">
                    <span className="activity-icon">👥</span>
                    <div className="activity-content">
                      <span className="activity-text">{members.length} member{members.length !== 1 ? 's' : ''} in campaign</span>
                      <span className="activity-time">Ready to adventure!</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <CampaignMemberList 
              campaignId={campaignId}
              members={members}
              isUserDM={isUserDM}
              onMembersUpdate={setMembers}
            />
          )}

          {activeTab === 'channels' && (
            <ChannelSidebar 
              campaignId={campaignId}
              isUserDM={isUserDM}
            />
          )}

          {activeTab === 'rules' && (
            <CampaignRules 
              campaignId={campaignId}
              isUserDM={isUserDM}
            />
          )}

          {activeTab === 'settings' && isUserDM && (
            <CampaignSettings 
              campaign={campaign}
              onCampaignUpdate={setCampaign}
            />
          )}
        </div>
      </div>

      {/* Leave Campaign Modal */}
      {showLeaveModal && (
        <div className="modal-overlay" onClick={() => setShowLeaveModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Leave Campaign</h3>
            <p>Are you sure you want to leave "{campaign.name}"?</p>
            <p className="warning-text">
              You'll lose access to all campaign channels and will need to be re-invited to rejoin.
            </p>
            <div className="modal-actions">
              <button 
                onClick={() => setShowLeaveModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleLeaveCampaign}
                className="btn btn-danger"
              >
                Leave Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CampaignDashboard;