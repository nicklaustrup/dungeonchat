import React from 'react';

export function ImagePreviewModal({ imagePreview, uploading, onSend, onCancel }) {
  if (!imagePreview) return null;
  return (
    <div className="image-preview-container" role="dialog" aria-modal="true" aria-label="Image preview">
      <div className="image-preview">
        <img src={imagePreview} alt="Preview" />
        <div className="image-preview-actions">
          <button
            onClick={onSend}
            disabled={uploading}
            className="send-image-btn"
          >
            {uploading ? 'Uploading...' : 'Send Image'}
          </button>
          <button
            onClick={onCancel}
            className="cancel-image-btn"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
