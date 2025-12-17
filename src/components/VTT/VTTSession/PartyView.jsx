import React from "react";
import "./PartyView.css";

/**
 * PartyView - Quick view of party members and their status
 * Shows characters, HP, conditions, etc.
 */
function PartyView({ campaign, isUserDM }) {
  const members = campaign?.members || [];

  return (
    <div className="party-view">
      <div className="panel-header">
        <h3>👥 Party View</h3>
        <span className="member-count">{members.length} members</span>
      </div>
      <div className="panel-content">
        <div className="party-list">
          {members.map((member) => (
            <div key={member.uid} className="party-member">
              <div className="member-avatar">
                {member.photoURL ? (
                  <img src={member.photoURL} alt={member.displayName} />
                ) : (
                  <div className="avatar-placeholder">
                    {member.displayName?.charAt(0) || "?"}
                  </div>
                )}
                <div className="online-indicator"></div>
              </div>
              <div className="member-info">
                <h4>{member.displayName || "Unknown"}</h4>
                <span className="member-role">
                  {member.uid === campaign.dmId ? "👑 DM" : "🎭 Player"}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="party-placeholder">
          <p>Character sheets coming soon!</p>
          <small>Quick view of HP, AC, conditions, and more</small>
        </div>
      </div>
    </div>
  );
}

export default PartyView;
