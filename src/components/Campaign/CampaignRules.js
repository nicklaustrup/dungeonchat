import React, { useState, useEffect } from 'react';
import { useFirebase } from '../../services/FirebaseContext';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import './CampaignRules.css';

function CampaignRules({ campaignId, isUserDM }) {
  const { firestore } = useFirebase();
  const [rules, setRules] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    if (!campaignId || !firestore) return;

    const loadRules = async () => {
      try {
        setLoading(true);
        const campaignDoc = await getDoc(doc(firestore, 'campaigns', campaignId));
        if (campaignDoc.exists()) {
          const data = campaignDoc.data();
          setRules(data.rules || '');
          setEditText(data.rules || '');
        }
        setError(null);
      } catch (err) {
        console.error('Error loading rules:', err);
        setError('Failed to load campaign rules.');
      } finally {
        setLoading(false);
      }
    };

    loadRules();
  }, [campaignId, firestore]);

  const handleSave = async () => {
    if (!isUserDM) return;

    try {
      setSaving(true);
      setError(null);
      
      await updateDoc(doc(firestore, 'campaigns', campaignId), {
        rules: editText,
        updatedAt: new Date()
      });
      
      setRules(editText);
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving rules:', err);
      setError('Failed to save rules. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditText(rules);
    setIsEditing(false);
    setError(null);
  };

  if (loading) {
    return (
      <div className="campaign-rules">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading rules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="campaign-rules">
      <div className="rules-header">
        <h3>Campaign Rules & Guidelines</h3>
        {isUserDM && !isEditing && (
          <button 
            className="btn btn-secondary"
            onClick={() => setIsEditing(true)}
          >
            Edit Rules
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {isEditing && isUserDM ? (
        <div className="rules-editor">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            placeholder="Enter campaign rules and guidelines here...&#10;&#10;Example:&#10;• Be respectful to all players&#10;• Stay in character during gameplay&#10;• No phones during combat&#10;• Dice rolls in chat are final"
            className="rules-textarea"
            rows={15}
          />
          <div className="editor-actions">
            <button 
              className="btn btn-secondary"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Rules'}
            </button>
          </div>
        </div>
      ) : (
        <div className="rules-content">
          {rules ? (
            <div className="rules-text">
              {rules.split('\\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          ) : (
            <div className="no-rules">
              <p>No rules have been set for this campaign yet.</p>
              {isUserDM && (
                <p className="hint-text">
                  As the Dungeon Master, you can add campaign rules and guidelines for your players.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CampaignRules;