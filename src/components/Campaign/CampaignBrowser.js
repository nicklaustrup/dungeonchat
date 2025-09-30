import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchCampaigns, joinCampaign } from '../../services/campaign/campaignService';
import { useAuth } from '../../hooks/useAuth';
import { useFirebase } from '../../services/FirebaseContext';
import { CampaignContext } from '../../contexts/CampaignContext';
import './CampaignBrowser.css';

const CampaignBrowser = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSystem, setSelectedSystem] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [characterInfo, setCharacterInfo] = useState({
    characterName: '',
    characterClass: ''
  });
  
  const { firestore } = useFirebase();

  const { user } = useAuth();
  const { setCurrentCampaign } = useContext(CampaignContext);
  const navigate = useNavigate();

  const gameSystems = [
    'D&D 5e',
    'Pathfinder 2e',
    'D&D 3.5e',
    'Pathfinder 1e',
    'Call of Cthulhu',
    'Vampire: The Masquerade',
    'Shadowrun',
    'Other'
  ];

  const availableTags = [
    'beginner-friendly',
    'experienced-only',
    'roleplay-heavy',
    'combat-focused',
    'homebrew',
    'published-adventure',
    'sandbox',
    'mystery',
    'horror',
    'political-intrigue'
  ];

  useEffect(() => {
    loadCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await searchCampaigns(firestore, {
        gameSystem: selectedSystem,
        tags: selectedTags,
        searchTerm: searchTerm
      });
      setCampaigns(data);
    } catch (err) {
      setError('Failed to load campaigns');
      console.error('Error loading campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadCampaigns();
  };

  const handleTagToggle = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleJoinCampaign = (campaign) => {
    setSelectedCampaign(campaign);
    setShowJoinModal(true);
  };

  const handleJoinSubmit = async () => {
    if (!characterInfo.characterName.trim()) {
      setError('Character name is required');
      return;
    }

    try {
      setLoading(true);
      await joinCampaign(firestore, selectedCampaign.id, user.uid, characterInfo);
      setCurrentCampaign(selectedCampaign);
      navigate(`/campaign/${selectedCampaign.id}/chat`);
    } catch (err) {
      setError('Failed to join campaign');
      console.error('Error joining campaign:', err);
    } finally {
      setLoading(false);
      setShowJoinModal(false);
      setCharacterInfo({ characterName: '', characterClass: '' });
    }
  };

  const formatPlayerCount = (current, max) => {
    return `${current}/${max} players`;
  };

  const formatTag = (tag) => {
    return tag.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="campaign-browser">
        <div className="loading">Loading campaigns...</div>
      </div>
    );
  }

  return (
    <div className="campaign-browser">
      <div className="campaign-browser-header">
        <h1>Discover Campaigns</h1>
        <div className="header-actions">
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/create-campaign')}
          >
            Create Campaign
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="search-section">
        <div className="search-row">
          <div className="search-input-group">
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button 
              className="btn btn-primary"
              onClick={handleSearch}
            >
              Search
            </button>
          </div>
          
          <select
            value={selectedSystem}
            onChange={(e) => setSelectedSystem(e.target.value)}
            className="system-filter"
          >
            <option value="">All Game Systems</option>
            {gameSystems.map(system => (
              <option key={system} value={system}>{system}</option>
            ))}
          </select>
        </div>

        <div className="tags-filter">
          <h3>Filter by Tags:</h3>
          <div className="tags-grid">
            {availableTags.map(tag => (
              <label key={tag} className={`tag-filter ${selectedTags.includes(tag) ? 'selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag)}
                  onChange={() => handleTagToggle(tag)}
                />
                {formatTag(tag)}
              </label>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Campaign List */}
      <div className="campaigns-list">
        {campaigns.length === 0 ? (
          <div className="no-campaigns">
            <h3>No campaigns found</h3>
            <p>Try adjusting your search criteria or create a new campaign.</p>
          </div>
        ) : (
          campaigns.map(campaign => (
            <div key={campaign.id} className="campaign-card">
              <div className="campaign-header">
                <h3>{campaign.name}</h3>
                <div className="campaign-system">{campaign.gameSystem}</div>
              </div>
              
              <div className="campaign-description">
                {campaign.description}
              </div>
              
              <div className="campaign-details">
                <div className="detail-item">
                  <strong>Players:</strong> {formatPlayerCount(campaign.currentPlayers, campaign.maxPlayers)}
                </div>
                <div className="detail-item">
                  <strong>DM:</strong> {campaign.dmName || 'Unknown'}
                </div>
                <div className="detail-item">
                  <strong>Status:</strong> 
                  <span className={`status ${campaign.status}`}>
                    {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                  </span>
                </div>
              </div>

              {campaign.tags && campaign.tags.length > 0 && (
                <div className="campaign-tags">
                  {campaign.tags.map(tag => (
                    <span key={tag} className="tag">
                      {formatTag(tag)}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="campaign-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => handleJoinCampaign(campaign)}
                  disabled={campaign.currentPlayers >= campaign.maxPlayers}
                >
                  {campaign.currentPlayers >= campaign.maxPlayers ? 'Full' : 'Join Campaign'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Join Campaign Modal */}
      {showJoinModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Join {selectedCampaign?.name}</h2>
              <button 
                className="close-btn"
                onClick={() => setShowJoinModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="characterName">Character Name *</label>
                <input
                  id="characterName"
                  type="text"
                  value={characterInfo.characterName}
                  onChange={(e) => setCharacterInfo(prev => ({
                    ...prev,
                    characterName: e.target.value
                  }))}
                  placeholder="Enter your character's name"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="characterClass">Character Class (Optional)</label>
                <input
                  id="characterClass"
                  type="text"
                  value={characterInfo.characterClass}
                  onChange={(e) => setCharacterInfo(prev => ({
                    ...prev,
                    characterClass: e.target.value
                  }))}
                  placeholder="e.g., Fighter, Wizard, Rogue"
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowJoinModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleJoinSubmit}
                disabled={loading || !characterInfo.characterName.trim()}
              >
                {loading ? 'Joining...' : 'Join Campaign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignBrowser;