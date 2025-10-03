import React, { useState, useEffect, useContext } from 'react';
import { FirebaseContext } from '../../../services/FirebaseContext';
import { mapService } from '../../../services/vtt/mapService';
import { FiPlay, FiEye, FiMap, FiPlus, FiX, FiTrash2, FiChevronUp, FiChevronDown, FiMinusCircle } from 'react-icons/fi';
import './MapQueue.css';

/**
 * MapQueue - DM tool for managing and staging maps
 * Shows all maps, allows setting active map, bulk import, reordering, and preview
 */
function MapQueue({ campaignId, activeMapId, onMapSelect }) {
  const { firestore } = useContext(FirebaseContext);
  const [maps, setMaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showImportFlyout, setShowImportFlyout] = useState(false);
  const [showPreviewFlyout, setShowPreviewFlyout] = useState(false);
  const [selectedMapForPreview, setSelectedMapForPreview] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  
  // Import form state
  const [importUrl, setImportUrl] = useState('');
  const [importName, setImportName] = useState('');
  const [importDescription, setImportDescription] = useState('');
  const [importPreview, setImportPreview] = useState(null);
  const [pendingImports, setPendingImports] = useState([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [importError, setImportError] = useState(null);

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

  // Load image preview when URL changes
  const loadImagePreview = async (url) => {
    if (!url.trim()) {
      setImportPreview(null);
      return;
    }

    setIsLoadingPreview(true);
    setImportError(null);

    try {
      const dims = await new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve({ 
          width: img.naturalWidth, 
          height: img.naturalHeight,
          url: url.trim()
        });
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = url.trim();
      });
      setImportPreview(dims);
    } catch (e) {
      setImportError('Failed to load image. Please check the URL.');
      setImportPreview(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Add map to pending imports list
  const handleAddToPending = () => {
    if (!importUrl.trim() || !importPreview) return;

    const newImport = {
      id: Date.now(),
      name: importName.trim() || 'Imported Map',
      url: importUrl.trim(),
      description: importDescription.trim(),
      width: importPreview.width,
      height: importPreview.height,
      preview: importPreview.url
    };

    setPendingImports(prev => [...prev, newImport]);
    
    // Reset form
    setImportUrl('');
    setImportName('');
    setImportDescription('');
    setImportPreview(null);
    setImportError(null);
  };

  // Remove from pending imports
  const handleRemoveFromPending = (id) => {
    setPendingImports(prev => prev.filter(item => item.id !== id));
  };

  // Bulk add all pending imports to library (append at bottom)
  const handleFinishImport = async () => {
    if (pendingImports.length === 0) return;

    try {
      for (const item of pendingImports) {
        const mapData = {
          name: item.name,
          description: item.description,
          imageUrl: item.url,
          width: item.width,
          height: item.height,
          createdBy: 'system'
        };
        const newMap = await mapService.createMap(firestore, campaignId, mapData);
        setMaps(prev => [...prev, newMap]); // Append at bottom
      }

      // Clear pending imports and close flyout
      setPendingImports([]);
      setShowImportFlyout(false);
      setImportUrl('');
      setImportName('');
      setImportDescription('');
      setImportPreview(null);
      setImportError(null);
    } catch (err) {
      console.error('Error importing maps:', err);
      setImportError('Failed to import maps: ' + err.message);
    }
  };

  // Move map up in order
  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newMaps = [...maps];
    [newMaps[index - 1], newMaps[index]] = [newMaps[index], newMaps[index - 1]];
    setMaps(newMaps);
  };

  // Move map down in order
  const handleMoveDown = (index) => {
    if (index === maps.length - 1) return;
    const newMaps = [...maps];
    [newMaps[index], newMaps[index + 1]] = [newMaps[index + 1], newMaps[index]];
    setMaps(newMaps);
  };

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newMaps = [...maps];
    const draggedItem = newMaps[draggedIndex];
    newMaps.splice(draggedIndex, 1);
    newMaps.splice(index, 0, draggedItem);
    
    setMaps(newMaps);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Open map preview
  const handleMapClick = (map, e) => {
    // Don't open preview if clicking on action buttons
    if (e.target.closest('.map-actions') || e.target.closest('.map-reorder')) {
      return;
    }
    setSelectedMapForPreview(map);
    setShowPreviewFlyout(true);
  };

  // Remove from session (placeholder)
  const handleRemoveFromSession = (mapId) => {
    console.log('Session Map Queue Feature coming soon');
  };

  return (
    <div className="map-queue">
      <div className="panel-header">
        <h3>Library</h3>
        <div className="header-actions">
          <span className="map-count">{maps.length} maps</span>
          <button 
            className="import-map-btn"
            onClick={() => setShowImportFlyout(!showImportFlyout)}
            title="Import map from URL"
          >
            Import Map
          </button>
        </div>
      </div>

      {/* Import Map Flyout */}
      {showImportFlyout && (
        <div className="map-import-flyout">
          <div className="import-flyout-header">
            <h4>Import Maps from URL</h4>
            <button 
              className="close-flyout-btn"
              onClick={() => setShowImportFlyout(false)}
              aria-label="Close import flyout"
            >
              <FiX />
            </button>
          </div>

          <div className="import-flyout-content">
            {/* Import Form */}
            <div className="import-form">
              <div className="form-group">
                <label>Image URL *</label>
                <input
                  type="text"
                  placeholder="https://example.com/map.jpg"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  onBlur={() => loadImagePreview(importUrl)}
                />
              </div>

              <div className="form-group">
                <label>Map Name</label>
                <input
                  type="text"
                  placeholder="Map name (optional)"
                  value={importName}
                  onChange={(e) => setImportName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="Map description (optional)"
                  value={importDescription}
                  onChange={(e) => setImportDescription(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Image Preview */}
              {isLoadingPreview && (
                <div className="preview-loading">Loading preview...</div>
              )}

              {importError && (
                <div className="preview-error">{importError}</div>
              )}

              {importPreview && !isLoadingPreview && (
                <div className="image-preview">
                  <img src={importPreview.url} alt="Preview" />
                  <div className="preview-info">
                    <span>{importPreview.width} × {importPreview.height}px</span>
                  </div>
                </div>
              )}

              <button
                className="add-to-list-btn"
                onClick={handleAddToPending}
                disabled={!importUrl.trim() || !importPreview || isLoadingPreview}
              >
                <FiPlus /> Add to Import List
              </button>
            </div>

            {/* Pending Imports List */}
            {pendingImports.length > 0 && (
              <div className="pending-imports">
                <h5>Maps to Import ({pendingImports.length})</h5>
                <div className="pending-list">
                  {pendingImports.map((item) => (
                    <div key={item.id} className="pending-item">
                      <div className="pending-preview">
                        <img src={item.preview} alt={item.name} />
                      </div>
                      <div className="pending-info">
                        <div className="pending-name">{item.name}</div>
                        {item.description && (
                          <div className="pending-description">{item.description}</div>
                        )}
                        <div className="pending-dimensions">
                          {item.width} × {item.height}px
                        </div>
                      </div>
                      <button
                        className="remove-pending-btn"
                        onClick={() => handleRemoveFromPending(item.id)}
                        aria-label="Remove from import list"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  className="finish-import-btn"
                  onClick={handleFinishImport}
                >
                  Add to Library ({pendingImports.length})
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
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
            {maps.map((map, index) => (
              <div 
                key={map.id} 
                className={`map-queue-item ${map.id === activeMapId ? 'active' : ''} ${draggedIndex === index ? 'dragging' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onClick={(e) => handleMapClick(map, e)}
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
                  <h4 className="map-name-truncate">{map.name}</h4>
                  <p className="map-description-truncate">{map.description || 'No description'}</p>
                  <div className="map-meta">
                    <span>{map.width} × {map.height}px</span>
                  </div>
                </div>

                <div className="map-actions">
                  {map.id === activeMapId ? (
                    <button className="action-button action-button-small active" disabled>
                      <FiEye size={14} /> Active
                    </button>
                  ) : (
                    <button 
                      className="action-button action-button-small"
                      onClick={() => handleSetActive(map.id)}
                      title="Set as active map"
                    >
                      <FiPlay size={14} /> Stage
                    </button>
                  )}
                  <button
                    className="remove-session-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFromSession(map.id);
                    }}
                    title="Remove from session"
                  >
                    <FiMinusCircle size={14} /> Remove
                  </button>
                </div>

                {/* Reorder Controls - Moved to right */}
                <div className="map-reorder">
                  <button
                    className="reorder-btn"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    title="Move up"
                    aria-label="Move map up"
                  >
                    <FiChevronUp size={12} />
                  </button>
                  <button
                    className="reorder-btn"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === maps.length - 1}
                    title="Move down"
                    aria-label="Move map down"
                  >
                    <FiChevronDown size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Map Preview Flyout */}
      {showPreviewFlyout && selectedMapForPreview && (
        <div className="map-preview-flyout">
          <div className="preview-flyout-header">
            <h4>Map Preview</h4>
            <button 
              className="close-flyout-btn"
              onClick={() => {
                setShowPreviewFlyout(false);
                setSelectedMapForPreview(null);
              }}
              aria-label="Close preview"
            >
              <FiX />
            </button>
          </div>

          <div className="preview-flyout-content">
            <div className="preview-image-large">
              {selectedMapForPreview.imageUrl ? (
                <img src={selectedMapForPreview.imageUrl} alt={selectedMapForPreview.name} />
              ) : (
                <div className="preview-placeholder-large">📍</div>
              )}
            </div>

            <div className="preview-details">
              <h3>{selectedMapForPreview.name}</h3>
              
              {selectedMapForPreview.description && (
                <div className="preview-description">
                  <label>Description</label>
                  <p>{selectedMapForPreview.description}</p>
                </div>
              )}

              <div className="preview-dimensions">
                <label>Dimensions</label>
                <p>{selectedMapForPreview.width} × {selectedMapForPreview.height}px</p>
              </div>

              {selectedMapForPreview.gridSize && (
                <div className="preview-grid">
                  <label>Grid Size</label>
                  <p>{selectedMapForPreview.gridSize}px</p>
                </div>
              )}

              <div className="preview-actions">
                {selectedMapForPreview.id === activeMapId ? (
                  <button className="preview-action-button active" disabled>
                    <FiEye /> Currently Active
                  </button>
                ) : (
                  <button 
                    className="preview-action-button"
                    onClick={() => {
                      handleSetActive(selectedMapForPreview.id);
                      setShowPreviewFlyout(false);
                      setSelectedMapForPreview(null);
                    }}
                    title="Set as active map"
                  >
                    <FiPlay /> Set as Active Map
                  </button>
                )}
                <button
                  className="preview-action-button remove-btn"
                  onClick={() => handleRemoveFromSession(selectedMapForPreview.id)}
                  title="Remove from session"
                >
                  <FiMinusCircle /> Remove from Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MapQueue;
