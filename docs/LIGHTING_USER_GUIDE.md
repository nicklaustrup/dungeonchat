# Dynamic Lighting System - User Guide

## Overview

The VTT now includes a complete dynamic lighting system that allows DMs to create atmospheric lighting effects on their maps. This includes light sources (torches, lanterns, magical lights), a day/night cycle, and ambient lighting control.

---

## Quick Start

### 1. Enable Lighting

1. As a DM, open a map in your VTT session
2. Click the **💡 Lighting** button in the top toolbar
3. The Lighting Panel will appear on the right side

### 2. Turn On Lighting System

1. In the Lighting Panel header, toggle the **Lighting** switch to ON
2. You'll see the map darken with ambient lighting applied

### 3. Add Your First Light

1. Click **+ Add Light** in the panel
2. Choose a preset (Torch, Lantern, Candle, etc.)
3. Adjust radius, intensity, and color as desired
4. Click **Create Light**
5. The light will appear in the center of your map

---

## Features

### 🔦 Light Sources

Create various types of light sources:

#### **Presets**
- **🔥 Torch** - 40ft radius, orange glow, flickering effect
- **🏮 Lantern** - 30ft radius, warm yellow light
- **🕯️ Candle** - 10ft radius, small golden light, flickers
- **✨ Light Spell** - 40ft radius, bright white magical light
- **☀️ Daylight** - 60ft radius, intense white light
- **🔵 Magical Blue** - 30ft radius, blue glow, animated pulse
- **🟣 Magical Purple** - 30ft radius, purple glow, animated pulse
- **🔥 Fireplace** - 35ft radius, deep orange, flickering

#### **Custom Lights**
- Adjust radius (5-120 feet)
- Set intensity (0-100%)
- Choose any hex color
- Toggle flicker effect (torches, candles)
- Toggle animated pulse (magical effects)

### 🌍 Global Lighting

#### **Time of Day**
- Slider: 0:00 to 23:59 (24-hour format)
- **🌅 Dawn** (6am-8am): Gradual brightening
- **☀️ Day** (8am-6pm): Full bright ambient light
- **🌇 Dusk** (6pm-8pm): Gradual darkening
- **🌙 Night** (8pm-6am): Dark with minimal ambient light

#### **Ambient Light Level**
- Manual control: 0-100%
- Override time-based lighting
- Useful for indoor scenes or special lighting conditions

---

## How to Use

### Creating Lights

1. **Open Lighting Panel**: Click 💡 Lighting button
2. **Add Light**: Click "+ Add Light"
3. **Choose Method**:
   - **Quick**: Select a preset
   - **Custom**: Manually configure all properties
4. **Position**: Lights spawn at map center (future: click to place)
5. **Create**: Click "Create Light"

### Editing Lights

1. Find the light in the "Light Sources" list
2. Click the **🔧 Edit** button
3. Modify any properties
4. Changes apply immediately

### Deleting Lights

1. Find the light in the "Light Sources" list
2. Click the **🗑️ Delete** button
3. Confirm deletion

### Adjusting Time of Day

1. Use the **Time of Day** slider
2. Watch the map lighting change in real-time
3. Emoji indicators show current time:
   - 🌅 Dawn (sunrise)
   - ☀️ Day (midday)
   - 🌇 Dusk (sunset)
   - 🌙 Night (midnight)

### Controlling Ambient Light

1. Use the **Ambient Light** slider
2. 0% = Complete darkness
3. 100% = Full brightness
4. Useful for:
   - Indoor dungeons (low ambient)
   - Bright outdoor areas (high ambient)
   - Special lighting effects

---

## Advanced Features

### Light Properties

#### **Radius**
- Range: 5-120 feet
- Determines how far the light reaches
- Uses map grid scale (if enabled)

#### **Intensity**
- Range: 0-100%
- Controls brightness of the light
- Affects how much darkness is illuminated

#### **Color**
- Any hex color (#RRGGBB)
- Creates colored lighting effects
- Multiple lights blend colors naturally

#### **Falloff**
- How light dims with distance
- Types: Linear, Quadratic, Realistic
- Affects visual appearance

#### **Flicker**
- Random intensity variation
- Great for torches, candles, fires
- Adds realism and atmosphere

#### **Animated**
- Smooth pulsing effect
- Perfect for magical lights
- Breathing/glowing animation

### Light Blending

- Multiple lights automatically blend together
- Colors mix realistically (RGB blending)
- Overlapping lights create brighter areas
- Uses "lighten" blend mode for realistic effects

### Token Lights (Coming Soon)

- Attach lights to tokens
- Lights move with the token
- Different lights for different tokens
- Vision-based lighting (what tokens can see)

---

## Tips & Best Practices

### 🎨 Creating Atmosphere

1. **Dungeons**: Low ambient (20-30%), strategic torch placement
2. **Taverns**: Warm lanterns and fireplace, medium ambient (50-60%)
3. **Outdoors Day**: High ambient (80-100%), minimal light sources
4. **Outdoors Night**: Low ambient (10-20%), campfires and torches
5. **Magical Scenes**: Colored lights, animated effects, varying intensities

### ⚡ Performance

- Keep lights to reasonable numbers (5-15 per map)
- Use larger radius lights for big areas
- Disable lighting when not needed
- Turn off flicker/animation for better performance

### 🎭 Dramatic Effects

- **Sunrise/Sunset**: Slowly adjust time of day slider during session
- **Thunderstorm**: Flash ambient light to 100% briefly
- **Magical Ritual**: Use multiple colored animated lights
- **Stealth Scene**: Drop ambient to near-zero, minimal lights
- **Boss Entrance**: Add dramatic colored lights when boss appears

### 🗺️ Map Considerations

- Works best with darker map images
- Bright maps may need very low ambient light
- Grid-enabled maps show light boundaries more clearly
- Consider map size when setting light radius

---

## Keyboard Shortcuts

(Future feature - coming in Phase 2)

- `L` - Toggle lighting on/off
- `Ctrl+L` - Open lighting panel
- `Click` (with Lighting tool) - Place light at cursor

---

## Troubleshooting

### Lights Not Showing

1. Check that Lighting is toggled ON in panel
2. Verify lights have intensity > 0
3. Check if ambient light is too high (blocks light visibility)
4. Ensure map is loaded

### Map Too Dark

1. Increase **Ambient Light** slider
2. Add more light sources
3. Increase light **Radius** and **Intensity**
4. Change **Time of Day** to daytime (12:00)

### Map Too Bright

1. Decrease **Ambient Light** slider
2. Remove unnecessary lights
3. Change **Time of Day** to night (0:00)
4. Decrease light intensity

### Performance Issues

1. Reduce number of lights on map
2. Disable **Flicker** and **Animated** effects
3. Use fewer colored lights
4. Lower light radius where possible

---

## Technical Notes

### Data Persistence

- All lights are saved to Firebase in real-time
- Global lighting settings persist per map
- Changes sync immediately to all players
- Lights survive page refresh

### Player View

- Players see the same lighting as DM
- DM has exclusive control over lights
- Lighting enhances immersion for all players
- Future: Player token-based vision

### Browser Compatibility

- Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- Requires WebGL support (available in 99%+ browsers)
- Hardware acceleration recommended for best performance

---

## Coming Soon (Phase 2+)

### 🚀 Enhanced Lighting
- Click-to-place lights on map
- Attach lights to tokens
- Token-based vision (dynamic fog of war)
- Line-of-sight shadows
- Cone/directional lights
- Light templates/presets library

### 🌦️ Weather Effects
- Rain, snow, fog overlays
- Dynamic weather that affects visibility
- Lightning effects
- Wind animations

### 🎵 Ambience System
- Environmental sounds
- Music synchronization with lighting
- Scene presets (dungeon, forest, tavern)
- Particle effects (embers, dust, magic sparkles)

---

## Feedback & Support

This is Phase 1 of the lighting system. More features are coming!

**Found a bug?** Report it in the campaign notes or contact your DM.

**Feature request?** We're listening! Let us know what lighting features would enhance your games.

**Need help?** Check the troubleshooting section or ask your DM for assistance.

---

## Credits

**Phase 1: Basic Dynamic Lighting**
- Point light sources with presets
- Day/night cycle system
- Global ambient lighting control
- Real-time synchronization
- Flicker & pulse animations
- Color blending system

**Version**: 1.0.0  
**Release**: January 2025  
**Status**: ✅ Production Ready

---

Enjoy creating atmospheric lighting for your adventures! 🎲✨
