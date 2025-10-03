# Map Queue Enhancements - Quick Visual Reference

## 🎯 New Layout At a Glance

### Map Item Structure
```
┌──┬─────────┬────────────────────────┬──────────┐
│↑ │  Image  │ Name                   │  Stage   │  ← 80px height (all sections)
│↓ │ 80x80px │ Description (truncate) │  Button  │
│  │ Square  │ 1920 × 1080           │ 100px    │
└──┴─────────┴────────────────────────┴──────────┘
32px  80px         Flexible              100px
```

---

## 🔄 Reordering Methods

### Method 1: Arrow Buttons
```
    ↑  Click to move up
    ↓  Click to move down
    
    Disabled at boundaries:
    ↑ (disabled)  ← Top item
    ↓
    
    ↑
    ↓ (disabled)  ← Bottom item
```

### Method 2: Drag and Drop
```
1. Click and hold
   ┌─────────────┐
   │ Map Item    │ ← Cursor: grab
   └─────────────┘

2. Drag to position
   ┌─────────────┐
   │ Map Item    │ ← Opacity: 0.5
   └─────────────┘
   
3. Drop
   ┌─────────────┐
   │ Map Item    │ ← New position
   └─────────────┘
```

---

## 🖼️ Image Display Changes

### Before (Rounded & Stretched)
```
┌─────────┐
│╭───────╮│  ← border-radius
││ Image ││  ← width/height: 100%
││[Dist] ││  ← object-fit: cover
│╰───────╯│
└─────────┘
```

### After (Square & Natural)
```
┌─────────┐
│         │
│ [Image] │  ← max-width/height: 100%
│         │  ← object-fit: contain
│         │  ← No border-radius
└─────────┘
```

---

## 📝 Text Truncation

### Name Truncation
```
Full text:    "The Ancient Temple of the Dragon Lords"
Displayed:    "The Ancient Temple of..."
              └─ Single line with ellipsis
```

### Description Truncation
```
Full text:    "A dangerous mountain pass with steep cliffs
               and narrow paths. Watch for falling rocks."
Displayed:    "A dangerous mountain pass with..."
              └─ Single line with ellipsis
```

---

## 🎬 Preview Flyout

### Opening Trigger
```
Click here → ┌──┬─────────┬────────────────┬──────┐
             │↑ │         │ Click anywhere │      │
Don't click→ │↓ │  [IMG]  │ in this area   │Stage │ ← Don't click
             │  │         │ to preview     │      │
             └──┴─────────┴────────────────┴──────┘
                 ↑                          ↑
            Don't click                Don't click
```

### Preview Layout
```
╔════════════════════════════════╗
║ Map Preview               [×]  ║ ← Close
╠════════════════════════════════╣
║                                ║
║  ╔══════════════════════════╗  ║
║  ║                          ║  ║
║  ║   [Large Map Image]      ║  ║
║  ║   Max height: 400px      ║  ║
║  ║   Contained aspect       ║  ║
║  ║                          ║  ║
║  ╚══════════════════════════╝  ║
║                                ║
║  Ancient Temple                ║
║  ├─────────────────────────    ║
║                                ║
║  ┏━━━━━━━━━━━━━━━━━━━━━━━━┓  ║
║  ┃ DESCRIPTION            ┃  ║
║  ┃ Full text displayed... ┃  ║
║  ┗━━━━━━━━━━━━━━━━━━━━━━━━┛  ║
║                                ║
║  ┏━━━━━━━━━━━━━━━━━━━━━━━━┓  ║
║  ┃ DIMENSIONS             ┃  ║
║  ┃ 2400 × 1600px         ┃  ║
║  ┗━━━━━━━━━━━━━━━━━━━━━━━━┛  ║
║                                ║
║  ╔═══════════════════════════╗║
║  ║ ▶ Set as Active Map       ║║
║  ╚═══════════════════════════╝║
║                                ║
╚════════════════════════════════╝
```

---

## 📊 Map Item Dimensions

### Section Widths
```
Reorder:  |███| 32px  (Fixed)
Preview:  |████████| 80px  (Fixed)
Info:     |████████████████████████| Flexible (Grows)
Actions:  |██████████| 100px  (Fixed)
```

### Height Consistency
```
All sections: 80px
┌────┐ ┌────┐ ┌────┐ ┌────┐
│ 80 │ │ 80 │ │ 80 │ │ 80 │
│ px │ │ px │ │ px │ │ px │
└────┘ └────┘ └────┘ └────┘
  ↑      ↑      ↑      ↑
Reorder Prev  Info  Action
```

---

## 🎨 Visual Hierarchy

### Color Scheme
```
Reorder section:   #16161e  (Darkest)
Preview section:   #0f0f1e  (Dark)
Info section:      #1e1e2e  (Medium dark)
Actions section:   #16161e  (Darkest)

Borders:           #2a2a3e  (Subtle)
Active border:     #667eea  (Purple accent)
```

### Button States
```
Normal:      [  Stage  ]  ← #667eea background
Hover:       [  Stage  ]  ← #5568d3 background
Active:      [ Active  ]  ← #2ecc71 background (green)
Disabled:    [  Stage  ]  ← 0.7 opacity
```

---

## 🔢 Map Order Flow

### Import Order (Bottom Append)
```
Before Import:
1. Tavern
2. Forest Path

After Importing "Dragon Lair":
1. Tavern
2. Forest Path
3. Dragon Lair  ← New map at bottom
```

### Reorder with Arrows
```
Initial:           After clicking ↑ on "Dragon Lair":
1. Tavern          1. Tavern
2. Forest Path     2. Dragon Lair  ← Moved up
3. Dragon Lair     3. Forest Path
```

### Reorder with Drag
```
Initial:
┌─────────────┐
│ 1. Tavern   │
├─────────────┤
│ 2. Forest   │ ← Grab this
├─────────────┤
│ 3. Dragon   │
└─────────────┘

Dragging:
┌─────────────┐
│ 1. Tavern   │
├─────────────┤
│ 3. Dragon   │
├─────────────┤
│ 2. Forest   │ ← Dragging (opacity: 0.5)
└─────────────┘
     ↓
Drop above "Dragon"

Result:
┌─────────────┐
│ 1. Tavern   │
├─────────────┤
│ 2. Forest   │ ← New position
├─────────────┤
│ 3. Dragon   │
└─────────────┘
```

---

## 🎯 Click Zones

### Map Item Click Zones
```
┌──┬─────────┬────────────────────┬──────────┐
│NO│   NO    │    YES - PREVIEW   │    NO    │
│  │         │                    │          │
└──┴─────────┴────────────────────┴──────────┘
  ↑     ↑            ↑                 ↑
Arrows  Image    Info Section      Action
                                    Button
```

### What Opens Preview?
- ✅ Click on map name
- ✅ Click on description
- ✅ Click on dimensions
- ✅ Click on info section background
- ❌ Click on reorder arrows
- ❌ Click on image (for now)
- ❌ Click on action button

---

## 🚦 Button States Reference

### Reorder Buttons
```
┌───┐  Enabled & Hoverable
│ ↑ │  - Border: #667eea
└───┘  - Background: #2a2a3e

┌───┐  Disabled (at boundary)
│ ↑ │  - Opacity: 0.3
└───┘  - Cursor: not-allowed
```

### Action Buttons
```
┌──────────┐  Stage (Normal)
│  Stage   │  - Background: #667eea
└──────────┘  - Text: white

┌──────────┐  Stage (Hover)
│  Stage   │  - Background: #5568d3
└──────────┘  - Cursor: pointer

┌──────────┐  Active (Current map)
│  Active  │  - Background: #2ecc71 (green)
└──────────┘  - Disabled
```

---

## 📐 Spacing & Padding

### Map Item Internal Spacing
```
┌──┬─────────┬────────────────────┬──────────┐
│↔4│    8   8│12              12  8│    8     │
│px│   gap   │  padding        gap│  padding │
└──┴─────────┴────────────────────┴──────────┘

Gaps between sections: 8px
Padding inside sections: 4-12px depending on section
```

### Text Spacing
```
Name
  ↕ 2px gap
Description
  ↕ auto (margin-top)
Dimensions
```

---

## 🎨 Active Map Indicator

### Visual Treatment
```
Normal Map:
┌────────────────────────────────┐
│ Map Item                  Stage│  ← Gray border
└────────────────────────────────┘

Active Map:
┌════════════════════════════════┐
│ 🔴 Map Item            Active  │  ← Purple border + glow
└════════════════════════════════┘
  ↑                         ↑
LIVE badge              Green button
```

---

## 🔄 State Transitions

### Drag State
```
Rest → Drag Start → Dragging → Drop → Rest
       (grab)      (opacity↓)  (update) (normal)
```

### Preview State
```
Closed → Click → Opening → Open → Close → Closed
         (info)            (show) (fade)
```

### Reorder State
```
List → Move → Rerender → List
       (up/down/drag)    (new order)
```

---

## 💡 Pro Tips

### Efficient Reordering
```
1. Use arrows for small adjustments (1-2 positions)
2. Use drag for large movements (3+ positions)
3. Preview before staging to verify correct map
```

### Best Practices
```
✅ Import maps in chronological session order
✅ Use descriptive names for easy identification
✅ Preview maps to verify before staging
✅ Reorder as needed during session prep

❌ Don't rely on import order if you might reorder
❌ Don't stage maps without previewing first
```

---

## 🎮 Keyboard Navigation (Future)

### Planned Shortcuts
```
↑/↓       - Move selection
Space     - Open preview
Enter     - Set as active
Escape    - Close preview
Shift+↑/↓ - Reorder selected map
```

---

## 📱 Responsive Breakpoints

### Current Fixed Widths
```
Total Width: Variable (sidebar panel width)

Fixed:
├─ Reorder:  32px
├─ Preview:  80px
├─ Actions: 100px
└─ Info:    Remainder (flexible)

Minimum supported: ~350px total width
```

---

**Quick Reference Version**: 2.0
**Last Updated**: October 3, 2025
