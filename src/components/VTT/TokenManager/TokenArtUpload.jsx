import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import "./TokenArtUpload.css";

/**
 * TokenArtUpload - Component for uploading custom token artwork
 * Supports drag-and-drop and displays current token art if available
 */
const TokenArtUpload = ({ selectedToken, onUpload, onRemove, isUploading }) => {
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
    onDrop: (acceptedFiles, rejectedFiles) => {
      setError(null);

      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.code === "file-too-large") {
          setError("File is too large. Maximum size is 5MB.");
        } else if (rejection.errors[0]?.code === "file-invalid-type") {
          setError(
            "Invalid file type. Please upload an image (PNG, JPG, GIF, or WebP)."
          );
        } else {
          setError("Failed to upload file. Please try again.");
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0];

        // Generate preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target.result);
        };
        reader.readAsDataURL(selectedFile);

        // Call upload handler
        onUpload(selectedFile);
      }
    },
  });

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    onRemove();
  };

  const currentImage = preview || selectedToken?.imageUrl;
  const hasImage = !!currentImage;

  return (
    <div className="token-art-upload-section">
      <label className="upload-label">Custom Token Art</label>

      {hasImage ? (
        <div className="current-art-container">
          <div className="art-preview">
            <img src={currentImage} alt="Token art" />
          </div>
          <div className="art-actions">
            <div {...getRootProps()} className="update-dropzone">
              <input {...getInputProps()} />
              <button
                type="button"
                className="update-button"
                disabled={isUploading}
              >
                {isUploading ? "⏳ Uploading..." : "🔄 Update Image"}
              </button>
            </div>
            <button
              type="button"
              className="remove-button"
              onClick={handleRemove}
              disabled={isUploading}
            >
              🗑️ Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`dropzone-compact ${isDragActive ? "active" : ""}`}
        >
          <input {...getInputProps()} />
          <div className="dropzone-content-compact">
            <span className="upload-icon">📤</span>
            <span className="upload-text">
              {isDragActive ? "Drop image here" : "Upload custom art"}
            </span>
            <span className="upload-hint">PNG, JPG, GIF, WebP • Max 5MB</span>
          </div>
        </div>
      )}

      {error && <div className="upload-error-compact">⚠️ {error}</div>}
    </div>
  );
};

export default TokenArtUpload;
