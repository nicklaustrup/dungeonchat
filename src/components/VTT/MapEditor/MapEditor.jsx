import React, { useState, useEffect, useContext } from 'react';
import { FirebaseContext } from '../../../services/FirebaseContext';
import { mapService } from '../../../services/vtt/mapService';
import MapCanvas from '../Canvas/MapCanvas';
import MapUploader from './MapUploader';
import GridConfigurator from './GridConfigurator';
import { FiSave, FiX } from 'react-icons/fi';
import './MapEditor.css';

/**
 * MapEditor Component
 * Main editor page for creating and editing VTT maps
 */
function MapEditor({ campaignId, existingMap, onSave, onCancel }) {
  const { firestore, storage, user } = useContext(FirebaseContext);
  
  // Map state
  const [map, setMap] = useState(null);
  const [mapName, setMapName] = useState('');
  const [mapDescription, setMapDescription] = useState('');
  
  // Grid state
  const [gridSize, setGridSize] = useState(50);
  const [gridColor, setGridColor] = useState('#000000');
  const [gridOpacity, setGridOpacity] = useState(0.3);
  const [gridEnabled, setGridEnabled] = useState(true);
  
  // UI state
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Load existing map if provided
  useEffect(() => {
    if (existingMap) {
      setMap(existingMap);
      setMapName(existingMap.name || '');
      setMapDescription(existingMap.description || '');
      setGridSize(existingMap.gridSize || 50);
      setGridColor(existingMap.gridColor || '#000000');
      setGridOpacity(existingMap.gridOpacity || 0.3);
      setGridEnabled(existingMap.gridEnabled !== undefined ? existingMap.gridEnabled : true);
    }
  }, [existingMap]);

  const handleFileUpload = async (file) => {
    setIsUploading(true);
    setError(null);
    
    try {
      console.log('Starting map upload...', { 
        fileName: file.name, 
        fileSize: file.size, 
        campaignId,
        userId: user?.uid 
      });

      if (!storage) {
        throw new Error('Firebase Storage is not initialized');
      }

      if (!user) {
        throw new Error('User not authenticated');
      }

      if (!campaignId) {
        throw new Error('Campaign ID is missing');
      }

      const result = await mapService.uploadMapImage(
        storage, 
        file, 
        campaignId, 
        user.uid,
        (progress) => setUploadProgress(progress)
      );
      
      console.log('Upload successful:', result);

      setMap({
        imageUrl: result.downloadURL,
        width: result.width,
        height: result.height,
        gridSize,
        gridColor,
        gridOpacity,
        gridEnabled
      });
      
    } catch (err) {
      console.error('Upload error:', err);
      
      let errorMessage = err.message || 'Failed to upload map image';
      
      // Provide more helpful error messages based on error codes
      if (err.code === 'storage/unauthorized') {
        errorMessage = 'Permission denied. You may not have access to upload maps for this campaign.';
      } else if (err.code === 'storage/canceled') {
        errorMessage = 'Upload was canceled.';
      } else if (err.code === 'storage/unknown') {
        errorMessage = 'An unknown error occurred during upload. Please try again.';
      }
      
      setError(errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSaveMap = async () => {
    if (!map || !mapName.trim()) {
      setError('Please provide a map name');
      return;
    }

    setIsSaving(true);
    setError(null);
    
    try {
      console.log('Saving map to campaign:', campaignId);
      console.log('User:', user.uid);
      
      const mapData = {
        name: mapName.trim(),
        description: mapDescription.trim(),
        imageUrl: map.imageUrl,
        width: map.width,
        height: map.height,
        gridSize,
        gridColor,
        gridOpacity,
        gridEnabled,
        createdBy: user.uid
      };

      let savedMap;
      if (existingMap?.id) {
        // Update existing map
        console.log('Updating existing map:', existingMap.id);
        await mapService.updateMap(firestore, campaignId, existingMap.id, mapData);
        savedMap = { ...existingMap, ...mapData };
      } else {
        // Create new map
        console.log('Creating new map...');
        savedMap = await mapService.createMap(firestore, campaignId, mapData);
        console.log('Map created successfully:', savedMap.id);
      }

      setSuccess(true);
      
      if (onSave) {
        onSave(savedMap);
      }
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setSuccess(false);
        if (!existingMap) {
          resetForm();
        }
      }, 2000);
      
    } catch (err) {
      console.error('Save error:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      
      // Provide more helpful error messages
      let errorMessage = err.message || 'Failed to save map';
      if (err.code === 'permission-denied') {
        errorMessage = 'Permission denied. You must be the DM of this campaign to create maps.';
      }
      
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setMap(null);
    setMapName('');
    setMapDescription('');
    setGridSize(50);
    setGridColor('#000000');
    setGridOpacity(0.3);
    setGridEnabled(true);
  };

  const canvasWidth = 800;
  const canvasHeight = 600;

  return (
    <div className="map-editor">
      <div className="editor-header">
        <h1 className="editor-title">
          {existingMap ? 'Edit Map' : 'Create New Map'}
        </h1>
        {onCancel && (
          <button className="close-button" onClick={onCancel}>
            <FiX />
          </button>
        )}
      </div>

      <div className="editor-content">
        {/* Left Panel - Upload & Settings */}
        <div className="editor-sidebar">
          {/* Upload Section */}
          {!map && (
            <div className="editor-section">
              <h2 className="section-title">Upload Map</h2>
              {error && <div className="error-message" style={{ marginBottom: '16px' }}>{error}</div>}
              <MapUploader 
                onUpload={handleFileUpload}
                isUploading={isUploading}
              />
              {isUploading && (
                <div className="upload-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <span className="progress-text">{Math.round(uploadProgress)}%</span>
                </div>
              )}
            </div>
          )}

          {/* Map Details */}
          {map && (
            <>
              <div className="editor-section">
                <h2 className="section-title">Map Details</h2>
                <div className="form-group">
                  <label htmlFor="mapName">Name *</label>
                  <input
                    id="mapName"
                    type="text"
                    value={mapName}
                    onChange={(e) => setMapName(e.target.value)}
                    placeholder="Enter map name"
                    maxLength={100}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="mapDescription">Description</label>
                  <textarea
                    id="mapDescription"
                    value={mapDescription}
                    onChange={(e) => setMapDescription(e.target.value)}
                    placeholder="Optional map description"
                    rows={3}
                    maxLength={500}
                  />
                </div>
                <div className="map-info">
                  <span>Size: {map.width} × {map.height}px</span>
                </div>
              </div>

              {/* Grid Configurator */}
              <div className="editor-section">
                <GridConfigurator
                  gridSize={gridSize}
                  gridColor={gridColor}
                  gridOpacity={gridOpacity}
                  gridEnabled={gridEnabled}
                  onGridSizeChange={setGridSize}
                  onGridColorChange={setGridColor}
                  onGridOpacityChange={setGridOpacity}
                  onGridEnabledChange={setGridEnabled}
                />
              </div>
            </>
          )}
        </div>

        {/* Right Panel - Canvas Preview */}
        <div className="editor-main">
          <div className="canvas-section">
            <h2 className="section-title">Preview</h2>
            <MapCanvas
              map={map ? { ...map, gridSize, gridColor, gridOpacity, gridEnabled } : null}
              width={canvasWidth}
              height={canvasHeight}
            />
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      {map && (
        <div className="editor-footer">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">Map saved successfully!</div>}
          
          <div className="footer-actions">
            <button 
              className="save-button"
              onClick={handleSaveMap}
              disabled={isSaving || !mapName.trim()}
            >
              <FiSave />
              {isSaving ? 'Saving...' : existingMap ? 'Update Map' : 'Save Map'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MapEditor;
