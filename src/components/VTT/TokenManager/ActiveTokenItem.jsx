import React from 'react';
import './ActiveTokensTab.css';

/**
 * ActiveTokenItem - Individual token entry in the Active Tokens list
 * Displays token info with Focus and Edit actions
 */
const ActiveTokenItem = ({ token, onFocus, onEdit }) => {
  const tokenTypeIcons = {
    pc: '🧙',
    npc: '👤',
    monster: '👹',
    enemy: '⚔️',
    ally: '🤝',
    object: '📦',
    hazard: '⚠️',
    marker: '📍',
  };

  const icon = tokenTypeIcons[token.type] || '⭕';
  const hasImage = !!token.imageUrl;

  return (
    <div className="active-item">
      <div className="item-visual">
        {hasImage ? (
          <div className="item-image-preview">
            <img src={token.imageUrl} alt={token.name} />
          </div>
        ) : (
          <div
            className="item-color-indicator"
            style={{ backgroundColor: token.color || 'var(--player-token-default)' }}
          >
            <span className="item-icon">{icon}</span>
          </div>
        )}
      </div>

      <div className="item-info">
        <div className="item-name">{token.name || 'Unnamed Token'}</div>
        <div className="item-type-badge token-type">{token.type}</div>
      </div>

      <div className="item-actions">
        <button
          className="action-button focus-button"
          onClick={() => onFocus(token)}
          title="Center camera on this token"
        >
          🎯
        </button>
        <button
          className="action-button edit-button"
          onClick={() => onEdit(token)}
          title="Edit token properties"
        >
          ✏️
        </button>
      </div>
    </div>
  );
};

export default ActiveTokenItem;
