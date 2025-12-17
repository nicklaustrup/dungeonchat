/**
 * VoiceSettings Component
 * Settings panel for voice chat audio quality and processing options
 */

import React, { useState, useEffect } from "react";
import {
  FaCog,
  FaTimes,
  FaCheck,
  FaMicrophone,
  FaVolumeUp,
} from "react-icons/fa";
import "./VoiceSettings.css";

export default function VoiceSettings({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  onSave,
}) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [audioInputDevices, setAudioInputDevices] = useState([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(true);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Enumerate available audio devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        setDevicesLoading(true);

        // Request permission to access media devices
        await navigator.mediaDevices.getUserMedia({ audio: true });

        // Get all media devices
        const devices = await navigator.mediaDevices.enumerateDevices();

        // Filter audio input devices (microphones)
        const inputDevices = devices.filter(
          (device) => device.kind === "audioinput"
        );
        setAudioInputDevices(inputDevices);

        // Filter audio output devices (speakers/headphones)
        const outputDevices = devices.filter(
          (device) => device.kind === "audiooutput"
        );
        setAudioOutputDevices(outputDevices);

        console.log("[VoiceSettings] Found devices:", {
          inputs: inputDevices.length,
          outputs: outputDevices.length,
        });
      } catch (error) {
        console.error("[VoiceSettings] Error enumerating devices:", error);
      } finally {
        setDevicesLoading(false);
      }
    };

    if (isOpen) {
      getDevices();
    }
  }, [isOpen]);

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
      <div
        className="voice-settings-modal"
        onClick={(e) => e.stopPropagation()}
      >
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
          {/* Input Device (Microphone) */}
          <div className="setting-group">
            <label className="setting-label">
              <span className="setting-name">
                <FaMicrophone style={{ marginRight: "8px" }} />
                Microphone
              </span>
              <span className="setting-description">
                Select your input device
              </span>
            </label>
            <div className="setting-control">
              <select
                value={localSettings.audioInputDeviceId || "default"}
                onChange={(e) =>
                  handleChange("audioInputDeviceId", e.target.value)
                }
                className="setting-select"
                disabled={devicesLoading}
              >
                <option value="default">Default Microphone</option>
                {audioInputDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label ||
                      `Microphone ${device.deviceId.substring(0, 8)}`}
                  </option>
                ))}
              </select>
              {devicesLoading && (
                <span className="device-loading">Loading...</span>
              )}
            </div>
          </div>

          {/* Output Device (Speakers) */}
          <div className="setting-group">
            <label className="setting-label">
              <span className="setting-name">
                <FaVolumeUp style={{ marginRight: "8px" }} />
                Speakers
              </span>
              <span className="setting-description">
                Select your output device
              </span>
            </label>
            <div className="setting-control">
              <select
                value={localSettings.audioOutputDeviceId || "default"}
                onChange={(e) =>
                  handleChange("audioOutputDeviceId", e.target.value)
                }
                className="setting-select"
                disabled={devicesLoading}
              >
                <option value="default">Default Speakers</option>
                {audioOutputDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label ||
                      `Speakers ${device.deviceId.substring(0, 8)}`}
                  </option>
                ))}
              </select>
              {devicesLoading && (
                <span className="device-loading">Loading...</span>
              )}
            </div>
          </div>

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
                onChange={(e) => handleChange("audioQuality", e.target.value)}
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
                  onChange={(e) =>
                    handleChange("echoCancellation", e.target.checked)
                  }
                />
                <span className="toggle-slider"></span>
              </label>
              <span className="setting-value">
                {localSettings.echoCancellation ? "Enabled" : "Disabled"}
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
                  onChange={(e) =>
                    handleChange("noiseSuppression", e.target.checked)
                  }
                />
                <span className="toggle-slider"></span>
              </label>
              <span className="setting-value">
                {localSettings.noiseSuppression ? "Enabled" : "Disabled"}
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
                  onChange={(e) =>
                    handleChange("autoGainControl", e.target.checked)
                  }
                />
                <span className="toggle-slider"></span>
              </label>
              <span className="setting-value">
                {localSettings.autoGainControl ? "Enabled" : "Disabled"}
              </span>
            </div>
          </div>
        </div>

        <div className="voice-settings-footer">
          <button className="btn-settings-cancel" onClick={handleCancel}>
            Cancel
          </button>
          <button className="btn-settings-save" onClick={handleSave}>
            <FaCheck /> Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
