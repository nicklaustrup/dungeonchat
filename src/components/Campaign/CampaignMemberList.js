import React, { useState } from 'react';
import { useFirebase } from '../../services/FirebaseContext';
import { updateCampaignMember, removeCampaignMember } from '../../services/campaign/campaignService';
import './CampaignMemberList.css';

function CampaignMemberList({ campaignId, members, isUserDM, onMembersUpdate }) {
  const { firestore } = useFirebase();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleMemberAction = async (memberId, action, newStatus = null) => {
    if (!isUserDM) return;

    try {
      setLoading(true);
      setError(null);

      if (action === 'remove') {
        await removeCampaignMember(firestore, campaignId, memberId);
        // Update local state
        const updatedMembers = members.filter(member => member.userId !== memberId);
        onMembersUpdate(updatedMembers);
      } else if (action === 'updateStatus' && newStatus) {
        await updateCampaignMember(firestore, campaignId, memberId, { status: newStatus });
        // Update local state
        const updatedMembers = members.map(member => 
          member.userId === memberId ? { ...member, status: newStatus } : member
        );
        onMembersUpdate(updatedMembers);
      }
    } catch (err) {
      console.error('Error updating member:', err);
      setError('Failed to update member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'dm': return '👑';
      case 'player': return '🎭';
      case 'spectator': return '👁️';
      default: return '👤';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#22c55e';
      case 'pending': return '#f59e0b';
      case 'invited': return '#3b82f6';
      case 'banned': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Sort members: DM first, then by role, then by display name
  const sortedMembers = [...members].sort((a, b) => {
    if (a.role === 'dm') return -1;
    if (b.role === 'dm') return 1;
    if (a.role !== b.role) {
      const roleOrder = { player: 0, spectator: 1 };
      return (roleOrder[a.role] || 2) - (roleOrder[b.role] || 2);
    }
    
    // Get display name for sorting
    const getDisplayName = (member) => {
      if (member.role === 'dm') {
        return member.username || member.displayName || 'Unknown DM';
      } else {
        return member.characterName || member.username || member.displayName || 'Unknown Player';
      }
    };
    
    return getDisplayName(a).localeCompare(getDisplayName(b));
  });

  return (
    <div className="campaign-member-list">
      <div className="member-list-header">
        <h3>Campaign Members</h3>
        <span className="member-count">{members.length} members</span>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      <div className="member-list">
        {sortedMembers.map(member => (
          <div key={member.userId} className="member-item">
            <div className="member-info">
              <div className="member-avatar">
                <span className="role-icon" title={member.role}>
                  {getRoleIcon(member.role)}
                </span>
              </div>
              <div className="member-details">
                <div className="member-name">
                  {member.role === 'dm' 
                    ? (member.username || member.displayName || 'Unknown DM')
                    : (member.characterName || member.username || member.displayName || 'Unknown Player')
                  }
                  {member.role === 'dm' && <span className="dm-badge">DM</span>}
                </div>
                {member.role !== 'dm' && (
                  <div className="character-info">
                    {member.characterName ? (
                      <>
                        <span className="character-label">Character:</span> {member.characterName}
                        {member.characterClass && ` (${member.characterClass})`}
                      </>
                    ) : (
                      <span className="no-character">No character name set</span>
                    )}
                  </div>
                )}
                <div className="member-meta">
                  <span 
                    className="member-status-indicator"
                    style={{ backgroundColor: getStatusColor(member.status) }}
                    title={member.status}
                  >
                    {member.status}
                  </span>
                  {member.joinedAt && (
                    <span className="joined-date">
                      Joined {member.joinedAt.toDate().toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {isUserDM && member.role !== 'dm' && (
              <div className="member-actions">
                {member.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleMemberAction(member.userId, 'updateStatus', 'active')}
                      className="btn btn-sm btn-success"
                      disabled={loading}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleMemberAction(member.userId, 'remove')}
                      className="btn btn-sm btn-danger"
                      disabled={loading}
                    >
                      Reject
                    </button>
                  </>
                )}
                
                {member.status === 'active' && (
                  <>
                    <button
                      onClick={() => handleMemberAction(member.userId, 'updateStatus', 'banned')}
                      className="btn btn-sm btn-warning"
                      disabled={loading}
                    >
                      Ban
                    </button>
                    <button
                      onClick={() => handleMemberAction(member.userId, 'remove')}
                      className="btn btn-sm btn-danger"
                      disabled={loading}
                    >
                      Remove
                    </button>
                  </>
                )}

                {member.status === 'banned' && (
                  <>
                    <button
                      onClick={() => handleMemberAction(member.userId, 'updateStatus', 'active')}
                      className="btn btn-sm btn-success"
                      disabled={loading}
                    >
                      Unban
                    </button>
                    <button
                      onClick={() => handleMemberAction(member.userId, 'remove')}
                      className="btn btn-sm btn-danger"
                      disabled={loading}
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}

        {members.length === 0 && (
          <div className="empty-state">
            <p>No members found.</p>
          </div>
        )}
      </div>

      <div className="member-list-footer">
        <div className="legend">
          <h4>Role Legend</h4>
          <div className="legend-items">
            <span className="legend-item">
              <span className="role-icon">👑</span> Dungeon Master
            </span>
            <span className="legend-item">
              <span className="role-icon">🎭</span> Player
            </span>
            <span className="legend-item">
              <span className="role-icon">👁️</span> Spectator
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CampaignMemberList;