import React from 'react';

export default function ImagePreviewModal({ open, src, onClose }) {
  const contentRef = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="image-modal" onClick={onClose} role="dialog" aria-modal="true" aria-label="Image preview" data-testid="image-preview-modal">
      <div className="image-modal-content" ref={contentRef} onClick={(e) => e.stopPropagation()}>
        <img src={src} alt="Full size view" loading="eager" />
        <button className="image-modal-close" onClick={onClose} aria-label="Close image preview">×</button>
      </div>
    </div>
  );
}
