import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  calculatePartyWealth,
  updateCharacterHP
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

  // UI enhancement state
  const [minimized, setMinimized] = useState(false);
  const [detailsCollapsed, setDetailsCollapsed] = useState(false);
  const [highlightedId, setHighlightedId] = useState(null);
  const [editingHPCharacterId, setEditingHPCharacterId] = useState(null);
  const [editingHPValue, setEditingHPValue] = useState('');
  const [chipMenu, setChipMenu] = useState(null); // {x,y, character}

  // Refs to character cards for scroll/highlight
  const cardRefs = useRef({});
  const registerCardRef = useCallback((id, el) => {
    if (el) cardRefs.current[id] = el;
  }, []);

  // Close context menu on global click
  useEffect(() => {
    const handler = () => setChipMenu(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, []);

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

  const getPassivePerception = useCallback((character) => {
    if (character.passivePerception) return character.passivePerception;
    const wis = character.abilityScores?.wisdom || 10;
    const wisMod = Math.floor((wis - 10) / 2);
    const proficiency = character.proficiencyBonus || Math.ceil((character.level || 1) / 4) + 1; // rough approx
    // Assume proficient in perception if flag present
    const proficient = character.skills?.perception?.proficient || false;
    return 10 + wisMod + (proficient ? proficiency : 0);
  }, []);

  const buildChipTooltip = useCallback((ch) => {
    const subclass = ch.subclass || ch.subClass || ch.subClassName || '';
    const passive = getPassivePerception(ch);
    return `Lv ${ch.level} ${ch.class}${subclass ? ' ('+subclass+')' : ''} | PP ${passive}`;
  }, [getPassivePerception]);

  const handleChipClick = useCallback((ch) => {
    // Scroll to card and highlight
    const el = cardRefs.current[ch.id];
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedId(ch.id);
      setTimeout(() => {
        setHighlightedId(prev => (prev === ch.id ? null : prev));
      }, 1700);
    }
  }, []);

  const startInlineHPEdit = useCallback((ch) => {
    if (!isUserDM) return;
    setEditingHPCharacterId(ch.id);
    setEditingHPValue(String(ch.currentHP ?? ch.maxHP ?? ch.hitPoints ?? 0));
  }, [isUserDM]);

  const commitInlineHPEdit = useCallback(async () => {
    if (!editingHPCharacterId) return;
    const character = characters.find(c => c.id === editingHPCharacterId);
    if (!character) return;
    let val = parseInt(editingHPValue, 10);
    if (isNaN(val)) val = character.currentHP || 0;
    const maxHP = character.maxHP || character.hitPoints || 0;
    val = Math.max(0, Math.min(val, maxHP));
    try {
      await updateCharacterHP(firestore, campaignId, editingHPCharacterId, val);
    } catch (e) {
      console.error('HP update failed', e);
      alert('Failed to update HP');
    }
    setEditingHPCharacterId(null);
    setEditingHPValue('');
  }, [editingHPCharacterId, editingHPValue, characters, firestore, campaignId]);

  const cancelInlineHPEdit = useCallback(() => {
    setEditingHPCharacterId(null);
    setEditingHPValue('');
  }, []);

  const handleChipContextMenu = useCallback((e, ch) => {
    e.preventDefault();
    setChipMenu({ x: e.clientX, y: e.clientY, character: ch });
  }, []);

  const handleChipMenuAction = useCallback(async (action) => {
    if (!chipMenu) return;
    const ch = chipMenu.character;
    if (action === 'short-rest') {
      openShortRestModal(ch);
    } else if (action === 'heal') {
      const input = prompt(`Heal ${ch.name} by how many HP?`);
      if (!input) return;
      const healVal = parseInt(input, 10);
      if (isNaN(healVal) || healVal <= 0) return;
      const maxHP = ch.maxHP || ch.hitPoints || 0;
      const current = ch.currentHP ?? maxHP;
      const newHP = Math.min(current + healVal, maxHP);
      try {
        await updateCharacterHP(firestore, campaignId, ch.id, newHP);
      } catch (err) {
        console.error('Heal failed', err);
        alert('Heal failed');
      }
    }
    setChipMenu(null);
  }, [chipMenu, openShortRestModal, firestore, campaignId]);

  const toggleMinimized = useCallback(() => setMinimized(m => !m), []);
  const toggleDetailsCollapsed = useCallback(() => setDetailsCollapsed(c => !c), []);

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
    <div className={`party-management ${minimized ? 'minimized' : ''}`}>
      <div className="party-compact-header">
        <div className="pch-row">
          <h2 className="pch-title">Party</h2>
          <div className="pch-row-right">
            <button
              className="pm-btn pm-btn-toggle"
              onClick={toggleDetailsCollapsed}
              title={detailsCollapsed ? 'Expand details' : 'Collapse details'}
            >{detailsCollapsed ? '▸ Details' : '▾ Details'}</button>
            <button
              className="pm-btn pm-btn-toggle"
              onClick={toggleMinimized}
              title={minimized ? 'Expand panel' : 'Minimize panel'}
            >{minimized ? '⬜' : '🗕'}</button>
          </div>
          {isUserDM && (
            <div className="pch-actions">
              <button className="pm-btn pm-btn-xp" onClick={openXPModal}>⭐ XP</button>
              <button className="pm-btn pm-btn-heal" onClick={openHealModal}>❤️ Heal</button>
              <button className="pm-btn pm-btn-rest" onClick={handleLongRest}>🌙 Long Rest</button>
            </div>
          )}
        </div>
        <div className="member-strip">
          {characters.map(ch => {
            const pct = getHPPercentage(ch.currentHP, ch.maxHP);
            const hpClass = getHPColorClass(pct);
            return (
              <div
                key={ch.id}
                className={`member-chip ${hpClass} ${highlightedId === ch.id ? 'highlight' : ''}`}
                title={buildChipTooltip(ch)}
                onClick={() => handleChipClick(ch)}
                onContextMenu={(e) => isUserDM && handleChipContextMenu(e, ch)}
              >
                <div className="mc-top"><span className="mc-name">{ch.name}</span><span className="mc-level">L{ch.level}</span></div>
                <div className="mc-meta"><span className="mc-class">{ch.class}</span><span className="mc-ac">AC {ch.armorClass || 10}</span></div>
                <div className="mc-hp-bar">
                  <div className="mc-hp-fill" style={{width: `${pct}%`}} />
                  {editingHPCharacterId === ch.id ? (
                    <input
                      className="mc-hp-input"
                      type="number"
                      value={editingHPValue}
                      min={0}
                      max={ch.maxHP || ch.hitPoints || 0}
                      onChange={(e)=>setEditingHPValue(e.target.value)}
                      onBlur={commitInlineHPEdit}
                      onKeyDown={(e)=>{
                        if(e.key==='Enter') commitInlineHPEdit();
                        else if(e.key==='Escape') cancelInlineHPEdit();
                      }}
                      autoFocus
                    />
                  ) : (
                    <span
                      className="mc-hp-text editable"
                      onClick={(e)=>{e.stopPropagation(); startInlineHPEdit(ch);}}
                      title={isUserDM ? 'Click to edit HP' : 'HP'}
                    >{ch.currentHP}/{ch.maxHP}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {!minimized && partyStats && (
        <div className="party-overview-compact">
          <div className="po-metrics">
            <div className="po-metric"><span className="po-label">Avg Lvl</span><span className="po-value">{partyStats.averageLevel}</span></div>
            <div className="po-metric"><span className="po-label">HP</span><span className="po-value">{partyStats.currentHP}/{partyStats.totalHP} ({partyStats.hpPercentage}%)</span></div>
            <div className="po-metric"><span className="po-label">Avg AC</span><span className="po-value">{partyStats.averageAC}</span></div>
            {wealth && <div className="po-metric"><span className="po-label">Wealth</span><span className="po-value">{formatGold(wealth.totalGoldEquivalent)} gp ({formatGold(wealth.averagePerMember)} ea)</span></div>}
            <div className="po-metric classes"><span className="po-label">Classes</span><span className="po-value">{Object.entries(partyStats.classes).map(([c,n])=>`${c.slice(0,3)}×${n}`).join(' · ')}</span></div>
          </div>
        </div>
      )}
      {!minimized && composition && composition.roles && (
        <div className="party-composition compact">
          <div className="composition-inline-roles">
            {Object.entries(composition.roles).filter(([,c])=>c>0).map(([roleName,count]) => (
              <span key={roleName} className="role-pill" title={roleName}>{getRoleIcon(roleName)} {roleName.slice(0,3)}:{count}</span>
            ))}
          </div>
          {(composition.warnings.length>0 || composition.recommendations.length>0) && (
            <div className="composition-flags">
              {composition.warnings.slice(0,2).map((w,i)=>(<span key={i} className="flag warn" title={w}>⚠ {w}</span>))}
              {composition.recommendations.slice(0,2).map((r,i)=>(<span key={i} className="flag rec" title={r}>💡 {r}</span>))}
            </div>
          )}
        </div>
      )}
      {!minimized && !detailsCollapsed && (
      <div className="party-characters condensed">
        <div className="characters-grid">
          {characters.map(character => {
            const hpPercentage = getHPPercentage(character.currentHP, character.maxHP);
            const hpColorClass = getHPColorClass(hpPercentage);

            return (
              <div key={character.id} ref={(el)=>registerCardRef(character.id, el)} className={`character-card ${highlightedId===character.id ? 'highlight' : ''}`}>
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
                  <div className="character-actions inline">
                    <button
                      className="btn-tiny"
                      onClick={() => openShortRestModal(character)}
                      title="Short Rest"
                    >☀️ Rest</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>) }

      {chipMenu && isUserDM && (
        <div className="chip-context-menu" style={{ top: chipMenu.y, left: chipMenu.x }}>
          <button onClick={()=>handleChipMenuAction('short-rest')}>☀️ Short Rest</button>
          <button onClick={()=>handleChipMenuAction('heal')}>❤️ Heal...</button>
        </div>
      )}

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
