import React from 'react';

export default function EditMessageForm({ value, onChange, onSave, onCancel, onKeyDown }) {
  return (
    <div className="edit-container" data-testid="edit-message-form">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        aria-label="Edit message text"
        autoFocus
      />
      <div className="edit-actions">
        <button onClick={onSave} aria-label="Save edit" className="save-edit-btn">Save</button>
        <button onClick={onCancel} aria-label="Cancel edit" className="cancel-edit-btn">Cancel</button>
      </div>
    </div>
  );
}
