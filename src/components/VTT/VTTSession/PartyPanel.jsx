import React, { useState, useRef, useEffect } from 'react';
import { FiX, FiMinus, FiMaximize2 } from 'react-icons/fi';
import PartyManagement from '../../Session/PartyManagement';
import './PartyPanel.css';

/**
 * PartyPanel - Floating, resizable, draggable party management window
 * Features:
 * - Can float independently or dock to sidebar
 * - Draggable by header
 * - Resizable from edges
 * - Minimizable
 * - Can stay open alongside other panels
 */
function PartyPanel({ 
  campaignId, 
  isFloating = false, 
  onClose,
  onDock 
}) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 500, y: 150 });
  const [size, setSize] = useState({ width: 450, height: 650 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const panelRef = useRef(null);

  // Handle dragging
  const handleMouseDown = (e) => {
    if (e.target.closest('.party-panel-controls')) return;
    
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  // Handle resize start
  const handleResizeStart = (e) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    });
  };

  // Drag and resize effects
  useEffect(() => {
    let animationFrameId = null;

    const handleMouseMove = (e) => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = requestAnimationFrame(() => {
        if (isDragging) {
          const newX = e.clientX - dragOffset.x;
          const newY = e.clientY - dragOffset.y;
          
          // Get panel dimensions
          const panelWidth = panelRef.current?.offsetWidth || size.width;
          const panelHeight = panelRef.current?.offsetHeight || size.height;
          
          // Keep within viewport
          const maxX = window.innerWidth - panelWidth;
          const maxY = window.innerHeight - panelHeight;
          
          setPosition({
            x: Math.max(0, Math.min(newX, maxX)),
            y: Math.max(0, Math.min(newY, maxY))
          });
        } else if (isResizing) {
          const deltaX = e.clientX - resizeStart.x;
          const deltaY = e.clientY - resizeStart.y;
          
          const newWidth = Math.max(350, Math.min(900, resizeStart.width + deltaX));
          const newHeight = Math.max(400, Math.min(900, resizeStart.height + deltaY));
          
          setSize({ width: newWidth, height: newHeight });
        }
      });
    };

    const handleMouseUp = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
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
  }, [isDragging, isResizing, dragOffset, resizeStart, position, size]);

  if (!isFloating) {
    // Docked mode - render inside sidebar
    return (
      <div className="party-panel-docked">
        <PartyManagement campaignId={campaignId} />
      </div>
    );
  }

  // Floating mode
  return (
    <div
      ref={panelRef}
      className={`party-panel-floating ${isMinimized ? 'minimized' : ''} ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isMinimized ? 'auto' : `${size.width}px`,
        height: isMinimized ? 'auto' : `${size.height}px`
      }}
    >
      <div className="party-panel-header" onMouseDown={handleMouseDown}>
        <h3>🎭 Party Management</h3>
        <div className="party-panel-controls">
          <button
            className="party-control-btn"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <FiMaximize2 /> : <FiMinus />}
          </button>
          {onDock && (
            <button
              className="party-control-btn"
              onClick={onDock}
              title="Dock to sidebar"
            >
              📌
            </button>
          )}
          <button
            className="party-control-btn close-btn"
            onClick={onClose}
            title="Close"
          >
            <FiX />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="party-panel-content">
            <PartyManagement campaignId={campaignId} />
          </div>
          <div
            className="party-panel-resize-handle"
            onMouseDown={handleResizeStart}
          />
        </>
      )}
    </div>
  );
}

export default PartyPanel;
