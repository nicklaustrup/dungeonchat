import React from 'react';

export default function SearchBar({ value, onChange }) {
  return (
    <div className="search-wrapper">
      <div className="search-container always-visible">
        <input
          type="text"
          placeholder="Search"
          aria-label="Search messages"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="search-input-field"
        />
      </div>
    </div>
  );
}
