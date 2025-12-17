import React, { useState, useRef } from "react";
import { useCachedUserProfile } from "../../services/cache";
import "./InlineProfileEditor.css";

/**
 * InlineProfileEditor - Profile editing with individual field editing
 * Each field has a pencil icon that enables inline editing with save/cancel
 */
export function InlineProfileEditor({ onSave, onCancel, compact = false }) {
  const {
    profile,
    updateProfile,
    checkUsernameAvailability,
    uploadPicture: uploadProfilePictureFile,
    loading,
  } = useCachedUserProfile();

  const [editingField, setEditingField] = useState(null);
  const [fieldValues, setFieldValues] = useState({
    username: profile?.username || "",
    displayName: profile?.displayName || "",
    bio: profile?.bio || "",
    profilePictureURL: profile?.profilePictureURL || "",
    profileVisibility: profile?.profileVisibility || "public",
    showEmail: profile?.showEmail ?? false,
    showLastActive: profile?.showLastActive ?? true,
  });

  const [validationState, setValidationState] = useState({
    username: { valid: true, message: "", checking: false },
  });

  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  // Handle field editing
  const startEditing = (field) => {
    setEditingField(field);
    // Reset validation when starting to edit
    if (field === "username") {
      setValidationState((prev) => ({
        ...prev,
        username: { valid: true, message: "", checking: false },
      }));
    }
  };

  const cancelEditing = () => {
    setEditingField(null);
    // Reset field value to original
    if (editingField && profile) {
      setFieldValues((prev) => ({
        ...prev,
        [editingField]: profile[editingField] || "",
      }));
    }
  };

  const saveField = async () => {
    if (!editingField) return;

    // Validate username if editing username
    if (editingField === "username") {
      if (!fieldValues.username.trim()) {
        setValidationState((prev) => ({
          ...prev,
          username: {
            valid: false,
            message: "Username is required",
            checking: false,
          },
        }));
        return;
      }

      if (fieldValues.username !== profile?.username) {
        setValidationState((prev) => ({
          ...prev,
          username: {
            valid: false,
            message: "Checking availability...",
            checking: true,
          },
        }));

        try {
          const result = await checkUsernameAvailability(fieldValues.username);
          if (!result.available) {
            setValidationState((prev) => ({
              ...prev,
              username: {
                valid: false,
                message: result.error,
                checking: false,
              },
            }));
            return;
          }
        } catch (err) {
          setValidationState((prev) => ({
            ...prev,
            username: {
              valid: false,
              message: "Error checking username",
              checking: false,
            },
          }));
          return;
        }
      }
    }

    try {
      setSaving(true);
      await updateProfile({ [editingField]: fieldValues[editingField] });
      setEditingField(null);
      onSave?.();
    } catch (err) {
      console.error("Error saving field:", err);
      alert("Error saving: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (value) => {
    setFieldValues((prev) => ({ ...prev, [editingField]: value }));
  };

  // Handle profile picture file selection
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setSaving(true);

      // Create preview URL immediately for better UX
      const previewUrl = URL.createObjectURL(file);
      setPreviewUrl(previewUrl);

      // Upload to Firebase Storage and update profile
      const downloadURL = await uploadProfilePictureFile(file);

      // Update local state with the actual URL
      setFieldValues((prev) => ({ ...prev, profilePictureURL: downloadURL }));

      // Clean up preview URL
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);

      // Show success message
      console.log("Profile picture uploaded successfully");
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      alert("Error uploading profile picture: " + error.message);

      // Clean up preview URL on error
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  if (loading) {
    return (
      <div className="inline-profile-editor loading">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  const currentAvatar =
    previewUrl ||
    fieldValues.profilePictureURL ||
    "https://via.placeholder.com/150x150?text=👤";

  return (
    <div className={`inline-profile-editor ${compact ? "compact" : ""}`}>
      <div className="inline-profile-editor-header">
        <h2>Edit Profile</h2>
        {compact && (
          <button
            type="button"
            className="close-button"
            onClick={onCancel}
            aria-label="Close profile editor"
          >
            ×
          </button>
        )}
      </div>

      <div className="inline-profile-editor-content">
        {/* Profile Picture Section */}
        <div className="profile-picture-section">
          <div className="avatar-container">
            <img
              src={currentAvatar}
              alt="Profile"
              className="profile-avatar"
              onClick={handleAvatarClick}
            />
            <div className="avatar-overlay" onClick={handleAvatarClick}>
              <span>📷 Change</span>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
          <p className="avatar-hint">Click to change profile picture</p>
        </div>

        {/* Inline Editable Fields */}
        <div className="form-section">
          <h3>Basic Information</h3>

          {/* Username Field */}
          <div className="inline-field-group">
            <label>Username *</label>
            {editingField === "username" ? (
              <div className="editing-field">
                <input
                  type="text"
                  value={fieldValues.username}
                  onChange={(e) => handleFieldChange(e.target.value)}
                  placeholder="Enter a unique username"
                  className={`form-input ${!validationState.username.valid ? "invalid" : ""}`}
                  disabled={saving}
                  autoFocus
                />
                <div className="field-actions">
                  <button
                    className="save-btn"
                    onClick={saveField}
                    disabled={
                      saving ||
                      !validationState.username.valid ||
                      validationState.username.checking
                    }
                    title="Save"
                  >
                    {saving ? "⏳" : "✓"}
                  </button>
                  <button
                    className="cancel-btn"
                    onClick={cancelEditing}
                    disabled={saving}
                    title="Cancel"
                  >
                    ✕
                  </button>
                </div>
                {validationState.username.message && (
                  <div
                    className={`validation-message ${validationState.username.valid ? "valid" : "invalid"}`}
                  >
                    {validationState.username.checking && (
                      <span className="spinner-small"></span>
                    )}
                    {validationState.username.message}
                  </div>
                )}
              </div>
            ) : (
              <div className="display-field">
                <span className="field-value">
                  {fieldValues.username || "Not set"}
                </span>
                <button
                  className="edit-btn"
                  onClick={() => startEditing("username")}
                  title="Edit username"
                >
                  ✏️
                </button>
              </div>
            )}
          </div>

          {/* Display Name Field */}
          <div className="inline-field-group">
            <label>Display Name</label>
            {editingField === "displayName" ? (
              <div className="editing-field">
                <input
                  type="text"
                  value={fieldValues.displayName}
                  onChange={(e) => handleFieldChange(e.target.value)}
                  placeholder="Your full name (optional)"
                  className="form-input"
                  disabled={saving}
                  autoFocus
                />
                <div className="field-actions">
                  <button
                    className="save-btn"
                    onClick={saveField}
                    disabled={saving}
                    title="Save"
                  >
                    {saving ? "⏳" : "✓"}
                  </button>
                  <button
                    className="cancel-btn"
                    onClick={cancelEditing}
                    disabled={saving}
                    title="Cancel"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <div className="display-field">
                <span className="field-value">
                  {fieldValues.displayName || "Not set"}
                </span>
                <button
                  className="edit-btn"
                  onClick={() => startEditing("displayName")}
                  title="Edit display name"
                >
                  ✏️
                </button>
              </div>
            )}
          </div>

          {/* Bio Field */}
          <div className="inline-field-group">
            <label>Bio</label>
            {editingField === "bio" ? (
              <div className="editing-field">
                <textarea
                  value={fieldValues.bio}
                  onChange={(e) => handleFieldChange(e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="form-textarea"
                  rows={3}
                  maxLength={500}
                  disabled={saving}
                  autoFocus
                />
                <div className="char-count">{fieldValues.bio.length}/500</div>
                <div className="field-actions">
                  <button
                    className="save-btn"
                    onClick={saveField}
                    disabled={saving}
                    title="Save"
                  >
                    {saving ? "⏳" : "✓"}
                  </button>
                  <button
                    className="cancel-btn"
                    onClick={cancelEditing}
                    disabled={saving}
                    title="Cancel"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <div className="display-field">
                <span className="field-value">
                  {fieldValues.bio || "Not set"}
                </span>
                <button
                  className="edit-btn"
                  onClick={() => startEditing("bio")}
                  title="Edit bio"
                >
                  ✏️
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Privacy Settings */}
        {!compact && (
          <div className="form-section">
            <h3>Privacy Settings</h3>

            <div className="inline-field-group">
              <label>Profile Visibility</label>
              {editingField === "profileVisibility" ? (
                <div className="editing-field">
                  <select
                    value={fieldValues.profileVisibility}
                    onChange={(e) => handleFieldChange(e.target.value)}
                    className="form-select"
                    disabled={saving}
                    autoFocus
                  >
                    <option value="public">
                      Public - Anyone can see your profile
                    </option>
                    <option value="friends">
                      Friends Only - Only friends can see your profile
                    </option>
                    <option value="private">
                      Private - Only you can see your profile
                    </option>
                  </select>
                  <div className="field-actions">
                    <button
                      className="save-btn"
                      onClick={saveField}
                      disabled={saving}
                      title="Save"
                    >
                      {saving ? "⏳" : "✓"}
                    </button>
                    <button
                      className="cancel-btn"
                      onClick={cancelEditing}
                      disabled={saving}
                      title="Cancel"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : (
                <div className="display-field">
                  <span className="field-value">
                    {fieldValues.profileVisibility === "public" && "Public"}
                    {fieldValues.profileVisibility === "friends" &&
                      "Friends Only"}
                    {fieldValues.profileVisibility === "private" && "Private"}
                  </span>
                  <button
                    className="edit-btn"
                    onClick={() => startEditing("profileVisibility")}
                    title="Edit visibility"
                  >
                    ✏️
                  </button>
                </div>
              )}
            </div>

            <div className="inline-field-group">
              <label>Show Email on Profile</label>
              {editingField === "showEmail" ? (
                <div className="editing-field">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={fieldValues.showEmail}
                      onChange={(e) => handleFieldChange(e.target.checked)}
                      disabled={saving}
                    />
                    <span className="checkbox-text">
                      Email is visible on your profile
                    </span>
                  </label>
                  <div className="field-actions">
                    <button
                      className="save-btn"
                      onClick={saveField}
                      disabled={saving}
                      title="Save"
                    >
                      {saving ? "⏳" : "✓"}
                    </button>
                    <button
                      className="cancel-btn"
                      onClick={cancelEditing}
                      disabled={saving}
                      title="Cancel"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : (
                <div className="display-field">
                  <span className="field-value">
                    {fieldValues.showEmail ? "Visible" : "Hidden"}
                  </span>
                  <button
                    className="edit-btn"
                    onClick={() => startEditing("showEmail")}
                    title="Edit email visibility"
                  >
                    ✏️
                  </button>
                </div>
              )}
            </div>

            <div className="inline-field-group">
              <label>Show Last Active</label>
              {editingField === "showLastActive" ? (
                <div className="editing-field">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={fieldValues.showLastActive}
                      onChange={(e) => handleFieldChange(e.target.checked)}
                      disabled={saving}
                    />
                    <span className="checkbox-text">
                      Show when you were last active
                    </span>
                  </label>
                  <div className="field-actions">
                    <button
                      className="save-btn"
                      onClick={saveField}
                      disabled={saving}
                      title="Save"
                    >
                      {saving ? "⏳" : "✓"}
                    </button>
                    <button
                      className="cancel-btn"
                      onClick={cancelEditing}
                      disabled={saving}
                      title="Cancel"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : (
                <div className="display-field">
                  <span className="field-value">
                    {fieldValues.showLastActive ? "Visible" : "Hidden"}
                  </span>
                  <button
                    className="edit-btn"
                    onClick={() => startEditing("showLastActive")}
                    title="Edit last active visibility"
                  >
                    ✏️
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="inline-profile-editor-actions">
        <button
          type="button"
          className="button-secondary"
          onClick={onCancel}
          disabled={saving}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default InlineProfileEditor;
