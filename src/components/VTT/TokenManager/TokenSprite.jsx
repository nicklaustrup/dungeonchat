import React from 'react';
import { Image as KonvaImage, Group, Circle, Rect, Text } from 'react-konva';
import useImage from 'use-image';

/**
 * TokenSprite Component
 * Renders a token on the Konva canvas
 */
function TokenSprite({ 
  token, 
  onDragEnd, 
  onClick,
  onDragStart,
  isSelected = false,
  isDraggable = true,
  listening = true,
  tokenSnap = true,
  gridSize = 50,
  onDragMovePreview
}) {
  const [image] = useImage(token.imageUrl || '', 'anonymous');

  const handleDragEnd = (e) => {
    e.cancelBubble = true;
    const node = e.target;
    let x = node.x();
    let y = node.y();
    if (gridSize) {
      const altPressed = e.evt?.altKey;
      const snapActive = tokenSnap ? !altPressed : altPressed;
      if (snapActive) {
        const cellX = Math.floor(x / gridSize);
        const cellY = Math.floor(y / gridSize);
        x = cellX * gridSize + (tokenSize === gridSize ? gridSize / 2 : (tokenSize / squares) / 2 + (squares > 1 ? 0 : 0));
        y = cellY * gridSize + (tokenSize === gridSize ? gridSize / 2 : (tokenSize / squares) / 2 + (squares > 1 ? 0 : 0));
        node.x(x);
        node.y(y);
      }
    }
    if (onDragEnd) {
      onDragEnd(token.id, { x, y });
    }
    if (onDragMovePreview) {
      onDragMovePreview(null); // clear highlight
    }
  };

  const handleClick = (e) => {
    // Prevent stage click when clicking token
    e.cancelBubble = true;
    if (onClick) {
      onClick(token.id, e);
    }
  };

  const handleDragStart = (e) => {
    // Prevent stage from being dragged when dragging token
    e.cancelBubble = true;
    if (onDragStart) {
      onDragStart(token.id, e);
    }
  };

  // Token colors based on type
  const getTokenColor = () => {
    if (token.color) return token.color;
    
    switch (token.type) {
      case 'player':
        return '#4a9eff'; // Blue
      case 'enemy':
        return '#dc2626'; // Red
      case 'npc':
        return '#22c55e'; // Green
      case 'object':
        return '#888888'; // Gray
      default:
        return '#ff0000';
    }
  };

  const tokenColor = getTokenColor();
  const baseSize = token.size?.width || 50;
  // Support multi-square tokens: size may be multiple of gridSize. If not exact, fall back to base size.
  const squares = gridSize ? Math.max(1, Math.round(baseSize / gridSize)) : 1;
  const tokenSize = squares * gridSize;

  const handleDragMove = (e) => {
    if (!gridSize) return;
    const node = e.target;
    const rawX = node.x();
    const rawY = node.y();
    const altPressed = e.evt?.altKey;

    // Determine whether snapping is active: if tokenSnap is true, Alt disables; if false, Alt enables.
    const snapActive = tokenSnap ? !altPressed : altPressed;

    if (snapActive) {
      // For large tokens (multiple squares), align top-left corner to grid, not center.
      const cellX = Math.floor(rawX / gridSize);
      const cellY = Math.floor(rawY / gridSize);
      const snappedX = cellX * gridSize + (tokenSize === gridSize ? gridSize / 2 : tokenSize / squares / 2);
      const snappedY = cellY * gridSize + (tokenSize === gridSize ? gridSize / 2 : tokenSize / squares / 2);
      node.x(snappedX);
      node.y(snappedY);
      if (onDragMovePreview) {
        onDragMovePreview({
          x: cellX * gridSize,
            y: cellY * gridSize,
          w: tokenSize,
          h: tokenSize
        });
      }
    } else {
      // Free move: still show highlight of current cell footprint (top-left cell containing center)
      const cellX = Math.floor(rawX / gridSize);
      const cellY = Math.floor(rawY / gridSize);
      if (onDragMovePreview) {
        onDragMovePreview({
          x: cellX * gridSize,
          y: cellY * gridSize,
          w: tokenSize,
          h: tokenSize
        });
      }
    }
  };

  return (
    <Group
  x={token.position.x}
  y={token.position.y}
      draggable={isDraggable}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onClick={handleClick}
      onTap={handleClick}
      listening={listening}
    >
      {/* Token background circle */}
      <Circle
        radius={tokenSize / 2}
        fill={tokenColor}
        opacity={token.isHidden ? 0.3 : 0.8}
        strokeWidth={isSelected ? 3 : 2}
        stroke={isSelected ? '#fff' : '#000'}
      />

      {/* Token image (if available) */}
      {image && (
        <KonvaImage
          image={image}
          width={tokenSize - 8}
          height={tokenSize - 8}
          offsetX={(tokenSize - 8) / 2}
          offsetY={(tokenSize - 8) / 2}
          cornerRadius={tokenSize / 2}
          opacity={token.isHidden ? 0.3 : 1}
        />
      )}

      {/* Token name label */}
      {token.name && (
        <>
          {/* Dark background for text - rectangular */}
          <Rect
            x={-token.name.length * 3.2}
            y={tokenSize / 2 + 5}
            width={token.name.length * 6.4}
            height={18}
            fill="#000"
            opacity={0.75}
            cornerRadius={4}
          />
          <Text
            text={token.name}
            fontSize={11}
            fontStyle="bold"
            fill="#fff"
            align="center"
            width={token.name.length * 6.4}
            x={-token.name.length * 3.2}
            y={tokenSize / 2 + 8}
          />
        </>
      )}

      {/* Selection indicator */}
      {isSelected && (
        <Circle
          radius={tokenSize / 2 + 5}
          stroke="#4a9eff"
          strokeWidth={2}
          dash={[5, 5]}
        />
      )}
    </Group>
  );
}

export default TokenSprite;
