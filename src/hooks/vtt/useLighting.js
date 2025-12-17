/**
 * useLighting Hook
 * React hook for managing lighting system state and operations
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { lightingService } from "../../services/vtt/lightingService";

const useLighting = (
  firestore,
  campaignId,
  mapId,
  globalLightingFromMap = null
) => {
  const [lights, setLights] = useState([]);
  const [globalLighting, setGlobalLighting] = useState({
    enabled: globalLightingFromMap?.enabled ?? false,
    timeOfDay: globalLightingFromMap?.timeOfDay ?? 12.0,
    ambientLight: globalLightingFromMap?.ambientLight ?? 0.5,
    outdoorLighting: globalLightingFromMap?.outdoorLighting ?? true,
  });
  const [loading, setLoading] = useState(true);

  // Update global lighting when map prop changes
  useEffect(() => {
    if (globalLightingFromMap) {
      setGlobalLighting({
        enabled: globalLightingFromMap.enabled ?? false,
        timeOfDay: globalLightingFromMap.timeOfDay ?? 12.0,
        ambientLight: globalLightingFromMap.ambientLight ?? 0.5,
        outdoorLighting: globalLightingFromMap.outdoorLighting ?? true,
      });
    }
  }, [globalLightingFromMap]);

  // Subscribe to lights for this map
  useEffect(() => {
    if (!firestore || !campaignId || !mapId) return;

    setLoading(true);
    const unsubscribe = lightingService.subscribeToLights(
      firestore,
      campaignId,
      mapId,
      (newLights) => {
        setLights(newLights);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, campaignId, mapId]);

  /**
   * Create a new light source
   */
  const createLight = useCallback(
    async (lightData) => {
      if (!firestore || !campaignId || !mapId) return null;

      try {
        const lightId = await lightingService.createLightSource(
          firestore,
          campaignId,
          mapId,
          lightData
        );
        return lightId;
      } catch (error) {
        console.error("Error creating light:", error);
        throw error;
      }
    },
    [firestore, campaignId, mapId]
  );

  /**
   * Update an existing light source
   */
  const updateLight = useCallback(
    async (lightId, updates) => {
      if (!firestore || !campaignId || !mapId) return;

      try {
        await lightingService.updateLightSource(
          firestore,
          campaignId,
          mapId,
          lightId,
          updates
        );
      } catch (error) {
        console.error("Error updating light:", error);
        throw error;
      }
    },
    [firestore, campaignId, mapId]
  );

  /**
   * Delete a light source
   */
  const deleteLight = useCallback(
    async (lightId) => {
      if (!firestore || !campaignId || !mapId) return;

      try {
        await lightingService.deleteLightSource(
          firestore,
          campaignId,
          mapId,
          lightId
        );
      } catch (error) {
        console.error("Error deleting light:", error);
        throw error;
      }
    },
    [firestore, campaignId, mapId]
  );

  /**
   * Update global lighting settings
   */
  const updateGlobalLighting = useCallback(
    async (settings) => {
      if (!firestore || !campaignId || !mapId) return;

      try {
        await lightingService.updateGlobalLighting(
          firestore,
          campaignId,
          mapId,
          settings
        );
        // Optimistically update local state
        setGlobalLighting((prev) => ({ ...prev, ...settings }));
      } catch (error) {
        console.error("Error updating global lighting:", error);
        throw error;
      }
    },
    [firestore, campaignId, mapId]
  );

  /**
   * Create light from preset
   */
  const createLightFromPreset = useCallback(
    async (presetName, position, attachedTo = null) => {
      const presets = lightingService.getLightPresets();
      const preset = presets[presetName];

      if (!preset) {
        console.error("Unknown preset:", presetName);
        return null;
      }

      return await createLight({
        ...preset,
        position,
        attachedTo,
      });
    },
    [createLight]
  );

  /**
   * Calculate light intensity at a specific point
   */
  const getLightingAt = useCallback(
    (x, y) => {
      if (!globalLighting.enabled) {
        return {
          intensity: 1.0,
          color: "#FFFFFF",
          isLit: true,
        };
      }

      let totalIntensity = globalLighting.outdoorLighting
        ? lightingService.getAmbientLightLevel(globalLighting.timeOfDay)
        : globalLighting.ambientLight;

      const affectingLights = [];

      // Check each light source
      lights.forEach((light) => {
        const dx = x - light.position.x;
        const dy = y - light.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < light.radius) {
          const lightIntensity = lightingService.calculateLightIntensity(
            distance,
            light.radius,
            light.falloff || "realistic"
          );

          const effectiveIntensity = lightIntensity * light.intensity;
          totalIntensity += effectiveIntensity;

          affectingLights.push({
            color: light.color,
            intensity: effectiveIntensity,
          });
        }
      });

      // Cap intensity at 1.0
      totalIntensity = Math.min(totalIntensity, 1.0);

      // Blend colors if multiple lights
      const blendedColor =
        affectingLights.length > 0
          ? lightingService.blendLightColors(affectingLights)
          : "#FFFFFF";

      return {
        intensity: totalIntensity,
        color: blendedColor,
        isLit: totalIntensity > 0.1,
      };
    },
    [lights, globalLighting]
  );

  /**
   * Get all lights attached to a specific token
   */
  const getLightsForToken = useCallback(
    (tokenId) => {
      return lights.filter((light) => light.attachedTo === tokenId);
    },
    [lights]
  );

  /**
   * Toggle lighting system on/off
   */
  const toggleLighting = useCallback(async () => {
    await updateGlobalLighting({ enabled: !globalLighting.enabled });
  }, [globalLighting.enabled, updateGlobalLighting]);

  /**
   * Set time of day (0-24)
   */
  const setTimeOfDay = useCallback(
    async (time) => {
      await updateGlobalLighting({ timeOfDay: time });
    },
    [updateGlobalLighting]
  );

  /**
   * Set ambient light level (0-1)
   */
  const setAmbientLight = useCallback(
    async (level) => {
      await updateGlobalLighting({ ambientLight: level });
    },
    [updateGlobalLighting]
  );

  // Memoized computed values
  const hasLights = useMemo(() => lights.length > 0, [lights.length]);
  const isNightTime = useMemo(() => {
    return globalLighting.timeOfDay < 6 || globalLighting.timeOfDay > 20;
  }, [globalLighting.timeOfDay]);

  return {
    // State
    lights,
    globalLighting,
    loading,
    hasLights,
    isNightTime,

    // CRUD operations
    createLight,
    updateLight,
    deleteLight,
    createLightFromPreset,

    // Global lighting control
    updateGlobalLighting,
    toggleLighting,
    setTimeOfDay,
    setAmbientLight,

    // Calculations
    getLightingAt,
    getLightsForToken,

    // Presets
    presets: lightingService.getLightPresets(),
  };
};

export default useLighting;
