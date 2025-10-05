/**
 * Character Creation Modal
 * Step-by-step wizard for creating D&D 5e characters
 */

import React, { useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { 
  CHARACTER_RACES, 
  CHARACTER_CLASSES, 
  CHARACTER_BACKGROUNDS,
  STANDARD_ARRAY_SCORES,
  createDefaultCharacterSheet,
  calculateAbilityModifier 
} from '../models/CharacterSheet';
import { useCharacterCreation } from '../hooks/useCharacterSheet';
import { invalidateUserCharacters, invalidateCampaignCharacters } from '../services/cache';
import { useFirebase } from '../services/FirebaseContext';
import { useChatTheme } from '../contexts/ChatStateContext';
import './CharacterCreationModal.css';

const CREATION_STEPS = {
  BASIC_INFO: 'basic_info',
  RACE_CLASS: 'race_class',
  ABILITIES: 'abilities',
  REVIEW: 'review'
};

const STEP_TITLES = {
  [CREATION_STEPS.BASIC_INFO]: 'Basic Information',
  [CREATION_STEPS.RACE_CLASS]: 'Race & Class',
  [CREATION_STEPS.ABILITIES]: 'Ability Scores',
  [CREATION_STEPS.REVIEW]: 'Review & Create'
};

export function CharacterCreationModal({ 
  isOpen, 
  onClose, 
  firestore, 
  campaignId, 
  userId,
  onCharacterCreated 
}) {
  const { user } = useFirebase();
  const { isDarkTheme } = useChatTheme();
  const [currentStep, setCurrentStep] = useState(CREATION_STEPS.BASIC_INFO);
  const [characterData, setCharacterData] = useState(() => createDefaultCharacterSheet());
  const [backgroundTooltip, setBackgroundTooltip] = useState({ show: false, background: null, position: { x: 0, y: 0 } });
  const { creating, error, createCharacter } = useCharacterCreation(firestore, campaignId, userId);

  // Reset modal state when opened
  React.useEffect(() => {
    if (isOpen && user && firestore) {
      setCurrentStep(CREATION_STEPS.BASIC_INFO);
      const defaultSheet = createDefaultCharacterSheet();
      
      // Fetch username from userProfiles (profile username only, no email or auth name)
      const fetchUsername = async () => {
        try {
          const profileDoc = await getDoc(doc(firestore, 'userProfiles', user.uid));
          if (profileDoc.exists()) {
            const profileData = profileDoc.data();
            defaultSheet.playerName = profileData.username || 'Unknown Player';
          } else {
            defaultSheet.playerName = 'Unknown Player';
          }
        } catch (error) {
          console.error('Error fetching username:', error);
          defaultSheet.playerName = 'Unknown Player';
        }
        setCharacterData(defaultSheet);
      };
      
      fetchUsername();
      setBackgroundTooltip({ show: false, background: null, position: { x: 0, y: 0 } });
    }
  }, [isOpen, user, firestore]);

  if (!isOpen) return null;

  const updateCharacterData = (updates) => {
    setCharacterData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    const steps = Object.values(CREATION_STEPS);
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps = Object.values(CREATION_STEPS);
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleCreateCharacter = async () => {
    try {
      const newCharacter = await createCharacter(characterData);
      // Invalidate character caches after creation
      invalidateUserCharacters(userId);
      invalidateCampaignCharacters(campaignId);
      onCharacterCreated?.(newCharacter);
      onClose();
    } catch (err) {
      console.error('Failed to create character:', err);
    }
  };

  const handleBackgroundHover = (background, event) => {
    const rect = event.target.getBoundingClientRect();
    setBackgroundTooltip({
      show: true,
      background,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      }
    });
  };

  const handleBackgroundLeave = () => {
    setBackgroundTooltip({ show: false, background: null, position: { x: 0, y: 0 } });
  };

  const renderStepIndicator = () => (
    <div className="character-creation-steps">
      {Object.entries(STEP_TITLES).map(([step, title], index) => (
        <div 
          key={step}
          className={`step-indicator ${currentStep === step ? 'active' : ''} ${
            Object.keys(STEP_TITLES).indexOf(currentStep) > index ? 'completed' : ''
          }`}
        >
          <div className="step-number">{index + 1}</div>
          <div className="step-title">{title}</div>
        </div>
      ))}
    </div>
  );

  const renderBasicInfo = () => (
    <div className="creation-step">
      <h3>Character Basic Information</h3>
      <div className="form-group">
        <label>Character Name *</label>
        <input
          type="text"
          value={characterData.name || ''}
          onChange={(e) => updateCharacterData({ name: e.target.value })}
          placeholder="Enter character name"
          required
        />
      </div>
      <div className="form-group">
        <label>Background</label>
        <div className="background-select-container">
          <select
            value={characterData.background}
            onChange={(e) => updateCharacterData({ background: e.target.value })}
            onMouseLeave={handleBackgroundLeave}
          >
            <option value="">Select Background</option>
            {CHARACTER_BACKGROUNDS.map(bg => (
              <option 
                key={bg.name} 
                value={bg.name}
                onMouseEnter={(e) => handleBackgroundHover(bg, e)}
              >
                {bg.name}
              </option>
            ))}
          </select>
          <div className="background-options">
            {CHARACTER_BACKGROUNDS.map(bg => (
              <div
                key={bg.name}
                className={`background-option ${characterData.background === bg.name ? 'selected' : ''}`}
                onClick={() => updateCharacterData({ background: bg.name })}
                onMouseEnter={(e) => handleBackgroundHover(bg, e)}
                onMouseLeave={handleBackgroundLeave}
              >
                {bg.name}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="form-group">
        <label>Alignment</label>
        <select
          value={characterData.alignment}
          onChange={(e) => updateCharacterData({ alignment: e.target.value })}
        >
          <option value="">Select Alignment</option>
          <option value="Lawful Good">Lawful Good</option>
          <option value="Neutral Good">Neutral Good</option>
          <option value="Chaotic Good">Chaotic Good</option>
          <option value="Lawful Neutral">Lawful Neutral</option>
          <option value="True Neutral">True Neutral</option>
          <option value="Chaotic Neutral">Chaotic Neutral</option>
          <option value="Lawful Evil">Lawful Evil</option>
          <option value="Neutral Evil">Neutral Evil</option>
          <option value="Chaotic Evil">Chaotic Evil</option>
        </select>
      </div>
    </div>
  );

  const renderRaceClass = () => (
    <div className="creation-step">
      <h3>Race & Class Selection</h3>
      <div className="race-class-grid">
        <div className="form-group">
          <label>Race *</label>
          <select
            value={characterData.race}
            onChange={(e) => updateCharacterData({ race: e.target.value })}
            required
          >
            <option value="">Select Race</option>
            {Object.keys(CHARACTER_RACES).map(raceKey => (
              <option key={raceKey} value={raceKey}>
                {CHARACTER_RACES[raceKey].name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Class *</label>
          <select
            value={characterData.class}
            onChange={(e) => updateCharacterData({ class: e.target.value })}
            required
          >
            <option value="">Select Class</option>
            {Object.keys(CHARACTER_CLASSES).map(classKey => (
              <option key={classKey} value={classKey}>
                {CHARACTER_CLASSES[classKey].name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label>Level</label>
        <input
          type="number"
          min="1"
          max="20"
          value={characterData.level || 1}
          onChange={(e) => updateCharacterData({ level: parseInt(e.target.value) || 1 })}
        />
      </div>
    </div>
  );

  const renderAbilities = () => (
    <div className="creation-step">
      <h3>Ability Scores</h3>
      <p className="ability-instructions">
        Set your character's ability scores (8-15 for standard array, or custom values).
      </p>
      <div className="ability-grid">
        {Object.entries(characterData.abilityScores).map(([ability, score]) => {
          const modifier = calculateAbilityModifier(score);
          const modifierText = modifier >= 0 ? `+${modifier}` : `${modifier}`;
          
          // Define what each ability affects
          const abilityEffects = {
            strength: 'Strength saving throws, Athletics checks, melee attack/damage rolls',
            dexterity: 'Dexterity saving throws, Acrobatics/Stealth checks, ranged attack rolls, AC (light armor), initiative',
            constitution: 'Constitution saving throws, hit points, concentration checks',
            intelligence: 'Intelligence saving throws, Arcana/History/Investigation/Nature/Religion checks',
            wisdom: 'Wisdom saving throws, Animal Handling/Insight/Medicine/Perception/Survival checks',
            charisma: 'Charisma saving throws, Deception/Intimidation/Performance/Persuasion checks'
          };
          
          return (
            <div key={ability} className="ability-input">
              <label>{ability.toUpperCase()}</label>
              <input
                type="number"
                min="3"
                max="20"
                value={score || 10}
                onChange={(e) => updateCharacterData({
                  abilityScores: {
                    ...characterData.abilityScores,
                    [ability]: parseInt(e.target.value) || 10
                  }
                })}
              />
              <div 
                className="ability-modifier"
                title={`${modifierText} modifier affects: ${abilityEffects[ability]}`}
              >
                {modifierText}
              </div>
            </div>
          );
        })}
      </div>
      <div className="ability-presets">
        <button
          type="button"
          onClick={() => updateCharacterData({ abilityScores: STANDARD_ARRAY_SCORES })}
          className="preset-button"
        >
          Standard Array (15,14,13,12,10,8)
        </button>
      </div>
    </div>
  );

  const renderReview = () => {
    // Get detailed descriptions for tooltips
    const raceInfo = characterData.race ? CHARACTER_RACES[characterData.race] : null;
    const classInfo = characterData.class ? CHARACTER_CLASSES[characterData.class] : null;
    const backgroundInfo = characterData.background ? 
      CHARACTER_BACKGROUNDS.find(bg => bg.name === characterData.background) : null;
    
    return (
      <div className="creation-step">
        <h3>Review Your Character</h3>
        <div className="character-review">
          <div className="review-section">
            <h4>Basic Information</h4>
            <p><strong>Name:</strong> {characterData.name || 'Unnamed Character'}</p>
            <p>
              <strong>Race:</strong> 
              <span 
                className="review-tooltip" 
                title={raceInfo ? `${raceInfo.name} - Size: ${raceInfo.size}, Speed: ${raceInfo.speed} feet` : 'No race selected'}
              >
                {characterData.race || 'None'}
              </span>
            </p>
            <p>
              <strong>Class:</strong> 
              <span 
                className="review-tooltip" 
                title={classInfo ? `${classInfo.name} - Hit Die: ${classInfo.hitDie}, Primary Ability: ${classInfo.primaryAbility}` : 'No class selected'}
              >
                {characterData.class || 'None'}
              </span>
            </p>
            <p>
              <strong>Level:</strong> 
              <span 
                className="review-tooltip" 
                title="Character level determines hit points, proficiency bonus, spell slots, and class features available"
              >
                {characterData.level}
              </span>
            </p>
            <p>
              <strong>Background:</strong> 
              <span 
                className="review-tooltip" 
                title={backgroundInfo ? `${backgroundInfo.name} - ${backgroundInfo.description}` : 'No background selected'}
              >
                {characterData.background || 'None'}
              </span>
            </p>
            <p>
              <strong>Alignment:</strong> 
              <span 
                className="review-tooltip" 
                title="Alignment represents your character's moral and ethical outlook, affecting roleplay and some game mechanics"
              >
                {characterData.alignment || 'None'}
              </span>
            </p>
          </div>
          <div className="review-section">
            <h4>Ability Scores</h4>
            <div className="ability-review">
              {Object.entries(characterData.abilityScores).map(([ability, score]) => {
                const modifier = calculateAbilityModifier(score);
                const modifierText = modifier >= 0 ? `+${modifier}` : `${modifier}`;
                
                // Define what each ability affects for tooltips
                const abilityDescriptions = {
                  strength: 'Physical power - affects melee attacks, Athletics, and carrying capacity',
                  dexterity: 'Agility and reflexes - affects AC, ranged attacks, Stealth, and initiative',
                  constitution: 'Health and stamina - affects hit points and Constitution saves',
                  intelligence: 'Reasoning ability - affects Investigation, Arcana, and wizard spellcasting',
                  wisdom: 'Awareness and insight - affects Perception, Medicine, and cleric/druid spellcasting',
                  charisma: 'Force of personality - affects social skills and bard/sorcerer/warlock spellcasting'
                };
                
                return (
                  <div key={ability} className="ability-line">
                    <span 
                      className="ability-name review-tooltip" 
                      title={abilityDescriptions[ability]}
                    >
                      {ability.toUpperCase()}:
                    </span>
                    <span className="ability-score">{score}</span>
                    <span 
                      className="ability-modifier review-tooltip" 
                      title={`${modifierText} modifier affects all ${ability} checks, saves, and related bonuses`}
                    >
                      ({modifierText})
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {error && (
          <div className="error-message">
            Error creating character: {error}
          </div>
        )}
      </div>
    );
  };

  const canProceed = () => {
    switch (currentStep) {
      case CREATION_STEPS.BASIC_INFO:
        return characterData.name?.trim();
      case CREATION_STEPS.RACE_CLASS:
        return characterData.race && characterData.class;
      case CREATION_STEPS.ABILITIES:
        return true; // Ability scores always have defaults
      case CREATION_STEPS.REVIEW:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="character-creation-modal" 
        data-theme={isDarkTheme ? 'dark' : 'light'}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Create New Character</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        {renderStepIndicator()}

        <div className="modal-content">
          {currentStep === CREATION_STEPS.BASIC_INFO && renderBasicInfo()}
          {currentStep === CREATION_STEPS.RACE_CLASS && renderRaceClass()}
          {currentStep === CREATION_STEPS.ABILITIES && renderAbilities()}
          {currentStep === CREATION_STEPS.REVIEW && renderReview()}
        </div>

        <div className="modal-actions">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === CREATION_STEPS.BASIC_INFO}
            className="secondary-button"
          >
            Previous
          </button>
          
          {currentStep === CREATION_STEPS.REVIEW ? (
            <button
              type="button"
              onClick={handleCreateCharacter}
              disabled={creating || !canProceed()}
              className="primary-button"
            >
              {creating ? 'Creating...' : 'Create Character'}
            </button>
          ) : (
            <button
              type="button"
              onClick={nextStep}
              disabled={!canProceed()}
              className="primary-button"
            >
              Next
            </button>
          )}
        </div>
      </div>
      
      {/* Background Tooltip */}
      {backgroundTooltip.show && backgroundTooltip.background && (
        <div 
          className="background-tooltip"
          style={{
            left: backgroundTooltip.position.x,
            top: backgroundTooltip.position.y
          }}
        >
          <div className="tooltip-header">{backgroundTooltip.background.name}</div>
          <div className="tooltip-description">{backgroundTooltip.background.description}</div>
        </div>
      )}
    </div>
  );
}