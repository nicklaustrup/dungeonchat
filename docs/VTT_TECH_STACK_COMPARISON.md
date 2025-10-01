# Virtual Tabletop - Tech Stack Comparison

## Canvas Rendering Libraries

### Option 1: Konva.js + react-konva (Recommended ⭐)

**What it is:**
- High-performance 2D canvas library built on HTML5 Canvas
- React bindings via `react-konva` for declarative rendering
- Event-driven architecture (click, drag, hover, etc.)

**Pros:**
- ✅ **Excellent React integration** - Declarative component model fits React perfectly
- ✅ **Built-in event handling** - Drag, click, hover work out of the box
- ✅ **Layer management** - Built-in layer system for z-index control
- ✅ **Shape library** - Pre-built shapes (Circle, Rect, Image, Line, etc.)
- ✅ **Caching & performance** - Layer caching built-in for static content
- ✅ **Active community** - Well-maintained, 10k+ GitHub stars
- ✅ **Great documentation** - Comprehensive tutorials and examples
- ✅ **TypeScript support** - Full type definitions available
- ✅ **Export capabilities** - Export canvas to image/data URL

**Cons:**
- ❌ **Learning curve** - Need to learn Konva API (but well-documented)
- ❌ **Bundle size** - ~400KB (minified), may increase load time
- ❌ **2D only** - Not suitable if you want 3D capabilities later

**Best for:** 2D virtual tabletop with drag-and-drop tokens, grid overlays, and basic shapes

**Example Code:**
```jsx
import { Stage, Layer, Image, Circle } from 'react-konva';
import useImage from 'use-image';

function MapCanvas() {
  const [mapImage] = useImage('/maps/dungeon.jpg');
  
  return (
    <Stage width={800} height={600}>
      <Layer>
        <Image image={mapImage} />
      </Layer>
      <Layer>
        <Circle x={100} y={100} radius={25} fill="red" draggable />
      </Layer>
    </Stage>
  );
}
```

**Installation:**
```bash
npm install konva react-konva
```

---

### Option 2: Fabric.js + react-fabricjs

**What it is:**
- Powerful HTML5 canvas library with rich object model
- SVG-to-canvas and canvas-to-SVG conversion
- React wrapper via community libraries (less official than react-konva)

**Pros:**
- ✅ **Rich object model** - Advanced shape manipulation, grouping, transformations
- ✅ **SVG support** - Can import/export SVG graphics
- ✅ **Text editing** - Built-in rich text editor on canvas
- ✅ **Selection system** - Multi-select with visual bounding box
- ✅ **Free drawing** - Built-in brush/pencil tools
- ✅ **Serialization** - Easy JSON export/import of canvas state

**Cons:**
- ❌ **React integration** - Less mature React bindings (no official library)
- ❌ **Steeper learning curve** - More complex API than Konva
- ❌ **Performance** - Can be slower than Konva for many objects
- ❌ **Community** - Smaller React-specific community
- ❌ **Bundle size** - Similar to Konva (~400KB)

**Best for:** Applications needing advanced vector graphics, text editing, or SVG import/export

**Example Code:**
```jsx
import { Canvas, Circle, Rect } from 'react-fabricjs';

function MapCanvas() {
  return (
    <Canvas width={800} height={600}>
      <Circle left={100} top={100} radius={50} fill="red" />
      <Rect left={200} top={200} width={100} height={100} fill="blue" />
    </Canvas>
  );
}
```

**Installation:**
```bash
npm install fabric
npm install react-fabricjs  # Community library
```

---

### Option 3: PixiJS + react-pixi

**What it is:**
- WebGL-based 2D rendering engine (falls back to Canvas)
- Extremely high performance for many objects/sprites
- React bindings via `react-pixi-fiber` or `@pixi/react`

**Pros:**
- ✅ **Best performance** - WebGL rendering, handles 1000+ sprites easily
- ✅ **Animation** - Built-in ticker for smooth animations
- ✅ **Filters & effects** - Blur, color matrix, displacement, etc.
- ✅ **Sprite system** - Optimized for game-like applications
- ✅ **Active development** - Used by many game engines

**Cons:**
- ❌ **React integration** - React bindings less mature than Konva
- ❌ **Lower-level API** - More manual work for events, layers
- ❌ **Overkill for VTT** - Optimized for games with thousands of sprites
- ❌ **Steeper learning curve** - More game-engine mindset
- ❌ **WebGL dependency** - May not work on older devices (though has Canvas fallback)

**Best for:** High-performance games, particle systems, animations with many objects

**Example Code:**
```jsx
import { Stage, Sprite } from '@pixi/react';

function MapCanvas() {
  return (
    <Stage width={800} height={600}>
      <Sprite image="/maps/dungeon.jpg" x={0} y={0} />
      <Sprite image="/tokens/warrior.png" x={100} y={100} interactive />
    </Stage>
  );
}
```

**Installation:**
```bash
npm install pixi.js @pixi/react
```

---

### Option 4: Plain HTML5 Canvas (No Library)

**What it is:**
- Use native Canvas API directly
- Full control over rendering pipeline

**Pros:**
- ✅ **Zero dependencies** - Smallest bundle size
- ✅ **Full control** - No abstraction layers
- ✅ **Maximum performance** - No library overhead

**Cons:**
- ❌ **Lots of boilerplate** - Manual event handling, hit detection
- ❌ **No React integration** - Imperative API doesn't fit React
- ❌ **Time-consuming** - Reinventing wheels (layers, dragging, etc.)
- ❌ **Harder to maintain** - More complex codebase

**Best for:** Extremely simple use cases or when bundle size is critical

**Not recommended for VTT** - Too much manual work

---

### Option 5: Three.js (3D Library)

**What it is:**
- WebGL-based 3D rendering library
- Can be used for 2D (orthographic camera)

**Pros:**
- ✅ **3D capabilities** - Future-proof if you want 3D terrain
- ✅ **Advanced lighting** - Dynamic shadows, lighting effects
- ✅ **Camera controls** - Pan, zoom, rotate built-in

**Cons:**
- ❌ **Massive overkill** - Too complex for 2D VTT
- ❌ **Large bundle** - ~600KB minimum
- ❌ **Steep learning curve** - 3D concepts (meshes, materials, lights)
- ❌ **Performance overhead** - 3D rendering for 2D content wasteful

**Best for:** 3D virtual tabletops, terrain elevation, VR/AR experiences

**Not recommended for MVP** - Save for far future if 3D becomes a requirement

---

## Comparison Matrix

| Feature | Konva.js ⭐ | Fabric.js | PixiJS | Plain Canvas | Three.js |
|---------|-----------|-----------|--------|--------------|----------|
| **React Integration** | ⭐⭐⭐⭐⭐ Official | ⭐⭐⭐ Community | ⭐⭐⭐ Community | ⭐ Manual | ⭐⭐ Manual |
| **Performance (2D)** | ⭐⭐⭐⭐ Great | ⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Best | ⭐⭐⭐⭐ Great | ⭐⭐⭐ OK |
| **Drag & Drop** | ⭐⭐⭐⭐⭐ Built-in | ⭐⭐⭐⭐ Built-in | ⭐⭐⭐ Manual | ⭐ Manual | ⭐ Manual |
| **Event Handling** | ⭐⭐⭐⭐⭐ Easy | ⭐⭐⭐⭐ Good | ⭐⭐⭐ Manual | ⭐ Manual | ⭐⭐ Manual |
| **Learning Curve** | ⭐⭐⭐⭐ Easy | ⭐⭐⭐ Moderate | ⭐⭐ Steep | ⭐ Very Steep | ⭐ Very Steep |
| **Documentation** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐ Good | ⭐⭐⭐⭐ Good | ⭐⭐⭐ MDN | ⭐⭐⭐⭐⭐ Excellent |
| **Bundle Size** | ~400KB | ~400KB | ~450KB | 0KB | ~600KB |
| **Community** | ⭐⭐⭐⭐⭐ Large | ⭐⭐⭐⭐ Good | ⭐⭐⭐⭐ Large | N/A | ⭐⭐⭐⭐⭐ Huge |
| **VTT Suitability** | ⭐⭐⭐⭐⭐ Perfect | ⭐⭐⭐⭐ Good | ⭐⭐⭐ Overkill | ⭐⭐ Too low-level | ⭐ Wrong tool |

---

## Recommendation: Konva.js + react-konva

**Why Konva.js is the best choice for your VTT:**

1. **Perfect fit for VTT requirements**
   - Grid overlays, token sprites, pings are all built-in shapes
   - Drag-and-drop is trivial with `draggable` prop
   - Layer system matches VTT architecture (background, grid, tokens, UI)

2. **React-first design**
   - Declarative components (Stage, Layer, Image, Circle, etc.)
   - State changes automatically re-render canvas
   - Easy to integrate with hooks and context

3. **Developer experience**
   - Excellent documentation with interactive examples
   - TypeScript support out of the box
   - Active community (quick answers on StackOverflow)
   - Regular updates and maintenance

4. **Performance is sufficient**
   - Handles 50-100 tokens easily (VTT typical use case)
   - Layer caching optimizes static content (map background)
   - Event delegation built-in (no manual hit detection)

5. **Future-proof**
   - Can add advanced features later (custom shapes, filters)
   - Export to image for sharing maps
   - Animations for ping effects, token movements

**Alternative if you need more:**
- If you later need 1000+ tokens or complex particle effects → **Migrate to PixiJS**
- If you later need 3D terrain or elevation → **Migrate to Three.js**

But for MVP and even post-MVP features (fog of war, drawing tools, etc.), **Konva.js is perfect**.

---

## Other Supporting Libraries

### Image Handling

**Option 1: use-image (Recommended)**
- React hook for loading images into Konva
- Handles loading state automatically
- Simple API: `const [image] = useImage(url)`

```bash
npm install use-image
```

**Option 2: Sharp (Cloud Functions)**
- Server-side image processing (resize, compress, thumbnails)
- Essential for map uploads (optimize large images)
- Already in your strategy document

```bash
npm install sharp  # In functions/ directory
```

---

### Drag & Drop (File Upload)

**Option 1: react-dropzone (Recommended)**
- Excellent drag-and-drop file upload component
- Validates file types, sizes
- Accessible (keyboard support)

```bash
npm install react-dropzone
```

**Example:**
```jsx
import { useDropzone } from 'react-dropzone';

function MapUploader() {
  const onDrop = (files) => {
    // Upload to Firebase Storage
  };
  
  const { getRootProps, getInputProps } = useDropzone({ 
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
    maxSize: 20 * 1024 * 1024  // 20MB
  });
  
  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      <p>Drag map image here, or click to select</p>
    </div>
  );
}
```

**Option 2: Native Input**
- Use HTML `<input type="file">`
- No dependencies, but less UX polish

---

### Color Picker

**Option 1: react-color (Recommended)**
- Popular color picker components
- Multiple styles (Chrome, Sketch, Photoshop, etc.)
- Simple API

```bash
npm install react-color
```

**Example:**
```jsx
import { ChromePicker } from 'react-color';

function GridConfigurator() {
  const [gridColor, setGridColor] = useState('#000000');
  
  return (
    <ChromePicker 
      color={gridColor} 
      onChange={(color) => setGridColor(color.hex)} 
    />
  );
}
```

**Option 2: react-colorful**
- Smaller bundle size (~3KB vs ~200KB for react-color)
- Fewer picker styles
- Good for simple use cases

```bash
npm install react-colorful
```

---

### Icons

**Already in use: react-icons ✅**
- You're already using this library
- Huge icon collection (Font Awesome, Material, etc.)
- Zero configuration

**Icons you'll need for VTT:**
- `FiUpload` (upload map)
- `FiGrid` (grid settings)
- `FiMove` (pan tool)
- `FiMousePointer` (select tool)
- `FiPlusCircle` (add token)
- `FiZoomIn`, `FiZoomOut` (zoom controls)
- `FiEye`, `FiEyeOff` (show/hide layers)
- `FiTarget` (ping)

---

### Utility Libraries

**uuid** - Generate unique IDs
```bash
npm install uuid
```

**lodash** - Utility functions (debounce, throttle, cloneDeep)
```bash
npm install lodash
# Or for smaller bundle:
npm install lodash.debounce lodash.throttle
```

**Example:**
```javascript
import { debounce } from 'lodash';

const saveMapChanges = debounce((mapData) => {
  mapService.updateMap(campaignId, mapId, mapData);
}, 1000);  // Save 1 second after last change
```

---

## Final Recommended Tech Stack

### Core
- **Canvas Rendering:** Konva.js + react-konva
- **Image Loading:** use-image
- **Drag & Drop Upload:** react-dropzone
- **Color Picker:** react-colorful (smaller) or react-color (more features)
- **Icons:** react-icons (already installed ✅)

### Backend
- **Firestore:** Real-time database (already set up ✅)
- **Storage:** Image hosting (already set up ✅)
- **Cloud Functions:** Image processing with Sharp

### Utilities
- **uuid:** Unique ID generation
- **lodash.debounce:** Debounce save operations
- **lodash.throttle:** Throttle cursor updates (stretch goal)

### Testing (Existing)
- **Jest:** Unit tests (already installed ✅)
- **React Testing Library:** Component tests (already installed ✅)

---

## Installation Commands

```bash
# Core VTT dependencies
npm install konva react-konva use-image

# File upload
npm install react-dropzone

# Color picker (choose one)
npm install react-colorful          # Smaller bundle
# OR
npm install react-color              # More features

# Utilities
npm install uuid
npm install lodash.debounce lodash.throttle

# Cloud Functions (in functions/ directory)
cd functions
npm install sharp
cd ..
```

**Total bundle size increase:** ~500-600KB (gzipped ~150-180KB)

---

## Performance Comparison

### Bundle Sizes (Minified + Gzipped)

| Library | Size (Minified) | Size (Gzipped) | Load Time (3G) |
|---------|-----------------|----------------|----------------|
| Konva.js | 380KB | 120KB | ~400ms |
| react-konva | 20KB | 6KB | ~20ms |
| use-image | 5KB | 2KB | ~10ms |
| react-dropzone | 40KB | 12KB | ~40ms |
| react-colorful | 6KB | 3KB | ~10ms |
| uuid | 15KB | 5KB | ~20ms |
| lodash.debounce | 10KB | 3KB | ~10ms |
| **Total** | **~476KB** | **~151KB** | **~510ms** |

**Impact:** This is reasonable for a VTT feature. Users will load once per session.

**Optimization:** Code splitting (lazy load MapEditor component only when DM accesses it)

```jsx
// App.js
const MapEditor = lazy(() => import('./components/VTT/MapEditor/MapEditor'));

// Route
<Route path="/campaign/:campaignId/map-editor" element={
  <Suspense fallback={<Loading />}>
    <MapEditor />
  </Suspense>
} />
```

---

## Alternative Lightweight Stack (If Bundle Size Critical)

If you need to minimize bundle size:

**Ultra-lightweight stack:**
- **Canvas:** PixiJS with custom React wrapper (~450KB but better performance)
- **Upload:** Native `<input type="file">` (0KB)
- **Color Picker:** Native `<input type="color">` (0KB)
- **No lodash:** Write own debounce/throttle (~20 lines of code)

**Tradeoff:** More development time, less polished UX

**Recommendation:** Stick with Konva stack. The bundle size is justified by the features and developer experience.

---

## Summary

### ✅ Recommended Final Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Stack                            │
├─────────────────────────────────────────────────────────────┤
│  Canvas:          Konva.js + react-konva                     │
│  Image Loading:   use-image                                  │
│  File Upload:     react-dropzone                             │
│  Color Picker:    react-colorful                             │
│  Icons:           react-icons (existing)                     │
│  Utilities:       uuid, lodash.debounce, lodash.throttle    │
├─────────────────────────────────────────────────────────────┤
│                    Backend Stack                             │
├─────────────────────────────────────────────────────────────┤
│  Database:        Firestore (existing)                       │
│  Storage:         Firebase Storage (existing)                │
│  Functions:       Cloud Functions + Sharp                    │
│  Real-time:       Firestore listeners (MVP)                  │
│                   + Realtime Database (stretch goal)         │
└─────────────────────────────────────────────────────────────┘
```

**Why this stack wins:**
1. ✅ Best React integration (Konva)
2. ✅ Perfect for VTT use case
3. ✅ Great developer experience
4. ✅ Excellent documentation
5. ✅ Reasonable bundle size
6. ✅ Easy to extend for post-MVP features

---

**Questions or concerns about the stack? Let's discuss!**
