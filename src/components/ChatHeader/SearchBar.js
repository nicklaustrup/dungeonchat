import React from "react";

export default function SearchBar({
  value,
  onChange,
  collapsed,
  onToggle,
  disableClose,
}) {
  return (
    <div className={`search-wrapper ${collapsed ? "collapsed" : "expanded"}`}>
      {collapsed ? (
        <button
          className="search-icon-btn"
          aria-label="Open search"
          onClick={onToggle}
        >
          🔍
        </button>
      ) : (
        <div className="search-container">
          <input
            type="text"
            placeholder="Search"
            aria-label="Search messages"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="search-input-field"
            autoFocus
          />
          {!disableClose && (
            <button
              className="search-close-btn"
              aria-label="Close search"
              onClick={onToggle}
            >
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
}
