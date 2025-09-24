import React from 'react';
import './SettingsModal.css';

function SettingsModal({ isOpen, onClose, isDarkTheme, toggleTheme, soundEnabled, toggleSound, awayAfterSeconds, setAwayAfterSeconds }) {
  const warnedRef = React.useRef(false);
  const pendingRef = React.useRef(null);
  const [localMinutes, setLocalMinutes] = React.useState(() => Math.round(awayAfterSeconds/60));

  React.useEffect(() => {
    // sync when external value changes (e.g., reset elsewhere)
    setLocalMinutes(Math.round(awayAfterSeconds/60));
  }, [awayAfterSeconds]);

  const commit = React.useCallback((mins) => {
    if (typeof setAwayAfterSeconds === 'function') {
      setAwayAfterSeconds(mins * 60);
    } else if (!warnedRef.current) {
      console.warn('[SettingsModal] setAwayAfterSeconds missing or not a function. Ignoring update.');
      warnedRef.current = true;
    }
  }, [setAwayAfterSeconds]);

  const debouncedCommit = React.useCallback((mins) => {
    if (pendingRef.current) clearTimeout(pendingRef.current);
    pendingRef.current = setTimeout(() => {
      commit(mins);
    }, 400); // 400ms debounce
  }, [commit]);

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
  if (!isOpen) return null;
  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        <h2>Settings</h2>
        <div className="settings-item">
          <span>Sound</span>
          <button className="icon-btn" onClick={toggleSound} title="Toggle sound">
            {soundEnabled ? '🔊' : '🔇'}
          </button>
        </div>
        <div className="settings-item">
          <span>Theme</span>
          <button className="icon-btn" onClick={toggleTheme} title="Toggle theme">
            {isDarkTheme ? '☀️' : '🌙'}
          </button>
        </div>
        <div className="settings-item column">
          <label htmlFor="away-timeout-range" style={{display:'flex', justifyContent:'space-between', width:'100%'}}>
            <span>Away Timeout</span>
            <span style={{fontVariantNumeric:'tabular-nums'}}>{localMinutes}m</span>
          </label>
          <input
            id="away-timeout-range"
            type="range"
            min={1}
            max={60}
            value={localMinutes}
            onChange={handleRangeChange}
            title="Minutes of inactivity before showing Away"
          />
          <div style={{display:'flex', justifyContent:'space-between', width:'100%', marginTop:4}}>
            <button className="icon-btn" onClick={handleReset} title="Reset to 5 minutes">Reset</button>
            <small style={{opacity:0.7}}>Updates debounced</small>
          </div>
        </div>
        <button className="settings-close" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default SettingsModal;
