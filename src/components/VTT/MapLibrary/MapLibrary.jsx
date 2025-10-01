import React, { useState, useEffect, useContext } from 'react';
import { FirebaseContext } from '../../../services/FirebaseContext';
import { mapService } from '../../../services/vtt/mapService';
import { FiMap, FiEdit2, FiTrash2, FiEye, FiPlus } from 'react-icons/fi';
import './MapLibrary.css';

/**
 * MapLibrary Component
 * Displays all saved maps for a campaign
 */
function MapLibrary({ campaignId, onSelectMap, onEditMap, onDeleteMap, onCreateNew }) {
  const { firestore } = useContext(FirebaseContext);
  const [maps, setMaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingMapId, setDeletingMapId] = useState(null);

  // Load maps
  useEffect(() => {
    if (!campaignId || !firestore) return;

    const loadMaps = async () => {
      try {
        setLoading(true);
        const loadedMaps = await mapService.getMaps(firestore, campaignId);
        setMaps(loadedMaps);
      } catch (err) {
        console.error('Error loading maps:', err);
        setError('Failed to load maps');
      } finally {
        setLoading(false);
      }
    };

    loadMaps();
  }, [campaignId, firestore]);

  const handleDelete = async (mapId, mapName) => {
    if (!window.confirm(`Are you sure you want to delete "${mapName}"?`)) {
      return;
    }

    setDeletingMapId(mapId);
    try {
      await mapService.deleteMap(firestore, campaignId, mapId);
      setMaps(maps.filter(m => m.id !== mapId));
      
      if (onDeleteMap) {
        onDeleteMap(mapId);
      }
    } catch (err) {
      console.error('Error deleting map:', err);
      alert('Failed to delete map: ' + err.message);
    } finally {
      setDeletingMapId(null);
    }
  };

  const handleSetActive = async (mapId) => {
    try {
      await mapService.setActiveMap(firestore, campaignId, mapId);
      
      // Update local state
      setMaps(maps.map(m => ({
        ...m,
        isActive: m.id === mapId
      })));
    } catch (err) {
      console.error('Error setting active map:', err);
      alert('Failed to set active map: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="map-library">
        <div className="library-loading">Loading maps...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="map-library">
        <div className="library-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="map-library">
      <div className="library-header">
        <h2 className="library-title">
          <FiMap /> Map Library
        </h2>
        {onCreateNew && (
          <button className="create-map-button" onClick={onCreateNew}>
            <FiPlus /> Create New Map
          </button>
        )}
      </div>

      {maps.length === 0 ? (
        <div className="library-empty">
          <FiMap className="empty-icon" />
          <p>No maps yet</p>
          {onCreateNew && (
            <button className="create-map-button" onClick={onCreateNew}>
              <FiPlus /> Create Your First Map
            </button>
          )}
        </div>
      ) : (
        <div className="maps-grid">
          {maps.map((map) => (
            <div key={map.id} className={`map-card ${map.isActive ? 'active' : ''}`}>
              {/* Map Preview */}
              <div 
                className="map-preview"
                style={{ backgroundImage: `url(${map.imageUrl})` }}
                onClick={() => onSelectMap && onSelectMap(map)}
              >
                {map.isActive && (
                  <div className="active-badge">Active</div>
                )}
                <div className="map-overlay">
                  <button 
                    className="preview-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectMap && onSelectMap(map);
                    }}
                    title="View map"
                  >
                    <FiEye /> View
                  </button>
                </div>
              </div>

              {/* Map Info */}
              <div className="map-info">
                <h3 className="map-name">{map.name}</h3>
                {map.description && (
                  <p className="map-description">{map.description}</p>
                )}
                <div className="map-meta">
                  <span className="map-size">{map.width} × {map.height}px</span>
                  {map.gridEnabled && (
                    <span className="map-grid">Grid: {map.gridSize}px</span>
                  )}
                </div>
              </div>

              {/* Map Actions */}
              <div className="map-actions">
                {!map.isActive && (
                  <button
                    className="action-button set-active"
                    onClick={() => handleSetActive(map.id)}
                    title="Set as active map"
                  >
                    Set Active
                  </button>
                )}
                <button
                  className="action-button edit"
                  onClick={() => onEditMap && onEditMap(map)}
                  title="Edit map"
                >
                  <FiEdit2 />
                </button>
                <button
                  className="action-button delete"
                  onClick={() => handleDelete(map.id, map.name)}
                  disabled={deletingMapId === map.id}
                  title="Delete map"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MapLibrary;
