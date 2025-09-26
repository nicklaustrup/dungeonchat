import React from 'react';

export default function ImagePreviewModal({ open, src, onClose }) {
  if (!open) return null;
  return (
    <div className="image-modal" onClick={onClose} role="dialog" aria-modal="true" aria-label="Image preview" data-testid="image-preview-modal">
      <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt="Full size view" />
        <button className="image-modal-close" onClick={onClose} aria-label="Close image preview">✕</button>
      </div>
    </div>
  );
}
