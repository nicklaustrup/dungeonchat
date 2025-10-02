# Map Library Upload Fix

## Changes Made

### 1. Disabled "Create New Map" Buttons
**Files Modified:** 
- `src/components/VTT/MapLibrary/MapLibrary.jsx`
- `src/components/VTT/MapLibrary/MapLibrary.css`

**What Changed:**
- Added `disabled` attribute to both "Create New Map" buttons (header and empty state)
- Added tooltip: "Coming soon - This feature is under development"
- Added CSS styles for disabled state (grayed out with reduced opacity)

The buttons are now visually disabled and show a "Coming Soon" message when hovered.

### 2. Enhanced Map Upload Error Handling
**Files Modified:**
- `src/components/VTT/MapEditor/MapEditor.jsx`
- `src/components/VTT/MapEditor/MapUploader.jsx`

**What Changed:**

#### MapEditor.jsx
- Added comprehensive validation before upload:
  - Checks if Firebase Storage is initialized
  - Checks if user is authenticated
  - Checks if campaign ID is present
- Enhanced error messages with user-friendly explanations:
  - Storage permission errors
  - Upload cancellation
  - Unknown errors
- Added detailed console logging for debugging
- **Fixed critical bug**: Error messages now display BEFORE map is uploaded (previously only showed after save)

#### MapUploader.jsx
- Added file rejection handling
- Console logs for debugging rejected files
- Alert messages when files are rejected (wrong format or too large)
- Error handling for file reading failures

## How Map Upload Should Work

### Current Flow:
1. User navigates to Campaign Dashboard → Maps tab
2. If user is DM, they see the "Create New Map" button (now disabled)
3. ~~Clicking the button opens the MapEditor~~ (Currently disabled - coming soon)
4. In MapEditor:
   - User drag-and-drops an image OR clicks to select
   - MapUploader validates file (must be image, under 20MB)
   - File is uploaded to Firebase Storage
   - Image dimensions are extracted
   - User enters map name and configures grid
   - User clicks "Save Map" to store in Firestore

### Storage Permissions:
- Path: `campaigns/{campaignId}/maps/`
- Rules: Any authenticated user can upload (20MB limit, images only)
- Note: Storage rules don't check for DM status, but Firestore rules do

### Firestore Permissions:
- Collection: `campaigns/{campaignId}/maps/{mapId}`
- Rules: Only the campaign DM can create/update/delete maps
- All campaign members can read maps

## Testing Checklist

To verify map uploads work:

1. **As Campaign DM:**
   - [ ] Navigate to Campaign Dashboard → Maps tab
   - [ ] ~~Click "Create New Map" button~~ (Currently disabled)
   - [ ] Verify button shows "Coming soon" tooltip and is grayed out
   - [ ] Check browser console for any errors

2. **If you bypass the disabled button (for testing):**
   - [ ] Try dragging and dropping an image file
   - [ ] Verify file preview shows
   - [ ] Click "Upload Map" button
   - [ ] Watch console for detailed upload logs
   - [ ] If upload fails, verify error message is displayed
   - [ ] If successful, enter map name and click "Save Map"
   - [ ] Verify map appears in library

3. **As Campaign Member (not DM):**
   - [ ] Navigate to Campaign Dashboard → Maps tab
   - [ ] Verify no "Create New Map" button is visible
   - [ ] Can view existing maps

## Troubleshooting

### If Upload Fails:

1. **Check Console Logs:**
   - Look for "Starting map upload..." message
   - Check for validation errors (missing storage, user, or campaignId)
   - Look for Firebase Storage error codes

2. **Common Issues:**
   - **Permission Denied:** User might not be authenticated or campaign ID is wrong
   - **File Too Large:** Must be under 20MB
   - **Wrong File Type:** Must be PNG, JPG, JPEG, or WebP
   - **No Internet:** Firebase Storage requires network access

3. **Verify Setup:**
   - Ensure Firebase Storage is initialized in FirebaseContext
   - Check storage.rules file has been deployed
   - Verify campaign ID is being passed correctly to MapEditor

## What's Still Needed

The "Create New Map" feature is intentionally disabled because:
- The feature exists but may need additional testing
- UX improvements might be needed
- Current implementation is complete but marked as "coming soon" per request

To re-enable the feature:
1. Remove the `disabled` attribute from both buttons in `MapLibrary.jsx`
2. Remove the "Coming soon" tooltip text
3. The upload functionality should work as-is

## Files Changed Summary

```
src/components/VTT/MapLibrary/
  ├── MapLibrary.jsx          (disabled buttons, added tooltips)
  └── MapLibrary.css          (added disabled button styles)

src/components/VTT/MapEditor/
  ├── MapEditor.jsx           (enhanced error handling, validation, logging)
  └── MapUploader.jsx         (added rejection handling, better feedback)
```
