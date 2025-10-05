import React, { useEffect, useRef, useState } from 'react';
import './TokenContextMenu.css';

/**
 * TokenContextMenu
 * Provides right-click actions: adjust HP, add/remove status effects, hide/unhide, delete (DM only)
 */
export default function TokenContextMenu({
  token,
  isDM,
  position, // {x,y} absolute (within relative container)
  onClose,
  onAdjustHP,
  onAddStatus,
  onRemoveStatus,
  onToggleHidden,
  onDelete,
  onAddToInitiative
}) {
  const ref = useRef(null);
  const [hpValue, setHpValue] = useState('');
  const [statusName, setStatusName] = useState('');
  const [statusIcon, setStatusIcon] = useState('');
  const [showIconPicker, setShowIconPicker] = useState(false);
  
  // HP Buffering: store pending HP changes locally
  const [pendingHP, setPendingHP] = useState(null); // null means no pending changes
  const [bufferedHP, setBufferedHP] = useState(token?.hp ?? 0);

  // Common monochrome-friendly icons (black/white glyphs & simple emojis)
  const COMMON_ICONS = [
    '⚔️','🛡️','💀','☠️','🔥','❄️','💧','🌪️','🌫️','⛓️','🕸️','💤','🩸','🌀','✨','⚡','🎯','👁️','🚫','❗','❌','🔒','🩹','🏹','🛑','⏳','🕯️','🔮','🥶','🧪','☄️','📿','🖤','🤍'
  ];

  // Initialize buffered HP when token changes
  useEffect(() => {
    if (token) {
      setBufferedHP(token.hp ?? 0);
      setPendingHP(null); // Reset pending changes when token changes
    }
  }, [token]);

  // Handle quick HP adjustment (buffer locally)
  const handleQuickHPAdjust = (delta) => {
    const currentHP = pendingHP !== null ? pendingHP : (token.hp ?? 0);
    const newHP = Math.max(0, Math.min(token.maxHp ?? 999, currentHP + delta));
    setPendingHP(newHP);
    setBufferedHP(newHP);
  };

  // Apply buffered HP changes to Firebase
  const handleApplyHP = () => {
    if (pendingHP !== null) {
      onAdjustHP?.(pendingHP, true); // isAbsolute = true
      setPendingHP(null);
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose?.();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  if (!token) return null;

  return (
    <div ref={ref} className="token-context-menu" style={{ left: position.x, top: position.y }}>
      <div className="tcm-header">
        <strong>{token.name || 'Token'}</strong>
        <button onClick={onClose}>×</button>
      </div>
      <div className="tcm-section">
        <div className="tcm-row">
          <span className="tcm-label">HP:</span>
          <span className={`tcm-value ${pendingHP !== null ? 'pending' : ''}`}>
            {token.hp != null && token.maxHp != null 
              ? `${pendingHP !== null ? bufferedHP : token.hp}/${token.maxHp}` 
              : '—'}
            {pendingHP !== null && <span className="pending-indicator"> *</span>}
          </span>
          {isDM && token.maxHp != null && (
            <div className="hp-quick-adjust">
              <button
                className="hp-btn hp-decrease"
                onClick={() => handleQuickHPAdjust(-1)}
                title="Decrease HP by 1"
              >▼</button>
              <button
                className="hp-btn hp-increase"
                onClick={() => handleQuickHPAdjust(1)}
                title="Increase HP by 1"
              >▲</button>
            </div>
          )}
        </div>
        {isDM && token.maxHp != null && (
          <>
            <div className="tcm-row hp-adjust">
              <input
                type="text"
                placeholder="+5 or -3 or 12"
                value={hpValue}
                onChange={(e) => setHpValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    if (!hpValue.trim()) return;
                    const raw = hpValue.trim();
                    let isAbsolute = false;
                    let num = 0;
                    if (/^[+-]/.test(raw)) {
                      num = parseInt(raw, 10) || 0;
                    } else {
                      isAbsolute = true;
                      num = parseInt(raw, 10) || 0;
                    }
                    onAdjustHP?.(num, isAbsolute);
                    setHpValue('');
                  }
                }}
              />
              <button
                onClick={() => {
                  if (!hpValue.trim()) return;
                  const raw = hpValue.trim();
                  let isAbsolute = false;
                  let num = 0;
                  if (/^[+-]/.test(raw)) {
                    num = parseInt(raw, 10) || 0;
                  } else {
                    isAbsolute = true;
                    num = parseInt(raw, 10) || 0;
                  }
                  onAdjustHP?.(num, isAbsolute);
                  setHpValue('');
                }}
              >Set</button>
            </div>
            {pendingHP !== null && (
              <div className="tcm-row hp-apply-row">
                <button
                  className="apply-hp-btn"
                  onClick={handleApplyHP}
                  title="Apply pending HP changes to Firebase"
                >
                  ✓ Apply HP Changes
                </button>
                <button
                  className="cancel-hp-btn"
                  onClick={() => {
                    setPendingHP(null);
                    setBufferedHP(token.hp ?? 0);
                  }}
                  title="Cancel pending changes"
                >
                  Cancel
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <div className="tcm-section">
        <div className="tcm-subheader">Status Effects</div>
        <div className="tcm-status-list">
          {Array.isArray(token.statusEffects) && token.statusEffects.length > 0 ? (
            token.statusEffects.map(se => (
              <div key={se.id || se.name} className="tcm-status-item">
                <span>{se.icon || se.name}</span>
                <button onClick={() => onRemoveStatus?.(se.id || se.name)} title="Remove">×</button>
              </div>
            ))
          ) : (
            <div className="tcm-empty">No effects</div>
          )}
        </div>
        <div className="tcm-row add-status">
          <input
            type="text"
            placeholder="Name (e.g., Prone)"
            value={statusName}
            onChange={(e) => setStatusName(e.target.value)}
          />
          <div className="icon-picker-wrapper">
            <button
              type="button"
              className="icon-picker-trigger"
              onClick={() => setShowIconPicker(v => !v)}
              title="Select Icon"
            >{statusIcon || '◇'}</button>
            {showIconPicker && (
              <div className="icon-picker-pop">
                {COMMON_ICONS.map(ic => (
                  <button
                    key={ic}
                    type="button"
                    className={`icon-choice ${ic === statusIcon ? 'active' : ''}`}
                    onClick={() => { setStatusIcon(ic); setShowIconPicker(false); }}
                  >{ic}</button>
                ))}
                <div className="icon-picker-actions">
                  <button type="button" onClick={() => { setStatusIcon(''); setShowIconPicker(false); }}>Clear</button>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              if (!statusName.trim()) return;
              onAddStatus?.({ name: statusName.trim(), icon: statusIcon.trim() || undefined });
              setStatusName('');
              setStatusIcon('');
              setShowIconPicker(false);
            }}
          >Add</button>
        </div>
      </div>
      <div className="tcm-section actions">
        {isDM && (
          <button onClick={() => { onAddToInitiative?.(); onClose?.(); }}>Add to Initiative</button>
        )}
        <button onClick={() => onToggleHidden?.()}>{token.hidden ? 'Unhide' : 'Hide'}</button>
        {isDM && <button className="danger" onClick={() => onDelete?.()}>Delete</button>}
      </div>
    </div>
  );
}
