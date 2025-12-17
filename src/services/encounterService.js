import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";

/**
 * Encounter Service
 * Handles all encounter management operations including:
 * - Creating and managing encounter templates
 * - Scaling encounters for different party sizes/levels
 * - Managing combat participants (monsters, NPCs)
 * - Loot and treasure distribution
 * - Environmental conditions and hazards
 */

/**
 * Generate a unique encounter ID
 */
function generateEncounterId() {
  return `encounter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate encounter difficulty based on XP thresholds (DMG p.82)
 */
export function calculateEncounterDifficulty(totalXP, partyLevel, partySize) {
  // XP thresholds per character level (Easy, Medium, Hard, Deadly)
  const xpThresholds = {
    1: [25, 50, 75, 100],
    2: [50, 100, 150, 200],
    3: [75, 150, 225, 400],
    4: [125, 250, 375, 500],
    5: [250, 500, 750, 1100],
    6: [300, 600, 900, 1400],
    7: [350, 750, 1100, 1700],
    8: [450, 900, 1400, 2100],
    9: [550, 1100, 1600, 2400],
    10: [600, 1200, 1900, 2800],
    11: [800, 1600, 2400, 3600],
    12: [1000, 2000, 3000, 4500],
    13: [1100, 2200, 3400, 5100],
    14: [1250, 2500, 3800, 5700],
    15: [1400, 2800, 4300, 6400],
    16: [1600, 3200, 4800, 7200],
    17: [2000, 3900, 5900, 8800],
    18: [2100, 4200, 6300, 9500],
    19: [2400, 4900, 7300, 10900],
    20: [2800, 5700, 8500, 12700],
  };

  const thresholds = xpThresholds[partyLevel] || xpThresholds[20];
  const [easy, medium, hard, deadly] = thresholds.map((t) => t * partySize);

  if (totalXP < easy) return "trivial";
  if (totalXP < medium) return "easy";
  if (totalXP < hard) return "medium";
  if (totalXP < deadly) return "hard";
  return "deadly";
}

/**
 * Apply encounter multiplier based on number of monsters (DMG p.82)
 */
export function applyEncounterMultiplier(monsterCount) {
  if (monsterCount === 1) return 1;
  if (monsterCount === 2) return 1.5;
  if (monsterCount <= 6) return 2;
  if (monsterCount <= 10) return 2.5;
  if (monsterCount <= 14) return 3;
  return 4;
}

/**
 * Create a new encounter template
 */
export async function createEncounter(firestore, campaignId, encounterData) {
  if (!firestore || !campaignId) {
    throw new Error("Firestore and campaignId are required");
  }

  const encounterId = generateEncounterId();
  const encounterRef = doc(
    firestore,
    "campaigns",
    campaignId,
    "encounters",
    encounterId
  );

  const encounter = {
    encounterId,
    name: encounterData.name || "Untitled Encounter",
    description: encounterData.description || "",
    difficulty: encounterData.difficulty || "medium",
    environment: encounterData.environment || "",
    participants: encounterData.participants || [], // Array of monsters/NPCs
    environmentalEffects: encounterData.environmentalEffects || [],
    loot: encounterData.loot || [],
    treasureValue: encounterData.treasureValue || 0,
    xpTotal: encounterData.xpTotal || 0,
    suggestedLevel: encounterData.suggestedLevel || 1,
    tags: encounterData.tags || [],
    isTemplate:
      encounterData.isTemplate !== undefined ? encounterData.isTemplate : true,
    usageCount: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: encounterData.createdBy || null,
  };

  await setDoc(encounterRef, encounter);
  return encounter;
}

/**
 * Get a specific encounter
 */
export async function getEncounter(firestore, campaignId, encounterId) {
  if (!firestore || !campaignId || !encounterId) {
    throw new Error("Firestore, campaignId, and encounterId are required");
  }

  const encounterRef = doc(
    firestore,
    "campaigns",
    campaignId,
    "encounters",
    encounterId
  );
  const encounterSnap = await getDoc(encounterRef);

  if (!encounterSnap.exists()) {
    throw new Error("Encounter not found");
  }

  return { id: encounterSnap.id, ...encounterSnap.data() };
}

/**
 * Get all encounters for a campaign
 */
export async function getEncounters(firestore, campaignId, filters = {}) {
  if (!firestore || !campaignId) {
    throw new Error("Firestore and campaignId are required");
  }

  const encountersRef = collection(
    firestore,
    "campaigns",
    campaignId,
    "encounters"
  );
  let q = query(encountersRef, orderBy("createdAt", "desc"));

  // Apply filters
  if (filters.isTemplate !== undefined) {
    q = query(
      encountersRef,
      where("isTemplate", "==", filters.isTemplate),
      orderBy("createdAt", "desc")
    );
  }

  const encountersSnap = await getDocs(q);
  return encountersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

/**
 * Update an encounter
 */
export async function updateEncounter(
  firestore,
  campaignId,
  encounterId,
  updates
) {
  if (!firestore || !campaignId || !encounterId) {
    throw new Error("Firestore, campaignId, and encounterId are required");
  }

  const encounterRef = doc(
    firestore,
    "campaigns",
    campaignId,
    "encounters",
    encounterId
  );

  await updateDoc(encounterRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Delete an encounter
 */
export async function deleteEncounter(firestore, campaignId, encounterId) {
  if (!firestore || !campaignId || !encounterId) {
    throw new Error("Firestore, campaignId, and encounterId are required");
  }

  const encounterRef = doc(
    firestore,
    "campaigns",
    campaignId,
    "encounters",
    encounterId
  );
  await deleteDoc(encounterRef);
}

/**
 * Add a participant (monster/NPC) to an encounter
 */
export async function addParticipant(
  firestore,
  campaignId,
  encounterId,
  participant
) {
  if (!firestore || !campaignId || !encounterId) {
    throw new Error("Firestore, campaignId, and encounterId are required");
  }

  const encounter = await getEncounter(firestore, campaignId, encounterId);
  const participantId = `participant-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

  const newParticipant = {
    id: participantId,
    name: participant.name || "Unknown Creature",
    type: participant.type || "monster", // 'monster', 'npc', 'hazard'
    cr: participant.cr || 0,
    xp: participant.xp || 0,
    hp: participant.hp || 1,
    maxHp: participant.maxHp || 1,
    ac: participant.ac || 10,
    initiative: participant.initiative || 0,
    conditions: participant.conditions || [],
    notes: participant.notes || "",
    quantity: participant.quantity || 1,
    addedAt: Timestamp.now(),
  };

  const updatedParticipants = [...encounter.participants, newParticipant];
  const totalXP = updatedParticipants.reduce(
    (sum, p) => sum + p.xp * p.quantity,
    0
  );

  await updateEncounter(firestore, campaignId, encounterId, {
    participants: updatedParticipants,
    xpTotal: totalXP,
  });

  return newParticipant;
}

/**
 * Update a participant in an encounter
 */
export async function updateParticipant(
  firestore,
  campaignId,
  encounterId,
  participantId,
  updates
) {
  if (!firestore || !campaignId || !encounterId || !participantId) {
    throw new Error("All parameters are required");
  }

  const encounter = await getEncounter(firestore, campaignId, encounterId);
  const updatedParticipants = encounter.participants.map((p) =>
    p.id === participantId ? { ...p, ...updates } : p
  );

  const totalXP = updatedParticipants.reduce(
    (sum, p) => sum + p.xp * p.quantity,
    0
  );

  await updateEncounter(firestore, campaignId, encounterId, {
    participants: updatedParticipants,
    xpTotal: totalXP,
  });
}

/**
 * Remove a participant from an encounter
 */
export async function removeParticipant(
  firestore,
  campaignId,
  encounterId,
  participantId
) {
  if (!firestore || !campaignId || !encounterId || !participantId) {
    throw new Error("All parameters are required");
  }

  const encounter = await getEncounter(firestore, campaignId, encounterId);
  const updatedParticipants = encounter.participants.filter(
    (p) => p.id !== participantId
  );
  const totalXP = updatedParticipants.reduce(
    (sum, p) => sum + p.xp * p.quantity,
    0
  );

  await updateEncounter(firestore, campaignId, encounterId, {
    participants: updatedParticipants,
    xpTotal: totalXP,
  });
}

/**
 * Add environmental effect/hazard
 */
export async function addEnvironmentalEffect(
  firestore,
  campaignId,
  encounterId,
  effect
) {
  if (!firestore || !campaignId || !encounterId) {
    throw new Error("Firestore, campaignId, and encounterId are required");
  }

  const encounter = await getEncounter(firestore, campaignId, encounterId);
  const effectId = `effect-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

  const newEffect = {
    id: effectId,
    name: effect.name || "Unknown Effect",
    description: effect.description || "",
    type: effect.type || "hazard", // 'hazard', 'terrain', 'weather', 'magical'
    damage: effect.damage || "",
    saveDC: effect.saveDC || null,
    saveAbility: effect.saveAbility || null,
    duration: effect.duration || "permanent",
    areaOfEffect: effect.areaOfEffect || "",
    addedAt: Timestamp.now(),
  };

  await updateEncounter(firestore, campaignId, encounterId, {
    environmentalEffects: [...encounter.environmentalEffects, newEffect],
  });

  return newEffect;
}

/**
 * Remove environmental effect
 */
export async function removeEnvironmentalEffect(
  firestore,
  campaignId,
  encounterId,
  effectId
) {
  if (!firestore || !campaignId || !encounterId || !effectId) {
    throw new Error("All parameters are required");
  }

  const encounter = await getEncounter(firestore, campaignId, encounterId);
  const updatedEffects = encounter.environmentalEffects.filter(
    (e) => e.id !== effectId
  );

  await updateEncounter(firestore, campaignId, encounterId, {
    environmentalEffects: updatedEffects,
  });
}

/**
 * Add loot item
 */
export async function addLootItem(
  firestore,
  campaignId,
  encounterId,
  lootItem
) {
  if (!firestore || !campaignId || !encounterId) {
    throw new Error("Firestore, campaignId, and encounterId are required");
  }

  const encounter = await getEncounter(firestore, campaignId, encounterId);
  const lootId = `loot-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

  const newLootItem = {
    id: lootId,
    name: lootItem.name || "Unknown Item",
    type: lootItem.type || "mundane", // 'mundane', 'magic', 'currency', 'art', 'gem'
    rarity: lootItem.rarity || "common",
    value: lootItem.value || 0,
    quantity: lootItem.quantity || 1,
    description: lootItem.description || "",
    identified: lootItem.identified !== undefined ? lootItem.identified : true,
    distributed: false,
    addedAt: Timestamp.now(),
  };

  const updatedLoot = [...encounter.loot, newLootItem];
  const totalValue = updatedLoot.reduce(
    (sum, item) => sum + item.value * item.quantity,
    0
  );

  await updateEncounter(firestore, campaignId, encounterId, {
    loot: updatedLoot,
    treasureValue: totalValue,
  });

  return newLootItem;
}

/**
 * Update loot item
 */
export async function updateLootItem(
  firestore,
  campaignId,
  encounterId,
  lootId,
  updates
) {
  if (!firestore || !campaignId || !encounterId || !lootId) {
    throw new Error("All parameters are required");
  }

  const encounter = await getEncounter(firestore, campaignId, encounterId);
  const updatedLoot = encounter.loot.map((item) =>
    item.id === lootId ? { ...item, ...updates } : item
  );

  const totalValue = updatedLoot.reduce(
    (sum, item) => sum + item.value * item.quantity,
    0
  );

  await updateEncounter(firestore, campaignId, encounterId, {
    loot: updatedLoot,
    treasureValue: totalValue,
  });
}

/**
 * Remove loot item
 */
export async function removeLootItem(
  firestore,
  campaignId,
  encounterId,
  lootId
) {
  if (!firestore || !campaignId || !encounterId || !lootId) {
    throw new Error("All parameters are required");
  }

  const encounter = await getEncounter(firestore, campaignId, encounterId);
  const updatedLoot = encounter.loot.filter((item) => item.id !== lootId);
  const totalValue = updatedLoot.reduce(
    (sum, item) => sum + item.value * item.quantity,
    0
  );

  await updateEncounter(firestore, campaignId, encounterId, {
    loot: updatedLoot,
    treasureValue: totalValue,
  });
}

/**
 * Distribute loot to party
 */
export async function distributeLoot(
  firestore,
  campaignId,
  encounterId,
  lootId,
  distribution
) {
  if (!firestore || !campaignId || !encounterId || !lootId) {
    throw new Error("All parameters are required");
  }

  await updateLootItem(firestore, campaignId, encounterId, lootId, {
    distributed: true,
    distributedTo: distribution.recipients || [],
    distributedAt: Timestamp.now(),
    distributedBy: distribution.distributedBy || null,
  });
}

/**
 * Scale encounter for party size and level
 */
export async function scaleEncounter(
  firestore,
  campaignId,
  encounterId,
  scaling
) {
  if (!firestore || !campaignId || !encounterId) {
    throw new Error("Firestore, campaignId, and encounterId are required");
  }

  const encounter = await getEncounter(firestore, campaignId, encounterId);
  const { partySize, partyLevel } = scaling;

  // Simple scaling: adjust participant quantities
  // More sophisticated scaling would adjust CR and add/remove monsters
  const scaleFactor = partySize / 4; // Baseline is 4 players

  const scaledParticipants = encounter.participants.map((p) => ({
    ...p,
    quantity: Math.max(1, Math.round(p.quantity * scaleFactor)),
  }));

  const totalXP = scaledParticipants.reduce(
    (sum, p) => sum + p.xp * p.quantity,
    0
  );
  const adjustedXP =
    totalXP *
    applyEncounterMultiplier(
      scaledParticipants.reduce((sum, p) => sum + p.quantity, 0)
    );

  const difficulty = calculateEncounterDifficulty(
    adjustedXP,
    partyLevel,
    partySize
  );

  await updateEncounter(firestore, campaignId, encounterId, {
    participants: scaledParticipants,
    xpTotal: totalXP,
    difficulty: difficulty,
    suggestedLevel: partyLevel,
    scaledFor: {
      partySize,
      partyLevel,
      scaledAt: Timestamp.now(),
    },
  });

  return {
    xpTotal: totalXP,
    adjustedXP,
    difficulty,
  };
}

/**
 * Duplicate encounter (create a copy)
 */
export async function duplicateEncounter(
  firestore,
  campaignId,
  encounterId,
  newName
) {
  if (!firestore || !campaignId || !encounterId) {
    throw new Error("Firestore, campaignId, and encounterId are required");
  }

  const encounter = await getEncounter(firestore, campaignId, encounterId);

  const duplicatedEncounter = {
    ...encounter,
    name: newName || `${encounter.name} (Copy)`,
    isTemplate: true,
    usageCount: 0,
  };

  delete duplicatedEncounter.id;
  delete duplicatedEncounter.encounterId;

  return await createEncounter(firestore, campaignId, duplicatedEncounter);
}

/**
 * Start encounter (convert template to active encounter)
 */
export async function startEncounter(
  firestore,
  campaignId,
  encounterId,
  sessionId
) {
  if (!firestore || !campaignId || !encounterId) {
    throw new Error("Firestore, campaignId, and encounterId are required");
  }

  const encounter = await getEncounter(firestore, campaignId, encounterId);

  // Create an active instance
  const activeEncounter = {
    ...encounter,
    isTemplate: false,
    isActive: true,
    sessionId: sessionId || null,
    startedAt: Timestamp.now(),
    completedAt: null,
  };

  delete activeEncounter.id;
  delete activeEncounter.encounterId;

  const newEncounter = await createEncounter(
    firestore,
    campaignId,
    activeEncounter
  );

  // Increment usage count on template
  if (encounter.isTemplate) {
    await updateEncounter(firestore, campaignId, encounterId, {
      usageCount: (encounter.usageCount || 0) + 1,
    });
  }

  return newEncounter;
}

/**
 * Complete encounter
 */
export async function completeEncounter(
  firestore,
  campaignId,
  encounterId,
  summary
) {
  if (!firestore || !campaignId || !encounterId) {
    throw new Error("Firestore, campaignId, and encounterId are required");
  }

  await updateEncounter(firestore, campaignId, encounterId, {
    isActive: false,
    completedAt: Timestamp.now(),
    summary: summary || "",
    xpAwarded: summary?.xpAwarded || 0,
    casualties: summary?.casualties || [],
  });
}

/**
 * Subscribe to encounters (real-time)
 */
export function subscribeToEncounters(
  firestore,
  campaignId,
  callback,
  filters = {}
) {
  if (!firestore || !campaignId) {
    throw new Error("Firestore and campaignId are required");
  }

  const encountersRef = collection(
    firestore,
    "campaigns",
    campaignId,
    "encounters"
  );
  let q = query(encountersRef, orderBy("createdAt", "desc"));

  if (filters.isTemplate !== undefined) {
    q = query(
      encountersRef,
      where("isTemplate", "==", filters.isTemplate),
      orderBy("createdAt", "desc")
    );
  }

  return onSnapshot(q, (snapshot) => {
    const encounters = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(encounters);
  });
}

/**
 * Subscribe to a single encounter (real-time)
 */
export function subscribeToEncounter(
  firestore,
  campaignId,
  encounterId,
  callback
) {
  if (!firestore || !campaignId || !encounterId) {
    throw new Error("Firestore, campaignId, and encounterId are required");
  }

  const encounterRef = doc(
    firestore,
    "campaigns",
    campaignId,
    "encounters",
    encounterId
  );

  return onSnapshot(encounterRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() });
    } else {
      callback(null);
    }
  });
}

/**
 * Get encounters by tag
 */
export async function getEncountersByTag(firestore, campaignId, tag) {
  if (!firestore || !campaignId || !tag) {
    throw new Error("Firestore, campaignId, and tag are required");
  }

  const encountersRef = collection(
    firestore,
    "campaigns",
    campaignId,
    "encounters"
  );
  const q = query(
    encountersRef,
    where("tags", "array-contains", tag),
    orderBy("createdAt", "desc")
  );

  const encountersSnap = await getDocs(q);
  return encountersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// Default export object
const encounterService = {
  createEncounter,
  getEncounter,
  getEncounters,
  updateEncounter,
  deleteEncounter,
  addParticipant,
  updateParticipant,
  removeParticipant,
  addEnvironmentalEffect,
  removeEnvironmentalEffect,
  addLootItem,
  updateLootItem,
  removeLootItem,
  distributeLoot,
  scaleEncounter,
  duplicateEncounter,
  startEncounter,
  completeEncounter,
  subscribeToEncounters,
  subscribeToEncounter,
  getEncountersByTag,
  calculateEncounterDifficulty,
  applyEncounterMultiplier,
};

export default encounterService;
