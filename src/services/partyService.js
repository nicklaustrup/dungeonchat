import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";

/**
 * Party Management Service
 * Handles party-wide operations including:
 * - Party overview and consolidated stats
 * - Group HP and resource tracking
 * - Party inventory and shared resources
 * - Experience point distribution
 * - Party composition analysis
 */

/**
 * Get all character sheets for a campaign
 */
export async function getPartyCharacters(firestore, campaignId) {
  if (!firestore || !campaignId) {
    throw new Error("Firestore and campaignId are required");
  }

  const charactersRef = collection(
    firestore,
    "campaigns",
    campaignId,
    "characters"
  );
  const charactersSnap = await getDocs(charactersRef);

  return charactersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

/**
 * Calculate party overview statistics
 */
export function calculatePartyStats(characters) {
  if (!characters || characters.length === 0) {
    return {
      totalMembers: 0,
      averageLevel: 0,
      totalHP: 0,
      currentHP: 0,
      hpPercentage: 0,
      classes: {},
      averageAC: 0,
      partyLevel: 0,
    };
  }

  const stats = {
    totalMembers: characters.length,
    averageLevel: 0,
    totalHP: 0,
    currentHP: 0,
    hpPercentage: 0,
    classes: {},
    averageAC: 0,
    partyLevel: 0,
  };

  let totalLevel = 0;
  let totalAC = 0;

  characters.forEach((character) => {
    const level = character.level || 1;
    const maxHP = character.maxHp || 10;
    const currentHP = character.hp !== undefined ? character.hp : maxHP;
    const ac = character.armorClass || character.AC || 10;
    const charClass = character.class || "Unknown";

    totalLevel += level;
    stats.totalHP += maxHP;
    stats.currentHP += currentHP;
    totalAC += ac;

    // Count classes
    if (!stats.classes[charClass]) {
      stats.classes[charClass] = 0;
    }
    stats.classes[charClass]++;
  });

  stats.averageLevel = Math.round(totalLevel / characters.length);
  stats.averageAC = Math.round(totalAC / characters.length);
  stats.hpPercentage =
    stats.totalHP > 0 ? Math.round((stats.currentHP / stats.totalHP) * 100) : 0;
  stats.partyLevel = stats.averageLevel; // Can be more sophisticated

  return stats;
}

/**
 * Distribute XP to all party members
 */
export async function distributeXP(
  firestore,
  campaignId,
  xpAmount,
  characterIds = null
) {
  if (!firestore || !campaignId || !xpAmount) {
    throw new Error("Firestore, campaignId, and xpAmount are required");
  }

  const characters = characterIds
    ? await Promise.all(
        characterIds.map((id) =>
          getDoc(doc(firestore, "campaigns", campaignId, "characters", id))
        )
      )
    : await getPartyCharacters(firestore, campaignId);

  const updates = [];

  for (const character of characters) {
    const charData = character.data ? character.data() : character;
    const charId = character.id;

    if (!charData) continue;

    const currentXP = charData.experience || charData.experiencePoints || 0;
    const newXP = currentXP + xpAmount;

    const characterRef = doc(
      firestore,
      "campaigns",
      campaignId,
      "characters",
      charId
    );
    updates.push(
      updateDoc(characterRef, {
        experience: newXP,
        experiencePoints: newXP,
        lastXPGain: xpAmount,
        lastXPDate: Timestamp.now(),
      })
    );
  }

  await Promise.all(updates);
  return { distributed: updates.length, xpPerMember: xpAmount };
}

/**
 * Update HP for a character
 */
export async function updateCharacterHP(
  firestore,
  campaignId,
  characterId,
  currentHP
) {
  if (!firestore || !campaignId || !characterId) {
    throw new Error("All parameters are required");
  }

  const characterRef = doc(
    firestore,
    "campaigns",
    campaignId,
    "characters",
    characterId
  );
  await updateDoc(characterRef, {
    hp: currentHP,
    lastHPUpdate: Timestamp.now(),
  });
}

/**
 * Heal party (restore HP)
 */
export async function healParty(
  firestore,
  campaignId,
  healAmount,
  characterIds = null
) {
  if (!firestore || !campaignId || !healAmount) {
    throw new Error("Firestore, campaignId, and healAmount are required");
  }

  const characters = characterIds
    ? await Promise.all(
        characterIds.map((id) =>
          getDoc(doc(firestore, "campaigns", campaignId, "characters", id))
        )
      )
    : await getPartyCharacters(firestore, campaignId);

  const updates = [];

  for (const character of characters) {
    const charData = character.data ? character.data() : character;
    const charId = character.id;

    if (!charData) continue;

    const maxHP = charData.maxHp || 10;
    const currentHP = charData.hp !== undefined ? charData.hp : maxHP;
    const newHP = Math.min(currentHP + healAmount, maxHP);

    const characterRef = doc(
      firestore,
      "campaigns",
      campaignId,
      "characters",
      charId
    );
    updates.push(
      updateDoc(characterRef, {
        hp: newHP,
        lastHPUpdate: Timestamp.now(),
      })
    );
  }

  await Promise.all(updates);
  return { healed: updates.length, healAmount };
}

/**
 * Long rest (full HP and resource restoration)
 */
export async function longRest(firestore, campaignId, characterIds = null) {
  if (!firestore || !campaignId) {
    throw new Error("Firestore and campaignId are required");
  }

  const characters = characterIds
    ? await Promise.all(
        characterIds.map((id) =>
          getDoc(doc(firestore, "campaigns", campaignId, "characters", id))
        )
      )
    : await getPartyCharacters(firestore, campaignId);

  const updates = [];

  for (const character of characters) {
    const charData = character.data ? character.data() : character;
    const charId = character.id;

    if (!charData) continue;

    const maxHP = charData.maxHp || 10;
    const level = charData.level || 1;

    // Calculate hit dice restoration (half of total, minimum 1)
    const totalHitDice = level;
    const restoredHitDice = Math.max(1, Math.floor(totalHitDice / 2));

    const characterRef = doc(
      firestore,
      "campaigns",
      campaignId,
      "characters",
      charId
    );
    updates.push(
      updateDoc(characterRef, {
        hp: maxHP,
        hitDiceUsed: Math.max(0, (charData.hitDiceUsed || 0) - restoredHitDice),
        spellSlotsUsed: {}, // Reset spell slots
        lastRestDate: Timestamp.now(),
        restType: "long",
      })
    );
  }

  await Promise.all(updates);
  return { rested: updates.length };
}

/**
 * Short rest (partial HP restoration via hit dice)
 */
export async function shortRest(
  firestore,
  campaignId,
  characterId,
  hitDiceUsed = 1
) {
  if (!firestore || !campaignId || !characterId) {
    throw new Error("All parameters are required");
  }

  const characterRef = doc(
    firestore,
    "campaigns",
    campaignId,
    "characters",
    characterId
  );
  const characterSnap = await getDoc(characterRef);

  if (!characterSnap.exists()) {
    throw new Error("Character not found");
  }

  const charData = characterSnap.data();
  const hitDice = charData.hitDice || "d8";
  const conMod = charData.abilityScores?.constitution
    ? Math.floor((charData.abilityScores.constitution - 10) / 2)
    : 0;

  // Calculate HP restoration (average of hit die + CON mod per die)
  const dieSize = parseInt(hitDice.replace("d", ""));
  const averageRoll = Math.ceil(dieSize / 2) + 1;
  const hpRestored = (averageRoll + conMod) * hitDiceUsed;

  const currentHP =
    charData.hp !== undefined ? charData.hp : charData.maxHp || 10;
  const maxHP = charData.maxHp || 10;
  const newHP = Math.min(currentHP + hpRestored, maxHP);

  await updateDoc(characterRef, {
    hp: newHP,
    hitDiceUsed: (charData.hitDiceUsed || 0) + hitDiceUsed,
    lastRestDate: Timestamp.now(),
    restType: "short",
  });

  return { hpRestored, newHP, hitDiceUsed };
}

/**
 * Get party composition analysis
 */
export function analyzePartyComposition(characters) {
  const analysis = {
    roles: {
      tank: 0,
      healer: 0,
      damage: 0,
      support: 0,
      controller: 0,
    },
    balance: "balanced",
    warnings: [],
    recommendations: [],
  };

  if (!characters || characters.length === 0) {
    analysis.warnings.push("No characters in party");
    return analysis;
  }

  // Simplified role analysis based on class
  const roleMap = {
    Fighter: "tank",
    Paladin: "tank",
    Barbarian: "tank",
    Cleric: "healer",
    Druid: "healer",
    Rogue: "damage",
    Ranger: "damage",
    Monk: "damage",
    Wizard: "controller",
    Sorcerer: "controller",
    Warlock: "damage",
    Bard: "support",
    Artificer: "support",
  };

  characters.forEach((character) => {
    const charClass = character.class || "Unknown";
    const role = roleMap[charClass] || "damage";
    analysis.roles[role]++;
  });

  // Analyze balance
  if (analysis.roles.healer === 0) {
    analysis.warnings.push("No healers in party - consider healing potions");
  }
  if (analysis.roles.tank === 0) {
    analysis.warnings.push("No tanks in party - fragile frontline");
  }
  if (characters.length < 3) {
    analysis.warnings.push("Small party - encounters may be more dangerous");
  }
  if (characters.length > 6) {
    analysis.warnings.push("Large party - combat may be slower");
  }

  // Determine overall balance
  const roleVariance =
    Math.max(...Object.values(analysis.roles)) -
    Math.min(...Object.values(analysis.roles));

  if (roleVariance <= 1) {
    analysis.balance = "well-balanced";
  } else if (roleVariance <= 2) {
    analysis.balance = "balanced";
  } else {
    analysis.balance = "unbalanced";
    analysis.recommendations.push("Consider diversifying party roles");
  }

  return analysis;
}

/**
 * Subscribe to party characters (real-time)
 */
export function subscribeToPartyCharacters(firestore, campaignId, callback) {
  if (!firestore || !campaignId) {
    throw new Error("Firestore and campaignId are required");
  }

  const charactersRef = collection(
    firestore,
    "campaigns",
    campaignId,
    "characters"
  );

  return onSnapshot(charactersRef, (snapshot) => {
    const characters = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(characters);
  });
}

/**
 * Get character by user ID
 */
export async function getCharacterByUserId(firestore, campaignId, userId) {
  if (!firestore || !campaignId || !userId) {
    throw new Error("All parameters are required");
  }

  const characterRef = doc(
    firestore,
    "campaigns",
    campaignId,
    "characters",
    userId
  );
  const characterSnap = await getDoc(characterRef);

  if (!characterSnap.exists()) {
    return null;
  }

  return { id: characterSnap.id, ...characterSnap.data() };
}

/**
 * Calculate party wealth
 */
export function calculatePartyWealth(characters) {
  let totalGold = 0;
  let totalSilver = 0;
  let totalCopper = 0;

  characters.forEach((character) => {
    const currency = character.currency || {};
    totalGold += currency.gold || currency.gp || 0;
    totalSilver += currency.silver || currency.sp || 0;
    totalCopper += currency.copper || currency.cp || 0;
  });

  // Convert to gold equivalent
  const goldEquivalent = totalGold + totalSilver / 10 + totalCopper / 100;

  return {
    gold: totalGold,
    silver: totalSilver,
    copper: totalCopper,
    goldEquivalent: Math.round(goldEquivalent * 100) / 100,
    perMember:
      characters.length > 0
        ? Math.round((goldEquivalent / characters.length) * 100) / 100
        : 0,
  };
}

// Default export
const partyService = {
  getPartyCharacters,
  calculatePartyStats,
  distributeXP,
  updateCharacterHP,
  healParty,
  longRest,
  shortRest,
  analyzePartyComposition,
  subscribeToPartyCharacters,
  getCharacterByUserId,
  calculatePartyWealth,
};

export default partyService;
