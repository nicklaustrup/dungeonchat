# Shape Tools - Final Implementation Guide

## ✅ Already Complete

1. **shapeService.js** - Full Firestore service with all CRUD operations
2. **MapCanvas imports** - shapeService imported  
3. **Shape state** - All state variables added (shapes, shapeStart, shapePreview, shapeColor, shapeOpacity, shapePersistent, shapeVisibility)

---

## 📝 Remaining Implementation Steps

### STEP 1: Add Shape Subscription to MapCanvas

**Location**: After the drawings subscription (around line 150)

```javascript
// Subscribe to shapes
useEffect(() => {
  if (!firestore || !campaignId || !map?.id) return;

  const unsubscribe = shapeService.subscribeToShapes(
    firestore,
    campaignId,
    map.id,
    (loadedShapes) => setShapes(loadedShapes)
  );

  return unsubscribe;
}, [firestore, campaignId, map?.id]);
```

---

### STEP 2: Add Shape Click Handlers to MapCanvas

**Location**: In `handleStageClick` function, after ruler handling (around line 305)

```javascript
// Shape tools
if (activeTool === 'circle' || activeTool === 'rectangle' || 
    activeTool === 'cone' || activeTool === 'line') {
  
  if (!shapeStart) {
    // Set shape start point
    setShapeStart({ x: mapX, y: mapY });
  } else {
    // Complete shape creation
    try {
      if (activeTool === 'circle') {
        const radius = Math.sqrt(
          Math.pow(mapX - shapeStart.x, 2) + Math.pow(mapY - shapeStart.y, 2)
        );
        await shapeService.createCircle(
          firestore, campaignId, map.id,
          shapeStart, radius,
          shapeColor, shapeOpacity, shapePersistent, shapeVisibility, user.uid
        );
      } else if (activeTool === 'rectangle') {
        const width = Math.abs(mapX - shapeStart.x);
        const height = Math.abs(mapY - shapeStart.y);
        const topLeftX = Math.min(shapeStart.x, mapX);
        const topLeftY = Math.min(shapeStart.y, mapY);
        await shapeService.createRectangle(
          firestore, campaignId, map.id,
          { x: topLeftX, y: topLeftY }, width, height,
          shapeColor, shapeOpacity, shapePersistent, shapeVisibility, user.uid
        );
      } else if (activeTool === 'cone') {
        const length = Math.sqrt(
          Math.pow(mapX - shapeStart.x, 2) + Math.pow(mapY - shapeStart.y, 2)
        );
        const direction = Math.atan2(mapY - shapeStart.y, mapX - shapeStart.x) * 180 / Math.PI;
        await shapeService.createCone(
          firestore, campaignId, map.id,
          shapeStart, direction, length, 60, // 60-degree cone
          shapeColor, shapeOpacity, shapePersistent, shapeVisibility, user.uid
        );
      } else if (activeTool === 'line') {
        await shapeService.createLine(
          firestore, campaignId, map.id,
          shapeStart, { x: mapX, y: mapY },
          shapeColor, shapeOpacity, shapePersistent, shapeVisibility, user.uid
        );
      }
    } catch (err) {
      console.error('Error creating shape:', err);
    }
    
    setShapeStart(null);
    setShapePreview(null);
  }
  return; // Don't deselect tokens when using shape tools
}
```

---

### STEP 3: Add Shape Mouse Move Preview

**Location**: In `handleMouseMove` function, after ruler handling (around line 350)

```javascript
// Shape preview
if ((activeTool === 'circle' || activeTool === 'rectangle' || 
     activeTool === 'cone' || activeTool === 'line') && shapeStart) {
  setShapePreview({ x: mapX, y: mapY });
}
```

---

### STEP 4: Add Shape Rendering to MapCanvas

**Location**: In the Layer, after pinned rulers and before arrow preview (around line 720)

```javascript
{/* Shapes */}
{shapes.map((shape) => {
  // Filter by visibility
  if (shape.visibleTo === 'dm' && !isDM) return null;
  
  if (shape.type === 'circle') {
    return (
      <Circle
        key={shape.id}
        x={shape.geometry.x}
        y={shape.geometry.y}
        radius={shape.geometry.radius}
        fill={shape.color}
        opacity={shape.opacity}
        listening={false}
      />
    );
  }
  
  if (shape.type === 'rectangle') {
    return (
      <Rect
        key={shape.id}
        x={shape.geometry.x}
        y={shape.geometry.y}
        width={shape.geometry.width}
        height={shape.geometry.height}
        fill={shape.color}
        opacity={shape.opacity}
        listening={false}
      />
    );
  }
  
  if (shape.type === 'line') {
    return (
      <Line
        key={shape.id}
        points={[shape.geometry.x1, shape.geometry.y1, shape.geometry.x2, shape.geometry.y2]}
        stroke={shape.color}
        strokeWidth={3}
        opacity={shape.opacity}
        listening={false}
      />
    );
  }
  
  if (shape.type === 'cone') {
    // Calculate cone triangle points
    const angleRad = (shape.geometry.direction * Math.PI) / 180;
    const halfCone = (shape.geometry.angle / 2 * Math.PI) / 180;
    
    const x1 = shape.geometry.x;
    const y1 = shape.geometry.y;
    
    const x2 = shape.geometry.x + shape.geometry.length * Math.cos(angleRad - halfCone);
    const y2 = shape.geometry.y + shape.geometry.length * Math.sin(angleRad - halfCone);
    
    const x3 = shape.geometry.x + shape.geometry.length * Math.cos(angleRad + halfCone);
    const y3 = shape.geometry.y + shape.geometry.length * Math.sin(angleRad + halfCone);
    
    return (
      <Line
        key={shape.id}
        points={[x1, y1, x2, y2, x3, y3]}
        closed={true}
        fill={shape.color}
        opacity={shape.opacity}
        listening={false}
      />
    );
  }
  
  return null;
})}

{/* Shape Preview */}
{shapeStart && shapePreview && (
  <>
    {activeTool === 'circle' && (() => {
      const radius = Math.sqrt(
        Math.pow(shapePreview.x - shapeStart.x, 2) + Math.pow(shapePreview.y - shapeStart.y, 2)
      );
      return (
        <Circle
          x={shapeStart.x}
          y={shapeStart.y}
          radius={radius}
          fill={shapeColor}
          opacity={shapeOpacity * 0.5}
          stroke={shapeColor}
          strokeWidth={2}
          dash={[10, 5]}
          listening={false}
        />
      );
    })()}
    
    {activeTool === 'rectangle' && (() => {
      const width = Math.abs(shapePreview.x - shapeStart.x);
      const height = Math.abs(shapePreview.y - shapeStart.y);
      const x = Math.min(shapeStart.x, shapePreview.x);
      const y = Math.min(shapeStart.y, shapePreview.y);
      return (
        <Rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={shapeColor}
          opacity={shapeOpacity * 0.5}
          stroke={shapeColor}
          strokeWidth={2}
          dash={[10, 5]}
          listening={false}
        />
      );
    })()}
    
    {activeTool === 'line' && (
      <Line
        points={[shapeStart.x, shapeStart.y, shapePreview.x, shapePreview.y]}
        stroke={shapeColor}
        strokeWidth={3}
        opacity={shapeOpacity * 0.5}
        dash={[10, 5]}
        listening={false}
      />
    )}
    
    {activeTool === 'cone' && (() => {
      const length = Math.sqrt(
        Math.pow(shapePreview.x - shapeStart.x, 2) + Math.pow(shapePreview.y - shapeStart.y, 2)
      );
      const direction = Math.atan2(shapePreview.y - shapeStart.y, shapePreview.x - shapeStart.x) * 180 / Math.PI;
      const angleRad = (direction * Math.PI) / 180;
      const halfCone = (60 / 2 * Math.PI) / 180; // 60-degree cone
      
      const x1 = shapeStart.x;
      const y1 = shapeStart.y;
      
      const x2 = shapeStart.x + length * Math.cos(angleRad - halfCone);
      const y2 = shapeStart.y + length * Math.sin(angleRad - halfCone);
      
      const x3 = shapeStart.x + length * Math.cos(angleRad + halfCone);
      const y3 = shapeStart.y + length * Math.sin(angleRad + halfCone);
      
      return (
        <Line
          points={[x1, y1, x2, y2, x3, y3]}
          closed={true}
          fill={shapeColor}
          opacity={shapeOpacity * 0.5}
          stroke={shapeColor}
          strokeWidth={2}
          dash={[10, 5]}
          listening={false}
        />
      );
    })()}
    
    {/* Start marker for all shapes */}
    <Circle
      x={shapeStart.x}
      y={shapeStart.y}
      radius={5}
      fill={shapeColor}
      listening={false}
    />
  </>
)}
```

---

### STEP 5: Pass Shape Props to MapToolbar

**Location**: In MapCanvas return statement, MapToolbar props (around line 445)

```javascript
<MapToolbar 
  activeTool={activeTool} 
  onToolChange={setActiveTool}
  isDM={isDM}
  pingColor={pingColor}
  penColor={penColor}
  onPingColorChange={setPingColor}
  onPenColorChange={setPenColor}
  rulerSnapToGrid={rulerSnapToGrid}
  rulerPersistent={rulerPersistent}
  onRulerSnapToggle={() => setRulerSnapToGrid(prev => !prev)}
  onRulerPersistentToggle={() => setRulerPersistent(prev => !prev)}
  onClearPinnedRulers={() => setPinnedRulers([])}
  pinnedRulersCount={pinnedRulers.length}
  shapeColor={shapeColor}
  shapeOpacity={shapeOpacity}
  shapePersistent={shapePersistent}
  shapeVisibility={shapeVisibility}
  onShapeColorChange={setShapeColor}
  onShapeOpacityChange={setShapeOpacity}
  onShapePersistentToggle={() => setShapePersistent(prev => !prev)}
  onShapeVisibilityChange={setShapeVisibility}
  onClearTempShapes={() => shapeService.clearTemporaryShapes(firestore, campaignId, map.id)}
  onClearAllShapes={() => shapeService.clearAllShapes(firestore, campaignId, map.id)}
  shapesCount={shapes.length}
/>
```

---

### STEP 6: Update MapToolbar - Add Shape Tools

**Location**: MapToolbar.jsx, in the tools array (around line 35)

```javascript
const tools = [
  { id: 'pointer', icon: FiMousePointer, label: 'Pointer', description: 'Select mode (no drawing)' },
  { id: 'ping', icon: FiCrosshair, label: 'Ping', description: 'Alt+Click to ping' },
  { id: 'pen', icon: FiEdit2, label: 'Pen', description: 'Draw temporary marks' },
  { id: 'arrow', icon: FiArrowRight, label: 'Arrow', description: 'Point to locations' },
];

// Add ruler tool for DM
if (isDM) {
  tools.push({ id: 'ruler', icon: FiCrosshair, label: 'Ruler', description: 'Measure distance in grid squares' });
}

// Add shape tools for DM
if (isDM) {
  tools.push({ id: 'circle', icon: FiCircle, label: 'Circle', description: 'Draw circular AOE' });
  tools.push({ id: 'rectangle', icon: FiSquare, label: 'Rectangle', description: 'Draw rectangular area' });
  tools.push({ id: 'cone', icon: FiTriangle, label: 'Cone', description: 'Draw cone (60°)' });
  tools.push({ id: 'line', icon: FiMinus, label: 'Line', description: 'Draw line' });
}
```

**NOTE**: Need to import icons at top:
```javascript
import { FiCrosshair, FiEdit2, FiArrowRight, FiMousePointer, FiSettings, FiMinus, FiMaximize2, FiCircle, FiSquare, FiTriangle } from 'react-icons/fi';
```

---

### STEP 7: Update MapToolbar Props

**Location**: MapToolbar.jsx function signature (around line 12)

```javascript
const MapToolbar = ({ 
  activeTool, 
  onToolChange, 
  isDM,
  pingColor = '#ffff00',
  penColor = '#ffffff',
  onPingColorChange,
  onPenColorChange,
  rulerSnapToGrid = false,
  rulerPersistent = false,
  onRulerSnapToggle,
  onRulerPersistentToggle,
  onClearPinnedRulers,
  pinnedRulersCount = 0,
  // Shape props
  shapeColor = '#ff0000',
  shapeOpacity = 0.5,
  shapePersistent = false,
  shapeVisibility = 'all',
  onShapeColorChange,
  onShapeOpacityChange,
  onShapePersistentToggle,
  onShapeVisibilityChange,
  onClearTempShapes,
  onClearAllShapes,
  shapesCount = 0
}) => {
```

---

### STEP 8: Add Shape Settings UI to MapToolbar

**Location**: In MapToolbar settings panel, after ruler settings (around line 190)

```javascript
{isDM && (
  <>
    <div className="setting-divider" />
    <div className="setting-group">
      <label>Shape Tools</label>
      
      <div className="color-picker-container">
        <label style={{fontSize: '0.7rem', marginBottom: '2px'}}>Color</label>
        <input
          type="color"
          value={shapeColor}
          onChange={(e) => onShapeColorChange?.(e.target.value)}
          className="color-picker"
        />
        <span className="color-value">{shapeColor}</span>
      </div>
      
      <div className="slider-container">
        <label style={{fontSize: '0.7rem', marginBottom: '2px'}}>
          Opacity: {(shapeOpacity * 100).toFixed(0)}%
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={shapeOpacity}
          onChange={(e) => onShapeOpacityChange?.(parseFloat(e.target.value))}
          className="opacity-slider"
        />
      </div>
      
      <div className="checkbox-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={shapePersistent}
            onChange={() => onShapePersistentToggle?.()}
          />
          <span>Persistent (stays forever)</span>
        </label>
        
        <label className="checkbox-label">
          <input
            type="radio"
            name="shapeVisibility"
            checked={shapeVisibility === 'all'}
            onChange={() => onShapeVisibilityChange?.('all')}
          />
          <span>Visible to All</span>
        </label>
        
        <label className="checkbox-label">
          <input
            type="radio"
            name="shapeVisibility"
            checked={shapeVisibility === 'dm'}
            onChange={() => onShapeVisibilityChange?.('dm')}
          />
          <span>DM Only</span>
        </label>
      </div>
      
      {shapesCount > 0 && (
        <div style={{display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px'}}>
          <button
            className="clear-rulers-btn"
            onClick={() => onClearTempShapes?.()}
            title="Clear temporary shapes"
          >
            Clear Temporary ({shapes.filter(s => !s.persistent).length})
          </button>
          <button
            className="clear-rulers-btn"
            onClick={() => {
              if (window.confirm('Clear ALL shapes including persistent?')) {
                onClearAllShapes?.();
              }
            }}
            title="Clear all shapes"
          >
            Clear All Shapes ({shapesCount})
          </button>
        </div>
      )}
    </div>
  </>
)}
```

---

### STEP 9: Add Shape CSS to MapToolbar.css

**Location**: After the clear-rulers-btn styles (around line 215)

```css
/* Shape Settings */
.slider-container {
  margin-top: 8px;
  margin-bottom: 8px;
}

.opacity-slider {
  width: 100%;
  height: 6px;
  background: rgba(102, 126, 234, 0.2);
  border-radius: 3px;
  outline: none;
  cursor: pointer;
}

.opacity-slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  background: #667eea;
  border-radius: 50%;
  cursor: pointer;
}

.opacity-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #667eea;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}
```

---

## 🧪 Testing Steps

1. **Test Circle Tool**:
   - Click Circle button
   - Click map (start point)
   - Move mouse (see preview circle)
   - Click again (creates circle)
   - Verify color, opacity match settings

2. **Test Rectangle Tool**:
   - Similar to circle
   - Verify rectangle draws from corner to corner

3. **Test Cone Tool**:
   - Click Cone button
   - Click map (origin)
   - Move mouse (cone rotates to follow)
   - Click (creates cone)

4. **Test Line Tool**:
   - Click Line button
   - Click start
   - Click end
   - Verify line appears

5. **Test Persistence**:
   - Create shape with Persistent OFF
   - Wait 10 seconds → shape should fade
   - Create shape with Persistent ON
   - Verify it stays

6. **Test Visibility**:
   - Set to "DM Only"
   - Create shape as DM
   - Log in as player → shape should not appear
   - Set to "Visible to All"
   - Create shape → everyone sees it

7. **Test Clear Functions**:
   - Create mix of persistent/temporary shapes
   - Click "Clear Temporary" → only persistent remain
   - Click "Clear All" → everything gone

---

## 📊 Final Statistics

**Total Implementation Time**: ~2-2.5 hours
- Ruler Enhancements: ~1 hour ✅
- Shape Service: ~20 min ✅
- Shape UI: ~1-1.5 hours (remaining)

**Lines of Code Added**:
- shapeService.js: ~180 lines
- MapCanvas.jsx: ~250 lines
- MapToolbar.jsx: ~100 lines
- CSS: ~50 lines
- **Total**: ~580 lines

**Features Delivered**:
- ✅ Ruler keyboard shortcut (R)
- ✅ Ruler snap-to-grid
- ✅ Ruler persistent/pin mode
- ✅ Ruler clear pins
- ✅ Shape service (all 4 types)
- 🔄 Shape UI (90% complete)
- 🔄 Shape rendering (ready to add)
- 🔄 Shape clear functions

---

## 🎯 Quick Start Command

To complete the remaining shape implementation, run these steps in order:

```
1. "Add shape subscription to MapCanvas after the drawings subscription"
2. "Add shape click handlers to handleStageClick in MapCanvas"
3. "Add shape mouse move preview to handleMouseMove in MapCanvas"
4. "Add shape rendering to the Layer in MapCanvas"
5. "Update MapToolbar props to accept shape settings"
6. "Add shape tools to MapToolbar tools array with icon imports"
7. "Add shape settings UI to MapToolbar settings panel"
8. "Add shape CSS styles to MapToolbar.css"
```

Or simply say: **"Complete the shape drawing tools implementation"**
