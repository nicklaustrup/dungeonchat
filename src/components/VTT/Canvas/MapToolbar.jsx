import React, { useState, useRef, useEffect } from 'react';
import { 
  FiCrosshair, 
  FiEdit2, 
  FiArrowRight, 
  FiMousePointer, 
  FiSettings, 
  FiMinus, 
  FiMaximize2,
  FiCircle,
  FiSquare,
  FiTriangle,
  FiGrid
} from 'react-icons/fi';
import './MapToolbar.css';

/**
 * MapToolbar - Enhanced tool selection for map interactions
 * Features:
 * - Draggable toolbar
 * - Collapsible/minimizable
 * - Color customization for pings and pens
 * - Multiple tools: Pointer, Ping, Pen, Arrow
 */
const MapToolbar = ({ 
  activeTool, 
  onToolChange, 
  isDM,
  pingColor = '#ffff00',
  penColor = '#ffffff',
  onPingColorChange,
  onPenColorChange,
  snapToGrid = false,
  rulerPersistent = false,
  onRulerSnapToggle,
  onRulerPersistentToggle,
  onClearPinnedRulers,
  pinnedRulersCount = 0,
  tokenSnap = true,
  onTokenSnapToggle,
  // Shape tool props
  shapeColor = '#ff0000',
  shapeOpacity = 0.5,
  shapePersistent = false,
  shapeVisibility = 'all', // 'dm' | 'all'
  onShapeColorChange,
  onShapeOpacityChange,
  onShapePersistentToggle,
  onShapeVisibilityChange,
  onClearTempShapes,
  onClearAllShapes,
  onOpenGridConfig
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const toolbarRef = useRef(null);

  const tools = [
    { id: 'pointer', icon: FiMousePointer, label: 'Pointer', description: 'Select mode (no drawing)' },
    { id: 'ping', icon: FiCrosshair, label: 'Ping', description: 'Alt+Click to ping' },
    { id: 'pen', icon: FiEdit2, label: 'Pen', description: 'Draw temporary marks' },
    { id: 'arrow', icon: FiArrowRight, label: 'Arrow', description: 'Point to locations' },
  ];
  
  // Add ruler tool for DM
  if (isDM) {
    tools.push({ id: 'ruler', icon: FiCrosshair, label: 'Ruler', description: 'Measure distance in grid squares' });
    // Shape tools
    tools.push({ id: 'circle', icon: FiCircle, label: 'Circle', description: 'Draw circle (AOE radius)' });
    tools.push({ id: 'rectangle', icon: FiSquare, label: 'Rectangle', description: 'Draw rectangle area' });
    tools.push({ id: 'cone', icon: FiTriangle, label: 'Cone', description: 'Draw cone (breath / spell)' });
    tools.push({ id: 'line', icon: FiMinus, label: 'Line', description: 'Draw line / wall' });
  }

  // Handle dragging
  const handleMouseDown = (e) => {
    if (e.target.closest('.toolbar-button') || e.target.closest('.color-picker-container')) return;
    
    setIsDragging(true);
    // Calculate offset from mouse position to toolbar position (not rect)
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  useEffect(() => {
    let animationFrameId = null;
    
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      // Use requestAnimationFrame for smooth 60fps updates
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      
      animationFrameId = requestAnimationFrame(() => {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // Get actual toolbar dimensions
        const toolbarWidth = toolbarRef.current?.offsetWidth || 200;
        const toolbarHeight = toolbarRef.current?.offsetHeight || 400;
        
        // Keep toolbar fully within viewport
        const maxX = window.innerWidth - toolbarWidth;
        const maxY = window.innerHeight - toolbarHeight;
        
        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      });
    };

    const handleMouseUp = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  return (
    <div 
      ref={toolbarRef}
      className={`map-toolbar ${isMinimized ? 'minimized' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
    >
      <div className="toolbar-header" onMouseDown={handleMouseDown}>
        <div className="toolbar-title">Map Tools</div>
        <div className="toolbar-controls">
          <button
            className="toolbar-control-btn"
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
          >
            <FiSettings size={14} />
          </button>
          <button
            className="toolbar-control-btn"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? <FiMaximize2 size={14} /> : <FiMinus size={14} />}
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="toolbar-buttons">
            {tools.map(tool => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  className={`toolbar-button ${activeTool === tool.id ? 'active' : ''}`}
                  onClick={() => onToolChange(tool.id)}
                  title={tool.description}
                >
                  <Icon size={20} />
                  <span className="toolbar-label">{tool.label}</span>
                </button>
              );
            })}
          </div>
          {isDM && (
            <div className="toolbar-extra-row">
              <button
                className="toolbar-button"
                onClick={() => onOpenGridConfig?.()}
                title="Grid Settings"
              >
                <FiGrid size={20} />
                <span className="toolbar-label">Grid</span>
              </button>
            </div>
          )}

          {showSettings && (
            <div className="toolbar-settings">
              <div className="setting-group">
                <label>Ping Color</label>
                <div className="color-picker-container">
                  <input
                    type="color"
                    value={pingColor}
                    onChange={(e) => onPingColorChange?.(e.target.value)}
                    className="color-picker"
                  />
                  <span className="color-value">{pingColor}</span>
                </div>
              </div>
              <div className="setting-group">
                <label>Pen Color</label>
                <div className="color-picker-container">
                  <input
                    type="color"
                    value={penColor}
                    onChange={(e) => onPenColorChange?.(e.target.value)}
                    className="color-picker"
                  />
                  <span className="color-value">{penColor}</span>
                </div>
              </div>
              
              {isDM && (
                <>
                  <div className="setting-divider" />
                  <div className="setting-group">
                    <label>Ruler Settings (Press R)</label>
                    <div className="checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={snapToGrid}
                          onChange={() => onRulerSnapToggle?.()}
                        />
                        <span>Snap to Grid (All Tools)</span>
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={tokenSnap}
                          onChange={() => onTokenSnapToggle?.()}
                        />
                        <span>Token Snap</span>
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={rulerPersistent}
                          onChange={() => onRulerPersistentToggle?.()}
                        />
                        <span>Pin Measurements (📌)</span>
                      </label>
                    </div>
                    {pinnedRulersCount > 0 && (
                      <button
                        className="clear-rulers-btn"
                        onClick={() => onClearPinnedRulers?.()}
                        title="Clear all pinned measurements"
                      >
                        Clear {pinnedRulersCount} Pinned Ruler{pinnedRulersCount !== 1 ? 's' : ''}
                      </button>
                    )}
                  </div>
                </>
              )}

              {isDM && (
                <>
                  <div className="setting-divider" />
                  <div className="setting-group">
                    <label>Shape Settings</label>
                    <div className="color-picker-row">
                      <div className="color-picker-container">
                        <input
                          type="color"
                          value={shapeColor}
                          onChange={(e) => onShapeColorChange?.(e.target.value)}
                          className="color-picker"
                        />
                        <span className="color-value">{shapeColor}</span>
                      </div>
                      <div className="opacity-slider">
                        <input
                          type="range"
                          min={0.1}
                          max={1}
                          step={0.05}
                          value={shapeOpacity}
                          onChange={(e) => onShapeOpacityChange?.(parseFloat(e.target.value))}
                        />
                        <span>{Math.round(shapeOpacity * 100)}% opacity</span>
                      </div>
                    </div>
                    <div className="checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={shapePersistent}
                          onChange={() => onShapePersistentToggle?.()}
                        />
                        <span>Persistent (no auto-expire)</span>
                      </label>
                    </div>
                    <div className="visibility-select">
                      <label>
                        Visibility:
                        <select
                          value={shapeVisibility}
                          onChange={(e) => onShapeVisibilityChange?.(e.target.value)}
                        >
                          <option value="all">All Players</option>
                          <option value="dm">DM Only</option>
                        </select>
                      </label>
                    </div>
                    <div className="shape-actions">
                      <button
                        className="clear-rulers-btn"
                        onClick={() => onClearTempShapes?.()}
                        title="Clear temporary shapes"
                      >
                        Clear Temp Shapes
                      </button>
                      <button
                        className="clear-rulers-btn danger"
                        onClick={() => onClearAllShapes?.()}
                        title="Clear all shapes"
                      >
                        Clear All Shapes
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MapToolbar;
