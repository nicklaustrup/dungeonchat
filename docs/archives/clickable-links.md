# Clickable Links in Chat Messages

## Overview
Chat messages now automatically detect and convert URLs into clickable links. This feature works alongside the existing search highlighting functionality.

## Features

### Supported URL Formats
- Full URLs: `https://example.com`, `http://example.org`
- WWW URLs: `www.example.com` (automatically prefixed with `https://`)
- Domain-only URLs: `example.com`, `github.io` (automatically prefixed with `https://`)

### Behavior
- **Clickable**: All detected URLs become clickable links that open in a new tab
- **Security**: All external links include `rel="noopener noreferrer"` for security
- **Styling**: Links are styled with appropriate colors for both light and dark themes
- **Word Breaking**: Long URLs are broken appropriately to prevent layout issues
- **Event Handling**: Link clicks don't trigger message selection or other chat interactions

### Search Integration
The link detection works seamlessly with search highlighting:
- Search terms are highlighted even within messages containing links
- Both features work together without interfering

## Implementation Details

### Core Files
- **`src/utils/linkify.js`**: Main utility for processing message text
- **`src/components/ChatRoom/ChatMessage.js`**: Updated to use the new linkify function
- **`src/components/ChatRoom/ChatMessage.css`**: Added styles for `.message-link`

### Function: `processMessageText(text, searchTerm)`
- **Input**: Message text string and optional search term
- **Output**: Array of React elements (text nodes, link elements, highlighted text)
- **Features**: 
  - Detects URLs using regex pattern
  - Preserves search term highlighting
  - Handles edge cases (no URLs, no search terms, etc.)

### CSS Classes
- **`.message-link`**: Base link styling
- **`.message-link:hover`**: Hover state
- **`.message-link:active`**: Active/pressed state
- **`.light-theme .message-link`**: Light theme variants

## Testing
- **Unit Tests**: `src/utils/__tests__/linkify.test.js`
- **Storybook Stories**: New stories in ChatMessage.stories.jsx:
  - `WithLinks`: Single and multiple URL examples
  - `MultipleLinks`: Complex message with several links
  - `LinksWithSearch`: Demonstrates search + links working together

## Browser Compatibility
- All modern browsers supporting ES6+ and React
- Uses standard `target="_blank"` for new tab behavior
- Falls back gracefully for older browsers

## Security Considerations
- External links include `rel="noopener noreferrer"` 
- URLs are not validated beyond pattern matching
- No automatic protocol detection beyond `http/https`
- Click events are stopped from propagating to prevent unintended actions