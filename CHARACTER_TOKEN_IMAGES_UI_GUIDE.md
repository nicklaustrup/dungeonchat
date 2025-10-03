# Character Sheet Avatar UI - Visual Guide

## Before & After

### BEFORE - No Avatar System
```
┌─────────────────────────────────────────────────┐
│  Character Sheet                            [×] │
├─────────────────────────────────────────────────┤
│                                                 │
│  Elara Moonwhisper                             │
│  Level 5 Elf Wizard                            │
│                                                 │
│  Background: Sage                              │
│  Alignment: Neutral Good                       │
│  Player: John Doe                              │
│                                                 │
└─────────────────────────────────────────────────┘
```

### AFTER - With Avatar System
```
┌─────────────────────────────────────────────────┐
│  Character Sheet                            [×] │
├─────────────────────────────────────────────────┤
│                                                 │
│   ╭────────╮  Elara Moonwhisper                │
│   │  [×]   │  Level 5 Elf Wizard                │
│   │ ┌────┐ │                                    │
│   │ │ E  │ │← Click to upload portrait          │
│   │ └────┘ │                                    │
│   ╰────────╯                                    │
│                                                 │
│   Background: Sage                             │
│   Alignment: Neutral Good                      │
│   Player: John Doe                             │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Avatar States

### 1. No Avatar (Default)
```
┌──────────┐
│   ┌──┐   │
│   │ E│   │  ← First letter of character name
│   └──┘   │     on gradient background
└──────────┘
    Click to upload
```

### 2. Uploading
```
┌──────────┐
│          │
│    ⏳    │  ← Spinning hourglass animation
│          │
└──────────┘
    Uploading...
```

### 3. Avatar Uploaded
```
┌──────────┐
│  [×]     │  ← Remove button (top-right)
│  ╔════╗  │
│  ║IMG ║  │  ← Character portrait image
│  ╚════╝  │
└──────────┘
    Click to change
```

### 4. Avatar with Hover
```
┌──────────┐
│  [×]     │
│  ╔════╗  │  ← Glowing border effect
│  ║IMG ║  │     + slight scale up
│  ╚════╝  │
└──────────┘
    Click to change
```

## Token Display Priority

### Scenario 1: Character Avatar Set
```
Character Sheet          VTT Map Token
┌──────────┐            ┌────┐
│  ╔════╗  │    →       │IMG │  ← Uses character avatar
│  ║IMG ║  │            └────┘
│  ╚════╝  │            Elara
└──────────┘
```

### Scenario 2: No Character Avatar (Has Profile Pic)
```
Character Sheet          VTT Map Token
┌──────────┐            ┌────┐
│  ┌────┐  │    →       │PRO │  ← Uses profile picture
│  │ E  │  │            └────┘
│  └────┘  │            Elara
└──────────┘
```

### Scenario 3: No Avatar, No Profile Pic
```
Character Sheet          VTT Map Token
┌──────────┐            ┌────┐
│  ┌────┐  │    →       │ 🔵 │  ← Uses blue default
│  │ E  │  │            └────┘
│  └────┘  │            Elara
└──────────┘
```

## Upload Flow

```
1. Initial State
   ┌──────────┐
   │  ┌────┐  │
   │  │ E  │  │  ← Click here
   │  └────┘  │
   └──────────┘

2. File Picker Opens
   ┌─────────────────────────┐
   │  Choose File            │
   │                         │
   │  🖼️ my-character.png    │
   │  🖼️ portrait.jpg        │
   │  🖼️ hero-art.webp       │
   │                         │
   │     [Open]  [Cancel]    │
   └─────────────────────────┘

3. Uploading
   ┌──────────┐
   │    ⏳    │  ← Spinning animation
   └──────────┘

4. Success!
   ┌──────────┐
   │  [×]     │
   │  ╔════╗  │  ← Your image appears
   │  ║IMG ║  │
   │  ╚════╝  │
   └──────────┘
```

## Remove Avatar Flow

```
1. With Avatar
   ┌──────────┐
   │  [×]     │  ← Click the [×] button
   │  ╔════╗  │
   │  ║IMG ║  │
   │  ╚════╝  │
   └──────────┘

2. Confirmation
   ┌───────────────────────┐
   │  Remove character     │
   │  portrait?            │
   │                       │
   │  [Yes]  [Cancel]      │
   └───────────────────────┘

3. Removed
   ┌──────────┐
   │  ┌────┐  │  ← Back to placeholder
   │  │ E  │  │
   │  └────┘  │
   └──────────┘
```

## CSS Styling Details

### Avatar Container
- Size: 80x80 pixels
- Border: 3px solid (theme color)
- Border-radius: 50% (perfect circle)
- Hover: Glowing effect + scale 1.05
- Cursor: pointer

### Remove Button
- Size: 24x24 pixels
- Position: Absolute top-right (-8px, -8px)
- Background: Red (#e74c3c)
- Border: 2px solid white
- Border-radius: 50%
- Hover: Darker red + scale 1.1

### Placeholder
- Background: Purple gradient (135deg, #667eea → #764ba2)
- Text: White, bold, 32px
- Centered text (first letter of name)

### Upload Animation
- Spinning hourglass: 360° rotation, 1s linear infinite
- Smooth transition: all properties 0.2s ease

## Responsive Behavior

### Desktop (>768px)
```
┌─────────────────────────────────────────┐
│  ╭────────╮  Character Name             │
│  │  IMG   │  Level & Class              │
│  ╰────────╯                             │
│                                         │
│  Details...                             │
└─────────────────────────────────────────┘
```

### Mobile (<768px)
```
┌─────────────────────┐
│   ╭────────╮        │
│   │  IMG   │        │
│   ╰────────╯        │
│                     │
│  Character Name     │
│  Level & Class      │
│                     │
│  Details...         │
└─────────────────────┘
```

## Accessibility

- Avatar button has `title` attribute: "Click to upload character portrait"
- Remove button has `title` attribute: "Remove portrait"
- File input accepts only image/* MIME types
- Keyboard accessible (can tab to avatar and press Enter)
- Screen reader friendly labels

## Error States

### File Too Large
```
┌──────────────────────────┐
│  ⚠️ Error                │
│                          │
│  Image must be smaller   │
│  than 5MB                │
│                          │
│  [OK]                    │
└──────────────────────────┘
```

### Invalid File Type
```
┌──────────────────────────┐
│  ⚠️ Error                │
│                          │
│  Please select an        │
│  image file              │
│                          │
│  [OK]                    │
└──────────────────────────┘
```

### Upload Failed
```
┌──────────────────────────┐
│  ⚠️ Error                │
│                          │
│  Failed to upload        │
│  avatar: [error]         │
│                          │
│  [OK]                    │
└──────────────────────────┘
```

## Token Manager Integration

When DM manually generates a token from Character Sheet Panel:

```
Character Sheet Panel    Token Manager (Staging)
┌─────────────────┐     ┌─────────────────────┐
│ Elara [🎭]      │ →   │  ╭────╮             │
│                 │     │  │IMG │ Elara  [✓]  │
│ ╭────╮          │     │  ╰────╯             │
│ │IMG │          │     │                     │
│ ╰────╯          │     │  ← Token uses       │
└─────────────────┘     │     character       │
   Click 🎭 button      │     avatar          │
                        └─────────────────────┘
```

## Best Practice Examples

### ✅ Good Avatar Examples
```
Portrait-style images:
- Character headshot
- Face clearly visible
- Good contrast
- Square aspect ratio
- Clean background

File specs:
- 512x512 to 1024x1024
- PNG with transparency
- Under 2MB
- High quality
```

### ❌ Poor Avatar Examples
```
Avoid:
- Full body shots (face too small)
- Very dark or light images
- Low resolution (pixelated)
- Non-square aspect ratio
- Cluttered backgrounds
```

---

**Note:** All UI elements use CSS variables for theming compatibility
