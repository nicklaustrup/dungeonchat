/**
 * Character Creation Modal
 * Step-by-step wizard for creating D&D 5e characters
 */

import React, { useState } from 'react';
import { 
  CHARACTER_RACES, 
  CHARACTER_CLASSES, 
  DEFAULT_ABILITY_SCORES,
  createDefaultCharacterSheet,
  calculateAbilityModifier 
} from '../models/CharacterSheet';
import { useCharacterCreation } from '../hooks/useCharacterSheet';
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
  const [currentStep, setCurrentStep] = useState(CREATION_STEPS.BASIC_INFO);
  const [characterData, setCharacterData] = useState(() => createDefaultCharacterSheet());
  const { creating, error, createCharacter } = useCharacterCreation(firestore, campaignId, userId);

  // Reset modal state when opened
  React.useEffect(() => {
    if (isOpen) {
      setCurrentStep(CREATION_STEPS.BASIC_INFO);
      setCharacterData(createDefaultCharacterSheet());
    }
  }, [isOpen]);

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
      onCharacterCreated?.(newCharacter);
      onClose();
    } catch (err) {
      console.error('Failed to create character:', err);
    }
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
          value={characterData.name}
          onChange={(e) => updateCharacterData({ name: e.target.value })}
          placeholder="Enter character name"
          required
        />
      </div>
      <div className="form-group">
        <label>Player Name</label>
        <input
          type="text"
          value={characterData.playerName}
          onChange={(e) => updateCharacterData({ playerName: e.target.value })}
          placeholder="Enter player name"
        />
      </div>
      <div className="form-group">
        <label>Background</label>
        <input
          type="text"
          value={characterData.background}
          onChange={(e) => updateCharacterData({ background: e.target.value })}
          placeholder="e.g., Acolyte, Criminal, Folk Hero"
        />
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
            {CHARACTER_RACES.map(race => (
              <option key={race} value={race}>{race}</option>
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
            {CHARACTER_CLASSES.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
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
          value={characterData.level}
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
        {Object.entries(characterData.abilityScores).map(([ability, score]) => (
          <div key={ability} className="ability-input">
            <label>{ability.toUpperCase()}</label>
            <input
              type="number"
              min="3"
              max="20"
              value={score}
              onChange={(e) => updateCharacterData({
                abilityScores: {
                  ...characterData.abilityScores,
                  [ability]: parseInt(e.target.value) || 10
                }
              })}
            />
            <div className="ability-modifier">
              {calculateAbilityModifier(score) >= 0 ? '+' : ''}{calculateAbilityModifier(score)}
            </div>
          </div>
        ))}
      </div>
      <div className="ability-presets">
        <button
          type="button"
          onClick={() => updateCharacterData({ abilityScores: DEFAULT_ABILITY_SCORES })}
          className="preset-button"
        >
          Standard Array (15,14,13,12,10,8)
        </button>
      </div>
    </div>
  );

  const renderReview = () => (
    <div className="creation-step">
      <h3>Review Your Character</h3>
      <div className="character-review">
        <div className="review-section">
          <h4>Basic Information</h4>
          <p><strong>Name:</strong> {characterData.name || 'Unnamed Character'}</p>
          <p><strong>Race:</strong> {characterData.race}</p>
          <p><strong>Class:</strong> {characterData.class}</p>
          <p><strong>Level:</strong> {characterData.level}</p>
          <p><strong>Background:</strong> {characterData.background || 'None'}</p>
          <p><strong>Alignment:</strong> {characterData.alignment || 'None'}</p>
        </div>
        <div className="review-section">
          <h4>Ability Scores</h4>
          <div className="ability-review">
            {Object.entries(characterData.abilityScores).map(([ability, score]) => (
              <div key={ability} className="ability-line">
                <span className="ability-name">{ability.toUpperCase()}:</span>
                <span className="ability-score">{score}</span>
                <span className="ability-modifier">
                  ({calculateAbilityModifier(score) >= 0 ? '+' : ''}{calculateAbilityModifier(score)})
                </span>
              </div>
            ))}
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
      <div className="character-creation-modal" onClick={(e) => e.stopPropagation()}>
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
    </div>
  );
}