import React, { useState, useEffect, useContext } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { FirebaseContext } from "../../../services/FirebaseContext";
import TokenPalette from "../TokenManager/TokenPalette";
import { tokenService } from "../../../services/vtt/tokenService";
import "./EncounterBuilder.css";

/**
 * EncounterBuilder - DM tool for pre-staging encounters
 * Create tokens off-screen, then reveal them to players
 */
function EncounterBuilder({ campaignId, mapId }) {
  const { firestore } = useContext(FirebaseContext);
  const [stagingTokens, setStagingTokens] = useState([]);

  // Load staged tokens from Firestore
  useEffect(() => {
    if (!firestore || !campaignId || !mapId) return;

    const tokensRef = collection(
      firestore,
      "campaigns",
      campaignId,
      "vtt",
      mapId,
      "tokens"
    );
    const q = query(tokensRef, where("staged", "==", true));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tokens = [];
      snapshot.forEach((doc) => {
        tokens.push({ id: doc.id, ...doc.data() });
      });
      setStagingTokens(tokens);
    });

    return () => unsubscribe();
  }, [firestore, campaignId, mapId]);

  const handleCreateStagingToken = async (tokenData) => {
    if (!mapId) return;

    try {
      const stagingToken = {
        ...tokenData,
        hidden: false,
        position: { x: 200, y: 200 },
        staged: true,
      };

      await tokenService.createToken(
        firestore,
        campaignId,
        mapId,
        stagingToken
      );
    } catch (err) {
      console.error("Error creating staging token:", err);
    }
  };

  const handleRevealToken = async (token) => {
    try {
      await tokenService.updateToken(firestore, campaignId, mapId, token.id, {
        staged: false,
      });
    } catch (err) {
      console.error("Error revealing token:", err);
    }
  };

  const handleDeleteStagedToken = async (tokenId) => {
    try {
      await tokenService.deleteToken(firestore, campaignId, mapId, tokenId);
    } catch (err) {
      console.error("Error deleting staged token:", err);
    }
  };

  return (
    <div className="encounter-builder">
      <div className="panel-header">
        <h3>⚔️ Encounter Builder</h3>
      </div>

      <div className="panel-content">
        <div className="encounter-info">
          <p>
            Pre-build encounters and stage them before revealing to players.
          </p>
        </div>

        {!mapId ? (
          <div className="no-map-warning">
            <p>⚠️ Select a map first to build encounters</p>
          </div>
        ) : (
          <>
            <div className="staging-area">
              <h4>Staged Tokens ({stagingTokens.length})</h4>
              {stagingTokens.length === 0 ? (
                <div className="empty-staging">
                  <p>No tokens staged yet</p>
                  <small>Create tokens below to stage them</small>
                </div>
              ) : (
                <div className="staged-token-list">
                  {stagingTokens.map((token) => (
                    <div key={token.id} className="staged-token-item">
                      <div
                        className="token-color-preview"
                        style={{ backgroundColor: token.color }}
                      />
                      <span className="token-name">{token.name}</span>
                      <span className="token-type">{token.type}</span>
                      <button
                        className="reveal-button"
                        onClick={() => handleRevealToken(token)}
                        title="Add to map"
                      >
                        ✓ Add
                      </button>
                      <button
                        className="delete-button"
                        onClick={() => handleDeleteStagedToken(token.id)}
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="encounter-creator">
              <h4>Create Encounter Tokens</h4>
              <TokenPalette
                onCreateToken={handleCreateStagingToken}
                isCreating={false}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default EncounterBuilder;
