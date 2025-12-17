import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useFirebase } from "../../services/FirebaseContext";
import {
  getCampaignChannels,
  createCampaignChannel,
  deleteCampaignChannel,
} from "../../services/campaign/campaignService";
import "./ChannelSidebar.css";

function ChannelSidebar({ campaignId, isUserDM }) {
  const navigate = useNavigate();
  const { channelId: currentChannelId } = useParams();
  const { firestore } = useFirebase();

  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDescription, setNewChannelDescription] = useState("");
  const [newChannelVisibility, setNewChannelVisibility] = useState("all");
  const [creating, setCreating] = useState(false);
  const [expandedChannels, setExpandedChannels] = useState(
    new Set(["general"])
  );

  useEffect(() => {
    if (!campaignId || !firestore) return;

    const loadChannels = async () => {
      try {
        setLoading(true);
        const channelsData = await getCampaignChannels(firestore, campaignId);

        // Sort channels by order (general first, then by display order)
        const sortedChannels = channelsData.sort((a, b) => {
          if (a.id === "general") return -1;
          if (b.id === "general") return 1;
          return (a.order || 0) - (b.order || 0);
        });

        setChannels(sortedChannels);
        setError(null);
      } catch (err) {
        console.error("Error loading channels:", err);
        setError("Failed to load channels.");
      } finally {
        setLoading(false);
      }
    };

    loadChannels();
  }, [campaignId, firestore]);

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim() || creating) return;

    try {
      setCreating(true);
      const channelData = {
        name: newChannelName.trim(),
        description: newChannelDescription.trim(),
        type: "text",
        visibility: newChannelVisibility,
        order: channels.length, // Add to end
      };

      const newChannel = await createCampaignChannel(
        firestore,
        campaignId,
        channelData
      );
      setChannels((prev) => [...prev, newChannel]);

      // Reset form
      setNewChannelName("");
      setNewChannelDescription("");
      setNewChannelVisibility("all");
      setShowCreateModal(false);
    } catch (err) {
      console.error("Error creating channel:", err);
      setError("Failed to create channel. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteChannel = async (channelId) => {
    if (
      !isUserDM ||
      !window.confirm(
        "Are you sure you want to delete this channel? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteCampaignChannel(firestore, campaignId, channelId);
      setChannels((prev) => prev.filter((channel) => channel.id !== channelId));
    } catch (err) {
      console.error("Error deleting channel:", err);
      setError("Failed to delete channel. Please try again.");
    }
  };

  const handleJoinChannel = (channelId) => {
    navigate(`/campaign/${campaignId}/chat/${channelId}`);
  };

  const toggleChannelExpand = (channelId) => {
    setExpandedChannels((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(channelId)) {
        newSet.delete(channelId);
      } else {
        newSet.add(channelId);
      }
      return newSet;
    });
  };

  const getChannelIcon = (type) => {
    switch (type) {
      case "text":
        return "#️⃣";
      case "voice":
        return "🔊";
      case "dice":
        return "🎲";
      default:
        return "#️⃣";
    }
  };

  const getVisibilityIcon = (visibility) => {
    switch (visibility) {
      case "all":
        return "👥";
      case "players-only":
        return "🎭";
      case "dm-only":
        return "👑";
      default:
        return "👥";
    }
  };

  const getVisibilityLabel = (visibility) => {
    switch (visibility) {
      case "all":
        return "All Members";
      case "players-only":
        return "Players Only";
      case "dm-only":
        return "DM Only";
      default:
        return "All Members";
    }
  };

  if (loading) {
    return (
      <div className="channel-sidebar">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading channels...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="channel-sidebar">
      <div className="channel-header">
        <h3>Campaign Channels</h3>
        {isUserDM && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary btn-sm"
          >
            + New Channel
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      <div className="channel-list">
        {channels.map((channel) => {
          const isActive =
            currentChannelId === channel.id ||
            (!currentChannelId && channel.id === "general");
          const isExpanded = expandedChannels.has(channel.id);

          return (
            <div
              key={channel.id}
              className={`channel-item ${isActive ? "active" : ""}`}
            >
              <div
                className="channel-info"
                onClick={() => handleJoinChannel(channel.id)}
              >
                <div className="channel-icon">
                  {getChannelIcon(channel.type)}
                </div>
                <div className="channel-details">
                  <div className="channel-name">
                    {channel.name}
                    {isActive && <span className="active-indicator">●</span>}
                  </div>
                  <div className="channel-meta">
                    <span
                      className="visibility-badge"
                      title={getVisibilityLabel(channel.visibility)}
                    >
                      {getVisibilityIcon(channel.visibility)}
                    </span>
                    {channel.messageCount > 0 && (
                      <span className="message-count">
                        {channel.messageCount} messages
                      </span>
                    )}
                  </div>
                  {channel.description && isExpanded && (
                    <div className="channel-description">
                      {channel.description}
                    </div>
                  )}
                </div>

                <div className="channel-actions">
                  {channel.description && (
                    <button
                      className="expand-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleChannelExpand(channel.id);
                      }}
                      title={isExpanded ? "Collapse" : "Expand"}
                    >
                      {isExpanded ? "▼" : "▶"}
                    </button>
                  )}

                  {isUserDM && channel.id !== "general" && (
                    <button
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteChannel(channel.id);
                      }}
                      title="Delete Channel"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {channels.length === 0 && (
          <div className="empty-state">
            <p>No channels found.</p>
            {isUserDM && <p>Create your first channel to get started!</p>}
          </div>
        )}
      </div>

      {/* Create Channel Modal */}
      {showCreateModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowCreateModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Channel</h3>
            <form onSubmit={handleCreateChannel}>
              <div className="form-group">
                <label htmlFor="channelName">Channel Name</label>
                <input
                  type="text"
                  id="channelName"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="Enter channel name..."
                  maxLength={50}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="channelDescription">
                  Description (Optional)
                </label>
                <textarea
                  id="channelDescription"
                  value={newChannelDescription}
                  onChange={(e) => setNewChannelDescription(e.target.value)}
                  placeholder="What's this channel for?"
                  maxLength={200}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="channelVisibility">Visibility</label>
                <select
                  id="channelVisibility"
                  value={newChannelVisibility}
                  onChange={(e) => setNewChannelVisibility(e.target.value)}
                >
                  <option value="all">👥 All Members</option>
                  <option value="players-only">🎭 Players Only</option>
                  <option value="dm-only">👑 DM Only</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!newChannelName.trim() || creating}
                >
                  {creating ? "Creating..." : "Create Channel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChannelSidebar;
