import React from 'react';
import { FiAlertTriangle, FiX } from 'react-icons/fi';
import './DeleteTokenModal.css';

/**
 * DeleteTokenModal - Confirmation modal for token deletion
 * Replaces browser confirm() with a custom modal
 */
const DeleteTokenModal = ({ token, onConfirm, onCancel }) => {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="delete-token-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <FiAlertTriangle size={24} color="#f59e0b" />
          <h3>Delete Token</h3>
          <button className="modal-close" onClick={onCancel}>
            <FiX size={20} />
          </button>
        </div>
        
        <div className="modal-body">
          <p>Are you sure you want to delete this token?</p>
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
          <button className="btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-delete" onClick={onConfirm}>
            Delete Token
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteTokenModal;
