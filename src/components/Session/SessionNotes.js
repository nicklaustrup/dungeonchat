import React, { useState, useEffect, useCallback } from 'react';
import { useFirebase } from '../../services/FirebaseContext';
import { useCampaign } from '../../contexts/CampaignContext';
import { sessionService } from '../../services/sessionService';
import './SessionNotes.css';

const SessionNotes = ({ campaignId }) => {
  const { firestore, user } = useFirebase();
  const { currentCampaign } = useCampaign();
  
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewSessionForm, setShowNewSessionForm] = useState(false);
  
  // Check if user is DM
  const isDM = currentCampaign?.dmId === user?.uid;
  
  // Load sessions
  useEffect(() => {
    if (!campaignId || !firestore) return;
    
    setLoading(true);
    const unsubscribe = sessionService.subscribeToSessions(
      firestore,
      campaignId,
      (sessionsData, err) => {
        if (err) {
          setError('Failed to load sessions');
          console.error('Session subscription error:', err);
        } else {
          setSessions(sessionsData);
          // Auto-select most recent session if none selected
          if (!selectedSession && sessionsData.length > 0) {
            setSelectedSession(sessionsData[0]);
          }
        }
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [campaignId, firestore, selectedSession]);
  
  // Handle create new session
  const handleCreateSession = useCallback(async (sessionData) => {
    if (!isDM) return;
    
    try {
      const nextNumber = await sessionService.getNextSessionNumber(firestore, campaignId);
      
      const newSession = {
        sessionNumber: nextNumber,
        title: sessionData.title || `Session ${nextNumber}`,
        sessionDate: new Date(),
        attendees: [],
        dmNotes: '',
        sharedNotes: '',
        highlights: [],
        tags: [],
        status: 'planned',
        createdBy: user.uid
      };
      
      const created = await sessionService.createSession(firestore, campaignId, newSession);
      setSelectedSession(created);
      setShowNewSessionForm(false);
    } catch (error) {
      console.error('Error creating session:', error);
      setError('Failed to create session');
    }
  }, [firestore, campaignId, user, isDM]);
  
  if (loading) {
    return (
      <div className="session-notes loading">
        <div className="loading-spinner">Loading sessions...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="session-notes error">
        <div className="error-message">{error}</div>
      </div>
    );
  }
  
  return (
    <div className="session-notes">
      <div className="session-notes-header">
        <h2>Session Notes</h2>
        {isDM && (
          <button 
            onClick={() => setShowNewSessionForm(true)}
            className="new-session-button"
          >
            + New Session
          </button>
        )}
      </div>
      
      <div className="session-notes-content">
        {/* Session List Sidebar */}
        <div className="session-list">
          <h3>Session History</h3>
          {sessions.length === 0 ? (
            <div className="empty-state">
              <p>No sessions yet.</p>
              {isDM && <p>Create your first session to get started!</p>}
            </div>
          ) : (
            <div className="session-items">
              {sessions.map(session => (
                <div
                  key={session.id}
                  className={`session-item ${selectedSession?.id === session.id ? 'active' : ''}`}
                  onClick={() => setSelectedSession(session)}
                >
                  <div className="session-item-number">#{session.sessionNumber}</div>
                  <div className="session-item-details">
                    <div className="session-item-title">{session.title}</div>
                    <div className="session-item-date">
                      {session.sessionDate && new Date(session.sessionDate.seconds * 1000).toLocaleDateString()}
                    </div>
                  </div>
                  {session.status && (
                    <div className={`session-status ${session.status}`}>
                      {session.status}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Session Details */}
        {selectedSession ? (
          <SessionEditor
            session={selectedSession}
            campaignId={campaignId}
            isDM={isDM}
          />
        ) : (
          <div className="no-session-selected">
            <p>Select a session from the list to view details</p>
          </div>
        )}
      </div>
      
      {/* New Session Modal */}
      {showNewSessionForm && (
        <NewSessionModal
          onClose={() => setShowNewSessionForm(false)}
          onCreate={handleCreateSession}
        />
      )}
    </div>
  );
};

// Session Editor Component
const SessionEditor = ({ session, campaignId, isDM }) => {
  const { firestore } = useFirebase();
  
  const [dmNotes, setDmNotes] = useState(session.dmNotes || '');
  const [sharedNotes, setSharedNotes] = useState(session.sharedNotes || '');
  const [saving, setSaving] = useState(false);
  const [newHighlight, setNewHighlight] = useState('');
  
  // Update local state when session changes
  useEffect(() => {
    setDmNotes(session.dmNotes || '');
    setSharedNotes(session.sharedNotes || '');
  }, [session]);
  
  // Auto-save with debounce
  useEffect(() => {
    if (!isDM) return;
    
    const timer = setTimeout(async () => {
      if (dmNotes !== (session.dmNotes || '')) {
        setSaving(true);
        try {
          await sessionService.updateDMNotes(firestore, campaignId, session.id, dmNotes);
        } catch (error) {
          console.error('Error saving DM notes:', error);
        }
        setSaving(false);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [dmNotes, firestore, campaignId, session, isDM]);
  
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (sharedNotes !== (session.sharedNotes || '')) {
        setSaving(true);
        try {
          await sessionService.updateSharedNotes(firestore, campaignId, session.id, sharedNotes);
        } catch (error) {
          console.error('Error saving shared notes:', error);
        }
        setSaving(false);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [sharedNotes, firestore, campaignId, session]);
  
  const handleAddHighlight = async () => {
    if (!newHighlight.trim() || !isDM) return;
    
    try {
      await sessionService.addHighlight(firestore, campaignId, session.id, newHighlight.trim());
      setNewHighlight('');
    } catch (error) {
      console.error('Error adding highlight:', error);
    }
  };
  
  const handleRemoveHighlight = async (index) => {
    if (!isDM) return;
    
    try {
      await sessionService.removeHighlight(firestore, campaignId, session.id, index);
    } catch (error) {
      console.error('Error removing highlight:', error);
    }
  };
  
  return (
    <div className="session-editor">
      <div className="session-editor-header">
        <h3>{session.title}</h3>
        {saving && <span className="saving-indicator">Saving...</span>}
      </div>
      
      {/* Session Info */}
      <div className="session-info">
        <div className="info-item">
          <strong>Session #{session.sessionNumber}</strong>
        </div>
        <div className="info-item">
          {session.sessionDate && new Date(session.sessionDate.seconds * 1000).toLocaleDateString()}
        </div>
        {session.attendees && session.attendees.length > 0 && (
          <div className="info-item">
            {session.attendees.length} players attended
          </div>
        )}
      </div>
      
      {/* Highlights */}
      <div className="session-highlights">
        <h4>Session Highlights</h4>
        {session.highlights && session.highlights.length > 0 ? (
          <ul className="highlights-list">
            {session.highlights.map((highlight, index) => (
              <li key={index} className="highlight-item">
                <span>{highlight}</span>
                {isDM && (
                  <button
                    onClick={() => handleRemoveHighlight(index)}
                    className="remove-highlight"
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-highlights">No highlights yet</p>
        )}
        
        {isDM && (
          <div className="add-highlight">
            <input
              type="text"
              placeholder="Add a highlight..."
              value={newHighlight}
              onChange={(e) => setNewHighlight(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddHighlight()}
            />
            <button onClick={handleAddHighlight}>Add</button>
          </div>
        )}
      </div>
      
      {/* DM Notes (Private) */}
      {isDM && (
        <div className="notes-section dm-notes">
          <h4>🔒 DM Notes (Private)</h4>
          <textarea
            value={dmNotes}
            onChange={(e) => setDmNotes(e.target.value)}
            placeholder="Private notes only you can see..."
            rows={10}
          />
        </div>
      )}
      
      {/* Shared Notes */}
      <div className="notes-section shared-notes">
        <h4>📝 Shared Notes</h4>
        {isDM ? (
          <textarea
            value={sharedNotes}
            onChange={(e) => setSharedNotes(e.target.value)}
            placeholder="Notes visible to all players..."
            rows={10}
          />
        ) : (
          <div className="notes-readonly">
            {sharedNotes || 'No shared notes yet'}
          </div>
        )}
      </div>
    </div>
  );
};

// New Session Modal Component
const NewSessionModal = ({ onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({ title });
  };
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>New Session</h3>
          <button onClick={onClose} className="close-button">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="new-session-form">
          <div className="form-group">
            <label htmlFor="session-title">Session Title</label>
            <input
              id="session-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., The Adventure Begins"
              required
            />
          </div>
          
          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SessionNotes;
