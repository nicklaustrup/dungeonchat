# FX Library Quick Start Guide

**For Dungeon Masters** 🎲✨

---

## What is the FX Library?

The FX Library is your one-stop shop for adding atmospheric effects to your VTT sessions. It brings together lighting, weather, and ambience controls in a convenient dropdown menu.

---

## How to Access

Look for the **✨ FX Library** button in the top toolbar, right next to the "Edit Token" button:

```
Top Toolbar:
┌────────────────────────────────────────────────────────────┐
│ [Layers] [Maps] [Audio] [Edit Token] [✨ FX Library ▼]   │
└────────────────────────────────────────────────────────────┘
```

**Click the button** to open the dropdown menu.

---

## Available Effects

### 💡 Lighting (ACTIVE)

Create immersive lighting for your battles and exploration!

**What You Can Do:**
- Create light sources (torches, lanterns, magical lights)
- Control global lighting (time of day, brightness)
- Attach lights to tokens (moving torches, glowing weapons)
- Set up static lights (fireplaces, braziers, magical crystals)
- Adjust light color, intensity, and radius

**Quick Steps:**
1. Click "✨ FX Library"
2. Select "💡 Lighting"
3. LightingPanel opens on the right side
4. Use the panel to create and manage lights

**Example Uses:**
- 🔦 Fighter holding a torch in a dark dungeon
- 🕯️ Fireplace illuminating a tavern interior
- ✨ Wizard's Light spell (40ft radius, white)
- 🔥 Campfire at night (warm orange glow)
- 💎 Magical crystal pulsing with arcane energy

---

### 🌧️ Weather (COMING SOON)

Add atmospheric weather effects to enhance immersion!

**Status:** 🚧 Under Development

**Planned Features:**
- Rain (light drizzle to heavy downpour)
- Snow (flurries to blizzard)
- Fog (reduces visibility)
- Wind (affects ranged attacks)
- Storm effects (lightning, thunder)
- Sandstorms, hail, and more

**When Available:**
- Visual particle effects
- Ambient sound integration
- Gameplay mechanical effects (optional)
- Weather intensity controls
- Duration and timing settings

---

### 🎵 Ambience (COMING SOON)

Control music and ambient sounds for perfect atmosphere!

**Status:** 🚧 Under Development

**Planned Features:**
- Background music (combat, exploration, social, boss)
- Ambient sounds (nature, city, dungeon)
- Sound effects library
- Spatial/positional audio
- Volume mixing controls
- Audio triggers (area-based, combat-based)

**When Available:**
- Upload custom audio tracks
- Create playlists
- Quick atmosphere presets (tavern, forest, combat, etc.)
- Master volume controls

---

## Current Feature: Lighting System 💡

### Global Lighting Controls

Control the overall lighting of your map:

**Time of Day Slider:**
- Drag to simulate day/night cycle
- 0:00 = Midnight (very dark)
- 12:00 = Noon (bright daylight)
- 18:00 = Dusk (dim)

**Ambient Light:**
- Controls overall brightness
- 0% = Total darkness
- 50% = Dim light
- 100% = Full daylight

**Outdoor/Indoor:**
- Toggle how natural light affects the scene

### Creating Light Sources

**Point Lights** (most common):
- Torches, lanterns, candles
- Circular area of illumination
- Set radius (in grid units)
- Choose color (warm, cool, magical)

**Directional Lights:**
- Focused beams
- Spotlights, flashlights
- Set direction and cone angle

**Static vs Token-Attached:**
- **Static**: Stays in one place (fireplace, window)
- **Token-Attached**: Moves with a token (held torch)

### Light Properties

**Radius:** How far the light reaches (5-100 grid units)
**Intensity:** Brightness level (0-100%)
**Color:** 
- 🔥 Warm Orange (torches, fires)
- ⚪ White (daylight, Light spell)
- 🔵 Cool Blue (magical, moonlight)
- 💜 Purple/Pink (arcane, fey magic)
- 🟢 Green (poison, undead, nature magic)

**Effects:**
- ✨ Flicker: Animated flickering (torches)
- 💓 Pulse: Breathing/pulsing effect (magical)
- 👤 Shadows: Cast realistic shadows (performance heavy)

---

## Tips & Best Practices

### 🎯 Quick Setup for Common Scenarios

**Dark Dungeon Exploration:**
1. Set global lighting to 10% (very dark)
2. Attach torches to each PC token (20ft radius, warm orange)
3. Add flickering effect for immersion
4. Players can only see what their torches illuminate!

**Outdoor Day Combat:**
1. Set time to 12:00 (noon)
2. Set ambient light to 90-100%
3. No additional lights needed
4. Everything is clearly visible

**Tavern Interior (Evening):**
1. Set time to 19:00 (early evening)
2. Add static lights:
   - Fireplace (30ft radius, warm orange, flicker)
   - Candles on tables (10ft radius, warm)
   - Chandelier (40ft radius, white)
3. Set ambient to 30% (dim indoor)

**Boss Battle in Throne Room:**
1. Set ambient to 20% (dramatic)
2. Add colored magical lights:
   - Purple crystals on pillars (25ft radius, pulse)
   - Blue torches on walls (20ft radius)
   - Red glow from boss's throne (30ft radius)
3. Attach red aura to boss token

**Night Watch at Camp:**
1. Set time to 24:00 (midnight)
2. Set ambient to 5% (very dark)
3. Add campfire (30ft radius, warm orange, flicker)
4. PCs on watch have torches
5. Everything beyond light radius is pitch black

### ⚡ Performance Tips

- Limit to 10-15 lights per map for best performance
- Use shadows sparingly (only 2-3 lights max)
- Lower particle density on lower-end devices
- Disable effects not in current scene

### 🎨 Color Guide for Lighting

| Color | Best For | Example |
|-------|----------|---------|
| 🔥 Warm Orange (#FF8800) | Torches, fires, sunset | Dungeon exploration |
| ⚪ White (#FFFFFF) | Daylight, Light spell, moon | Bright illumination |
| 🔵 Cool Blue (#4488FF) | Magical effects, ice, water | Wizard's spell |
| 💜 Purple (#AA44FF) | Arcane magic, fey, illusion | Mystical areas |
| 🟢 Green (#44FF44) | Nature, poison, undead | Necromancy effects |
| 🔴 Red (#FF4444) | Danger, demons, rage | Boss auras |
| 💛 Yellow (#FFFF44) | Gold, treasure, holy | Divine magic |

---

## Troubleshooting

**Q: I don't see the FX Library button**
- A: You must be the DM (campaign owner) to see this button
- Check that you're in a VTT session with a map loaded

**Q: Lighting panel won't open**
- A: Make sure you clicked "💡 Lighting" in the dropdown
- Check browser console for errors
- Try refreshing the page

**Q: Lights aren't showing on the map**
- A: Check that lighting layer is enabled in Layer Manager
- Verify that lights were created (check panel list)
- Ensure global ambient light isn't at 100% (lights won't be visible)

**Q: Performance is slow with many lights**
- A: Reduce number of active light sources (aim for 10-15 max)
- Disable shadow casting
- Turn off flicker/pulse animations
- Lower light intensity/radius

**Q: Can players see the lighting effects?**
- A: Yes! Lighting effects are synchronized to all users
- Players see the same lighting as the DM
- Future: Token vision will limit what each player sees

---

## Keyboard Shortcuts

Coming soon! Planned shortcuts:
- `L` - Toggle lighting panel
- `G` - Toggle grid (already exists)
- `S` - Toggle snap to grid (already exists)

---

## What's Next?

### Phase 2: Enhanced Lighting (In Progress)
- Directional/cone lights for spells
- Light animations (flicker, pulse)
- Token vision system (darkvision, blindsight)
- Dynamic fog of war based on vision
- Shadow casting improvements

### Phase 3: Weather System (Planned)
- Enable the "🌧️ Weather" button
- Rain, snow, fog effects
- Weather intensity controls
- Gameplay mechanical effects
- Audio integration

### Phase 4: Ambience System (Planned)
- Enable the "🎵 Ambience" button
- Background music playback
- Ambient sound layers
- Spatial audio
- Audio trigger system

---

## Feedback & Bug Reports

Found a bug or have a feature request?
- Check the `VTT_LIGHTING_WEATHER_AMBIENCE_PLAN.md` for planned features
- Submit issues with clear reproduction steps
- Include browser and OS information

---

## Credits

**Implementation:** Phase 1 Complete ✅  
**Version:** 1.0  
**Last Updated:** October 1, 2025

Built with ❤️ for epic tabletop adventures! 🎲✨

---

## Quick Reference Card

```
╔════════════════════════════════════════════╗
║          FX LIBRARY QUICK MENU             ║
╠════════════════════════════════════════════╣
║  ✨ FX Library (Click to Open)            ║
║     ├─ 💡 Lighting        [ACTIVE] ●     ║
║     ├─ 🌧️ Weather         [Soon]         ║
║     └─ 🎵 Ambience        [Soon]         ║
╠════════════════════════════════════════════╣
║  LIGHTING CONTROLS:                        ║
║  • Global: Time of Day, Ambient Light      ║
║  • Lights: Create, Edit, Delete            ║
║  • Types: Point, Cone, Area                ║
║  • Props: Radius, Color, Intensity         ║
║  • FX: Flicker, Pulse, Shadows             ║
╠════════════════════════════════════════════╣
║  COMMON USES:                              ║
║  🔦 Token torches (20ft, orange, flicker) ║
║  🕯️ Static fires (30ft, orange, flicker) ║
║  ✨ Spell lights (40ft, white, bright)    ║
║  💎 Magic items (15ft, color, pulse)      ║
║  🌅 Time of day (slider 0-24)             ║
╚════════════════════════════════════════════╝
```

Happy gaming! 🎮🔥
