import React, { useState, useEffect } from 'react';
import { useFirebase } from '../../services/FirebaseContext';
import { useCampaign } from '../../hooks/useCampaign';
import {
  createEncounter,
  updateEncounter,
  calculateEncounterDifficulty,
  applyEncounterMultiplier
} from '../../services/encounterService';
import './EncounterBuilder.css';

/**
 * EncounterBuilder Component
 * Create and edit encounter templates with participants, effects, and scaling
 */
function EncounterBuilder({ campaignId, encounter, onClose, onSave }) {
  const { firestore, user } = useFirebase();
  const { isUserDM } = useCampaign(campaignId);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [environment, setEnvironment] = useState('');
  const [suggestedLevel, setSuggestedLevel] = useState(1);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [participants, setParticipants] = useState([]);
  const [environmentalEffects, setEnvironmentalEffects] = useState([]);
  
  const [showParticipantForm, setShowParticipantForm] = useState(false);
  const [showEffectForm, setShowEffectForm] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Load encounter data if editing
  useEffect(() => {
    if (encounter) {
      setName(encounter.name || '');
      setDescription(encounter.description || '');
      setEnvironment(encounter.environment || '');
      setSuggestedLevel(encounter.suggestedLevel || 1);
      setTags(encounter.tags || []);
      setParticipants(encounter.participants || []);
      setEnvironmentalEffects(encounter.environmentalEffects || []);
    }
  }, [encounter]);

  // Calculate encounter stats
  const totalXP = participants.reduce((sum, p) => sum + (p.xp * p.quantity), 0);
  const monsterCount = participants.reduce((sum, p) => sum + p.quantity, 0);
  const adjustedXP = Math.round(totalXP * applyEncounterMultiplier(monsterCount));
  
  // Assume party of 4 for difficulty calculation
  const partySize = 4;
  const difficulty = calculateEncounterDifficulty(adjustedXP, suggestedLevel, partySize);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Encounter name is required');
      return;
    }

    if (!isUserDM) {
      setError('Only the DM can create encounters');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const encounterData = {
        name: name.trim(),
        description: description.trim(),
        environment: environment.trim(),
        suggestedLevel,
        tags,
        participants,
        environmentalEffects,
        xpTotal: totalXP,
        difficulty,
        isTemplate: true,
        createdBy: user?.uid || null
      };

      let savedEncounter;
      if (encounter?.id) {
        // Update existing encounter
        await updateEncounter(firestore, campaignId, encounter.id, encounterData);
        savedEncounter = { ...encounter, ...encounterData };
      } else {
        // Create new encounter
        savedEncounter = await createEncounter(firestore, campaignId, encounterData);
      }

      if (onSave) {
        onSave(savedEncounter);
      }
      if (onClose) {
        onClose();
      }
    } catch (err) {
      setError('Failed to save encounter: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleAddParticipant = (participantData) => {
    const newParticipant = {
      id: `participant-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: participantData.name || 'Unknown Creature',
      type: participantData.type || 'monster',
      cr: parseFloat(participantData.cr) || 0,
      xp: parseInt(participantData.xp) || 0,
      hp: parseInt(participantData.hp) || 1,
      maxHp: parseInt(participantData.maxHp) || 1,
      ac: parseInt(participantData.ac) || 10,
      initiative: 0,
      conditions: [],
      notes: participantData.notes || '',
      quantity: parseInt(participantData.quantity) || 1
    };

    setParticipants([...participants, newParticipant]);
    setShowParticipantForm(false);
  };

  const handleUpdateParticipant = (participantId, updates) => {
    setParticipants(participants.map(p => 
      p.id === participantId ? { ...p, ...updates } : p
    ));
  };

  const handleRemoveParticipant = (participantId) => {
    setParticipants(participants.filter(p => p.id !== participantId));
  };

  const handleAddEffect = (effectData) => {
    const newEffect = {
      id: `effect-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: effectData.name || 'Unknown Effect',
      description: effectData.description || '',
      type: effectData.type || 'hazard',
      damage: effectData.damage || '',
      saveDC: effectData.saveDC ? parseInt(effectData.saveDC) : null,
      saveAbility: effectData.saveAbility || null,
      duration: effectData.duration || 'permanent',
      areaOfEffect: effectData.areaOfEffect || ''
    };

    setEnvironmentalEffects([...environmentalEffects, newEffect]);
    setShowEffectForm(false);
  };

  const handleRemoveEffect = (effectId) => {
    setEnvironmentalEffects(environmentalEffects.filter(e => e.id !== effectId));
  };

  const getDifficultyColor = (diff) => {
    switch (diff) {
      case 'trivial': return '#10b981';
      case 'easy': return '#3b82f6';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      case 'deadly': return '#7c3aed';
      default: return '#6b7280';
    }
  };

  return (
    <div className="encounter-builder-overlay">
      <div className="encounter-builder-modal">
        <div className="encounter-builder-header">
          <h2>{encounter ? 'Edit Encounter' : 'Create Encounter'}</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div className="encounter-builder-error">
            {error}
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        <div className="encounter-builder-content">
          {/* Basic Info Section */}
          <section className="builder-section">
            <h3>Basic Information</h3>
            
            <div className="form-group">
              <label htmlFor="encounter-name">Name *</label>
              <input
                id="encounter-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter encounter name..."
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="encounter-description">Description</label>
              <textarea
                id="encounter-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the encounter..."
                className="form-textarea"
                rows="3"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="encounter-environment">Environment</label>
                <input
                  id="encounter-environment"
                  type="text"
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  placeholder="e.g., Forest, Dungeon, City..."
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="encounter-level">Suggested Level</label>
                <input
                  id="encounter-level"
                  type="number"
                  min="1"
                  max="20"
                  value={suggestedLevel}
                  onChange={(e) => setSuggestedLevel(parseInt(e.target.value) || 1)}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Tags</label>
              <div className="tag-input-container">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Add tags (press Enter)..."
                  className="form-input"
                />
                <button 
                  type="button"
                  onClick={handleAddTag}
                  className="btn-add-tag"
                >
                  Add
                </button>
              </div>
              {tags.length > 0 && (
                <div className="tags-list">
                  {tags.map(tag => (
                    <span key={tag} className="tag">
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)}>✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Stats Summary */}
          <section className="builder-section stats-summary">
            <h3>Encounter Stats</h3>
            <div className="stats-grid">
              <div className="stat-box">
                <span className="stat-label">Monsters</span>
                <span className="stat-value">{monsterCount}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Total XP</span>
                <span className="stat-value">{totalXP}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Adjusted XP</span>
                <span className="stat-value">{adjustedXP}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Difficulty</span>
                <span 
                  className="stat-value difficulty-badge"
                  style={{ backgroundColor: getDifficultyColor(difficulty) }}
                >
                  {difficulty}
                </span>
              </div>
            </div>
            <p className="stats-note">
              Difficulty calculated for party of {partySize} at level {suggestedLevel}
            </p>
          </section>

          {/* Participants Section */}
          <section className="builder-section">
            <div className="section-header">
              <h3>Participants ({participants.length})</h3>
              <button 
                className="btn-add"
                onClick={() => setShowParticipantForm(true)}
              >
                + Add Monster/NPC
              </button>
            </div>

            {showParticipantForm && (
              <ParticipantForm
                onAdd={handleAddParticipant}
                onCancel={() => setShowParticipantForm(false)}
              />
            )}

            <div className="participants-list">
              {participants.map(participant => (
                <ParticipantCard
                  key={participant.id}
                  participant={participant}
                  onUpdate={(updates) => handleUpdateParticipant(participant.id, updates)}
                  onRemove={() => handleRemoveParticipant(participant.id)}
                />
              ))}
            </div>
          </section>

          {/* Environmental Effects Section */}
          <section className="builder-section">
            <div className="section-header">
              <h3>Environmental Effects ({environmentalEffects.length})</h3>
              <button 
                className="btn-add"
                onClick={() => setShowEffectForm(true)}
              >
                + Add Effect/Hazard
              </button>
            </div>

            {showEffectForm && (
              <EffectForm
                onAdd={handleAddEffect}
                onCancel={() => setShowEffectForm(false)}
              />
            )}

            <div className="effects-list">
              {environmentalEffects.map(effect => (
                <EffectCard
                  key={effect.id}
                  effect={effect}
                  onRemove={() => handleRemoveEffect(effect.id)}
                />
              ))}
            </div>
          </section>
        </div>

        <div className="encounter-builder-footer">
          <button 
            className="btn-cancel"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button 
            className="btn-save"
            onClick={handleSave}
            disabled={saving || !name.trim()}
          >
            {saving ? 'Saving...' : (encounter ? 'Update Encounter' : 'Create Encounter')}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * ParticipantForm Component
 * Form for adding a new participant (monster/NPC)
 */
function ParticipantForm({ onAdd, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'monster',
    cr: '1',
    xp: '200',
    hp: '10',
    maxHp: '10',
    ac: '12',
    quantity: '1',
    notes: ''
  });

  // CR to XP mapping (simplified)
  const crToXP = {
    '0': 10, '0.125': 25, '0.25': 50, '0.5': 100,
    '1': 200, '2': 450, '3': 700, '4': 1100, '5': 1800,
    '6': 2300, '7': 2900, '8': 3900, '9': 5000, '10': 5900,
    '11': 7200, '12': 8400, '13': 10000, '14': 11500, '15': 13000,
    '16': 15000, '17': 18000, '18': 20000, '19': 22000, '20': 25000,
    '21': 33000, '22': 41000, '23': 50000, '24': 62000, '30': 155000
  };

  const handleCRChange = (cr) => {
    setFormData({
      ...formData,
      cr,
      xp: String(crToXP[cr] || 0)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(formData);
  };

  return (
    <form className="participant-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label>Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="form-input"
            placeholder="Goblin Scout"
          />
        </div>
        <div className="form-group">
          <label>Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="form-select"
          >
            <option value="monster">Monster</option>
            <option value="npc">NPC</option>
            <option value="hazard">Hazard</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>CR</label>
          <select
            value={formData.cr}
            onChange={(e) => handleCRChange(e.target.value)}
            className="form-select"
          >
            {Object.keys(crToXP).map(cr => (
              <option key={cr} value={cr}>CR {cr}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>XP</label>
          <input
            type="number"
            value={formData.xp}
            onChange={(e) => setFormData({ ...formData, xp: e.target.value })}
            className="form-input"
            min="0"
          />
        </div>
        <div className="form-group">
          <label>Quantity</label>
          <input
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            className="form-input"
            min="1"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>HP</label>
          <input
            type="number"
            value={formData.hp}
            onChange={(e) => setFormData({ ...formData, hp: e.target.value, maxHp: e.target.value })}
            className="form-input"
            min="1"
          />
        </div>
        <div className="form-group">
          <label>AC</label>
          <input
            type="number"
            value={formData.ac}
            onChange={(e) => setFormData({ ...formData, ac: e.target.value })}
            className="form-input"
            min="1"
          />
        </div>
      </div>

      <div className="form-group">
        <label>Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="form-textarea"
          rows="2"
          placeholder="Special abilities, tactics, etc..."
        />
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn-cancel">
          Cancel
        </button>
        <button type="submit" className="btn-submit">
          Add Participant
        </button>
      </div>
    </form>
  );
}

/**
 * ParticipantCard Component
 * Display card for a participant
 */
function ParticipantCard({ participant, onUpdate, onRemove }) {
  return (
    <div className="participant-card">
      <div className="participant-header">
        <div>
          <h4>{participant.name}</h4>
          <span className="participant-type">{participant.type}</span>
        </div>
        <button className="btn-remove" onClick={onRemove}>✕</button>
      </div>
      <div className="participant-stats">
        <span>CR {participant.cr}</span>
        <span>•</span>
        <span>{participant.xp} XP</span>
        <span>•</span>
        <span>HP {participant.hp}</span>
        <span>•</span>
        <span>AC {participant.ac}</span>
        <span>•</span>
        <span>×{participant.quantity}</span>
      </div>
      {participant.notes && (
        <p className="participant-notes">{participant.notes}</p>
      )}
    </div>
  );
}

/**
 * EffectForm Component
 * Form for adding environmental effects/hazards
 */
function EffectForm({ onAdd, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'hazard',
    damage: '',
    saveDC: '',
    saveAbility: '',
    duration: 'permanent',
    areaOfEffect: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(formData);
  };

  return (
    <form className="effect-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label>Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="form-input"
            placeholder="Spiked Pit"
          />
        </div>
        <div className="form-group">
          <label>Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="form-select"
          >
            <option value="hazard">Hazard</option>
            <option value="terrain">Terrain</option>
            <option value="weather">Weather</option>
            <option value="magical">Magical</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="form-textarea"
          rows="2"
          placeholder="Describe the effect..."
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Damage</label>
          <input
            type="text"
            value={formData.damage}
            onChange={(e) => setFormData({ ...formData, damage: e.target.value })}
            className="form-input"
            placeholder="2d6 piercing"
          />
        </div>
        <div className="form-group">
          <label>Save DC</label>
          <input
            type="number"
            value={formData.saveDC}
            onChange={(e) => setFormData({ ...formData, saveDC: e.target.value })}
            className="form-input"
            placeholder="15"
          />
        </div>
        <div className="form-group">
          <label>Save Ability</label>
          <select
            value={formData.saveAbility}
            onChange={(e) => setFormData({ ...formData, saveAbility: e.target.value })}
            className="form-select"
          >
            <option value="">None</option>
            <option value="STR">STR</option>
            <option value="DEX">DEX</option>
            <option value="CON">CON</option>
            <option value="INT">INT</option>
            <option value="WIS">WIS</option>
            <option value="CHA">CHA</option>
          </select>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn-cancel">
          Cancel
        </button>
        <button type="submit" className="btn-submit">
          Add Effect
        </button>
      </div>
    </form>
  );
}

/**
 * EffectCard Component
 * Display card for an environmental effect
 */
function EffectCard({ effect, onRemove }) {
  return (
    <div className="effect-card">
      <div className="effect-header">
        <div>
          <h4>{effect.name}</h4>
          <span className="effect-type">{effect.type}</span>
        </div>
        <button className="btn-remove" onClick={onRemove}>✕</button>
      </div>
      {effect.description && (
        <p className="effect-description">{effect.description}</p>
      )}
      <div className="effect-details">
        {effect.damage && <span>Damage: {effect.damage}</span>}
        {effect.saveDC && <span>Save DC: {effect.saveDC} {effect.saveAbility}</span>}
        {effect.areaOfEffect && <span>Area: {effect.areaOfEffect}</span>}
      </div>
    </div>
  );
}

export default EncounterBuilder;
