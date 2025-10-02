import React, { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import './TokenPalette.css';

/**
 * TokenPalette - UI for selecting token type, color, and creating tokens
 * Provides quick access to common token types (PC, NPC, Monster, etc.)
 */
const TokenPalette = ({ selectedToken, onCreateToken, onUpdateToken, isCreating }) => {
  const [selectedType, setSelectedType] = useState('pc');
  const [selectedColor, setSelectedColor] = useState('#4a90e2');
  const [tokenName, setTokenName] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [size, setSize] = useState(1); // Grid squares (1 = Medium, 2 = Large, etc.)
  const [hasChanges, setHasChanges] = useState(false);
  const [showCharacterSheet, setShowCharacterSheet] = useState(false);
  const [showInventory, setShowInventory] = useState(false);

  // Populate form when token is selected
  React.useEffect(() => {
    if (selectedToken) {
      setTokenName(selectedToken.name || '');
      setSelectedType(selectedToken.type || 'pc');
      setSelectedColor(selectedToken.color || '#4a90e2');
      setSize(selectedToken.size?.width ? selectedToken.size.width / 50 : 1);
      setHasChanges(false);
    }
  }, [selectedToken]);

  // Track changes when editing
  React.useEffect(() => {
    if (selectedToken) {
      const currentSize = selectedToken.size?.width ? selectedToken.size.width / 50 : 1;
      const changed = 
        tokenName !== selectedToken.name ||
        selectedColor !== selectedToken.color ||
        size !== currentSize ||
        selectedType !== selectedToken.type;
      setHasChanges(changed);
    }
  }, [tokenName, selectedColor, size, selectedType, selectedToken]);

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

  const handleSaveOrCreate = () => {
    if (!tokenName.trim()) {
      alert('Please enter a token name');
      return;
    }

    if (selectedToken) {
      // Update existing token
      const pixelSize = size * 50;
      const updates = {
        name: tokenName.trim(),
        type: selectedType,
        color: selectedColor,
        size: { width: pixelSize, height: pixelSize },
        updatedAt: new Date(),
      };
      const tokenId = selectedToken.id || selectedToken.tokenId;
      onUpdateToken(tokenId, updates);
      setHasChanges(false);
    } else {
      // Create new token
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
    }
  };

  const handleTypeSelect = (type) => {
    setSelectedType(type.id);
    setSelectedColor(type.color);
  };

  return (
    <div className="token-palette">
      {selectedToken && (
        <div className="palette-section token-info-header">
          <div className="editing-indicator">✏️ Editing Token</div>
          {selectedToken.imageUrl && (
            <div className="token-preview-mini">
              <img src={selectedToken.imageUrl} alt={selectedToken.name} />
            </div>
          )}
        </div>
      )}

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
          onClick={handleSaveOrCreate}
          disabled={isCreating || !tokenName.trim() || (selectedToken && !hasChanges)}
        >
          {isCreating ? '⏳ Saving...' : selectedToken ? '💾 Save Changes' : '✨ Create Token'}
        </button>
      </div>

      {selectedToken && (
        <div className="palette-section">
          <div className="token-actions-grid">
            <button
              className="token-action-button"
              onClick={() => setShowCharacterSheet(!showCharacterSheet)}
              title="View/Edit Character Sheet (DM can modify attributes)"
            >
              📋 Character Sheet
            </button>
            <button
              className="token-action-button"
              onClick={() => setShowInventory(!showInventory)}
              title="View/Edit Inventory"
            >
              🎒 Inventory
            </button>
          </div>
          {showCharacterSheet && (
            <div className="feature-placeholder">
              <p>📋 Character Sheet editor coming soon!</p>
              <p><small>DMs will be able to modify attributes on the fly during games.</small></p>
            </div>
          )}
          {showInventory && (
            <div className="feature-placeholder">
              <p>🎒 Inventory manager coming soon!</p>
              <p><small>Track items, equipment, and loot.</small></p>
            </div>
          )}
        </div>
      )}

      {!selectedToken && (
        <div className="palette-help">
          <p>💡 <strong>Tip:</strong> Select a token type, choose a color, and give it a name to create a new token on the map.</p>
        </div>
      )}
    </div>
  );
};

export default TokenPalette;
