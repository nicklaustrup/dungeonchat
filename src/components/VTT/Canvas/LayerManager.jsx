import React from "react";
import "./LayerManager.css";

export default function LayerManager({ open, onClose, visibility, onToggle }) {
  if (!open) return null;
  const items = [
    ["grid", "Grid"],
    ["fog", "Fog"],
    ["tokens", "Tokens"],
    ["shapes", "Shapes"],
    ["drawings", "Drawings"],
    ["pings", "Pings"],
    ["rulers", "Rulers"],
  ];
  return (
    <div className="layer-manager">
      <div className="lm-header">
        <span>Layers</span>
        <button onClick={onClose}>×</button>
      </div>
      <div className="lm-body">
        {items.map(([key, label]) => (
          <label key={key} className="lm-row">
            <input
              type="checkbox"
              checked={visibility[key]}
              onChange={() => onToggle(key)}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
