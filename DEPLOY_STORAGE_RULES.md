# Deploy Storage Rules for Character Avatars

## Issue Fixed

1. **Button nesting error** - Changed character tab from `<button>` to `<div>` with proper accessibility attributes
2. **Storage permission error** - Added rules for character avatar uploads

## Deploy Storage Rules

You need to deploy the updated storage rules to Firebase:

### Option 1: Deploy via Firebase CLI (Recommended)

```bash
# Make sure you're in the project directory
cd c:\Users\nlaus\randomcode\firebase_chat\superchat

# Deploy only storage rules
firebase deploy --only storage
```

### Option 2: Deploy via Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Storage** → **Rules**
4. Copy the contents of `storage.rules` file
5. Paste into the rules editor
6. Click **Publish**

## New Storage Rules Added

```javascript
// Character avatars - users can upload their own character avatars
match /characters/{campaignId}/{userId}/{allPaths=**} {
  allow read: if request.auth != null; // Any authenticated user can view
  // Users can upload their own character avatars with size and type restrictions
  allow write: if request.auth != null && request.auth.uid == userId
    && request.resource.size < 5 * 1024 * 1024 // 5MB limit
    && request.resource.contentType.matches('image/.*'); // Only images
  // Users can delete their own character avatars
  allow delete: if request.auth != null && request.auth.uid == userId;
}
```

## What Changed

### CharacterSheetPanel.jsx
- Changed `<button>` to `<div>` for character tabs
- Added `role="button"` for accessibility
- Added `tabIndex={0}` for keyboard navigation
- Added `onKeyPress` handler for Enter/Space key support
- Inner "generate token" button is now valid (not nested in another button)

### storage.rules
- Added new rules for `characters/{campaignId}/{userId}/` path
- Users can only upload to their own character folder
- Any authenticated user can read character avatars
- 5MB file size limit
- Image files only

## Testing After Deployment

1. Deploy the storage rules using one of the methods above
2. Wait 1-2 minutes for rules to propagate
3. Refresh your application
4. Try uploading a character avatar again
5. Should work without permission errors!

## Verification

Check that the rules are deployed:
```bash
firebase deploy --only storage --dry-run
```

Or verify in Firebase Console:
- Storage → Rules → Should show the new character avatar rules

## Troubleshooting

### Still getting permission errors?
- Wait 2-3 minutes after deployment (rules take time to propagate)
- Clear browser cache and reload
- Check Firebase Console that rules were actually updated
- Verify you're logged in with the correct user account

### Rules not deploying?
```bash
# Login to Firebase
firebase login

# Check current project
firebase projects:list

# Set correct project if needed
firebase use <project-id>

# Try deployment again
firebase deploy --only storage
```

## Security Notes

The new rules ensure:
- ✅ Users can only upload avatars for their own characters
- ✅ File size limited to 5MB
- ✅ Only image files accepted
- ✅ Any authenticated user can view avatars (for tokens on shared maps)
- ✅ Users can only delete their own avatars

---

**After deploying, the character avatar upload feature will work correctly!**
