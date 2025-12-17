import { useMemo } from "react";

/**
 * useTokenMovement Hook
 * Calculates movement validation for token dragging
 * Returns distance, validity, and affected grid cells
 */
export default function useTokenMovement({
  token,
  startPos,
  currentPos,
  gridSize = 50,
  inCombat = false,
}) {
  const movementData = useMemo(() => {
    if (!startPos || !currentPos || !token) {
      return {
        distanceFeet: 0,
        distancePixels: 0,
        distanceSquares: 0,
        isValid: true,
        effectiveSpeed: 30,
        affectedCells: [],
        rulerColor: "#ffff00",
      };
    }

    // Calculate distance
    const dx = currentPos.x - startPos.x;
    const dy = currentPos.y - startPos.y;
    const distancePixels = Math.sqrt(dx * dx + dy * dy);
    const distanceSquares = distancePixels / gridSize;
    const feetPerSquare = 5;
    const distanceFeet = Math.round(distanceSquares * feetPerSquare);

    // Get base speed (default 30ft for medium creatures)
    let baseSpeed = token.speed || 30;

    // Check for movement-affecting status effects
    const statusEffects = token.statusEffects || [];
    let effectiveSpeed = baseSpeed;
    let movementMultiplier = 1.0;

    // Check each status effect
    for (const effect of statusEffects) {
      const effectName = (effect.name || "").toLowerCase();

      // Movement restriction effects
      if (
        effectName.includes("grappled") ||
        effectName.includes("paralyzed") ||
        effectName.includes("stunned") ||
        effectName.includes("petrified")
      ) {
        effectiveSpeed = 0;
        break; // No movement at all
      } else if (
        effectName.includes("restrained") ||
        effectName.includes("slow")
      ) {
        movementMultiplier *= 0.5; // Half speed
      } else if (effectName.includes("prone")) {
        movementMultiplier *= 0.5; // Costs extra movement
      } else if (effectName.includes("haste")) {
        movementMultiplier *= 2; // Double speed
      } else if (effectName.includes("encumbered")) {
        effectiveSpeed = Math.max(effectiveSpeed - 10, 0); // -10 ft
      }
    }

    effectiveSpeed = Math.round(effectiveSpeed * movementMultiplier);

    // Determine if move is valid (only matters in combat)
    const isValid = !inCombat || distanceFeet <= effectiveSpeed;

    // Calculate affected grid cells (for highlighting)
    const affectedCells = [];
    if (inCombat && gridSize > 0) {
      const tokenSizeInSquares = Math.max(
        1,
        Math.round((token.size?.width || gridSize) / gridSize)
      );

      // Calculate which cells the token currently occupies
      const startCellX = Math.floor(startPos.x / gridSize);
      const startCellY = Math.floor(startPos.y / gridSize);
      const currentCellX = Math.floor(currentPos.x / gridSize);
      const currentCellY = Math.floor(currentPos.y / gridSize);

      // Add cells in a square area (for multi-square tokens)
      for (let offsetX = 0; offsetX < tokenSizeInSquares; offsetX++) {
        for (let offsetY = 0; offsetY < tokenSizeInSquares; offsetY++) {
          const cellX = currentCellX + offsetX;
          const cellY = currentCellY + offsetY;

          // Calculate distance from start position to this cell
          const cellCenterX = (cellX + 0.5) * gridSize;
          const cellCenterY = (cellY + 0.5) * gridSize;
          const cellDx = cellCenterX - (startCellX + 0.5) * gridSize;
          const cellDy = cellCenterY - (startCellY + 0.5) * gridSize;
          const cellDistancePixels = Math.sqrt(
            cellDx * cellDx + cellDy * cellDy
          );
          const cellDistanceFeet = Math.round(
            (cellDistancePixels / gridSize) * feetPerSquare
          );

          const cellIsValid = cellDistanceFeet <= effectiveSpeed;

          affectedCells.push({
            x: cellX * gridSize,
            y: cellY * gridSize,
            width: gridSize,
            height: gridSize,
            isValid: cellIsValid,
          });
        }
      }
    }

    // Determine ruler color
    let rulerColor = "#ffff00"; // Yellow for out of combat
    if (inCombat) {
      rulerColor = isValid ? "#00ff00" : "#ff0000"; // Green for valid, red for invalid
    }

    return {
      distanceFeet,
      distancePixels,
      distanceSquares,
      isValid,
      effectiveSpeed,
      affectedCells,
      rulerColor,
      movementUsed: `${distanceFeet}ft / ${effectiveSpeed}ft`,
    };
  }, [token, startPos, currentPos, gridSize, inCombat]);

  return movementData;
}
