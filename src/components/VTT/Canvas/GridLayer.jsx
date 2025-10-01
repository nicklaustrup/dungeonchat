import React, { useMemo } from 'react';
import { Layer, Line } from 'react-konva';

/**
 * GridLayer Component
 * Renders a grid overlay on the map
 */
function GridLayer({ 
  width, 
  height, 
  gridSize, 
  gridColor, 
  gridOpacity, 
  enabled 
}) {
  const lines = useMemo(() => {
    if (!enabled || !gridSize || !width || !height) return [];

    const gridLines = [];
    
    // Vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      gridLines.push({
        key: `v-${x}`,
        points: [x, 0, x, height],
        stroke: gridColor,
        strokeWidth: 1,
        opacity: gridOpacity,
      });
    }
    
    // Horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      gridLines.push({
        key: `h-${y}`,
        points: [0, y, width, y],
        stroke: gridColor,
        strokeWidth: 1,
        opacity: gridOpacity,
      });
    }
    
    return gridLines;
  }, [width, height, gridSize, gridColor, gridOpacity, enabled]);

  if (!enabled) return null;

  return (
    <Layer listening={false}>
      {lines.map((line) => (
        <Line
          key={line.key}
          points={line.points}
          stroke={line.stroke}
          strokeWidth={line.strokeWidth}
          opacity={line.opacity}
        />
      ))}
    </Layer>
  );
}

export default GridLayer;
