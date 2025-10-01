import React, { useState } from 'react';
import './LightingPanel.css';

/**
 * LightingPanel Component
 * UI panel for controlling lighting system
 */
const LightingPanel = ({
  lights = [],
  globalLighting = {},
  onCreateLight,
  onUpdateLight,
  onDeleteLight,
  onUpdateGlobalLighting,
  onClose,
  open = false,
  isDM = false,
  onStartPlacingLight = null // Callback to enter "place light" mode
}) => {
  const [showEditor, setShowEditor] = useState(false);
  const [editingLight, setEditingLight] = useState(null);

  const handleEditLight = (light) => {
    setEditingLight(light);
    setShowEditor(true);
  };

  const handleCreateNew = () => {
    setEditingLight(null);
    setShowEditor(true);
  };

  const handleSaveLight = async (lightData) => {
    try {
      if (editingLight) {
        await onUpdateLight(editingLight.id, lightData);
      } else {
        await onCreateLight(lightData);
      }
      setShowEditor(false);
      setEditingLight(null);
    } catch (error) {
      console.error('Error saving light:', error);
    }
  };

  const handleDeleteLight = async (lightId) => {
    if (window.confirm('Delete this light source?')) {
      try {
        await onDeleteLight(lightId);
      } catch (error) {
        console.error('Error deleting light:', error);
      }
    }
  };

  const handleTimeChange = (e) => {
    const time = parseFloat(e.target.value);
    onUpdateGlobalLighting({ timeOfDay: time });
  };

  const handleAmbientChange = (e) => {
    const level = parseFloat(e.target.value) / 100;
    onUpdateGlobalLighting({ ambientLight: level });
  };

  const handleToggleLighting = () => {
    onUpdateGlobalLighting({ enabled: !globalLighting.enabled });
  };

  const getTimeLabel = (time) => {
    const hour = Math.floor(time);
    const minutes = Math.floor((time - hour) * 60);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const getTimeEmoji = (time) => {
    if (time >= 6 && time < 12) return '🌅'; // Morning
    if (time >= 12 && time < 18) return '☀️'; // Day
    if (time >= 18 && time < 20) return '🌇'; // Evening
    return '🌙'; // Night
  };

  if (!isDM) {
    return null; // Only DM can control lighting
  }

  if (!open) {
    return null; // Panel is closed
  }

  return (
    <div className="lighting-panel">
      <div className="lighting-panel-header">
        <h3>🔦 Lighting System</h3>
        <button 
          className="close-button"
          onClick={onClose}
          aria-label="Close lighting panel"
        >
          ✕
        </button>
      </div>

      <div className="lighting-panel-content">
        {/* Global Lighting Controls */}
        <div className="lighting-section">
          <div className="lighting-section-header">
            <h4>Global Lighting</h4>
            <button
              className={`toggle-button ${globalLighting.enabled ? 'active' : ''}`}
              onClick={handleToggleLighting}
              title={globalLighting.enabled ? 'Disable lighting' : 'Enable lighting'}
            >
              {globalLighting.enabled ? '🔆 ON' : '🌑 OFF'}
            </button>
          </div>

          {globalLighting.enabled && (
            <>
              {/* Time of Day */}
              <div className="control-group">
                <label>
                  Time of Day {getTimeEmoji(globalLighting.timeOfDay)}
                  <span className="control-value">{getTimeLabel(globalLighting.timeOfDay)}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="24"
                  step="0.5"
                  value={globalLighting.timeOfDay}
                  onChange={handleTimeChange}
                  className="slider"
                />
                <div className="time-markers">
                  <span>🌅 Dawn</span>
                  <span>☀️ Noon</span>
                  <span>🌙 Night</span>
                </div>
              </div>

              {/* Ambient Light */}
              <div className="control-group">
                <label>
                  Ambient Light
                  <span className="control-value">{Math.round(globalLighting.ambientLight * 100)}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={Math.round(globalLighting.ambientLight * 100)}
                  onChange={handleAmbientChange}
                  className="slider"
                />
              </div>
            </>
          )}
        </div>

        {/* Quick Place Light Palette */}
        {globalLighting.enabled && onStartPlacingLight && (
          <div className="lighting-section">
            <h4>Quick Place Lights</h4>
            <p className="section-hint">Click a preset, then click the map to place</p>
            <div className="light-presets-grid">
              <button
                className="preset-card"
                onClick={() => onStartPlacingLight({ 
                  type: 'point',
                  color: '#FF8800', 
                  radius: 40, 
                  intensity: 0.8, 
                  flicker: true,
                  falloff: 'realistic'
                })}
                title="Click to place torch"
              >
                🔥<br/>Torch
              </button>
              <button
                className="preset-card"
                onClick={() => onStartPlacingLight({ 
                  type: 'point',
                  color: '#FFB366', 
                  radius: 30, 
                  intensity: 0.9, 
                  flicker: false,
                  falloff: 'realistic'
                })}
                title="Click to place lantern"
              >
                🏮<br/>Lantern
              </button>
              <button
                className="preset-card"
                onClick={() => onStartPlacingLight({ 
                  type: 'point',
                  color: '#FFD700', 
                  radius: 10, 
                  intensity: 0.6, 
                  flicker: true,
                  falloff: 'realistic'
                })}
                title="Click to place candle"
              >
                🕯️<br/>Candle
              </button>
              <button
                className="preset-card"
                onClick={() => onStartPlacingLight({ 
                  type: 'point',
                  color: '#FFFFFF', 
                  radius: 40, 
                  intensity: 1.0, 
                  flicker: false,
                  falloff: 'realistic'
                })}
                title="Click to place light spell"
              >
                ✨<br/>Light Spell
              </button>
              <button
                className="preset-card"
                onClick={() => onStartPlacingLight({ 
                  type: 'point',
                  color: '#4444FF', 
                  radius: 30, 
                  intensity: 0.9, 
                  animated: true,
                  falloff: 'realistic'
                })}
                title="Click to place magical light"
              >
                🔵<br/>Magical
              </button>
              <button
                className="preset-card"
                onClick={() => onStartPlacingLight({ 
                  type: 'point',
                  color: '#AA44FF', 
                  radius: 30, 
                  intensity: 0.9, 
                  animated: true,
                  falloff: 'realistic'
                })}
                title="Click to place purple magical light"
              >
                🟣<br/>Purple
              </button>
            </div>
          </div>
        )}

        {/* Light Sources List */}
        {globalLighting.enabled && (
          <div className="lighting-section">
            <div className="lighting-section-header">
              <h4>Light Sources ({lights.length})</h4>
              <button
                className="add-button"
                onClick={handleCreateNew}
                title="Add light source"
              >
                + Add Light
              </button>
            </div>

            {lights.length === 0 ? (
              <div className="empty-state">
                <p>No light sources yet</p>
                <p className="empty-hint">Click "+ Add Light" to create one</p>
              </div>
            ) : (
              <div className="lights-list">
                {lights.map(light => (
                  <div key={light.id} className="light-item">
                    <div 
                      className="light-color-indicator" 
                      style={{ backgroundColor: light.color }}
                    />
                    <div className="light-info">
                      <div className="light-name">
                        {light.attachedTo ? '🔗 Token Light' : '💡 Static Light'}
                      </div>
                      <div className="light-details">
                        Range: {light.radius}ft • 
                        {light.flicker && ' Flickering •'}
                        {light.animated && ' Animated •'}
                        {' '}{Math.round(light.intensity * 100)}%
                      </div>
                    </div>
                    <div className="light-actions">
                      <button
                        className="icon-button"
                        onClick={() => handleEditLight(light)}
                        title="Edit light"
                      >
                        🔧
                      </button>
                      <button
                        className="icon-button delete"
                        onClick={() => handleDeleteLight(light.id)}
                        title="Delete light"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Light Editor Modal */}
      {showEditor && (
        <LightEditor
          light={editingLight}
          onSave={handleSaveLight}
          onCancel={() => {
            setShowEditor(false);
            setEditingLight(null);
          }}
        />
      )}
    </div>
  );
};

/**
 * Light Editor Modal
 */
const LightEditor = ({ light, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    type: light?.type || 'point',
    radius: light?.radius || 40,
    intensity: light?.intensity || 0.8,
    color: light?.color || '#FF8800',
    flicker: light?.flicker || false,
    animated: light?.animated || false,
    falloff: light?.falloff || 'realistic',
    position: light?.position || { x: 0, y: 0 },
    attachedTo: light?.attachedTo || null
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const presets = {
    torch: { color: '#FF8800', radius: 40, intensity: 0.8, flicker: true },
    lantern: { color: '#FFB366', radius: 30, intensity: 0.9, flicker: false },
    candle: { color: '#FFD700', radius: 10, intensity: 0.6, flicker: true },
    lightSpell: { color: '#FFFFFF', radius: 40, intensity: 1.0, flicker: false },
    magicalBlue: { color: '#4444FF', radius: 30, intensity: 0.9, animated: true },
    magicalPurple: { color: '#AA44FF', radius: 30, intensity: 0.9, animated: true }
  };

  const applyPreset = (presetName) => {
    const preset = presets[presetName];
    if (preset) {
      setFormData(prev => ({ ...prev, ...preset }));
    }
  };

  return (
    <div className="modal-overlay">
      <div className="light-editor-modal">
        <div className="modal-header">
          <h3>{light ? 'Edit Light Source' : 'Create Light Source'}</h3>
          <button className="close-button" onClick={onCancel}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="light-editor-form">
          {/* Presets */}
          <div className="form-group">
            <label>Quick Presets</label>
            <div className="preset-buttons">
              <button type="button" onClick={() => applyPreset('torch')}>🔥 Torch</button>
              <button type="button" onClick={() => applyPreset('lantern')}>🏮 Lantern</button>
              <button type="button" onClick={() => applyPreset('candle')}>🕯️ Candle</button>
              <button type="button" onClick={() => applyPreset('lightSpell')}>✨ Light Spell</button>
              <button type="button" onClick={() => applyPreset('magicalBlue')}>🔵 Magical</button>
            </div>
          </div>

          {/* Radius */}
          <div className="form-group">
            <label>
              Radius (grid units)
              <span className="control-value">{formData.radius}</span>
            </label>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={formData.radius}
              onChange={(e) => handleChange('radius', parseInt(e.target.value))}
              className="slider"
            />
          </div>

          {/* Color */}
          <div className="form-group">
            <label>Color</label>
            <div className="color-picker-group">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => handleChange('color', e.target.value)}
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => handleChange('color', e.target.value)}
                placeholder="#FF8800"
                className="color-input"
              />
            </div>
          </div>

          {/* Intensity */}
          <div className="form-group">
            <label>
              Intensity
              <span className="control-value">{Math.round(formData.intensity * 100)}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={Math.round(formData.intensity * 100)}
              onChange={(e) => handleChange('intensity', parseInt(e.target.value) / 100)}
              className="slider"
            />
          </div>

          {/* Effects */}
          <div className="form-group">
            <label>Effects</label>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.flicker}
                  onChange={(e) => handleChange('flicker', e.target.checked)}
                />
                🔥 Flicker animation
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.animated}
                  onChange={(e) => handleChange('animated', e.target.checked)}
                />
                ✨ Pulse/breathing
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {light ? 'Update Light' : 'Create Light'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LightingPanel;
