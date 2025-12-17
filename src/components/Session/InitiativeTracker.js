import React, { useState, useEffect, useCallback } from "react";
import { onSnapshot } from "firebase/firestore";
import { useFirebase } from "../../services/FirebaseContext";
import { useCampaign } from "../../contexts/CampaignContext";
import { initiativeService } from "../../services/initiativeService";
import "./InitiativeTracker.css";

const InitiativeTracker = ({ campaignId, onClose }) => {
  const { firestore, user } = useFirebase();
  const { currentCampaign } = useCampaign();

  const [combatants, setCombatants] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [round, setRound] = useState(1);
  const [isActive, setIsActive] = useState(false);
  const [collectingInitiative, setCollectingInitiative] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddCombatant, setShowAddCombatant] = useState(false);
  const [newCombatantName, setNewCombatantName] = useState("");
  const [newCombatantInitiative, setNewCombatantInitiative] = useState("");
  const [newCombatantHP, setNewCombatantHP] = useState("");
  const [newCombatantType, setNewCombatantType] = useState("character");

  // Check if user is DM
  const isDM = currentCampaign?.dmId === user?.uid;

  // Load initiative data
  useEffect(() => {
    if (!campaignId || !firestore) return;

    try {
      const initiativeRef = initiativeService.getInitiativeRef(
        firestore,
        campaignId
      );
      const unsubscribe = onSnapshot(
        initiativeRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            setCombatants(data.combatants || []);
            setCurrentTurn(data.currentTurn || 0);
            setRound(data.round || 1);
            setIsActive(data.isActive || false);
            setCollectingInitiative(!!data.collectingInitiative);
          } else {
            // Initialize empty initiative tracker
            setCombatants([]);
            setCurrentTurn(0);
            setRound(1);
            setIsActive(false);
          }
          setLoading(false);
        },
        (error) => {
          console.error("Error loading initiative data:", error);
          setError("Failed to load initiative tracker: " + error.message);
          setLoading(false);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error("Error setting up initiative listener:", error);
      setError("Failed to initialize initiative tracker: " + error.message);
      setLoading(false);
    }
  }, [campaignId, firestore]);

  // Start combat
  const handleStartCombat = useCallback(async () => {
    if (!isDM || combatants.length === 0) return;

    try {
      await initiativeService.startCombat(firestore, campaignId);
      // Clear collection phase flag
      setCollectingInitiative(false);
    } catch (error) {
      console.error("Error starting combat:", error);
      setError("Failed to start combat");
    }
  }, [firestore, campaignId, isDM, combatants.length]);

  // Begin initiative collection
  const handleInitiateCollection = useCallback(async () => {
    if (!isDM) return;
    try {
      await initiativeService.initiateInitiativeCheck(firestore, campaignId);
    } catch (error) {
      console.error("Error initiating initiative check:", error);
      setError("Failed to initiate initiative collection");
    }
  }, [firestore, campaignId, isDM]);

  const handleCancelCollection = useCallback(async () => {
    if (!isDM) return;
    try {
      await initiativeService.cancelInitiativeCollection(firestore, campaignId);
    } catch (error) {
      console.error("Error cancelling initiative collection:", error);
      setError("Failed to cancel initiative collection");
    }
  }, [firestore, campaignId, isDM]);

  // End combat
  const handleEndCombat = useCallback(async () => {
    if (!isDM) return;

    try {
      await initiativeService.endCombat(firestore, campaignId);
    } catch (error) {
      console.error("Error ending combat:", error);
      setError("Failed to end combat");
    }
  }, [firestore, campaignId, isDM]);

  // Next turn
  const handleNextTurn = useCallback(async () => {
    if (!isDM || !isActive) return;

    try {
      await initiativeService.nextTurn(firestore, campaignId);
    } catch (error) {
      console.error("Error advancing turn:", error);
      setError("Failed to advance turn");
    }
  }, [firestore, campaignId, isDM, isActive]);

  // Previous turn
  const handlePreviousTurn = useCallback(async () => {
    if (!isDM || !isActive) return;

    try {
      await initiativeService.previousTurn(firestore, campaignId);
    } catch (error) {
      console.error("Error going back turn:", error);
      setError("Failed to go back turn");
    }
  }, [firestore, campaignId, isDM, isActive]);

  // Add combatant
  const handleAddCombatant = useCallback(
    async (e) => {
      e.preventDefault();
      if (!isDM || !newCombatantName || !newCombatantInitiative) return;

      try {
        const combatant = {
          id: `cmb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          name: newCombatantName,
          initiative: parseInt(newCombatantInitiative),
          type: newCombatantType,
          conditions: [],
        };

        if (newCombatantHP) {
          combatant.maxHP = parseInt(newCombatantHP);
          combatant.currentHP = parseInt(newCombatantHP);
        }

        await initiativeService.addCombatant(firestore, campaignId, combatant);

        // Reset form
        setNewCombatantName("");
        setNewCombatantInitiative("");
        setNewCombatantHP("");
        setNewCombatantType("character");
        setShowAddCombatant(false);
      } catch (error) {
        console.error("Error adding combatant:", error);
        setError("Failed to add combatant");
      }
    },
    [
      firestore,
      campaignId,
      isDM,
      newCombatantName,
      newCombatantInitiative,
      newCombatantHP,
      newCombatantType,
    ]
  );

  // Remove combatant
  const handleRemoveCombatant = useCallback(
    async (combatantId) => {
      if (!isDM) return;

      try {
        await initiativeService.removeCombatant(
          firestore,
          campaignId,
          combatantId
        );
      } catch (error) {
        console.error("Error removing combatant:", error);
        setError("Failed to remove combatant");
      }
    },
    [firestore, campaignId, isDM]
  );

  // Update HP
  const handleUpdateHP = useCallback(
    async (combatantId, newHP) => {
      if (!isDM) return;

      try {
        await initiativeService.updateCombatantHP(
          firestore,
          campaignId,
          combatantId,
          newHP
        );
      } catch (error) {
        console.error("Error updating HP:", error);
        setError("Failed to update HP");
      }
    },
    [firestore, campaignId, isDM]
  );

  // Add condition
  const handleAddCondition = useCallback(
    async (combatantId, condition) => {
      if (!isDM) return;

      try {
        await initiativeService.addCondition(
          firestore,
          campaignId,
          combatantId,
          condition
        );
      } catch (error) {
        console.error("Error adding condition:", error);
        setError("Failed to add condition");
      }
    },
    [firestore, campaignId, isDM]
  );

  // Remove condition
  const handleRemoveCondition = useCallback(
    async (combatantId, condition) => {
      if (!isDM) return;

      try {
        await initiativeService.removeCondition(
          firestore,
          campaignId,
          combatantId,
          condition
        );
      } catch (error) {
        console.error("Error removing condition:", error);
        setError("Failed to remove condition");
      }
    },
    [firestore, campaignId, isDM]
  );

  if (loading) {
    return (
      <div className="initiative-tracker loading">
        <div className="loading-spinner">Loading initiative tracker...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="initiative-tracker error">
        <div className="error-message">{error}</div>
        <button onClick={() => setError(null)} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  // Sort combatants by initiative (highest first)
  const sortedCombatants = [...combatants].sort(
    (a, b) => b.initiative - a.initiative
  );
  const currentCombatant = sortedCombatants[currentTurn];

  return (
    <div className="initiative-tracker">
      <div className="initiative-header">
        <div className="tracker-title">
          <h2>Initiative Tracker</h2>
          {onClose && (
            <button onClick={onClose} className="close-button">
              ✕
            </button>
          )}
        </div>

        {isActive && (
          <div className="combat-status">
            <div className="round-info">
              <span className="round-label">Round {round}</span>
              {currentCombatant && (
                <span className="current-turn">
                  Current: {currentCombatant.name}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="initiative-content">
        {isDM && (
          <div className="dm-controls">
            {!isActive ? (
              <div className="pre-combat-controls">
                {!collectingInitiative && (
                  <button
                    onClick={handleInitiateCollection}
                    className="start-combat-button"
                  >
                    Roll Initiative
                  </button>
                )}
                {collectingInitiative && (
                  <button
                    onClick={handleStartCombat}
                    disabled={
                      combatants.length === 0 ||
                      combatants.every((c) => typeof c.initiative !== "number")
                    }
                    className="start-combat-button"
                  >
                    Start Combat
                  </button>
                )}
                {collectingInitiative && (
                  <button
                    onClick={handleCancelCollection}
                    className="end-combat-button"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={() => setShowAddCombatant(true)}
                  className="add-combatant-button"
                >
                  Add Combatant
                </button>
              </div>
            ) : (
              <div className="combat-controls">
                <button
                  onClick={handlePreviousTurn}
                  className="prev-turn-button"
                >
                  ← Previous
                </button>
                <button onClick={handleNextTurn} className="next-turn-button">
                  Next Turn →
                </button>
                <button onClick={handleEndCombat} className="end-combat-button">
                  End Combat
                </button>
              </div>
            )}
          </div>
        )}

        {/* Add Combatant Form */}
        {showAddCombatant && isDM && (
          <div className="add-combatant-form">
            <form onSubmit={handleAddCombatant}>
              <div className="acf-row acf-row-top">
                <label htmlFor="acf-name" className="acf-label">
                  Add Combatant
                </label>
                <input
                  id="acf-name"
                  type="text"
                  placeholder="Name"
                  value={newCombatantName}
                  onChange={(e) => setNewCombatantName(e.target.value)}
                  aria-label="Combatant name"
                  required
                />
                <input
                  type="number"
                  placeholder="Init"
                  value={newCombatantInitiative}
                  onChange={(e) => setNewCombatantInitiative(e.target.value)}
                  aria-label="Initiative score"
                  required
                  min="1"
                  max="30"
                />
                <input
                  type="number"
                  placeholder="HP"
                  value={newCombatantHP}
                  onChange={(e) => setNewCombatantHP(e.target.value)}
                  aria-label="Hit points (optional)"
                  min="1"
                  max="999"
                />
              </div>
              <div className="acf-row">
                <select
                  className="acf-type-select"
                  value={newCombatantType}
                  onChange={(e) => setNewCombatantType(e.target.value)}
                  aria-label="Combatant type"
                >
                  <option value="character">Player Character</option>
                  <option value="npc">NPC</option>
                  <option value="enemy">Enemy</option>
                </select>
              </div>
              <div className="acf-row acf-actions">
                <button type="submit" className="btn-primary">
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCombatant(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Empty State Message */}
        {sortedCombatants.length === 0 && (
          <div className="empty-state">
            <p>
              No combatants added yet. Click "Add Combatant" to begin setting up
              initiative order.
            </p>
          </div>
        )}

        {collectingInitiative && !isActive && (
          <div className="collection-banner">
            <p>
              Waiting for players to roll initiative in chat using{" "}
              <code>/init</code>. Enemies auto-rolled.
            </p>
          </div>
        )}

        {/* Initiative List */}
        <div className="initiative-list">
          {sortedCombatants.map((combatant, index) => (
            <CombatantCard
              key={combatant.id}
              combatant={combatant}
              isCurrentTurn={isActive && index === currentTurn}
              isDM={isDM}
              onRemove={() => handleRemoveCombatant(combatant.id)}
              onUpdateHP={(newHP) => handleUpdateHP(combatant.id, newHP)}
              onAddCondition={(condition) =>
                handleAddCondition(combatant.id, condition)
              }
              onRemoveCondition={(condition) =>
                handleRemoveCondition(combatant.id, condition)
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Individual combatant card component
const CombatantCard = ({
  combatant,
  isCurrentTurn,
  isDM,
  onRemove,
  onUpdateHP,
  onAddCondition,
  onRemoveCondition,
}) => {
  const [editingHP, setEditingHP] = useState(false);
  const [newHP, setNewHP] = useState(combatant.currentHP?.toString() || "");
  const [showConditions, setShowConditions] = useState(false);
  const [newCondition, setNewCondition] = useState("");

  const handleHPSubmit = (e) => {
    e.preventDefault();
    const hp = parseInt(newHP);
    if (!isNaN(hp) && hp >= 0) {
      onUpdateHP(hp);
      setEditingHP(false);
    }
  };

  const handleAddCondition = (e) => {
    e.preventDefault();
    if (newCondition.trim()) {
      onAddCondition(newCondition.trim());
      setNewCondition("");
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "character":
        return "👤";
      case "npc":
        return "🤝";
      case "enemy":
        return "⚔️";
      default:
        return "❓";
    }
  };

  const getHPColor = (current, max) => {
    if (!current || !max) return "";
    const ratio = current / max;
    if (ratio <= 0.25) return "critical";
    if (ratio <= 0.5) return "warning";
    return "healthy";
  };

  return (
    <div
      className={`combatant-card ${isCurrentTurn ? "current-turn" : ""} ${combatant.type}`}
    >
      <div className="combatant-header">
        <div className="combatant-info">
          <span className="combatant-icon">{getTypeIcon(combatant.type)}</span>
          <span className="combatant-name">{combatant.name}</span>
          <span className="combatant-initiative">{combatant.initiative}</span>
        </div>
        {isDM && (
          <button onClick={onRemove} className="remove-combatant">
            ✕
          </button>
        )}
      </div>

      {combatant.maxHP && (
        <div className="combatant-hp">
          {editingHP && isDM ? (
            <form onSubmit={handleHPSubmit} className="hp-edit-form">
              <input
                type="number"
                value={newHP}
                onChange={(e) => setNewHP(e.target.value)}
                min="0"
                max={combatant.maxHP}
                autoFocus
              />
              <button type="submit">✓</button>
              <button type="button" onClick={() => setEditingHP(false)}>
                ✕
              </button>
            </form>
          ) : (
            <div
              className={`hp-display ${getHPColor(combatant.currentHP, combatant.maxHP)}`}
              onClick={() => isDM && setEditingHP(true)}
            >
              <span className="hp-text">
                {combatant.currentHP}/{combatant.maxHP} HP
              </span>
              <div className="hp-bar">
                <div
                  className="hp-fill"
                  style={{
                    width: `${Math.max(0, (combatant.currentHP / combatant.maxHP) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {combatant.conditions && combatant.conditions.length > 0 && (
        <div className="combatant-conditions">
          {combatant.conditions.map((condition, index) => (
            <span key={index} className="condition-tag">
              {condition}
              {isDM && (
                <button onClick={() => onRemoveCondition(condition)}>✕</button>
              )}
            </span>
          ))}
        </div>
      )}

      {isDM && (
        <div className="combatant-actions">
          <button
            onClick={() => setShowConditions(!showConditions)}
            className="toggle-conditions"
          >
            {showConditions ? "Hide" : "Add"} Conditions
          </button>
        </div>
      )}

      {showConditions && isDM && (
        <form onSubmit={handleAddCondition} className="condition-form">
          <input
            type="text"
            placeholder="Add condition..."
            value={newCondition}
            onChange={(e) => setNewCondition(e.target.value)}
          />
          <button type="submit">Add</button>
        </form>
      )}
    </div>
  );
};

export default InitiativeTracker;
