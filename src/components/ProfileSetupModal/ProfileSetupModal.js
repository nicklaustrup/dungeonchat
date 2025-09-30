import React, { useState } from 'react';
import { useUserProfile } from '../../hooks/useUserProfile';
import { ProfileEditor } from '../ProfileEditor/ProfileEditor';
import './ProfileSetupModal.css';

/**
 * ProfileSetupModal - First-time user profile setup experience
 * Shows when users haven't completed their profile setup (missing username)
 */
export function ProfileSetupModal({ onComplete, canSkip = false }) {
  const { needsOnboarding, isProfileComplete } = useUserProfile();
  const [currentStep, setCurrentStep] = useState(1);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  // Don't show modal if profile is already complete
  if (!needsOnboarding || isProfileComplete) {
    return null;
  }

  const handleComplete = () => {
    setCurrentStep(2);
    setTimeout(() => {
      onComplete?.();
    }, 1500);
  };

  const handleSkip = () => {
    if (canSkip) {
      setShowSkipConfirm(true);
    }
  };

  const confirmSkip = () => {
    onComplete?.();
  };

  const cancelSkip = () => {
    setShowSkipConfirm(false);
  };

  return (
    <div className="profile-setup-modal-overlay">
      <div className="profile-setup-modal">
        {currentStep === 1 && (
          <>
            <div className="setup-header">
              <div className="setup-icon">👋</div>
              <h2>Welcome to DungeonChat!</h2>
              <p>Let's set up your profile to get started. This helps other users recognize you in the chat.</p>
            </div>

            <div className="setup-content">
              <ProfileEditor 
                onSave={handleComplete}
                onCancel={canSkip ? handleSkip : undefined}
                compact={true}
              />
            </div>

            {canSkip && (
              <div className="setup-footer">
                <button 
                  className="skip-button"
                  onClick={handleSkip}
                  type="button"
                >
                  Skip for now
                </button>
              </div>
            )}
          </>
        )}

        {currentStep === 2 && (
          <div className="setup-success">
            <div className="success-animation">
              <div className="checkmark">✓</div>
            </div>
            <h2>Profile Created!</h2>
            <p>Welcome to DungeonChat! Your profile has been set up successfully.</p>
            <div className="success-loading">
              <div className="spinner"></div>
              <span>Entering chat room...</span>
            </div>
          </div>
        )}

        {showSkipConfirm && (
          <div className="skip-confirmation-overlay">
            <div className="skip-confirmation">
              <h3>Skip Profile Setup?</h3>
              <p>You can always set up your profile later from the chat settings. Continue without a custom username?</p>
              <div className="skip-actions">
                <button 
                  className="button-secondary"
                  onClick={cancelSkip}
                  type="button"
                >
                  Go Back
                </button>
                <button 
                  className="button-primary"
                  onClick={confirmSkip}
                  type="button"
                >
                  Skip Setup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfileSetupModal;