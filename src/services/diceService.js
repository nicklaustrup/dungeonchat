/**
 * Dice Rolling Service
 * Handles parsing dice notation and rolling dice for D&D campaigns
 * Supports character-aware rolling with automatic modifiers
 */

import { 
  parseSkillCheckCommand, 
  parseSavingThrowCommand, 
  parseAttackRollCommand,
  getCharacterSkillModifier,
  getCharacterSavingThrowModifier,
  getCharacterAbilityModifier 
} from './characterContextService';

/**
 * Parse dice notation like "1d20+5", "3d6", "2d8+2"
 * @param {string} notation - Dice notation string
 * @returns {Object} Parsed dice data
 */
export function parseDiceNotation(notation) {
  // Remove spaces and convert to lowercase
  const clean = notation.replace(/\s/g, '').toLowerCase();
  
  // Regular expression to match dice notation
  // Supports: 1d20, d20, 3d6+2, 1d8-1, etc.
  const diceRegex = /^(\d*)d(\d+)([+-]\d+)?$/;
  const match = clean.match(diceRegex);
  
  if (!match) {
    throw new Error(`Invalid dice notation: ${notation}`);
  }
  
  const [, numDiceStr, sidesStr, modifierStr] = match;
  
  const numDice = numDiceStr === '' ? 1 : parseInt(numDiceStr, 10);
  const sides = parseInt(sidesStr, 10);
  const modifier = modifierStr ? parseInt(modifierStr, 10) : 0;
  
  // Validate values
  if (numDice < 1 || numDice > 100) {
    throw new Error('Number of dice must be between 1 and 100');
  }
  
  if (sides < 2 || sides > 1000) {
    throw new Error('Die sides must be between 2 and 1000');
  }
  
  return {
    numDice,
    sides,
    modifier,
    notation: clean
  };
}

/**
 * Roll dice based on parsed dice data
 * @param {Object} diceData - Parsed dice data from parseDiceNotation
 * @returns {Object} Roll result with breakdown
 */
export function rollDice(diceData) {
  const { numDice, sides, modifier } = diceData;
  const rolls = [];
  
  // Roll each die
  for (let i = 0; i < numDice; i++) {
    const roll = Math.floor(Math.random() * sides) + 1;
    rolls.push(roll);
  }
  
  const rollSum = rolls.reduce((sum, roll) => sum + roll, 0);
  const total = rollSum + modifier;
  
  // Create breakdown string
  let breakdown = '';
  if (numDice === 1) {
    breakdown = `${rolls[0]}`;
  } else {
    breakdown = `(${rolls.join(' + ')}) = ${rollSum}`;
  }
  
  if (modifier !== 0) {
    const modifierSign = modifier > 0 ? '+' : '';
    breakdown += ` ${modifierSign}${modifier}`;
  }
  
  return {
    total,
    rollSum,
    modifier,
    individual: rolls,
    breakdown,
    notation: diceData.notation,
    timestamp: Date.now()
  };
}

/**
 * Check if a roll is a critical hit (natural 20 on d20)
 * @param {Object} rollResult - Result from rollDice
 * @returns {boolean} True if critical hit
 */
export function isCriticalHit(rollResult) {
  if (!rollResult || rollResult.error || !rollResult.individual || !Array.isArray(rollResult.individual)) {
    return false;
  }
  return rollResult.individual.length === 1 && 
         rollResult.individual[0] === 20 && 
         rollResult.notation.includes('d20');
}

/**
 * Check if a roll is a critical fail (natural 1 on d20)
 * @param {Object} rollResult - Result from rollDice
 * @returns {boolean} True if critical fail
 */
export function isCriticalFail(rollResult) {
  if (!rollResult || rollResult.error || !rollResult.individual || !Array.isArray(rollResult.individual)) {
    return false;
  }
  return rollResult.individual.length === 1 && 
         rollResult.individual[0] === 1 && 
         rollResult.notation.includes('d20');
}

/**
 * Get roll result display class for styling
 * @param {Object} rollResult - Result from rollDice
 * @returns {string} CSS class for styling
 */
export function getRollDisplayClass(rollResult) {
  if (isCriticalHit(rollResult)) return 'critical-hit';
  if (isCriticalFail(rollResult)) return 'critical-fail';
  return 'normal-roll';
}

/**
 * Format roll result for display in chat with character context
 * @param {Object} rollResult - Result from rollDice
 * @param {string} playerName - Name of the player rolling
 * @param {Object} characterCommand - Character command data (optional)
 * @returns {Object} Formatted roll data for chat display
 */
export function formatRollForChat(rollResult, playerName, characterCommand = null) {
  const rollClass = getRollDisplayClass(rollResult);
  
  let resultText = '';
  
  // Handle character-specific commands
  if (characterCommand) {
    if (characterCommand.type === 'skill_check') {
      resultText = `� **${playerName}** rolled a **${characterCommand.skill}** check`;
    } else if (characterCommand.type === 'saving_throw') {
      resultText = `🛡️ **${playerName}** rolled a **${characterCommand.ability}** saving throw`;
    } else if (characterCommand.type === 'attack_roll') {
      resultText = `⚔️ **${playerName}** rolled an **attack**`;
    }
    
    if (characterCommand.description) {
      resultText += ` (${characterCommand.description})`;
    }
  } else {
    resultText = `�🎲 **${playerName}** rolled **${rollResult.notation}**`;
  }
  
  if (isCriticalHit(rollResult)) {
    resultText += ` 🔥 **CRITICAL HIT!**`;
  } else if (isCriticalFail(rollResult)) {
    resultText += ` 💀 **CRITICAL FAIL!**`;
  }
  
  resultText += `\n**Result:** ${rollResult.total}`;
  
  if (rollResult.individual.length > 1 || rollResult.modifier !== 0) {
    resultText += ` (${rollResult.breakdown})`;
  }
  
  return {
    text: resultText,
    rollData: rollResult,
    rollClass,
    type: 'dice-roll',
    characterCommand
  };
}

/**
 * Parse inline dice commands from chat messages including character-aware commands
 * Supports: /roll 1d20+5, /r 3d6, /check perception, /save wisdom, /attack
 * @param {string} message - Chat message text
 * @param {Object} character - Character sheet data (optional)
 * @returns {Object|null} Dice command data or null if no command found
 */
export function parseInlineDiceCommand(message, character = null) {
  const trimmed = message.trim();
  
  // Check for character-aware commands first
  if (character) {
    // Skill check command
    const skillCheck = parseSkillCheckCommand(trimmed);
    if (skillCheck) {
      const skillModifier = getCharacterSkillModifier(character, skillCheck.skill);
      const totalModifier = skillModifier + (skillCheck.bonus || 0);
      const notation = totalModifier >= 0 ? `1d20+${totalModifier}` : `1d20${totalModifier}`;
      
      try {
        const diceData = parseDiceNotation(notation);
        return {
          ...diceData,
          characterCommand: skillCheck,
          characterModifier: skillModifier,
          description: `${character.name} makes a ${skillCheck.skill} check`
        };
      } catch (error) {
        return { error: error.message };
      }
    }
    
    // Saving throw command
    const savingThrow = parseSavingThrowCommand(trimmed);
    if (savingThrow) {
      const saveModifier = getCharacterSavingThrowModifier(character, savingThrow.ability);
      const totalModifier = saveModifier + (savingThrow.bonus || 0);
      const notation = totalModifier >= 0 ? `1d20+${totalModifier}` : `1d20${totalModifier}`;
      
      try {
        const diceData = parseDiceNotation(notation);
        return {
          ...diceData,
          characterCommand: savingThrow,
          characterModifier: saveModifier,
          description: `${character.name} makes a ${savingThrow.ability} saving throw`
        };
      } catch (error) {
        return { error: error.message };
      }
    }
    
    // Attack roll command
    const attackRoll = parseAttackRollCommand(trimmed);
    if (attackRoll) {
      // For attack rolls, we'll use proficiency + ability modifier (typically STR or DEX)
      // This is a simplified approach - in a full implementation, this would consider weapon proficiencies
      const proficiencyBonus = character.proficiencyBonus || 0;
      const strMod = getCharacterAbilityModifier(character, 'strength');
      const dexMod = getCharacterAbilityModifier(character, 'dexterity');
      
      // Use higher of STR or DEX (simplified)
      const abilityMod = Math.max(strMod, dexMod);
      const totalModifier = proficiencyBonus + abilityMod + (attackRoll.bonus || 0);
      const notation = totalModifier >= 0 ? `1d20+${totalModifier}` : `1d20${totalModifier}`;
      
      try {
        const diceData = parseDiceNotation(notation);
        return {
          ...diceData,
          characterCommand: attackRoll,
          characterModifier: proficiencyBonus + abilityMod,
          description: `${character.name} makes an attack roll`
        };
      } catch (error) {
        return { error: error.message };
      }
    }
  }
  
  // Standard /roll or /r commands
  const rollCommandRegex = /^\/(?:roll|r)\s+(.+)$/i;
  const match = trimmed.match(rollCommandRegex);
  
  if (!match) return null;
  
  try {
    const notation = match[1].trim();
    const diceData = parseDiceNotation(notation);
    return diceData;
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Common dice presets for quick access
 */
export const COMMON_DICE_PRESETS = [
  { label: 'D4', notation: '1d4', description: 'Four-sided die' },
  { label: 'D6', notation: '1d6', description: 'Six-sided die' },
  { label: 'D8', notation: '1d8', description: 'Eight-sided die' },
  { label: 'D10', notation: '1d10', description: 'Ten-sided die' },
  { label: 'D12', notation: '1d12', description: 'Twelve-sided die' },
  { label: 'D20', notation: '1d20', description: 'Twenty-sided die' },
  { label: 'D100', notation: '1d100', description: 'Percentile dice' },
  { label: '2D6', notation: '2d6', description: 'Two six-sided dice' },
  { label: '3D6', notation: '3d6', description: 'Three six-sided dice (stats)' },
  { label: '4D6', notation: '4d6', description: 'Four six-sided dice' }
];

/**
 * D&D specific roll presets with character integration
 */
export const DND_ROLL_PRESETS = [
  { label: 'Attack Roll', notation: '1d20', description: 'Basic attack roll', command: '/attack' },
  { label: 'Advantage', notation: '2d20', description: 'Roll with advantage (take higher)' },
  { label: 'Saving Throw', notation: '1d20', description: 'Basic saving throw' },
  { label: 'Ability Check', notation: '1d20', description: 'Basic ability check' },
  { label: 'Initiative', notation: '1d20', description: 'Initiative roll' },
  { label: 'Hit Die (d6)', notation: '1d6', description: 'Hit die for healing' },
  { label: 'Hit Die (d8)', notation: '1d8', description: 'Hit die for healing' },
  { label: 'Hit Die (d10)', notation: '1d10', description: 'Hit die for healing' },
  { label: 'Death Save', notation: '1d20', description: 'Death saving throw' }
];

/**
 * Character-aware skill check presets
 */
export const SKILL_CHECK_PRESETS = [
  { label: 'Perception', command: '/check perception', description: 'Notice things in your environment' },
  { label: 'Investigation', command: '/check investigation', description: 'Search for clues and details' },
  { label: 'Insight', command: '/check insight', description: 'Read people and understand motives' },
  { label: 'Stealth', command: '/check stealth', description: 'Move unseen and unheard' },
  { label: 'Athletics', command: '/check athletics', description: 'Climb, jump, swim, or lift' },
  { label: 'Acrobatics', command: '/check acrobatics', description: 'Balance, tumble, or maneuver' },
  { label: 'Persuasion', command: '/check persuasion', description: 'Convince or negotiate' },
  { label: 'Deception', command: '/check deception', description: 'Lie or mislead' },
  { label: 'Intimidation', command: '/check intimidation', description: 'Threaten or coerce' },
  { label: 'Arcana', command: '/check arcana', description: 'Recall magical knowledge' },
  { label: 'History', command: '/check history', description: 'Recall historical facts' },
  { label: 'Nature', command: '/check nature', description: 'Recall natural knowledge' },
  { label: 'Religion', command: '/check religion', description: 'Recall religious knowledge' },
  { label: 'Medicine', command: '/check medicine', description: 'Heal or diagnose' },
  { label: 'Survival', command: '/check survival', description: 'Track, navigate, or forage' },
  { label: 'Animal Handling', command: '/check animal handling', description: 'Calm or control animals' },
  { label: 'Performance', command: '/check performance', description: 'Entertain an audience' },
  { label: 'Sleight of Hand', command: '/check sleight of hand', description: 'Pick pockets or perform tricks' }
];

/**
 * Saving throw presets
 */
export const SAVING_THROW_PRESETS = [
  { label: 'Strength Save', command: '/save strength', description: 'Resist being moved or restrained' },
  { label: 'Dexterity Save', command: '/save dexterity', description: 'Dodge area effects' },
  { label: 'Constitution Save', command: '/save constitution', description: 'Resist poison, disease, or exhaustion' },
  { label: 'Intelligence Save', command: '/save intelligence', description: 'Resist mental effects' },
  { label: 'Wisdom Save', command: '/save wisdom', description: 'Resist charm, fear, or illusion' },
  { label: 'Charisma Save', command: '/save charisma', description: 'Maintain your sense of self' }
];

/**
 * Main dice service object with all functions
 */
export const diceService = {
  parseDiceNotation,
  rollDice,
  formatRollResult: formatRollForChat,
  processInlineDiceCommands: parseInlineDiceCommand,
  isCriticalHit,
  isCriticalFail,
  getRollDisplayClass,
  COMMON_DICE_PRESETS,
  DND_ROLL_PRESETS,
  SKILL_CHECK_PRESETS,
  SAVING_THROW_PRESETS
};