import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirebase } from '../../services/FirebaseContext';
import useUserProfile from '../../hooks/useUserProfile';
import { deleteUserAccount, confirmAccountDeletion } from '../../services/userDeletionService';
import './DeleteAccountSection.css';

/**
 * DeleteAccountSection Component
 * 
 * Provides UI for users to delete their account with proper warnings
 * and confirmation steps.
 */
function DeleteAccountSection() {
  const { functions, auth } = useFirebase();
  const { profile } = useUserProfile();
  const navigate = useNavigate();
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [showDangerZone, setShowDangerZone] = useState(false);

  const handleDeleteAccount = async () => {
    if (!profile?.username) {
      setError('Unable to load user profile. Please refresh and try again.');
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      // Show confirmation dialogs
      const confirmed = await confirmAccountDeletion(profile.username);
      
      if (!confirmed) {
        setIsDeleting(false);
        return;
      }

      // Show final loading state
      const finalConfirm = window.confirm(
        'This is your final chance to cancel. Click OK to permanently delete your account now.'
      );

      if (!finalConfirm) {
        setIsDeleting(false);
        return;
      }

      // Proceed with deletion
      const result = await deleteUserAccount(functions, auth);
      
      if (result.success) {
        // Show success message
        alert('Your account has been successfully deleted. You will now be redirected to the home page.');
        
        // Redirect to home page
        navigate('/');
      }
    } catch (err) {
      console.error('Account deletion error:', err);
      setError(err.message || 'Failed to delete account. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="delete-account-section">
      <h3 className="section-title">Danger Zone</h3>
      
      {!showDangerZone ? (
        <div className="danger-zone-collapsed">
          <button
            className="btn-show-danger-zone"
            onClick={() => setShowDangerZone(true)}
          >
            🔓 Unlock Danger Zone
          </button>
          <p className="danger-zone-hint">
            Contains irreversible account actions
          </p>
        </div>
      ) : (
        <div className="danger-zone-expanded">
          <div className="danger-warning">
            <div className="warning-icon">⚠️</div>
            <div className="warning-content">
              <h4>Delete Your Account</h4>
              <p>
                Once you delete your account, there is no going back. This action is permanent and will:
              </p>
              <ul className="deletion-effects">
                <li>🗑️ Delete your profile and all personal data</li>
                <li>👑 Delete all campaigns you own (cannot be recovered)</li>
                <li>👥 Remove you from all campaigns you've joined</li>
                <li>📝 Delete all your character sheets</li>
                <li>💬 Anonymize your messages (will show as [Deleted User])</li>
                <li>🎲 Delete all your tokens and game assets</li>
              </ul>
              <p className="warning-note">
                <strong>Note:</strong> Other players' games that depend on your campaigns will be affected. 
                Consider transferring ownership or notifying your players first.
              </p>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">❌</span>
              {error}
            </div>
          )}

          <div className="danger-actions">
            <button
              className="btn-cancel"
              onClick={() => {
                setShowDangerZone(false);
                setError(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </button>
            
            <button
              className="btn-delete-account"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <span className="loading-spinner">⏳</span>
                  Deleting Account...
                </>
              ) : (
                <>
                  <span className="delete-icon">🗑️</span>
                  Delete My Account
                </>
              )}
            </button>
          </div>

          <p className="final-warning">
            This action <strong>CANNOT</strong> be undone. All your data will be permanently deleted.
          </p>
        </div>
      )}
    </div>
  );
}

export default DeleteAccountSection;
