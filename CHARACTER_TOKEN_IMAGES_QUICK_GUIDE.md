# Character Token Images - Quick Guide

## 🎭 What Changed?

Your character tokens now use **your character portrait** instead of just your profile picture!

## 📸 How to Upload a Character Portrait

### Step 1: Open Your Character Sheet
- Click on your character in the campaign dashboard
- Or open it from the VTT Character Sheet panel

### Step 2: Click the Avatar Circle
- In the header, you'll see a circular avatar
- Click it to upload an image

### Step 3: Choose Your Image
- Select a PNG, JPG, GIF, or WebP file
- Must be under 5MB
- Portrait images work best (square aspect ratio)

### Step 4: Your Token Updates Automatically!
- The image appears on your character sheet
- Any new tokens created will use this image
- Existing tokens keep their original image

## 🎨 Image Priority System

```
┌─────────────────────────────────┐
│  1. Character Avatar (you set)  │  ← Highest Priority
│  ↓                               │
│  2. Profile Picture (account)   │  ← Backup
│  ↓                               │
│  3. Default Blue Color           │  ← Fallback
└─────────────────────────────────┘
```

## ❌ How to Remove a Portrait

1. Open your character sheet
2. Click the small red **X** button on the avatar
3. Confirm removal
4. Token falls back to your profile picture

## 💡 Pro Tips

### Best Practices
- **Square images work best** (e.g., 512x512, 1024x1024)
- Use clear, high-contrast portraits
- Faces should be visible at small sizes
- Avoid very dark or very light images

### Recommended Image Specs
- **Format**: PNG with transparency (looks best)
- **Size**: 512x512 to 1024x1024 pixels
- **File Size**: Under 2MB (max 5MB)
- **Style**: Portrait/headshot works best for tokens

## 🔍 Visual Examples

### Without Character Avatar
```
┌───────────────┐
│ Token Uses:   │
│               │
│  Profile Pic  │  or  Blue Circle
│  (if set)     │      (default)
└───────────────┘
```

### With Character Avatar
```
┌───────────────┐
│ Token Uses:   │
│               │
│  Character    │  ← Your custom image!
│  Avatar       │
└───────────────┘
```

## 🎮 For Dungeon Masters

### Managing Player Tokens
- Players can upload their own portraits
- DMs can create tokens for players (uses their avatar/profile)
- Manual token generation uses the priority system

### Token Creation Behavior
1. **Auto-created tokens** (when player joins VTT)
   - Uses character avatar if available
   - Falls back to profile photo
   - Falls back to blue default

2. **Manually created tokens** (DM generates via button)
   - Same priority system
   - Can be customized further in Token Manager

## 🐛 Troubleshooting

### Image Not Showing?
1. Check file size (must be under 5MB)
2. Verify file type (PNG, JPG, GIF, WebP only)
3. Try refreshing the page
4. Check browser console for errors

### Token Didn't Update?
- New tokens will use the new image
- Existing tokens keep their current image
- Delete old token and create a new one to update

### Upload Failed?
- Check your internet connection
- Verify you have permission in the campaign
- Try a smaller image file
- Check if Firebase Storage is configured

## 📋 Quick Reference

| Action | Result |
|--------|--------|
| Upload avatar | Character sheet & new tokens use it |
| Remove avatar | Falls back to profile picture |
| No profile pic | Uses default blue color |
| Change avatar | Only affects new tokens |

## 🎯 Common Scenarios

### Scenario 1: New Player
1. Create character
2. Upload character portrait
3. Join VTT → Token automatically created with portrait

### Scenario 2: Existing Player
1. Have character with token already
2. Upload new portrait
3. Token stays the same (manual recreation needed)

### Scenario 3: Multiple Characters
1. Create Character A → Upload Portrait A
2. Create Character B → Upload Portrait B
3. Each character has unique token image!

## 🔐 Privacy & Storage

- Images stored in Firebase Storage
- Only visible to campaign members
- URLs are signed for security
- Deletion is permanent

---

**Need Help?** Check the full documentation in `CHARACTER_TOKEN_IMAGES.md`
