import React from 'react';
import { HexColorPicker } from 'react-colorful';
import './GridConfigurator.css';

/**
 * GridConfigurator Component
 * Panel for adjusting grid settings
 */
function GridConfigurator({ 
  gridSize, 
  gridColor, 
  gridOpacity, 
  gridEnabled,
  onGridSizeChange,
  onGridColorChange,
  onGridOpacityChange,
  onGridEnabledChange,
  disabled = false
}) {
  const [showColorPicker, setShowColorPicker] = React.useState(false);

  return (
    <div className={`grid-configurator ${disabled ? 'disabled' : ''}`}>
      <h3 className="configurator-title">Grid Settings</h3>
      
      {/* Grid Enable/Disable */}
      <div className="config-group">
        <label className="config-label">
          <input
            type="checkbox"
            checked={gridEnabled}
            onChange={(e) => onGridEnabledChange(e.target.checked)}
            disabled={disabled}
          />
          <span>Enable Grid</span>
        </label>
      </div>

      {/* Grid Size */}
      <div className="config-group">
        <label className="config-label">
          Grid Size: <span className="value">{gridSize}px</span>
        </label>
        <input
          type="range"
          min="25"
          max="100"
          step="5"
          value={gridSize}
          onChange={(e) => onGridSizeChange(Number(e.target.value))}
          disabled={disabled || !gridEnabled}
          className="slider"
        />
        <div className="range-labels">
          <span>25px</span>
          <span>100px</span>
        </div>
      </div>

      {/* Grid Opacity */}
      <div className="config-group">
        <label className="config-label">
          Grid Opacity: <span className="value">{Math.round(gridOpacity * 100)}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={gridOpacity}
          onChange={(e) => onGridOpacityChange(Number(e.target.value))}
          disabled={disabled || !gridEnabled}
          className="slider"
        />
        <div className="range-labels">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Grid Color */}
      <div className="config-group">
        <label className="config-label">Grid Color</label>
        <div className="color-picker-wrapper">
          <button
            className="color-preview"
            style={{ backgroundColor: gridColor }}
            onClick={() => setShowColorPicker(!showColorPicker)}
            disabled={disabled || !gridEnabled}
            title="Click to change color"
          />
          <span className="color-value">{gridColor}</span>
        </div>
        
        {showColorPicker && gridEnabled && !disabled && (
          <div className="color-picker-popover">
            <div 
              className="color-picker-backdrop" 
              onClick={() => setShowColorPicker(false)}
            />
            <HexColorPicker 
              color={gridColor} 
              onChange={onGridColorChange}
            />
          </div>
        )}
      </div>

      {/* Preset Buttons */}
      <div className="config-group">
        <label className="config-label">Quick Presets</label>
        <div className="preset-buttons">
          <button
            className="preset-button"
            onClick={() => {
              onGridSizeChange(50);
              onGridColorChange('#000000');
              onGridOpacityChange(0.3);
            }}
            disabled={disabled || !gridEnabled}
          >
            Default
          </button>
          <button
            className="preset-button"
            onClick={() => {
              onGridSizeChange(50);
              onGridColorChange('#ffffff');
              onGridOpacityChange(0.5);
            }}
            disabled={disabled || !gridEnabled}
          >
            Light
          </button>
          <button
            className="preset-button"
            onClick={() => {
              onGridSizeChange(50);
              onGridColorChange('#ff0000');
              onGridOpacityChange(0.4);
            }}
            disabled={disabled || !gridEnabled}
          >
            Red
          </button>
        </div>
      </div>
    </div>
  );
}

export default GridConfigurator;
