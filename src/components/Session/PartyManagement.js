import React, { useState, useEffect, useCallback } from 'react';
import { useFirebase } from '../../services/FirebaseContext';
import { useCampaign } from '../../hooks/useCampaign';
import {
  subscribeToPartyCharacters,
  calculatePartyStats,
  distributeXP,
  healParty,
  longRest,
  shortRest,
  analyzePartyComposition,
  calculatePartyWealth
} from '../../services/partyService';
import './PartyManagement.css';

/**
 * PartyManagement Component
 * 
 * Comprehensive party management system for D&D 5e campaigns.
 * Features:
 * - Real-time party statistics dashboard
 * - Character HP tracking with visual bars
 * - XP distribution (group or individual)
 * - Rest management (long rest / short rest)
 * - Party composition analysis with role detection
 * - Wealth tracking across party
 * - DM-controlled mass operations
 * - Member-view read-only statistics
 */
function PartyManagement({ campaignId }) {
  const { firestore } = useFirebase();
  const { isUserDM } = useCampaign(campaignId);
  
  // State management
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [partyStats, setPartyStats] = useState(null);
  const [composition, setComposition] = useState(null);
  const [wealth, setWealth] = useState(null);
  
  // XP distribution state
  const [showXPModal, setShowXPModal] = useState(false);
  const [xpAmount, setXpAmount] = useState('');
  const [selectedCharacters, setSelectedCharacters] = useState([]);
  
  // Healing state
  const [showHealModal, setShowHealModal] = useState(false);
  const [healAmount, setHealAmount] = useState('');
  
  // Short rest state
  const [showShortRestModal, setShowShortRestModal] = useState(false);
  const [shortRestCharacter, setShortRestCharacter] = useState(null);
  const [hitDiceToUse, setHitDiceToUse] = useState(1);

  // Subscribe to party characters
  useEffect(() => {
    if (!firestore || !campaignId) return;

    setLoading(true);
    const unsubscribe = subscribeToPartyCharacters(
      firestore,
      campaignId,
      (updatedCharacters) => {
        setCharacters(updatedCharacters);
        
        // Calculate derived statistics
        const stats = calculatePartyStats(updatedCharacters);
        setPartyStats(stats);
        
        const comp = analyzePartyComposition(updatedCharacters);
        setComposition(comp);
        
        const w = calculatePartyWealth(updatedCharacters);
        setWealth(w);
        
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, campaignId]);

  // Initialize selected characters (all by default)
  useEffect(() => {
    if (characters.length > 0 && selectedCharacters.length === 0) {
      setSelectedCharacters(characters.map(c => c.id));
    }
  }, [characters, selectedCharacters.length]);

  // XP distribution handlers
  const openXPModal = useCallback(() => {
    setShowXPModal(true);
    setXpAmount('');
    setSelectedCharacters(characters.map(c => c.id));
  }, [characters]);

  const closeXPModal = useCallback(() => {
    setShowXPModal(false);
    setXpAmount('');
  }, []);

  const handleDistributeXP = useCallback(async () => {
    const xp = parseInt(xpAmount);
    if (isNaN(xp) || xp <= 0) {
      alert('Please enter a valid XP amount');
      return;
    }

    if (selectedCharacters.length === 0) {
      alert('Please select at least one character');
      return;
    }

    try {
      await distributeXP(firestore, campaignId, xp, selectedCharacters);
      closeXPModal();
    } catch (error) {
      console.error('Error distributing XP:', error);
      alert('Failed to distribute XP. Please try again.');
    }
  }, [firestore, campaignId, xpAmount, selectedCharacters, closeXPModal]);

  const toggleCharacterSelection = useCallback((characterId) => {
    setSelectedCharacters(prev => {
      if (prev.includes(characterId)) {
        return prev.filter(id => id !== characterId);
      } else {
        return [...prev, characterId];
      }
    });
  }, []);

  const selectAllCharacters = useCallback(() => {
    setSelectedCharacters(characters.map(c => c.id));
  }, [characters]);

  const deselectAllCharacters = useCallback(() => {
    setSelectedCharacters([]);
  }, []);

  // Healing handlers
  const openHealModal = useCallback(() => {
    setShowHealModal(true);
    setHealAmount('');
  }, []);

  const closeHealModal = useCallback(() => {
    setShowHealModal(false);
    setHealAmount('');
  }, []);

  const handleHealParty = useCallback(async () => {
    const heal = parseInt(healAmount);
    if (isNaN(heal) || heal <= 0) {
      alert('Please enter a valid heal amount');
      return;
    }

    try {
      await healParty(firestore, campaignId, heal, characters.map(c => c.id));
      closeHealModal();
    } catch (error) {
      console.error('Error healing party:', error);
      alert('Failed to heal party. Please try again.');
    }
  }, [firestore, campaignId, healAmount, characters, closeHealModal]);

  // Rest handlers
  const handleLongRest = useCallback(async () => {
    if (!window.confirm('Perform a long rest for the entire party? This will restore full HP, half hit dice, and spell slots.')) {
      return;
    }

    try {
      await longRest(firestore, campaignId, characters.map(c => c.id));
    } catch (error) {
      console.error('Error performing long rest:', error);
      alert('Failed to perform long rest. Please try again.');
    }
  }, [firestore, campaignId, characters]);

  const openShortRestModal = useCallback((character) => {
    setShortRestCharacter(character);
    setHitDiceToUse(1);
    setShowShortRestModal(true);
  }, []);

  const closeShortRestModal = useCallback(() => {
    setShowShortRestModal(false);
    setShortRestCharacter(null);
    setHitDiceToUse(1);
  }, []);

  const handleShortRest = useCallback(async () => {
    if (!shortRestCharacter) return;

    try {
      await shortRest(firestore, campaignId, shortRestCharacter.id, hitDiceToUse);
      closeShortRestModal();
    } catch (error) {
      console.error('Error performing short rest:', error);
      alert('Failed to perform short rest. Please try again.');
    }
  }, [firestore, campaignId, shortRestCharacter, hitDiceToUse, closeShortRestModal]);

  // Utility functions
  const getHPPercentage = useCallback((current, max) => {
    if (!max || max === 0) return 0;
    return Math.round((current / max) * 100);
  }, []);

  const getHPColorClass = useCallback((percentage) => {
    if (percentage >= 75) return 'hp-healthy';
    if (percentage >= 50) return 'hp-wounded';
    if (percentage >= 25) return 'hp-bloodied';
    return 'hp-critical';
  }, []);

  const getRoleIcon = useCallback((role) => {
    const icons = {
      tank: '🛡️',
      healer: '❤️',
      damage: '⚔️',
      support: '✨',
      controller: '🎯'
    };
    return icons[role] || '🎲';
  }, []);

  const formatGold = useCallback((amount) => {
    return (amount || 0).toLocaleString();
  }, []);

  if (loading) {
    return <div className="party-loading">Loading party data...</div>;
  }

  if (characters.length === 0) {
    return (
      <div className="party-empty">
        <p>No characters in this campaign yet.</p>
        {isUserDM && <p>Characters will appear here once players create them.</p>}
      </div>
    );
  }

  return (
    <div className="party-management">
      {/* Party Statistics Dashboard */}
      <div className="party-dashboard">
        <div className="dashboard-header">
          <h2>Party Overview</h2>
          {isUserDM && (
            <div className="dashboard-actions">
              <button className="btn-primary" onClick={openXPModal}>
                ⭐ Award XP
              </button>
              <button className="btn-success" onClick={openHealModal}>
                ❤️ Heal Party
              </button>
              <button className="btn-secondary" onClick={handleLongRest}>
                🌙 Long Rest
              </button>
            </div>
          )}
        </div>

        {/* Overall stats */}
        {partyStats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <div className="stat-label">Party Size</div>
                <div className="stat-value">{partyStats.totalMembers}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-label">Average Level</div>
                <div className="stat-value">{partyStats.averageLevel}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">❤️</div>
              <div className="stat-content">
                <div className="stat-label">Party HP</div>
                <div className="stat-value">
                  {partyStats.currentHP} / {partyStats.totalHP}
                </div>
                <div className="stat-subtext">{partyStats.hpPercentage}%</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🛡️</div>
              <div className="stat-content">
                <div className="stat-label">Average AC</div>
                <div className="stat-value">{partyStats.averageAC}</div>
              </div>
            </div>

            {wealth && (
              <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <div className="stat-label">Party Wealth</div>
                  <div className="stat-value">{formatGold(wealth.totalGoldEquivalent)} gp</div>
                  <div className="stat-subtext">{formatGold(wealth.averagePerMember)} gp each</div>
                </div>
              </div>
            )}

            <div className="stat-card classes-card">
              <div className="stat-icon">🎭</div>
              <div className="stat-content">
                <div className="stat-label">Classes</div>
                <div className="classes-list">
                  {Object.entries(partyStats.classes).map(([className, count]) => (
                    <span key={className} className="class-badge">
                      {className} ({count})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Party Composition Analysis */}
      {composition && composition.roles && (
        <div className="party-composition">
          <h3>Party Composition</h3>
          <div className="composition-roles">
            {Object.entries(composition.roles).map(([roleName, count]) => (
              count > 0 && (
                <div key={roleName} className={`role-card ${roleName}`}>
                  <div className="role-header">
                    <span className="role-icon">{getRoleIcon(roleName)}</span>
                    <span className="role-name">{roleName.charAt(0).toUpperCase() + roleName.slice(1)}</span>
                    <span className="role-count">{count}</span>
                  </div>
                </div>
              )
            ))}
          </div>

          {/* Balance analysis */}
          {(composition.warnings.length > 0 || composition.recommendations.length > 0) && (
            <div className="composition-analysis">
              {composition.warnings.length > 0 && (
                <div className="analysis-section warnings">
                  <h4>⚠️ Warnings</h4>
                  <ul>
                    {composition.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {composition.recommendations.length > 0 && (
                <div className="analysis-section recommendations">
                  <h4>💡 Recommendations</h4>
                  <ul>
                    {composition.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Character List */}
      <div className="party-characters">
        <h3>Party Members</h3>
        <div className="characters-grid">
          {characters.map(character => {
            const hpPercentage = getHPPercentage(character.currentHP, character.maxHP);
            const hpColorClass = getHPColorClass(hpPercentage);

            return (
              <div key={character.id} className="character-card">
                <div className="character-header">
                  <div className="character-info">
                    <h4>{character.name}</h4>
                    <p className="character-class">
                      Level {character.level} {character.class}
                    </p>
                  </div>
                  {character.lastXPGain && (
                    <div className="xp-badge">
                      +{character.lastXPGain} XP
                    </div>
                  )}
                </div>

                {/* HP Bar */}
                <div className="character-hp">
                  <div className="hp-header">
                    <span className="hp-label">Hit Points</span>
                    <span className="hp-values">
                      {character.currentHP} / {character.maxHP}
                    </span>
                  </div>
                  <div className="hp-bar-container">
                    <div
                      className={`hp-bar ${hpColorClass}`}
                      style={{ width: `${hpPercentage}%` }}
                    >
                      <span className="hp-percentage">{hpPercentage}%</span>
                    </div>
                  </div>
                </div>

                {/* Character stats */}
                <div className="character-stats">
                  <div className="stat-item">
                    <span className="stat-label">AC</span>
                    <span className="stat-value">{character.armorClass || 10}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">XP</span>
                    <span className="stat-value">{(character.experience || 0).toLocaleString()}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Gold</span>
                    <span className="stat-value">{(character.gold || 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* Character actions (DM only) */}
                {isUserDM && (
                  <div className="character-actions">
                    <button
                      className="btn-small btn-secondary"
                      onClick={() => openShortRestModal(character)}
                    >
                      ☀️ Short Rest
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* XP Distribution Modal */}
      {showXPModal && (
        <div className="modal-overlay" onClick={closeXPModal}>
          <div className="modal-content party-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Award Experience Points</h3>
              <button className="modal-close" onClick={closeXPModal}>×</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>XP Amount *</label>
                <input
                  type="number"
                  value={xpAmount}
                  onChange={(e) => setXpAmount(e.target.value)}
                  placeholder="e.g., 500"
                  min="1"
                />
              </div>

              <div className="form-group">
                <div className="selection-header">
                  <label>Select Characters</label>
                  <div className="selection-actions">
                    <button className="btn-link" onClick={selectAllCharacters}>
                      Select All
                    </button>
                    <button className="btn-link" onClick={deselectAllCharacters}>
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="character-selection-list">
                  {characters.map(character => (
                    <label key={character.id} className="character-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedCharacters.includes(character.id)}
                        onChange={() => toggleCharacterSelection(character.id)}
                      />
                      <span>{character.name}</span>
                      <span className="character-level">
                        Lv {character.level} {character.class}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="xp-summary">
                <p>
                  <strong>{xpAmount || 0} XP</strong> will be awarded to{' '}
                  <strong>{selectedCharacters.length}</strong> character{selectedCharacters.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeXPModal}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleDistributeXP}>
                Award XP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Heal Party Modal */}
      {showHealModal && (
        <div className="modal-overlay" onClick={closeHealModal}>
          <div className="modal-content party-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Heal Party</h3>
              <button className="modal-close" onClick={closeHealModal}>×</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Heal Amount (HP) *</label>
                <input
                  type="number"
                  value={healAmount}
                  onChange={(e) => setHealAmount(e.target.value)}
                  placeholder="e.g., 10"
                  min="1"
                />
              </div>

              <div className="heal-summary">
                <p>
                  All party members will be healed for <strong>{healAmount || 0} HP</strong>
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeHealModal}>
                Cancel
              </button>
              <button className="btn-success" onClick={handleHealParty}>
                Heal Party
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Short Rest Modal */}
      {showShortRestModal && shortRestCharacter && (
        <div className="modal-overlay" onClick={closeShortRestModal}>
          <div className="modal-content party-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Short Rest - {shortRestCharacter.name}</h3>
              <button className="modal-close" onClick={closeShortRestModal}>×</button>
            </div>

            <div className="modal-body">
              <div className="character-rest-info">
                <p>
                  <strong>{shortRestCharacter.name}</strong> ({shortRestCharacter.class})
                </p>
                <p>Current HP: {shortRestCharacter.currentHP} / {shortRestCharacter.maxHP}</p>
              </div>

              <div className="form-group">
                <label>Hit Dice to Use</label>
                <input
                  type="number"
                  value={hitDiceToUse}
                  onChange={(e) => setHitDiceToUse(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  max={shortRestCharacter.level}
                />
                <p className="form-help">
                  Roll {hitDiceToUse} hit dice + CON modifier to restore HP
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeShortRestModal}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleShortRest}>
                Take Short Rest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PartyManagement;
