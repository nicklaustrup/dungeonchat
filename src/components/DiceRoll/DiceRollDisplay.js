import React from 'react';
import { isCriticalHit, isCriticalFail, getRollDisplayClass } from '../../services/diceService';
import './DiceRollDisplay.css';

function DiceRollDisplay({ rollResult, playerName, timestamp, mode = 'full' }) {
  // Add null checks to prevent runtime errors
  if (!rollResult || typeof rollResult !== 'object') {
    return (
      <div className="dice-roll-error">
        <span>⚠️ Invalid dice roll data</span>
      </div>
    );
  }

  const rollClass = getRollDisplayClass(rollResult);
  const isCrit = isCriticalHit(rollResult);
  const isFail = isCriticalFail(rollResult);
  const compact = mode === 'compact';
  
  if (compact) {
    return (
      <div className={`dice-roll-compact ${rollClass}`}>
        <span className="roll-notation">{rollResult.notation || 'N/A'}</span>
        <span className="roll-result">{rollResult.total || 0}</span>
        {isCrit && <span className="crit-indicator">🔥</span>}
        {isFail && <span className="fail-indicator">💀</span>}
      </div>
    );
  }

  return (
    <div className={`dice-roll-display ${rollClass}`}>
      <div className="roll-header">
        <div className="roll-player">
          <span className="dice-icon">🎲</span>
          <span className="player-name">{playerName}</span>
          <span className="roll-action">rolled</span>
          <span className="roll-notation">{rollResult.notation || 'N/A'}</span>
        </div>
        {timestamp && (
          <span className="roll-timestamp">
            {new Date(timestamp).toLocaleTimeString()}
          </span>
        )}
      </div>
      
      <div className="roll-result-section">
        <div className="result-main">
          <span className="result-label">Result:</span>
          <span className="result-value">{rollResult.total || 0}</span>
          
          {(isCrit || isFail) && (
            <div className="special-result">
              {isCrit && (
                <span className="critical-hit">
                  🔥 CRITICAL HIT!
                </span>
              )}
              {isFail && (
                <span className="critical-fail">
                  💀 CRITICAL FAIL!
                </span>
              )}
            </div>
          )}
        </div>
        
        {((rollResult.individual && rollResult.individual.length > 1) || (rollResult.modifier && rollResult.modifier !== 0)) && (
          <div className="result-breakdown">
            <span className="breakdown-label">Breakdown:</span>
            <span className="breakdown-text">{rollResult.breakdown || 'N/A'}</span>
          </div>
        )}
        
        {rollResult.individual && rollResult.individual.length > 1 && (
          <div className="individual-rolls">
            <span className="individual-label">Individual rolls:</span>
            <div className="dice-results">
              {rollResult.individual.map((roll, index) => (
                <span 
                  key={index} 
                  className={`die-result ${roll === Math.max(...rollResult.individual) ? 'max-roll' : ''} ${roll === 1 ? 'min-roll' : ''}`}
                >
                  {roll}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Component for displaying roll history/statistics
export function DiceRollHistory({ rolls, maxDisplayed = 10, showChannelNames = false }) {
  const recentRolls = rolls.slice(-maxDisplayed).reverse();
  
  if (recentRolls.length === 0) {
    return (
      <div className="dice-history-empty">
        <h4>🎲 No Dice Rolls Yet</h4>
        <p>No dice rolls yet. Use the dice roller or type <code>/roll 1d20</code> in chat!</p>
      </div>
    );
  }

  return (
    <div className="dice-roll-history">
      <h4>Recent Rolls ({recentRolls.length})</h4>
      <div className="history-list">
        {recentRolls.map((roll, index) => (
          <div key={roll.id || index} className="history-item">
            {showChannelNames && roll.channelName && (
              <div className="channel-indicator">
                {roll.channelName}
              </div>
            )}
            <DiceRollDisplay 
              rollData={roll.rollData}
              playerName={roll.playerName}
              timestamp={roll.timestamp}
              compact={true}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// Component for inline dice rolling in chat input
export function InlineDiceRoll({ notation, onRoll }) {
  return (
    <button 
      className="inline-dice-button"
      onClick={() => onRoll(notation)}
      title={`Roll ${notation}`}
    >
      🎲 {notation}
    </button>
  );
}

export default DiceRollDisplay;