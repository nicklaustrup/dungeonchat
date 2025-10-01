# Virtual Tabletop - Quick Start Guide

## 🚀 Getting Started

This guide will help you begin implementing the VTT system following the MVP scope.

---

## Phase 1: Map Editor Foundation (Weeks 1-2)

### Step 1: Install Dependencies

```bash
# Core VTT dependencies
npm install konva react-konva use-image

# File upload
npm install react-dropzone

# Color picker
npm install react-colorful

# Utilities
npm install uuid lodash.debounce
```

### Step 2: Set Up Firestore Schema

Create the maps collection structure in Firestore (can be done via code or Firebase Console):

```javascript
// Example: First map will create the schema automatically
campaigns/{campaignId}/maps/{mapId}
campaigns/{campaignId}/mapTokens/{mapId}/tokens/{tokenId}
```

### Step 3: Update Firestore Rules

Add these rules to `firestore.rules`:

```javascript
// Maps collection
match /campaigns/{campaignId}/maps/{mapId} {
  allow read: if request.auth != null && isCampaignMember(campaignId);
  allow create, update, delete: if request.auth != null && isCampaignDM(campaignId);
}

// Map tokens
match /campaigns/{campaignId}/mapTokens/{mapId}/tokens/{tokenId} {
  allow read: if request.auth != null && isCampaignMember(campaignId);
  allow write: if request.auth != null && isCampaignDM(campaignId);
}
```

### Step 4: Update Storage Rules

Add to `storage.rules`:

```javascript
// Campaign maps
match /campaigns/{campaignId}/maps/{mapId}/{fileName} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && 
    firestore.get(/databases/(default)/documents/campaigns/$(campaignId)).data.dmId == request.auth.uid &&
    request.resource.size < 20 * 1024 * 1024 &&
    request.resource.contentType.matches('image/.*');
}
```

### Step 5: Create Directory Structure

```bash
# Create VTT component directories
mkdir -p src/components/VTT/MapEditor
mkdir -p src/components/VTT/MapLibrary
mkdir -p src/components/VTT/Canvas
mkdir -p src/components/VTT/TokenManager
mkdir -p src/components/VTT/MapViewer

# Create service directory
mkdir -p src/services/vtt

# Create hooks directory
mkdir -p src/hooks/vtt
```

---

## Component Checklist

### Phase 1: Map Editor Foundation

- [ ] **MapEditor.jsx** - Main editor page component
- [ ] **MapUploader.jsx** - Drag-and-drop file upload
- [ ] **GridConfigurator.jsx** - Grid settings panel
- [ ] **MapCanvas.jsx** - Konva Stage with map rendering
- [ ] **GridLayer.jsx** - Grid overlay component
- [ ] **CanvasControls.jsx** - Zoom/pan controls
- [ ] **MapLibrary.jsx** - List of saved maps
- [ ] **MapCard.jsx** - Individual map preview card

**Services:**
- [ ] **mapService.js** - Map CRUD operations
- [ ] **storageService.js** - Image upload to Storage

**Hooks:**
- [ ] **useMapEditor.js** - Map editor state management
- [ ] **useCanvas.js** - Canvas zoom/pan state

### Phase 2: Token System

- [ ] **TokenManager.jsx** - Token management UI
- [ ] **TokenPalette.jsx** - Sidebar with token options
- [ ] **TokenUploader.jsx** - Upload custom token images
- [ ] **TokenSprite.jsx** - Konva Image component for tokens
- [ ] **TokenProperties.jsx** - Edit token details panel

**Services:**
- [ ] **tokenService.js** - Token CRUD operations

**Hooks:**
- [ ] **useTokens.js** - Token state management

### Phase 3: Real-Time View & Ping

- [ ] **MapViewer.jsx** - Player view component
- [ ] **PingIndicator.jsx** - Ping animation component

**Services:**
- [ ] **pingService.js** - Ping creation/listening

**Hooks:**
- [ ] **useMapSync.js** - Real-time map listener
- [ ] **useTokenSync.js** - Real-time token listener
- [ ] **usePing.js** - Ping system

### Phase 4: Integration & Polish

- [ ] **MapSelector.jsx** - Dropdown to select active map
- [ ] Update **CampaignContext.js** with map state
- [ ] Add Map Editor link to Campaign dashboard
- [ ] Quick Start guide modal

---

## Code Snippets to Get Started

### 1. Basic MapCanvas Component

```jsx
// src/components/VTT/Canvas/MapCanvas.jsx
import React, { useRef, useState } from 'react';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';

export function MapCanvas({ map, width, height, onMapClick }) {
  const stageRef = useRef(null);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  const [mapImage] = useImage(map?.imageUrl || '');

  const handleWheel = (e) => {
    e.evt.preventDefault();
    
    const scaleBy = 1.1;
    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    
    // Limit zoom
    const clampedScale = Math.max(0.5, Math.min(2, newScale));

    setStageScale(clampedScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    });
  };

  return (
    <Stage
      width={width}
      height={height}
      ref={stageRef}
      draggable
      x={stagePos.x}
      y={stagePos.y}
      scaleX={stageScale}
      scaleY={stageScale}
      onWheel={handleWheel}
      onClick={onMapClick}
    >
      {/* Background Layer */}
      <Layer>
        {mapImage && <KonvaImage image={mapImage} />}
      </Layer>
      
      {/* Grid Layer - render in GridLayer component */}
      
      {/* Token Layer - render tokens here */}
      
      {/* UI Layer - pings, cursors, etc */}
    </Stage>
  );
}
```

### 2. Map Service

```javascript
// src/services/vtt/mapService.js
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

export const mapService = {
  /**
   * Create a new map
   */
  async createMap(firestore, campaignId, mapData) {
    const mapId = uuidv4();
    const mapRef = doc(firestore, 'campaigns', campaignId, 'maps', mapId);
    
    const map = {
      mapId,
      name: mapData.name || 'Untitled Map',
      description: mapData.description || '',
      imageUrl: mapData.imageUrl || '',
      width: mapData.width || 0,
      height: mapData.height || 0,
      gridSize: mapData.gridSize || 50,
      gridColor: mapData.gridColor || '#000000',
      gridOpacity: mapData.gridOpacity || 0.3,
      gridEnabled: mapData.gridEnabled ?? true,
      createdBy: mapData.createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(mapRef, map);
    return { ...map, id: mapId };
  },

  /**
   * Get a single map
   */
  async getMap(firestore, campaignId, mapId) {
    const mapRef = doc(firestore, 'campaigns', campaignId, 'maps', mapId);
    const mapSnap = await getDoc(mapRef);
    
    if (!mapSnap.exists()) {
      throw new Error('Map not found');
    }
    
    return { id: mapSnap.id, ...mapSnap.data() };
  },

  /**
   * Get all maps for a campaign
   */
  async getMaps(firestore, campaignId) {
    const mapsRef = collection(firestore, 'campaigns', campaignId, 'maps');
    const q = query(mapsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  /**
   * Update a map
   */
  async updateMap(firestore, campaignId, mapId, updates) {
    const mapRef = doc(firestore, 'campaigns', campaignId, 'maps', mapId);
    await updateDoc(mapRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  /**
   * Delete a map
   */
  async deleteMap(firestore, campaignId, mapId) {
    const mapRef = doc(firestore, 'campaigns', campaignId, 'maps', mapId);
    await deleteDoc(mapRef);
    
    // TODO: Delete associated tokens
    // TODO: Delete Storage files
  },

  /**
   * Upload map image to Storage
   */
  async uploadMapImage(storage, file, campaignId, userId, onProgress) {
    const mapId = uuidv4();
    const ext = file.name.split('.').pop();
    const storageRef = ref(storage, `campaigns/${campaignId}/maps/${mapId}/original.${ext}`);
    
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        reject,
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Get image dimensions
          const img = new Image();
          img.src = URL.createObjectURL(file);
          await new Promise(resolve => img.onload = resolve);
          
          resolve({
            mapId,
            imageUrl: downloadURL,
            width: img.width,
            height: img.height
          });
        }
      );
    });
  }
};
```

### 3. Grid Layer Component

```jsx
// src/components/VTT/Canvas/GridLayer.jsx
import React, { useMemo } from 'react';
import { Layer, Line } from 'react-konva';

export function GridLayer({ 
  width, 
  height, 
  gridSize, 
  gridColor, 
  gridOpacity, 
  enabled 
}) {
  const lines = useMemo(() => {
    if (!enabled || !gridSize || !width || !height) return [];
    
    const gridLines = [];
    
    // Vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      gridLines.push({
        key: `v-${x}`,
        points: [x, 0, x, height]
      });
    }
    
    // Horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      gridLines.push({
        key: `h-${y}`,
        points: [0, y, width, y]
      });
    }
    
    return gridLines;
  }, [width, height, gridSize, enabled]);

  if (!enabled) return null;

  return (
    <Layer listening={false}>
      {lines.map(line => (
        <Line
          key={line.key}
          points={line.points}
          stroke={gridColor}
          strokeWidth={1}
          opacity={gridOpacity}
        />
      ))}
    </Layer>
  );
}
```

### 4. Map Uploader Component

```jsx
// src/components/VTT/MapEditor/MapUploader.jsx
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload } from 'react-icons/fi';

export function MapUploader({ onUpload, isUploading }) {
  const [preview, setPreview] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    // Upload to Firebase
    onUpload(file);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxSize: 20 * 1024 * 1024, // 20MB
    multiple: false,
    disabled: isUploading
  });

  return (
    <div
      {...getRootProps()}
      style={{
        border: '2px dashed #ccc',
        borderRadius: '8px',
        padding: '40px',
        textAlign: 'center',
        cursor: isUploading ? 'not-allowed' : 'pointer',
        backgroundColor: isDragActive ? '#f0f0f0' : '#fafafa'
      }}
    >
      <input {...getInputProps()} />
      
      {preview ? (
        <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '300px' }} />
      ) : (
        <>
          <FiUpload size={48} color="#999" />
          <p style={{ marginTop: '16px', color: '#666' }}>
            {isDragActive
              ? 'Drop the map image here...'
              : 'Drag & drop a map image here, or click to select'}
          </p>
          <p style={{ fontSize: '12px', color: '#999' }}>
            Supports JPEG, PNG, WebP (max 20MB)
          </p>
        </>
      )}
      
      {isUploading && <p style={{ marginTop: '16px', color: '#4CAF50' }}>Uploading...</p>}
    </div>
  );
}
```

---

## Testing Checklist

### Phase 1 Tests

- [ ] Upload map image successfully
- [ ] Map saved to Firestore with correct data
- [ ] Map appears in map library
- [ ] Grid renders correctly
- [ ] Grid adjustments update in real-time
- [ ] Zoom in/out works smoothly
- [ ] Pan (drag background) works
- [ ] Can load saved map into editor

### Phase 2 Tests

- [ ] Upload token image successfully
- [ ] Place token on map
- [ ] Drag token to new position
- [ ] Select token shows properties panel
- [ ] Edit token name/type
- [ ] Delete token removes from map
- [ ] Tokens save with map
- [ ] Player vs enemy tokens visually distinct

### Phase 3 Tests

- [ ] Player can view active map
- [ ] Token movements sync in real-time
- [ ] Ping appears for all users
- [ ] Ping disappears after 3 seconds
- [ ] Ping audio plays (if enabled)
- [ ] Multiple pings work correctly

---

## Common Issues & Solutions

### Issue: Map image not loading
**Solution:** Check CORS settings in Firebase Storage. Ensure Storage rules allow read access.

### Issue: Firestore permission denied
**Solution:** Verify user is campaign member. Check `isCampaignMember()` helper function exists in rules.

### Issue: Konva Stage not rendering
**Solution:** Ensure Stage has explicit width/height. Use `window.innerWidth/Height` or container dimensions.

### Issue: Drag not working
**Solution:** Make sure `draggable` prop is set to `true`. Check that `listening` is not set to `false`.

### Issue: Grid lines not visible
**Solution:** Check grid opacity > 0, gridEnabled = true, and gridColor contrasts with background.

---

## Next Steps After Phase 1

Once Phase 1 is complete:

1. **Test thoroughly** - Upload various map sizes, test grid configurations
2. **Get user feedback** - Have a DM test the editor
3. **Start Phase 2** - Begin token system implementation
4. **Update documentation** - Document any changes or discoveries

---

## Useful Resources

- **Konva.js Docs:** https://konvajs.org/docs/
- **react-konva Docs:** https://konvajs.org/docs/react/
- **Firebase Storage Docs:** https://firebase.google.com/docs/storage
- **react-dropzone Docs:** https://react-dropzone.js.org/

---

**Good luck! 🎲 Let's build an awesome VTT!**
