import React, { useState } from "react";
import { useCachedUserProfile } from "../../services/cache";
import { ProfileEditor } from "../ProfileEditor/ProfileEditor";
import "./ProfileSetupModal.css";

/**
 * ProfileSetupModal - First-time user profile setup experience
 * Shows when users haven't completed their profile setup (missing username)
 * Username is required for OAuth users - cannot be skipped
 */
export function ProfileSetupModal({ onComplete, canSkip = false }) {
  const { needsOnboarding, isProfileComplete } = useCachedUserProfile();
  const [currentStep, setCurrentStep] = useState(1);

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

  return (
    <div className="profile-setup-modal-overlay">
      <div className="profile-setup-modal">
        {currentStep === 1 && (
          <>
            <div className="setup-header">
              <div className="setup-icon">👋</div>
              <h2>Welcome to DungeonChat!</h2>
              <p>
                Before you can start, please choose a unique username. This is
                how other users will recognize you across campaigns and chat
                rooms.
              </p>
              <p className="setup-note">
                ⚠️ Username is required and cannot be changed later
              </p>
            </div>

            <div className="setup-content">
              <ProfileEditor
                onSave={handleComplete}
                onCancel={undefined}
                compact={true}
              />
            </div>
          </>
        )}

        {currentStep === 2 && (
          <div className="setup-success">
            <div className="success-animation">
              <div className="checkmark">✓</div>
            </div>
            <h2>Username Set!</h2>
            <p>
              Welcome to DungeonChat! Your profile has been created
              successfully.
            </p>
            <div className="success-loading">
              <div className="spinner"></div>
              <span>Loading application...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfileSetupModal;
