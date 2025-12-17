import React from "react";
import "./SessionNotes.css";

/**
 * SessionNotes - Shared notes for the session
 * DM and players can take notes during play
 */
function SessionNotes({ campaignId, isUserDM }) {
  return (
    <div className="session-notes">
      <div className="panel-header">
        <h3>📝 Session Notes</h3>
      </div>
      <div className="panel-content">
        <div className="notes-placeholder">
          <p>Session notes feature coming soon!</p>
          <small>Take collaborative notes during your session</small>
        </div>
        <textarea
          className="notes-editor"
          placeholder="Take notes during the session..."
          disabled
        />
      </div>
    </div>
  );
}

export default SessionNotes;
