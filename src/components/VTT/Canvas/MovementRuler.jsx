import React from "react";
import { Group, Line, Circle, Text, Rect } from "react-konva";

/**
 * MovementRuler Component
 * Displays a ruler line with distance measurement when token is being dragged
 */
export default function MovementRuler({
  startPos,
  endPos,
  distance,
  color = "#ffff00",
  showDistance = true,
}) {
  if (!startPos || !endPos) return null;

  // Calculate midpoint for distance label
  const midX = (startPos.x + endPos.x) / 2;
  const midY = (startPos.y + endPos.y) / 2;

  // Distance text
  const distanceText = `${distance}ft`;
  const textWidth = distanceText.length * 8;
  const textHeight = 20;

  return (
    <Group>
      {/* Ruler line */}
      <Line
        points={[startPos.x, startPos.y, endPos.x, endPos.y]}
        stroke={color}
        strokeWidth={3}
        dash={[10, 5]}
        opacity={0.8}
        shadowColor="black"
        shadowBlur={4}
        shadowOpacity={0.5}
      />

      {/* Start point marker */}
      <Circle
        x={startPos.x}
        y={startPos.y}
        radius={8}
        fill={color}
        opacity={0.6}
        stroke="white"
        strokeWidth={2}
      />

      {/* End point marker */}
      <Circle
        x={endPos.x}
        y={endPos.y}
        radius={6}
        fill={color}
        opacity={0.8}
        stroke="white"
        strokeWidth={2}
      />

      {/* Distance label */}
      {showDistance && (
        <>
          {/* Background for text */}
          <Rect
            x={midX - textWidth / 2}
            y={midY - textHeight / 2}
            width={textWidth}
            height={textHeight}
            fill="rgba(0, 0, 0, 0.8)"
            cornerRadius={4}
            stroke={color}
            strokeWidth={1}
          />

          {/* Distance text */}
          <Text
            x={midX - textWidth / 2}
            y={midY - textHeight / 2 + 4}
            width={textWidth}
            height={textHeight}
            text={distanceText}
            fontSize={14}
            fontStyle="bold"
            fill="white"
            align="center"
            verticalAlign="middle"
          />
        </>
      )}
    </Group>
  );
}
