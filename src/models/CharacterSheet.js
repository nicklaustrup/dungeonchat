/**
 * Character Sheet Data Model
 * Defines the structure for D&D 5e character sheets in campaigns
 */

// Base character stats following D&D 5e
export const DEFAULT_ABILITY_SCORES = {
  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  wisdom: 10,
  charisma: 10
};

// D&D 5e Standard Array (15, 14, 13, 12, 10, 8)
export const STANDARD_ARRAY_SCORES = {
  strength: 15,
  dexterity: 14,
  constitution: 13,
  intelligence: 12,
  wisdom: 10,
  charisma: 8
};

// D&D 5e character classes with basic info
export const CHARACTER_CLASSES = {
  barbarian: { name: 'Barbarian', hitDie: 'd12', primaryAbility: 'strength' },
  bard: { name: 'Bard', hitDie: 'd8', primaryAbility: 'charisma' },
  cleric: { name: 'Cleric', hitDie: 'd8', primaryAbility: 'wisdom' },
  druid: { name: 'Druid', hitDie: 'd8', primaryAbility: 'wisdom' },
  fighter: { name: 'Fighter', hitDie: 'd10', primaryAbility: 'strength' },
  monk: { name: 'Monk', hitDie: 'd8', primaryAbility: 'dexterity' },
  paladin: { name: 'Paladin', hitDie: 'd10', primaryAbility: 'strength' },
  ranger: { name: 'Ranger', hitDie: 'd10', primaryAbility: 'dexterity' },
  rogue: { name: 'Rogue', hitDie: 'd8', primaryAbility: 'dexterity' },
  sorcerer: { name: 'Sorcerer', hitDie: 'd6', primaryAbility: 'charisma' },
  warlock: { name: 'Warlock', hitDie: 'd8', primaryAbility: 'charisma' },
  wizard: { name: 'Wizard', hitDie: 'd6', primaryAbility: 'intelligence' }
};

// D&D 5e character races with basic traits
export const CHARACTER_RACES = {
  human: { name: 'Human', size: 'Medium', speed: 30 },
  elf: { name: 'Elf', size: 'Medium', speed: 30 },
  dwarf: { name: 'Dwarf', size: 'Medium', speed: 25 },
  halfling: { name: 'Halfling', size: 'Small', speed: 25 },
  dragonborn: { name: 'Dragonborn', size: 'Medium', speed: 30 },
  gnome: { name: 'Gnome', size: 'Small', speed: 25 },
  'half-elf': { name: 'Half-Elf', size: 'Medium', speed: 30 },
  'half-orc': { name: 'Half-Orc', size: 'Medium', speed: 30 },
  tiefling: { name: 'Tiefling', size: 'Medium', speed: 30 }
};

// D&D 5e skills with their associated abilities
export const CHARACTER_SKILLS = {
  acrobatics: { name: 'Acrobatics', ability: 'dexterity' },
  animalHandling: { name: 'Animal Handling', ability: 'wisdom' },
  arcana: { name: 'Arcana', ability: 'intelligence' },
  athletics: { name: 'Athletics', ability: 'strength' },
  deception: { name: 'Deception', ability: 'charisma' },
  history: { name: 'History', ability: 'intelligence' },
  insight: { name: 'Insight', ability: 'wisdom' },
  intimidation: { name: 'Intimidation', ability: 'charisma' },
  investigation: { name: 'Investigation', ability: 'intelligence' },
  medicine: { name: 'Medicine', ability: 'wisdom' },
  nature: { name: 'Nature', ability: 'intelligence' },
  perception: { name: 'Perception', ability: 'wisdom' },
  performance: { name: 'Performance', ability: 'charisma' },
  persuasion: { name: 'Persuasion', ability: 'charisma' },
  religion: { name: 'Religion', ability: 'intelligence' },
  sleightOfHand: { name: 'Sleight of Hand', ability: 'dexterity' },
  stealth: { name: 'Stealth', ability: 'dexterity' },
  survival: { name: 'Survival', ability: 'wisdom' }
};

// D&D 5e Backgrounds with descriptions
export const CHARACTER_BACKGROUNDS = [
  {
    name: 'Acolyte',
    description: 'You have spent your life in service to a temple of a specific god or pantheon of gods. You act as an intermediary between the realm of the holy and the mortal world.'
  },
  {
    name: 'Criminal',
    description: 'You are an experienced criminal with a history of breaking the law. You have spent a lot of time among other criminals and still have contacts within the criminal underworld.'
  },
  {
    name: 'Folk Hero',
    description: 'You come from a humble social rank, but you are destined for so much more. Already the people of your home village regard you as their champion.'
  },
  {
    name: 'Noble',
    description: 'You understand wealth, power, and privilege. You carry a noble title, and your family owns land, collects taxes, and wields significant political influence.'
  },
  {
    name: 'Sage',
    description: 'You spent years learning the lore of the multiverse. You scoured manuscripts, studied scrolls, and listened to the greatest experts on the subjects that interest you.'
  },
  {
    name: 'Soldier',
    description: 'War has been your life for as long as you care to remember. You trained as a youth, studied the use of weapons and armor, learned basic survival techniques.'
  },
  {
    name: 'Charlatan',
    description: 'You have always had a way with people. You know what makes them tick, you can tease out their hearts\' desires after a few minutes of conversation.'
  },
  {
    name: 'Entertainer',
    description: 'You thrive in front of an audience. You know how to entrance them, entertain them, and even inspire them. Your poetics can stir the hearts of those who hear you.'
  },
  {
    name: 'Guild Artisan',
    description: 'You are a member of an artisan\'s guild, skilled in a particular field and closely associated with other artisans. You are a well-established part of the mercantile world.'
  },
  {
    name: 'Hermit',
    description: 'You lived in seclusion for a formative part of your life. In your time apart from the clamor of society, you found quiet, solitude, and perhaps some of the answers you were looking for.'
  },
  {
    name: 'Outlander',
    description: 'You grew up in the wilds, far from civilization and the comforts of town and technology. You\'ve witnessed the migration of herds larger than forests.'
  },
  {
    name: 'Sailor',
    description: 'You sailed on a seagoing vessel for years. In that time, you faced down mighty storms, monsters of the deep, and those who wanted to sink your craft to the bottomless depths.'
  },
  {
    name: 'Urchin',
    description: 'You grew up on the streets alone, orphaned, and poor. You had no one to watch over you or provide for you, so you learned to provide for yourself.'
  }
];

/**
 * Calculate ability modifier from ability score
 * @param {number} score - Ability score (1-30)
 * @returns {number} Ability modifier (-5 to +10)
 */
export function calculateAbilityModifier(score) {
  return Math.floor((score - 10) / 2);
}

/**
 * Calculate proficiency bonus based on character level
 * @param {number} level - Character level (1-20)
 * @returns {number} Proficiency bonus (+2 to +6)
 */
export function calculateProficiencyBonus(level) {
  return Math.ceil(level / 4) + 1;
}

/**
 * Create default character sheet structure
 * @param {string} name - Character name
 * @param {string} characterClass - Character class key
 * @param {string} race - Character race key
 * @returns {Object} Complete character sheet object
 */
export function createDefaultCharacterSheet(name, characterClass = 'fighter', race = 'human') {
  const level = 1;
  const proficiencyBonus = calculateProficiencyBonus(level);
  
  return {
    // Basic Information
    name,
    class: characterClass,
    race,
    level,
    experience: 0,
    background: '',
    alignment: '',
    
    // Ability Scores
    abilityScores: { ...DEFAULT_ABILITY_SCORES },
    
    // Calculated Values
    proficiencyBonus,
    armorClass: 10,
    maxHp: 10, // Default starting HP
    hp: 10, // Default starting HP
    temporaryHitPoints: 0,
    speed: CHARACTER_RACES[race]?.speed || 30,
    
    // Skills (proficiencies will be set based on class/background)
    skillProficiencies: [],
    skillExpertise: [],
    
    // Saving Throws
    savingThrowProficiencies: [],
    
    // Equipment & Features
    equipment: [],
    features: [],
    spells: [],
    
    // Personality & Background
    personalityTraits: '',
    ideals: '',
    bonds: '',
    flaws: '',
    backstory: '',
    
    // Metadata
    createdAt: new Date(),
    updatedAt: new Date(),
    avatarUrl: null
  };
}

/**
 * Calculate skill modifier for a character
 * @param {Object} character - Character sheet object
 * @param {string} skillKey - Skill key from CHARACTER_SKILLS
 * @returns {number} Total skill modifier
 */
export function calculateSkillModifier(character, skillKey) {
  const skill = CHARACTER_SKILLS[skillKey];
  if (!skill) return 0;
  
  const abilityScore = character.abilityScores[skill.ability] || 10;
  const abilityModifier = calculateAbilityModifier(abilityScore);
  
  const isProficient = character.skillProficiencies.includes(skillKey);
  const isExpert = character.skillExpertise.includes(skillKey);
  
  let proficiencyBonus = 0;
  if (isProficient) {
    proficiencyBonus = character.proficiencyBonus;
    if (isExpert) {
      proficiencyBonus *= 2; // Expertise doubles proficiency bonus
    }
  }
  
  return abilityModifier + proficiencyBonus;
}

/**
 * Calculate saving throw modifier for a character
 * @param {Object} character - Character sheet object
 * @param {string} ability - Ability name (strength, dexterity, etc.)
 * @returns {number} Total saving throw modifier
 */
export function calculateSavingThrowModifier(character, ability) {
  const abilityScore = character.abilityScores[ability] || 10;
  const abilityModifier = calculateAbilityModifier(abilityScore);
  
  const isProficient = character.savingThrowProficiencies.includes(ability);
  const proficiencyBonus = isProficient ? character.proficiencyBonus : 0;
  
  return abilityModifier + proficiencyBonus;
}