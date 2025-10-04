import React from 'react';
import { Slash, PaintBucket, Eraser } from 'lucide-react';
import './BoundaryPanel.css';

/**
 * BoundaryPanel
 * DM-only panel for managing movement boundaries
 * Supports both line boundaries (walls) and painted boundaries (out of bounds areas)
 */
function BoundaryPanel({ 
  open, 
  onClose, 
  boundariesEnabled,
  onToggleBoundaries,
  boundariesVisible,
  onToggleVisibility,
  boundaryMode, // 'line' or 'paint'
  onBoundaryModeChange,
  snapToGrid,
  onSnapToGridToggle,
  brushSize,
  onBrushSizeChange,
  brushMode, // 'paint' or 'erase'
  onBrushModeChange,
  lineColor,
  onLineColorChange,
  gridColor,
  onGridColorChange,
  boundaryOpacity,
  onBoundaryOpacityChange,
  onClearAll
}) {
  if (!open) return null;

  return (
    <div className="toolbar-settings-panel boundary-panel">
      <div className="panel-header">
        <label>Boundary Controls</label>
        <button 
          className="panel-close-btn"
          onClick={onClose}
          aria-label="Close boundary controls"
        >
          ×
        </button>
      </div>
      
      {/* Enable/Disable Toggle */}
      <div className="setting-group">
        <label>Boundaries</label>
        <div className="checkbox-group">
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              checked={boundariesEnabled} 
              onChange={(e) => onToggleBoundaries?.(e.target.checked)}
            />
            <span>Enable Boundaries</span>
          </label>
        </div>
      </div>

      {boundariesEnabled && (
        <>
          {/* Visibility Toggle */}
          <div className="setting-divider" />
          <div className="setting-group">
            <label>Visibility (DM Only)</label>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={boundariesVisible} 
                  onChange={(e) => onToggleVisibility?.(e.target.checked)}
                />
                <span>Show Boundaries</span>
              </label>
            </div>
          </div>

          {/* Mode Selection */}
          <div className="setting-divider" />
          <div className="setting-group">
            <label>Drawing Mode</label>
            <div className="boundary-mode-buttons">
              <button
                className={`boundary-mode-btn ${boundaryMode === 'line' ? 'active' : ''}`}
                onClick={() => onBoundaryModeChange?.('line')}
                title="Draw line boundaries (walls, cliffs)"
              >
                <Slash size={16} /> Line
              </button>
              <button
                className={`boundary-mode-btn ${boundaryMode === 'paint' ? 'active' : ''}`}
                onClick={() => onBoundaryModeChange?.('paint')}
                title="Paint out of bounds areas"
              >
                <PaintBucket size={16} /> Paint
              </button>
            </div>
          </div>

          {/* Line Mode Options */}
          {boundaryMode === 'line' && (
            <>
              <div className="setting-divider" />
              <div className="setting-group">
                <label>Line Options</label>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={snapToGrid} 
                      onChange={(e) => onSnapToGridToggle?.(e.target.checked)}
                    />
                    <span>Snap to Grid</span>
                  </label>
                </div>
                <small className="setting-hint">
                  💡 Click and drag to draw boundary lines
                </small>
              </div>
              
              {/* Line Color */}
              <div className="setting-divider" />
              <div className="setting-group">
                <label>Line Color</label>
                <div className="color-picker-group">
                  <input
                    type="color"
                    value={lineColor}
                    onChange={(e) => onLineColorChange?.(e.target.value)}
                    className="color-input"
                  />
                  <span className="color-value">{lineColor}</span>
                </div>
              </div>
            </>
          )}

          {/* Boundary Opacity */}
          <div className="setting-divider" />
          <div className="setting-group">
            <label>Boundary Opacity: {Math.round(boundaryOpacity * 100)}%</label>
            <div className="opacity-slider">
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={Math.round(boundaryOpacity * 100)}
                onChange={(e) => onBoundaryOpacityChange?.(parseInt(e.target.value, 10) / 100)}
              />
            </div>
          </div>

          {/* Paint Mode Options */}
          {boundaryMode === 'paint' && (
            <>
              <div className="setting-divider" />
              <div className="setting-group">
                <label>Paint Mode</label>
                <div className="boundary-brush-modes">
                  <button
                    className={`boundary-brush-btn ${brushMode === 'paint' ? 'active' : ''}`}
                    onClick={() => onBrushModeChange?.('paint')}
                    title="Paint out of bounds areas"
                  >
                    <PaintBucket size={16} /> Paint
                  </button>
                  <button
                    className={`boundary-brush-btn ${brushMode === 'erase' ? 'active' : ''}`}
                    onClick={() => onBrushModeChange?.('erase')}
                    title="Erase painted boundaries"
                  >
                    <Eraser size={16} /> Erase
                  </button>
                </div>
              </div>

              {/* Painted Grid Color */}
              <div className="setting-divider" />
              <div className="setting-group">
                <label>Painted Area Color</label>
                <div className="color-picker-group">
                  <input
                    type="color"
                    value={gridColor}
                    onChange={(e) => onGridColorChange?.(e.target.value)}
                    className="color-input"
                  />
                  <span className="color-value">{gridColor}</span>
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
                <small className="setting-hint">
                  💡 Click and drag to paint boundary areas
                </small>
              </div>
            </>
          )}

          {/* Clear All Action */}
          <div className="setting-divider" />
          <div className="setting-group">
            <label>Actions</label>
            <button
              className="boundary-clear-btn"
              onClick={onClearAll}
              title="Remove all boundaries on this map"
            >
              Clear All Boundaries
            </button>
          </div>

          {/* Instructions */}
          <div className="setting-divider" />
          <div className="boundary-instructions">
            <small>
              <strong>Boundaries prevent token movement:</strong>
              <br />• <strong>Line Mode:</strong> Draw walls, cliffs, barriers
              <br />• <strong>Paint Mode:</strong> Mark entire areas as impassable
              <br />• Only visible to DMs, invisible to players
            </small>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="setting-divider" />
          <div className="boundary-instructions">
            <small>
              <strong>⌨️ Keyboard Shortcuts:</strong>
              <br />• <kbd>B</kbd> - Toggle Boundary Panel
              <br />• <kbd>L</kbd> - Switch to Line Mode
              <br />• <kbd>P</kbd> - Switch to Paint Mode
            </small>
          </div>
        </>
      )}
    </div>
  );
}

export default BoundaryPanel;
