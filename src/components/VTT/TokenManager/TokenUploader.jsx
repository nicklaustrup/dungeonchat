import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import './TokenUploader.css';

/**
 * TokenUploader - Upload custom token images
 * Drag-and-drop interface for uploading token artwork
 */
const TokenUploader = ({ onUpload, isUploading }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [tokenName, setTokenName] = useState('');
  const [tokenType, setTokenType] = useState('pc');
  const [error, setError] = useState(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
    onDrop: (acceptedFiles, rejectedFiles) => {
      setError(null);

      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.code === 'file-too-large') {
          setError('File is too large. Maximum size is 5MB.');
        } else if (rejection.errors[0]?.code === 'file-invalid-type') {
          setError('Invalid file type. Please upload an image (PNG, JPG, GIF, or WebP).');
        } else {
          setError('Failed to upload file. Please try again.');
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0];
        setFile(selectedFile);

        // Generate preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target.result);
        };
        reader.readAsDataURL(selectedFile);

        // Auto-populate name from filename (remove extension)
        if (!tokenName) {
          const name = selectedFile.name.replace(/\.[^/.]+$/, '');
          setTokenName(name);
        }
      }
    }
  });

  const tokenTypes = [
    { id: 'pc', label: 'Player Character', icon: '🧙' },
    { id: 'npc', label: 'NPC', icon: '👤' },
    { id: 'monster', label: 'Monster', icon: '👹' },
    { id: 'enemy', label: 'Enemy', icon: '⚔️' },
    { id: 'ally', label: 'Ally', icon: '🤝' },
    { id: 'object', label: 'Object', icon: '📦' },
  ];

  const handleUpload = () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    if (!tokenName.trim()) {
      setError('Please enter a token name');
      return;
    }

    const tokenData = {
      name: tokenName.trim(),
      type: tokenType,
      size: 1, // Default size
      hidden: false,
    };

    onUpload(file, tokenData);
  };

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setTokenName('');
    setTokenType('pc');
    setError(null);
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  return (
    <div className="token-uploader">
      {!file ? (
        <div
          {...getRootProps()}
          className={`dropzone ${isDragActive ? 'active' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="dropzone-content">
            <div className="dropzone-icon">📤</div>
            <p className="dropzone-title">
              {isDragActive ? 'Drop your token image here' : 'Drag & drop a token image'}
            </p>
            <p className="dropzone-subtitle">or click to browse</p>
            <p className="dropzone-hint">PNG, JPG, GIF, or WebP • Max 5MB</p>
          </div>
        </div>
      ) : (
        <div className="upload-preview">
          <div className="preview-image-container">
            <img src={preview} alt="Token preview" className="preview-image" />
          </div>

          <div className="upload-form">
            <div className="form-group">
              <label className="form-label">Token Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Fire Elemental"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                disabled={isUploading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Token Type</label>
              <div className="type-selector">
                {tokenTypes.map((type) => (
                  <button
                    key={type.id}
                    className={`type-button ${tokenType === type.id ? 'selected' : ''}`}
                    onClick={() => setTokenType(type.id)}
                    disabled={isUploading}
                  >
                    <span className="type-icon">{type.icon}</span>
                    <span className="type-label">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="upload-error">
                ⚠️ {error}
              </div>
            )}

            <div className="upload-actions">
              <button
                className="upload-button primary"
                onClick={handleUpload}
                disabled={isUploading || !tokenName.trim()}
              >
                {isUploading ? '⏳ Uploading...' : '✨ Upload Token'}
              </button>
              <button
                className="upload-button secondary"
                onClick={handleClear}
                disabled={isUploading}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenUploader;
