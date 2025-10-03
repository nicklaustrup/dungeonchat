import React, { useState, useCallback } from 'react';
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
  onStartPlacingLight = null, // Callback to enter "place light" mode
  onCenterCamera = null // Callback to center camera on light position
}) => {
  const [showEditor, setShowEditor] = useState(false);
  const [editingLight, setEditingLight] = useState(null);

  // Dragging state
  const [position, setPosition] = useState({ x: null, y: null });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

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

  // Drag handlers
  const handleMouseDown = (e) => {
    // Only start drag if clicking on header (not buttons)
    if (e.target.closest('button')) return;

    setIsDragging(true);
    const panel = e.currentTarget.parentElement;
    const rect = panel.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    // Keep panel within viewport bounds
    const maxX = window.innerWidth - 320; // panel width
    const maxY = window.innerHeight - 100; // leave some space at bottom

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  }, [isDragging, dragOffset.x, dragOffset.y]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add/remove mouse event listeners for dragging
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!isDM) {
    return null; // Only DM can control lighting
  }

  if (!open) {
    return null; // Panel is closed
  }

  return (
    <div
      className="lighting-panel"
      style={{
        left: position.x !== null ? `${position.x}px` : undefined,
        top: position.y !== null ? `${position.y}px` : undefined,
        right: position.x !== null ? 'auto' : undefined,
        cursor: isDragging ? 'grabbing' : undefined
      }}
    >
      <div
        className="lighting-panel-header"
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
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
              >
                🔥<br />Torch
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
              >
                🏮<br />Lantern
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
              >
                🕯️<br />Candle
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
              >
                ✨<br />Light Spell
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
              >
                🔵<br />Magical
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
              >
                🟣<br />Purple
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
                  <div key={light.id} className="light-item" onClick={() => (
                    onCenterCamera && light.position && (
                      onCenterCamera(light.position.x, light.position.y)
                    ))}>
                    <div
                      className="light-color-indicator"
                      style={{ backgroundColor: light.color }}
                    />
                    <div className="light-info">
                      <div className="light-name">
                        {light.name || (light.attachedTo ? '🔗 Token Light' : '💡 Static Light')}
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
                        title="Edit light properties"
                      >
                        🔧
                      </button>
                      <button
                        className="icon-button delete"
                        onClick={() => handleDeleteLight(light.id)}
                        title="Delete this light"
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
    name: light?.name || '',
    type: light?.type || 'point',
    radius: light?.radius || 40,
    intensity: light?.intensity || 0.8,
    color: light?.color || '#FF8800',
    flicker: light?.flicker || false,
    flickerIntensity: light?.flickerIntensity || 0.5, // 0.0 to 1.0, default medium
    animated: light?.animated || false,
    pulseIntensity: light?.pulseIntensity || 0.5, // 0.0 to 1.0, default medium
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
          {/* Name Field */}
          <div className="form-group">
            <label htmlFor="lightName">Light Name</label>
            <input
              type="text"
              id="lightName"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Torch 1, Campfire"
              className="text-input"
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #3a3a4e', background: '#2a2a3e', color: '#e0e0f0' }}
            />
          </div>

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

          {/* Flicker Intensity - only show if flicker is enabled */}
          {formData.flicker && (
            <div className="form-group">
              <label>
                Flicker Intensity
                <span className="control-value">
                  {formData.flickerIntensity <= 0.33 ? 'Subtle' :
                    formData.flickerIntensity <= 0.66 ? 'Medium' : 'Strong'}
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={Math.round(formData.flickerIntensity * 100)}
                onChange={(e) => handleChange('flickerIntensity', parseInt(e.target.value) / 100)}
                className="slider"
              />
              <div className="slider-labels">
                <span>Subtle</span>
                <span>Medium</span>
                <span>Strong</span>
              </div>
            </div>
          )}

          {/* Pulse Intensity - only show if animated is enabled */}
          {formData.animated && (
            <div className="form-group">
              <label>
                Pulse Intensity
                <span className="control-value">
                  {formData.pulseIntensity <= 0.33 ? 'Gentle' :
                    formData.pulseIntensity <= 0.66 ? 'Medium' : 'Dramatic'}
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={Math.round(formData.pulseIntensity * 100)}
                onChange={(e) => handleChange('pulseIntensity', parseInt(e.target.value) / 100)}
                className="slider"
              />
              <div className="slider-labels">
                <span>Gentle</span>
                <span>Medium</span>
                <span>Dramatic</span>
              </div>
            </div>
          )}

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
