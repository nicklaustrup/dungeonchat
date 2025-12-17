# SuperChat UI Style Guide & Design System

_A comprehensive template for future AI agents working on SuperChat's design components_

## Overview

This style guide documents the visual design system used throughout SuperChat, including color schemes, typography, component patterns, and layout principles. It serves as a reference for maintaining visual consistency across the application.

---

## 🎨 Color System

### CSS Custom Properties Structure

All colors are defined using CSS custom properties (variables) in `:root` and `.light-theme` selectors for easy theme switching.

### Dark Theme (Default)

```css
:root {
  /* Background Colors */
  --bg-primary: #1e1f21; /* Main background (charcoal) */
  --bg-secondary: #242628; /* Surface backgrounds (slightly lighter) */
  --bg-light: #2d3033; /* Cards, panels, elevated surfaces */
  --bg-header: #1a1b1d; /* Header background (darker) */
  --bg-form: #27292b; /* Form backgrounds */
  --bg-input: #303337; /* Input field backgrounds */

  /* Text Colors */
  --text-primary: #ffffff; /* Primary text */
  --text-color: #ffffff; /* General text (alias) */
  --text-secondary: rgba(255, 255, 255, 0.55); /* Secondary/muted text */

  /* Brand Colors */
  --primary-color: #0b93f6; /* Primary blue - buttons, links, accents */
  --primary-dark: #0a82e0; /* Darker primary for hover states */
  --secondary-color: #888; /* Secondary gray for less important elements */

  /* UI Colors */
  --message-sent: #0b93f6; /* Sent message bubbles */
  --message-received: #0b93f6; /* Received message bubbles */
  --message-received-text: #ffffff; /* Text in received messages */
  --border-color: rgba(255, 255, 255, 0.18); /* Borders, dividers */
}
```

### Light Theme

```css
.light-theme {
  /* Background Colors */
  --bg-primary: #fafafa; /* Main background (light gray) */
  --bg-secondary: #ffffff; /* Surface backgrounds (white) */
  --bg-light: #f0f2f4; /* Cards, panels */
  --bg-header: #ffffff; /* Header background */
  --bg-form: #ffffff; /* Form backgrounds */
  --bg-input: #ffffff; /* Input field backgrounds */

  /* Text Colors */
  --text-primary: #1e1f21; /* Primary text (dark) */
  --text-color: #1e1f21; /* General text */
  --text-secondary: rgba(0, 0, 0, 0.55); /* Secondary/muted text */

  /* Brand Colors (unchanged) */
  --primary-color: #0b93f6;
  --primary-dark: #0a82e0;
  --secondary-color: #666;

  /* UI Colors */
  --message-received-text: #1e1f21; /* Dark text on light backgrounds */
  --border-color: rgba(0, 0, 0, 0.15); /* Lighter borders for light theme */
}
```

### Color Usage Guidelines

- **Primary Blue (`#0b93f6`)**: Use for interactive elements, primary buttons, links, and brand accents
- **Background Hierarchy**: `bg-primary` → `bg-secondary` → `bg-light` (darkest to lightest)
- **Text Hierarchy**: `text-primary` for main content, `text-secondary` for supporting information
- **Border/Dividers**: Use `border-color` with low opacity for subtle divisions

---

## 🔘 Button Design System

### Base Button Structure

```css
/* Standard button foundation */
.btn-base {
  border: none;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.18s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  text-decoration: none;
  box-sizing: border-box;
}
```

### Button Variants

#### 1. Primary Buttons

- **Use**: Main actions, form submissions, important CTAs
- **Design**: Solid primary color background with white text

```css
.btn-primary {
  background: var(--primary-color);
  color: #ffffff;
  border: 1px solid var(--primary-color);
  border-radius: 8px;
  padding: 0.55rem 1.1rem;
  font-size: 0.8rem;
  letter-spacing: 0.5px;
}

.btn-primary:hover {
  background: var(--primary-dark);
}
```

#### 2. Secondary Buttons

- **Use**: Secondary actions, cancel buttons, less prominent actions
- **Design**: Outlined style with transparent background

```css
.btn-secondary {
  background: var(--bg-light);
  color: var(--text-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0.55rem 1.1rem;
  font-size: 0.8rem;
  letter-spacing: 0.5px;
}

.btn-secondary:hover {
  background: var(--primary-color);
  color: #ffffff;
}
```

#### 3. Icon Buttons

- **Use**: Toolbars, compact actions, reaction buttons
- **Design**: Square with rounded corners, minimal padding

```css
.btn-icon {
  background: transparent;
  color: var(--text-color);
  border: none;
  border-radius: 8px;
  padding: 4px 6px;
  width: 32px;
  height: 32px;
  font-size: 16px;
}

.btn-icon:hover {
  background: rgba(255, 255, 255, 0.08);
}

/* Light theme variant */
.light-theme .btn-icon:hover {
  background: rgba(0, 0, 0, 0.08);
}
```

#### 4. Close/X Buttons

- **Use**: Modal close, dismissing elements
- **Design**: Small square with X icon, positioned in top-right

```css
.btn-close {
  position: absolute;
  top: 0.65rem;
  right: 0.65rem;
  background: var(--bg-light);
  color: var(--text-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  width: 32px;
  height: 32px;
  font-size: 0.9rem;
  font-weight: 600;
}

.btn-close:hover {
  background: var(--primary-color);
  color: #ffffff;
}
```

#### 5. Danger Buttons

- **Use**: Destructive actions (delete, remove)
- **Design**: Red background with white text

```css
.btn-danger {
  background: #ff4d4f;
  border: 1px solid #ff4d4f;
  color: #ffffff;
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 0.75rem;
}

.btn-danger:hover {
  background: #ff2d2f;
}
```

### Touch Target Guidelines

- **Minimum size**: 44px × 44px for mobile/touch devices
- **Applied via classes**: `.bar-icon-btn`, `.menu-reaction-btn`, `.send-btn`
- **Responsive**: Only enlarged on touch devices or screens ≤599px

---

## 🎭 Modal Design System

### Modal Structure

All modals follow a consistent pattern with overlay, container, content, and close button.

### Base Modal Pattern

```css
/* Modal overlay - covers entire viewport */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* Modal container */
.modal {
  background: var(--bg-secondary);
  padding: 1.75rem 1.5rem 1.5rem;
  border-radius: 14px; /* Rounded corners */
  box-shadow:
    0 18px 42px -8px rgba(0, 0, 0, 0.55),
    0 6px 14px rgba(0, 0, 0, 0.35);
  width: 92%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
  animation: modalPop 0.32s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Modal animation */
@keyframes modalPop {
  0% {
    opacity: 0;
    transform: translateY(12px) scale(0.92);
  }
  70% {
    opacity: 1;
    transform: translateY(-2px) scale(1.02);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
```

### Modal Close Button (Top-Right X)

```css
.modal-close {
  position: absolute;
  top: 0.65rem;
  right: 0.65rem;
  background: var(--bg-light);
  color: var(--text-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 600;
  transition:
    background 0.18s ease,
    color 0.18s ease;
}

.modal-close:hover {
  background: var(--primary-color);
  color: #ffffff;
}
```

### Modal Variants

#### 1. Settings Modal

- **Use**: Application settings, user preferences
- **Features**: Item list with toggle controls, bottom action button

#### 2. Profile Modal

- **Use**: User profile information
- **Features**: Avatar, name, email, horizontal layout for content

#### 3. Confirmation Modal

- **Use**: Destructive actions requiring confirmation
- **Features**: Smaller size, action button row, danger styling

---

## 📐 Layout & Spacing

### Responsive Breakpoints

```css
:root {
  --bp-xs: 360px; /* Ultra small devices */
  --bp-sm: 600px; /* Mobile/phablet cutoff */
  --bp-md: 900px; /* Desktop threshold */
  --bp-lg: 1200px; /* Large desktop */
}
```

### Spacing Scale

- **xs**: 2px - Fine adjustments
- **sm**: 4px - Tight spacing
- **md**: 8px - Standard spacing
- **lg**: 12px - Comfortable spacing
- **xl**: 16px - Generous spacing
- **xxl**: 24px - Section spacing

### Border Radius Scale

- **sm**: 6px - ⚠️ **DEPRECATED** - Use 8px instead
- **md**: 8px - **PRIMARY** - Standard elements (buttons, inputs, tooltips, reactions)
- **lg**: 10px - ⚠️ **DEPRECATED** - Use 8px or 14px instead
- **xl**: 14px - **PRIMARY** - Modals, containers, message bars, typing bubbles
- **round**: 50% - Avatars, circular buttons (close buttons only)

---

## 🎯 Component Patterns

### Message Bubbles

- **Background**: Uses message-specific color variables
- **Padding**: 6px 12px for content
- **Border-radius**: 10px for rounded appearance
- **Hover**: Subtle background highlight with border glow

### Reaction Buttons

- **Container**: Floating bar with backdrop blur
- **Buttons**: 40px × 40px touch targets
- **Hover**: Semi-transparent white/black overlay
- **Mobile**: Always visible, positioned statically

### Input Fields

- **Background**: `var(--bg-input)`
- **Border**: 1px solid `var(--border-color)`
- **Border-radius**: 8px
- **Focus**: Primary color outline with 2px offset
- **Padding**: 6px 8px for text inputs

### Cards/Panels

- **Background**: `var(--bg-light)` or `var(--bg-secondary)`
- **Border**: Optional 1px solid `var(--border-color)`
- **Border-radius**: 10px - 14px depending on size
- **Shadow**: Multi-layered for depth (`0 6px 14px rgba(0,0,0,0.35)`)

---

## ✨ Animation & Transitions

### Standard Transition

```css
transition: all 0.18s ease;
```

**⚠️ Note**: All legacy transition durations (0.2s, 0.25s, 0.28s, 0.32s) should be updated to use **0.18s for micro-interactions** and **0.32s for component/modal animations** only.

### Hover Transitions

- **Duration**: 0.18s
- **Easing**: ease
- **Properties**: background, color, box-shadow, transform

### Modal Animations

- **Entry**: modalPop animation with scale and translateY
- **Duration**: 0.32s
- **Easing**: cubic-bezier(0.4, 0, 0.2, 1)

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition: none !important;
  }
}
```

---

## 📱 Mobile-First Considerations

### Touch Targets

- **Minimum**: 44px × 44px
- **Applied**: On touch devices and screens ≤599px
- **Classes**: `.bar-icon-btn`, `.reaction-btn`, `.send-btn`

### Mobile-Specific Patterns

- **Sticky Input**: Chat input sticks to bottom on mobile
- **Safe Area**: Padding for notched devices using `env(safe-area-inset-bottom)`
- **Condensed Headers**: Reduced padding and font sizes
- **Edge Handling**: Modals shift to avoid screen edges

### Responsive Typography

- **Base**: 16px (browser default)
- **Small Text**: 0.85rem - 0.9rem
- **Button Text**: 0.75rem - 0.8rem
- **Headings**: Scales down on mobile (20px → 18px)

---

## 🔧 Implementation Guidelines for AI Agents

### When Creating New Components:

1. **Always use CSS custom properties** for colors instead of hardcoded values
2. **Follow the button pattern hierarchy** - primary for main actions, secondary for supporting actions
3. **Include hover states** with the standard 0.18s transition
4. **Consider mobile touch targets** - add appropriate min-width/height for interactive elements
5. **Use consistent border-radius values** - 8px for buttons, 10-14px for containers
6. **Include light theme variants** where background/text colors are involved
7. **Add proper focus-visible styling** for accessibility

### Modal Checklist:

- [ ] Fixed overlay with rgba(0, 0, 0, 0.55) background
- [ ] Container with 14px border-radius
- [ ] Multi-layer box-shadow for depth
- [ ] modalPop animation on entry
- [ ] Top-right X close button (32px × 32px)
- [ ] Mobile responsive (92% width, max-width 420px)

### Color Usage Priorities:

1. Use CSS custom properties exclusively
2. Prefer semantic names (primary, secondary) over color names (blue, gray)
3. Test both light and dark themes
4. Maintain proper contrast ratios for accessibility

### Spacing Consistency:

- Use the documented spacing scale
- Prefer rem units for scalability
- Consider mobile spacing reductions in media queries

---

## 🏗️ React Component Templates

### Base Button Component

```jsx
import React from 'react';

const Button = ({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  disabled = false,
  onClick,
  ...props
}) => {
  const baseClasses = 'btn-base';
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    icon: 'btn-icon',
  };

  const sizeClasses = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg',
  };

  const className = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    disabled && 'btn-disabled',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={className}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {icon && (
        <span className="btn-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      {children && <span className="btn-text">{children}</span>}
    </button>
  );
};

export default Button;
```

### Modal Component Template

```jsx
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'modal-sm',
    md: 'modal-md',
    lg: 'modal-lg',
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal ${sizeClasses[size]}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {showCloseButton && (
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        )}

        {title && (
          <h2 id="modal-title" className="modal-title">
            {title}
          </h2>
        )}

        <div className="modal-content">{children}</div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
```

### Form Input Components

```jsx
import React from 'react';

// Text Input
export const TextInput = ({
  label,
  error,
  helper,
  required = false,
  ...inputProps
}) => (
  <div className="form-group">
    {label && (
      <label className="form-label">
        {label}
        {required && <span className="required-asterisk">*</span>}
      </label>
    )}
    <input
      className={`form-input ${error ? 'form-input-error' : ''}`}
      aria-invalid={error ? 'true' : 'false'}
      aria-describedby={
        error
          ? `${inputProps.id}-error`
          : helper
            ? `${inputProps.id}-helper`
            : undefined
      }
      {...inputProps}
    />
    {error && (
      <span id={`${inputProps.id}-error`} className="form-error" role="alert">
        {error}
      </span>
    )}
    {helper && !error && (
      <span id={`${inputProps.id}-helper`} className="form-helper">
        {helper}
      </span>
    )}
  </div>
);

// Textarea
export const TextArea = ({
  label,
  error,
  helper,
  required = false,
  rows = 3,
  ...textareaProps
}) => (
  <div className="form-group">
    {label && (
      <label className="form-label">
        {label}
        {required && <span className="required-asterisk">*</span>}
      </label>
    )}
    <textarea
      className={`form-textarea ${error ? 'form-input-error' : ''}`}
      rows={rows}
      aria-invalid={error ? 'true' : 'false'}
      aria-describedby={
        error
          ? `${textareaProps.id}-error`
          : helper
            ? `${textareaProps.id}-helper`
            : undefined
      }
      {...textareaProps}
    />
    {error && (
      <span
        id={`${textareaProps.id}-error`}
        className="form-error"
        role="alert"
      >
        {error}
      </span>
    )}
    {helper && !error && (
      <span id={`${textareaProps.id}-helper`} className="form-helper">
        {helper}
      </span>
    )}
  </div>
);

// Checkbox
export const Checkbox = ({
  label,
  helper,
  checked,
  onChange,
  ...checkboxProps
}) => (
  <div className="form-group form-group-checkbox">
    <label className="checkbox-label">
      <input
        type="checkbox"
        className="checkbox-input"
        checked={checked}
        onChange={onChange}
        {...checkboxProps}
      />
      <span className="checkbox-custom"></span>
      <span className="checkbox-text">{label}</span>
    </label>
    {helper && (
      <span className="form-helper form-helper-checkbox">{helper}</span>
    )}
  </div>
);

// Select
export const Select = ({
  label,
  error,
  helper,
  required = false,
  options = [],
  ...selectProps
}) => (
  <div className="form-group">
    {label && (
      <label className="form-label">
        {label}
        {required && <span className="required-asterisk">*</span>}
      </label>
    )}
    <select
      className={`form-select ${error ? 'form-input-error' : ''}`}
      aria-invalid={error ? 'true' : 'false'}
      aria-describedby={
        error
          ? `${selectProps.id}-error`
          : helper
            ? `${selectProps.id}-helper`
            : undefined
      }
      {...selectProps}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && (
      <span id={`${selectProps.id}-error`} className="form-error" role="alert">
        {error}
      </span>
    )}
    {helper && !error && (
      <span id={`${selectProps.id}-helper`} className="form-helper">
        {helper}
      </span>
    )}
  </div>
);
```

### Layout Components

#### Header Template

```jsx
import React from 'react';

const Header = ({
  title,
  user,
  actions,
  searchComponent,
  isMobile = false,
}) => (
  <header className={`app-header ${isMobile ? 'mobile-condense' : ''}`}>
    {!isMobile && (
      <div className="header-top desktop-layout">
        <h1 className="app-title">{title}</h1>
        <div className="logo-container" aria-hidden="true" />
        {user && (
          <div className="header-controls stacked">
            {actions}
            {searchComponent}
          </div>
        )}
      </div>
    )}

    {isMobile && (
      <div className="header-grid">
        <div className="header-left">
          <h1 className="app-title">{title}</h1>
          <div className="logo-container mobile" aria-hidden="true" />
        </div>
        <div className="header-right mobile-stack-right">
          {user && (
            <>
              {actions}
              {searchComponent}
            </>
          )}
        </div>
      </div>
    )}
  </header>
);

export default Header;
```

#### Chat Layout Template

```jsx
import React from 'react';

const ChatLayout = ({
  header,
  messageList,
  inputArea,
  overlays,
  className = '',
}) => (
  <div className={`app ${className}`}>
    {header}
    <section className="chat-section">
      <div className="chatroom-shell">
        <div className="chatroom-wrapper">{messageList}</div>
        <div className="chatroom-overlays">{overlays}</div>
      </div>
      {inputArea}
    </section>
  </div>
);

export default ChatLayout;
```

---

## 🎨 Icon System

### React Icons Usage

The app primarily uses **React Icons** for consistent, scalable icons. Prefer grayscale icons that work well with the color system.

#### Recommended Icon Libraries

- **Lucide React** (`react-icons/lu`) - Clean, minimal icons
- **Feather Icons** (`react-icons/fi`) - Lightweight stroke icons
- **VS Code Icons** (`react-icons/vsc`) - Developer-friendly icons
- **Font Awesome 6** (`react-icons/fa6`) - Comprehensive icon set

#### Icon Component Template

```jsx
import React from 'react';

const Icon = ({
  icon: IconComponent,
  size = 16,
  color,
  className = '',
  ...props
}) => (
  <IconComponent
    size={size}
    color={color}
    className={`icon ${className}`}
    aria-hidden="true"
    {...props}
  />
);

export default Icon;
```

#### Common Icon Patterns

```jsx
// Import examples from existing codebase
import { LuArrowDownToLine } from 'react-icons/lu'; // Scroll to bottom
import { FaPlus } from 'react-icons/fa6'; // Add/Upload
import { VscSmiley } from 'react-icons/vsc'; // Emoji picker

// Usage in components
<button className="btn-icon" aria-label="Upload image">
  <FaPlus size={18} aria-hidden="true" />
</button>;
```

#### Icon Sizing Guide

- **xs**: 12px - Tiny icons in dense UI
- **sm**: 16px - Default button icons
- **md**: 20px - Prominent actions
- **lg**: 24px - Header elements
- **xl**: 32px - Large touch targets

#### Emoji Usage

- Use **Unicode emojis** for reactions and casual elements
- **Accessibility**: Always include `aria-hidden="true"` on decorative emojis
- **Search icons**: Simple Unicode (🔍) acceptable for basic functionality

```jsx
// Emoji in buttons (existing pattern)
<button className="search-icon-btn" aria-label="Open search">
  🔍
</button>
```

---

## ✨ Animation System

### Core Animation Principles

- **Duration**: 0.18s for micro-interactions, 0.32s for component transitions
- **Easing**: `ease` for simple transitions, `cubic-bezier()` for complex animations
- **Reduced Motion**: Always respect `prefers-reduced-motion: reduce`

### Animation Library

#### 1. Modal Pop Animation

```css
@keyframes modalPop {
  0% {
    opacity: 0;
    transform: translateY(12px) scale(0.92);
  }
  70% {
    opacity: 1;
    transform: translateY(-2px) scale(1.02);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal {
  animation: modalPop 0.32s cubic-bezier(0.4, 0, 0.2, 1);
}
```

#### 2. Tooltip Popup Animation

```css
@keyframes tooltipPop {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(4px) scale(0.9);
  }
  60% {
    opacity: 1;
    transform: translateX(-50%) translateY(-2px) scale(1.03);
  }
  100% {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
}

/* Tooltip component - reusable for any element */
.tooltip {
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(20, 20, 22, 0.92);
  color: #fff;
  font-size: 11px;
  padding: 10px;
  border-radius: 8px;
  white-space: nowrap;
  pointer-events: none;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45);
  animation: tooltipPop 0.18s cubic-bezier(0.22, 1.2, 0.42, 1);
  z-index: 3000;
}

.light-theme .tooltip {
  background: rgba(255, 255, 255, 0.95);
  color: #111;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
}
```

#### 3. Typing Indicator Animation

```css
/* Typing bubble container */
.typing-bubble {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(40, 40, 48, 0.88);
  color: #f1f2f5;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 13px;
  width: fit-content;
  box-shadow: 0 4px 10px -2px rgba(0, 0, 0, 0.4);
  animation: tbFadeIn 0.25s ease;
  pointer-events: none;
}

.light-theme .typing-bubble {
  background: rgba(240, 240, 245, 0.95);
  color: #222;
}

/* Animated typing dots */
.typing-dots {
  display: inline-flex;
  gap: 4px;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  background: #42a5f5;
  border-radius: 50%;
  display: block;
  animation: typingBounce 1s infinite ease-in-out;
}

.light-theme .typing-dots span {
  background: #1976d2;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.15s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes typingBounce {
  0%,
  80%,
  100% {
    transform: scale(0.4);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes tbFadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

#### 4. Reusable Typing Indicator Component

```jsx
import React from 'react';

const TypingIndicator = ({
  users = [],
  className = '',
  variant = 'bubble', // 'bubble' | 'inline' | 'minimal'
}) => {
  if (!users.length) return null;

  const names = users.slice(0, 3).map((u) => u.displayName || 'Someone');
  const more = users.length - names.length;
  const label =
    more > 0
      ? `${names.join(', ')} +${more} typing...`
      : `${names.join(', ')} ${names.length === 1 ? 'is' : 'are'} typing...`;

  return (
    <div
      className={`typing-bubble ${variant} ${className}`}
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="typing-dots" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <span className="typing-text">{label}</span>
    </div>
  );
};

export default TypingIndicator;
```

#### 5. Loading Spinner Animation

```css
@keyframes spinner {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color);
  border-top: 2px solid var(--primary-color);
  border-radius: 50%;
  animation: spinner 1s linear infinite;
}
```

#### 6. Fade In/Out Utilities

```css
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

.fade-in {
  animation: fadeIn 0.18s ease;
}

.fade-out {
  animation: fadeOut 0.18s ease;
}
```

---

## � Form Elements

### Complete Form Styling System

```css
/* Form Foundation */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 1rem;
}

.form-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 4px;
}

.required-asterisk {
  color: #ff4d4f;
  margin-left: 4px;
}

/* Text Inputs */
.form-input,
.form-textarea,
.form-select {
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 0.9rem;
  color: var(--text-color);
  font-family: inherit;
  transition: all 0.18s ease;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
  border-color: var(--primary-color);
}

.form-input-error {
  border-color: #ff4d4f;
}

.form-input-error:focus {
  outline-color: #ff4d4f;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

/* Select Dropdown */
.form-select {
  cursor: pointer;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  padding-right: 40px;
}

/* Checkbox */
.form-group-checkbox {
  flex-direction: row;
  align-items: flex-start;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  line-height: 1.4;
}

.checkbox-input {
  opacity: 0;
  position: absolute;
  pointer-events: none;
}

.checkbox-custom {
  width: 18px;
  height: 18px;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-input);
  position: relative;
  flex-shrink: 0;
  transition: all 0.18s ease;
}

.checkbox-input:checked + .checkbox-custom {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

.checkbox-input:checked + .checkbox-custom::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 5px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.checkbox-input:focus + .checkbox-custom {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

.checkbox-text {
  color: var(--text-color);
}

.form-helper-checkbox {
  margin-left: 26px;
}

/* Helper and Error Text */
.form-helper {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

.form-error {
  font-size: 0.8rem;
  color: #ff4d4f;
  margin-top: 4px;
}

/* Radio Buttons */
.radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.radio-group.horizontal {
  flex-direction: row;
  gap: 16px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.9rem;
}

.radio-input {
  opacity: 0;
  position: absolute;
  pointer-events: none;
}

.radio-custom {
  width: 18px;
  height: 18px;
  border: 2px solid var(--border-color);
  border-radius: 50%;
  background: var(--bg-input);
  position: relative;
  flex-shrink: 0;
  transition: all 0.18s ease;
}

.radio-input:checked + .radio-custom {
  border-color: var(--primary-color);
}

.radio-input:checked + .radio-custom::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary-color);
}

.radio-input:focus + .radio-custom {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}
```

---

## 🏗️ Layout System

### Grid Utility Classes

```css
.grid {
  display: grid;
  gap: 1rem;
}

.grid-cols-1 {
  grid-template-columns: repeat(1, 1fr);
}
.grid-cols-2 {
  grid-template-columns: repeat(2, 1fr);
}
.grid-cols-3 {
  grid-template-columns: repeat(3, 1fr);
}
.grid-cols-4 {
  grid-template-columns: repeat(4, 1fr);
}

/* Responsive grid */
@media (min-width: 600px) {
  .grid-sm-2 {
    grid-template-columns: repeat(2, 1fr);
  }
  .grid-sm-3 {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 900px) {
  .grid-md-3 {
    grid-template-columns: repeat(3, 1fr);
  }
  .grid-md-4 {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

### Flexbox Utilities

```css
.flex {
  display: flex;
}
.flex-col {
  flex-direction: column;
}
.flex-row {
  flex-direction: row;
}

.items-center {
  align-items: center;
}
.items-start {
  align-items: flex-start;
}
.items-end {
  align-items: flex-end;
}

.justify-center {
  justify-content: center;
}
.justify-between {
  justify-content: space-between;
}
.justify-end {
  justify-content: flex-end;
}

.gap-2 {
  gap: 0.5rem;
}
.gap-4 {
  gap: 1rem;
}
.gap-6 {
  gap: 1.5rem;
}
```

### Container System

```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.container-sm {
  max-width: 640px;
}
.container-md {
  max-width: 768px;
}
.container-lg {
  max-width: 1024px;
}
.container-xl {
  max-width: 1280px;
}
```

---

## � CSS Organization & Optimization (September 2025)

### File Structure Standards

Each component CSS file should follow this organization pattern:

```css
/* ================================================
 * [ComponentName] Component Styles
 * Organized according to SuperChat Design System
 * Updated: [Date]
 * ================================================ */

/* -------------------- Base Layout -------------------- */
/* Container and layout styles */

/* -------------------- Interactive Elements -------------------- */
/* Buttons, inputs, clickable elements */

/* -------------------- Content Styling -------------------- */
/* Typography, content-specific styles */

/* -------------------- States & Variants -------------------- */
/* Hover, focus, active, disabled states */

/* -------------------- Animations & Transitions -------------------- */
/* Keyframes and animation styles */

/* -------------------- Responsive Design -------------------- */
/* Media queries and responsive overrides */
```

### Recent Optimizations Made

#### ✅ Border Radius Standardization

- **Fixed inconsistencies**: Standardized to 8px for buttons/forms, 14px for containers
- **Eliminated deprecated values**: Removed 6px, 10px, 12px, 15px, 16px variants
- **Updated components**: ChatInput, reactions, menus, modals, typing bubble

#### ✅ Transition Timing Consolidation

- **Standardized durations**: 0.18s for micro-interactions, 0.32s for components
- **Removed legacy timings**: Eliminated 0.2s, 0.25s, 0.28s variations
- **Performance improvement**: Consistent timing creates smoother animations

#### ✅ Code Organization

- **Removed legacy code**: Cleaned up commented-out styles and unused selectors
- **Improved readability**: Added section headers and logical grouping
- **Eliminated duplication**: Consolidated redundant style definitions

#### ✅ CSS Custom Properties Usage

- **Enhanced consistency**: All colors now use CSS variables exclusively
- **Better theme support**: Improved light/dark theme switching
- **Maintainability**: Centralized color management

### Migration Guidelines for Future Changes

#### When Adding New Components:

1. **Use the file structure template** above
2. **Follow border-radius standards**: 8px for inputs/buttons, 14px for containers
3. **Use standard transitions**: 0.18s for interactions, 0.32s for animations
4. **Implement CSS custom properties** for all colors
5. **Include both theme variants** (light/dark)

#### When Updating Existing Components:

1. **Audit border-radius values** - replace deprecated sizes
2. **Standardize transition durations** - update to 0.18s/0.32s pattern
3. **Remove legacy code** - clean up commented sections
4. **Organize by sections** - follow the standard layout pattern
5. **Test both themes** - ensure proper variable usage

### Performance Considerations

#### Optimized Selectors

- **Reduced specificity**: Simplified selector chains where possible
- **Eliminated redundancy**: Removed duplicate property declarations
- **Improved paint performance**: Consolidated box-shadow and transform usage

#### Animation Efficiency

- **GPU acceleration**: Use transform and opacity for smooth animations
- **Reduced motion support**: All animations respect user preferences
- **Optimized keyframes**: Simplified animation sequences

#### Mobile Performance

- **Touch target optimization**: Consistent 44px minimum sizes
- **Reduced complexity**: Streamlined mobile-specific overrides
- **Battery efficiency**: Lighter animations on touch devices

---

## �📝 Implementation Guidelines for AI Agents

### Component Creation Checklist:

- [ ] Use CSS custom properties for all colors
- [ ] Include both light and dark theme variants
- [ ] Add proper ARIA labels and roles
- [ ] Include focus-visible styling
- [ ] Test with keyboard navigation
- [ ] Ensure 44px minimum touch targets on mobile
- [ ] Add loading and error states
- [ ] Include animation with reduced-motion fallback
- [ ] Test across all breakpoints
- [ ] **NEW**: Use standardized border-radius (8px/14px only)
- [ ] **NEW**: Use consistent transitions (0.18s/0.32s only)
- [ ] **NEW**: Follow CSS file organization structure
- [ ] **NEW**: Remove any legacy/deprecated values

### Animation Guidelines:

- Always include `@media (prefers-reduced-motion: reduce)` fallbacks
- Use the typing indicator pattern for any "processing" states
- Prefer scale + translate combinations for smooth entry animations
- **Keep micro-interactions at 0.18s, component transitions at 0.32s**
- **Avoid legacy timing values** (0.2s, 0.25s, 0.28s are deprecated)

### Form Best Practices:

- Always pair inputs with labels (explicit or aria-label)
- Include error and helper text IDs with aria-describedby
- Use semantic HTML5 input types
- Provide clear focus indicators
- Group related fields with fieldset/legend where appropriate
- **Use 8px border-radius for all form elements consistently**

### Border Radius Standards:

- **8px**: Buttons, inputs, tooltips, reaction bubbles, form elements
- **14px**: Modals, containers, panels, message bars, typing bubbles
- **50%**: Only for circular close buttons and avatars
- **AVOID**: 6px, 10px, 12px, 15px, 16px (deprecated sizes)

---

## �📝 Notes for Future Development

- **Theme switching**: The system supports runtime theme switching via the `.light-theme` class
- **Component isolation**: Each major component has its own CSS file for modularity
- **Performance**: Uses `content-visibility: auto` for large lists when supported
- **Accessibility**: Includes reduced motion support and proper focus indicators
- **Mobile optimization**: Extensive mobile-first responsive design patterns
- **Icon consistency**: Prefer React Icons over custom SVGs for maintainability
- **Animation reusability**: The typing indicator and tooltip patterns can be extended to loading states and notifications

This style guide should be referenced and updated as the design system evolves. Always test changes across both themes and multiple screen sizes.

---

## ✅ Standards Enforcement Status (COMPLETED)

**Full codebase audit and standardization completed - FINAL ROUND COMPLETE!**

### Latest Fixes Applied (Button Standardization):

- **Button Standard Enforcement**: All primary action buttons now match App.css .send-btn reference
- **Gradient Backgrounds**: Send-btn, send-image-btn, cancel-image-btn use sophisticated gradient system
- **Transform Animations**: All buttons now use translateY(-2px) scale(1.02) on hover and scale(0.92) on active
- **Box-shadow Enhancement**: Implemented professional depth with 0 2px 8px base, 0 4px 16px on hover
- **Modal Buttons**: Delete/action buttons, close buttons all standardized to gradient system
- **Scroll Button**: Updated scroll-to-bottom-btn to match primary button standard
- **Icon Button**: Fixed icon-btn hover/active states to include scale transforms
- **Button Classification**: Established clear distinction between primary (gradient), secondary (gradient), and utility (subtle) buttons

### Files Updated (Button Standardization Round):

- `src/components/ChatInput/ChatInput.css` - send-btn, send-image-btn, cancel-image-btn standardized
- `src/App.css` - scroll-to-bottom-btn and icon-btn updated to match standard, with scale transforms
- `src/components/ChatRoom/ChatMessage.modals.css` - delete-modal-actions button with danger variant
- `src/components/SettingsModal/SettingsModal.css` - settings-close button standardized
- `src/components/UserProfileModal/UserProfileModal.css` - modal-close button standardized

### Button System Summary:

1. **Primary Actions** (.send-btn standard): Linear gradient, box-shadow, scale transforms, 8px border-radius
2. **Utility Actions** (preserved): Transparent/subtle styling for bar-icon-btn, reaction buttons, menu triggers
3. **Danger Variants**: Red gradient for destructive actions (delete modals)
4. **Consistency**: All primary buttons use the same sophisticated visual language

### Complete Project Files Updated:

- `src/App.css` - 40+ fixes including button standardization, transitions, border-radius
- `src/components/ChatInput/ChatInput.css` - Complete refactor, button standardization, reorganization
- `src/components/TypingBubble/TypingBubble.css` - Border-radius standardization
- `src/components/ChatRoom/ChatMessage.menu.css` - Transitions and border-radius fixes
- `src/components/ChatRoom/ChatMessage.reactions.css` - Transitions and border-radius fixes
- `src/components/ChatRoom/ChatMessage.css` - Transition standardization
- `src/components/ChatRoom/ChatMessage.modals.css` - Button standardization
- `src/components/SettingsModal/SettingsModal.css` - Button standardization
- `src/components/UserProfileModal/UserProfileModal.css` - Button standardization
- `src/responsive.css` - Border-radius fixes

### Design System Standards:

- **Border-radius**: 8px (inputs/buttons) or 14px (containers), 50% for circular elements
- **Transitions**: 0.18s (micro interactions) or 0.32s (component animations)
- **Colors**: All via CSS variables, no hardcoded values except hover states
- **Button Animations**: Scale transforms for tactile feedback on all primary actions

### Exceptions Maintained:

- **Utility Buttons**: bar-icon-btn, reaction-btn, menu triggers maintain subtle styling (appropriate for their context)
- **Circular Elements**: 50% border-radius preserved for avatars, status indicators, typing dots
- **Hover States**: Preserved hardcoded colors for specific interaction states

**Result**: Fully unified, professional button system with sophisticated gradients, animations, and consistent visual hierarchy across the entire codebase!
