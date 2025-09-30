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
import DiceHistoryPanel from '../DiceRoll/DiceHistoryPanel';
import { CharacterCreationModal } from '../CharacterCreationModal';
import { CharacterSheet } from '../CharacterSheet';
import { useCharacterSheet, useCampaignCharacters } from '../../hooks/useCharacterSheet';
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
  const [showCharacterCreation, setShowCharacterCreation] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [showCharacterSheet, setShowCharacterSheet] = useState(false);

  // Use the custom hook for members with real-time updates
  const { members, loading: membersLoading, setMembers } = useCampaignMembers(firestore, campaignId);
  
  // Character sheet hooks
  const { hasCharacter } = useCharacterSheet(firestore, campaignId, user?.uid);
  const { characters: campaignCharacters, refreshCharacters } = useCampaignCharacters(firestore, campaignId);

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
              className={`nav-item ${activeTab === 'characters' ? 'active' : ''}`}
              onClick={() => setActiveTab('characters')}
            >
              📋 Characters ({campaignCharacters.length})
            </button>
            <button 
              className={`nav-item ${activeTab === 'dice-history' ? 'active' : ''}`}
              onClick={() => setActiveTab('dice-history')}
            >
              🎲 Dice History
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

          {activeTab === 'characters' && (
            <div className="characters-tab">
              <div className="characters-header">
                <h2>📋 Campaign Characters</h2>
                <div className="characters-actions">
                  {!hasCharacter && (
                    <button 
                      onClick={() => setShowCharacterCreation(true)}
                      className="btn btn-primary"
                    >
                      Create Character
                    </button>
                  )}
                  {hasCharacter && (
                    <button 
                      onClick={() => setShowCharacterSheet(true)}
                      className="btn btn-secondary"
                    >
                      View My Character
                    </button>
                  )}
                </div>
              </div>
              
              <div className="characters-content">
                {campaignCharacters.length === 0 ? (
                  <div className="no-characters">
                    <div className="no-characters-icon">📋</div>
                    <h3>No Characters Yet</h3>
                    <p>Be the first to create a character for this campaign!</p>
                    {!hasCharacter && (
                      <button 
                        onClick={() => setShowCharacterCreation(true)}
                        className="btn btn-primary"
                      >
                        Create Your Character
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="characters-grid">
                    {campaignCharacters.map(character => {
                      const member = members.find(m => m.userId === character.userId);
                      const isOwnCharacter = character.userId === user?.uid;
                      
                      return (
                        <div key={character.id} className={`character-card ${isOwnCharacter ? 'own-character' : ''}`}>
                          <div className="character-card-header">
                            <h4>{character.name}</h4>
                            {isOwnCharacter && <span className="own-badge">Your Character</span>}
                          </div>
                          
                          <div className="character-card-info">
                            <div className="character-level">Level {character.level}</div>
                            <div className="character-class-race">
                              {character.race} {character.class}
                            </div>
                            <div className="character-player">
                              Player: {member?.username || member?.displayName || character.playerName || 'Unknown'}
                            </div>
                          </div>
                          
                          <div className="character-card-stats">
                            <div className="stat-item">
                              <span>HP:</span>
                              <span>{character.hitPoints.current}/{character.hitPoints.maximum}</span>
                            </div>
                            <div className="stat-item">
                              <span>AC:</span>
                              <span>{character.armorClass}</span>
                            </div>
                            <div className="stat-item">
                              <span>XP:</span>
                              <span>{character.experiencePoints.toLocaleString()}</span>
                            </div>
                          </div>
                          
                          <div className="character-card-actions">
                            {(isOwnCharacter || isUserDM) && (
                              <button 
                                onClick={() => {
                                  setSelectedCharacter(character);
                                  setShowCharacterSheet(true);
                                }}
                                className="btn btn-small btn-secondary"
                              >
                                View Sheet
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'dice-history' && (
            <div className="dice-history-tab">
              <h2>🎲 Dice Roll History & Statistics</h2>
              <p className="tab-description">
                View campaign dice roll history, statistics, and player performance across all channels.
              </p>
              <DiceHistoryPanel 
                firestore={firestore}
                campaignId={campaignId}
                userId={null} // Show all users' rolls
              />
            </div>
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

      {/* Character Creation Modal */}
      {showCharacterCreation && (
        <CharacterCreationModal 
          isOpen={showCharacterCreation}
          onClose={() => setShowCharacterCreation(false)}
          firestore={firestore}
          campaignId={campaignId}
          userId={user?.uid}
          onCharacterCreated={() => {
            setShowCharacterCreation(false);
            refreshCharacters();
          }}
        />
      )}
      
      {/* Character Sheet Modal */}
      {showCharacterSheet && (
        <div className="modal-overlay" onClick={() => {
          setShowCharacterSheet(false);
          setSelectedCharacter(null);
        }}>
          <CharacterSheet 
            firestore={firestore}
            campaignId={campaignId}
            userId={selectedCharacter?.userId || user?.uid}
            isModal={true}
            onClose={() => {
              setShowCharacterSheet(false);
              setSelectedCharacter(null);
            }}
          />
        </div>
      )}

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