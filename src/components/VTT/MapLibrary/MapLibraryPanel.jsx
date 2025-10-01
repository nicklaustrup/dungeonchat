import React, { useEffect, useState } from 'react';
import { mapService } from '../../../services/vtt/mapService';
import './MapLibraryPanel.css';

export default function MapLibraryPanel({ firestore, campaignId, open, onClose, onSelect }) {
  const [maps, setMaps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setLoading(true); setError(null);
      try { const all = await mapService.getMaps(firestore, campaignId); setMaps(all); } catch (e) { setError(e.message); } finally { setLoading(false); }
    };
    load();
  }, [open, firestore, campaignId]);

  if (!open) return null;

  const handleCreateFromUrl = async () => {
    if (!url.trim()) return;
    try {
      // Attempt to load image to get dimensions
      const dims = await new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => resolve({ width: 0, height: 0 }); // fallback silently
        img.src = url.trim();
      });
      const map = await mapService.createMap(firestore, campaignId, { name: name || 'Imported Map', imageUrl: url.trim(), width: dims.width, height: dims.height, createdBy: 'system' });
      setMaps(m => [map, ...m]);
      setUrl(''); setName('');
    } catch (e) { setError(e.message); }
  };

  return (
    <div className="map-library-panel">
      <div className="ml-header">
        <span>Map Library</span>
        <button onClick={onClose}>×</button>
      </div>
      <div className="ml-body">
        <div className="ml-section">
          <div className="ml-subheader">Import by Image URL</div>
          <input placeholder="Map Name (optional)" value={name} onChange={e=>setName(e.target.value)} />
          <input placeholder="Image URL" value={url} onChange={e=>setUrl(e.target.value)} />
          <button onClick={handleCreateFromUrl} disabled={!url.trim()}>Create</button>
        </div>
        <div className="ml-section">
          <div className="ml-subheader">Existing Maps</div>
          {loading && <div className="ml-status">Loading...</div>}
          {error && <div className="ml-error">{error}</div>}
          <div className="ml-list">
            {maps.map(m => (
              <div key={m.id} className="ml-item" onClick={() => onSelect?.(m)}>
                <div className="ml-name">{m.name}</div>
                <div className="ml-meta">{m.gridSize}px grid • {m.visibility}</div>
              </div>
            ))}
            {maps.length === 0 && !loading && <div className="ml-empty">No maps yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
