import React, { useState, useRef, useEffect } from 'react';
import { FiCrosshair, FiEdit2, FiArrowRight, FiMousePointer, FiSettings, FiMinus, FiMaximize2 } from 'react-icons/fi';
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
  rulerSnapToGrid = false,
  rulerPersistent = false,
  onRulerSnapToggle,
  onRulerPersistentToggle,
  onClearPinnedRulers,
  pinnedRulersCount = 0
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
                          checked={rulerSnapToGrid}
                          onChange={() => onRulerSnapToggle?.()}
                        />
                        <span>Snap to Grid</span>
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
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MapToolbar;
