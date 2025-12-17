import React, { useState } from "react";
import { useFirebase } from "../../services/FirebaseContext";
import { createCampaign } from "../../services/campaign/campaignService";

/**
 * QuickCampaignCreator
 * Temporary utility component to quickly create a test campaign for VTT testing
 *
 * Usage: Import and add to any page, then remove after testing
 */
function QuickCampaignCreator() {
  const { firestore, user } = useFirebase();
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const createTestCampaign = async () => {
    if (!user) {
      setError("You must be logged in");
      return;
    }

    setCreating(true);
    setError(null);
    setResult(null);

    try {
      const campaignData = {
        name: "VTT Test Campaign",
        description: "Test campaign for Virtual Tabletop development",
        system: "D&D 5e",
        visibility: "private",
        maxPlayers: 6,
        dmId: user.uid,
      };

      const campaign = await createCampaign(firestore, campaignData, user.uid);

      setResult({
        id: campaign.id,
        name: campaign.name,
      });

      console.log("Test campaign created:", campaign);
    } catch (err) {
      console.error("Error creating campaign:", err);
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        padding: "20px",
        backgroundColor: "#1a1a1a",
        border: "2px solid #4a9eff",
        borderRadius: "8px",
        zIndex: 9999,
        maxWidth: "300px",
      }}
    >
      <h3 style={{ margin: "0 0 12px 0", color: "#fff", fontSize: "16px" }}>
        Quick Campaign Creator
      </h3>
      <p style={{ margin: "0 0 12px 0", color: "#888", fontSize: "13px" }}>
        For VTT testing only. Creates a campaign with you as DM.
      </p>

      {!result ? (
        <button
          onClick={createTestCampaign}
          disabled={creating || !user}
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: creating ? "#333" : "#4a9eff",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: creating ? "not-allowed" : "pointer",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          {creating ? "Creating..." : "Create Test Campaign"}
        </button>
      ) : (
        <div
          style={{
            padding: "12px",
            backgroundColor: "rgba(34, 197, 94, 0.1)",
            border: "1px solid rgba(34, 197, 94, 0.3)",
            borderRadius: "4px",
            color: "#22c55e",
            fontSize: "13px",
          }}
        >
          <strong>Campaign Created!</strong>
          <br />
          <span style={{ fontSize: "12px", color: "#888" }}>
            ID: {result.id}
          </span>
          <br />
          <span
            style={{ fontSize: "12px", color: "#888", wordBreak: "break-all" }}
          >
            Now reload the page to see it in the dropdown.
          </span>
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: "12px",
            padding: "10px",
            backgroundColor: "rgba(220, 38, 38, 0.1)",
            border: "1px solid rgba(220, 38, 38, 0.3)",
            borderRadius: "4px",
            color: "#ef4444",
            fontSize: "13px",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

export default QuickCampaignCreator;
