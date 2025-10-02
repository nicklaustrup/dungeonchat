import React from 'react';
import './FogPanel.css';

/**
 * FogPanel
 * DM-only panel for managing fog of war with brush controls
 */
function FogPanel({ 
  open, 
  onClose, 
  fogEnabled,
  onToggleFog,
  onRevealAll, 
  onConcealAll,
  brushSize,
  onBrushSizeChange,
  brushMode,
  onBrushModeChange
}) {
  if (!open) return null;

  return (
    <div className="fog-panel">
      <div className="fog-panel-header">
        <span>Fog of War Controls</span>
        <button onClick={onClose} className="fog-panel-close">×</button>
      </div>
      
      <div className="fog-panel-body">
        {/* Fog Enable/Disable Toggle */}
        <div className="fog-section">
          <label className="fog-row">
            <span>Enable Fog of War</span>
            <input 
              type="checkbox" 
              checked={fogEnabled} 
              onChange={(e) => onToggleFog?.(e.target.checked)}
            />
          </label>
        </div>

        {/* Brush Mode */}
        {fogEnabled && (
          <>
            <div className="fog-section">
              <label className="fog-label">Brush Mode</label>
              <div className="fog-brush-modes">
                <button
                  className={`fog-mode-btn ${brushMode === 'reveal' ? 'active' : ''}`}
                  onClick={() => onBrushModeChange?.('reveal')}
                  title="Reveal fog (make visible)"
                >
                  👁️ Reveal
                </button>
                <button
                  className={`fog-mode-btn ${brushMode === 'conceal' ? 'active' : ''}`}
                  onClick={() => onBrushModeChange?.('conceal')}
                  title="Conceal fog (hide)"
                >
                  🌫️ Conceal
                </button>
              </div>
            </div>

            {/* Brush Size Slider */}
            <div className="fog-section">
              <label className="fog-label">
                Brush Size: {brushSize} cell{brushSize !== 1 ? 's' : ''}
              </label>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={brushSize}
                onChange={(e) => onBrushSizeChange?.(parseInt(e.target.value, 10))}
                className="fog-slider"
              />
            </div>

            {/* Quick Actions */}
            <div className="fog-section">
              <label className="fog-label">Quick Actions</label>
              <div className="fog-actions">
                <button
                  className="fog-action-btn reveal-all"
                  onClick={onRevealAll}
                  title="Reveal entire map"
                >
                  👁️ Reveal All
                </button>
                <button
                  className="fog-action-btn conceal-all"
                  onClick={onConcealAll}
                  title="Conceal entire map"
                >
                  🌫️ Conceal All
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="fog-section fog-instructions">
              <small>
                💡 <strong>Tip:</strong> Click and drag on the map to paint fog with your brush.
              </small>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default FogPanel;
