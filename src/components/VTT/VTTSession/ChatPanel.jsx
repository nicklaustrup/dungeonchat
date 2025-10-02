import React, { useState, useRef, useEffect } from 'react';
import { FiX, FiMinus, FiMaximize2 } from 'react-icons/fi';
import ChatPage from '../../../pages/ChatPage';
import './ChatPanel.css';

/**
 * ChatPanel - Floating, resizable, draggable chat window
 * Features:
 * - Can float independently or dock to sidebar
 * - Draggable by header
 * - Resizable from edges
 * - Minimizable
 * - Can stay open alongside other panels
 */
function ChatPanel({ 
  campaignId, 
  isFloating = false, 
  onClose,
  onDock 
}) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 450, y: 100 });
  const [size, setSize] = useState({ width: 400, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const panelRef = useRef(null);

  // Handle dragging
  const handleMouseDown = (e) => {
    if (e.target.closest('.chat-panel-controls')) return;
    
    setIsDragging(true);
    const rect = panelRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
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

  // Mouse move handler
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // Keep panel within viewport
        const maxX = window.innerWidth - (panelRef.current?.offsetWidth || 400);
        const maxY = window.innerHeight - 100;
        
        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      }

      if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        
        const newWidth = Math.max(300, Math.min(800, resizeStart.width + deltaX));
        const newHeight = Math.max(400, Math.min(900, resizeStart.height + deltaY));
        
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, resizeStart]);

  if (!isFloating) {
    // Docked mode - render in sidebar
    return (
      <div className="chat-panel-docked">
        <ChatPage campaignContext={true} showHeader={false} />
      </div>
    );
  }

  return (
    <div 
      ref={panelRef}
      className={`chat-panel-floating ${isMinimized ? 'minimized' : ''} ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isMinimized ? 'auto' : `${size.width}px`,
        height: isMinimized ? 'auto' : `${size.height}px`
      }}
    >
      <div className="chat-panel-header" onMouseDown={handleMouseDown}>
        <div className="chat-panel-title">#general</div>
        <div className="chat-panel-controls">
          <button
            className="chat-control-btn"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? <FiMaximize2 size={14} /> : <FiMinus size={14} />}
          </button>
          <button
            className="chat-control-btn"
            onClick={onDock}
            title="Dock to sidebar"
          >
            <span>📌</span>
          </button>
          <button
            className="chat-control-btn close-btn"
            onClick={onClose}
            title="Close"
          >
            <FiX size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="chat-panel-content">
            <ChatPage campaignContext={true} showHeader={false} />
          </div>
          
          <div 
            className="chat-panel-resize-handle"
            onMouseDown={handleResizeStart}
            title="Drag to resize"
          />
        </>
      )}
    </div>
  );
}

export default ChatPanel;
