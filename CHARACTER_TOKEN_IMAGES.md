# Character Token Image Priority System

## Overview

Player tokens now have a smart image priority system that uses character portraits, profile pictures, or default colors to represent players on the VTT map.

## Image Priority System

When a player token is created, the system follows this priority order:

1. **Character Avatar** (Highest Priority)
   - Custom image uploaded to the character sheet
   - Stored in Firebase Storage under `characters/{campaignId}/{userId}/avatar_*`
   - Appears on both the character sheet and the VTT token

2. **Profile Picture** (Backup)
   - User's profile photo from their account
   - Falls back to this if no character avatar is set
   - Stored in `userProfiles` collection

3. **Default Blue Color** (Fallback)
   - Blue colored circle (`#4a9eff`)
   - Used when no images are available
   - Still displays character name

## How to Upload a Character Portrait

### For Players

1. Open your character sheet in the campaign
2. Click on the circular avatar/placeholder in the header
3. Select an image file (PNG, JPG, GIF, or WebP)
4. Image must be under 5MB
5. The image will be uploaded and displayed immediately
6. Your token on the map will automatically use this image

### Removing a Character Portrait

1. Open your character sheet
2. Click the red X button in the top-right corner of the avatar
3. Confirm the removal
4. Token will fall back to profile picture or default color

## Technical Implementation

### Files Modified

1. **`src/components/CharacterSheet.js`**
   - Added avatar upload UI with drag-and-drop support
   - Image preview and removal functionality
   - Firebase Storage integration

2. **`src/components/CharacterSheet.css`**
   - Styling for avatar display and upload UI
   - Hover effects and animations
   - Responsive design

3. **`src/services/characterSheetService.js`**
   - Updated `createPlayerStagedToken()` function
   - Implements priority: `character.avatarUrl || profile.photoURL || ''`

4. **`src/components/VTT/VTTSession/VTTSession.jsx`**
   - Updated auto-token creation for players
   - Same priority system as service

5. **`src/components/VTT/VTTSession/CharacterSheetPanel.jsx`**
   - Passes `storage` prop to CharacterSheet

6. **`src/components/Campaign/CampaignDashboard.js`**
   - Passes `storage` prop to CharacterSheet

### Data Model

Character sheet now includes:
```javascript
{
  // ... existing fields
  avatarUrl: string | null  // Firebase Storage URL or null
}
```

Token creation uses:
```javascript
const tokenImageUrl = character.avatarUrl || profile.photoURL || '';
```

### Token Display Logic

The `TokenSprite` component handles image display:
- If `imageUrl` is set and valid, displays the image
- If `imageUrl` is empty or fails to load, shows colored circle
- Circle color is determined by token type (blue for PC tokens)

## User Experience

### Before This Feature
- Tokens always used profile picture or default color
- No way to customize character appearance
- Profile picture was shared across all characters

### After This Feature
- Each character can have a unique portrait
- Profile picture acts as fallback
- Easy upload/removal workflow
- Visual feedback during upload

## Future Enhancements

Potential improvements:
- Drag-and-drop upload directly on token
- Image cropping/editing tools
- Multiple avatar options per character
- AI-generated character portraits
- Token frame/border customization

## Testing Checklist

- [ ] Upload character avatar (various formats: PNG, JPG, GIF, WebP)
- [ ] Verify avatar appears on character sheet
- [ ] Create new token - should use character avatar
- [ ] Remove character avatar - token should fall back to profile photo
- [ ] Remove profile photo - token should use default blue color
- [ ] Test with file size validation (over 5MB should be rejected)
- [ ] Test with non-image files (should be rejected)
- [ ] Verify avatars persist across sessions
- [ ] Test as both DM and player
- [ ] Verify token images update when avatar changes

## Known Limitations

1. **File Size**: Maximum 5MB per image
2. **Formats**: Only standard web image formats (PNG, JPG, GIF, WebP)
3. **Storage**: Uses Firebase Storage quota
4. **Caching**: Browser may cache old images temporarily

## Security Considerations

- Uploads are authenticated (must be logged in)
- Files are stored under campaign/user-specific paths
- File type and size validation on client side
- Firebase Storage security rules should restrict access
- Image URLs are public (via Firebase Storage signed URLs)

## Code Examples

### Uploading an Avatar Programmatically

```javascript
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';

async function uploadCharacterAvatar(storage, firestore, campaignId, userId, file) {
  // Upload to storage
  const storageRef = ref(
    storage, 
    `characters/${campaignId}/${userId}/avatar_${Date.now()}.${file.name.split('.').pop()}`
  );
  await uploadBytes(storageRef, file);
  const avatarUrl = await getDownloadURL(storageRef);
  
  // Update character sheet
  const characterRef = doc(firestore, 'campaigns', campaignId, 'characters', userId);
  await updateDoc(characterRef, {
    avatarUrl,
    updatedAt: new Date()
  });
  
  return avatarUrl;
}
```

### Getting Token Image with Priority

```javascript
function getTokenImage(character, profile) {
  // Priority: character avatar -> profile photo -> empty (default color)
  return character.avatarUrl || profile.photoURL || '';
}
```

## Support

For issues or questions:
1. Check browser console for error messages
2. Verify Firebase Storage is configured
3. Check file size and format
4. Ensure proper permissions in campaign
5. Try clearing browser cache if images don't update
