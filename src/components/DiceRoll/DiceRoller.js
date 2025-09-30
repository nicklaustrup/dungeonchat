import React, { useState } from 'react';
import { parseDiceNotation, rollDice } from '../../services/diceService';
import './DiceRoller.css';

function DiceRoller({ onRoll, isInline = false, campaignId = null }) {
  const [diceInput, setDiceInput] = useState('');
  const [isRolling, setIsRolling] = useState(false);

  const handleRoll = async () => {
    if (!diceInput.trim() || isRolling) return;

    try {
      setIsRolling(true);
      const rollData = parseDiceNotation(diceInput.trim());
      const result = rollDice(rollData);
      
      // Create roll message data with all required fields
      const rollMessage = {
        type: 'dice-roll',
        notation: diceInput.trim(),
        total: result.total,
        rollSum: result.rollSum,
        modifier: result.modifier,
        breakdown: result.breakdown,
        individual: result.individual,
        timestamp: Date.now(),
        campaignId: campaignId || null
      };

      if (onRoll) {
        onRoll(rollMessage);
      }

      // Clear input after successful roll
      setDiceInput('');
    } catch (error) {
      console.error('Error rolling dice:', error);
      // Could add error state here
    } finally {
      setIsRolling(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleRoll();
    }
  };

  const quickRolls = [
    { label: 'd20', notation: '1d20' },
    { label: 'd12', notation: '1d12' },
    { label: 'd10', notation: '1d10' },
    { label: 'd8', notation: '1d8' },
    { label: 'd6', notation: '1d6' },
    { label: 'd4', notation: '1d4' },
    { label: '2d6', notation: '2d6' },
    { label: '3d6', notation: '3d6' },
    { label: 'd20+5', notation: '1d20+5' }
  ];

  if (isInline) {
    return (
      <div className="dice-roller-inline">
        <input
          type="text"
          value={diceInput}
          onChange={(e) => setDiceInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="1d20+5"
          className="dice-input-inline"
          disabled={isRolling}
        />
        <button 
          onClick={handleRoll}
          disabled={!diceInput.trim() || isRolling}
          className="roll-button-inline"
        >
          🎲
        </button>
      </div>
    );
  }

  return (
    <div className="dice-roller">
      <div className="dice-input-section">
        <input
          type="text"
          value={diceInput}
          onChange={(e) => setDiceInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter dice notation (e.g., 1d20+5, 3d6, 2d8+2)"
          className="dice-input"
          disabled={isRolling}
        />
        <button 
          onClick={handleRoll}
          disabled={!diceInput.trim() || isRolling}
          className="roll-button"
        >
          {isRolling ? '🎲...' : '🎲 Roll'}
        </button>
      </div>

      <div className="quick-rolls">
        <span className="quick-rolls-label">Quick Rolls:</span>
        {quickRolls.map((roll) => (
          <button
            key={roll.notation}
            onClick={() => setDiceInput(roll.notation)}
            className="quick-roll-button"
            disabled={isRolling}
          >
            {roll.label}
          </button>
        ))}
      </div>

      <div className="dice-help">
        <details>
          <summary>Dice Notation Help</summary>
          <div className="help-content">
            <p><strong>Format:</strong> [number]d[sides][+/-modifier]</p>
            <ul>
              <li><code>1d20</code> - Roll one 20-sided die</li>
              <li><code>3d6</code> - Roll three 6-sided dice</li>
              <li><code>1d20+5</code> - Roll d20 and add 5</li>
              <li><code>2d8+2</code> - Roll two d8 and add 2</li>
              <li><code>1d100</code> - Roll percentile dice</li>
            </ul>
          </div>
        </details>
      </div>
    </div>
  );
}

export default DiceRoller;