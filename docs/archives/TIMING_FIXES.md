# Drawing and Ping Timing Fixes

## Changes Made

### ✅ 1. Ping Fade Transition
**Before**: Pings disappeared instantly after 3 seconds
**After**: Pings fade smoothly over the last 1 second

**Implementation**:
- Pings start at 80% opacity
- At 2 seconds, fade begins
- Fades to 0% over 1 second (2s-3s)
- Opacity applies to all three lines (X shape + vertical)
- Shadow opacity also fades proportionally

### ✅ 2. Pen Fade Timing Changed
**Before**: Pen started fading at 2 seconds
**After**: Pen starts fading 1 second after it's drawn

**Implementation**:
- Pen strokes start at 80% opacity
- At 1 second, fade begins
- Fades to 0% over 2 seconds (1s-3s)
- Fade continues even while pen is still being drawn

**Note**: The fade timer starts from when the pen stroke was **created**, not when you finish drawing. So if you draw for more than 1 second, the stroke will start fading while you're still drawing.

### ✅ 3. Arrow Quick Fade (Like Ping)
**Before**: Arrow had slower fade
**After**: Arrow fades quickly like ping over last 1 second

**Implementation**:
- Arrows start at 90% opacity
- At 2 seconds, fade begins
- Fades to 0% over 1 second (2s-3s)
- Quick fade makes arrows more ephemeral like pings

### ✅ 4. Player Token Staging Debug Logging

**Added Console Logs**:

1. **VTTSession.jsx**:
   - "Player token created and staged for: {name} Token ID: {id} Token data: {data}"
   - Shows when player token is created with full details

2. **TokenManager.jsx**:
   - "TokenManager: Setting up staged tokens subscription for map: {mapId}"
   - "TokenManager: Staged tokens received: {count} {tokens}"
   - "TokenManager: Unsubscribing from staged tokens"

**To Debug Staging Issue**:
1. Open browser console
2. Join VTT session as a player (with character sheet)
3. Check for "Player token created and staged for:" message
4. Check for "TokenManager: Staged tokens received:" message
5. Verify token has `staged: true` property
6. Verify token has `type: 'pc'` property

**Common Issues**:
- Player has no character sheet → Token won't be created
- Token already exists on map → Won't create duplicate
- Token has `staged: false` → Won't appear in staging area
- Token has wrong `type` → Won't appear (must be 'pc')

## Summary of Timings

| Element | Duration | Fade Start | Fade Duration | Total Life |
|---------|----------|------------|---------------|------------|
| **Ping** | 3s | 2s | 1s | 3s |
| **Pen** | 3s | 1s | 2s | 3s |
| **Arrow** | 3s | 2s | 1s | 3s |

## Visual Timeline

```
Ping:   [======SOLID======][--FADE--]
        0s              2s         3s

Pen:    [====SOLID====][====FADE====]
        0s           1s            3s

Arrow:  [======SOLID======][--FADE--]
        0s              2s         3s
```

## Testing Checklist

- [ ] Ping fades smoothly over last 1 second before disappearing
- [ ] Pen starts fading 1 second after first drawn (even while drawing)
- [ ] Arrow fades quickly like ping over last 1 second
- [ ] All fades are smooth and linear
- [ ] Console shows player token creation logs
- [ ] Console shows staged tokens subscription logs
- [ ] Staged tokens appear in Token Manager staging area
