/**
 * Dice Rolling Service
 * Handles parsing dice notation and rolling dice for D&D campaigns
 */

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
 * Format roll result for display in chat
 * @param {Object} rollResult - Result from rollDice
 * @param {string} playerName - Name of the player rolling
 * @returns {Object} Formatted roll data for chat display
 */
export function formatRollForChat(rollResult, playerName) {
  const rollClass = getRollDisplayClass(rollResult);
  
  let resultText = `🎲 **${playerName}** rolled **${rollResult.notation}**`;
  
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
    type: 'dice-roll'
  };
}

/**
 * Parse inline dice commands from chat messages
 * Looks for patterns like /roll 1d20+5 or /r 3d6
 * @param {string} message - Chat message text
 * @returns {Object|null} Dice command data or null if no command found
 */
export function parseInlineDiceCommand(message) {
  const trimmed = message.trim();
  
  // Match /roll or /r commands
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
 * D&D specific roll presets
 */
export const DND_ROLL_PRESETS = [
  { label: 'Attack Roll', notation: '1d20', description: 'Basic attack roll' },
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
  DND_ROLL_PRESETS
};