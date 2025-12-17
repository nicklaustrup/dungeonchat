import React, { useState, useEffect } from "react";
import "./TokenExtendedEditor.css";

export default function TokenExtendedEditor({ token, open, onClose, onSave }) {
  const [hp, setHp] = useState(token?.hp ?? "");
  const [maxHp, setMaxHp] = useState(token?.maxHp ?? "");
  const [presetName, setPresetName] = useState("");
  const [presetIcon, setPresetIcon] = useState("");

  useEffect(() => {
    if (open) {
      setHp(token?.hp ?? "");
      setMaxHp(token?.maxHp ?? "");
    }
  }, [open, token]);

  if (!open || !token) return null;

  return (
    <div className="token-extended-editor">
      <div className="tee-header">
        <span>Token Stats: {token.name}</span>
        <button onClick={onClose}>×</button>
      </div>
      <div className="tee-body">
        <label className="tee-row">
          Max HP
          <input
            type="number"
            value={maxHp}
            onChange={(e) => setMaxHp(e.target.value)}
          />
        </label>
        <label className="tee-row">
          Current HP
          <input
            type="number"
            value={hp}
            onChange={(e) => setHp(e.target.value)}
          />
        </label>
        <div className="tee-subheader">Quick Status Preset</div>
        <div className="tee-preset-row">
          <input
            placeholder="Name"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
          />
          <input
            placeholder="Icon"
            value={presetIcon}
            onChange={(e) => setPresetIcon(e.target.value)}
            style={{ width: 70 }}
          />
          <button
            disabled={!presetName.trim()}
            onClick={() => {
              onSave({
                presetStatus: {
                  name: presetName.trim(),
                  icon: presetIcon.trim() || undefined,
                },
                hp: hp === "" ? null : parseInt(hp, 10),
                maxHp: maxHp === "" ? null : parseInt(maxHp, 10),
              });
              setPresetName("");
              setPresetIcon("");
            }}
          >
            Apply
          </button>
        </div>
        <button
          className="tee-save"
          onClick={() =>
            onSave({
              hp: hp === "" ? null : parseInt(hp, 10),
              maxHp: maxHp === "" ? null : parseInt(maxHp, 10),
            })
          }
        >
          Save
        </button>
      </div>
    </div>
  );
}
