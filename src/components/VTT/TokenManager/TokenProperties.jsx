import React, { useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import './TokenProperties.css';

/**
 * TokenProperties - Edit properties of selected token
 * Allows editing name, color, size, visibility, and deletion
 */
const TokenProperties = ({ token, onUpdate, onDelete }) => {
  const [name, setName] = useState(token.name || '');
  const [color, setColor] = useState(token.color || '#4a90e2');
  const [size, setSize] = useState(token.size?.width ? token.size.width / 50 : 1);
  const [hidden, setHidden] = useState(token.hidden || false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Update form when token changes
  useEffect(() => {
    setName(token.name || '');
    setColor(token.color || '#4a90e2');
    setSize(token.size?.width ? token.size.width / 50 : 1);
    setHidden(token.hidden || false);
    setHasChanges(false);
  }, [token]);

  // Track changes
  useEffect(() => {
    const currentSize = token.size?.width ? token.size.width / 50 : 1;
    const changed = 
      name !== token.name ||
      color !== token.color ||
      size !== currentSize ||
      hidden !== token.hidden;
    setHasChanges(changed);
  }, [name, color, size, hidden, token.name, token.color, token.size?.width, token.hidden]);

  const sizeOptions = [
    { value: 0.5, label: 'Tiny', gridSquares: '0.5x0.5' },
    { value: 1, label: 'Small/Medium', gridSquares: '1x1' },
    { value: 2, label: 'Large', gridSquares: '2x2' },
    { value: 3, label: 'Huge', gridSquares: '3x3' },
    { value: 4, label: 'Gargantuan', gridSquares: '4x4' },
  ];

  const handleSave = () => {
    if (!name.trim()) {
      alert('Token name cannot be empty');
      return;
    }

    if (!token.id && !token.tokenId) {
      alert('Token ID is missing. Cannot update token.');
      console.error('Token object:', token);
      return;
    }

    const pixelSize = size * 50; // Convert grid multiplier to pixels
    const updates = {
      name: name.trim(),
      color,
      size: { width: pixelSize, height: pixelSize },
      hidden,
      updatedAt: new Date(),
    };

    // Use id or tokenId, whichever exists
    const tokenId = token.id || token.tokenId;
    onUpdate(tokenId, updates);
    setHasChanges(false);
  };

  const handleReset = () => {
    setName(token.name || '');
    setColor(token.color || '#4a90e2');
    setSize(token.size?.width ? token.size.width / 50 : 1);
    setHidden(token.hidden || false);
    setHasChanges(false);
  };

  const handleDelete = () => {
    const tokenId = token.id || token.tokenId;
    if (!tokenId) {
      alert('Token ID is missing. Cannot delete token.');
      return;
    }
    onDelete(tokenId, token.imageUrl);
  };

  return (
    <div className="token-properties">
      <div className="properties-header">
        <h4>Token Properties</h4>
        {token.imageUrl && (
          <div className="token-preview-mini">
            <img src={token.imageUrl} alt={token.name} />
          </div>
        )}
      </div>

      <div className="properties-form">
        <div className="form-group">
          <label className="form-label">Token Name</label>
          <input
            type="text"
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Token name"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Token Type</label>
          <div className="token-type-display">
            <span className="type-badge" style={{
              backgroundColor: token.type === 'player' ? '#4a9eff' : 
                               token.type === 'enemy' ? '#dc2626' : 
                               token.type === 'npc' ? '#22c55e' : '#888888',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              textTransform: 'capitalize'
            }}>
              {token.type || 'unknown'}
            </span>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Color</label>
          <div className="color-picker-container">
            <button
              className="color-preview-button"
              style={{ backgroundColor: color }}
              onClick={() => setShowColorPicker(!showColorPicker)}
              title="Click to change color"
            >
              {color}
            </button>
            {showColorPicker && (
              <div className="color-picker-popover">
                <div 
                  className="color-picker-backdrop" 
                  onClick={() => setShowColorPicker(false)} 
                />
                <HexColorPicker color={color} onChange={setColor} />
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Size</label>
          <div className="size-selector">
            {sizeOptions.map((option) => (
              <button
                key={option.value}
                className={`size-button ${size === option.value ? 'selected' : ''}`}
                onClick={() => setSize(option.value)}
              >
                <div className="size-label">{option.label}</div>
                <div className="size-grid">{option.gridSquares}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label checkbox-label">
            <input
              type="checkbox"
              checked={hidden}
              onChange={(e) => setHidden(e.target.checked)}
              className="form-checkbox"
            />
            <span>Hidden from players</span>
          </label>
          <p className="form-hint">
            Hidden tokens are only visible to the DM
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">Position</label>
          <div className="position-display">
            <span className="position-coord">X: {Math.round(token.position?.x || 0)}</span>
            <span className="position-coord">Y: {Math.round(token.position?.y || 0)}</span>
          </div>
          <p className="form-hint">
            Drag the token on the map to change position
          </p>
        </div>
      </div>

      <div className="properties-actions">
        <button
          className="action-button primary"
          onClick={handleSave}
          disabled={!hasChanges}
        >
          💾 Save Changes
        </button>
        <button
          className="action-button secondary"
          onClick={handleReset}
          disabled={!hasChanges}
        >
          ↺ Reset
        </button>
        <button
          className="action-button danger"
          onClick={handleDelete}
        >
          🗑️ Delete Token
        </button>
      </div>
    </div>
  );
};

export default TokenProperties;
