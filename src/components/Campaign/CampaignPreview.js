import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useFirebase } from "../../services/FirebaseContext";
import { doc, getDoc } from "firebase/firestore";
import { joinCampaign } from "../../services/campaign/campaignService";
import UserProfileModal from "../UserProfileModal/UserProfileModal";
import "./CampaignPreview.css";

function CampaignPreview() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const { firestore, user } = useFirebase();

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joining, setJoining] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);

  const loadCampaign = async () => {
    try {
      setLoading(true);
      const campaignRef = doc(firestore, "campaigns", campaignId);
      const campaignSnap = await getDoc(campaignRef);

      if (campaignSnap.exists()) {
        setCampaign({ id: campaignSnap.id, ...campaignSnap.data() });
      } else {
        setError("Campaign not found");
      }
    } catch (err) {
      console.error("Error loading campaign:", err);
      setError("Failed to load campaign");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaign();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  const isUserMember = () => {
    if (!campaign || !user) return false;
    return (
      campaign.dmId === user.uid ||
      (campaign.members && campaign.members.includes(user.uid))
    );
  };

  const handleJoinClick = () => {
    if (isUserMember()) {
      navigate(`/campaign/${campaignId}`);
    } else {
      setShowJoinModal(true);
    }
  };

  const handleJoinSubmit = async () => {
    try {
      setJoining(true);
      setError(null);
      await joinCampaign(firestore, campaignId, user.uid, {
        requestMessage: requestMessage.trim(),
      });
      navigate(`/campaign/${campaignId}`);
    } catch (err) {
      console.error("Error joining campaign:", err);
      setError("Failed to join campaign");
    } finally {
      setJoining(false);
    }
  };

  const formatTag = (tag) => {
    return tag.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="campaign-preview">
        <div className="preview-loading-container">
          <div className="preview-loading-spinner"></div>
          <p>Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (error && !campaign) {
    return (
      <div className="campaign-preview">
        <div className="preview-error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button
            onClick={() => navigate("/campaigns")}
            className="btn btn-primary"
          >
            Back to Campaigns
          </button>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return null;
  }

  const isFull = campaign.currentPlayers >= campaign.maxPlayers;
  const isMember = isUserMember();

  return (
    <div className="campaign-preview">
      <div className="preview-container">
        {/* Header with photo */}
        {campaign.campaignPhoto && (
          <div
            className="preview-header-photo"
            style={{ backgroundImage: `url(${campaign.campaignPhoto})` }}
          />
        )}

        <div className="preview-content">
          {/* Back button */}
          <button
            onClick={() => navigate("/campaigns")}
            className="btn btn-secondary preview-back-btn"
          >
            ← Back to Campaigns
          </button>

          {/* Campaign info */}
          <div className="preview-info">
            <h1>{campaign.name}</h1>

            <div className="preview-badges">
              <span className="preview-badge preview-badge-system">
                {campaign.gameSystem}
              </span>
              <span
                className={`preview-badge preview-badge-status preview-status-${campaign.status}`}
              >
                {campaign.status.charAt(0).toUpperCase() +
                  campaign.status.slice(1)}
              </span>
            </div>

            <p className="preview-description">{campaign.description}</p>

            {/* Tags */}
            {campaign.tags && campaign.tags.length > 0 && (
              <div className="preview-tags">
                {campaign.tags.map((tag) => (
                  <span key={tag} className="preview-tag">
                    {formatTag(tag)}
                  </span>
                ))}
              </div>
            )}

            {/* Campaign details */}
            <div className="preview-details">
              <div className="preview-detail-row">
                <div className="preview-detail-item">
                  <strong>Dungeon Master:</strong>
                  <span
                    className="clickable-username"
                    onClick={() => setSelectedUserId(campaign.dmId)}
                  >
                    {campaign.dmName || "Unknown"}
                  </span>
                </div>
                <div className="preview-detail-item">
                  <strong>Players:</strong>
                  <span>
                    {campaign.currentPlayers}/{campaign.maxPlayers}
                  </span>
                </div>
              </div>

              {campaign.sessionFrequency && (
                <div className="preview-detail-row">
                  <div className="preview-detail-item">
                    <strong>Session Frequency:</strong>
                    <span>{campaign.sessionFrequency}</span>
                  </div>
                </div>
              )}

              {campaign.sessionDay && (
                <div className="preview-detail-row">
                  <div className="preview-detail-item">
                    <strong>Session Day:</strong>
                    <span>{campaign.sessionDay}</span>
                  </div>
                  {campaign.sessionTime && (
                    <div className="preview-detail-item">
                      <strong>Session Time:</strong>
                      <span>
                        {campaign.sessionTime} {campaign.timeZone || ""}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="preview-detail-row">
                <div className="preview-detail-item">
                  <strong>Visibility:</strong>
                  <span>
                    {campaign.visibility === "public" ? "Public" : "Private"}
                  </span>
                </div>
                <div className="preview-detail-item">
                  <strong>Accepting Requests:</strong>
                  <span>{campaign.allowRequests ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="preview-actions">
              {isMember ? (
                <button
                  onClick={handleJoinClick}
                  className="btn btn-primary preview-btn-large"
                >
                  Open Campaign Dashboard
                </button>
              ) : (
                <button
                  onClick={handleJoinClick}
                  className="btn btn-primary preview-btn-large"
                  disabled={isFull}
                >
                  {isFull ? "Campaign Full" : "Join Campaign"}
                </button>
              )}
            </div>

            {error && <div className="preview-error-message">{error}</div>}
          </div>
        </div>
      </div>

      {/* Join Modal */}
      {showJoinModal && (
        <div
          className="preview-modal-overlay"
          onClick={() => setShowJoinModal(false)}
        >
          <div
            className="preview-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="preview-modal-header">
              <h2>Join {campaign.name}</h2>
              <button
                className="preview-modal-close"
                onClick={() => setShowJoinModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="preview-modal-body">
              <p>
                Send a request to join this campaign. Your username will be
                included automatically.
              </p>

              <div className="preview-form-group">
                <label htmlFor="requestMessage">Message (optional)</label>
                <textarea
                  id="requestMessage"
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder="Introduce yourself or explain why you'd like to join..."
                  maxLength={500}
                />
              </div>
            </div>

            <div className="preview-modal-actions">
              <button
                onClick={() => setShowJoinModal(false)}
                className="btn btn-secondary"
                disabled={joining}
              >
                Cancel
              </button>
              <button
                onClick={handleJoinSubmit}
                className="btn btn-primary"
                disabled={joining}
              >
                {joining ? "Sending Request..." : "Send Join Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          isOpen={!!selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
}

export default CampaignPreview;
