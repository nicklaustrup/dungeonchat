import React from "react";
import { usePerformanceMode } from "../../hooks/usePerformanceMode";
import { useProfanityFilterContext } from "../../contexts/ProfanityFilterContext";
import "./SettingsModal.css";

function SettingsModal({
  isOpen,
  onClose,
  isDarkTheme,
  toggleTheme,
  soundEnabled,
  toggleSound,
  awayAfterSeconds,
  setAwayAfterSeconds,
}) {
  const { enabled: perfEnabled, toggle: togglePerf } = usePerformanceMode();
  const {
    profanityFilterEnabled,
    toggleProfanityFilter,
    loading: profileLoading,
  } = useProfanityFilterContext();
  const warnedRef = React.useRef(false);
  const pendingRef = React.useRef(null);
  const [localMinutes, setLocalMinutes] = React.useState(() =>
    Math.round(awayAfterSeconds / 60)
  );

  React.useEffect(() => {
    // sync when external value changes (e.g., reset elsewhere)
    setLocalMinutes(Math.round(awayAfterSeconds / 60));
  }, [awayAfterSeconds]);

  const commit = React.useCallback(
    (mins) => {
      if (typeof setAwayAfterSeconds === "function") {
        setAwayAfterSeconds(mins * 60);
      } else if (!warnedRef.current) {
        console.warn(
          "[SettingsModal] setAwayAfterSeconds missing or not a function. Ignoring update."
        );
        warnedRef.current = true;
      }
    },
    [setAwayAfterSeconds]
  );

  const debouncedCommit = React.useCallback(
    (mins) => {
      if (pendingRef.current) clearTimeout(pendingRef.current);
      pendingRef.current = setTimeout(() => {
        commit(mins);
      }, 400); // 400ms debounce
    },
    [commit]
  );

  const handleRangeChange = (e) => {
    const mins = parseInt(e.target.value, 10);
    if (isNaN(mins)) return;
    setLocalMinutes(mins);
    debouncedCommit(mins);
  };

  const handleReset = () => {
    setLocalMinutes(5);
    commit(5);
  };

  const handleProfanityToggle = async () => {
    try {
      await toggleProfanityFilter();
    } catch (error) {
      console.error("Failed to toggle profanity filter:", error);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Settings</h2>
        <div className="settings-item">
          <span>Sound</span>
          <button
            className="icon-btn"
            onClick={toggleSound}
            title="Toggle sound"
          >
            {soundEnabled ? "🔊" : "🔇"}
          </button>
        </div>
        <div className="settings-item">
          <span>Theme</span>
          <button
            className="icon-btn"
            onClick={toggleTheme}
            title="Toggle theme"
          >
            {isDarkTheme ? "☀️" : "🌙"}
          </button>
        </div>
        <div className="settings-item">
          <span>Performance Mode</span>
          <button
            className="icon-btn"
            onClick={togglePerf}
            title="Toggle performance rendering optimizations"
          >
            {perfEnabled ? "⚡" : "⏳"}
          </button>
        </div>
        <div className="settings-item">
          <span>Profanity Filter</span>
          <button
            className="icon-btn"
            onClick={handleProfanityToggle}
            title="Toggle profanity filter for incoming messages"
            disabled={profileLoading}
          >
            {profanityFilterEnabled ? "🛡️" : "🔓"}
          </button>
        </div>
        <div className="settings-item" style={{ gap: "1rem" }}>
          <span>Away Timeout</span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flex: 1,
              justifyContent: "flex-end",
            }}
          >
            <input
              id="away-timeout-range"
              type="range"
              min={1}
              max={60}
              value={localMinutes}
              onChange={handleRangeChange}
              title="Minutes of inactivity before showing Away"
              style={{ width: "100%" }}
            />
            <span
              style={{
                fontVariantNumeric: "tabular-nums",
                minWidth: "3ch",
                textAlign: "right",
              }}
            >
              {localMinutes}m
            </span>
            <button
              className="icon-btn watch"
              onClick={handleReset}
              title="Reset to 5 minutes"
            >
              <span role="img" aria-label="Watch" aria-hidden={false}>
                ⌚
              </span>
            </button>
          </div>
        </div>
        <button className="settings-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

export default SettingsModal;
