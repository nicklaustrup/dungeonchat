/**
 * VoiceSettings Component
 * Settings panel for voice chat audio quality and processing options
 */

import React, { useState, useEffect } from 'react';
import { FaCog, FaTimes, FaCheck } from 'react-icons/fa';
import './VoiceSettings.css';

export default function VoiceSettings({ 
  isOpen, 
  onClose, 
  settings, 
  onSettingsChange,
  onSave 
}) {
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleChange = (key, value) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    if (onSettingsChange) {
      onSettingsChange(newSettings);
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(localSettings);
    }
    onClose();
  };

  const handleCancel = () => {
    setLocalSettings(settings); // Reset to original
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="voice-settings-overlay" onClick={handleCancel}>
      <div className="voice-settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="voice-settings-header">
          <div className="voice-settings-title">
            <FaCog />
            <h3>Voice Settings</h3>
          </div>
          <button 
            className="btn-close-settings"
            onClick={handleCancel}
            title="Close"
          >
            <FaTimes />
          </button>
        </div>

        <div className="voice-settings-content">
          {/* Audio Quality */}
          <div className="setting-group">
            <label className="setting-label">
              <span className="setting-name">Audio Quality</span>
              <span className="setting-description">
                Higher quality uses more bandwidth
              </span>
            </label>
            <div className="setting-control">
              <select
                value={localSettings.audioQuality}
                onChange={(e) => handleChange('audioQuality', e.target.value)}
                className="setting-select"
              >
                <option value="low">Low (16 kbps)</option>
                <option value="medium">Medium (32 kbps)</option>
                <option value="high">High (64 kbps)</option>
              </select>
            </div>
          </div>

          {/* Echo Cancellation */}
          <div className="setting-group">
            <label className="setting-label">
              <span className="setting-name">Echo Cancellation</span>
              <span className="setting-description">
                Reduces echo from speakers
              </span>
            </label>
            <div className="setting-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={localSettings.echoCancellation}
                  onChange={(e) => handleChange('echoCancellation', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
              <span className="setting-value">
                {localSettings.echoCancellation ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>

          {/* Noise Suppression */}
          <div className="setting-group">
            <label className="setting-label">
              <span className="setting-name">Noise Suppression</span>
              <span className="setting-description">
                Filters background noise
              </span>
            </label>
            <div className="setting-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={localSettings.noiseSuppression}
                  onChange={(e) => handleChange('noiseSuppression', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
              <span className="setting-value">
                {localSettings.noiseSuppression ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>

          {/* Auto Gain Control */}
          <div className="setting-group">
            <label className="setting-label">
              <span className="setting-name">Auto Gain Control</span>
              <span className="setting-description">
                Automatically adjusts microphone volume
              </span>
            </label>
            <div className="setting-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={localSettings.autoGainControl}
                  onChange={(e) => handleChange('autoGainControl', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
              <span className="setting-value">
                {localSettings.autoGainControl ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>

        <div className="voice-settings-footer">
          <button 
            className="btn-settings-cancel"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button 
            className="btn-settings-save"
            onClick={handleSave}
          >
            <FaCheck /> Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
