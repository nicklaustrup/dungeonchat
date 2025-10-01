import { useState, useCallback } from 'react';

/**
 * useCanvasTools - Custom hook for managing VTT canvas tool state
 * 
 * Manages:
 * - Active tool selection (ping, pen, arrow, ruler, shapes)
 * - Tool-specific color settings
 * - Shape tool configuration (opacity, persistence, visibility)
 * 
 * @returns {Object} Tool state and setter methods
 */
export function useCanvasTools() {
  // Active tool state
  const [activeTool, setActiveTool] = useState('ping');
  
  // Color settings for different tools
  const [pingColor, setPingColor] = useState('#ffff00'); // Yellow
  const [penColor, setPenColor] = useState('#ffffff');   // White
  
  // Shape tool settings
  const [shapeColor, setShapeColor] = useState('#ff0000');
  const [shapeOpacity, setShapeOpacity] = useState(0.5);
  const [shapePersistent, setShapePersistent] = useState(false);
  const [shapeVisibility, setShapeVisibility] = useState('all'); // 'all' | 'dm'
  
  /**
   * Change the active tool
   */
  const changeActiveTool = useCallback((tool) => {
    setActiveTool(tool);
  }, []);
  
  /**
   * Update tool-specific settings
   */
  const updateToolSettings = useCallback((tool, settings) => {
    switch (tool) {
      case 'ping':
        if (settings.color !== undefined) setPingColor(settings.color);
        break;
      case 'pen':
        if (settings.color !== undefined) setPenColor(settings.color);
        break;
      case 'circle':
      case 'rectangle':
      case 'cone':
      case 'line':
        if (settings.color !== undefined) setShapeColor(settings.color);
        if (settings.opacity !== undefined) setShapeOpacity(settings.opacity);
        if (settings.persistent !== undefined) setShapePersistent(settings.persistent);
        if (settings.visibility !== undefined) setShapeVisibility(settings.visibility);
        break;
      default:
        break;
    }
  }, []);
  
  /**
   * Get configuration for the active tool
   */
  const getActiveToolConfig = useCallback(() => {
    const baseConfig = { tool: activeTool };
    
    switch (activeTool) {
      case 'ping':
        return { ...baseConfig, color: pingColor };
      case 'pen':
        return { ...baseConfig, color: penColor };
      case 'arrow':
        return { ...baseConfig, color: penColor };
      case 'circle':
      case 'rectangle':
      case 'cone':
      case 'line':
        return {
          ...baseConfig,
          color: shapeColor,
          opacity: shapeOpacity,
          persistent: shapePersistent,
          visibility: shapeVisibility
        };
      default:
        return baseConfig;
    }
  }, [activeTool, pingColor, penColor, shapeColor, shapeOpacity, shapePersistent, shapeVisibility]);
  
  /**
   * Check if the active tool is a shape tool
   */
  const isShapeTool = useCallback((tool = activeTool) => {
    return ['circle', 'rectangle', 'cone', 'line'].includes(tool);
  }, [activeTool]);
  
  return {
    // State
    activeTool,
    pingColor,
    penColor,
    shapeColor,
    shapeOpacity,
    shapePersistent,
    shapeVisibility,
    
    // Setters
    setActiveTool: changeActiveTool,
    setPingColor,
    setPenColor,
    setShapeColor,
    setShapeOpacity,
    setShapePersistent,
    setShapeVisibility,
    
    // Methods
    updateToolSettings,
    getActiveToolConfig,
    isShapeTool
  };
}

export default useCanvasTools;
