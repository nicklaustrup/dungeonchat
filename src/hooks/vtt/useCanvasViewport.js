import { useState, useCallback, useRef } from 'react';

/**
 * useCanvasViewport - Custom hook for managing canvas pan and zoom
 * 
 * Manages:
 * - Stage position (x, y)
 * - Stage scale (zoom level)
 * - Dragging state
 * - Pan and zoom interactions
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.minScale - Minimum zoom scale (default: 0.2)
 * @param {number} options.maxScale - Maximum zoom scale (default: 5)
 * @param {number} options.scaleBy - Zoom speed multiplier (default: 1.05)
 * @returns {Object} Viewport state and control methods
 */
export function useCanvasViewport({
  minScale = 0.2,
  maxScale = 5,
  scaleBy = 1.05
} = {}) {
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  
  // Store drag start position to calculate delta
  const dragStartPosRef = useRef(null);
  
  /**
   * Handle mouse wheel for zooming
   * Zooms toward the mouse cursor position
   */
  const handleWheel = useCallback((e) => {
    e.evt.preventDefault();
    
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    
    // Calculate new scale
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = direction > 0 
      ? Math.min(oldScale * scaleBy, maxScale)
      : Math.max(oldScale / scaleBy, minScale);
    
    setStageScale(newScale);
    
    // Calculate new position to zoom toward cursor
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    
    setStagePos(newPos);
  }, [scaleBy, minScale, maxScale]);
  
  /**
   * Handle drag start
   */
  const handleDragStart = useCallback((e) => {
    // Only allow dragging the stage itself, not individual elements
    if (e.target === e.target.getStage()) {
      setIsDragging(true);
      dragStartPosRef.current = { x: e.evt.clientX, y: e.evt.clientY };
    }
  }, []);
  
  /**
   * Handle drag move
   */
  const handleDragMove = useCallback((e) => {
    if (isDragging && dragStartPosRef.current) {
      const dx = e.evt.clientX - dragStartPosRef.current.x;
      const dy = e.evt.clientY - dragStartPosRef.current.y;
      
      setStagePos(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
      
      dragStartPosRef.current = { x: e.evt.clientX, y: e.evt.clientY };
    }
  }, [isDragging]);
  
  /**
   * Handle drag end
   */
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    dragStartPosRef.current = null;
  }, []);
  
  /**
   * Reset viewport to default position and scale
   */
  const resetViewport = useCallback(() => {
    setStagePos({ x: 0, y: 0 });
    setStageScale(1);
    setIsDragging(false);
  }, []);
  
  /**
   * Center viewport on a specific point
   */
  const centerOnPoint = useCallback((x, y, canvasWidth, canvasHeight) => {
    const newPos = {
      x: canvasWidth / 2 - x * stageScale,
      y: canvasHeight / 2 - y * stageScale
    };
    setStagePos(newPos);
  }, [stageScale]);
  
  /**
   * Set scale directly (with clamping)
   */
  const setScale = useCallback((scale) => {
    const clampedScale = Math.max(minScale, Math.min(maxScale, scale));
    setStageScale(clampedScale);
  }, [minScale, maxScale]);
  
  /**
   * Zoom in by a fixed amount
   */
  const zoomIn = useCallback(() => {
    setStageScale(prev => Math.min(prev * scaleBy, maxScale));
  }, [scaleBy, maxScale]);
  
  /**
   * Zoom out by a fixed amount
   */
  const zoomOut = useCallback(() => {
    setStageScale(prev => Math.max(prev / scaleBy, minScale));
  }, [scaleBy, minScale]);
  
  /**
   * Convert screen coordinates to canvas coordinates
   */
  const screenToCanvas = useCallback((screenX, screenY) => {
    return {
      x: (screenX - stagePos.x) / stageScale,
      y: (screenY - stagePos.y) / stageScale
    };
  }, [stagePos, stageScale]);
  
  /**
   * Convert canvas coordinates to screen coordinates
   */
  const canvasToScreen = useCallback((canvasX, canvasY) => {
    return {
      x: canvasX * stageScale + stagePos.x,
      y: canvasY * stageScale + stagePos.y
    };
  }, [stagePos, stageScale]);
  
  /**
   * Get viewport bounds in canvas coordinates
   */
  const getViewportBounds = useCallback((canvasWidth, canvasHeight) => {
    const topLeft = screenToCanvas(0, 0);
    const bottomRight = screenToCanvas(canvasWidth, canvasHeight);
    
    return {
      left: topLeft.x,
      top: topLeft.y,
      right: bottomRight.x,
      bottom: bottomRight.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y
    };
  }, [screenToCanvas]);
  
  return {
    // State
    stagePos,
    stageScale,
    isDragging,
    
    // Event handlers
    handleWheel,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    
    // Control methods
    resetViewport,
    centerOnPoint,
    setScale,
    zoomIn,
    zoomOut,
    
    // Coordinate conversion
    screenToCanvas,
    canvasToScreen,
    getViewportBounds,
    
    // Direct setters (for external control)
    setStagePos,
    setStageScale,
    setIsDragging
  };
}

export default useCanvasViewport;
