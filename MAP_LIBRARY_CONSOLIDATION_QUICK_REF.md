# Map Library Consolidation - Quick Reference

## 🎯 What Changed?

### Simplified Toolbar
- ❌ **Removed**: "Library" button
- ✅ **Kept**: "Maps" button (now does everything)

### Enhanced Maps Panel
- ✨ **New**: "Import Map" button in panel header
- ✨ **New**: Batch import flyout with preview
- ✨ **New**: Staging area for multiple imports
- ✨ **New**: Description field for maps

---

## 🚀 Quick Start

### Import a Single Map
```
1. Click [Maps] → [Import Map]
2. Paste URL → Wait for preview
3. [+ Add to Import List]
4. [Add to Library (1)]
```

### Import Multiple Maps
```
1. Click [Maps] → [Import Map]
2. Add first map (URL + details)
3. [+ Add to Import List]
4. Repeat for more maps
5. Review all in "Maps to Import"
6. [Add to Library (n)]
```

### Remove Staged Map
```
Click [×] on any map in "Maps to Import"
```

---

## 📋 Form Fields

| Field | Required | Purpose |
|-------|----------|---------|
| **Image URL** | ✅ Yes | Source of the map image |
| **Map Name** | ❌ Optional | Display name (defaults to "Imported Map") |
| **Description** | ❌ Optional | Context/notes about the map |

---

## 🎨 Visual Indicators

### States
- 🔵 **Loading**: "Loading preview..." (blue background)
- 🔴 **Error**: Error message (red background)
- 🟢 **Success**: Preview with dimensions (green on finish)

### Preview Info
```
┌─────────────────┐
│  [Image]        │
│  2400 × 1600px  │ ← Dimensions auto-detected
└─────────────────┘
```

### Pending Item
```
┌──────────────────────────────┐
│ [📷] Ancient Temple      [×] │
│      Description text        │
│      2400 × 1600px           │
└──────────────────────────────┘
```

---

## ⚡ Workflow Tips

### Best Practices
1. **Verify URLs first** - Paste in browser to test
2. **Use descriptive names** - Helps identify maps later
3. **Add descriptions** - Context is valuable
4. **Review before import** - Check all staged maps
5. **Remove mistakes** - Use [×] button freely

### URL Requirements
- ✅ Must be publicly accessible
- ✅ Must be a direct image link
- ✅ CORS-enabled preferred (for dimension detection)
- ✅ Formats: JPG, PNG, WebP, etc.

### Common URLs
- **Imgur**: `https://i.imgur.com/xxxxx.jpg`
- **Discord CDN**: `https://cdn.discordapp.com/attachments/...`
- **Google Drive**: Share with "Anyone with link"
- **Dropbox**: Change `?dl=0` to `?raw=1`

---

## 🔧 Troubleshooting

### "Failed to load image"
- ✅ Check URL is correct
- ✅ Ensure URL is publicly accessible
- ✅ Try opening URL in new tab
- ✅ Check for CORS restrictions

### Preview not loading
- ⏱️ Wait a moment after pasting URL
- 🔄 Click outside input to trigger blur event
- 🔍 Check browser console for errors

### Dimensions show 0 × 0
- ⚠️ CORS issue (map still imports)
- ℹ️ Dimensions will be 0 in database
- 💡 Update manually later if needed

---

## 🎮 Keyboard Navigation

### Current
- `Tab` - Move between fields (triggers preview)
- `Enter` - Submit form (in inputs)

### Planned
- `Escape` - Close flyout
- `Ctrl+Enter` - Add to list
- `Ctrl+Shift+Enter` - Finish import

---

## 📊 State Indicators

### Button States
```
[Import Map]         - Flyout closed
[Import Map] (active) - Flyout open

[+ Add to Import List] - Ready to add
[+ Add to Import List] (disabled) - No URL or preview

[Add to Library (3)] - Ready to import 3 maps
```

### List States
```
No pending imports → Button hidden
1-n pending imports → Show list + button
After import → List clears, flyout closes
```

---

## 💾 Data Storage

### Map Document Structure
```javascript
{
  name: "Ancient Temple",
  description: "A mysterious temple...",
  imageUrl: "https://...",
  width: 2400,
  height: 1600,
  createdBy: "system",
  // + other default fields
}
```

### Firestore Path
```
/campaigns/{campaignId}/maps/{mapId}
```

---

## 🔗 Related Features

### After Import
- Maps appear in library list immediately
- Click map to set as active
- Edit via Campaign Dashboard
- Delete from library (existing feature)

### Map Management
- **Grid Configuration** - Set after import
- **Fog of War** - Enable on map
- **Token Placement** - Add tokens to map
- **Lighting** - Configure lighting zones

---

## 📱 Component Props

### MapQueue Props
```javascript
{
  campaignId: string,
  activeMapId: string,
  onMapSelect: (mapId) => void
}
```

### No New Props Required
- All state managed internally
- Uses existing mapService methods
- Integrates seamlessly

---

## 🚨 Important Notes

### Single Import vs Batch
- Can still import one at a time
- Flyout supports both workflows
- No minimum or maximum limit

### Form Reset
- Clears after each "Add to List"
- Keeps flyout open for next import
- Manual close always available

### Error Recovery
- Errors don't block other imports
- Can remove problematic maps from pending
- Can retry failed URLs

---

## 📚 Documentation

### Full Guides
- `MAP_LIBRARY_CONSOLIDATION.md` - Complete implementation
- `MAP_LIBRARY_CONSOLIDATION_VISUAL_GUIDE.md` - Visual reference

### Code Files
- `MapQueue.jsx` - Main component
- `MapQueue.css` - Styles
- `mapService.js` - Backend integration

---

## ✅ Testing Checklist

### Basic Flow
- [ ] Click Maps button
- [ ] Click Import Map button
- [ ] Paste valid URL
- [ ] See preview load
- [ ] Click Add to List
- [ ] See map in pending list
- [ ] Click Add to Library
- [ ] See map in library

### Error Cases
- [ ] Invalid URL shows error
- [ ] Empty URL disables button
- [ ] Network error handled gracefully
- [ ] CORS issue doesn't crash

### Multiple Maps
- [ ] Add 3+ maps to pending
- [ ] Remove one from pending
- [ ] Import remaining maps
- [ ] All appear in library

---

**Quick Reference Version**: 1.0
**Status**: Ready for use
**Last Updated**: October 3, 2025
