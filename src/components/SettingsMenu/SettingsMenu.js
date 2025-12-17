import React, { useState } from "react";
import { useCachedUserProfile } from "../../services/cache";
import { ProfileDisplay } from "../ProfileDisplay/ProfileDisplay";
import "./SettingsMenu.css";

/**
 * SettingsMenu - Enhanced settings menu with profile management
 * Integrates existing profanity filter toggle with new profile features
 */
export function SettingsMenu({ isOpen, onClose, onForceProfileSetup }) {
  const {
    profile,
    profanityFilterEnabled,
    toggleProfanityFilter,
    getDisplayInfo,
  } = useCachedUserProfile();

  const [activeView, setActiveView] = useState("main"); // main, profile
  const [updating, setUpdating] = useState(false);

  const displayInfo = getDisplayInfo();

  const handleToggleProfanityFilter = async () => {
    setUpdating(true);
    try {
      await toggleProfanityFilter();
    } catch (err) {
      console.error("Error toggling profanity filter:", err);
      alert("Error updating setting: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleViewProfile = () => {
    setActiveView("profile");
  };

  const handleEditProfile = () => {
    setActiveView("profile");
  };

  const handleBackToMain = () => {
    setActiveView("main");
  };

  const handleClose = () => {
    setActiveView("main");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="settings-menu-overlay" onClick={handleClose}>
      <div className="settings-menu" onClick={(e) => e.stopPropagation()}>
        {activeView === "main" && (
          <>
            <div className="settings-header">
              <h2>Settings</h2>
              <button
                className="close-button"
                onClick={handleClose}
                aria-label="Close settings"
              >
                ×
              </button>
            </div>

            <div className="settings-content">
              {/* Profile Section */}
              <div className="settings-section">
                <h3>Profile</h3>

                <div className="profile-preview">
                  <div className="profile-preview-info">
                    <img
                      src={
                        displayInfo?.profilePicture ||
                        "https://via.placeholder.com/48x48?text=👤"
                      }
                      alt="Your profile"
                      className="profile-preview-avatar"
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/48x48?text=👤";
                      }}
                    />
                    <div className="profile-preview-details">
                      <div className="profile-preview-name">
                        {displayInfo?.displayName || "Anonymous"}
                        {!displayInfo?.isComplete && (
                          <span className="incomplete-badge">Incomplete</span>
                        )}
                      </div>
                      {displayInfo?.username && (
                        <div className="profile-preview-username">
                          @{displayInfo.username}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="profile-preview-actions">
                    <button
                      className="button-secondary small"
                      onClick={handleViewProfile}
                      type="button"
                    >
                      View
                    </button>
                    <button
                      className="button-primary small"
                      onClick={handleEditProfile}
                      type="button"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                {!displayInfo?.isComplete && (
                  <div className="profile-warning">
                    <span className="warning-icon">⚠️</span>
                    <div className="warning-text">
                      <strong>Complete your profile</strong>
                      <br />
                      Set a username to personalize your chat experience
                      <button
                        className="button-primary small"
                        onClick={() => {
                          onForceProfileSetup?.();
                          handleClose();
                        }}
                        style={{ marginTop: "0.5rem" }}
                        type="button"
                      >
                        Complete Setup
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Settings */}
              <div className="settings-section">
                <h3>Chat Settings</h3>

                <div className="setting-item">
                  <div className="setting-info">
                    <label htmlFor="profanity-filter">Profanity Filter</label>
                    <span className="setting-description">
                      Filter inappropriate language in chat messages
                    </span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      id="profanity-filter"
                      type="checkbox"
                      checked={profanityFilterEnabled}
                      onChange={handleToggleProfanityFilter}
                      disabled={updating}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="settings-section">
                <h3>Privacy</h3>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Profile Visibility</label>
                    <span className="setting-description">
                      {profile?.profileVisibility === "public" &&
                        "Anyone can see your profile"}
                      {profile?.profileVisibility === "friends" &&
                        "Only friends can see your profile"}
                      {profile?.profileVisibility === "private" &&
                        "Only you can see your profile"}
                    </span>
                  </div>
                  <button
                    className="button-secondary small"
                    onClick={handleEditProfile}
                    type="button"
                  >
                    Change
                  </button>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Email Visibility</label>
                    <span className="setting-description">
                      Email is {profile?.showEmail ? "visible" : "hidden"} on
                      your profile
                    </span>
                  </div>
                  <button
                    className="button-secondary small"
                    onClick={handleEditProfile}
                    type="button"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* About */}
              <div className="settings-section">
                <h3>About</h3>
                <div className="about-info">
                  <p>SuperChat - Real-time chat application</p>
                  <p>Enhanced with custom profiles and privacy controls</p>
                </div>
              </div>
            </div>
          </>
        )}

        {activeView === "profile" && profile && (
          <ProfileDisplay userId={profile.uid} onClose={handleBackToMain} />
        )}
      </div>
    </div>
  );
}

export default SettingsMenu;
