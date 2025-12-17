import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
} from "react";
import { FirebaseContext } from "../../../services/FirebaseContext";
import { mapService } from "../../../services/vtt/mapService";
import {
  FiMap,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiPlus,
  FiUpload,
} from "react-icons/fi";
import "./MapLibrary.css";

/**
 * MapLibrary Component
 * Displays all saved maps for a campaign
 */
function MapLibrary({
  campaignId,
  onSelectMap,
  onEditMap,
  onDeleteMap,
  onCreateNew,
}) {
  const { firestore, storage, user } = useContext(FirebaseContext);
  const [maps, setMaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingMapId, setDeletingMapId] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Load maps
  useEffect(() => {
    if (!campaignId || !firestore) return;

    const loadMaps = async () => {
      try {
        setLoading(true);
        const loadedMaps = await mapService.getMaps(firestore, campaignId);
        setMaps(loadedMaps);
      } catch (err) {
        console.error("Error loading maps:", err);
        setError("Failed to load maps");
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
      setMaps(maps.filter((m) => m.id !== mapId));

      if (onDeleteMap) {
        onDeleteMap(mapId);
      }
    } catch (err) {
      console.error("Error deleting map:", err);
      alert("Failed to delete map: " + err.message);
    } finally {
      setDeletingMapId(null);
    }
  };

  const handleSetActive = async (mapId) => {
    try {
      await mapService.setActiveMap(firestore, campaignId, mapId);

      // Update local state
      setMaps(
        maps.map((m) => ({
          ...m,
          isActive: m.id === mapId,
        }))
      );
    } catch (err) {
      console.error("Error setting active map:", err);
      alert("Failed to set active map: " + err.message);
    }
  };

  const handleFileUpload = useCallback(
    async (file) => {
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setUploadError("Please select an image file (PNG, JPG, or WebP)");
        return;
      }

      // Validate file size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        setUploadError("File size must be less than 20MB");
        return;
      }

      setIsUploading(true);
      setUploadError(null);
      setUploadProgress(0);

      try {
        console.log("Starting map upload...", {
          fileName: file.name,
          campaignId,
        });

        // Upload image to storage
        const result = await mapService.uploadMapImage(
          storage,
          file,
          campaignId,
          user.uid,
          (progress) => setUploadProgress(progress)
        );

        console.log("Upload successful, creating map document...");

        // Create map document in Firestore
        const mapData = {
          name: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
          description: "",
          imageUrl: result.downloadURL,
          width: result.width,
          height: result.height,
          gridSize: 50,
          gridColor: "#000000",
          gridOpacity: 0.3,
          gridEnabled: true,
          createdBy: user.uid,
        };

        const newMap = await mapService.createMap(
          firestore,
          campaignId,
          mapData
        );
        console.log("Map created successfully:", newMap.id);

        // Add to local state
        setMaps((prevMaps) => [newMap, ...prevMaps]);

        // Show success message briefly
        setTimeout(() => {
          setUploadProgress(0);
        }, 2000);
      } catch (err) {
        console.error("Upload error:", err);
        let errorMessage = err.message || "Failed to upload map";

        if (err.code === "permission-denied") {
          errorMessage =
            "Permission denied. You must be the DM to upload maps.";
        } else if (err.code === "storage/unauthorized") {
          errorMessage =
            "Storage permission denied. Please check your permissions.";
        }

        setUploadError(errorMessage);
      } finally {
        setIsUploading(false);
      }
    },
    [storage, campaignId, user, firestore]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    [handleFileUpload]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
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
    <div
      className={`map-library ${isDragging ? "dragging" : ""}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Drag and drop overlay */}
      {isDragging && (
        <div className="drag-overlay">
          <div className="drag-overlay-content">
            <FiUpload className="drag-icon" />
            <p>Drop image here to upload</p>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />

      <div className="library-header">
        <h2 className="library-title">
          <FiMap /> Map Library
        </h2>
        <div className="header-actions">
          <button
            className="upload-map-button"
            onClick={handleUploadClick}
            disabled={isUploading}
            title="Upload a map image"
          >
            <FiUpload /> Upload Map
          </button>
          {onCreateNew && (
            <button
              className="create-map-button"
              onClick={onCreateNew}
              disabled
              title="Coming soon - This feature is under development"
            >
              <FiPlus /> Create New Map
            </button>
          )}
        </div>
      </div>

      {/* Upload status messages */}
      {uploadError && (
        <div className="upload-error">
          {uploadError}
          <button onClick={() => setUploadError(null)}>×</button>
        </div>
      )}
      {isUploading && (
        <div className="upload-status">
          <div className="upload-progress-bar">
            <div
              className="upload-progress-fill"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <span className="upload-progress-text">
            Uploading... {Math.round(uploadProgress)}%
          </span>
        </div>
      )}
      {uploadProgress === 100 && !isUploading && (
        <div className="upload-success">Map uploaded successfully!</div>
      )}

      {maps.length === 0 ? (
        <div className="library-empty">
          <FiMap className="empty-icon" />
          <p>No maps yet</p>
          {onCreateNew && (
            <button
              className="create-map-button"
              onClick={onCreateNew}
              disabled
              title="Coming soon - This feature is under development"
            >
              <FiPlus /> Create Your First Map
            </button>
          )}
        </div>
      ) : (
        <div className="maps-grid">
          {maps.map((map) => (
            <div
              key={map.id}
              className={`map-card ${map.isActive ? "active" : ""}`}
            >
              {/* Map Preview */}
              <div
                className="map-preview"
                style={{ backgroundImage: `url(${map.imageUrl})` }}
                onClick={() => onSelectMap && onSelectMap(map)}
              >
                {map.isActive && <div className="active-badge">Active</div>}
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
                  <span className="map-size">
                    {map.width} × {map.height}px
                  </span>
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
