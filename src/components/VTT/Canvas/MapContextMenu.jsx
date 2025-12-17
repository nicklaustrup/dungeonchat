import React, { useEffect, useRef } from "react";
import "./MapContextMenu.css";

/**
 * MapContextMenu
 * Provides right-click menu for the map canvas
 * Players can clear their own shapes, DMs can clear all shapes
 */
export default function MapContextMenu({
  isDM,
  position, // {x,y} absolute (within relative container)
  onClose,
  onClearMyShapes,
  onClearAllShapes,
}) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose?.();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="map-context-menu"
      style={{ left: position.x, top: position.y }}
    >
      <div className="mcm-header">
        <strong>Map Actions</strong>
        <button onClick={onClose}>×</button>
      </div>
      <div className="mcm-section">
        <button
          className="mcm-action-button"
          onClick={() => {
            onClearMyShapes?.();
            onClose?.();
          }}
          title="Clear all shapes you have drawn"
        >
          <span className="mcm-icon">🗑️</span>
          <span>Clear My Shapes</span>
        </button>
        {isDM && (
          <button
            className="mcm-action-button mcm-danger"
            onClick={() => {
              if (
                window.confirm(
                  "Are you sure you want to clear ALL shapes on the map? This cannot be undone."
                )
              ) {
                onClearAllShapes?.();
                onClose?.();
              }
            }}
            title="Clear all shapes from all users (DM only)"
          >
            <span className="mcm-icon">⚠️</span>
            <span>Clear All Shapes</span>
          </button>
        )}
      </div>
    </div>
  );
}
