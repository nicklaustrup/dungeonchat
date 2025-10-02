import React, { useState, useEffect, useRef } from 'react';
import './GridConfigurator.css';

/**
 * GridConfigurator
 * Floating panel allowing DM to adjust grid settings live.
 */
export default function GridConfigurator({
  open,
  onClose,
  map,
  onUpdate,
  pushUndo // optional function to register undo action
}) {
  const [gridSize, setGridSize] = useState(map?.gridSize || 50);
  const [gridColor, setGridColor] = useState(map?.gridColor || '#000000');
  const [gridOpacity, setGridOpacity] = useState(map?.gridOpacity ?? 0.3);
  const [gridEnabled, setGridEnabled] = useState(map?.gridEnabled ?? true);
  const [gridOffsetX, setGridOffsetX] = useState(map?.gridOffsetX || 0);
  const [gridOffsetY, setGridOffsetY] = useState(map?.gridOffsetY || 0);
  const debounceRef = useRef();
  const livePreviewRef = useRef({});

  // Debounced fire to Firestore while still updating parent instantly
  const debouncedCommit = (partial) => {
    livePreviewRef.current = { ...livePreviewRef.current, ...partial };
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onUpdate?.(livePreviewRef.current);
    }, 180); // ~180ms debounce
  };

  useEffect(() => {
    setGridSize(map?.gridSize || 50);
    setGridColor(map?.gridColor || '#000000');
    setGridOpacity(map?.gridOpacity ?? 0.3);
    setGridEnabled(map?.gridEnabled ?? true);
    setGridOffsetX(map?.gridOffsetX || 0);
    setGridOffsetY(map?.gridOffsetY || 0);
  }, [map?.id, map?.gridSize, map?.gridColor, map?.gridOpacity, map?.gridEnabled, map?.gridOffsetX, map?.gridOffsetY]);

  if (!open) return null;

  const handleApply = () => {
    const before = {
      gridSize: map?.gridSize,
      gridColor: map?.gridColor,
      gridOpacity: map?.gridOpacity,
      gridEnabled: map?.gridEnabled,
      gridOffsetX: map?.gridOffsetX,
      gridOffsetY: map?.gridOffsetY
    };
    const after = { gridSize, gridColor, gridOpacity, gridEnabled, gridOffsetX, gridOffsetY };
    onUpdate?.(after);
    if (pushUndo && map?.id) {
      pushUndo({
        undo: () => onUpdate?.(before),
        redo: () => onUpdate?.(after)
      });
    }
  };

  return (
    <div className="grid-configurator">
      <div className="gc-header">
        <span>Grid Settings</span>
        <button onClick={onClose}>×</button>
      </div>
      <div className="gc-body">
        <label className="gc-row">
          <span>Enabled</span>
          <input type="checkbox" checked={gridEnabled} onChange={e => {
            const newValue = e.target.checked;
            setGridEnabled(newValue);
            debouncedCommit({ gridEnabled: newValue });
          }} />
        </label>
        <label className="gc-row">
          <span>Grid Size (px)</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="range"
              min={20}
              max={150}
              step={5}
              value={gridSize}
              onChange={e => {
                const v = parseInt(e.target.value,10);
                setGridSize(v);
                debouncedCommit({ gridSize: v });
              }}
              style={{ flex: 1 }}
            />
            <input
              type="number"
              min={10}
              max={300}
              value={gridSize}
              onChange={e => {
                const v = parseInt(e.target.value,10) || 50;
                setGridSize(v);
                debouncedCommit({ gridSize: v });
              }}
              style={{ width: '60px', padding: '4px', background: '#2a2a3e', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
            />
          </div>
        </label>
        <label className="gc-row">
          <span>Grid Offset X</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="range"
              min={-100}
              max={100}
              step={1}
              value={gridOffsetX}
              onChange={e => {
                const v = parseInt(e.target.value,10);
                setGridOffsetX(v);
                debouncedCommit({ gridOffsetX: v });
              }}
              style={{ flex: 1 }}
            />
            <input
              type="number"
              value={gridOffsetX}
              onChange={e => {
                const v = parseInt(e.target.value,10) || 0;
                setGridOffsetX(v);
                debouncedCommit({ gridOffsetX: v });
              }}
              style={{ width: '60px', padding: '4px', background: '#2a2a3e', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
            />
          </div>
        </label>
        <label className="gc-row">
          <span>Grid Offset Y</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="range"
              min={-100}
              max={100}
              step={1}
              value={gridOffsetY}
              onChange={e => {
                const v = parseInt(e.target.value,10);
                setGridOffsetY(v);
                debouncedCommit({ gridOffsetY: v });
              }}
              style={{ flex: 1 }}
            />
            <input
              type="number"
              value={gridOffsetY}
              onChange={e => {
                const v = parseInt(e.target.value,10) || 0;
                setGridOffsetY(v);
                debouncedCommit({ gridOffsetY: v });
              }}
              style={{ width: '60px', padding: '4px', background: '#2a2a3e', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
            />
          </div>
        </label>
        <label className="gc-row">
          <span>Opacity: {Math.round(gridOpacity*100)}%</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={gridOpacity}
            onChange={e => {
              const v = parseFloat(e.target.value);
              setGridOpacity(v);
              debouncedCommit({ gridOpacity: v });
            }}
          />
        </label>
        <label className="gc-row">
          <span>Color</span>
          <input
            type="color"
            value={gridColor}
            onChange={e => {
              const v = e.target.value;
              setGridColor(v);
              debouncedCommit({ gridColor: v });
            }}
          />
        </label>
      </div>
      <div className="gc-footer">
        <button onClick={handleApply} className="primary">Commit</button>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
