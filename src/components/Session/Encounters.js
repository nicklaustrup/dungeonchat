import React, { useState } from 'react';
import EncounterLibrary from './EncounterLibrary';
import EncounterBuilder from './EncounterBuilder';
import './Encounters.css';

/**
 * Encounters Component
 * Main component for encounter management combining library and builder
 */
function Encounters({ campaignId }) {
  const [editingEncounter, setEditingEncounter] = useState(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [activeEncounter, setActiveEncounter] = useState(null);

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
    // Could navigate to initiative tracker or show encounter running UI
    console.log('Started encounter:', encounter);
  };

  return (
    <div className="encounters-container">
      <EncounterLibrary
        campaignId={campaignId}
        onEditEncounter={handleEditEncounter}
        onStartEncounter={handleStartEncounter}
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
