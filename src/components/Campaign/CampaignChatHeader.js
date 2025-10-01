import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHeadphones, FaTimes, FaMinus, FaExpand } from 'react-icons/fa';
import VoiceChatPanel from '../Voice/VoiceChatPanel';
import './CampaignChatHeader.css';

function CampaignChatHeader({ campaign, channelName = 'General', onBackToDashboard }) {
  const navigate = useNavigate();
  const [showVoicePanel, setShowVoicePanel] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = React.useRef({ x: 0, y: 0 });

  const handleBackClick = () => {
    if (onBackToDashboard) {
      onBackToDashboard();
    } else if (campaign?.id) {
      navigate(`/campaign/${campaign.id}`);
    }
  };

  const handleDragStart = (e) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      
      setPosition(prev => ({
        x: Math.max(0, Math.min(window.innerWidth - 380, prev.x + deltaX)),
        y: Math.max(0, Math.min(window.innerHeight - 100, prev.y + deltaY))
      }));
      
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (!campaign) return null;

  return (
    <>
      <div className="campaign-chat-header">
        <div className="campaign-chat-header-content">
          <button
            className="back-to-dashboard-btn"
            onClick={handleBackClick}
            title="Back to Campaign Dashboard"
          >
            ← Dashboard
          </button>

          <div className="campaign-info">
            <h2 className="campaign-name">{campaign.name}</h2>
            <span className="channel-name">#{channelName}</span>
          </div>

          <div className="campaign-meta">
            <button
              className={`voice-toggle-btn ${showVoicePanel ? 'active' : ''}`}
              onClick={() => setShowVoicePanel(!showVoicePanel)}
              title={showVoicePanel ? 'Close Voice Chat' : 'Open Voice Chat'}
            >
              <FaHeadphones />
              <span className="voice-label">Voice</span>
            </button>
            <span className="member-count">
              {campaign.currentPlayers || 0} members
            </span>
          </div>
        </div>
      </div>

      {/* Floating voice panel in chat */}
      {showVoicePanel && (
        <div 
          className={`floating-voice-panel ${isDragging ? 'dragging' : ''}`}
          onMouseDown={handleDragStart}
          style={{
            top: `${position.y}px`,
            left: `${position.x}px`,
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
        >
          <div className="floating-voice-header">
            <h3>🎙️ Voice Chat</h3>
            <div className="floating-voice-actions">
              <button
                className="btn-voice-action"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(!isMinimized);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                title={isMinimized ? "Maximize" : "Minimize"}
              >
                {isMinimized ? <FaExpand /> : <FaMinus />}
              </button>
              <button
                className="btn-voice-action"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowVoicePanel(false);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                title="Close"
              >
                <FaTimes />
              </button>
            </div>
          </div>
          <VoiceChatPanel
            campaignId={campaign.id}
            roomId="voice-general"
            isFloating={true}
            isMinimized={isMinimized}
            onMinimizeChange={setIsMinimized}
          />
        </div>
      )}
    </>
  );
}

export default CampaignChatHeader;