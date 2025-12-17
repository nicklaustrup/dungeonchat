import React from "react";

// Escape special regex characters in user-provided term.
function escapeRegex(term) {
  return term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Returns an array of strings / <mark> nodes. Pure & testable.
export function highlightText(raw, term) {
  if (!raw || !term) return raw;
  const escaped = escapeRegex(term);
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = raw.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="search-highlight">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export { escapeRegex };

export default highlightText;
