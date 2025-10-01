# Token System Integration Guide

This guide shows how to integrate the Token System (Phase 2) with the Map Canvas.

## 🎯 Quick Integration (2-3 hours)

### Step 1: Update MapCanvas.jsx

Add token rendering and drag-and-drop support.

```jsx
import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import GridLayer from './GridLayer';
import TokenSprite from '../TokenManager/TokenSprite';
import useTokens from '../../../hooks/vtt/useTokens';
import { tokenService } from '../../../services/vtt/tokenService';
import './MapCanvas.css';

function MapCanvas({ 
  map, 
  campaignId,
  width, 
  height, 
  isDM = false,
  selectedTokenId,
  onTokenSelect,
  onMapClick,
  children 
}) {
  const stageRef = useRef(null);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  const [mapImage] = useImage(map?.imageUrl || '', 'anonymous');
  
  // Load tokens with real-time sync
  const { tokens, updateToken } = useTokens(campaignId, map?.id);

  // Handle token drag end
  const handleTokenDragEnd = async (tokenId, e) => {
    const newX = e.target.x();
    const newY = e.target.y();
    
    try {
      // Update position in Firestore
      await tokenService.updateTokenPosition(
        campaignId, 
        map.id, 
        tokenId, 
        newX, 
        newY
      );
      
      // Optimistic update
      updateToken(tokenId, { x: newX, y: newY });
    } catch (err) {
      console.error('Error updating token position:', err);
    }
  };

  // Handle token selection
  const handleTokenClick = (tokenId) => {
    if (onTokenSelect) {
      onTokenSelect(tokenId);
    }
  };

  // Handle stage click (deselect token or place new token)
  const handleStageClick = (e) => {
    // Only trigger if clicking the stage itself (not a token)
    if (e.target === e.target.getStage()) {
      if (onTokenSelect) {
        onTokenSelect(null); // Deselect token
      }
      if (onMapClick) {
        const stage = stageRef.current;
        const pointer = stage.getPointerPosition();
        
        // Convert screen coordinates to map coordinates
        const mapX = (pointer.x - stage.x()) / stage.scaleX();
        const mapY = (pointer.y - stage.y()) / stage.scaleY();
        
        onMapClick({ x: mapX, y: mapY });
      }
    }
  };

  // Zoom and pan handlers (keep existing code)
  const handleWheel = (e) => {
    // ... existing zoom code ...
  };

  return (
    <div className="map-canvas-container">
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        onWheel={handleWheel}
        draggable
        onDragEnd={handleDragEnd}
        onClick={handleStageClick}
        className="map-stage"
      >
        <Layer>
          {/* Map Image */}
          {mapImage && (
            <KonvaImage
              image={mapImage}
              width={map.width}
              height={map.height}
            />
          )}

          {/* Grid Overlay */}
          {map?.gridEnabled && (
            <GridLayer
              width={map.width}
              height={map.height}
              gridSize={map.gridSize}
              gridColor={map.gridColor}
              opacity={map.gridOpacity}
            />
          )}

          {/* Tokens */}
          {tokens.map(token => {
            // Hide tokens marked as hidden from non-DM players
            if (token.hidden && !isDM) {
              return null;
            }

            return (
              <TokenSprite
                key={token.id}
                token={token}
                selected={selectedTokenId === token.id}
                draggable={isDM} // Only DM can drag
                onClick={() => handleTokenClick(token.id)}
                onDragEnd={(e) => handleTokenDragEnd(token.id, e)}
              />
            );
          })}
        </Layer>
      </Stage>

      {/* Zoom Controls */}
      <div className="canvas-controls">
        <button onClick={handleZoomIn} title="Zoom In">
          ➕
        </button>
        <button onClick={handleZoomOut} title="Zoom Out">
          ➖
        </button>
        <button onClick={handleResetView} title="Reset View">
          🔄
        </button>
        <span className="zoom-level">{Math.round(stageScale * 100)}%</span>
      </div>
    </div>
  );
}

export default MapCanvas;
```

### Step 2: Update MapEditor.jsx

Add TokenManager panel alongside grid configurator.

```jsx
import React, { useState, useEffect, useContext } from 'react';
import { FirebaseContext } from '../../../services/FirebaseContext';
import { mapService } from '../../../services/vtt/mapService';
import MapCanvas from '../Canvas/MapCanvas';
import MapUploader from './MapUploader';
import GridConfigurator from './GridConfigurator';
import TokenManager from '../TokenManager/TokenManager';
import { FiSave, FiX } from 'react-icons/fi';
import './MapEditor.css';

function MapEditor({ campaignId, existingMap, onSave, onCancel }) {
  const { firestore, user } = useContext(FirebaseContext);
  
  // Existing state...
  const [map, setMap] = useState(null);
  const [mapName, setMapName] = useState('');
  
  // Add token-related state
  const [activePanel, setActivePanel] = useState('grid'); // 'grid' | 'tokens'
  const [selectedTokenId, setSelectedTokenId] = useState(null);

  // ... existing handlers ...

  return (
    <div className="map-editor">
      <div className="editor-header">
        <h1 className="editor-title">
          {existingMap ? 'Edit Map' : 'Create New Map'}
        </h1>
        {onCancel && (
          <button className="close-button" onClick={onCancel}>
            <FiX />
          </button>
        )}
      </div>

      <div className="editor-content">
        {/* Left Panel */}
        <div className="editor-sidebar">
          {/* Upload Section (when no map) */}
          {!map && (
            <div className="editor-section">
              <h2 className="section-title">Upload Map</h2>
              <MapUploader 
                onUpload={handleFileUpload}
                isUploading={isUploading}
              />
            </div>
          )}

          {/* Map Details */}
          {map && (
            <>
              <div className="editor-section">
                <h2 className="section-title">Map Details</h2>
                {/* ... existing map details form ... */}
              </div>

              {/* Panel Tabs */}
              <div className="editor-section">
                <div className="panel-tabs">
                  <button
                    className={`panel-tab ${activePanel === 'grid' ? 'active' : ''}`}
                    onClick={() => setActivePanel('grid')}
                  >
                    🔲 Grid
                  </button>
                  <button
                    className={`panel-tab ${activePanel === 'tokens' ? 'active' : ''}`}
                    onClick={() => setActivePanel('tokens')}
                  >
                    🎭 Tokens
                  </button>
                </div>

                {/* Grid Panel */}
                {activePanel === 'grid' && (
                  <GridConfigurator
                    gridSize={gridSize}
                    gridColor={gridColor}
                    gridOpacity={gridOpacity}
                    gridEnabled={gridEnabled}
                    onGridSizeChange={setGridSize}
                    onGridColorChange={setGridColor}
                    onGridOpacityChange={setGridOpacity}
                    onGridEnabledChange={setGridEnabled}
                  />
                )}

                {/* Token Panel */}
                {activePanel === 'tokens' && (
                  <TokenManager
                    campaignId={campaignId}
                    mapId={map.id}
                    selectedToken={selectedTokenId}
                    onTokenCreated={(token) => {
                      console.log('Token created:', token);
                      // Could auto-select the new token
                      setSelectedTokenId(token.id);
                    }}
                    onTokenUpdated={(tokenId, updates) => {
                      console.log('Token updated:', tokenId);
                    }}
                    onTokenDeleted={(tokenId) => {
                      console.log('Token deleted:', tokenId);
                      if (selectedTokenId === tokenId) {
                        setSelectedTokenId(null);
                      }
                    }}
                  />
                )}
              </div>
            </>
          )}
        </div>

        {/* Right Panel - Canvas */}
        <div className="editor-main">
          <div className="canvas-section">
            <h2 className="section-title">Preview</h2>
            <MapCanvas
              map={map ? { ...map, gridSize, gridColor, gridOpacity, gridEnabled } : null}
              campaignId={campaignId}
              width={800}
              height={600}
              isDM={true} // Editor is always DM mode
              selectedTokenId={selectedTokenId}
              onTokenSelect={setSelectedTokenId}
            />
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      {map && (
        <div className="editor-footer">
          {/* ... existing save button ... */}
        </div>
      )}
    </div>
  );
}

export default MapEditor;
```

### Step 3: Add CSS for Panel Tabs

Add to `MapEditor.css`:

```css
/* Panel Tabs */
.panel-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  border-bottom: 2px solid #3a3a4e;
}

.panel-tab {
  flex: 1;
  padding: 12px 16px;
  background: #2a2a3e;
  border: none;
  border-bottom: 3px solid transparent;
  color: #a0a0b0;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.panel-tab:hover {
  background: #323248;
  color: #ffffff;
}

.panel-tab.active {
  background: rgba(102, 126, 234, 0.1);
  border-bottom-color: #667eea;
  color: #667eea;
}
```

### Step 4: Update TokenSprite.jsx

Ensure TokenSprite handles click and drag events properly:

```jsx
// TokenSprite.jsx should already have:
const TokenSprite = ({ 
  token, 
  selected = false, 
  draggable = true, 
  onClick,
  onDragEnd 
}) => {
  const [image] = useImage(token.imageUrl || '', 'anonymous');
  
  const tokenSize = (token.size || 1) * 50; // Assuming 50px grid
  const radius = tokenSize / 2;

  return (
    <Group
      x={token.x}
      y={token.y}
      draggable={draggable}
      onClick={onClick}
      onTap={onClick}
      onDragEnd={onDragEnd}
    >
      {/* Token background circle */}
      <Circle
        radius={radius}
        fill={token.color || '#4a90e2'}
        stroke={selected ? '#f39c12' : '#000000'}
        strokeWidth={selected ? 4 : 2}
        opacity={token.hidden ? 0.5 : 1}
      />

      {/* Token image (if custom) */}
      {image && (
        <Image
          image={image}
          width={tokenSize}
          height={tokenSize}
          offsetX={radius}
          offsetY={radius}
        />
      )}

      {/* Token name label */}
      {token.name && (
        <Text
          text={token.name}
          fontSize={12}
          fill="#ffffff"
          stroke="#000000"
          strokeWidth={0.5}
          y={radius + 8}
          align="center"
          offsetX={tokenSize / 2}
        />
      )}
    </Group>
  );
};
```

## 🧪 Testing Checklist

### Basic Functionality
- [ ] Create token from palette
- [ ] Upload custom token image
- [ ] Edit token name, color, size
- [ ] Toggle token visibility (hidden)
- [ ] Delete token
- [ ] Drag token on canvas
- [ ] Select/deselect token

### Multi-User Testing
- [ ] Open map in two browsers (DM + Player)
- [ ] DM creates token → Player sees it appear
- [ ] DM moves token → Player sees movement
- [ ] DM hides token → Player stops seeing it
- [ ] DM deletes token → Player sees it disappear

### Permission Testing
- [ ] DM can create/edit/delete tokens
- [ ] DM can drag tokens
- [ ] DM can see hidden tokens
- [ ] Player can only view visible tokens
- [ ] Player cannot drag tokens
- [ ] Player cannot edit/delete tokens

### Edge Cases
- [ ] Load map with 20+ tokens (performance)
- [ ] Upload 5MB token image (limit)
- [ ] Try uploading non-image file (validation)
- [ ] Delete token with custom image (cleanup)
- [ ] Zoom in/out while dragging token
- [ ] Pan map while tokens visible

## 🎯 Quick Start Commands

```bash
# Verify all files exist
ls src/components/VTT/TokenManager/
ls src/services/vtt/
ls src/hooks/vtt/

# Check for compilation errors
npm start

# Test in browser
# 1. Navigate to campaign
# 2. Click "🗺️ Maps" tab
# 3. Open map editor
# 4. Click "🎭 Tokens" tab
# 5. Create a token
# 6. Verify it appears on canvas
```

## 📝 Common Issues & Solutions

### Issue: Tokens not appearing
**Solution:** Check that `campaignId` and `map.id` are being passed correctly to `useTokens` hook.

### Issue: Can't drag tokens
**Solution:** Verify `isDM={true}` is set on MapCanvas and `draggable={isDM}` is passed to TokenSprite.

### Issue: Hidden tokens visible to players
**Solution:** Check the filter logic in MapCanvas - should skip rendering if `token.hidden && !isDM`.

### Issue: Tokens not syncing between users
**Solution:** Verify Firestore rules are deployed and real-time listener is active in `useTokens.js`.

## 🚀 Performance Tips

1. **Limit token count:** Test with 50+ tokens, add pagination if needed
2. **Optimize images:** Compress token images before upload
3. **Debounce drag updates:** Use lodash.debounce for position updates
4. **Virtualization:** For 100+ tokens, implement viewport culling

## 📚 Related Documentation

- [Phase 2 Completion Report](./PHASE_2_COMPLETION_REPORT.md)
- [VTT MVP Scope](./VTT_MVP_SCOPE.md)
- [VTT README](./VTT_README.md)

---

**Time Estimate:** 2-3 hours for full integration  
**Difficulty:** Intermediate  
**Prerequisites:** Phase 1 complete, Firebase configured
