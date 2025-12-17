import React, { useEffect, useRef } from "react";
import { FiAlertTriangle, FiX } from "react-icons/fi";
import "./DeleteTokenModal.css";

/**
 * DeleteTokenModal - Confirmation modal for token deletion
 * Replaces browser confirm() with a custom modal
 * Includes accessibility features: role="dialog", focus trap, ARIA labels
 */
const DeleteTokenModal = ({ token, onConfirm, onCancel }) => {
  const modalRef = useRef(null);
  const cancelButtonRef = useRef(null);

  // Focus trap and escape key handling
  useEffect(() => {
    // Focus the modal when it opens
    if (cancelButtonRef.current) {
      cancelButtonRef.current.focus();
    }

    // Handle escape key
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    // Trap focus within modal
    const handleTab = (e) => {
      if (e.key !== "Tab") return;

      const focusableElements = modalRef.current?.querySelectorAll(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])"
      );
      const firstElement = focusableElements?.[0];
      const lastElement = focusableElements?.[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("keydown", handleTab);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleTab);
    };
  }, [onCancel]);

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        ref={modalRef}
        className="delete-token-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="delete-token-title"
        aria-describedby="delete-token-description"
        aria-modal="true"
      >
        <div className="modal-header">
          <FiAlertTriangle size={24} color="#f59e0b" aria-hidden="true" />
          <h3 id="delete-token-title">Delete Token</h3>
          <button
            className="modal-close"
            onClick={onCancel}
            aria-label="Close dialog"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p id="delete-token-description">
            Are you sure you want to delete this token?
          </p>
          {token && (
            <div className="token-preview">
              <div
                className="token-color-dot"
                style={{ backgroundColor: token.color }}
              />
              <div className="token-details">
                <span className="token-name">{token.name}</span>
                <span className="token-type">{token.type}</span>
              </div>
            </div>
          )}
          <p className="warning-text">This action cannot be undone.</p>
        </div>

        <div className="modal-footer">
          <button
            ref={cancelButtonRef}
            className="btn-cancel"
            onClick={onCancel}
            aria-label="Cancel and close dialog"
          >
            Cancel
          </button>
          <button
            className="btn-delete"
            onClick={onConfirm}
            aria-label="Confirm token deletion"
          >
            Delete Token
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteTokenModal;
