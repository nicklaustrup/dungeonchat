# Party Panel Enhancement - Visual Guide

**Date:** October 4, 2025  
**Component:** PartyManagement

---

## Visual Layout

```
┌─────────────────────────────────────────────────────────┐
│ 👥 Party                    [▾ Details] [🗕 Minimize]   │
│              [⭐ XP] [❤️ Heal] [🌙 Long Rest]           │
├─────────────────────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                    │ Member Strip
│ │ [🧙] │ │ [⚔️] │ │ [🛡️] │ │ [🏹] │     (Scrollable →) │ (Horizontal Scroll)
│ │Gandalf│ │Aragorn│ │Gimli │ │Legolas│                 │
│ │ L10  │ │  L8  │ │  L7  │ │  L9  │                    │
│ │━━━━━ │ │━━━━━ │ │━━━━━ │ │━━━━━ │   HP Bars         │
│ └──────┘ └──────┘ └──────┘ └──────┘                    │
├─────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────┐   │ Character Sheet
│ │ 🧙    Gandalf the White                      [×]  │   │ Preview
│ │       Level 10 Human Wizard                       │   │ (Appears on click)
│ │                                                    │   │
│ │ ┌─────────────┐  ┌─────────────┐                 │   │
│ │ │ Experience  │  │ Proficiency │                 │   │
│ │ │   45,000    │  │     +4      │                 │   │
│ │ └─────────────┘  └─────────────┘                 │   │
│ │                                                    │   │
│ │ ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐            │   │
│ │ │STR ││DEX ││CON ││INT ││WIS ││CHA │            │   │
│ │ │ 10 ││ 14 ││ 12 ││ 20 ││ 18 ││ 14 │            │   │
│ │ │ +0 ││ +2 ││ +1 ││ +5 ││ +4 ││ +2 │            │   │
│ │ └────┘└────┘└────┘└────┘└────┘└────┘            │   │
│ │                                                    │   │
│ │ [📋 View Full Character Sheet]                    │   │
│ │                                                    │   │
│ │ ┌────────────────────────────────────────┐        │   │
│ │ │ 📦 Inventory                           │        │   │
│ │ │ ┄ ┄ ┄ ┄ ┄ ┄ ┄ ┄ ┄ ┄ ┄ ┄ ┄ ┄ ┄ ┄ ┄ ┄ │        │   │
│ │ │ Coming soon - Inventory management     │        │   │
│ │ │ will be available in a future update.  │        │   │
│ │ └────────────────────────────────────────┘        │   │
│ └───────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│ Party Overview (Compact)                                │
│ ┌────────────┬────────────┬────────────┬──────────┐    │
│ │ Avg Lvl: 8 │ HP: 85%    │ Avg AC: 16 │ Wealth   │    │
│ └────────────┴────────────┴────────────┴──────────┘    │
├─────────────────────────────────────────────────────────┤
│ Party Composition                                       │
│ 🛡️ Tank: 1  ⚔️ Damage: 2  ❤️ Healer: 1                │
│ ⚠ No dedicated support    💡 Consider utility spells   │
└─────────────────────────────────────────────────────────┘
```

---

## Member Chip States

### Default State
```
┌──────────┐
│ [🧙‍♂️]   │  ← 48x48 Portrait
│ Gandalf  │  ← Character Name
│ L10      │  ← Level
│ Wizard   │  ← Class
│ AC 15    │  ← Armor Class
│ ━━━━━━━  │  ← HP Bar (85%)
│ 85/100   │  ← HP Text
└──────────┘
```

### Active State (Selected)
```
╔══════════╗  ← Blue border (2px)
║ [🧙‍♂️]   ║  ← with shadow glow
║ Gandalf  ║
║ L10      ║
║ Wizard   ║
║ AC 15    ║
║ ━━━━━━━  ║
║ 85/100   ║
╚══════════╝
```

### Hover State
```
┌──────────┐
│ [🧙‍♂️]   │  ← Lifted slightly
│ Gandalf  │     with shadow
│ L10      │
│ Wizard   │
│ AC 15    │
│ ━━━━━━━  │
│ 85/100   │
└──────────┘
   ↑ hover
```

---

## HP Bar Color Coding

```
HP >= 75%:  ████████████████ (Green)
HP >= 50%:  ██████████░░░░░░ (Yellow)
HP >= 25%:  ████░░░░░░░░░░░░ (Orange)
HP < 25%:   ██░░░░░░░░░░░░░░ (Red, pulsing)
```

---

## Character Portrait Fallback

When no portrait URL exists:

```
┌──────┐
│  GW  │  ← Character initials
│      │     on gradient background
└──────┘
```

Gradient: Purple/Blue (`#667eea` → `#764ba2`)

---

## Responsive Breakpoints

### Desktop (>820px)
- Member chips: 200px wide
- Abilities: 6 columns (all in one row)
- Full layout visible

### Tablet (480-820px)
- Member chips: 180px wide
- Abilities: 3 columns (2 rows)
- Portrait: 40x40

### Mobile (<480px)
- Member chips: 160px wide
- Abilities: 2 columns (3 rows)
- Portrait: 36x36
- Stats grid: 1 column

---

## Color Scheme

### Light Mode
- Background: `#ffffff`
- Secondary BG: `#f3f4f6`
- Border: `#e5e7eb`
- Text Primary: `#1f2937`
- Text Secondary: `#6b7280`
- Primary (Active): `#3b82f6`

### Dark Mode
- Background: `#1f2937`
- Secondary BG: `#374151`
- Border: `#4b5563`
- Text Primary: `#f3f4f6`
- Text Secondary: `#9ca3af`
- Primary (Active): `#3b82f6`

---

## Interactive Elements

### Clickable Areas
1. **Member Chip** → Selects character, shows preview
2. **Close Button (×)** → Closes character preview
3. **View Full Sheet** → Opens full character sheet (future)
4. **HP Text (DM only)** → Inline HP editing
5. **Context Menu (DM, right-click)** → Quick actions

### Animations
- **Slide Down**: Character preview entrance (0.3s)
- **Highlight Pulse**: Temporary highlight when scrolling to card (1.2s)
- **Hover Lift**: Member chips rise on hover
- **Border Glow**: Active state pulsing effect
- **HP Bar**: Smooth width transition (0.3s)

---

## Typography

### Font Sizes
- **Panel Title**: 1.35rem (21.6px)
- **Character Name (preview)**: 1.15rem (18.4px)
- **Member Name**: 0.75rem (12px)
- **Ability Score**: 1.1rem (17.6px)
- **Ability Modifier**: 0.7rem (11.2px)
- **Class/Race**: 0.85rem (13.6px)

### Font Weights
- **Bold**: 700 (headings, scores)
- **Semi-bold**: 600 (labels, buttons)
- **Medium**: 500 (secondary text)
- **Normal**: 400 (body text)

---

## Spacing System

```
Gap:     0.25rem (4px)   - Tight spacing
         0.5rem  (8px)   - Default gap
         0.75rem (12px)  - Medium gap
         1rem    (16px)  - Standard gap
         1.5rem  (24px)  - Large gap
         2rem    (32px)  - Section gap

Padding: 0.5rem  (8px)   - Compact padding
         0.75rem (12px)  - Medium padding
         1rem    (16px)  - Standard padding
         1.5rem  (24px)  - Large padding
```

---

## Accessibility Notes

### Keyboard Navigation
- Tab through member chips
- Enter/Space to select
- Escape to close preview

### Screen Readers
- Descriptive alt text for portraits
- ARIA labels on buttons
- Semantic HTML structure

### Color Contrast
- All text meets WCAG AA standards
- HP bar colors distinguishable
- Border colors visible in both themes

---

## Future Enhancements

### Phase 6 Ideas
1. **Full Character Sheet Modal**
   - Tabbed interface
   - All character details
   - Edit capabilities
   - Export to PDF

2. **Inventory System**
   - Item cards with icons
   - Drag-and-drop
   - Weight tracking
   - Equipment slots

3. **Quick Actions**
   - Cast spell
   - Use item
   - Rest options
   - Level up

4. **Character Comparison**
   - Side-by-side stats
   - Party balance view
   - Optimization suggestions

---

## Component Hierarchy

```
PartyManagement
├── party-compact-header
│   ├── pch-row (title & buttons)
│   │   ├── pch-title
│   │   ├── pch-row-right (toggle buttons)
│   │   └── pch-actions (XP, Heal, Rest)
│   └── member-strip (horizontal scroll)
│       └── member-chip[] (array)
│           ├── mc-portrait
│           └── mc-info
│               ├── mc-top
│               ├── mc-meta
│               └── mc-hp-bar
├── character-sheet-preview (conditional)
│   ├── csp-header
│   │   ├── csp-portrait-large
│   │   ├── csp-info
│   │   └── csp-close-btn
│   ├── csp-stats-grid
│   ├── csp-abilities
│   ├── csp-view-full-btn
│   └── csp-inventory-placeholder
├── party-overview-compact
├── party-composition
└── party-characters (character cards)
```

---

This visual guide provides a complete reference for the Party Panel's new design and functionality!
