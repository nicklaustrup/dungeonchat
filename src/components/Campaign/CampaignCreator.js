import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirebase } from '../../services/FirebaseContext';
import { useCampaign } from '../../contexts/CampaignContext';
import { createCampaign } from '../../services/campaign/campaignService';
import './CampaignCreator.css';

const GAME_SYSTEMS = [
  'D&D 5e',
  'Pathfinder 2e',
  'Pathfinder 1e',
  'D&D 3.5e',
  'Call of Cthulhu',
  'Vampire: The Masquerade',
  'Shadowrun',
  'Custom/Other'
];

const CAMPAIGN_TAGS = [
  'beginner-friendly',
  'roleplay-heavy',
  'combat-focused',
  'exploration',
  'mystery',
  'horror',
  'political-intrigue',
  'sandbox',
  'pre-written-module',
  'homebrew',
  'weekly',
  'bi-weekly',
  'monthly',
  'flexible-schedule'
];

function CampaignCreator() {
  const navigate = useNavigate();
  const { firestore, user } = useFirebase();
  const { setCurrentCampaign } = useCampaign();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    gameSystem: 'D&D 5e',
    maxPlayers: 6,
    visibility: 'public',
    tags: [],
    settings: {
      allowSpectators: false,
      requireApproval: true,
      allowPlayerInvites: false
    }
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Campaign name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Campaign name must be at least 3 characters';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Campaign name must be less than 50 characters';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Campaign description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    } else if (formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }
    
    if (formData.maxPlayers < 2) {
      newErrors.maxPlayers = 'Must allow at least 2 players';
    } else if (formData.maxPlayers > 12) {
      newErrors.maxPlayers = 'Maximum 12 players allowed';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      const campaignRef = await createCampaign(firestore, formData, user.uid);
      
      // Update campaign context
      const newCampaign = {
        id: campaignRef.id,
        ...formData,
        dmId: user.uid,
        currentPlayers: 1,
        status: 'recruiting'
      };
      setCurrentCampaign(newCampaign);
      
      // Navigate to the new campaign
      navigate(`/campaign/${campaignRef.id}`);
    } catch (error) {
      console.error('Error creating campaign:', error);
      setErrors({ submit: 'Failed to create campaign. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleSettingChange = (setting, value) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [setting]: value
      }
    }));
  };

  const handleTagToggle = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  return (
    <div className="campaign-creator">
      <div className="campaign-creator-header">
        <h1>Create New Campaign</h1>
        <p>Set up your D&D campaign and start gathering your party!</p>
      </div>

      <form id="campaign-form" onSubmit={handleSubmit} className="campaign-form">
        {/* Basic Information */}
        <div className="form-section">
          <h2>Basic Information</h2>
          
          <div className="basic-info-grid">
            <div className="form-group full-width">
              <label htmlFor="name">Campaign Name *</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="The Lost Mines of Phandelver"
                className={errors.name ? 'error' : ''}
                maxLength={50}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-group full-width">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="A classic D&D 5e adventure for new players. We'll be exploring the Sword Coast..."
                className={errors.description ? 'error' : ''}
                rows={4}
                maxLength={500}
              />
              {errors.description && <span className="error-message">{errors.description}</span>}
              <small>{formData.description.length}/500 characters</small>
            </div>

            <div className="form-group">
              <label htmlFor="gameSystem">Game System</label>
              <select
                id="gameSystem"
                value={formData.gameSystem}
                onChange={(e) => handleInputChange('gameSystem', e.target.value)}
              >
                {GAME_SYSTEMS.map(system => (
                  <option key={system} value={system}>{system}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="maxPlayers">Maximum Players</label>
              <input
                type="number"
                id="maxPlayers"
                value={formData.maxPlayers}
                onChange={(e) => handleInputChange('maxPlayers', parseInt(e.target.value, 10))}
                min={2}
                max={12}
                className={errors.maxPlayers ? 'error' : ''}
              />
              {errors.maxPlayers && <span className="error-message">{errors.maxPlayers}</span>}
            </div>
          </div>
        </div>

        {/* Campaign Tags */}
        <div className="form-section">
          <h2>Campaign Tags</h2>
          <p>Help players find your campaign by selecting relevant tags:</p>
          
          <div className="tag-grid">
            {CAMPAIGN_TAGS.map(tag => (
              <button
                key={tag}
                type="button"
                className={`tag-button ${formData.tags.includes(tag) ? 'selected' : ''}`}
                onClick={() => handleTagToggle(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Privacy & Settings */}
        <div className="form-section">
          <h2>Privacy & Settings</h2>
          
          <div className="privacy-settings-grid">
            <div className="form-group">
              <label htmlFor="visibility">Campaign Visibility</label>
              <select
                id="visibility"
                value={formData.visibility}
                onChange={(e) => handleInputChange('visibility', e.target.value)}
              >
                <option value="public">Public - Anyone can see and request to join</option>
                <option value="private">Private - Only visible to invited players</option>
              </select>
            </div>

            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.settings.requireApproval}
                  onChange={(e) => handleSettingChange('requireApproval', e.target.checked)}
                />
                Require DM approval for new players
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={formData.settings.allowSpectators}
                  onChange={(e) => handleSettingChange('allowSpectators', e.target.checked)}
                />
                Allow spectators to watch sessions
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={formData.settings.allowPlayerInvites}
                  onChange={(e) => handleSettingChange('allowPlayerInvites', e.target.checked)}
                />
                Allow players to invite friends
              </label>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          {errors.submit && <div className="error-message">{errors.submit}</div>}
          
          <div className="button-group">
            <button
              type="button"
              onClick={() => navigate('/campaigns')}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Campaign...' : 'Create Campaign'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default CampaignCreator;