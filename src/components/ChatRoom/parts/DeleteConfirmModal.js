import React from 'react';

export default function DeleteConfirmModal({ open, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="delete-modal-overlay" role="dialog" aria-modal="true" aria-label="Confirm delete" onMouseDown={(e) => { e.stopPropagation(); }} onClick={(e) => { e.stopPropagation(); }} data-testid="delete-confirm-modal">
      <div className="delete-modal" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
        <h4>Delete message?</h4>
        <p className="no-bg">This action cannot be undone.</p>
        <div className="delete-modal-actions">
          <button className="danger" onClick={onConfirm} autoFocus>Delete</button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
      <div className="delete-modal-backdrop-click-capture" onMouseDown={(e) => { e.stopPropagation(); onCancel(); }} />
    </div>
  );
}
