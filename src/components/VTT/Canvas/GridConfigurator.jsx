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
  }, [map?.id, map?.gridSize, map?.gridColor, map?.gridOpacity, map?.gridEnabled]);

  if (!open) return null;

  const handleApply = () => {
    const before = {
      gridSize: map?.gridSize,
      gridColor: map?.gridColor,
      gridOpacity: map?.gridOpacity,
      gridEnabled: map?.gridEnabled
    };
    const after = { gridSize, gridColor, gridOpacity, gridEnabled };
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
          <input type="checkbox" checked={gridEnabled} onChange={e => setGridEnabled(e.target.checked)} />
        </label>
        <label className="gc-row">
          <span>Grid Size: {gridSize}px</span>
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
          />
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
