import React, { useState, useEffect, useContext } from 'react';
import { FirebaseContext } from '../../../services/FirebaseContext';
import { mapService } from '../../../services/vtt/mapService';
import { FiPlay, FiEye, FiMap } from 'react-icons/fi';
import './MapQueue.css';

/**
 * MapQueue - DM tool for managing and staging maps
 * Shows all maps, allows setting active map
 */
function MapQueue({ campaignId, activeMapId, onMapSelect }) {
  const { firestore } = useContext(FirebaseContext);
  const [maps, setMaps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMaps = async () => {
      if (!campaignId || !firestore) return;

      try {
        const mapList = await mapService.getMaps(firestore, campaignId);
        setMaps(mapList);
      } catch (err) {
        console.error('Error loading maps:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMaps();
  }, [campaignId, firestore]);

  const handleSetActive = async (mapId) => {
    try {
      await mapService.setActiveMap(firestore, campaignId, mapId);
      onMapSelect(mapId);
    } catch (err) {
      console.error('Error setting active map:', err);
    }
  };

  return (
    <div className="map-queue">
      <div className="panel-header">
        <h3>🗺️ Map Queue</h3>
        <span className="map-count">{maps.length} maps</span>
      </div>
      
      <div className="panel-content">
        {loading ? (
          <div className="loading-state">Loading maps...</div>
        ) : maps.length === 0 ? (
          <div className="empty-state">
            <FiMap size={48} />
            <p>No maps yet</p>
            <small>Create maps in the Campaign Dashboard</small>
          </div>
        ) : (
          <div className="map-list">
            {maps.map((map) => (
              <div 
                key={map.id} 
                className={`map-queue-item ${map.id === activeMapId ? 'active' : ''}`}
              >
                <div className="map-preview">
                  {map.imageUrl ? (
                    <img src={map.imageUrl} alt={map.name} />
                  ) : (
                    <div className="map-placeholder">📍</div>
                  )}
                  {map.id === activeMapId && (
                    <div className="active-badge">LIVE</div>
                  )}
                </div>
                
                <div className="map-info">
                  <h4>{map.name}</h4>
                  {map.description && (
                    <p className="map-description">{map.description}</p>
                  )}
                  <div className="map-meta">
                    <span>{map.width} × {map.height}</span>
                  </div>
                </div>

                <div className="map-actions">
                  {map.id === activeMapId ? (
                    <button className="action-button active" disabled>
                      <FiEye /> Active
                    </button>
                  ) : (
                    <button 
                      className="action-button"
                      onClick={() => handleSetActive(map.id)}
                      title="Set as active map"
                    >
                      <FiPlay /> Stage
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MapQueue;
