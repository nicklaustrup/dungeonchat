/**
 * PTTIndicator Component
 * Visual indicator showing push-to-talk status
 * Displays when PTT mode is active and shows if user is currently transmitting
 */

import React from 'react';
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';
import './PTTIndicator.css';

export default function PTTIndicator({ isPTTActive, keyHint = 'SPACE' }) {
  return (
    <div className={`ptt-indicator ${isPTTActive ? 'active' : ''}`}>
      <div className="ptt-indicator-icon">
        {isPTTActive ? <FaMicrophone /> : <FaMicrophoneSlash />}
      </div>
      
      <div className="ptt-indicator-text">
        <div className="ptt-indicator-label">Push to Talk</div>
        <div className="ptt-indicator-status">
          {isPTTActive ? 'Transmitting' : 'Hold to Talk'}
        </div>
      </div>
      
      <div className="ptt-key-hint">{keyHint}</div>
    </div>
  );
}
