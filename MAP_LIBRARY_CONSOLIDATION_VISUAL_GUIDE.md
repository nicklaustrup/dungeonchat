# Map Library Consolidation - Visual Guide

## New Interface Layout

### Canvas Toolbar (Before vs After)

**Before:**
```
[Layers] [Library] [Maps] [Encounters] [Player View] [Fog] [Tokens] [FX Library ▼]
          ↓ URL Import   ↓ View Maps
```

**After:**
```
[Layers] [Maps] [Encounters] [Player View] [Fog] [Tokens] [FX Library ▼]
          ↓ Everything map-related
```

---

## Maps Panel Structure

### Panel Header
```
┌─────────────────────────────────────────────┐
│ Library          5 maps    [Import Map]     │ ← New button
├─────────────────────────────────────────────┤
```

### Import Map Flyout (Overlays Panel)
```
┌─────────────────────────────────────────────┐
│ Import Maps from URL                    [×] │
├─────────────────────────────────────────────┤
│                                             │
│ ┌─────────────────────────────────────┐   │
│ │ Image URL *                         │   │
│ │ https://example.com/map.jpg         │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ ┌─────────────────────────────────────┐   │
│ │ Map Name                            │   │
│ │ Ancient Temple                      │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ ┌─────────────────────────────────────┐   │
│ │ Description                         │   │
│ │ A mysterious temple...              │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ ┌───────────────────────────────────────┐ │
│ │     [Image Preview]                   │ │
│ │                                       │ │
│ │     2400 × 1600px                     │ │
│ └───────────────────────────────────────┘ │
│                                             │
│        [+ Add to Import List]              │
│                                             │
│ ┌─────────────────────────────────────────┐│
│ │ Maps to Import (3)                      ││
│ │ ┌──────────────────────────────┐        ││
│ │ │ [Thumb] Ancient Temple    [×]│        ││
│ │ │         2400×1600px          │        ││
│ │ └──────────────────────────────┘        ││
│ │ ┌──────────────────────────────┐        ││
│ │ │ [Thumb] Dungeon Map       [×]│        ││
│ │ │         1920×1080px          │        ││
│ │ └──────────────────────────────┘        ││
│ │ ┌──────────────────────────────┐        ││
│ │ │ [Thumb] Forest Path       [×]│        ││
│ │ │         3000×2000px          │        ││
│ │ └──────────────────────────────┘        ││
│ │                                         ││
│ │     [Add to Library (3)]                ││
│ └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

---

## User Flow Diagram

### Import Multiple Maps

```
1. Click [Maps] button
       ↓
2. Panel opens → Click [Import Map]
       ↓
3. Flyout appears
       ↓
4. Enter first map URL
       ↓ (blur or tab)
5. Preview loads automatically
       ↓
6. (Optional) Add name & description
       ↓
7. Click [+ Add to Import List]
       ↓
8. Map appears in "Maps to Import"
       ↓
9. Form resets for next map
       ↓
10. Repeat steps 4-9 for more maps
       ↓
11. Review all pending imports
       ↓
12. (Optional) Remove any using [×]
       ↓
13. Click [Add to Library (n)]
       ↓
14. All maps created in Firestore
       ↓
15. Maps appear in library list
       ↓
16. Flyout closes automatically
```

---

## Component Hierarchy

```
VTTSession
├── MapCanvas
│   └── Canvas controls
│       └── [Maps] button → togglePanel('maps')
│
└── ResizablePanel (when activePanel === 'maps')
    └── MapQueue
        ├── Panel Header
        │   ├── "Library" title
        │   ├── Map count badge
        │   └── [Import Map] button ← NEW
        │
        ├── Import Flyout (conditional) ← NEW
        │   ├── Flyout Header
        │   │   ├── Title
        │   │   └── Close button
        │   │
        │   └── Flyout Content
        │       ├── Import Form
        │       │   ├── URL input
        │       │   ├── Name input
        │       │   ├── Description textarea
        │       │   ├── Image preview
        │       │   └── Add button
        │       │
        │       └── Pending Imports
        │           ├── List of staged maps
        │           └── Finish button
        │
        └── Panel Content (existing maps)
            └── Map List
                └── Map items
```

---

## State Flow

### Import State Machine

```
IDLE
  ↓ [Import Map] clicked
FLYOUT_OPEN
  ↓ URL entered & validated
PREVIEW_LOADED
  ↓ [Add to Import List] clicked
MAP_STAGED
  ↓ Multiple maps can be staged
PENDING_IMPORTS (n > 0)
  ↓ [Add to Library] clicked
IMPORTING
  ↓ Maps created in Firestore
SUCCESS
  ↓ Flyout closes
IDLE (with more maps in library)
```

### Data Flow

```
User Input
    ↓
[importUrl, importName, importDescription]
    ↓
loadImagePreview()
    ↓
[importPreview: {width, height, url}]
    ↓
handleAddToPending()
    ↓
[pendingImports: [..., {id, name, url, description, width, height}]]
    ↓
handleFinishImport()
    ↓
mapService.createMap() × n
    ↓
[maps: [...newMaps]]
    ↓
UI updates automatically
```

---

## CSS Class Reference

### Panel Components
- `.map-queue` - Main panel container
- `.panel-header` - Header with title and actions
- `.header-actions` - Right-aligned action buttons
- `.import-map-btn` - Import trigger button

### Flyout Components
- `.map-import-flyout` - Overlay container
- `.import-flyout-header` - Flyout header bar
- `.import-flyout-content` - Scrollable content area
- `.close-flyout-btn` - Close button

### Form Components
- `.import-form` - Form container
- `.form-group` - Input field wrapper
- `.image-preview` - Preview container
- `.preview-info` - Dimensions display
- `.preview-loading` - Loading indicator
- `.preview-error` - Error message
- `.add-to-list-btn` - Add to pending button

### Pending List Components
- `.pending-imports` - Staging area container
- `.pending-list` - Scrollable list
- `.pending-item` - Individual staged map card
- `.pending-preview` - Thumbnail image
- `.pending-info` - Map metadata
- `.pending-name` - Map name
- `.pending-description` - Map description
- `.pending-dimensions` - Size info
- `.remove-pending-btn` - Remove button
- `.finish-import-btn` - Final import button

---

## Color Scheme

### Primary Colors
- **Background Dark**: `#1d1d23` - Main panel background
- **Background Medium**: `#2c2c34` - Form/card background
- **Background Light**: `#26262d` - Header background
- **Border**: `#333` / `#3a3a42` - Borders and dividers

### Interactive Elements
- **Primary Action**: `#3d6df2` - Import buttons
- **Primary Hover**: `#335ad0` - Button hover state
- **Success**: `#10b981` - Finish import button
- **Success Hover**: `#0ea572` - Success hover state
- **Danger**: `#f87171` - Error messages and remove buttons
- **Accent**: `#667eea` - Active states, badges

### Text Colors
- **Primary Text**: `#eee` - Main text
- **Secondary Text**: `#bbb` / `#ccc` - Labels
- **Muted Text**: `#888` / `#666` - Metadata

---

## Responsive Behavior

### Flyout Scrolling
- Flyout content scrolls independently
- Pending imports list has max-height with scroll
- Header and footer buttons remain fixed

### Form Layout
- Stacked vertically for all screen sizes
- Full-width inputs for easy interaction
- Preview maintains aspect ratio

### Pending Items
- Flexible card layout
- Thumbnail size fixed for consistency
- Text truncates with ellipsis

---

## Keyboard Shortcuts

### Planned (Future Enhancement)
- `Escape` - Close flyout
- `Ctrl+Enter` - Add to import list
- `Ctrl+Shift+Enter` - Finish import
- `Tab` - Navigate form fields (triggers preview load)

---

## Accessibility Features

### Current Implementation
- Semantic HTML structure
- Button labels and aria-labels
- Focus management
- Error messages associated with inputs

### Future Enhancements
- Full keyboard navigation
- Screen reader announcements
- ARIA live regions for status updates
- Focus trap in flyout

---

**Visual Guide Version**: 1.0
**Last Updated**: October 3, 2025
