import React from 'react';
import { Eye, EyeOff, Sun, Cloud } from 'lucide-react';
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
    <div className="toolbar-settings-panel fog-panel">
      <div className="panel-header">
        <label>Fog of War Controls</label>
        <button 
          className="panel-close-btn"
          onClick={onClose}
          aria-label="Close fog controls"
        >
          ×
        </button>
      </div>
      
      {/* Fog Enable/Disable Toggle */}
      <div className="setting-group">
        <label>Fog of War</label>
        <div className="checkbox-group">
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              checked={fogEnabled} 
              onChange={(e) => onToggleFog?.(e.target.checked)}
            />
            <span>Enable Fog of War</span>
          </label>
        </div>
      </div>

      {/* Brush Mode */}
      {fogEnabled && (
        <>
          <div className="setting-divider" />
          <div className="setting-group">
            <label>Brush Mode</label>
            <div className="fog-brush-modes">
              <button
                className={`fog-mode-btn ${brushMode === 'reveal' ? 'active' : ''}`}
                onClick={() => onBrushModeChange?.('reveal')}
                title="Reveal fog (make visible)"
              >
                <Eye size={16} /> Reveal
              </button>
              <button
                className={`fog-mode-btn ${brushMode === 'conceal' ? 'active' : ''}`}
                onClick={() => onBrushModeChange?.('conceal')}
                title="Conceal fog (hide)"
              >
                <Cloud size={16} /> Conceal
              </button>
            </div>
          </div>

          {/* Brush Size Slider */}
          <div className="setting-divider" />
          <div className="setting-group">
            <label>Brush Size: {brushSize} cell{brushSize !== 1 ? 's' : ''}</label>
            <div className="opacity-slider">
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={brushSize}
                onChange={(e) => onBrushSizeChange?.(parseInt(e.target.value, 10))}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="setting-divider" />
          <div className="setting-group">
            <label>Quick Actions</label>
            <div className="fog-actions">
              <button
                className="fog-action-btn reveal-all"
                onClick={onRevealAll}
                title="Reveal entire map"
              >
                <Sun size={16} /> Reveal All
              </button>
              <button
                className="fog-action-btn conceal-all"
                onClick={onConcealAll}
                title="Conceal entire map"
              >
                <EyeOff size={16} /> Conceal All
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="setting-divider" />
          <div className="fog-instructions">
            <small>
              💡 <strong>Tip:</strong> Click and drag on the map to paint fog with your brush.
            </small>
          </div>
        </>
      )}
    </div>
  );
}

export default FogPanel;
