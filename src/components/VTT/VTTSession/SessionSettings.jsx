import React, { useState, useEffect, useMemo } from 'react';
import { useFirebase } from '../../../services/FirebaseContext';
import { getCampaign } from '../../../services/campaign/campaignService';
import { updateDoc, doc } from 'firebase/firestore';
import { FiX, FiSearch } from 'react-icons/fi';
import './SessionSettings.css';

/**
 * SessionSettings - In-session configuration modal
 * Allows viewing (all) and editing (DM only) of session-specific settings
 * Includes: Progression System, Party Management visibility toggles
 */
const SessionSettings = ({ campaignId, onClose, isDM }) => {
  const { firestore } = useFirebase();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    // Progression System
    progressionSystem: 'xp', // 'xp' or 'milestone'
    // Party Management settings
    canViewGold: false,
    canViewInventory: false,
    canViewCharacterSheet: false
  });

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const campaignData = await getCampaign(firestore, campaignId);
      
      if (!campaignData) {
        setError('Campaign not found');
        return;
      }

      setCampaign(campaignData);
      setFormData({
        progressionSystem: campaignData.progressionSystem || 'xp',
        canViewGold: campaignData.canViewGold ?? false,
        canViewInventory: campaignData.canViewInventory ?? false,
        canViewCharacterSheet: campaignData.canViewCharacterSheet ?? false
      });
    } catch (error) {
      console.error('Error loading session settings:', error);
      setError('Failed to load session settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!isDM) {
      setError('Only the Dungeon Master can modify session settings.');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      const campaignRef = doc(firestore, 'campaigns', campaignId);
      await updateDoc(campaignRef, formData);
      
      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => {
        setSuccessMessage('');
        onClose(); // Close modal after successful save
      }, 1500);
    } catch (error) {
      console.error('Error saving session settings:', error);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Filter sections based on search query
  const matchesSearch = useMemo(() => {
    if (!searchQuery.trim()) return { progression: true, party: true };
    
    const query = searchQuery.toLowerCase();
    const progressionMatches = 
      'progression system advancement xp experience milestone'.includes(query) ||
      'xp'.includes(query) ||
      'milestone'.includes(query);
    
    const partyMatches = 
      'party management visibility players gold inventory character sheet'.includes(query) ||
      'gold'.includes(query) ||
      'inventory'.includes(query) ||
      'sheet'.includes(query);
    
    return {
      progression: progressionMatches,
      party: partyMatches
    };
  }, [searchQuery]);

  const hasResults = matchesSearch.progression || matchesSearch.party;

  if (loading) {
    return (
      <div className="session-settings-overlay" onClick={onClose}>
        <div className="session-settings-modal" onClick={(e) => e.stopPropagation()}>
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading session settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="session-settings-overlay" onClick={onClose}>
      <div className="session-settings-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="session-settings-header">
          <div className="header-top">
            <h2>⚙️ Session Settings</h2>
            <button 
              className="close-button"
              onClick={onClose}
              aria-label="Close settings"
            >
              <FiX />
            </button>
          </div>
          
          {/* Search Bar */}
          <div className="search-container">
            <FiSearch className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search settings"
            />
            {searchQuery && (
              <button
                className="clear-search"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <FiX />
              </button>
            )}
          </div>
        </div>

        {/* Campaign Name */}
        <div className="session-settings-campaign-info">
          <strong>{campaign?.name}</strong>
          {isDM ? (
            <span className="settings-badge dm-badge">Dungeon Master</span>
          ) : (
            <span className="settings-badge player-badge">View Only</span>
          )}
        </div>

        {/* Messages */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="success-message">
            <p>{successMessage}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSave} className="session-settings-form">
          {/* No Results Message */}
          {searchQuery && !hasResults && (
            <div className="no-results">
              <p>No settings found for "{searchQuery}"</p>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSearchQuery('')}
              >
                Clear Search
              </button>
            </div>
          )}

          {/* Progression System */}
          {matchesSearch.progression && (
          <div className="settings-section">
            <h3>🎯 Progression System</h3>
            <p className="section-description">
              How players advance in this campaign.
            </p>
            
            <div className="form-group">
              <label htmlFor="progressionSystem">Advancement Method</label>
              <select
                id="progressionSystem"
                name="progressionSystem"
                value={formData.progressionSystem}
                onChange={handleInputChange}
                disabled={!isDM}
              >
                <option value="xp">Experience Points (XP)</option>
                <option value="milestone">Milestone</option>
              </select>
              <p className="field-description">
                {formData.progressionSystem === 'xp' 
                  ? '📊 Players track experience points from encounters'
                  : '⭐ Players advance when reaching story milestones'}
              </p>
            </div>
          </div>
          )}

          {/* Party Management */}
          {matchesSearch.party && (
          <div className="settings-section">
            <h3>👥 Party Management</h3>
            <p className="section-description">
              Control what information players can view in the Party Panel.
            </p>
            
            <div className="form-group">
              <label className="settings-subsection-label">Players can view:</label>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="canViewGold"
                  checked={formData.canViewGold}
                  onChange={handleInputChange}
                  disabled={!isDM}
                />
                <span>💰 Party Gold</span>
              </label>
              <p className="field-description">Show total party gold in the party overview.</p>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="canViewInventory"
                  checked={formData.canViewInventory}
                  onChange={handleInputChange}
                  disabled={!isDM}
                />
                <span>🎒 Character Inventory</span>
              </label>
              <p className="field-description">Show inventory items on character cards.</p>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="canViewCharacterSheet"
                  checked={formData.canViewCharacterSheet}
                  onChange={handleInputChange}
                  disabled={!isDM}
                />
                <span>📄 Character Sheets</span>
              </label>
              <p className="field-description">Allow opening character sheets for other party members.</p>
            </div>
          </div>
          )}

          {/* Action Buttons */}
          <div className="form-actions">
            {isDM ? (
              <>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </>
            ) : (
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={onClose}
              >
                Close
              </button>
            )}
          </div>
        </form>

        {!isDM && (
          <div className="player-notice">
            <p>💡 Only the Dungeon Master can modify these settings.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionSettings;
