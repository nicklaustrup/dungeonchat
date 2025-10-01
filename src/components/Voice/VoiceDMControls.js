/**
 * VoiceDMControls Component
 * DM-only controls for voice chat moderation
 */

import React, { useState } from 'react';
import { useFirebase } from '../../services/FirebaseContext';
import { FaMicrophoneSlash, FaMicrophone, FaUserTimes, FaVolumeUp, FaVolumeDown, FaCrown } from 'react-icons/fa';
import './VoiceDMControls.css';

function VoiceDMControls({ campaign, participants, onMuteUser, onKickUser }) {
  const { user } = useFirebase();
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [userVolumes, setUserVolumes] = useState({});

  // Check if current user is the DM
  const isDM = campaign?.dmId === user?.uid;

  if (!isDM) return null;

  const handleMuteToggle = async (participant) => {
    if (onMuteUser) {
      await onMuteUser(participant.userId, !participant.isMuted);
    }
  };

  const handleKick = async (userId) => {
    if (window.confirm('Are you sure you want to remove this user from voice chat?')) {
      if (onKickUser) {
        await onKickUser(userId);
      }
    }
  };

  const handleVolumeChange = (userId, volume) => {
    setUserVolumes(prev => ({
      ...prev,
      [userId]: volume
    }));
  };

  const toggleExpanded = (userId) => {
    setExpandedUserId(expandedUserId === userId ? null : userId);
  };

  // Filter out the DM from the participant list
  const controllableParticipants = participants.filter(p => p.userId !== user?.uid);

  if (controllableParticipants.length === 0) {
    return (
      <div className="voice-dm-controls">
        <div className="dm-header">
          <FaCrown className="dm-icon" />
          <h4>DM Controls</h4>
        </div>
        <div className="dm-empty">
          <p>No participants to manage</p>
        </div>
      </div>
    );
  }

  return (
    <div className="voice-dm-controls">
      <div className="dm-header">
        <FaCrown className="dm-icon" />
        <h4>DM Controls</h4>
        <span className="dm-badge">Dungeon Master</span>
      </div>

      <div className="dm-participants-list">
        {controllableParticipants.map(participant => {
          const volume = userVolumes[participant.userId] || 100;
          const isExpanded = expandedUserId === participant.userId;
          const displayName = participant.username || participant.displayName || 'Unknown';
          const characterName = participant.characterName;

          return (
            <div key={participant.userId} className="dm-participant">
              <div 
                className="dm-participant-main"
                onClick={() => toggleExpanded(participant.userId)}
              >
                <div className="dm-participant-avatar">
                  {participant.photoURL ? (
                    <img src={participant.photoURL} alt={displayName} />
                  ) : (
                    <div className="avatar-placeholder">
                      {displayName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>

                <div className="dm-participant-info">
                  <span className="dm-participant-name">
                    {displayName}
                    {characterName && (
                      <span className="dm-character-name"> ({characterName})</span>
                    )}
                  </span>
                  {participant.isMuted && (
                    <span className="dm-muted-badge">
                      <FaMicrophoneSlash /> Muted
                    </span>
                  )}
                </div>

                <div className="dm-quick-actions">
                  <button
                    className={`dm-btn dm-btn-mute ${participant.isMuted ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMuteToggle(participant);
                    }}
                    title={participant.isMuted ? 'Unmute' : 'Force Mute'}
                  >
                    {participant.isMuted ? <FaMicrophone /> : <FaMicrophoneSlash />}
                  </button>

                  <button
                    className="dm-btn dm-btn-kick"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleKick(participant.userId);
                    }}
                    title="Remove from Voice"
                  >
                    <FaUserTimes />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="dm-participant-expanded">
                  <div className="dm-volume-control">
                    <label>
                      <FaVolumeDown />
                      <span>Volume</span>
                      <FaVolumeUp />
                    </label>
                    <div className="dm-volume-slider-container">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) => handleVolumeChange(participant.userId, parseInt(e.target.value))}
                        className="dm-volume-slider"
                      />
                      <span className="dm-volume-value">{volume}%</span>
                    </div>
                  </div>

                  <div className="dm-participant-stats">
                    <div className="dm-stat">
                      <span className="dm-stat-label">Status:</span>
                      <span className={`dm-stat-value status-${participant.isMuted ? 'muted' : 'active'}`}>
                        {participant.isMuted ? 'Muted' : 'Active'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default VoiceDMControls;
