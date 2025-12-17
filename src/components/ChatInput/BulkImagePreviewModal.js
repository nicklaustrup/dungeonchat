import React from "react";
import "./BulkImagePreviewModal.css";

export function BulkImagePreviewModal({
  images,
  uploading,
  error,
  onSend,
  onCancel,
  onRetry,
  onRemoveImage,
}) {
  const dialogRef = React.useRef(null);
  const lastActiveRef = React.useRef(null);

  React.useEffect(() => {
    if (images && images.length > 0) {
      lastActiveRef.current = document.activeElement;
      // Focus first actionable button after mount
      requestAnimationFrame(() => {
        const btn = dialogRef.current?.querySelector(".send-images-btn");
        if (btn) btn.focus();
      });
    }
  }, [images]);

  React.useEffect(() => {
    if (!images || images.length === 0) return;

    const handleKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        // Allow Cmd/Ctrl + Enter to send
        if (!uploading) onSend();
      } else if (e.key === "Tab") {
        // Basic focus trap
        const focusables = dialogRef.current?.querySelectorAll(
          "button:not(:disabled)"
        );
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
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [images, onCancel, onSend, uploading]);

  // Track that user already initiated send to disable button immediately
  const [pendingSend, setPendingSend] = React.useState(false);
  React.useEffect(() => {
    if (!uploading) {
      setPendingSend(false);
    }
  }, [uploading]);

  const handleSend = React.useCallback(() => {
    if (uploading || pendingSend || !images || images.length === 0) return;
    setPendingSend(true);
    onSend();
  }, [onSend, uploading, pendingSend, images]);

  const handleRemoveImage = React.useCallback(
    (imageId, e) => {
      e.stopPropagation();
      onRemoveImage(imageId);
    },
    [onRemoveImage]
  );

  if (!images || images.length === 0) return null;

  return (
    <div
      className="bulk-image-preview-container"
      role="dialog"
      aria-modal="true"
      aria-label={`Preview of ${images.length} image${images.length > 1 ? "s" : ""}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="bulk-image-preview" ref={dialogRef}>
        <div className="bulk-image-header">
          <h3>
            {images.length} Image{images.length > 1 ? "s" : ""} Selected
          </h3>
        </div>

        <div className="bulk-image-grid">
          {images.map((image) => (
            <div key={image.id} className="bulk-image-item">
              <div className="bulk-image-wrapper">
                <img src={image.preview} alt="Preview" />
                <button
                  className="bulk-image-remove"
                  onClick={(e) => handleRemoveImage(image.id, e)}
                  aria-label="Remove image"
                  type="button"
                  disabled={uploading}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c0-1 1-2 2-2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bulk-image-actions">
          <button
            onClick={handleSend}
            disabled={uploading || pendingSend || images.length === 0}
            aria-disabled={uploading || pendingSend || images.length === 0}
            className={`send-images-btn ${uploading || pendingSend || images.length === 0 ? "disabled" : ""}`.trim()}
          >
            {uploading
              ? "Uploading…"
              : pendingSend
                ? "Sending…"
                : `Send ${images.length} Image${images.length > 1 ? "s" : ""}`}
          </button>

          {false && !uploading && error && onRetry && (
            <button
              type="button"
              disabled={false}
              onClick={() => {
                if (onRetry) onRetry();
              }}
              className="retry-images-btn"
            >
              Retry
            </button>
          )}

          <button
            onClick={onCancel}
            className="cancel-images-btn"
            type="button"
            disabled={uploading}
          >
            {uploading ? "Cancel Upload" : "Cancel"}
          </button>
        </div>

        <div className="bulk-image-hints" aria-hidden="true">
          <span>
            Esc to cancel · Ctrl/Cmd+Enter to send · Click trash icon to remove
            individual images
          </span>
        </div>
      </div>
    </div>
  );
}
