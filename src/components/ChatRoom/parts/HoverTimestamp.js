import React from 'react';

export default function HoverTimestamp({ createdAt, formatTimestamp }) {
  const label = formatTimestamp(createdAt);
  return (
    <div className="hover-time" title={label} aria-hidden="true" data-testid="hover-timestamp">{label.split(', ')[1]}</div>
  );
}
