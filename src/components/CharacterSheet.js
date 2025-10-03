/**
 * Character Sheet Display Component
 * Full D&D 5e character sheet with all stats and interactive elements
 */
import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  calculateAbilityModifier, 
  calculateSkillModifier,
  CHARACTER_SKILLS 
} from '../models/CharacterSheet';
import './CharacterSheet.css';

export function CharacterSheet({ 
  firestore, 
  storage,
  campaignId, 
  userId, 
  onClose,
  isModal = false 
}) {
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  // Load character data
  useEffect(() => {
    if (!firestore || !campaignId || !userId) return;

    const loadCharacter = async () => {
      try {
        setLoading(true);
        setError(null);

        const characterRef = doc(firestore, 'campaigns', campaignId, 'characters', userId);
        const docSnap = await getDoc(characterRef);
        
        if (docSnap.exists()) {
          setCharacter(docSnap.data());
        } else {
          setError('Character not found');
        }
      } catch (err) {
        console.error('Error loading character:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadCharacter();
  }, [firestore, campaignId, userId]);

  const handleHitPointChange = async (newHP) => {
    if (!character || !firestore) return;

    try {
      const characterRef = doc(firestore, 'campaigns', campaignId, 'characters', userId);

      await updateDoc(characterRef, {
        currentHitPoints: newHP,
        updatedAt: new Date()
      });

      setCharacter(prev => ({
        ...prev,
        currentHitPoints: newHP
      }));
    } catch (err) {
      console.error('Error updating hit points:', err);
    }
  };

  // Handle avatar image upload
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !storage) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB');
      return;
    }

    try {
      setUploadingAvatar(true);

      // Upload to Firebase Storage
      const storageRef = ref(storage, `characters/${campaignId}/${userId}/avatar_${Date.now()}.${file.name.split('.').pop()}`);
      await uploadBytes(storageRef, file);
      const avatarUrl = await getDownloadURL(storageRef);

      // Update character sheet with new avatar URL
      const characterRef = doc(firestore, 'campaigns', campaignId, 'characters', userId);
      await updateDoc(characterRef, {
        avatarUrl,
        updatedAt: new Date()
      });

      // Update local state
      setCharacter(prev => ({
        ...prev,
        avatarUrl
      }));

      console.log('Avatar uploaded successfully:', avatarUrl);
    } catch (err) {
      console.error('Error uploading avatar:', err);
      alert('Failed to upload avatar: ' + err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Helper function to get ability score tooltips
  const getAbilityTooltip = (ability) => {
    const tooltips = {
      strength: "Strength - Measures bodily power, athletic training, and physical force you can exert",
      dexterity: "Dexterity - Measures agility, reflexes, and balance",
      constitution: "Constitution - Measures health, stamina, and vital force",
      intelligence: "Intelligence - Measures reasoning ability, memory, and analytical thinking",
      wisdom: "Wisdom - Measures awareness, intuition, and insight",
      charisma: "Charisma - Measures force of personality, leadership, and charm"
    };
    return tooltips[ability] || ability;
  };

  const renderCharacterHeader = () => (
    <div className="character-header">
      <div className="character-avatar-section">
        <div className="character-avatar" onClick={() => fileInputRef.current?.click()} style={{ cursor: 'pointer' }} title="Click to upload character portrait">
          {uploadingAvatar ? (
            <div className="avatar-uploading">⏳</div>
          ) : character.avatarUrl ? (
            <img src={character.avatarUrl} alt={character.name} />
          ) : (
            <div className="avatar-placeholder">
              <span>{character.name?.charAt(0) || '?'}</span>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarUpload}
          style={{ display: 'none' }}
        />
        {character.avatarUrl && (
          <button 
            className="remove-avatar-btn"
            onClick={async (e) => {
              e.stopPropagation();
              if (window.confirm('Remove character portrait?')) {
                try {
                  const characterRef = doc(firestore, 'campaigns', campaignId, 'characters', userId);
                  await updateDoc(characterRef, { avatarUrl: null, updatedAt: new Date() });
                  setCharacter(prev => ({ ...prev, avatarUrl: null }));
                } catch (err) {
                  console.error('Error removing avatar:', err);
                }
              }
            }}
            title="Remove portrait"
          >
            ✕
          </button>
        )}
      </div>
      <div className="character-title">
        <h1>{character.name}</h1>
        <div className="character-subtitle" title="Character level, race, and class combination">
          Level {character.level} {character.race} {character.class}
        </div>
      </div>
      
      <div className="character-details">
        <div className="detail-item">
          <label>Background</label>
          <span title="Your character's life before becoming an adventurer, providing skills and personality traits">{character.background || 'None'}</span>
        </div>
        <div className="detail-item">
          <label>Alignment</label>
          <span title="Your character's moral and ethical outlook (e.g., Lawful Good, Chaotic Neutral)">{character.alignment || 'None'}</span>
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
      <h3 title="The six core attributes that define your character's natural capabilities">Ability Scores</h3>
      <div className="ability-scores-grid">
        {Object.entries(character.abilityScores || {}).map(([ability, score]) => (
          <div key={ability} className="ability-score-block" title={getAbilityTooltip(ability)}>
            <div className="ability-name">{ability.toUpperCase()}</div>
            <div className="ability-score">{score}</div>
            <div className="ability-modifier" title="Modifier used for dice rolls and calculations">
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
        <div className="stat-block" title="How difficult you are to hit in combat (10 + Dex modifier + armor bonus)">
          <label>Armor Class</label>
          <div className="stat-value">{character.armorClass || 10}</div>
        </div>
        <div className="stat-block" title="Bonus added to initiative rolls to determine turn order in combat">
          <label>Initiative</label>
          <div className="stat-value">
            +{calculateAbilityModifier((character.abilityScores || {}).dexterity || 10)}
          </div>
        </div>
        <div className="stat-block" title="How far your character can move in a single turn (measured in feet)">
          <label>Speed</label>
          <div className="stat-value">{character.speed} ft</div>
        </div>
      </div>
      
      <div className="hit-points-section">
        <h4 title="The amount of damage your character can take before falling unconscious">Hit Points</h4>
        <div className="hit-points-display">
          <div className="hp-current" title="Current hit points - decreases when you take damage">
            <label>Current HP</label>
            <input
              type="number"
              value={character.currentHitPoints || 0}
              onChange={(e) => handleHitPointChange(parseInt(e.target.value) || 0)}
              min="0"
              max={character.hitPointMaximum || 0}
              className="hp-input"
            />
          </div>
          <div className="hp-separator">/</div>
          <div className="hp-maximum" title="Maximum hit points - your character's full health">
            <label>Max HP</label>
            <div className="hp-value">{character.hitPointMaximum || 0}</div>
          </div>
          {(character.temporaryHitPoints || 0) > 0 && (
            <div className="hp-temp" title="Temporary hit points - extra protection that's lost first">
              <label>Temp HP</label>
              <div className="hp-value">{character.temporaryHitPoints}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderSkills = () => (
    <div className="skills-section">
      <h3 title="Trained abilities that represent your character's expertise in various areas">Skills</h3>
      <div className="skills-grid">
        {Object.values(CHARACTER_SKILLS).map(skill => {
          const modifier = calculateSkillModifier(character, skill.name);
          const isProficient = (character.skillProficiencies || []).includes(skill.name);
          
          return (
            <div key={skill.name} className={`skill-item ${isProficient ? 'proficient' : ''}`} title={`${skill.name} (${skill.ability.charAt(0).toUpperCase() + skill.ability.slice(1)}) - Represents your training and natural talent in this area`}>
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
      <h3 title="Your character's ability to resist harmful effects and magical spells">Saving Throws</h3>
      <div className="saving-throws-grid">
        {Object.entries(character.abilityScores || {}).map(([ability, score]) => {
          const modifier = calculateAbilityModifier(score);
          const isProficient = (character.savingThrowProficiencies || []).includes(ability);
          const finalModifier = isProficient ? modifier + (character.proficiencyBonus || 0) : modifier;
          
          return (
            <div key={ability} className={`saving-throw-item ${isProficient ? 'proficient' : ''}`} title={`${ability.charAt(0).toUpperCase() + ability.slice(1)} saving throw - Roll this when resisting effects that target this ability`}>
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

  const renderExperience = () => {
    // Experience thresholds for D&D 5e
    const getXPForNextLevel = () => {
      const xpTable = [
        0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
        85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000
      ];
      return xpTable[character.level] || xpTable[xpTable.length - 1];
    };

    return (
      <div className="experience-section">
        <h3 title="Experience points measure your character's professional development and combat expertise">Experience</h3>
        <div className="xp-display">
          <div className="xp-current" title="Current experience points earned">
            {(character.experience || 0).toLocaleString()} XP
          </div>
          <div className="xp-bar" title="Progress toward next level">
            <div 
              className="xp-progress"
              style={{ 
                width: `${((character.experience || 0) / getXPForNextLevel()) * 100}%` 
              }}
            />
          </div>
          <div className="xp-next" title="Experience points needed to reach the next level">
            Next Level: {getXPForNextLevel().toLocaleString()} XP
          </div>
        </div>
      </div>
    );
  };

  const renderOtherStats = () => (
    <div className="other-stats-section">
      <h3>Other Stats</h3>
      <div className="other-stats-grid">
        <div className="stat-item">
          <label title="Bonus added to all ability checks, attack rolls, and saving throws when proficient">Proficiency Bonus</label>
          <span>+{character.proficiencyBonus || 2}</span>
        </div>
        <div className="stat-item">
          <label title="Your character's passive Perception score (10 + Perception modifier)">Passive Perception</label>
          <span>{10 + calculateSkillModifier(character, 'Perception')}</span>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={`character-sheet ${isModal ? 'modal-content' : ''}`}>
        {isModal && (
          <div className="modal-header">
            <h2>Character Sheet</h2>
            <button className="close-button" onClick={onClose}>×</button>
          </div>
        )}
        <div className="character-sheet-content">
          <div className="loading-state">Loading character...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`character-sheet ${isModal ? 'modal-content' : ''}`}>
        {isModal && (
          <div className="modal-header">
            <h2>Character Sheet</h2>
            <button className="close-button" onClick={onClose}>×</button>
          </div>
        )}
        <div className="character-sheet-content">
          <div className="error-state">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className={`character-sheet ${isModal ? 'modal-content' : ''}`}>
        {isModal && (
          <div className="modal-header">
            <h2>Character Sheet</h2>
            <button className="close-button" onClick={onClose}>×</button>
          </div>
        )}
        <div className="character-sheet-content">
          <div className="no-character">No character found</div>
        </div>
      </div>
    );
  }

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
            {renderOtherStats()}
          </div>
        </div>
      </div>
    </div>
  );
}