import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFirebase } from '../../services/FirebaseContext';
import { doc, getDoc } from 'firebase/firestore';
import { joinCampaign } from '../../services/campaign/campaignService';
import './CampaignPreview.css';

function CampaignPreview() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const { firestore, user } = useFirebase();

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joining, setJoining] = useState(false);
  const [characterInfo, setCharacterInfo] = useState({
    characterName: '',
    characterClass: ''
  });

  const loadCampaign = async () => {
    try {
      setLoading(true);
      const campaignRef = doc(firestore, 'campaigns', campaignId);
      const campaignSnap = await getDoc(campaignRef);

      if (campaignSnap.exists()) {
        setCampaign({ id: campaignSnap.id, ...campaignSnap.data() });
      } else {
        setError('Campaign not found');
      }
    } catch (err) {
      console.error('Error loading campaign:', err);
      setError('Failed to load campaign');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaign();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  const isUserMember = () => {
    if (!campaign || !user) return false;
    return campaign.dmId === user.uid || 
           (campaign.members && campaign.members.includes(user.uid));
  };

  const handleJoinClick = () => {
    if (isUserMember()) {
      navigate(`/campaign/${campaignId}`);
    } else {
      setShowJoinModal(true);
    }
  };

  const handleJoinSubmit = async () => {
    if (!characterInfo.characterName.trim()) {
      setError('Character name is required');
      return;
    }

    try {
      setJoining(true);
      setError(null);
      await joinCampaign(firestore, campaignId, user.uid, characterInfo);
      navigate(`/campaign/${campaignId}`);
    } catch (err) {
      console.error('Error joining campaign:', err);
      setError('Failed to join campaign');
    } finally {
      setJoining(false);
    }
  };

  const formatTag = (tag) => {
    return tag.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="campaign-preview">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (error && !campaign) {
    return (
      <div className="campaign-preview">
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
    return null;
  }

  const isFull = campaign.currentPlayers >= campaign.maxPlayers;
  const isMember = isUserMember();

  return (
    <div className="campaign-preview">
      <div className="preview-container">
        {/* Header with photo */}
        {campaign.campaignPhoto && (
          <div 
            className="preview-header-photo"
            style={{ backgroundImage: `url(${campaign.campaignPhoto})` }}
          />
        )}

        <div className="preview-content">
          {/* Back button */}
          <button 
            onClick={() => navigate('/campaigns')} 
            className="btn btn-secondary back-btn"
          >
            ← Back to Campaigns
          </button>

          {/* Campaign info */}
          <div className="preview-info">
            <h1>{campaign.name}</h1>
            
            <div className="preview-badges">
              <span className="badge badge-system">{campaign.gameSystem}</span>
              <span className={`badge badge-status status-${campaign.status}`}>
                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
              </span>
            </div>

            <p className="preview-description">{campaign.description}</p>

            {/* Tags */}
            {campaign.tags && campaign.tags.length > 0 && (
              <div className="preview-tags">
                {campaign.tags.map(tag => (
                  <span key={tag} className="tag">
                    {formatTag(tag)}
                  </span>
                ))}
              </div>
            )}

            {/* Campaign details */}
            <div className="preview-details">
              <div className="detail-row">
                <div className="detail-item">
                  <strong>Dungeon Master:</strong>
                  <span>{campaign.dmName || 'Unknown'}</span>
                </div>
                <div className="detail-item">
                  <strong>Players:</strong>
                  <span>{campaign.currentPlayers}/{campaign.maxPlayers}</span>
                </div>
              </div>

              {campaign.sessionFrequency && (
                <div className="detail-row">
                  <div className="detail-item">
                    <strong>Session Frequency:</strong>
                    <span>{campaign.sessionFrequency}</span>
                  </div>
                </div>
              )}

              {campaign.sessionDay && (
                <div className="detail-row">
                  <div className="detail-item">
                    <strong>Session Day:</strong>
                    <span>{campaign.sessionDay}</span>
                  </div>
                  {campaign.sessionTime && (
                    <div className="detail-item">
                      <strong>Session Time:</strong>
                      <span>{campaign.sessionTime} {campaign.timeZone || ''}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="detail-row">
                <div className="detail-item">
                  <strong>Visibility:</strong>
                  <span>{campaign.visibility === 'public' ? 'Public' : 'Private'}</span>
                </div>
                <div className="detail-item">
                  <strong>Accepting Requests:</strong>
                  <span>{campaign.allowRequests ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="preview-actions">
              {isMember ? (
                <button 
                  onClick={handleJoinClick}
                  className="btn btn-primary btn-large"
                >
                  Open Campaign Dashboard
                </button>
              ) : (
                <button 
                  onClick={handleJoinClick}
                  className="btn btn-primary btn-large"
                  disabled={isFull}
                >
                  {isFull ? 'Campaign Full' : 'Join Campaign'}
                </button>
              )}
            </div>

            {error && <div className="error-message">{error}</div>}
          </div>
        </div>
      </div>

      {/* Join Modal */}
      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Join {campaign.name}</h2>
              <button 
                className="modal-close"
                onClick={() => setShowJoinModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p>Enter your character information to join this campaign:</p>

              <div className="form-group">
                <label htmlFor="characterName">Character Name *</label>
                <input
                  type="text"
                  id="characterName"
                  value={characterInfo.characterName}
                  onChange={(e) => setCharacterInfo({
                    ...characterInfo,
                    characterName: e.target.value
                  })}
                  placeholder="Enter character name"
                  maxLength={50}
                />
              </div>

              <div className="form-group">
                <label htmlFor="characterClass">Character Class (optional)</label>
                <input
                  type="text"
                  id="characterClass"
                  value={characterInfo.characterClass}
                  onChange={(e) => setCharacterInfo({
                    ...characterInfo,
                    characterClass: e.target.value
                  })}
                  placeholder="e.g., Fighter, Wizard, Ranger"
                  maxLength={50}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button 
                onClick={() => setShowJoinModal(false)}
                className="btn btn-secondary"
                disabled={joining}
              >
                Cancel
              </button>
              <button 
                onClick={handleJoinSubmit}
                className="btn btn-primary"
                disabled={joining || !characterInfo.characterName.trim()}
              >
                {joining ? 'Joining...' : 'Join Campaign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CampaignPreview;
