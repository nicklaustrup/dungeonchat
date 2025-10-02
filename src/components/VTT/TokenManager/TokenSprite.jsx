import React, { useState } from 'react';
import { Image as KonvaImage, Group, Circle, Rect, Text, Line } from 'react-konva';
import useImage from 'use-image';

/**
 * TokenSprite Component
 * Renders a token on the Konva canvas with ghost placeholder during drag
 */
function TokenSprite({ 
  token, 
  onDragEnd, 
  onClick,
  onDragStart,
  onDragMove,
  isSelected = false,
  isDraggable = true,
  listening = true,
  tokenSnap = true,
  gridSize = 50,
  mapWidth,
  mapHeight,
  onDragMovePreview,
  onContextMenu,
  showGhost = false // Show ghost at original position during drag
}) {
  const [image] = useImage(token.imageUrl || '', 'anonymous');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState(null);
  const [currentDragPos, setCurrentDragPos] = useState(null);

  const handleDragEnd = (e) => {
    e.cancelBubble = true;
    const node = e.target;
    let x = node.x();
    let y = node.y();
    
    // Check if token is within map boundaries
    // Token is off-limits if:
    // - Negative coordinates (off left/top edge)
    // - Beyond map width/height (off right/bottom edge)
    const tokenRadius = tokenSize / 2;
    const isOffLimits = (
      x < tokenRadius || // Too far left
      y < tokenRadius || // Too far top
      (mapWidth && x > mapWidth - tokenRadius) || // Too far right
      (mapHeight && y > mapHeight - tokenRadius) // Too far bottom
    );
    
    if (isOffLimits && dragStartPos) {
      // Reset to ghost position if dropped in off-limits area
      x = dragStartPos.x;
      y = dragStartPos.y;
      node.x(x);
      node.y(y);
    }
    
    setIsDragging(false);
    setDragStartPos(null);
    setCurrentDragPos(null);
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
    setIsDragging(true);
    setDragStartPos({ x: token.position.x, y: token.position.y });
    setCurrentDragPos({ x: token.position.x, y: token.position.y });
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
    
    // Update current drag position for ruler line rendering
    setCurrentDragPos({ x: node.x(), y: node.y() });
    
    // Notify parent of drag move with current position
    if (onDragMove) {
      onDragMove(token.id, { x: rawX, y: rawY }, e);
    }
  };

  return (
    <>
      {/* Ghost Token - Shows original position during drag */}
      {isDragging && dragStartPos && showGhost && (
        <Group
          x={dragStartPos.x}
          y={dragStartPos.y}
          opacity={0.3}
          listening={false}
        >
          <Circle
            radius={tokenSize / 2}
            fill={tokenColor}
            opacity={0.5}
            strokeWidth={2}
            stroke="#fff"
            dash={[5, 5]}
          />
          {image && (
            <KonvaImage
              image={image}
              width={tokenSize - 8}
              height={tokenSize - 8}
              offsetX={(tokenSize - 8) / 2}
              offsetY={(tokenSize - 8) / 2}
              cornerRadius={tokenSize / 2}
              opacity={0.4}
            />
          )}
        </Group>
      )}

      {/* Ruler Line - Shows distance from ghost to current position */}
      {isDragging && dragStartPos && currentDragPos && showGhost && (
        <Group listening={false}>
          <Line
            points={[
              dragStartPos.x,
              dragStartPos.y,
              currentDragPos.x,
              currentDragPos.y
            ]}
            stroke="#22c55e"
            strokeWidth={2}
            dash={[10, 5]}
            opacity={0.7}
            listening={false}
          />
          {/* Distance label */}
          {gridSize && (() => {
            const dx = currentDragPos.x - dragStartPos.x;
            const dy = currentDragPos.y - dragStartPos.y;
            const distancePixels = Math.sqrt(dx * dx + dy * dy);
            const distanceFeet = Math.round((distancePixels / gridSize) * 5); // 5ft per square
            const midX = (dragStartPos.x + currentDragPos.x) / 2;
            const midY = (dragStartPos.y + currentDragPos.y) / 2;
            
            return (
              <Group x={midX} y={midY}>
                <Rect
                  offsetX={20}
                  offsetY={10}
                  width={40}
                  height={20}
                  fill="rgba(0, 0, 0, 0.8)"
                  cornerRadius={4}
                />
                <Text
                  offsetX={20}
                  offsetY={10}
                  width={40}
                  height={20}
                  text={`${distanceFeet}ft`}
                  fontSize={12}
                  fill="#ffffff"
                  align="center"
                  verticalAlign="middle"
                />
              </Group>
            );
          })()}
        </Group>
      )}

      {/* Main Token */}
      <Group
    x={token.position.x}
    y={token.position.y}
        draggable={isDraggable}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onClick={handleClick}
        onTap={handleClick}
        onContextMenu={(e) => { e.evt?.preventDefault(); e.cancelBubble = true; onContextMenu && onContextMenu(e); }}
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

      {/* HP Bar (if hp & maxHp defined) */}
      {token.maxHp != null && token.hp != null && token.maxHp > 0 && (
        <Group y={-tokenSize / 2 - 14}>
          <Rect
            x={-tokenSize / 2}
            y={0}
            width={tokenSize}
            height={8}
            fill="#222"
            cornerRadius={3}
            opacity={0.8}
          />
          <Rect
            x={-tokenSize / 2}
            y={0}
            width={(token.hp / token.maxHp) * tokenSize}
            height={8}
            fill={token.hp / token.maxHp < 0.35 ? '#ef4444' : '#16a34a'}
            cornerRadius={3}
            opacity={0.9}
          />
          <Text
            text={`${token.hp}/${token.maxHp}`}
            fontSize={9}
            fill="#fff"
            align="center"
            width={tokenSize}
            x={-tokenSize / 2}
            y={1}
          />
        </Group>
      )}

      {/* Status Effects Row */}
      {Array.isArray(token.statusEffects) && token.statusEffects.length > 0 && (
        <Group y={-tokenSize / 2 - (token.maxHp != null ? 26 : 14)}>
          {token.statusEffects.slice(0,6).map((effect, idx) => (
            <Group key={effect.id || effect.name} x={-tokenSize / 2 + idx * 14}>
              <Rect
                x={0}
                y={0}
                width={12}
                height={12}
                fill="#333"
                cornerRadius={3}
                opacity={0.85}
                stroke="#888"
                strokeWidth={1}
              />
              <Text
                text={(effect.icon || effect.name || '?').slice(0,2)}
                fontSize={8}
                fill="#fff"
                width={12}
                height={12}
                align="center"
                x={0}
                y={2}
              />
            </Group>
          ))}
        </Group>
      )}

      {/* Hidden indicator - Closed eye icon (DM only) */}
      {token.hidden && (
        <Group x={tokenSize / 2 - 16} y={-tokenSize / 2 + 4}>
          {/* Dark background circle */}
          <Circle
            radius={12}
            fill="#000"
            opacity={0.85}
          />
          {/* Eye slash icon - closed eye */}
          <Text
            text="👁️‍🗨️"
            fontSize={16}
            fill="#fff"
            x={-8}
            y={-8}
            opacity={0.9}
          />
        </Group>
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
    </>
  );
}

export default TokenSprite;
