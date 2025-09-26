import React from 'react';

export function ImagePreviewModal({ imagePreview, uploading, onSend, onCancel }) {
  const dialogRef = React.useRef(null);
  const lastActiveRef = React.useRef(null);

  React.useEffect(() => {
    if (imagePreview) {
      lastActiveRef.current = document.activeElement;
      // Focus first actionable button after mount
      requestAnimationFrame(() => {
        const btn = dialogRef.current?.querySelector('.send-image-btn');
        if (btn) btn.focus();
      });
    }
  }, [imagePreview]);

  React.useEffect(() => {
    if (!imagePreview) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        // Allow Cmd/Ctrl + Enter to send
        if (!uploading) onSend();
      } else if (e.key === 'Tab') {
        // Basic focus trap
        const focusables = dialogRef.current?.querySelectorAll('button');
        if (!focusables || focusables.length === 0) return;
        const list = Array.from(focusables);
        const idx = list.indexOf(document.activeElement);
        let next = idx;
        if (e.shiftKey) {
          next = idx <= 0 ? list.length - 1 : idx - 1;
        } else {
          next = idx === list.length - 1 ? 0 : idx + 1;
        }
        e.preventDefault();
        list[next].focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [imagePreview, onCancel, onSend, uploading]);

  const handleSend = React.useCallback(() => {
    if (uploading) return; // prevent duplicate sends
    onSend();
  }, [onSend, uploading]);

  if (!imagePreview) return null;
  return (
    <div className="image-preview-container" role="dialog" aria-modal="true" aria-label="Image preview" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="image-preview" ref={dialogRef}>
        <img src={imagePreview} alt="Preview" />
        <div className="image-preview-actions">
          <button
            onClick={handleSend}
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
        <div className="image-preview-hints" aria-hidden="true">
          <span>Esc to cancel · Ctrl/Cmd+Enter to send</span>
        </div>
      </div>
    </div>
  );
}
