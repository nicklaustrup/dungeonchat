import React from 'react';

// URL regex pattern that matches common URL formats
const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/gi;

// Function to escape special regex characters in user-provided term
function escapeRegex(term) {
  return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Enhanced function that both highlights search terms and makes URLs clickable
export function processMessageText(text, searchTerm = '') {
  if (!text) return text;
  
  // First, let's find all URLs and their positions
  const urlMatches = [];
  let match;
  const urlRegex = new RegExp(URL_REGEX.source, URL_REGEX.flags);
  
  while ((match = urlRegex.exec(text)) !== null) {
    urlMatches.push({
      url: match[0],
      start: match.index,
      end: match.index + match[0].length
    });
  }
  
  // If no URLs and no search term, return original text
  if (urlMatches.length === 0 && !searchTerm) {
    return text;
  }
  
  // Split text into segments and process each one
  let lastIndex = 0;
  const segments = [];
  let segmentKey = 0;
  
  urlMatches.forEach((urlMatch) => {
    // Add text before URL
    if (lastIndex < urlMatch.start) {
      const beforeUrl = text.slice(lastIndex, urlMatch.start);
      segments.push(...processTextSegment(beforeUrl, searchTerm, segmentKey));
      segmentKey += beforeUrl.length;
    }
    
    // Add the URL as a clickable link
    const url = urlMatch.url;
    const href = url.startsWith('http') ? url : `https://${url}`;
    segments.push(
      <a
        key={`url-${segmentKey}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="message-link"
        onClick={(e) => e.stopPropagation()}
      >
        {url}
      </a>
    );
    segmentKey++;
    
    lastIndex = urlMatch.end;
  });
  
  // Add remaining text after last URL
  if (lastIndex < text.length) {
    const afterUrls = text.slice(lastIndex);
    segments.push(...processTextSegment(afterUrls, searchTerm, segmentKey));
  }
  
  return segments.length > 1 ? segments : segments[0] || text;
}

// Helper function to process text segments for search highlighting
function processTextSegment(textSegment, searchTerm, baseKey = 0) {
  if (!searchTerm || !textSegment) {
    return [textSegment];
  }
  
  const escaped = escapeRegex(searchTerm);
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = textSegment.split(regex);
  
  return parts.map((part, i) => {
    if (regex.test(part)) {
      return <mark key={`highlight-${baseKey}-${i}`} className="search-highlight">{part}</mark>;
    }
    return part;
  }).filter(part => part !== ''); // Remove empty strings
}

export { escapeRegex };
export default processMessageText;