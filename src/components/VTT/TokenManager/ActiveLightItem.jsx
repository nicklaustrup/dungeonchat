import React from 'react';
import './ActiveTokensTab.css';

/**
 * ActiveLightItem - Individual light entry in the Active Tokens list
 * Displays light info with Focus and Edit actions
 */
const ActiveLightItem = ({ light, onFocus, onEdit }) => {
  const lightTypeLabels = {
    torch: 'Torch',
    lantern: 'Lantern',
    candle: 'Candle',
    'light-spell': 'Light Spell',
    'magical-blue': 'Magical Blue',
    'magical-purple': 'Magical Purple',
    custom: 'Custom',
  };

  const displayName = light.name || lightTypeLabels[light.type] || 'Light';
  const lightColor = light.color || '#ffaa00';

  return (
    <div className="active-item">
      <div className="item-visual">
        <div
          className="item-light-indicator"
          style={{
            backgroundColor: lightColor,
            boxShadow: `0 0 12px ${lightColor}`,
          }}
        >
          <span className="item-icon">💡</span>
        </div>
      </div>

      <div className="item-info">
        <div className="item-name">{displayName}</div>
        <div className="item-type-badge light-type">{light.type}</div>
      </div>

      <div className="item-actions">
        <button
          className="action-button focus-button"
          onClick={() => onFocus(light)}
          title="Center camera on this light"
        >
          🎯
        </button>
        <button
          className="action-button edit-button"
          onClick={() => onEdit(light)}
          title="Edit light properties"
        >
          ✏️
        </button>
      </div>
    </div>
  );
};

export default ActiveLightItem;
