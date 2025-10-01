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
  listening = true
}) {
  const [image] = useImage(token.imageUrl || '', 'anonymous');

  const handleDragEnd = (e) => {
    // Prevent stage from being dragged when dragging token
    e.cancelBubble = true;
    if (onDragEnd) {
      const newPosition = {
        x: e.target.x(),
        y: e.target.y()
      };
      onDragEnd(token.id, newPosition);
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
  const tokenSize = token.size?.width || 50;

  return (
    <Group
      x={token.position.x}
      y={token.position.y}
      draggable={isDraggable}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
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
