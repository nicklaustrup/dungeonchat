import React, { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import './TokenPalette.css';

/**
 * TokenPalette - UI for selecting token type, color, and creating tokens
 * Provides quick access to common token types (PC, NPC, Monster, etc.)
 */
const TokenPalette = ({ onCreateToken, isCreating }) => {
  const [selectedType, setSelectedType] = useState('pc');
  const [selectedColor, setSelectedColor] = useState('#4a90e2');
  const [tokenName, setTokenName] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [size, setSize] = useState(1); // Grid squares (1 = Medium, 2 = Large, etc.)

  const tokenTypes = [
    { id: 'pc', label: 'Player Character', icon: '🧙', color: '#4a90e2' },
    { id: 'npc', label: 'NPC', icon: '👤', color: '#27ae60' },
    { id: 'monster', label: 'Monster', icon: '👹', color: '#e74c3c' },
    { id: 'enemy', label: 'Enemy', icon: '⚔️', color: '#c0392b' },
    { id: 'ally', label: 'Ally', icon: '🤝', color: '#16a085' },
    { id: 'object', label: 'Object', icon: '📦', color: '#95a5a6' },
    { id: 'hazard', label: 'Hazard', icon: '⚠️', color: '#f39c12' },
    { id: 'marker', label: 'Marker', icon: '📍', color: '#9b59b6' },
  ];

  const sizeOptions = [
    { value: 0.5, label: 'Tiny', gridSquares: '0.5x0.5' },
    { value: 1, label: 'Small/Medium', gridSquares: '1x1' },
    { value: 2, label: 'Large', gridSquares: '2x2' },
    { value: 3, label: 'Huge', gridSquares: '3x3' },
    { value: 4, label: 'Gargantuan', gridSquares: '4x4' },
  ];

  const handleCreate = () => {
    if (!tokenName.trim()) {
      alert('Please enter a token name');
      return;
    }

    const tokenData = {
      name: tokenName.trim(),
      type: selectedType,
      color: selectedColor,
      size,
      hidden: false,
    };

    onCreateToken(tokenData);
    
    // Reset form
    setTokenName('');
    setSelectedType('pc');
    setSelectedColor('#4a90e2');
    setSize(1);
  };

  const handleTypeSelect = (type) => {
    setSelectedType(type.id);
    setSelectedColor(type.color);
  };

  return (
    <div className="token-palette">
      <div className="palette-section">
        <label className="palette-label">Token Name</label>
        <input
          type="text"
          className="token-name-input"
          placeholder="e.g., Goblin Warrior"
          value={tokenName}
          onChange={(e) => setTokenName(e.target.value)}
          disabled={isCreating}
        />
      </div>

      <div className="palette-section">
        <label className="palette-label">Token Type</label>
        <div className="token-type-grid">
          {tokenTypes.map((type) => (
            <button
              key={type.id}
              className={`token-type-button ${selectedType === type.id ? 'selected' : ''}`}
              onClick={() => handleTypeSelect(type)}
              disabled={isCreating}
              title={type.label}
            >
              <span className="token-type-icon">{type.icon}</span>
              <span className="token-type-label">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="palette-section">
        <label className="palette-label">Token Color</label>
        <div className="color-picker-container">
          <button
            className="color-preview-button"
            style={{ backgroundColor: selectedColor }}
            onClick={() => setShowColorPicker(!showColorPicker)}
            disabled={isCreating}
            title="Click to change color"
          >
            {selectedColor}
          </button>
          {showColorPicker && (
            <div className="color-picker-popover">
              <div className="color-picker-backdrop" onClick={() => setShowColorPicker(false)} />
              <HexColorPicker color={selectedColor} onChange={setSelectedColor} />
            </div>
          )}
        </div>
      </div>

      <div className="palette-section">
        <label className="palette-label">Token Size</label>
        <div className="size-selector">
          {sizeOptions.map((option) => (
            <button
              key={option.value}
              className={`size-button ${size === option.value ? 'selected' : ''}`}
              onClick={() => setSize(option.value)}
              disabled={isCreating}
            >
              <div className="size-label">{option.label}</div>
              <div className="size-grid">{option.gridSquares}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="palette-section">
        <button
          className="create-token-button"
          onClick={handleCreate}
          disabled={isCreating || !tokenName.trim()}
        >
          {isCreating ? '⏳ Creating...' : '✨ Create Token'}
        </button>
      </div>

      <div className="palette-help">
        <p>💡 <strong>Tip:</strong> Select a token type, choose a color, and give it a name to create a new token on the map.</p>
      </div>
    </div>
  );
};

export default TokenPalette;
