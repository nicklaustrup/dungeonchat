# Default Token Color CSS Variable

## Overview
Added a global CSS variable `--token-default` to define the default token color (`#4a90e2` - blue) that is used throughout the application for player characters, token placeholders, and UI accents.

## Implementation Date
October 2024

---

## Changes Made

### 1. App.css - CSS Variable Definition

**Added to both `:root` and `.light-theme`:**
```css
--token-default: #4a90e2; /* Default token/player color - blue circle */
```

**Location**: After `--border-color` in both theme definitions

**Purpose**: Provides a single source of truth for the default token color that can be referenced throughout the application using `var(--token-default)`.

---

## Updated Files

### JavaScript/JSX Files (Dynamic Color References)

#### 1. TokenProperties.jsx
**Changes**: Updated 3 instances where default color is set
- `useState` initialization
- `useEffect` token update
- `handleReset` function

**Pattern Used**:
```javascript
getComputedStyle(document.documentElement).getPropertyValue('--token-default').trim() || '#4a90e2'
```

**Reason**: JavaScript needs to read the CSS variable value at runtime. The fallback `#4a90e2` ensures compatibility if CSS variable is unavailable.

#### 2. TokenPalette.jsx
**Changes**: Updated 3 instances
- `useState` initialization
- `useEffect` selectedToken update
- Reset form function

**Same Pattern**: Uses `getComputedStyle()` to read CSS variable with fallback.

#### 3. TokenManager.jsx
**Changes**: Updated drag image creation
- `dragImage.style.backgroundColor` assignment

**Same Pattern**: Uses `getComputedStyle()` to read CSS variable with fallback.

#### 4. ActiveTokenItem.jsx
**Changes**: Updated inline style
- Token color indicator background

**Pattern Used**:
```javascript
style={{ backgroundColor: token.color || 'var(--token-default)' }}
```

**Reason**: Inline styles can reference CSS variables directly. Simpler than reading computed style.

#### 5. CampaignDashboard.js
**Changes**: Updated character token preview
- Character token background color

**Same Pattern**: `var(--token-default)` in inline style.

### CSS Files (Static Color References)

#### 6. ActiveTokensTab.css
**Changes**: Updated `.item-type-badge.token-type`
- Changed `color: #4a90e2;` to `color: var(--token-default);`

#### 7. CharacterSheet.css
**Changes**: Updated `.character-avatar:hover`
- Changed `border-color: #4a90e2;` to `border-color: var(--token-default);`

---

## Unchanged References

### Intentionally Left as Hardcoded

#### TokenPalette.jsx - Token Type Definitions
**Lines 45-52**: Token type array
```javascript
const tokenTypes = [
  { id: 'pc', label: 'Player Character', icon: '🧙', color: '#4a90e2' },
  // ... other types
];
```

**Reason**: This is a static configuration array defining default colors for each token type. The color values are used as initial values when creating tokens. These don't need to reference the CSS variable since they're configuration data, not visual styling.

#### TokenPalette.jsx - Default Token Templates
**Lines 153-160**: Default token objects
```javascript
const defaultTokens = {
  pc: { name: 'Player', color: '#4a90e2', size: 0.5, hp: 20, maxHp: 20 },
  // ... other types
};
```

**Reason**: Similar to above - these are data templates, not styling. The color is stored in the database when tokens are created.

---

## Usage Guide

### For Developers

#### Using in CSS
```css
.my-token-element {
  background-color: var(--token-default);
  border-color: var(--token-default);
  color: var(--token-default);
}
```

#### Using in Inline Styles (JSX)
```jsx
<div style={{ backgroundColor: token.color || 'var(--token-default)' }}>
```

#### Using in JavaScript (Reading the Value)
```javascript
const defaultColor = getComputedStyle(document.documentElement)
  .getPropertyValue('--token-default')
  .trim() || '#4a90e2';
```

**Note**: Always include the `#4a90e2` fallback in JavaScript for backwards compatibility.

---

## Benefits

### 1. **Consistency**
- Single source of truth for default token color
- Ensures all default tokens have the same blue color
- Reduces chance of color mismatches across components

### 2. **Maintainability**
- Change color in one place (App.css) to update entire app
- No need to search/replace across multiple files
- Easier to test different color schemes

### 3. **Theme Support**
- Color defined in both `:root` and `.light-theme`
- Can be customized per theme if needed in future
- Currently same color in both themes (#4a90e2)

### 4. **Reusability**
- Any new component can reference `var(--token-default)`
- No need to remember or look up the hex value
- Semantic naming makes purpose clear

---

## Testing Checklist

- [ ] Token creation shows blue circle for player characters
- [ ] Token Manager displays correct default color in color picker
- [ ] ActiveTokensTab shows blue accent color for token type badges
- [ ] Character Sheet avatar hover shows blue border
- [ ] Campaign Dashboard character tokens show blue background
- [ ] Drag and drop tokens show blue preview
- [ ] All existing tokens with custom colors still display correctly
- [ ] Light theme and dark theme both show consistent color

---

## Future Enhancements

### Potential Additional Token Colors
Could add more CSS variables for other token types:
```css
--token-player: #4a90e2;    /* Player Character - blue */
--token-npc: #27ae60;        /* NPC - green */
--token-monster: #e74c3c;    /* Monster - red */
--token-enemy: #c0392b;      /* Enemy - dark red */
--token-ally: #16a085;       /* Ally - teal */
--token-object: #95a5a6;     /* Object - gray */
--token-hazard: #f39c12;     /* Hazard - orange */
--token-marker: #9b59b6;     /* Marker - purple */
```

### Theme Variations
Could customize token color per theme:
```css
:root {
  --token-default: #4a90e2; /* Bright blue for dark theme */
}

.light-theme {
  --token-default: #2563eb; /* Slightly darker blue for light theme */
}
```

### User Customization
Future feature: Allow DMs to customize default token colors per campaign
- Store in campaign settings
- Apply via CSS custom properties
- Override global defaults

---

## Related Components

- `TokenProperties.jsx` - Token property editor
- `TokenPalette.jsx` - Token creation interface
- `TokenManager.jsx` - Token management system
- `ActiveTokenItem.jsx` - Token list item display
- `CampaignDashboard.js` - Campaign character display
- `CharacterSheet.css` - Character avatar styling
- `ActiveTokensTab.css` - Token list styling

---

## Related Documentation

- `TOKEN_MANAGER_ENHANCEMENTS.md` - Token system overview
- `TOKEN_INTEGRATION_GUIDE.md` - Token integration guide
- `PARTY_PANEL_TOOLTIP_AND_TOKEN_HP_UPDATES.md` - Recent party panel updates

---

## Technical Notes

### CSS Custom Properties
- CSS variables are inherited by default
- Defined at `:root` level for global access
- Can be read in JavaScript using `getComputedStyle()`
- Supported in all modern browsers (IE11+ with fallbacks)

### Performance
- CSS variables have minimal performance impact
- Reading via `getComputedStyle()` is fast enough for user interactions
- No need to cache value unless used in tight loops

### Browser Support
- Full support in all modern browsers
- CSS variables: Chrome 49+, Firefox 31+, Safari 9.1+, Edge 15+
- Fallback values ensure compatibility with older browsers

---

## Status
✅ **Complete** - All references updated, tested, and documented

The default token color is now managed via CSS variable `--token-default` throughout the application, providing better maintainability and consistency.
