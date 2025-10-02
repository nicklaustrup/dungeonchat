import React, { useMemo } from 'react';
import { Layer, Line } from 'react-konva';

/**
 * GridLayer Component
 * Renders a grid overlay on the map with optional offset for precise alignment
 */
function GridLayer({ 
  width, 
  height, 
  gridSize, 
  gridColor, 
  gridOpacity, 
  enabled,
  offsetX = 0,
  offsetY = 0
}) {
  const lines = useMemo(() => {
    if (!enabled || !gridSize || !width || !height) return [];

    const gridLines = [];
    
    // Vertical lines with offset
    for (let x = offsetX; x <= width; x += gridSize) {
      if (x >= 0) {
        gridLines.push({
          key: `v-${x}`,
          points: [x, 0, x, height],
          stroke: gridColor,
          strokeWidth: 1,
          opacity: gridOpacity,
        });
      }
    }
    // Add lines to the left of offset if needed
    for (let x = offsetX - gridSize; x >= 0; x -= gridSize) {
      gridLines.push({
        key: `v-${x}`,
        points: [x, 0, x, height],
        stroke: gridColor,
        strokeWidth: 1,
        opacity: gridOpacity,
      });
    }
    
    // Horizontal lines with offset
    for (let y = offsetY; y <= height; y += gridSize) {
      if (y >= 0) {
        gridLines.push({
          key: `h-${y}`,
          points: [0, y, width, y],
          stroke: gridColor,
          strokeWidth: 1,
          opacity: gridOpacity,
        });
      }
    }
    // Add lines above offset if needed
    for (let y = offsetY - gridSize; y >= 0; y -= gridSize) {
      gridLines.push({
        key: `h-${y}`,
        points: [0, y, width, y],
        stroke: gridColor,
        strokeWidth: 1,
        opacity: gridOpacity,
      });
    }
    
    return gridLines;
  }, [width, height, gridSize, gridColor, gridOpacity, enabled, offsetX, offsetY]);

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
