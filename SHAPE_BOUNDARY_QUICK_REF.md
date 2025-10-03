# Shape & Drawing Tools - Boundary & Timeout Quick Reference

## 🚫 Boundary Rules

### What Gets Rejected?
Any click **outside the map boundaries** will be rejected for:
- ✏️ **Pen Tool** - Freehand drawings
- ➡️ **Arrow Tool** - Temporary arrows
- 📏 **Ruler Tool** - Distance measurements  
- 🔴 **Circle Tool** - Circular shapes
- ⬜ **Rectangle Tool** - Rectangular shapes
- 🔺 **Cone Tool** - Cone/triangle shapes
- ➖ **Line Tool** - Straight lines

### What Happens When You Click Outside?
```
❌ Click outside map
   ↓
🔔 Console message: "Cannot start [tool] outside map bounds"
   ↓
🚫 No action taken - you must click inside the map
```

### Partial Out-of-Bounds
```
✅ First click INSIDE map (valid)
   ↓
❌ Second click OUTSIDE map (invalid)
   ↓
🔔 Console message: "Cannot end [tool] outside map bounds"
   ↓
🧹 Tool state cleared - start over
```

## ⏱️ Auto-Timeout (30 Seconds)

### What Gets Auto-Cleared?
If you start any of these tools but don't finish within **30 seconds**:

| Tool | Timeout Behavior |
|------|------------------|
| **Shapes** (circle/rect/cone/line) | Clears start point and preview |
| **Ruler** | Clears measurement in progress |
| **Arrow** | Clears arrow start point |

### Timeline Example
```
00:00 - Click to start shape
00:15 - Move mouse (preview showing)
00:30 - ⏰ TIMEOUT! State auto-cleared
        Console: "[Tool] cancelled due to inactivity"
```

### How to Avoid Timeout
- ✅ Complete your shape/ruler/arrow within 30 seconds
- ✅ Press ESC to manually cancel
- ✅ Switch to a different tool

### Why 30 Seconds?
Long enough for normal use, short enough to clean up forgotten operations. Prevents the UI from getting "stuck" with an unfinished shape.

## 🎮 Usage Tips

### Starting a Shape/Tool
1. Select your tool (circle, rectangle, pen, etc.)
2. Click **inside the map** to start
3. See the preview as you move your mouse
4. Complete within 30 seconds

### If You Click Outside
- Don't panic! Just click inside the map instead
- Check the browser console for feedback messages
- The tool won't "break" - just try again

### If Preview Disappears
- You've moved your cursor outside map bounds
- Move back inside to see the preview again
- The shape won't be created if you click outside

### If Tool Seems "Stuck"
- Wait up to 30 seconds for auto-clear
- Or press **ESC** to cancel immediately
- Or switch to a different tool

## 🔍 Visual Feedback

| Situation | What You See |
|-----------|--------------|
| Valid click inside map | ✅ Shape starts / Preview appears |
| Invalid click outside map | 🚫 Nothing happens |
| Moving inside bounds | ✅ Preview updates |
| Moving outside bounds | 👻 Preview disappears |
| 30 seconds elapsed | 🧹 Everything clears automatically |

## 🛠️ Developer Notes

### Console Messages
Watch the browser console for helpful feedback:
- `"Cannot start [tool] outside map bounds"`
- `"Cannot end [tool] outside map bounds"`
- `"[Tool] cancelled due to inactivity"`

### Map Boundaries
The map bounds are defined as:
```
X: 0 to mapWidth
Y: 0 to mapHeight
```

### Timeout Duration
Configured at **30 seconds** (30000ms) for all tools.

## ❓ Common Questions

**Q: Can I extend shapes outside the map?**  
A: No, both start and end points must be inside the map boundaries.

**Q: What if I'm zoomed in and can't see the edges?**  
A: Zoom out or pan to see the map boundaries. Clicks outside remain invalid.

**Q: Can the DM disable this restriction?**  
A: No, this applies equally to both DMs and players for consistency.

**Q: Does this apply to tokens?**  
A: No, tokens have their own clamping logic (they snap to edges). This only affects drawing tools.

**Q: Can I change the 30-second timeout?**  
A: Currently it's hardcoded at 30 seconds. Could be made configurable in the future.

**Q: What about pen drawings that cross the boundary?**  
A: The pen tool only validates the starting click. Continuous drawing is not boundary-checked during mouse movement.

## 🎯 Best Practices

1. ✅ **Stay Aware**: Keep track of map boundaries when drawing
2. ✅ **Work Quickly**: Complete shapes within 30 seconds
3. ✅ **Use ESC**: Cancel unwanted operations manually
4. ✅ **Check Console**: Look for feedback messages if confused
5. ✅ **Zoom Out**: See the full map when drawing large shapes

---

**Related Documentation:**
- Full technical details: `SHAPE_BOUNDARY_REJECTION.md`
- Original (deprecated) approach: `SHAPE_BOUNDARY_ENFORCEMENT.md`
