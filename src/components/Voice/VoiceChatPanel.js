/**
 * VoiceChatPanel Component
 * Main UI for voice chat in campaigns
 */

import React, { useState, useRef, useEffect } from 'react';
import { useVoiceChat } from '../../hooks/useVoiceChat';
import { useFirebase } from '../../services/FirebaseContext';
import { FaMicrophone, FaMicrophoneSlash, FaPhone, FaPhoneSlash, FaSpinner, FaVolumeUp, FaExpand } from 'react-icons/fa';
import './VoiceChatPanel.css';

function VoiceChatPanel({ campaignId, roomId = 'voice-general', isFloating = false, onNotifyJoin, isMinimized = false, onMinimizeChange }) {
  const { user } = useFirebase();
  const [volume, setVolume] = useState(100);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const hasNotifiedJoin = useRef(false);
  const {
    isConnected,
    isConnecting,
    isMuted,
    participants,
    audioLevels,
    connectionStates,
    remoteStreams,
    error,
    join,
    leave,
    toggleMute
  } = useVoiceChat(campaignId, roomId);

  // Create refs for audio elements
  const audioRefs = useRef({});

  // Attach remote streams to audio elements and set volume
  useEffect(() => {
    Object.entries(remoteStreams).forEach(([userId, stream]) => {
      if (audioRefs.current[userId] && stream) {
        const audioElement = audioRefs.current[userId];
        audioElement.srcObject = stream;
        audioElement.volume = volume / 100;
        audioElement.play().catch(err => {
          console.error(`Failed to play audio for ${userId}:`, err);
        });
      }
    });
  }, [remoteStreams, volume]);

  // Notify when user joins
  useEffect(() => {
    if (isConnected && !hasNotifiedJoin.current && onNotifyJoin && user) {
      const currentUser = participants.find(p => p.userId === user.uid);
      if (currentUser) {
        onNotifyJoin(currentUser);
        hasNotifiedJoin.current = true;
      }
    }
    if (!isConnected) {
      hasNotifiedJoin.current = false;
    }
  }, [isConnected, participants, onNotifyJoin, user]);

  const handleJoin = async () => {
    try {
      await join();
    } catch (err) {
      console.error('Failed to join voice:', err);
    }
  };

  const handleLeave = async () => {
    try {
      await leave();
    } catch (err) {
      console.error('Failed to leave voice:', err);
    }
  };

  return (
    <div 
      className={`voice-chat-panel ${isMinimized ? 'minimized' : ''}`}
    >
      {isMinimized ? (
        // Minimized bar view
        <div className="voice-minimized-bar">
          <button 
            className={`btn-toggle-mute ${isMuted ? 'muted' : ''}`}
            onClick={toggleMute}
            disabled={!isConnected}
          >
            {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
          </button>
          
          <div 
            className="volume-control"
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
          >
            <button className="btn-volume">
              <FaVolumeUp />
            </button>
            {showVolumeSlider && (
              <div className="volume-slider-container">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(parseInt(e.target.value))}
                  className="volume-slider"
                />
                <span className="volume-label">{volume}%</span>
              </div>
            )}
          </div>

          <span className="participant-count-mini">
            {participants.length} <FaPhone size={10} />
          </span>

          <button 
            className="btn-expand"
            onClick={() => onMinimizeChange?.(false)}
          >
            <FaExpand />
          </button>

          <button 
            className="btn-leave-voice"
            onClick={handleLeave}
          >
            <FaPhoneSlash />
          </button>
        </div>
      ) : (
        // Full panel view
        <>
          <div className="voice-header">
            <h3>🎙️ Voice Chat</h3>
            <div className="voice-header-actions">
              <span className="participant-count">
                {participants.length} {participants.length === 1 ? 'person' : 'people'}
              </span>
            </div>
          </div>

      {error && (
        <div className="voice-error">
          <strong>Error:</strong> {error.type === 'microphone_access_denied' 
            ? 'Microphone access denied. Please allow microphone access in your browser settings.'
            : 'Failed to connect to voice chat. Please try again.'}
        </div>
      )}

          {participants.length > 0 && (
            <div className="voice-participants">
              {participants.map(participant => {
                const audioLevel = audioLevels[participant.userId] || 0;
                const connectionState = connectionStates[participant.userId];
                const isConnecting = connectionState === 'connecting';
                
                // Get character name if available
                const characterName = participant.characterName || '';
                const username = participant.username || participant.displayName || 'Anonymous';
                const displayName = characterName 
                  ? `${username} (${characterName})`
                  : username;
                
                return (
                  <div 
                    key={participant.userId}
                    className={`participant ${participant.isSpeaking ? 'speaking' : ''}`}
                  >
                    <div className="participant-avatar">
                      {participant.photoURL ? (
                        <img src={participant.photoURL} alt={username} />
                      ) : (
                        <div className="avatar-placeholder">
                          {username?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                      {participant.isMuted && (
                        <div className="muted-indicator">
                          <FaMicrophoneSlash />
                        </div>
                      )}
                      {isConnecting && (
                        <div className="connecting-indicator">
                          <FaSpinner className="spin" />
                        </div>
                      )}
                    </div>
                    <div className="participant-info">
                      <span className="participant-name">{displayName}</span>
                      <div className="audio-level-container">
                        <div 
                          className="audio-level-bar"
                          style={{ 
                            width: `${audioLevel}%`,
                            backgroundColor: participant.isSpeaking ? '#4caf50' : '#e0e0e0'
                          }}
                        />
                      </div>
                      {connectionState && (
                        <span className={`connection-status status-${connectionState}`}>
                          {connectionState}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {participants.length === 0 && !isConnected && (
            <div className="voice-empty">
              <p>No one in voice chat yet. Be the first to join!</p>
            </div>
          )}

          <div className="voice-controls">
            {!isConnected ? (
              <button 
                className="btn-join-voice" 
                onClick={handleJoin}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <FaSpinner className="spin" /> Connecting...
                  </>
                ) : (
                  <>
                    <FaPhone /> Join Voice
                  </>
                )}
              </button>
            ) : (
              <>
                <button 
                  className={`btn-toggle-mute ${isMuted ? 'muted' : ''}`}
                  onClick={toggleMute}
                >
                  {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
                  {isMuted ? 'Unmute' : 'Mute'}
                </button>
                <button className="btn-leave-voice" onClick={handleLeave}>
                  <FaPhoneSlash /> Leave
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* Hidden audio elements for remote streams */}
      {Object.entries(remoteStreams).map(([userId, stream]) => (
        <audio
          key={userId}
          ref={el => {
            if (el) audioRefs.current[userId] = el;
          }}
          autoPlay
          playsInline
          style={{ display: 'none' }}
        />
      ))}
    </div>
  );
}

export default VoiceChatPanel;
