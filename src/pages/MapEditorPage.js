import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useFirebase } from "../services/FirebaseContext";
import { useJoinedCampaigns } from "../services/cache";
import MapEditor from "../components/VTT/MapEditor/MapEditor";
import QuickCampaignCreator from "../components/VTT/QuickCampaignCreator";
import "./MapEditorPage.css";

/**
 * MapEditorPage
 * Standalone page for the Map Editor with campaign selection
 */
function MapEditorPage() {
  const { campaignId: routeCampaignId } = useParams();
  const navigate = useNavigate();
  const { user } = useFirebase();

  const [selectedCampaignId, setSelectedCampaignId] = useState(
    routeCampaignId || null
  );
  const [error, setError] = useState(null);

  // Use cached campaigns hook
  const { campaigns: userCampaigns, loading } = useJoinedCampaigns();

  // Handle campaign selection when campaigns load
  useEffect(() => {
    if (!loading && userCampaigns) {
      // If no campaign selected and user has campaigns, select the first one
      if (!selectedCampaignId && userCampaigns.length > 0) {
        setSelectedCampaignId(userCampaigns[0].id);
      } else if (!selectedCampaignId && userCampaigns.length === 0) {
        setError("You need to create a campaign first to use the Map Editor.");
      }
    }
  }, [loading, userCampaigns, selectedCampaignId]);

  const handleSave = (savedMap) => {
    console.log("Map saved:", savedMap);
  };

  const handleCampaignChange = (e) => {
    const newCampaignId = e.target.value;
    setSelectedCampaignId(newCampaignId);
  };

  const handleCreateCampaign = () => {
    navigate("/create-campaign");
  };

  if (!user) {
    return (
      <div className="map-editor-page">
        <div className="editor-message">
          <h2>Authentication Required</h2>
          <p>Please sign in to use the Map Editor.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="map-editor-page">
        <div className="editor-message">
          <p>Loading campaigns...</p>
        </div>
      </div>
    );
  }

  if (error && userCampaigns.length === 0) {
    return (
      <div className="map-editor-page">
        <div className="editor-message">
          <h2>No Campaigns Found</h2>
          <p>{error}</p>
          <button
            className="create-campaign-button"
            onClick={handleCreateCampaign}
          >
            Create Campaign
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="map-editor-page">
      {/* Campaign Selector (if not from route) */}
      {!routeCampaignId && userCampaigns.length > 1 && (
        <div className="campaign-selector-bar">
          <label htmlFor="campaign-select">Campaign:</label>
          <select
            id="campaign-select"
            value={selectedCampaignId || ""}
            onChange={handleCampaignChange}
          >
            {userCampaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedCampaignId && (
        <MapEditor campaignId={selectedCampaignId} onSave={handleSave} />
      )}

      {/* Temporary: Quick campaign creator for testing */}
      {user && userCampaigns.length === 0 && !loading && (
        <QuickCampaignCreator />
      )}
    </div>
  );
}

export default MapEditorPage;
