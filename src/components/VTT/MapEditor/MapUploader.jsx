import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiX, FiImage } from 'react-icons/fi';
import './MapUploader.css';

/**
 * MapUploader Component
 * Drag-and-drop file uploader for map images
 */
function MapUploader({ onUpload, isUploading, disabled }) {
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      console.error('File rejected:', rejection);
      
      if (rejection.errors) {
        rejection.errors.forEach(err => {
          console.error('Rejection reason:', err.code, err.message);
        });
      }
      
      alert('File rejected. Please ensure the file is an image (PNG, JPG, or WebP) and under 20MB.');
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      console.log('File accepted:', file.name, file.type, file.size);
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result);
      };
      reader.onerror = () => {
        console.error('Failed to read file for preview');
        alert('Failed to read file. Please try another image.');
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxSize: 20 * 1024 * 1024, // 20MB
    multiple: false,
    disabled: disabled || isUploading
  });

  const handleUpload = () => {
    if (selectedFile && onUpload) {
      onUpload(selectedFile);
    }
  };

  const handleClear = () => {
    setPreview(null);
    setSelectedFile(null);
  };

  return (
    <div className="map-uploader">
      {!preview ? (
        <div 
          {...getRootProps()} 
          className={`dropzone ${isDragActive ? 'active' : ''} ${disabled || isUploading ? 'disabled' : ''}`}
        >
          <input {...getInputProps()} />
          <FiUpload className="upload-icon" />
          <p className="upload-text">
            {isDragActive ? (
              'Drop the image here...'
            ) : (
              <>
                Drag & drop a map image here, or click to select
                <br />
                <span className="upload-hint">
                  PNG, JPG, or WebP (max 20MB)
                </span>
              </>
            )}
          </p>
        </div>
      ) : (
        <div className="preview-container">
          <div className="preview-header">
            <div className="preview-info">
              <FiImage className="file-icon" />
              <span className="file-name">{selectedFile?.name}</span>
              <span className="file-size">
                {(selectedFile?.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>
            <button 
              className="clear-button" 
              onClick={handleClear}
              disabled={isUploading}
              title="Clear selection"
            >
              <FiX />
            </button>
          </div>
          
          <div className="preview-image-container">
            <img src={preview} alt="Map preview" className="preview-image" />
          </div>

          <div className="upload-actions">
            <button 
              className="cancel-button" 
              onClick={handleClear}
              disabled={isUploading}
            >
              Cancel
            </button>
            <button 
              className="upload-button" 
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload Map'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MapUploader;
