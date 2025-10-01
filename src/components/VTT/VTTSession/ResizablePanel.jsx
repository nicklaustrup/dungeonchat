/**
 * ResizablePanel Component
 * Draggable and resizable floating panel for VTT components
 */
import React, { useState, useRef, useEffect } from 'react';
import { FiX, FiMinimize2, FiMaximize2, FiMove } from 'react-icons/fi';
import './ResizablePanel.css';

function ResizablePanel({ 
  title, 
  children, 
  onClose, 
  defaultWidth = 400,
  defaultHeight = 500,
  defaultPosition = { x: 100, y: 100 },
  minWidth = 300,
  minHeight = 200,
  zIndex = 1000
}) {
  const [position, setPosition] = useState(defaultPosition);
  const [size, setSize] = useState({ width: defaultWidth, height: defaultHeight });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  const panelRef = useRef(null);

  // Handle drag start
  const handleDragStart = (e) => {
    if (e.target.classList.contains('panel-header') || e.target.closest('.panel-title')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
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

  // Handle mouse move
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        
        setSize({
          width: Math.max(minWidth, resizeStart.width + deltaX),
          height: Math.max(minHeight, resizeStart.height + deltaY)
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragOffset, resizeStart, minWidth, minHeight]);

  // Prevent panel from going off-screen
  useEffect(() => {
    const maxX = window.innerWidth - size.width;
    const maxY = window.innerHeight - (isMinimized ? 50 : size.height);
    
    if (position.x < 0) setPosition(prev => ({ ...prev, x: 0 }));
    if (position.y < 0) setPosition(prev => ({ ...prev, y: 0 }));
    if (position.x > maxX) setPosition(prev => ({ ...prev, x: Math.max(0, maxX) }));
    if (position.y > maxY) setPosition(prev => ({ ...prev, y: Math.max(0, maxY) }));
  }, [position, size, isMinimized]);

  return (
    <div
      ref={panelRef}
      className={`resizable-panel ${isMinimized ? 'minimized' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: isMinimized ? 'auto' : `${size.height}px`,
        zIndex
      }}
    >
      {/* Header */}
      <div 
        className="panel-header"
        onMouseDown={handleDragStart}
      >
        <div className="panel-title">
          <FiMove className="drag-icon" />
          <span>{title}</span>
        </div>
        <div className="panel-controls">
          <button
            className="panel-btn"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Maximize' : 'Minimize'}
          >
            {isMinimized ? <FiMaximize2 /> : <FiMinimize2 />}
          </button>
          <button
            className="panel-btn close-btn"
            onClick={onClose}
            title="Close"
          >
            <FiX />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <>
          <div className="panel-content">
            {children}
          </div>

          {/* Resize Handle */}
          <div
            className="resize-handle"
            onMouseDown={handleResizeStart}
            title="Drag to resize"
          />
        </>
      )}
    </div>
  );
}

export default ResizablePanel;
