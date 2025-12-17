import React, { useState } from "react";
import {
  Image as KonvaImage,
  Group,
  Circle,
  Rect,
  Text,
  Line,
} from "react-konva";
import useImage from "use-image";

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
  gridOffsetX = 0,
  gridOffsetY = 0,
  mapWidth,
  mapHeight,
  onDragMovePreview,
  onContextMenu,
  showGhost = false, // Show ghost at original position during drag
  boundaryCollision = false, // Visual feedback when token hits a boundary
  boundaries = [], // Array of boundaries for collision detection
}) {
  const [image] = useImage(token.imageUrl || "", "anonymous");
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState(null);
  const [currentDragPos, setCurrentDragPos] = useState(null);
  const [isOverBoundary, setIsOverBoundary] = useState(false); // Track if currently over a boundary

  // Helper function to check if position crosses boundaries
  const checkBoundaryCollision = (from, to) => {
    if (!boundaries || boundaries.length === 0) return false;

    for (const boundary of boundaries) {
      if (boundary.type === "line") {
        // Check line-line intersection
        if (
          linesIntersect(
            from.x,
            from.y,
            to.x,
            to.y,
            boundary.start.x,
            boundary.start.y,
            boundary.end.x,
            boundary.end.y
          )
        ) {
          return true;
        }
      } else if (boundary.type === "painted") {
        // Check if destination point is in a painted boundary cell
        const gridX = Math.floor((to.x - gridOffsetX) / gridSize);
        const gridY = Math.floor((to.y - gridOffsetY) / gridSize);

        if (
          boundary.cells &&
          boundary.cells.some(
            (cell) => cell.gridX === gridX && cell.gridY === gridY
          )
        ) {
          return true;
        }
      }
    }
    return false;
  };

  // Line-line intersection algorithm
  const linesIntersect = (x1, y1, x2, y2, x3, y3, x4, y4) => {
    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (Math.abs(denom) < 0.0001) return false;

    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
  };

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
    const isOffLimits =
      x < tokenRadius || // Too far left
      y < tokenRadius || // Too far top
      (mapWidth && x > mapWidth - tokenRadius) || // Too far right
      (mapHeight && y > mapHeight - tokenRadius); // Too far bottom

    // Check for boundary collision
    const crossesBoundary =
      dragStartPos && checkBoundaryCollision(dragStartPos, { x, y });

    if ((isOffLimits || crossesBoundary) && dragStartPos) {
      // Reset to ghost position if dropped in off-limits area or crosses boundary
      x = dragStartPos.x;
      y = dragStartPos.y;
      node.x(x);
      node.y(y);
    }

    setIsDragging(false);
    setDragStartPos(null);
    setCurrentDragPos(null);
    setIsOverBoundary(false); // Clear boundary state
    if (gridSize) {
      const altPressed = e.evt?.altKey;
      const snapActive = tokenSnap ? !altPressed : altPressed;
      if (snapActive) {
        // Same logic as handleDragMove: align top-left corner to grid, then center
        const topLeftX = x - tokenSize / 2;
        const topLeftY = y - tokenSize / 2;
        // Adjust for grid offset before snapping
        const adjustedX = topLeftX - gridOffsetX;
        const adjustedY = topLeftY - gridOffsetY;
        const cellX = Math.round(adjustedX / gridSize);
        const cellY = Math.round(adjustedY / gridSize);
        // Snap to grid and add offset back
        x = cellX * gridSize + gridOffsetX + tokenSize / 2;
        y = cellY * gridSize + gridOffsetY + tokenSize / 2;
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
      case "player":
        return "#4a9eff"; // Blue
      case "enemy":
        return "#dc2626"; // Red
      case "npc":
        return "#22c55e"; // Green
      case "object":
        return "#888888"; // Gray
      default:
        return "#ff0000";
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

    // Check for boundary collision during drag (real-time feedback)
    if (dragStartPos) {
      const currentPos = { x: rawX, y: rawY };
      const colliding = checkBoundaryCollision(dragStartPos, currentPos);
      setIsOverBoundary(colliding);
    }

    // Determine whether snapping is active: if tokenSnap is true, Alt disables; if false, Alt enables.
    const snapActive = tokenSnap ? !altPressed : altPressed;

    if (snapActive) {
      // For large tokens: Calculate top-left corner position, snap it to grid, then center the token
      // This ensures the token's boundary aligns with grid squares properly
      const topLeftX = rawX - tokenSize / 2;
      const topLeftY = rawY - tokenSize / 2;
      // Adjust for grid offset before snapping
      const adjustedX = topLeftX - gridOffsetX;
      const adjustedY = topLeftY - gridOffsetY;
      const cellX = Math.round(adjustedX / gridSize);
      const cellY = Math.round(adjustedY / gridSize);
      // Snap top-left to grid intersection, add offset back, then offset by half token size to center
      const snappedX = cellX * gridSize + gridOffsetX + tokenSize / 2;
      const snappedY = cellY * gridSize + gridOffsetY + tokenSize / 2;
      node.x(snappedX);
      node.y(snappedY);
      if (onDragMovePreview) {
        onDragMovePreview({
          x: cellX * gridSize + gridOffsetX,
          y: cellY * gridSize + gridOffsetY,
          w: tokenSize,
          h: tokenSize,
        });
      }
    } else {
      // Free move: still show highlight of current cell footprint
      const topLeftX = rawX - tokenSize / 2;
      const topLeftY = rawY - tokenSize / 2;
      // Adjust for grid offset to find cell position
      const adjustedX = topLeftX - gridOffsetX;
      const adjustedY = topLeftY - gridOffsetY;
      const cellX = Math.floor(adjustedX / gridSize);
      const cellY = Math.floor(adjustedY / gridSize);
      if (onDragMovePreview) {
        onDragMovePreview({
          x: cellX * gridSize + gridOffsetX,
          y: cellY * gridSize + gridOffsetY,
          w: tokenSize,
          h: tokenSize,
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
          opacity={0.5}
          listening={false}
        >
          <Circle
            radius={tokenSize / 2}
            fill={tokenColor}
            opacity={1}
            strokeWidth={2}
            stroke="#fff"
            dash={[5, 5]}
          />
          <Circle
            radius={4} // Small white dot in the center
            fill="#fff"
            opacity={1}
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
      {isDragging && dragStartPos && currentDragPos && (
        <Group listening={false}>
          <Line
            points={[
              dragStartPos.x,
              dragStartPos.y,
              currentDragPos.x,
              currentDragPos.y,
            ]}
            stroke="#22c55e"
            strokeWidth={2}
            dash={[10, 5]}
            opacity={0.7}
            listening={false}
          />
          {/* Distance label */}
          {gridSize &&
            (() => {
              const dx = currentDragPos.x - dragStartPos.x;
              const dy = currentDragPos.y - dragStartPos.y;
              const distancePixels = Math.sqrt(dx * dx + dy * dy);
              const distanceFeet = Math.round((distancePixels / gridSize) * 5); // 5ft per square
              const midX = (dragStartPos.x + currentDragPos.x) / 2;
              const midY = (dragStartPos.y + currentDragPos.y) / 2;

              return (
                <Group x={midX} y={midY}>
                  <Rect
                    offsetX={12}
                    offsetY={8}
                    width={25}
                    height={15}
                    fill="rgba(0, 0, 0, 0.8)"
                    cornerRadius={4}
                  />
                  <Text
                    offsetX={20}
                    offsetY={8}
                    width={40}
                    height={15}
                    text={`${distanceFeet}ft`}
                    fontSize={8}
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
        onContextMenu={(e) => {
          e.evt?.preventDefault();
          e.cancelBubble = true;
          onContextMenu && onContextMenu(e);
        }}
        listening={listening}
      >
        {/* Token background circle */}
        <Circle
          radius={(tokenSize + 2) / 2}
          fill={tokenColor}
          opacity={token.isHidden ? 0.3 : 0.8}
          strokeWidth={
            boundaryCollision || isOverBoundary ? 4 : isSelected ? 1.5 : 1
          }
          stroke={
            boundaryCollision || isOverBoundary
              ? "#FF0000"
              : isSelected
                ? "#fff"
                : "#000"
          }
          shadowColor={
            boundaryCollision || isOverBoundary ? "#FF0000" : undefined
          }
          shadowBlur={boundaryCollision || isOverBoundary ? 15 : undefined}
          shadowOpacity={boundaryCollision || isOverBoundary ? 0.8 : undefined}
        />

        {/* Token image (if available) */}
        {image && (
          <KonvaImage
            image={image}
            width={tokenSize - 2}
            height={tokenSize - 2}
            offsetX={(tokenSize - 2) / 2}
            offsetY={(tokenSize - 2) / 2}
            cornerRadius={tokenSize / 2}
            opacity={token.isHidden ? 0.3 : 1}
          />
        )}

        {/* Token name label - single line, no background */}
        {token.name && (
          <Text
            text={token.name}
            fontSize={11}
            fontStyle="bold"
            fill="#fff"
            align="center"
            width={Math.max(tokenSize * 4, 200)} // Wide enough for ~64 characters
            ellipsis={true} // Show ellipsis if text is too long
            wrap="none" // Keep on single line
            x={-Math.max(tokenSize * 2, 100)}
            y={tokenSize / 2}
            listening={false}
            shadowColor="#000"
            shadowBlur={8}
            shadowOpacity={0.9}
            shadowOffsetX={0}
            shadowOffsetY={0}
          />
        )}

        {/* HP Bar (if hp & maxHp defined) */}
        {token.maxHp != null && token.hp != null && token.maxHp > 0 && (
          <Group y={-tokenSize / 2 - 12}>
            <Rect
              x={-tokenSize / 2}
              y={0}
              width={
                (Math.log10(1 + token.hp / token.maxHp) / Math.log10(2)) *
                tokenSize
              }
              height={8}
              fill="#222"
              cornerRadius={3}
              opacity={0.8}
            />
            <Rect
              x={-tokenSize / 2}
              y={0}
              width={
                (Math.log10(1 + token.hp / token.maxHp) / Math.log10(2)) *
                tokenSize
              }
              height={8}
              fill={token.hp / token.maxHp < 0.35 ? "#ef4444" : "#16a34a"}
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
        {Array.isArray(token.statusEffects) &&
          token.statusEffects.length > 0 && (
            <Group y={-tokenSize / 2 - (token.maxHp != null ? 26 : 14)}>
              {token.statusEffects.slice(0, 6).map((effect, idx) => (
                <Group
                  key={effect.id || effect.name}
                  x={-tokenSize / 2 + idx * 14}
                >
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
                    text={(effect.icon || effect.name || "?").slice(0, 2)}
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
            <Circle radius={12} fill="#000" opacity={0.85} />
            {/* Eye slash icon - closed eye */}
            <Text
              text="👁️‍🗨️"
              fontSize={12}
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
