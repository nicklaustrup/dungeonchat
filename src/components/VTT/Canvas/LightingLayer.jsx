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

  // Calculate effective ambient light by blending time of day influence with manual ambient setting
  const timeOfDay = globalLighting.timeOfDay ?? 12.0;
  const manualAmbient = globalLighting.ambientLight ?? 0.5;
  
  // Time of Day provides a base lighting level (outdoors context)
  let timeBasedLight = 0.5; // Default neutral
  if (timeOfDay >= 8 && timeOfDay <= 18) {
    // Full daylight (8am - 6pm): high base
    timeBasedLight = 0.9;
  } else if (timeOfDay >= 6 && timeOfDay < 8) {
    // Sunrise (6am - 8am): transition from dark to bright
    timeBasedLight = 0.3 + ((timeOfDay - 6) / 2) * 0.6; // 0.3 to 0.9
  } else if (timeOfDay > 18 && timeOfDay <= 20) {
    // Sunset (6pm - 8pm): transition from bright to dark
    timeBasedLight = 0.9 - ((timeOfDay - 18) / 2) * 0.7; // 0.9 to 0.2
  } else if (timeOfDay > 20 || timeOfDay < 6) {
    // Night time (8pm - 6am): very dark with moonlight
    timeBasedLight = 0.15; // Moonlight level
  }
  
  // Blend time-based and manual ambient: manual ambient acts as a multiplier/override
  // At 100% manual: use mostly manual (indoor override: bright even at night)
  // At 0% manual: very dark (indoor without lights)
  // Middle values: blend outdoor time with indoor adjustment
  const blendWeight = Math.abs(manualAmbient - 0.5) * 2; // How far from neutral (0.5)
  const effectiveAmbient = manualAmbient * blendWeight + timeBasedLight * (1 - blendWeight);
  
  // Calculate darkness with slight curve for natural perception
  const darknessOpacity = Math.pow(1 - effectiveAmbient, 1.15);
  
  // Fog color based on time of day and light level
  // Night = blue-black, Day = light gray, transitions smooth
  let fogColor;
  const isNight = timeOfDay < 6 || timeOfDay > 20;
  const isDusk = (timeOfDay >= 18 && timeOfDay <= 20) || (timeOfDay >= 6 && timeOfDay < 8);
  
  if (effectiveAmbient < 0.2) {
    // Very dark: pitch black or deep blue-black for night
    fogColor = isNight ? '#050510' : '#000000';
  } else if (effectiveAmbient < 0.35) {
    // Dark: blue-black night or dark gray
    fogColor = isNight ? '#0a0a18' : '#1a1a1a';
  } else if (effectiveAmbient < 0.55) {
    // Medium-low: transition zone
    const progress = (effectiveAmbient - 0.35) / 0.2;
    if (isNight) {
      // Night: dark blue to gray-blue
      const blue = Math.floor(24 + progress * 36); // 24 to 60
      const other = Math.floor(10 + progress * 45); // 10 to 55
      fogColor = `rgb(${other}, ${other}, ${blue})`;
    } else {
      // Day/indoor: dark gray to medium gray
      const gray = Math.floor(26 + progress * 64); // 26 to 90
      fogColor = `rgb(${gray}, ${gray}, ${gray})`;
    }
  } else if (effectiveAmbient < 0.75) {
    // Medium-high: lighter tones
    const progress = (effectiveAmbient - 0.55) / 0.2;
    if (isDusk) {
      // Dusk: warm gray-orange tones
      const r = Math.floor(90 + progress * 50); // 90 to 140
      const g = Math.floor(85 + progress * 45); // 85 to 130
      const b = Math.floor(90 + progress * 30); // 90 to 120
      fogColor = `rgb(${r}, ${g}, ${b})`;
    } else if (isNight) {
      // Night: blue-gray to silver
      const r = Math.floor(55 + progress * 75); // 55 to 130
      const g = Math.floor(55 + progress * 75); // 55 to 130
      const b = Math.floor(60 + progress * 80); // 60 to 140
      fogColor = `rgb(${r}, ${g}, ${b})`;
    } else {
      // Day: medium to light gray
      const gray = Math.floor(90 + progress * 70); // 90 to 160
      fogColor = `rgb(${gray}, ${gray}, ${gray})`;
    }
  } else {
    // Very bright: light gray
    fogColor = isDusk ? '#c8b8a8' : '#b0b0b0';
  }

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
            {/* Use stronger alpha values to ensure lights cut through even heavy darkness */}
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
                0.5,
                'rgba(255, 255, 255, 0.9)',
                0.8,
                'rgba(255, 255, 255, 0.6)',
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
