import React, { useMemo } from 'react';
import { Layer, Circle, Rect } from 'react-konva';

/**
 * LightingLayer Component
 * Renders dynamic lighting effects on the canvas
 */
const LightingLayer = ({ 
  lights = [], 
  globalLighting = {}, 
  mapWidth, 
  mapHeight,
  visible = true 
}) => {
  // Calculate flicker offset for animated lights
  const flickerPhase = useMemo(() => Date.now() / 100, []);

  if (!visible || !globalLighting.enabled) {
    return null;
  }

  // Calculate darkness overlay opacity based on ambient light
  const darknessOpacity = 1 - (globalLighting.ambientLight || 0.7);

  return (
    <Layer name="lighting-layer" listening={false}>
      {/* Darkness overlay - render first as base layer */}
      {darknessOpacity > 0 && (
        <Rect
          x={0}
          y={0}
          width={mapWidth}
          height={mapHeight}
          fill="black"
          opacity={darknessOpacity}
          listening={false}
        />
      )}

      {/* Render each light source - cut holes in darkness and add colored glow */}
      {lights.map((light, index) => {
        // Calculate flicker effect
        let radiusMultiplier = 1.0;
        let intensityMultiplier = 1.0;
        
        if (light.flicker) {
          const flicker = Math.sin(flickerPhase + index) * 0.1 + 0.9;
          radiusMultiplier = flicker;
          intensityMultiplier = flicker;
        }

        // Calculate animated pulse effect
        if (light.animated) {
          const pulse = Math.sin(Date.now() / 1000 + index) * 0.15 + 0.85;
          radiusMultiplier *= pulse;
          intensityMultiplier *= pulse;
        }

        const effectiveRadius = light.radius * radiusMultiplier;
        const effectiveIntensity = (light.intensity || 0.8) * intensityMultiplier;

        return (
          <React.Fragment key={light.id}>
            {/* Light reveals area by cutting through darkness */}
            <Circle
              x={light.position.x}
              y={light.position.y}
              radius={effectiveRadius}
              fillRadialGradientStartPoint={{ x: 0, y: 0 }}
              fillRadialGradientStartRadius={0}
              fillRadialGradientEndPoint={{ x: 0, y: 0 }}
              fillRadialGradientEndRadius={effectiveRadius}
              fillRadialGradientColorStops={[
                0,
                'rgba(255, 255, 255, 1)',
                0.7,
                'rgba(255, 255, 255, 0.5)',
                1,
                'rgba(255, 255, 255, 0)'
              ]}
              listening={false}
              globalCompositeOperation="destination-out"
            />

            {/* Colored light glow on top */}
            <Circle
              x={light.position.x}
              y={light.position.y}
              radius={effectiveRadius}
              fillRadialGradientStartPoint={{ x: 0, y: 0 }}
              fillRadialGradientStartRadius={0}
              fillRadialGradientEndPoint={{ x: 0, y: 0 }}
              fillRadialGradientEndRadius={effectiveRadius}
              fillRadialGradientColorStops={[
                0,
                hexToRgba(light.color || '#FFFFFF', effectiveIntensity * 0.3),
                0.5,
                hexToRgba(light.color || '#FFFFFF', effectiveIntensity * 0.15),
                1,
                'rgba(0, 0, 0, 0)'
              ]}
              listening={false}
              globalCompositeOperation="source-over"
            />
          </React.Fragment>
        );
      })}
    </Layer>
  );
};

/**
 * Convert hex color to rgba
 */
const hexToRgba = (hex, alpha = 1) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(255, 255, 255, ${alpha})`;
  
  return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`;
};

export default React.memo(LightingLayer);
