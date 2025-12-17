import React, { useState, useEffect } from "react";
import EncounterLibrary from "./EncounterLibrary";
import EncounterBuilder from "./EncounterBuilder";
import { useFirebase } from "../../services/FirebaseContext";
import { sessionService } from "../../services/sessionService";
import "./Encounters.css";

/**
 * Encounters Component
 * Main component for encounter management combining library and builder
 */
function Encounters({ campaignId }) {
  const [editingEncounter, setEditingEncounter] = useState(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [activeEncounter, setActiveEncounter] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const { firestore } = useFirebase();

  // Load recent sessions (limit 10)
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!firestore || !campaignId) return;
      try {
        const list = await sessionService.getSessions(
          firestore,
          campaignId,
          10
        );
        if (mounted)
          setSessions(
            list.sort((a, b) => (b.sessionNumber || 0) - (a.sessionNumber || 0))
          );
      } catch (e) {
        // silent
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [firestore, campaignId]);

  const handleEditEncounter = (encounter) => {
    setEditingEncounter(encounter);
    setShowBuilder(true);
  };

  const handleCloseBuilder = () => {
    setShowBuilder(false);
    setEditingEncounter(null);
  };

  const handleSaveEncounter = (encounter) => {
    setShowBuilder(false);
    setEditingEncounter(null);
    // Library will auto-update via real-time subscription
  };

  const handleStartEncounter = (encounter) => {
    setActiveEncounter(encounter);
  };

  return (
    <div className="encounters-container">
      <div className="encounters-toolbar">
        <div className="encounters-session-link">
          <label>Link to Session:&nbsp;</label>
          <select
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
          >
            <option value="">(None)</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                #{s.sessionNumber} {s.title}
              </option>
            ))}
          </select>
        </div>
      </div>
      <EncounterLibrary
        campaignId={campaignId}
        onEditEncounter={handleEditEncounter}
        onStartEncounter={handleStartEncounter}
        sessionId={selectedSessionId || null}
        seedInitiative={true}
      />

      {showBuilder && (
        <EncounterBuilder
          campaignId={campaignId}
          encounter={editingEncounter}
          onClose={handleCloseBuilder}
          onSave={handleSaveEncounter}
        />
      )}

      {activeEncounter && (
        <div className="active-encounter-banner">
          <span className="banner-icon">⚔️</span>
          <span className="banner-text">
            Active Encounter: <strong>{activeEncounter.name}</strong>
          </span>
          <button
            className="banner-close"
            onClick={() => setActiveEncounter(null)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

export default Encounters;
