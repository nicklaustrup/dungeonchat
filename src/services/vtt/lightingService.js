/**
 * Lighting Service
 * Manages dynamic lighting system for VTT
 * Handles light sources, global lighting, and token vision
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";

/**
 * Create a new light source
 */
export const createLightSource = async (
  firestore,
  campaignId,
  mapId,
  lightData
) => {
  try {
    const lightsRef = collection(
      firestore,
      "campaigns",
      campaignId,
      "maps",
      mapId,
      "lights"
    );
    const docRef = await addDoc(lightsRef, {
      ...lightData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating light source:", error);
    throw error;
  }
};

/**
 * Update an existing light source
 */
export const updateLightSource = async (
  firestore,
  campaignId,
  mapId,
  lightId,
  updates
) => {
  try {
    const lightRef = doc(
      firestore,
      "campaigns",
      campaignId,
      "maps",
      mapId,
      "lights",
      lightId
    );
    await updateDoc(lightRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating light source:", error);
    throw error;
  }
};

/**
 * Delete a light source
 */
export const deleteLightSource = async (
  firestore,
  campaignId,
  mapId,
  lightId
) => {
  try {
    const lightRef = doc(
      firestore,
      "campaigns",
      campaignId,
      "maps",
      mapId,
      "lights",
      lightId
    );
    await deleteDoc(lightRef);
  } catch (error) {
    console.error("Error deleting light source:", error);
    throw error;
  }
};

/**
 * Subscribe to light sources for a map
 */
export const subscribeToLights = (firestore, campaignId, mapId, callback) => {
  const lightsRef = collection(
    firestore,
    "campaigns",
    campaignId,
    "maps",
    mapId,
    "lights"
  );
  const q = query(lightsRef, orderBy("createdAt", "asc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const lights = [];
      snapshot.forEach((doc) => {
        lights.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      callback(lights);
    },
    (error) => {
      console.error("Error subscribing to lights:", error);
    }
  );
};

/**
 * Update global lighting settings for a map
 */
export const updateGlobalLighting = async (
  firestore,
  campaignId,
  mapId,
  settings
) => {
  try {
    const mapRef = doc(firestore, "campaigns", campaignId, "maps", mapId);

    // Build update object with only the fields provided
    const updates = {
      "lighting.updatedAt": serverTimestamp(),
    };

    if (settings.enabled !== undefined) {
      updates["lighting.enabled"] = settings.enabled;
    }
    if (settings.timeOfDay !== undefined) {
      updates["lighting.timeOfDay"] = settings.timeOfDay;
    }
    if (settings.ambientLight !== undefined) {
      updates["lighting.ambientLight"] = settings.ambientLight;
    }
    if (settings.outdoorLighting !== undefined) {
      updates["lighting.outdoorLighting"] = settings.outdoorLighting;
    }

    await updateDoc(mapRef, updates);
  } catch (error) {
    console.error("Error updating global lighting:", error);
    throw error;
  }
};

/**
 * Calculate light intensity at a distance from light source
 * @param {number} distance - Distance from light center
 * @param {number} radius - Light radius
 * @param {string} falloff - Falloff type: 'linear', 'quadratic', 'realistic'
 * @returns {number} - Intensity from 0 to 1
 */
export const calculateLightIntensity = (
  distance,
  radius,
  falloff = "realistic"
) => {
  if (distance >= radius) return 0;
  if (distance <= 0) return 1;

  const ratio = distance / radius;

  switch (falloff) {
    case "linear":
      return 1 - ratio;

    case "quadratic":
      return Math.pow(1 - ratio, 2);

    case "realistic":
      // Inverse square law, but smoothed for better visuals
      return Math.pow(1 - ratio, 1.5);

    default:
      return 1 - ratio;
  }
};

/**
 * Get ambient light level based on time of day
 * @param {number} timeOfDay - Hour of day (0-24)
 * @returns {number} - Ambient light level (0-1)
 */
export const getAmbientLightLevel = (timeOfDay) => {
  // Sunrise: 6am, Full day: 8am-6pm, Sunset: 8pm, Night: 10pm-4am
  if (timeOfDay >= 8 && timeOfDay <= 18) {
    return 1.0; // Full daylight
  } else if (timeOfDay >= 6 && timeOfDay < 8) {
    // Sunrise transition (6am-8am)
    return 0.3 + ((timeOfDay - 6) / 2) * 0.7;
  } else if (timeOfDay > 18 && timeOfDay <= 20) {
    // Sunset transition (6pm-8pm)
    return 1.0 - ((timeOfDay - 18) / 2) * 0.7;
  } else if (timeOfDay > 20 || timeOfDay < 6) {
    // Night time
    if (timeOfDay >= 22 || timeOfDay <= 4) {
      return 0.1; // Deep night
    } else {
      return 0.3; // Dusk/dawn
    }
  }
  return 0.7; // Default
};

/**
 * Convert hex color to RGB
 */
export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

/**
 * Blend multiple light colors together
 * @param {Array} lights - Array of {color, intensity} objects
 * @returns {string} - Blended color as hex
 */
export const blendLightColors = (lights) => {
  if (lights.length === 0) return "#FFFFFF";
  if (lights.length === 1) return lights[0].color;

  let totalR = 0,
    totalG = 0,
    totalB = 0,
    totalIntensity = 0;

  lights.forEach((light) => {
    const rgb = hexToRgb(light.color);
    if (rgb) {
      const weight = light.intensity;
      totalR += rgb.r * weight;
      totalG += rgb.g * weight;
      totalB += rgb.b * weight;
      totalIntensity += weight;
    }
  });

  if (totalIntensity === 0) return "#FFFFFF";

  const r = Math.round(totalR / totalIntensity);
  const g = Math.round(totalG / totalIntensity);
  const b = Math.round(totalB / totalIntensity);

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
};

/**
 * Get preset light configurations
 */
export const getLightPresets = () => {
  return {
    torch: {
      type: "point",
      radius: 40, // 40ft bright, 40ft dim (total 80ft radius with falloff)
      intensity: 0.8,
      color: "#FF8800", // Warm orange
      flicker: true,
      animated: false,
      falloff: "realistic",
    },
    lantern: {
      type: "point",
      radius: 30,
      intensity: 0.9,
      color: "#FFB366", // Soft orange-yellow
      flicker: false,
      animated: false,
      falloff: "realistic",
    },
    candle: {
      type: "point",
      radius: 10,
      intensity: 0.6,
      color: "#FFD700", // Golden yellow
      flicker: true,
      animated: false,
      falloff: "realistic",
    },
    lightSpell: {
      type: "point",
      radius: 40, // Light spell: 20ft bright, 20ft dim
      intensity: 1.0,
      color: "#FFFFFF", // Pure white
      flicker: false,
      animated: false,
      falloff: "linear",
    },
    daylight: {
      type: "point",
      radius: 60,
      intensity: 1.0,
      color: "#FFFFEE", // Bright white
      flicker: false,
      animated: false,
      falloff: "linear",
    },
    magicalBlue: {
      type: "point",
      radius: 30,
      intensity: 0.9,
      color: "#4444FF", // Magical blue
      flicker: false,
      animated: true,
      falloff: "realistic",
    },
    magicalPurple: {
      type: "point",
      radius: 30,
      intensity: 0.9,
      color: "#AA44FF", // Magical purple
      flicker: false,
      animated: true,
      falloff: "realistic",
    },
    fireplace: {
      type: "point",
      radius: 35,
      intensity: 0.85,
      color: "#FF6600", // Deep orange
      flicker: true,
      animated: false,
      falloff: "realistic",
    },
  };
};

export const lightingService = {
  createLightSource,
  updateLightSource,
  deleteLightSource,
  subscribeToLights,
  updateGlobalLighting,
  calculateLightIntensity,
  getAmbientLightLevel,
  hexToRgb,
  blendLightColors,
  getLightPresets,
};
