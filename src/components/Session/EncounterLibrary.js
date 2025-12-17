import React, { useState, useEffect } from "react";
import { useFirebase } from "../../services/FirebaseContext";
import { useCampaign } from "../../hooks/useCampaign";
import {
  subscribeToEncounters,
  deleteEncounter,
  duplicateEncounter,
  startEncounter,
} from "../../services/encounterService";
import { sessionService } from "../../services/sessionService";
import { initiativeService } from "../../services/initiativeService";
import "./EncounterLibrary.css";

/**
 * EncounterLibrary Component
 * Displays saved encounter templates with filtering, searching, and quick actions
 */
function EncounterLibrary({
  campaignId,
  onEditEncounter,
  onStartEncounter,
  sessionId = null,
  seedInitiative = true,
}) {
  const { firestore } = useFirebase();
  const { isUserDM } = useCampaign(campaignId);

  const [encounters, setEncounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [filterTag, setFilterTag] = useState("all");
  const [sortBy, setSortBy] = useState("recent"); // 'recent', 'name', 'difficulty', 'usage'
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Load encounters from Firestore
  useEffect(() => {
    if (!firestore || !campaignId) return;

    setLoading(true);
    const unsubscribe = subscribeToEncounters(
      firestore,
      campaignId,
      (encounterData) => {
        // Filter only templates
        const templates = encounterData.filter((e) => e.isTemplate === true);
        setEncounters(templates);
        setLoading(false);
      },
      { isTemplate: true }
    );

    return () => unsubscribe();
  }, [firestore, campaignId]);

  // Get all unique tags from encounters
  const allTags = [...new Set(encounters.flatMap((e) => e.tags || []))];

  // Filter and sort encounters
  const filteredEncounters = encounters
    .filter((encounter) => {
      // Search filter
      const matchesSearch =
        searchTerm === "" ||
        encounter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (encounter.description || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      // Difficulty filter
      const matchesDifficulty =
        filterDifficulty === "all" || encounter.difficulty === filterDifficulty;

      // Tag filter
      const matchesTag =
        filterTag === "all" || (encounter.tags || []).includes(filterTag);

      return matchesSearch && matchesDifficulty && matchesTag;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "difficulty":
          const difficultyOrder = {
            trivial: 0,
            easy: 1,
            medium: 2,
            hard: 3,
            deadly: 4,
          };
          return (
            (difficultyOrder[a.difficulty] || 0) -
            (difficultyOrder[b.difficulty] || 0)
          );
        case "usage":
          return (b.usageCount || 0) - (a.usageCount || 0);
        case "recent":
        default:
          return b.createdAt?.toMillis() - a.createdAt?.toMillis();
      }
    });

  const handleDelete = async (encounterId) => {
    if (!isUserDM) return;

    try {
      await deleteEncounter(firestore, campaignId, encounterId);
      setDeleteConfirm(null);
    } catch (err) {
      setError("Failed to delete encounter: " + err.message);
    }
  };

  const handleDuplicate = async (encounterId) => {
    if (!isUserDM) return;

    try {
      await duplicateEncounter(firestore, campaignId, encounterId);
    } catch (err) {
      setError("Failed to duplicate encounter: " + err.message);
    }
  };

  const handleStart = async (encounterId) => {
    if (!isUserDM) return;

    try {
      const activeEncounter = await startEncounter(
        firestore,
        campaignId,
        encounterId,
        sessionId || undefined
      );

      // Link to session if provided
      if (sessionId) {
        try {
          await sessionService.addEncounterReference(
            firestore,
            campaignId,
            sessionId,
            {
              encounterId: activeEncounter.id,
              name: activeEncounter.name,
              startedAt: activeEncounter.startedAt
                ? activeEncounter.startedAt.toDate?.() ||
                  activeEncounter.startedAt
                : new Date(),
              difficulty: activeEncounter.difficulty,
            }
          );
        } catch (linkErr) {
          console.error("Failed to link encounter to session:", linkErr);
        }
      }

      // Seed initiative tracker
      if (seedInitiative) {
        try {
          await initiativeService.seedFromEncounter(
            firestore,
            campaignId,
            activeEncounter
          );
        } catch (seedErr) {
          console.error("Failed to seed initiative from encounter:", seedErr);
        }
      }

      if (onStartEncounter) onStartEncounter(activeEncounter);
    } catch (err) {
      setError("Failed to start encounter: " + err.message);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "trivial":
        return "#10b981";
      case "easy":
        return "#3b82f6";
      case "medium":
        return "#f59e0b";
      case "hard":
        return "#ef4444";
      case "deadly":
        return "#7c3aed";
      default:
        return "#6b7280";
    }
  };

  if (loading) {
    return (
      <div className="encounter-library-loading">Loading encounters...</div>
    );
  }

  return (
    <div className="encounter-library">
      {error && (
        <div className="encounter-library-error">
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="encounter-library-header">
        <div className="encounter-library-title">
          <h3>Encounter Library</h3>
          <span className="encounter-count">
            {filteredEncounters.length} templates
          </span>
        </div>
        {isUserDM && (
          <button
            className="btn-create-encounter"
            onClick={() => onEditEncounter && onEditEncounter(null)}
          >
            + Create Encounter
          </button>
        )}
      </div>

      <div className="encounter-library-filters">
        <div className="filter-row">
          <input
            type="text"
            className="search-input"
            placeholder="Search encounters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="recent">Most Recent</option>
            <option value="name">Name (A-Z)</option>
            <option value="difficulty">Difficulty</option>
            <option value="usage">Most Used</option>
          </select>
        </div>

        <div className="filter-row">
          <select
            className="filter-select"
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
          >
            <option value="all">All Difficulties</option>
            <option value="trivial">Trivial</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="deadly">Deadly</option>
          </select>

          {allTags.length > 0 && (
            <select
              className="filter-select"
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
            >
              <option value="all">All Tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {filteredEncounters.length === 0 ? (
        <div className="encounter-library-empty">
          <p>No encounters found</p>
          {isUserDM && (
            <p className="empty-hint">
              Create your first encounter template to get started!
            </p>
          )}
        </div>
      ) : (
        <div className="encounter-grid">
          {filteredEncounters.map((encounter) => (
            <div key={encounter.id} className="encounter-card">
              <div className="encounter-card-header">
                <h4 className="encounter-name">{encounter.name}</h4>
                <span
                  className="encounter-difficulty"
                  style={{
                    backgroundColor: getDifficultyColor(encounter.difficulty),
                  }}
                >
                  {encounter.difficulty}
                </span>
              </div>

              {encounter.description && (
                <p className="encounter-description">
                  {encounter.description.length > 120
                    ? `${encounter.description.substring(0, 120)}...`
                    : encounter.description}
                </p>
              )}

              <div className="encounter-stats">
                <div className="stat-item">
                  <span className="stat-label">Monsters:</span>
                  <span className="stat-value">
                    {encounter.participants?.reduce(
                      (sum, p) => sum + p.quantity,
                      0
                    ) || 0}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">XP:</span>
                  <span className="stat-value">{encounter.xpTotal || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Level:</span>
                  <span className="stat-value">{encounter.suggestedLevel}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Used:</span>
                  <span className="stat-value">
                    {encounter.usageCount || 0}×
                  </span>
                </div>
              </div>

              {encounter.environment && (
                <div className="encounter-environment">
                  <span className="environment-icon">🗺️</span>
                  {encounter.environment}
                </div>
              )}

              {encounter.tags && encounter.tags.length > 0 && (
                <div className="encounter-tags">
                  {encounter.tags.map((tag) => (
                    <span key={tag} className="encounter-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="encounter-card-actions">
                <button
                  className="btn-action btn-view"
                  onClick={() => onEditEncounter && onEditEncounter(encounter)}
                  title="View/Edit"
                >
                  👁️ View
                </button>

                {isUserDM && (
                  <>
                    <button
                      className="btn-action btn-start"
                      onClick={() => handleStart(encounter.id)}
                      title="Start Encounter"
                    >
                      ▶️ Start
                    </button>
                    <button
                      className="btn-action btn-duplicate"
                      onClick={() => handleDuplicate(encounter.id)}
                      title="Duplicate"
                    >
                      📋
                    </button>
                    <button
                      className="btn-action btn-delete"
                      onClick={() => setDeleteConfirm(encounter.id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </>
                )}
              </div>

              {deleteConfirm === encounter.id && (
                <div className="delete-confirmation">
                  <p>Delete this encounter?</p>
                  <div className="delete-actions">
                    <button
                      className="btn-confirm-delete"
                      onClick={() => handleDelete(encounter.id)}
                    >
                      Delete
                    </button>
                    <button
                      className="btn-cancel-delete"
                      onClick={() => setDeleteConfirm(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default EncounterLibrary;
