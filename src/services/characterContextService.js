/**
 * Character Context Service
 * Provides character-aware functionality for messaging and dice rolling
 */

import { getCharacterSheet } from "./characterSheetService";
import {
  calculateAbilityModifier,
  calculateSkillModifier,
  calculateSavingThrowModifier,
} from "../models/CharacterSheet";

/**
 * D&D 5e Skills and their associated abilities
 */
export const SKILL_ABILITIES = {
  acrobatics: "dexterity",
  animalHandling: "wisdom",
  arcana: "intelligence",
  athletics: "strength",
  deception: "charisma",
  history: "intelligence",
  insight: "wisdom",
  intimidation: "charisma",
  investigation: "intelligence",
  medicine: "wisdom",
  nature: "intelligence",
  perception: "wisdom",
  performance: "charisma",
  persuasion: "charisma",
  religion: "intelligence",
  sleightOfHand: "dexterity",
  stealth: "dexterity",
  survival: "wisdom",
};

/**
 * Skill name aliases for chat commands
 */
export const SKILL_ALIASES = {
  "animal handling": "animalHandling",
  animal: "animalHandling",
  "sleight of hand": "sleightOfHand",
  sleight: "sleightOfHand",
  soh: "sleightOfHand",
};

/**
 * Get character context for a user in a campaign
 * @param {Object} firestore - Firestore instance
 * @param {string} campaignId - Campaign ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Character data or null if not found
 */
export async function getCharacterContext(firestore, campaignId, userId) {
  if (!campaignId || !userId) return null;

  try {
    const character = await getCharacterSheet(firestore, campaignId, userId);
    return character;
  } catch (error) {
    console.warn("Failed to get character context:", error);
    return null;
  }
}

/**
 * Get skill modifier for a character
 * @param {Object} character - Character sheet data
 * @param {string} skillName - Skill name (e.g., 'perception', 'athletics')
 * @returns {number} Total skill modifier
 */
export function getCharacterSkillModifier(character, skillName) {
  if (!character || !skillName) return 0;

  // Normalize skill name
  const normalizedSkill =
    SKILL_ALIASES[skillName.toLowerCase()] || skillName.toLowerCase();
  const ability = SKILL_ABILITIES[normalizedSkill];

  if (!ability) return 0;

  return calculateSkillModifier(character, normalizedSkill);
}

/**
 * Get saving throw modifier for a character
 * @param {Object} character - Character sheet data
 * @param {string} ability - Ability name (e.g., 'strength', 'dexterity')
 * @returns {number} Total saving throw modifier
 */
export function getCharacterSavingThrowModifier(character, ability) {
  if (!character || !ability) return 0;

  return calculateSavingThrowModifier(character, ability.toLowerCase());
}

/**
 * Get ability modifier for a character
 * @param {Object} character - Character sheet data
 * @param {string} ability - Ability name (e.g., 'strength', 'dexterity')
 * @returns {number} Ability modifier
 */
export function getCharacterAbilityModifier(character, ability) {
  if (!character || !ability || !character.abilityScores) return 0;

  const score = character.abilityScores[ability.toLowerCase()];
  return calculateAbilityModifier(score || 10);
}

/**
 * Get proficiency bonus for a character
 * @param {Object} character - Character sheet data
 * @returns {number} Proficiency bonus
 */
export function getCharacterProficiencyBonus(character) {
  if (!character) return 0;

  return (
    character.proficiencyBonus || Math.floor((character.level || 1 - 1) / 4) + 2
  );
}

/**
 * Parse skill check command from message text
 * @param {string} text - Message text
 * @returns {Object|null} Parsed skill check or null if not a skill check
 */
export function parseSkillCheckCommand(text) {
  const skillCheckRegex =
    /^\/(?:check|skill)\s+(\w+(?:\s+\w+)*)\s*(?:\+(\d+))?(?:\s+(.+))?$/i;
  const match = text.match(skillCheckRegex);

  if (!match) return null;

  const [, skillName, bonusStr, description] = match;
  const bonus = bonusStr ? parseInt(bonusStr, 10) : 0;

  return {
    type: "skill_check",
    skill: skillName.trim(),
    bonus,
    description: description?.trim() || null,
  };
}

/**
 * Parse saving throw command from message text
 * @param {string} text - Message text
 * @returns {Object|null} Parsed saving throw or null if not a saving throw
 */
export function parseSavingThrowCommand(text) {
  const saveRegex = /^\/(?:save|saving)\s+(\w+)\s*(?:\+(\d+))?(?:\s+(.+))?$/i;
  const match = text.match(saveRegex);

  if (!match) return null;

  const [, ability, bonusStr, description] = match;
  const bonus = bonusStr ? parseInt(bonusStr, 10) : 0;

  return {
    type: "saving_throw",
    ability: ability.trim(),
    bonus,
    description: description?.trim() || null,
  };
}

/**
 * Parse attack roll command from message text
 * @param {string} text - Message text
 * @returns {Object|null} Parsed attack roll or null if not an attack roll
 */
export function parseAttackRollCommand(text) {
  const attackRegex = /^\/(?:attack|att)\s*(?:\+(\d+))?(?:\s+(.+))?$/i;
  const match = text.match(attackRegex);

  if (!match) return null;

  const [, bonusStr, description] = match;
  const bonus = bonusStr ? parseInt(bonusStr, 10) : 0;

  return {
    type: "attack_roll",
    bonus,
    description: description?.trim() || null,
  };
}

/**
 * Check if a message is an in-character message
 * @param {string} text - Message text
 * @returns {boolean} True if message appears to be in-character
 */
export function isInCharacterMessage(text) {
  if (!text) return false;

  // Check for common in-character indicators
  const icIndicators = [
    /^".*"$/, // Quoted speech
    /^\*.*\*$/, // Action text in asterisks
    /^\/me\s+/i, // /me command
    /^\/ic\s+/i, // Explicit /ic command
    /says?:/i, // "Character says:"
    /whispers?:/i, // "Character whispers:"
    /shouts?:/i, // "Character shouts:"
    /thinks?:/i, // "Character thinks:"
  ];

  return icIndicators.some((pattern) => pattern.test(text.trim()));
}

/**
 * Check if a message is explicitly out-of-character
 * @param {string} text - Message text
 * @returns {boolean} True if message is explicitly marked as OOC
 */
export function isOutOfCharacterMessage(text) {
  if (!text) return false;

  // Check for explicit OOC indicators
  const oocIndicators = [
    /^\/ooc\s+/i, // Explicit /ooc command
    /^\(\(/, // Double parentheses ((text))
    /^\[\[/, // Double brackets [[text]]
    /^ooc:/i, // "OOC: text"
  ];

  return oocIndicators.some((pattern) => pattern.test(text.trim()));
}

/**
 * Get message context type
 * @param {string} text - Message text
 * @returns {string} 'in_character', 'out_of_character', or 'neutral'
 */
export function getMessageContextType(text) {
  if (isOutOfCharacterMessage(text)) return "out_of_character";
  if (isInCharacterMessage(text)) return "in_character";
  return "neutral";
}

/**
 * Clean message text by removing context indicators
 * @param {string} text - Original message text
 * @returns {string} Cleaned message text
 */
export function cleanMessageText(text) {
  if (!text) return "";

  let cleaned = text.trim();

  // Remove /me, /ic, /ooc prefixes
  cleaned = cleaned.replace(/^\/(?:me|ic|ooc)\s+/i, "");

  // Remove double parentheses/brackets but keep content
  cleaned = cleaned.replace(/^\(\((.*)\)\)$/, "$1");
  cleaned = cleaned.replace(/^\[\[(.*)\]\]$/, "$1");

  // Remove "OOC:" prefix
  cleaned = cleaned.replace(/^ooc:\s*/i, "");

  return cleaned.trim();
}

/**
 * Format character action message
 * @param {Object} character - Character data
 * @param {string} action - Action text
 * @returns {string} Formatted action message
 */
export function formatCharacterAction(character, action) {
  if (!character || !action) return action;

  return `*${character.name} ${action}*`;
}

/**
 * Format character speech message
 * @param {Object} character - Character data
 * @param {string} speech - Speech text
 * @returns {string} Formatted speech message
 */
export function formatCharacterSpeech(character, speech) {
  if (!character || !speech) return speech;

  // If already quoted, return as-is
  if (speech.startsWith("\"") && speech.endsWith("\"")) {
    return speech;
  }

  return `"${speech}"`;
}

/**
 * List available skills for help text
 * @returns {Array<string>} List of skill names
 */
export function getAvailableSkills() {
  return Object.keys(SKILL_ABILITIES).map((skill) => {
    const words = skill
      .replace(/([A-Z])/g, " $1")
      .toLowerCase()
      .trim();
    return words.charAt(0).toUpperCase() + words.slice(1);
  });
}

/**
 * List available abilities for help text
 * @returns {Array<string>} List of ability names
 */
export function getAvailableAbilities() {
  return [
    "Strength",
    "Dexterity",
    "Constitution",
    "Intelligence",
    "Wisdom",
    "Charisma",
  ];
}
