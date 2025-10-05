import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFirebase } from '../../services/FirebaseContext';
import { getCampaign } from '../../services/campaign/campaignService';
import { updateDoc, deleteDoc, doc } from 'firebase/firestore';
import './CampaignSettings.css';

const CampaignSettings = ({ campaign: campaignProp, onCampaignUpdate }) => {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const { firestore, user } = useFirebase();
  const [campaign, setCampaign] = useState(campaignProp);
  const [loading, setLoading] = useState(!campaignProp);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    visibility: 'private',
    allowRequests: true,
    maxMembers: 6,
    gameSystem: 'D&D 5e',
    sessionFrequency: 'weekly',
    timeZone: 'UTC',
    sessionDay: 'saturday',
    sessionTime: '19:00'
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const loadCampaign = useCallback(async () => {
    try {
      setLoading(true);
      const campaignData = await getCampaign(firestore, campaignId);
      
      if (!campaignData) {
        setError('Campaign not found');
        return;
      }

      setCampaign(campaignData);
      setFormData({
        name: campaignData.name || '',
        description: campaignData.description || '',
        visibility: campaignData.visibility || 'private',
        allowRequests: campaignData.allowRequests ?? true,
        maxMembers: campaignData.maxMembers || 6,
        gameSystem: campaignData.gameSystem || 'D&D 5e',
        sessionFrequency: campaignData.sessionFrequency || 'weekly',
        timeZone: campaignData.timeZone || 'UTC',
        sessionDay: campaignData.sessionDay || 'saturday',
        sessionTime: campaignData.sessionTime || '19:00'
      });
    } catch (error) {
      console.error('Error loading campaign:', error);
      setError('Failed to load campaign settings');
    } finally {
      setLoading(false);
    }
  }, [firestore, campaignId]);

  useEffect(() => {
    // If campaign prop is provided, use it directly
    if (campaignProp) {
      setCampaign(campaignProp);
      setFormData({
        name: campaignProp.name || '',
        description: campaignProp.description || '',
        visibility: campaignProp.visibility || 'private',
        allowRequests: campaignProp.allowRequests !== false,
        maxMembers: campaignProp.maxMembers || 6,
        gameSystem: campaignProp.gameSystem || 'D&D 5e',
        sessionFrequency: campaignProp.sessionFrequency || 'weekly',
        timeZone: campaignProp.timeZone || 'UTC',
        sessionDay: campaignProp.sessionDay || 'saturday',
        sessionTime: campaignProp.sessionTime || '19:00'
      });
      setLoading(false);
      return;
    }
    
    // Otherwise load campaign data
    loadCampaign();
  }, [loadCampaign, campaignProp]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      
      const campaignRef = doc(firestore, 'campaigns', campaignId);
      await updateDoc(campaignRef, formData);
      
      setSuccessMessage('Campaign settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Reload campaign data
      await loadCampaign();
    } catch (error) {
      console.error('Error saving campaign:', error);
      setError('Failed to save campaign settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCampaign = async () => {
    if (!campaign || !user) {
      setError('Unable to delete campaign: Invalid session');
      return;
    }

    // Check if user is the DM
    if (campaign.dmId !== user.uid) {
      setError('Only the Dungeon Master can delete this campaign.');
      return;
    }

    if (deleteConfirmText !== campaign.name) {
      setError('Campaign name does not match');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      const campaignRef = doc(firestore, 'campaigns', campaignId);
      await deleteDoc(campaignRef);
      
      // Navigate immediately to prevent listener errors
      navigate('/campaigns');
    } catch (error) {
      console.error('Error deleting campaign:', error);
      
      if (error.code === 'permission-denied') {
        setError('You do not have permission to delete this campaign. Only the campaign creator can delete it.');
      } else if (error.code === 'not-found') {
        setError('Campaign not found. It may have already been deleted.');
      } else {
        setError(`Failed to delete campaign: ${error.message}`);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="campaign-settings">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading campaign settings...</p>
        </div>
      </div>
    );
  }

  if (error && !campaign) {
    return (
      <div className="campaign-settings">
        <div className="error-message">
          <p>{error}</p>
          <button 
            className="btn btn-primary"
            onClick={() => navigate(`/campaigns/${campaignId}`)}
          >
            Back to Campaign
          </button>
        </div>
      </div>
    );
  }

  // Check if user is the DM
  if (campaign && user && campaign.dmId !== user.uid) {
    return (
      <div className="campaign-settings">
        <div className="error-message">
          <p>Only the Dungeon Master can access campaign settings.</p>
          <button 
            className="btn btn-primary"
            onClick={() => navigate(`/campaigns/${campaignId}`)}
          >
            Back to Campaign
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="campaign-settings">
      <div className="settings-header">
        <h2>General Settings</h2>
        <button 
          className="btn btn-secondary"
          onClick={() => navigate(`/campaigns/${campaignId}`)}
        >
          Back to Campaign
        </button>
      </div>
      
      <p className="settings-description">
        Configure basic campaign information, privacy settings, and scheduling. 
        Session-specific settings (progression system, party visibility) are accessible during VTT sessions.
      </p>

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

      <form onSubmit={handleSave} className="settings-form">
        {/* Basic Information */}
        <div className="settings-section">
          <h3>Basic Information</h3>
          
          <div className="form-group">
            <label htmlFor="name">Campaign Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              maxLength={500}
              placeholder="Describe your campaign..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="gameSystem">Game System</label>
            <select
              id="gameSystem"
              name="gameSystem"
              value={formData.gameSystem}
              onChange={handleInputChange}
            >
              <option value="D&D 5e">D&D 5e</option>
              <option value="Pathfinder 2e">Pathfinder 2e</option>
              <option value="Call of Cthulhu">Call of Cthulhu</option>
              <option value="Vampire: The Masquerade">Vampire: The Masquerade</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Privacy & Access */}
        <div className="settings-section">
          <h3>Privacy & Access</h3>
          
          <div className="form-group">
            <label htmlFor="visibility">Visibility</label>
            <select
              id="visibility"
              name="visibility"
              value={formData.visibility}
              onChange={handleInputChange}
            >
              <option value="private">Private - Invite only</option>
              <option value="public">Public - Anyone can find</option>
            </select>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="allowRequests"
                checked={formData.allowRequests}
                onChange={handleInputChange}
              />
              Allow join requests
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="maxMembers">Maximum Members</label>
            <input
              type="number"
              id="maxMembers"
              name="maxMembers"
              value={formData.maxMembers}
              onChange={handleInputChange}
              min={2}
              max={20}
            />
          </div>
        </div>

        {/* Schedule */}
        <div className="settings-section">
          <h3>Schedule</h3>
          
          <div className="form-group">
            <label htmlFor="sessionFrequency">Session Frequency</label>
            <select
              id="sessionFrequency"
              name="sessionFrequency"
              value={formData.sessionFrequency}
              onChange={handleInputChange}
            >
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
              <option value="irregular">Irregular</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="sessionDay">Day of Week</label>
              <select
                id="sessionDay"
                name="sessionDay"
                value={formData.sessionDay}
                onChange={handleInputChange}
              >
                <option value="monday">Monday</option>
                <option value="tuesday">Tuesday</option>
                <option value="wednesday">Wednesday</option>
                <option value="thursday">Thursday</option>
                <option value="friday">Friday</option>
                <option value="saturday">Saturday</option>
                <option value="sunday">Sunday</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="sessionTime">Time</label>
              <input
                type="time"
                id="sessionTime"
                name="sessionTime"
                value={formData.sessionTime}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="timeZone">Time Zone</label>
            <select
              id="timeZone"
              name="timeZone"
              value={formData.timeZone}
              onChange={handleInputChange}
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">GMT</option>
              <option value="Europe/Paris">Central European Time</option>
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="settings-section danger-zone">
        <h3>Danger Zone</h3>
        <p>Once you delete a campaign, there is no going back. Please be certain.</p>
        
        <button 
          className="btn btn-danger"
          onClick={() => setShowDeleteConfirm(true)}
        >
          Delete Campaign
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Delete Campaign</h3>
            <p>
              This action cannot be undone. This will permanently delete the campaign,
              all messages, and remove all members.
            </p>
            <p>
              Please type <strong>{campaign.name}</strong> to confirm:
            </p>
            
            <div className="form-group">
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Campaign name"
              />
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                  setError(null);
                }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleDeleteCampaign}
                disabled={saving || deleteConfirmText !== campaign.name}
              >
                {saving ? 'Deleting...' : 'Delete Campaign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignSettings;