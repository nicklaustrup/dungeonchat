# Map Library Upload Feature - Implementation Complete

## Overview
Added direct drag-and-drop and file upload functionality to the Map Library in the Campaign Dashboard. Users can now upload maps directly without going through the map editor.

## Changes Made

### Files Modified:
1. **`src/components/VTT/MapLibrary/MapLibrary.jsx`**
2. **`src/components/VTT/MapLibrary/MapLibrary.css`**

## New Features

### 1. **Upload Map Button**
- Green "Upload Map" button in the header
- Opens a standard file picker dialog
- Accepts image files (PNG, JPG, JPEG, WebP)
- 20MB file size limit

### 2. **Drag and Drop Upload**
- Drag any image file over the Map Library
- Visual feedback with blue dashed border and overlay
- Drop to upload immediately
- Same validation as button upload

### 3. **Upload Progress & Feedback**
- **Progress Bar**: Shows upload percentage (0-100%)
- **Success Message**: Green banner when upload completes
- **Error Messages**: Red banner with specific error details
- **Dismissible Errors**: Click × to close error messages

## Technical Implementation

### State Management
```javascript
const [uploadError, setUploadError] = useState(null);
const [isUploading, setIsUploading] = useState(false);
const [uploadProgress, setUploadProgress] = useState(0);
const [isDragging, setIsDragging] = useState(false);
const fileInputRef = useRef(null);
```

### Upload Flow
1. **File Selection**: Via button click or drag-drop
2. **Validation**: 
   - File type must be image/*
   - File size must be < 20MB
3. **Upload to Storage**: `campaigns/{campaignId}/maps/{uuid}.{ext}`
4. **Extract Dimensions**: Get image width/height
5. **Create Firestore Document**: Save map metadata
6. **Update UI**: Add new map to grid immediately

### Validation Rules
- **File Type**: Must be an image (PNG, JPG, JPEG, WebP)
- **File Size**: Maximum 20MB
- **Permissions**: User must be authenticated
- **Firestore Rules**: Only campaign DM can create maps

### Auto-Generated Map Properties
When uploading via drag-drop or button:
- **Name**: Filename (without extension)
- **Description**: Empty (can be edited later)
- **Grid**: Enabled by default, 50px size
- **Grid Color**: Black (#000000)
- **Grid Opacity**: 30%
- **Created By**: Current user's UID

## User Experience

### Success Flow:
1. User clicks "Upload Map" button or drags image
2. File picker opens / Drop zone activates
3. User selects/drops image file
4. Progress bar shows: "Uploading... 45%"
5. Success message: "Map uploaded successfully!"
6. New map appears at top of grid
7. Success message fades after 2 seconds

### Error Handling:
- **Invalid File Type**: "Please select an image file (PNG, JPG, or WebP)"
- **File Too Large**: "File size must be less than 20MB"
- **Permission Denied**: "Permission denied. You must be the DM to upload maps."
- **Storage Error**: "Storage permission denied. Please check your permissions."
- **Generic Error**: Shows error.message from Firebase

### Visual States:
- **Normal**: Standard library view
- **Dragging**: Blue dashed border, overlay with upload icon
- **Uploading**: Progress bar below header
- **Success**: Green success banner
- **Error**: Red error banner with dismiss button

## CSS Classes Added

### Layout & Structure:
- `.map-library.dragging` - Active drag state with dashed border
- `.drag-overlay` - Full-screen drop zone overlay
- `.drag-overlay-content` - Center content box with icon
- `.drag-icon` - Large upload icon (64px)
- `.header-actions` - Flex container for buttons

### Buttons:
- `.upload-map-button` - Green upload button
- `.upload-map-button:hover` - Darker green on hover
- `.upload-map-button:disabled` - Disabled state

### Status Messages:
- `.upload-error` - Red error banner
- `.upload-success` - Green success banner
- `.upload-status` - Blue progress container
- `.upload-progress-bar` - Progress bar background
- `.upload-progress-fill` - Animated progress fill
- `.upload-progress-text` - Progress percentage text

## Security & Permissions

### Firebase Storage Rules:
```
match /campaigns/{campaignId}/maps/{allPaths=**} {
  allow read: if request.auth != null;
  allow write: if request.auth != null
    && request.resource.size < 20 * 1024 * 1024
    && request.resource.contentType.matches('image/.*');
  allow delete: if request.auth != null;
}
```

### Firestore Security Rules:
```
match /maps/{mapId} {
  allow read: if (isDM || exists(members/{uid}));
  allow create, update, delete: if isDM;
}
```

**Note**: Storage allows any authenticated user to upload, but Firestore rules ensure only the DM can create the map document. This means uploads will succeed but map creation may fail if user is not DM.

## Testing Checklist

### As Campaign DM:
- [ ] Click "Upload Map" button
- [ ] Select image file from picker
- [ ] Verify progress bar shows
- [ ] Verify success message appears
- [ ] Verify map appears in grid
- [ ] Drag image file over library
- [ ] Verify blue overlay appears
- [ ] Drop image file
- [ ] Verify upload succeeds

### Error Cases to Test:
- [ ] Upload non-image file (should reject)
- [ ] Upload file > 20MB (should reject)
- [ ] Upload while offline (should show error)
- [ ] Upload as non-DM player (should fail at Firestore step)

### Visual/UX Testing:
- [ ] Progress bar animates smoothly
- [ ] Success message appears and disappears
- [ ] Error message is dismissible
- [ ] Drag overlay shows/hides correctly
- [ ] Buttons disable during upload
- [ ] Multiple uploads in sequence work

## Known Limitations

1. **No Duplicate Detection**: Same image can be uploaded multiple times
2. **No Image Preview**: Upload happens immediately without preview
3. **No Batch Upload**: Can only upload one image at a time
4. **No Grid Configuration**: Uses default grid settings (can edit after)
5. **No Name Customization**: Uses filename as map name (can edit after)

## Future Enhancements (Optional)

- [ ] Preview image before uploading
- [ ] Customize map name before upload
- [ ] Configure grid settings during upload
- [ ] Batch upload multiple maps
- [ ] Duplicate detection (check existing imageUrl)
- [ ] Compression for large images
- [ ] Thumbnail generation
- [ ] Paste from clipboard support
- [ ] URL import functionality

## Comparison: Upload vs Create New Map

| Feature | Upload Map | Create New Map |
|---------|-----------|----------------|
| Method | Button/Drag-drop | Opens editor |
| Speed | Instant | Multi-step |
| Grid Config | Default | Customizable |
| Name | Filename | Custom |
| Preview | No | Yes |
| Status | ✅ Available | 🚧 Coming Soon |

## Related Files

- `src/services/vtt/mapService.js` - Upload and create functions
- `storage.rules` - Storage permissions
- `firestore.rules` - Map document permissions
- `src/components/VTT/MapEditor/MapEditor.jsx` - Full editor (disabled)
- `src/components/VTT/MapEditor/MapUploader.jsx` - Reusable uploader component

## Console Logging

Upload process logs the following for debugging:
```
Starting map upload... { fileName: "dungeon.png", campaignId: "abc123" }
Upload successful, creating map document...
Map created successfully: mapId123
```

Errors are logged with full details:
```
Upload error: Error { code: "permission-denied", message: "..." }
```
