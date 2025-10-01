import { useState, useCallback } from 'react';

/**
 * useDrawingState - Custom hook for managing drawing state on the VTT canvas
 * 
 * Manages:
 * - Pen/arrow drawings (temporary marks)
 * - Shape objects (circles, rectangles, cones, lines)
 * - Drawing state (active drawing in progress)
 * 
 * @returns {Object} Drawing state and manipulation methods
 */
export function useDrawingState() {
  // Pen/arrow drawing state
  const [drawings, setDrawings] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState([]);
  const [arrowStart, setArrowStart] = useState(null);
  
  // Shape drawing state
  const [shapes, setShapes] = useState([]);
  const [shapeStart, setShapeStart] = useState(null);
  const [shapePreview, setShapePreview] = useState(null);
  
  /**
   * Start a new pen/arrow drawing
   */
  const startDrawing = useCallback((point, type = 'pen') => {
    if (type === 'arrow') {
      setArrowStart(point);
    } else {
      setIsDrawing(true);
      setCurrentDrawing([point]);
    }
  }, []);
  
  /**
   * Continue the current drawing with a new point
   */
  const continueDrawing = useCallback((point) => {
    if (isDrawing) {
      setCurrentDrawing(prev => [...prev, point]);
    }
  }, [isDrawing]);
  
  /**
   * End the current drawing and add it to the drawings list
   */
  const endDrawing = useCallback((color = '#ffffff', tool = 'pen') => {
    if (tool === 'arrow' && arrowStart) {
      // Arrow is handled differently - we'll let the parent component add it
      setArrowStart(null);
      return { type: 'arrow', start: arrowStart };
    } else if (isDrawing && currentDrawing.length > 0) {
      const newDrawing = {
        id: Date.now() + Math.random(),
        points: currentDrawing,
        color,
        tool: 'pen',
        timestamp: Date.now()
      };
      setDrawings(prev => [...prev, newDrawing]);
      setIsDrawing(false);
      setCurrentDrawing([]);
      return newDrawing;
    }
    return null;
  }, [isDrawing, currentDrawing, arrowStart]);
  
  /**
   * Cancel the current drawing without saving
   */
  const cancelDrawing = useCallback(() => {
    setIsDrawing(false);
    setCurrentDrawing([]);
    setArrowStart(null);
  }, []);
  
  /**
   * Clear all drawings
   */
  const clearAllDrawings = useCallback(() => {
    setDrawings([]);
    setCurrentDrawing([]);
    setIsDrawing(false);
    setArrowStart(null);
  }, []);
  
  /**
   * Remove a specific drawing by ID
   */
  const removeDrawing = useCallback((drawingId) => {
    setDrawings(prev => prev.filter(d => d.id !== drawingId));
  }, []);
  
  /**
   * Start drawing a shape
   */
  const startShape = useCallback((point, shapeType, config = {}) => {
    setShapeStart(point);
    setShapePreview({
      type: shapeType,
      start: point,
      end: point,
      ...config
    });
  }, []);
  
  /**
   * Update the shape preview as the user drags
   */
  const updateShapePreview = useCallback((point) => {
    if (shapePreview) {
      setShapePreview(prev => ({
        ...prev,
        end: point
      }));
    }
  }, [shapePreview]);
  
  /**
   * Complete the shape and add it to the shapes list
   */
  const completeShape = useCallback((config = {}) => {
    if (shapePreview) {
      const newShape = {
        id: Date.now() + Math.random(),
        ...shapePreview,
        ...config,
        timestamp: Date.now()
      };
      
      // Only add if shape has meaningful dimensions
      const dx = Math.abs(newShape.end.x - newShape.start.x);
      const dy = Math.abs(newShape.end.y - newShape.start.y);
      if (dx > 5 || dy > 5) {
        setShapes(prev => [...prev, newShape]);
        setShapeStart(null);
        setShapePreview(null);
        return newShape;
      }
    }
    setShapeStart(null);
    setShapePreview(null);
    return null;
  }, [shapePreview]);
  
  /**
   * Cancel the current shape without saving
   */
  const cancelShape = useCallback(() => {
    setShapeStart(null);
    setShapePreview(null);
  }, []);
  
  /**
   * Clear all temporary shapes (non-persistent)
   */
  const clearTemporaryShapes = useCallback(() => {
    setShapes(prev => prev.filter(s => s.persistent));
    setShapeStart(null);
    setShapePreview(null);
  }, []);
  
  /**
   * Clear all shapes
   */
  const clearAllShapes = useCallback(() => {
    setShapes([]);
    setShapeStart(null);
    setShapePreview(null);
  }, []);
  
  /**
   * Remove a specific shape by ID
   */
  const removeShape = useCallback((shapeId) => {
    setShapes(prev => prev.filter(s => s.id !== shapeId));
  }, []);
  
  /**
   * Update an existing shape
   */
  const updateShape = useCallback((shapeId, updates) => {
    setShapes(prev => prev.map(s => 
      s.id === shapeId ? { ...s, ...updates } : s
    ));
  }, []);
  
  return {
    // Drawing state
    drawings,
    isDrawing,
    currentDrawing,
    arrowStart,
    
    // Shape state
    shapes,
    shapeStart,
    shapePreview,
    
    // Drawing methods
    startDrawing,
    continueDrawing,
    endDrawing,
    cancelDrawing,
    clearAllDrawings,
    removeDrawing,
    
    // Shape methods
    startShape,
    updateShapePreview,
    completeShape,
    cancelShape,
    clearTemporaryShapes,
    clearAllShapes,
    removeShape,
    updateShape,
    
    // Setters for external control
    setDrawings,
    setShapes,
    setIsDrawing,
    setCurrentDrawing,
    setArrowStart,
    setShapeStart,
    setShapePreview
  };
}

export default useDrawingState;
