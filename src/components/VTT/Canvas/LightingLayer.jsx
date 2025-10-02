import React, { useState, useEffect } from 'react';
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
  // Animation state - continuously updates to drive flicker/pulse effects
  const [animationTime, setAnimationTime] = useState(Date.now());

  // Animate lights continuously using requestAnimationFrame
  useEffect(() => {
    // Only animate if there are lights with flicker or animated effects
    const hasAnimatedLights = lights.some(light => light.flicker || light.animated);
    if (!hasAnimatedLights || !visible || !globalLighting.enabled) {
      return;
    }

    let frameId;
    const animate = () => {
      setAnimationTime(Date.now());
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    
    return () => cancelAnimationFrame(frameId);
  }, [lights, visible, globalLighting.enabled]);

  if (!globalLighting.enabled) {
    return null;
  }

  // Calculate darkness overlay opacity based on ambient light
  const darknessOpacity = 1 - (globalLighting.ambientLight || 0.7);
  
  // Determine fog type: daytime (ambient > 0.6) = gray fog, night/indoors = black darkness
  const isDaytime = (globalLighting.ambientLight || 0.7) > 0.6;
  const fogColor = isDaytime ? '#b0b0b0' : 'black'; // Light gray fog or darkness

  return (
    <Layer name="lighting-layer" listening={false}>
      {/* Fog of War / Darkness overlay - render first as base layer */}
      {darknessOpacity > 0 && (
        <Rect
          x={0}
          y={0}
          width={mapWidth}
          height={mapHeight}
          fill={fogColor}
          opacity={darknessOpacity}
          listening={false}
        />
      )}

      {/* Render each light source - cut holes in darkness and add colored glow */}
      {lights.map((light, index) => {
        // Calculate flicker effect (subtle, realistic fire)
        let radiusMultiplier = 1.0;
        let intensityMultiplier = 1.0;
        
        if (light.flicker) {
          // Flicker intensity: 0.0 = no flicker, 1.0 = maximum flicker
          const flickerIntensity = light.flickerIntensity ?? 0.5; // Default to medium
          const flickerSpeed = 0.005; // Medium speed
          
          // Combine two sine waves for more organic flicker
          const flicker1 = Math.sin(animationTime * flickerSpeed + index * 10) * 0.04;
          const flicker2 = Math.sin(animationTime * flickerSpeed * 1.7 + index * 5) * 0.03;
          const baseFlicker = flicker1 + flicker2; // Range: -0.07 to +0.07
          
          // Scale by intensity: 0.0 = no effect, 1.0 = full effect
          const scaledFlicker = baseFlicker * flickerIntensity;
          const flicker = scaledFlicker + (1 - (flickerIntensity * 0.07)); // Adjust center point
          
          radiusMultiplier = flicker;
          intensityMultiplier = flicker;
        }

        // Calculate animated pulse effect (slow, smooth breathing)
        if (light.animated) {
          // Pulse intensity: 0.0 = no pulse, 1.0 = maximum pulse
          const pulseIntensity = light.pulseIntensity ?? 0.5; // Default to medium
          const pulseSpeed = 0.001; // Very slow, 1 full cycle every ~6 seconds
          
          // Base pulse wave: -1.0 to +1.0
          const basePulse = Math.sin(animationTime * pulseSpeed + index);
          
          // Scale by intensity: 0.0 = no effect (stays at 1.0), 1.0 = 0.5 to 1.0 range
          const pulseAmplitude = 0.25 * pulseIntensity; // Max amplitude = 0.25
          const pulse = basePulse * pulseAmplitude + (1 - pulseAmplitude);
          
          radiusMultiplier *= pulse;
          intensityMultiplier *= pulse;
        }

        const effectiveRadius = light.radius * radiusMultiplier;
        const effectiveIntensity = (light.intensity || 0.8) * intensityMultiplier;

        return (
          <React.Fragment key={light.id}>
            {/* Light reveals area by cutting through fog/darkness */}
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
                0.6,
                'rgba(255, 255, 255, 0.7)',
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
