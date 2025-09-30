/**
 * Character Sheet Display Component
 * Full D&D 5e character sheet with all stats and interactive elements
 */

import React from 'react';
import { 
  calculateAbilityModifier, 
  calculateSkillModifier,
  CHARACTER_SKILLS 
} from '../models/CharacterSheet';
import { useCharacterSheet } from '../hooks/useCharacterSheet';
import './CharacterSheet.css';

export function CharacterSheet({ 
  firestore, 
  campaignId, 
  userId, 
  onClose,
  isModal = false 
}) {
  const { character, loading, error, modifyHitPoints } = useCharacterSheet(
    firestore, 
    campaignId, 
    userId
  );

  if (loading) {
    return (
      <div className={`character-sheet ${isModal ? 'modal-content' : ''}`}>
        <div className="loading-state">Loading character sheet...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`character-sheet ${isModal ? 'modal-content' : ''}`}>
        <div className="error-state">Error loading character: {error}</div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className={`character-sheet ${isModal ? 'modal-content' : ''}`}>
        <div className="no-character">No character sheet found for this campaign.</div>
      </div>
    );
  }

  const handleHitPointChange = async (newHP) => {
    try {
      await modifyHitPoints(newHP);
    } catch (err) {
      console.error('Failed to update hit points:', err);
    }
  };

  const renderCharacterHeader = () => (
    <div className="character-header">
      <div className="character-title">
        <h1>{character.name}</h1>
        <div className="character-subtitle">
          Level {character.level} {character.race} {character.class}
        </div>
      </div>
      <div className="character-details">
        <div className="detail-item">
          <label>Background</label>
          <span>{character.background || 'None'}</span>
        </div>
        <div className="detail-item">
          <label>Alignment</label>
          <span>{character.alignment || 'None'}</span>
        </div>
        <div className="detail-item">
          <label>Player</label>
          <span>{character.playerName || 'Unknown'}</span>
        </div>
      </div>
    </div>
  );

  const renderAbilityScores = () => (
    <div className="ability-scores-section">
      <h3>Ability Scores</h3>
      <div className="ability-scores-grid">
        {Object.entries(character.abilityScores).map(([ability, score]) => (
          <div key={ability} className="ability-score-block">
            <div className="ability-name">{ability.toUpperCase()}</div>
            <div className="ability-score">{score}</div>
            <div className="ability-modifier">
              {calculateAbilityModifier(score) >= 0 ? '+' : ''}{calculateAbilityModifier(score)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCombatStats = () => (
    <div className="combat-stats-section">
      <h3>Combat Stats</h3>
      <div className="combat-stats-grid">
        <div className="stat-block">
          <label>Armor Class</label>
          <div className="stat-value">{character.armorClass}</div>
        </div>
        <div className="stat-block">
          <label>Initiative</label>
          <div className="stat-value">
            +{calculateAbilityModifier(character.abilityScores.dexterity)}
          </div>
        </div>
        <div className="stat-block">
          <label>Speed</label>
          <div className="stat-value">{character.speed} ft</div>
        </div>
      </div>
      
      <div className="hit-points-section">
        <h4>Hit Points</h4>
        <div className="hit-points-display">
          <div className="hp-current">
            <label>Current HP</label>
            <input
              type="number"
              value={character.hitPoints.current}
              onChange={(e) => handleHitPointChange(parseInt(e.target.value) || 0)}
              min="0"
              max={character.hitPoints.maximum}
              className="hp-input"
            />
          </div>
          <div className="hp-separator">/</div>
          <div className="hp-maximum">
            <label>Max HP</label>
            <div className="hp-value">{character.hitPoints.maximum}</div>
          </div>
          {character.hitPoints.temporary > 0 && (
            <div className="hp-temp">
              <label>Temp HP</label>
              <div className="hp-value">{character.hitPoints.temporary}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderSkills = () => (
    <div className="skills-section">
      <h3>Skills</h3>
      <div className="skills-grid">
        {CHARACTER_SKILLS.map(skill => {
          const modifier = calculateSkillModifier(character, skill.name);
          const isProficient = character.skills.includes(skill.name);
          
          return (
            <div key={skill.name} className={`skill-item ${isProficient ? 'proficient' : ''}`}>
              <div className="skill-proficiency">
                {isProficient ? '●' : '○'}
              </div>
              <div className="skill-modifier">
                {modifier >= 0 ? '+' : ''}{modifier}
              </div>
              <div className="skill-name">
                {skill.name}
                <span className="skill-ability">({skill.ability.substring(0, 3)})</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderSavingThrows = () => (
    <div className="saving-throws-section">
      <h3>Saving Throws</h3>
      <div className="saving-throws-grid">
        {Object.entries(character.abilityScores).map(([ability, score]) => {
          const modifier = calculateAbilityModifier(score);
          const isProficient = character.savingThrows.includes(ability);
          const finalModifier = isProficient ? modifier + character.proficiencyBonus : modifier;
          
          return (
            <div key={ability} className={`saving-throw-item ${isProficient ? 'proficient' : ''}`}>
              <div className="save-proficiency">
                {isProficient ? '●' : '○'}
              </div>
              <div className="save-modifier">
                {finalModifier >= 0 ? '+' : ''}{finalModifier}
              </div>
              <div className="save-name">{ability.charAt(0).toUpperCase() + ability.slice(1)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderExperience = () => (
    <div className="experience-section">
      <h3>Experience</h3>
      <div className="xp-display">
        <div className="xp-current">
          {character.experiencePoints.toLocaleString()} XP
        </div>
        <div className="xp-bar">
          <div 
            className="xp-progress"
            style={{ 
              width: `${(character.experiencePoints / getXPForNextLevel()) * 100}%` 
            }}
          />
        </div>
        <div className="xp-next">
          Next Level: {getXPForNextLevel().toLocaleString()} XP
        </div>
      </div>
    </div>
  );

  // Experience thresholds for D&D 5e
  const getXPForNextLevel = () => {
    const xpTable = [
      0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
      85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000
    ];
    return xpTable[character.level] || xpTable[xpTable.length - 1];
  };

  return (
    <div className={`character-sheet ${isModal ? 'modal-content' : ''}`}>
      {isModal && (
        <div className="modal-header">
          <h2>Character Sheet</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
      )}
      
      <div className="character-sheet-content">
        {renderCharacterHeader()}
        
        <div className="character-stats-grid">
          <div className="left-column">
            {renderAbilityScores()}
            {renderSavingThrows()}
            {renderSkills()}
          </div>
          
          <div className="right-column">
            {renderCombatStats()}
            {renderExperience()}
            
            <div className="other-stats-section">
              <h3>Other Stats</h3>
              <div className="other-stats-grid">
                <div className="stat-item">
                  <label>Proficiency Bonus</label>
                  <span>+{character.proficiencyBonus}</span>
                </div>
                <div className="stat-item">
                  <label>Passive Perception</label>
                  <span>{10 + calculateSkillModifier(character, 'Perception')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}