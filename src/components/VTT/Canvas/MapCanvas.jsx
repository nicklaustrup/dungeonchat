import React, { useRef, useState, useEffect, useContext, Fragment, useMemo, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Line, Arrow, Circle, Text as KonvaText } from 'react-konva';
import useImage from 'use-image';
import { FiMap, FiSettings } from 'react-icons/fi';
import { Keyboard, Info } from "lucide-react";
import GridLayer from './GridLayer';
import TokenSprite from '../TokenManager/TokenSprite';
import MapToolbar from './MapToolbar';
import GridConfigurator from './GridConfigurator';
import LayerManager from './LayerManager';
import AudioController from '../Audio/AudioController';
import TokenExtendedEditor from '../TokenManager/TokenExtendedEditor';
import TokenContextMenu from '../TokenManager/TokenContextMenu';
import MapContextMenu from './MapContextMenu';
import LightingLayer from './LightingLayer';
import LightingPanel from '../Lighting/LightingPanel';
// import MovementRuler from './MovementRuler'; // TODO: Wire up in Phase 1 continuation
import { initiativeService } from '../../../services/initiativeService';
import { mapService } from '../../../services/vtt/mapService';
import useTokens from '../../../hooks/vtt/useTokens';
import useCanvasTools from '../../../hooks/vtt/useCanvasTools';
import useDrawingState from '../../../hooks/vtt/useDrawingState';
import useCanvasViewport from '../../../hooks/vtt/useCanvasViewport';
import useLighting from '../../../hooks/vtt/useLighting';
// import useTokenMovement from '../../../hooks/vtt/useTokenMovement'; // TODO: Wire up in Phase 1 continuation
import { tokenService } from '../../../services/vtt/tokenService';
import { pingService } from '../../../services/vtt/pingService';
import { fogOfWarService } from '../../../services/vtt/fogOfWarService';
import { drawingService } from '../../../services/vtt/drawingService';
import { shapeService } from '../../../services/vtt/shapeService';
import { shapePreviewService } from '../../../services/vtt/shapePreviewService';
import { FirebaseContext } from '../../../services/FirebaseContext';
import { generateLightName } from '../../../utils/lightNameGenerator';
import './MapCanvas.css';

/**
 * Determine light type from preset data
 * Maps light characteristics to type names for auto-naming
 */
function determineLightType(lightData) {
  const { color, radius, flicker, animated } = lightData;
  
  // Torch: orange/warm, 40ft, flickering
  if (color === '#FF8800' && radius === 40 && flicker) {
    return 'torch';
  }
  
  // Lantern: warm orange, 30ft, steady
  if (color === '#FFB366' && radius === 30 && !flicker) {
    return 'lantern';
  }
  
  // Candle: yellow, small radius, flickering
  if (color === '#FFD700' && radius <= 15 && flicker) {
    return 'candle';
  }
  
  // Light Spell: white, 40ft, bright, steady
  if (color === '#FFFFFF' && radius === 40 && !flicker) {
    return 'lightSpell';
  }
  
  // Magical Blue: blue tones, animated
  if ((color === '#4444FF' || color.startsWith('#44')) && animated) {
    return 'magicalBlue';
  }
  
  // Magical Purple: purple tones, animated
  if ((color === '#AA44FF' || color.startsWith('#AA')) && animated) {
    return 'magicalPurple';
  }
  
  // Magical Green
  if (color.startsWith('#44') && color.includes('FF') && animated) {
    return 'magicalGreen';
  }
  
  // Magical Red
  if (color.startsWith('#FF44') && animated) {
    return 'magicalRed';
  }
  
  // Campfire: orange/red, large radius, flickering
  if ((color === '#FF6600' || color === '#FF4400') && radius >= 50 && flicker) {
    return 'campfire';
  }
  
  // Brazier: similar to campfire but smaller
  if ((color === '#FF6600' || color === '#FF8800') && radius >= 30 && radius < 50 && flicker) {
    return 'brazier';
  }
  
  // Default to custom
  return 'custom';
}

/**
 * MapCanvas Component
 * Main canvas component using Konva for rendering maps with pan and zoom
 * Now includes token rendering and interaction
 */
function MapCanvas({
  map,
  campaignId,
  width,
  height,
  isDM = false,
  selectedTokenId,
  onTokenSelect,
  onMapClick,
  fogOfWarEnabled = false,
  showFogPanel = false,
  onOpenFogPanel,
  onCloseFogPanel,
  onToggleFogEnabled,
  onRevealAll,
  onConcealAll,
  fogBrushSize = 3,
  onFogBrushSizeChange,
  fogBrushMode = 'reveal',
  onFogBrushModeChange,
  onInitializeFog,
  onShowMaps,
  onShowEncounters,
  showTokenManager = false,
  onToggleTokenManager,
  showMapLibrary = false,
  onToggleMapLibrary,
  onCenterCamera,
  children
}) {
  const { firestore, user } = useContext(FirebaseContext);
  const stageRef = useRef(null);
  const [mapImage] = useImage(map?.imageUrl || '', 'anonymous');

  // Custom hooks for organized state management
  const {
    stagePos,
    stageScale,
    isDragging,
    setStagePos,
    setStageScale,
    setIsDragging
  } = useCanvasViewport({ minScale: 0.2, maxScale: 5, scaleBy: 1.05 });

  const {
    activeTool,
    pingColor,
    penColor,
    shapeColor,
    shapeOpacity,
    shapePersistent,
    shapeVisibility,
    setActiveTool,
    setPingColor,
    setPenColor,
    setShapeColor,
    setShapeOpacity,
    setShapePersistent,
    setShapeVisibility
  } = useCanvasTools('pointer'); // Set default tool to pointer

  const {
    drawings,
    isDrawing,
    currentDrawing,
    arrowStart,
    shapes,
    shapeStart,
    shapePreview,
    setDrawings,
    setShapes,
    setIsDrawing,
    setCurrentDrawing,
    setArrowStart,
    setShapeStart,
    setShapePreview
  } = useDrawingState();

  // Load tokens with real-time sync
  const { tokens, updateToken } = useTokens(campaignId, map?.id);

  // Load lighting system
  const {
    lights,
    globalLighting,
    createLight,
    updateLight,
    deleteLight,
    updateGlobalLighting
  } = useLighting(firestore, campaignId, map?.id, map?.lighting);

  // Ping state
  const [pings, setPings] = useState([]);

  // Shape preview state (for seeing other users' previews)
  const [otherUsersPreviews, setOtherUsersPreviews] = useState([]);

  // Fog of War state
  const [fogData, setFogData] = useState(null);
  const [isFogBrushing, setIsFogBrushing] = useState(false); // Track if actively painting fog
  const [fogBrushActive, setFogBrushActive] = useState(false); // Track if fog brush tool is enabled
  const [lastFogCell, setLastFogCell] = useState(null); // Track last painted cell to avoid redundant updates

  // Ruler state
  const [rulerStart, setRulerStart] = useState(null);
  const [rulerEnd, setRulerEnd] = useState(null);
  const [snapToGrid, setSnapToGrid] = useState(false); // global snap
  const [rulerPersistent, setRulerPersistent] = useState(false);
  const [pinnedRulers, setPinnedRulers] = useState([]); // Array of pinned measurements
  const [rulerColor, setRulerColor] = useState('#00ff00'); // Default green ruler

  // Token-specific snapping toggle & drag highlight footprint
  const [tokenSnap, setTokenSnap] = useState(true);
  const [tokenSnapHighlight, setTokenSnapHighlight] = useState(null); // {x,y,w,h}
  const [tokenSnapPulse, setTokenSnapPulse] = useState(0); // animation ticker for highlight pulse
  // Token movement tracking (for ruler and validation) - TODO: Wire up in Phase 1 continuation
  // const [draggingToken, setDraggingToken] = useState(null); // { tokenId, startPos, currentPos }
  const [showGridConfig, setShowGridConfig] = useState(false);
  const [contextMenu, setContextMenu] = useState(null); // { tokenId, x, y }
  const [mapContextMenu, setMapContextMenu] = useState(null); // { x, y }
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [layerVisibility, setLayerVisibility] = useState({ grid: true, fog: true, tokens: true, shapes: true, drawings: true, pings: true, rulers: true });
  // Undo/Redo state (future enhancement)
  // const [undoStack, setUndoStack] = useState([]);
  // const [redoStack, setRedoStack] = useState([]);
  const [showLayerManager, setShowLayerManager] = useState(false);
  const [showAudio, setShowAudio] = useState(false);
  const [showTokenEditor, setShowTokenEditor] = useState(false);
  const [showFXLibrary, setShowFXLibrary] = useState(false);
  const [showLightingPanel, setShowLightingPanel] = useState(false);
  // Player view mode - local state for canvas
  const [localPlayerViewMode, setLocalPlayerViewMode] = useState(false);
  // Light placement state
  const [placingLight, setPlacingLight] = useState(null); // Light data to be placed
  const [lightPreviewPos, setLightPreviewPos] = useState(null); // { x, y } for preview
  // Light dragging state
  const [draggingLight, setDraggingLight] = useState(null); // { id, light data, currentPos }
  // Light selection state
  const [selectedLightId, setSelectedLightId] = useState(null);
  // Local optimistic map state for immediate grid visual response
  const [mapLive, setMapLive] = useState(map);
  useEffect(() => { setMapLive(map); }, [map]);
  const gMap = mapLive || map;

  // Animation state for shape fade-out
  const [animationTime, setAnimationTime] = useState(Date.now());

  // Performance optimization: Memoize filtered shapes
  const visibleShapes = useMemo(() => {
    return shapes.filter(s => (s.visibleTo === 'all') || isDM);
  }, [shapes, isDM]);

  // Performance optimization: Memoize player tokens for fog reveal
  const playerTokens = useMemo(() => {
    return tokens ? tokens.filter(t => t.type === 'pc' && !t.staged && t.position) : [];
  }, [tokens]);

  // Generate natural light for player tokens during dark ambience
  const playerTokenLights = useMemo(() => {
    if (!globalLighting?.enabled || !playerTokens.length) return [];

    // Only add natural light if ambient is low (dark environment)
    const ambientLight = globalLighting.ambientLight || 0.7;
    if (ambientLight > 0.4) return []; // Bright enough, no need for token lights

    // Create natural light sources for each player token
    return playerTokens
      .filter(token => token.position && typeof token.position.x === 'number' && typeof token.position.y === 'number')
      .map((token, index) => ({
        id: `player-light-${token.id}`,
        position: {
          x: token.position.x,
          y: token.position.y
        },
        radius: 120, // Natural vision radius (~24ft at 5ft/square)
        intensity: 0.5, // Subtle natural light
        color: '#ffe6cc', // Warm candlelight color
        flicker: false, // No flicker for natural vision
        enabled: true,
        name: `${token.name} Vision`
      }));
  }, [playerTokens, globalLighting]);

  // Animate token snap highlight while dragging
  useEffect(() => {
    if (!tokenSnapHighlight) return; // only animate while active
    let frameId;
    const animate = (t) => {
      setTokenSnapPulse(t);
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [tokenSnapHighlight]);

  // Close FX Library dropdown when clicking outside
  useEffect(() => {
    if (!showFXLibrary) return;

    const handleClickOutside = (e) => {
      // Check if click is outside the FX Library dropdown
      const fxLibraryElement = document.querySelector('[data-fx-library]');
      if (fxLibraryElement && !fxLibraryElement.contains(e.target)) {
        setShowFXLibrary(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFXLibrary]);

  // Handle light deletion from context menu
  useEffect(() => {
    const handleDeleteLight = (e) => {
      const lightId = e.detail;
      if (window.confirm('Delete this light source?')) {
        deleteLight(lightId).catch(error => {
          console.error('Error deleting light:', error);
        });
      }
    };

    window.addEventListener('deleteLight', handleDeleteLight);
    return () => window.removeEventListener('deleteLight', handleDeleteLight);
  }, [deleteLight]);

  // Helper to optionally snap any point to grid when global snap is enabled
  const maybeSnapPoint = useCallback((pt) => {
    if (snapToGrid && gMap?.gridSize) {
      const g = gMap.gridSize;
      const offsetX = gMap.gridOffsetX || 0;
      const offsetY = gMap.gridOffsetY || 0;
      // Adjust point by removing offset, snap to grid, then add offset back
      const adjustedX = pt.x - offsetX;
      const adjustedY = pt.y - offsetY;
      const snappedX = Math.round(adjustedX / g) * g + offsetX;
      const snappedY = Math.round(adjustedY / g) * g + offsetY;
      return { x: snappedX, y: snappedY };
    }
    return pt;
  }, [snapToGrid, gMap?.gridSize, gMap?.gridOffsetX, gMap?.gridOffsetY]);

  // Helper to snap point to nearest token center if within threshold
  const snapToTokenCenter = useCallback((pt, snapThreshold = 30) => {
    if (!tokens || tokens.length === 0) return pt;

    let closestToken = null;
    let minDistance = snapThreshold;

    // Find closest token center within threshold
    tokens.forEach(token => {
      const tokenCenter = {
        x: token.position.x,
        y: token.position.y
      };

      const dx = pt.x - tokenCenter.x;
      const dy = pt.y - tokenCenter.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minDistance) {
        minDistance = distance;
        closestToken = tokenCenter;
      }
    });

    // Return snapped position if found, otherwise original
    return closestToken || pt;
  }, [tokens]);

  // Combined snap function: first try token snap, then grid snap
  const smartSnapPoint = useCallback((pt) => {
    // Try token snapping first (for targeting)
    const tokenSnapped = snapToTokenCenter(pt);
    if (tokenSnapped !== pt) return tokenSnapped;

    // Fall back to grid snapping if enabled
    return maybeSnapPoint(pt);
  }, [snapToTokenCenter, maybeSnapPoint]);

  // Clamp a token center position so the token stays fully on the map
  const clampTokenCenter = useCallback((pos, token) => {
    if (!gMap) return pos;
    const w = gMap.width || 0;
    const h = gMap.height || 0;
    const tw = token?.size?.width || gMap.gridSize || 50;
    const th = token?.size?.height || gMap.gridSize || 50;
    const halfW = tw / 2;
    const halfH = th / 2;
    return {
      x: Math.min(Math.max(pos.x, halfW), Math.max(halfW, w - halfW)),
      y: Math.min(Math.max(pos.y, halfH), Math.max(halfH, h - halfH))
    };
  }, [gMap]);

  // Check if a point is within map boundaries
  const isPointInMapBounds = useCallback((pos) => {
    if (!gMap) return true; // If no map loaded, allow by default
    const w = gMap.width || 0;
    const h = gMap.height || 0;
    return pos.x >= 0 && pos.x <= w && pos.y >= 0 && pos.y <= h;
  }, [gMap]);

  // Timeout refs for unfinished shapes/drawings
  const shapeTimeoutRef = useRef(null);
  const rulerTimeoutRef = useRef(null);
  const arrowTimeoutRef = useRef(null);

  // Auto-clear unfinished shapes after 30 seconds
  useEffect(() => {
    if (shapeStart) {
      // Clear any existing timeout
      if (shapeTimeoutRef.current) {
        clearTimeout(shapeTimeoutRef.current);
      }
      // Set new timeout
      shapeTimeoutRef.current = setTimeout(() => {
        setShapeStart(null);
        setShapePreview(null);
        console.log('Shape drawing cancelled due to inactivity');
      }, 30000); // 30 seconds
    } else {
      // Clear timeout when shape is completed or cancelled
      if (shapeTimeoutRef.current) {
        clearTimeout(shapeTimeoutRef.current);
        shapeTimeoutRef.current = null;
      }
    }
    return () => {
      if (shapeTimeoutRef.current) {
        clearTimeout(shapeTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shapeStart]);

  // Auto-clear unfinished ruler after 30 seconds
  useEffect(() => {
    if (rulerStart) {
      if (rulerTimeoutRef.current) {
        clearTimeout(rulerTimeoutRef.current);
      }
      rulerTimeoutRef.current = setTimeout(() => {
        setRulerStart(null);
        setRulerEnd(null);
        console.log('Ruler measurement cancelled due to inactivity');
      }, 30000);
    } else {
      if (rulerTimeoutRef.current) {
        clearTimeout(rulerTimeoutRef.current);
        rulerTimeoutRef.current = null;
      }
    }
    return () => {
      if (rulerTimeoutRef.current) {
        clearTimeout(rulerTimeoutRef.current);
      }
    };
  }, [rulerStart]);

  // Auto-clear unfinished arrow after 30 seconds
  useEffect(() => {
    if (arrowStart) {
      if (arrowTimeoutRef.current) {
        clearTimeout(arrowTimeoutRef.current);
      }
      arrowTimeoutRef.current = setTimeout(() => {
        setArrowStart(null);
        console.log('Arrow drawing cancelled due to inactivity');
      }, 30000);
    } else {
      if (arrowTimeoutRef.current) {
        clearTimeout(arrowTimeoutRef.current);
        arrowTimeoutRef.current = null;
      }
    }
    return () => {
      if (arrowTimeoutRef.current) {
        clearTimeout(arrowTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrowStart]);

  // Keyboard shortcut handler (R ruler, G grid, S snap, T token snap, Ctrl+Z undo, Ctrl+Shift+Z redo)
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Only for DM
      if (!isDM) return;

      // R key to toggle ruler tool
      if (e.key === 'r' || e.key === 'R') {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        e.preventDefault();
        setActiveTool(prev => prev === 'ruler' ? 'pointer' : 'ruler');
      }

      // ESC key to clear ruler or close context menu
      if (e.key === 'Escape') {
        if (contextMenu) {
          setContextMenu(null);
          return;
        }
        if (mapContextMenu) {
          setMapContextMenu(null);
          return;
        }
        if (activeTool === 'ruler') {
          setRulerStart(null);
          setRulerEnd(null);
        }
      }

      // Grid toggle G
      if (e.key === 'g' || e.key === 'G') {
        if (gMap?.id) {
          const next = !gMap.gridEnabled;
          setMapLive(m => m ? { ...m, gridEnabled: next } : m);
          mapService.updateMap(firestore, campaignId, gMap.id, { gridEnabled: next }).catch(() => { });
        }
      }
      // Global snap S
      if (e.key === 's' || e.key === 'S') {
        setSnapToGrid(prev => !prev);
      }
      // Token snap T
      if (e.key === 't' || e.key === 'T') {
        setTokenSnap(prev => !prev);
      }
      // Undo/Redo - Disabled (future enhancement)
      // TODO: Re-enable when undo/redo stack is implemented
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDM, activeTool, contextMenu, mapContextMenu, gMap, firestore, campaignId]);

  // Reset position and scale when map changes
  useEffect(() => {
    if (map) {
      setStagePos({ x: 0, y: 0 });
      setStageScale(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gMap?.id]);

  // Subscribe to pings
  useEffect(() => {
    if (!firestore || !campaignId || !map?.id) return;

    const unsubscribe = pingService.subscribeToPings(firestore, campaignId, map.id, (newPings) => {
      setPings(newPings);
    });

    return () => unsubscribe();
  }, [firestore, campaignId, map?.id]);

  // Subscribe to fog of war (always listen, even when disabled)
  useEffect(() => {
    if (!firestore || !campaignId || !map?.id) return;

    console.log('Setting up fog subscription for map:', map.id);

    const unsubscribe = fogOfWarService.subscribeFogOfWar(firestore, campaignId, map.id, (data) => {
      setFogData(data);
    });

    return () => {
      console.log('Unsubscribing from fog');
      unsubscribe();
    };
  }, [firestore, campaignId, map?.id]);

  // Enable fog brush when fog panel is open and fog is enabled
  useEffect(() => {
    const shouldActivate = isDM && showFogPanel && fogOfWarEnabled && fogData?.enabled;
    console.log('[FOG BRUSH] Brush active state:', shouldActivate, '(panel:', showFogPanel, 'enabled:', fogOfWarEnabled, 'fogData:', !!fogData, ')');
    setFogBrushActive(shouldActivate);
    
    // Reset brushing state when deactivated
    if (!shouldActivate) {
      setIsFogBrushing(false);
      setLastFogCell(null);
    }
  }, [isDM, showFogPanel, fogOfWarEnabled, fogData]);

  // Subscribe to drawings
  useEffect(() => {
    if (!firestore || !campaignId || !map?.id) return;

    const unsubscribe = drawingService.subscribeToDrawings(firestore, campaignId, map.id, (newDrawings) => {
      setDrawings(newDrawings);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firestore, campaignId, map?.id]);

  // Subscribe to shapes
  useEffect(() => {
    if (!firestore || !campaignId || !map?.id) return;
    const unsubscribe = shapeService.subscribeToShapes(
      firestore,
      campaignId,
      map.id,
      (loadedShapes) => setShapes(loadedShapes)
    );
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firestore, campaignId, map?.id]);

  // Animation loop for shape fade-out
  useEffect(() => {
    const nonPersistentShapes = shapes.filter(s => !s.persistent);
    if (nonPersistentShapes.length === 0) return;

    let frameId;
    const animate = () => {
      setAnimationTime(Date.now());
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, [shapes]);

  // Auto-cleanup fully faded shapes
  useEffect(() => {
    if (!firestore || !campaignId || !map?.id || !isDM) return;

    const fadeStart = 3000;
    const fadeDuration = 2000;
    const now = Date.now();

    shapes.filter(s => !s.persistent).forEach(shape => {
      const createdAt = shape.createdAt?.toDate ? shape.createdAt.toDate() : new Date();
      const age = now - createdAt.getTime();

      // Delete if fully faded
      if (age > fadeStart + fadeDuration) {
        shapeService.deleteShape(firestore, campaignId, map.id, shape.id)
          .catch(err => console.error('Error auto-cleaning faded shape:', err));
      }
    });
  }, [animationTime, shapes, firestore, campaignId, map?.id, isDM]);

  // Reveal fog around all player tokens when tokens or fog data changes
  useEffect(() => {
    if (!firestore || !campaignId || !gMap?.id || !fogOfWarEnabled || !fogData?.enabled || !playerTokens.length) return;

    const revealAroundPlayerTokens = async () => {
      try {
        const offsetX = map.gridOffsetX || 0;
        const offsetY = map.gridOffsetY || 0;
        // Reveal fog around each player token
        for (const token of playerTokens) {
          // Adjust for grid offset before calculating cell position
          const adjustedX = token.position.x - offsetX;
          const adjustedY = token.position.y - offsetY;
          // Add 1 to account for padding cell (fog grid has 1 extra cell on each side)
          const gridX = Math.floor(adjustedX / map.gridSize) + 1;
          const gridY = Math.floor(adjustedY / map.gridSize) + 1;

          // Check if player has a light source (torch/lantern) nearby
          const hasNearbyLight = lights.some(light => {
            if (!light.position) return false;
            const dx = light.position.x - token.position.x;
            const dy = light.position.y - token.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance < 30; // Within 30 pixels = carrying the light
          });

          // Base reveal radius is 3, increase to 5 if carrying a light (torch)
          const revealRadius = hasNearbyLight ? 5 : 3;
          await fogOfWarService.revealArea(firestore, campaignId, map.id, gridX, gridY, revealRadius);
        }
      } catch (error) {
        console.error('Error revealing fog around player tokens:', error);
      }
    };

    revealAroundPlayerTokens();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firestore, campaignId, gMap?.id, fogOfWarEnabled, fogData?.enabled, playerTokens.length, lights.length, map.gridSize, map.id]);

  // Reveal fog around light sources when lights or fog data changes
  useEffect(() => {
    if (!firestore || !campaignId || !gMap?.id || !fogOfWarEnabled || !fogData?.enabled || !lights.length) return;

    const revealAroundLights = async () => {
      try {
        const offsetX = map.gridOffsetX || 0;
        const offsetY = map.gridOffsetY || 0;
        // Reveal fog around each light source
        for (const light of lights) {
          if (!light.position) continue;
          // Adjust for grid offset before calculating cell position
          const adjustedX = light.position.x - offsetX;
          const adjustedY = light.position.y - offsetY;
          // Add 1 to account for padding cell (fog grid has 1 extra cell on each side)
          const gridX = Math.floor(adjustedX / map.gridSize) + 1;
          const gridY = Math.floor(adjustedY / map.gridSize) + 1;
          // Calculate reveal radius based on light radius (convert pixels to grid cells)
          const revealRadius = Math.ceil((light.radius || 40) / map.gridSize);
          await fogOfWarService.revealArea(firestore, campaignId, map.id, gridX, gridY, revealRadius);
        }
      } catch (error) {
        console.error('Error revealing fog around lights:', error);
      }
    };

    revealAroundLights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firestore, campaignId, gMap?.id, fogOfWarEnabled, fogData?.enabled, JSON.stringify(lights.map(l => ({ x: l.position?.x, y: l.position?.y, r: l.radius }))), map.gridSize, map.id]);

  // Force re-render for fade animations (drawings)
  useEffect(() => {
    if (drawings.length === 0) return;

    const interval = setInterval(() => {
      // Force re-render to update opacity calculations
      setDrawings(prev => [...prev]);
    }, 100); // Update every 100ms for smooth fading

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawings.length]);

  // Force re-render for ping animations
  useEffect(() => {
    if (pings.length === 0) return;

    const interval = setInterval(() => {
      // Force re-render to update ping opacity/color calculations
      setPings(prev => [...prev]);
    }, 50); // Update every 50ms for smooth ping animation

    return () => clearInterval(interval);
  }, [pings.length]);

  // Subscribe to other users' shape previews for real-time feedback
  useEffect(() => {
    if (!firestore || !campaignId || !gMap?.id || !user?.uid) return;

    const unsubscribe = shapePreviewService.subscribeToShapePreviews(
      firestore,
      campaignId,
      gMap.id,
      user.uid,
      (previews) => {
        setOtherUsersPreviews(previews);
      }
    );

    return () => {
      unsubscribe();
      // Clear own preview on unmount
      shapePreviewService.clearPreview(firestore, campaignId, gMap.id, user.uid)
        .catch(err => console.debug('Error clearing preview on unmount:', err));
    };
  }, [firestore, campaignId, gMap?.id, user?.uid]);

  // Clear shape preview when tool changes
  useEffect(() => {
    if (!firestore || !campaignId || !gMap?.id || !user?.uid) return;
    if (!['circle', 'rectangle', 'cone', 'line'].includes(activeTool)) {
      shapePreviewService.clearPreview(firestore, campaignId, gMap.id, user.uid)
        .catch(err => console.debug('Error clearing preview:', err));
    }
  }, [activeTool, firestore, campaignId, gMap?.id, user?.uid]);

  const handleWheel = (e) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    // Calculate zoom
    const scaleBy = 1.05;
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

    // Limit zoom range
    const minScale = 0.25;
    const maxScale = 3;
    const clampedScale = Math.max(minScale, Math.min(maxScale, newScale));

    // Calculate new position to zoom towards pointer
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };

    setStageScale(clampedScale);
    setStagePos(newPos);
  };

  const handleDragEnd = (e) => {
    setStagePos({
      x: e.target.x(),
      y: e.target.y(),
    });
    setIsDragging(false);
  };

  const handleStageClick = async (e) => {
    // Only trigger click if we're clicking the stage itself (not a shape)
    if (e.target === e.target.getStage()) {
      const stage = stageRef.current;
      const pointer = stage.getPointerPosition();

      // Convert screen coordinates to map coordinates
      const mapX = (pointer.x - stage.x()) / stage.scaleX();
      const mapY = (pointer.y - stage.y()) / stage.scaleY();

      // Alt/Option + Click = Create Ping (regardless of active tool)
      if (e.evt.altKey) {
        try {
          await pingService.createPing(firestore, campaignId, map.id, {
            x: mapX,
            y: mapY,
            userId: user.uid,
            userName: user.displayName || 'Unknown',
            color: pingColor // Use custom ping color
          });
        } catch (err) {
          console.error('Error creating ping:', err);
        }
        return; // Don't handle other tools if Alt was pressed
      }

      // Handle based on active tool
      if (activeTool === 'arrow') {
        if (!arrowStart && e.evt.button !== 2) {
          const snappedPoint = maybeSnapPoint({ x: mapX, y: mapY });
          if (isPointInMapBounds(snappedPoint)) {
            setArrowStart(snappedPoint);
          } else {
            console.log('Cannot start arrow outside map bounds');
          }
        } else if (arrowStart && e.evt.button !== 2) {
          try {
            const end = maybeSnapPoint({ x: mapX, y: mapY });
            if (isPointInMapBounds(end)) {
              await drawingService.createArrow(firestore, campaignId, map.id, arrowStart, end, '#ffff00', user.uid);
              setArrowStart(null);
            } else {
              console.log('Cannot end arrow outside map bounds');
              // Still clear the arrow start to prevent stuck state
              setArrowStart(null);
            }
          } catch (err) {
            console.error('Error creating arrow:', err);
          }
        }
      } else if (activeTool === 'ruler') {
        // Only process left-clicks for ruler tool
        if (e.evt.button === 2) {
          return; // Ignore right-clicks
        }

        const gridSize = map?.gridSize || 50;
        const offsetX = map?.gridOffsetX || 0;
        const offsetY = map?.gridOffsetY || 0;
        let startX = mapX;
        let startY = mapY;
        let endX = mapX;
        let endY = mapY;

        // Snap to grid if enabled
        if (snapToGrid) {
          const adjustedX = mapX - offsetX;
          const adjustedY = mapY - offsetY;
          startX = Math.round(adjustedX / gridSize) * gridSize + offsetX;
          startY = Math.round(adjustedY / gridSize) * gridSize + offsetY;
          endX = Math.round(adjustedX / gridSize) * gridSize + offsetX;
          endY = Math.round(adjustedY / gridSize) * gridSize + offsetY;
        }

        if (!rulerStart) {
          // Set ruler start point only if within bounds
          const startPoint = { x: startX, y: startY };
          if (isPointInMapBounds(startPoint)) {
            setRulerStart(startPoint);
            setRulerEnd(startPoint);
          } else {
            console.log('Cannot start ruler outside map bounds');
          }
        } else {
          // Complete measurement - check if end point is valid
          const endPoint = { x: endX, y: endY };
          if (isPointInMapBounds(endPoint)) {
            if (rulerPersistent) {
              // Pin the measurement
              setPinnedRulers(prev => [
                ...prev,
                {
                  id: Date.now(),
                  start: rulerStart,
                  end: endPoint
                }
              ]);
            }
          } else {
            console.log('Cannot end ruler outside map bounds');
          }
          // Always clear ruler state on second click
          setRulerStart(null);
          setRulerEnd(null);
        }
        return; // Don't deselect tokens when using ruler
      } else if (activeTool === 'placeLight' && isDM && placingLight) {
        // Only process left-clicks for placing lights
        if (e.evt.button === 2) {
          return; // Ignore right-clicks
        }
        // Place the light at clicked position
        const position = smartSnapPoint({ x: mapX, y: mapY });
        
        // Determine light type from preset data
        const lightType = determineLightType(placingLight);
        
        // Generate auto-name for the light
        const lightName = generateLightName(lightType, lights);
        
        console.log(`Placing light: ${lightName} (type: ${lightType})`);
        
        // Create the light with auto-generated name
        createLight({
          ...placingLight,
          position,
          name: lightName,
          type: lightType
        }).then(() => {
          setPlacingLight(null);
          setLightPreviewPos(null);
          setActiveTool('pointer');
        }).catch(error => {
          console.error('Error placing light:', error);
        });
        return;
      } else if (['circle', 'rectangle', 'cone', 'line'].includes(activeTool)) {
        if (!shapeStart && e.evt.button !== 2) {
          const snappedPoint = smartSnapPoint({ x: mapX, y: mapY });
          if (isPointInMapBounds(snappedPoint)) {
            setShapeStart(snappedPoint);
          } else {
            console.log('Cannot start shape outside map bounds');
          }
        } else if (shapeStart && e.evt.button !== 2) {
          const snappedEnd = maybeSnapPoint({ x: mapX, y: mapY });
          if (!isPointInMapBounds(snappedEnd)) {
            console.log('Cannot end shape outside map bounds');
            // Clear the shape start to prevent stuck state
            setShapeStart(null);
            setShapePreview(null);
            return;
          }
          const end = snappedEnd;
          try {
            if (activeTool === 'circle') {
              const dx = end.x - shapeStart.x;
              const dy = end.y - shapeStart.y;
              const radius = Math.sqrt(dx * dx + dy * dy);
              await shapeService.createCircle(firestore, campaignId, map.id, shapeStart, radius, shapeColor, shapeOpacity, shapePersistent, shapeVisibility, user?.uid);
              // TODO: Undo/redo for shape creation (future enhancement)
            } else if (activeTool === 'rectangle') {
              await shapeService.createRectangle(firestore, campaignId, map.id, shapeStart, end.x - shapeStart.x, end.y - shapeStart.y, shapeColor, shapeOpacity, shapePersistent, shapeVisibility, user?.uid);
              // TODO: Undo/redo for shape creation (future enhancement)
            } else if (activeTool === 'cone') {
              const dx = end.x - shapeStart.x;
              const dy = end.y - shapeStart.y;
              const length = Math.sqrt(dx * dx + dy * dy);
              const direction = (Math.atan2(dy, dx) * 180) / Math.PI;
              await shapeService.createCone(firestore, campaignId, map.id, shapeStart, direction, length, 60, shapeColor, shapeOpacity, shapePersistent, shapeVisibility, user?.uid);
              // TODO: Undo/redo for shape creation (future enhancement)
            } else if (activeTool === 'line') {
              await shapeService.createLine(firestore, campaignId, map.id, shapeStart, end, shapeColor, shapeOpacity, shapePersistent, shapeVisibility, user?.uid);
              // TODO: Undo/redo for shape creation (future enhancement)
            }
          } catch (err) {
            console.error('Error creating shape:', err);
          } finally {
            setShapeStart(null);
            setShapePreview(null);
          }
        }
        return; // Prevent token deselect
      }

      // Deselect token
      if (onTokenSelect) {
        onTokenSelect(null);
      }

      // Trigger map click handler
      if (onMapClick) {
        onMapClick({ x: mapX, y: mapY });
      }
    }
  };

  // Paint fog at pointer position with brush size
  const paintFogAtPointer = useCallback(async (e) => {
    if (!map || !fogData) return;

    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    const mapX = (pointer.x - stage.x()) / stage.scaleX();
    const mapY = (pointer.y - stage.y()) / stage.scaleY();

    const gridSize = map.gridSize || 50;
    const offsetX = map.gridOffsetX || 0;
    const offsetY = map.gridOffsetY || 0;

    // Calculate grid cell position
    const adjustedX = mapX - offsetX;
    const adjustedY = mapY - offsetY;
    // Add 1 to account for padding cell (fog grid has 1 extra cell on each side)
    const centerGridX = Math.floor(adjustedX / gridSize) + 1;
    const centerGridY = Math.floor(adjustedY / gridSize) + 1;

    // Skip if we just painted this cell
    const cellKey = `${centerGridX},${centerGridY}`;
    if (lastFogCell === cellKey) {
      return;
    }
    setLastFogCell(cellKey);

    console.log('[FOG BRUSH] Painting at grid cell:', centerGridX, centerGridY, 'with brush size:', fogBrushSize, 'mode:', fogBrushMode);

    try {
      const { visibility, gridWidth, gridHeight } = fogData;
      const newVisibility = visibility.map(row => [...row]);

      // Determine what value to set based on brush mode
      const revealValue = fogBrushMode === 'reveal';

      // Paint in circular area based on brush size
      const radius = Math.floor(fogBrushSize / 2);
      let cellsChanged = 0;

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance <= radius) {
            const gridX = centerGridX + dx;
            const gridY = centerGridY + dy;

            // Check bounds
            if (gridY >= 0 && gridY < gridHeight && gridX >= 0 && gridX < gridWidth) {
              if (newVisibility[gridY][gridX] !== revealValue) {
                newVisibility[gridY][gridX] = revealValue;
                cellsChanged++;
              }
            }
          }
        }
      }

      if (cellsChanged > 0) {
        console.log('[FOG BRUSH] Updated', cellsChanged, 'cells');
        await fogOfWarService.updateFogOfWar(firestore, campaignId, map.id, newVisibility);
      }
    } catch (err) {
      console.error('[FOG BRUSH] Error painting fog:', err);
    }
  }, [map, fogData, fogBrushSize, fogBrushMode, firestore, campaignId, lastFogCell]);

  const handleMouseDown = (e) => {
    // Fog brush painting
    if (fogBrushActive && isDM && fogOfWarEnabled && fogData?.enabled && e.target === e.target.getStage()) {
      console.log('[FOG BRUSH] Mouse down - starting fog brush painting');
      if (e.evt.button === 2) {
        return; // Ignore right-clicks
      }
      setIsFogBrushing(true);
      paintFogAtPointer(e);
      return;
    }

    if (activeTool === 'pen' && e.target === e.target.getStage()) {
      // Only process left-clicks for pen tool
      if (e.evt.button === 2) {
        return; // Ignore right-clicks
      }
      const stage = stageRef.current;
      const pointer = stage.getPointerPosition();
      const mapX = (pointer.x - stage.x()) / stage.scaleX();
      const mapY = (pointer.y - stage.y()) / stage.scaleY();

      // Check if starting point is within map bounds
      if (isPointInMapBounds({ x: mapX, y: mapY })) {
        setIsDrawing(true);
        setCurrentDrawing([mapX, mapY]);
      } else {
        console.log('Cannot start drawing outside map bounds');
      }
    }
  };

  const handleMouseMove = (e) => {
    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    const mapX = (pointer.x - stage.x()) / stage.scaleX();
    const mapY = (pointer.y - stage.y()) / stage.scaleY();

    // Fog brush painting while dragging
    if (isFogBrushing && fogBrushActive && isDM && fogOfWarEnabled && fogData?.enabled) {
      paintFogAtPointer(e);
      return;
    }

    if (activeTool === 'placeLight' && placingLight) {
      // Update light preview position
      const previewPos = maybeSnapPoint({ x: mapX, y: mapY });
      setLightPreviewPos(previewPos);
    } else if (activeTool === 'pen' && isDrawing) {
      setCurrentDrawing(prev => [...prev, mapX, mapY]);
    } else if (activeTool === 'ruler' && rulerStart) {
      // Update ruler end point while dragging
      const gridSize = map?.gridSize || 50;
      const offsetX = map?.gridOffsetX || 0;
      const offsetY = map?.gridOffsetY || 0;
      let endX = mapX;
      let endY = mapY;

      // Snap to grid if enabled
      if (snapToGrid) {
        const adjustedX = mapX - offsetX;
        const adjustedY = mapY - offsetY;
        endX = Math.round(adjustedX / gridSize) * gridSize + offsetX;
        endY = Math.round(adjustedY / gridSize) * gridSize + offsetY;
      }

      setRulerEnd({ x: endX, y: endY });
    } else if (['circle', 'rectangle', 'cone', 'line'].includes(activeTool) && shapeStart) {
      const snappedEnd = smartSnapPoint({ x: mapX, y: mapY });
      // Only show preview if end point would be valid
      if (!isPointInMapBounds(snappedEnd)) {
        setShapePreview(null);
        return;
      }
      const end = snappedEnd;
      let preview = null;

      if (activeTool === 'circle') {
        const dx = end.x - shapeStart.x;
        const dy = end.y - shapeStart.y;
        const radius = Math.sqrt(dx * dx + dy * dy);
        preview = { type: 'circle', geometry: { x: shapeStart.x, y: shapeStart.y, radius }, color: shapeColor, opacity: shapeOpacity * 0.5 };
      } else if (activeTool === 'rectangle') {
        preview = { type: 'rectangle', geometry: { x: shapeStart.x, y: shapeStart.y, width: end.x - shapeStart.x, height: end.y - shapeStart.y }, color: shapeColor, opacity: shapeOpacity * 0.5 };
      } else if (activeTool === 'cone') {
        const dx = end.x - shapeStart.x;
        const dy = end.y - shapeStart.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const direction = (Math.atan2(dy, dx) * 180) / Math.PI;
        preview = { type: 'cone', geometry: { x: shapeStart.x, y: shapeStart.y, direction, length, angle: 60 }, color: shapeColor, opacity: shapeOpacity * 0.5 };
      } else if (activeTool === 'line') {
        preview = { type: 'line', geometry: { x1: shapeStart.x, y1: shapeStart.y, x2: end.x, y2: end.y }, color: shapeColor, opacity: shapeOpacity * 0.5 };
      }

      if (preview) {
        setShapePreview(preview);

        // Broadcast preview to other users
        if (user?.uid && user?.displayName && firestore && campaignId && gMap?.id) {
          shapePreviewService.updateShapePreview(
            firestore,
            campaignId,
            gMap.id,
            user.uid,
            user.displayName,
            preview
          ).catch(err => console.debug('Error updating shape preview:', err));
        }
      }
    }
  };

  const handleMouseUp = async () => {
    // Stop fog brushing
    if (isFogBrushing) {
      console.log('[FOG BRUSH] Mouse up - stopping fog brush painting');
      setIsFogBrushing(false);
      setLastFogCell(null);
      return;
    }

    if (activeTool === 'pen' && isDrawing && currentDrawing.length > 0) {
      try {
        // Convert flat array to points array
        const points = [];
        for (let i = 0; i < currentDrawing.length; i += 2) {
          points.push({ x: currentDrawing[i], y: currentDrawing[i + 1] });
        }
        await drawingService.createPenStroke(firestore, campaignId, map.id, points, penColor, user.uid); // Use custom pen color
      } catch (err) {
        console.error('Error creating pen stroke:', err);
      }
      setIsDrawing(false);
      setCurrentDrawing([]);
    }
  };

  // Handle token drag end
  const handleTokenDragEnd = useCallback(async (tokenId, newPosition) => {
    try {
      const token = tokens.find(t => t.id === tokenId);
      // TODO: Track beforePos for undo/redo (future enhancement)
      // Apply snap if enabled
      let finalPos = newPosition;
      if (snapToGrid && map?.gridSize) {
        const g = map.gridSize;
        const offsetX = map.gridOffsetX || 0;
        const offsetY = map.gridOffsetY || 0;
        // Adjust for offset, snap to grid, then add offset back
        const adjustedX = newPosition.x - offsetX;
        const adjustedY = newPosition.y - offsetY;
        const cellX = Math.floor(adjustedX / g);
        const cellY = Math.floor(adjustedY / g);
        finalPos = { x: cellX * g + g / 2 + offsetX, y: cellY * g + g / 2 + offsetY };
      }
      // Clamp to map bounds
      finalPos = clampTokenCenter(finalPos, token);
      await tokenService.updateTokenPosition(firestore, campaignId, map.id, tokenId, finalPos);
      updateToken(tokenId, { position: finalPos });
      // Undo/redo disabled for token moves (future enhancement)
      if (fogOfWarEnabled && fogData?.enabled && map.gridEnabled) {
        if (token && token.type === 'pc') {
          const offsetX = map.gridOffsetX || 0;
          const offsetY = map.gridOffsetY || 0;
          const adjustedX = finalPos.x - offsetX;
          const adjustedY = finalPos.y - offsetY;
          // Add 1 to account for padding cell (fog grid has 1 extra cell on each side)
          const gridX = Math.floor(adjustedX / map.gridSize) + 1;
          const gridY = Math.floor(adjustedY / map.gridSize) + 1;
          await fogOfWarService.revealArea(firestore, campaignId, map.id, gridX, gridY, 3);
        }
      }
    } catch (err) {
      console.error('Error updating token position:', err);
    }
  }, [tokens, snapToGrid, map?.gridSize, map?.gridOffsetX, map?.gridOffsetY, map?.id, map?.gridEnabled, clampTokenCenter, firestore, campaignId, updateToken, fogOfWarEnabled, fogData?.enabled]);

  // Handle token selection
  const handleTokenClick = useCallback((tokenId, e) => {
    // Don't select tokens when using drawing tools (ruler, pen, arrow, shapes)
    if (activeTool !== 'pointer') {
      if (e && e.cancelBubble !== undefined) {
        e.cancelBubble = true; // Prevent stage click
      }
      return; // Click-through when using tools
    }

    if (e && e.cancelBubble !== undefined) {
      e.cancelBubble = true; // Prevent stage click
    }
    if (onTokenSelect) {
      onTokenSelect(tokenId);
    }
  }, [activeTool, onTokenSelect]);

  const handleZoomIn = useCallback(() => {
    const newScale = Math.min(stageScale * 1.2, 3);
    setStageScale(newScale);
  }, [stageScale, setStageScale]);

  const handleZoomOut = useCallback(() => {
    const newScale = Math.max(stageScale / 1.2, 0.25);
    setStageScale(newScale);
  }, [stageScale, setStageScale]);

  const handleResetView = useCallback(() => {
    setStageScale(1);
    setStagePos({ x: 0, y: 0 });
  }, [setStageScale, setStagePos]);

  // Handle camera centering on specific coordinates
  const handleCenterCamera = useCallback((x, y) => {
    const stage = stageRef.current;
    if (!stage) {
      console.warn('Cannot center camera: stage ref not available');
      return;
    }

    // Calculate position to center viewport on (x, y)
    const newPos = {
      x: width / 2 - x * stageScale,
      y: height / 2 - y * stageScale
    };

    setStagePos(newPos);
    console.log(`Centered camera on (${Math.round(x)}, ${Math.round(y)})`);
  }, [width, height, stageScale, setStagePos]);

  // Expose camera centering to parent if callback provided
  useEffect(() => {
    if (onCenterCamera && typeof onCenterCamera === 'object' && onCenterCamera.current !== undefined) {
      onCenterCamera.current = handleCenterCamera;
      console.log('Camera center function assigned to ref');
    }
  }, [onCenterCamera, handleCenterCamera]);

  // Handle light selection
  const handleLightClick = useCallback((lightId) => {
    console.log('Light clicked:', lightId);
    setSelectedLightId(prevId => prevId === lightId ? null : lightId);
    // Deselect token when light is selected
    if (onTokenSelect) {
      onTokenSelect(null);
    }
  }, [onTokenSelect]);

  // Handle drag-and-drop of tokens from Token Manager onto canvas
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    if (!isDM) return; // Only DM can create tokens this way

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));

      // Check if this is a token type being dragged (not a staged token)
      if (data.fromTokenType) {
        // Get drop position relative to canvas
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left - stagePos.x) / stageScale;
        const y = (e.clientY - rect.top - stagePos.y) / stageScale;

        // Auto-increment token name if multiple of same type exist
        const existingTokens = tokens.filter(t => t.type === data.type);
        const number = existingTokens.length + 1;
        const tokenName = number > 1 ? `${data.name} ${number}` : data.name;

        // Create token at drop position
        const pixelSize = data.size * 50;
        await tokenService.createToken(firestore, campaignId, map.id, {
          name: tokenName,
          type: data.type,
          color: data.color,
          size: { width: pixelSize, height: pixelSize },
          position: { x, y },
          hp: data.hp,
          maxHp: data.maxHp,
          hidden: false,
          staged: false, // Place directly on map
          createdBy: user.uid,
          createdAt: new Date()
        });

        console.log(`[MapCanvas] Created ${data.type} token: ${tokenName} at (${Math.round(x)}, ${Math.round(y)})`);
      } else if (data.id || data.tokenId) {
        // Handle staged token being dragged onto map
        const tokenId = data.id || data.tokenId;

        // Get drop position relative to canvas
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left - stagePos.x) / stageScale;
        const y = (e.clientY - rect.top - stagePos.y) / stageScale;

        // Update token position and unstage it
        await tokenService.updateToken(firestore, campaignId, map.id, tokenId, {
          position: { x, y },
          staged: false
        });

        console.log(`[MapCanvas] Placed staged token ${data.name} at (${Math.round(x)}, ${Math.round(y)})`);
      }
    } catch (err) {
      console.error('[MapCanvas] Failed to handle token drop:', err);
    }
  }, [isDM, stagePos, stageScale, tokens, firestore, campaignId, map, user]);

  if (!gMap) {
    return (
      <div className="map-canvas-empty" style={{ width, height }}>
        <p>No map loaded. Upload a map to get started.</p>
      </div>
    );
  }

  return (
    <div
      className="map-canvas-container"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Map Toolbar */}
      <MapToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        isDM={isDM}
        pingColor={pingColor}
        penColor={penColor}
        rulerColor={rulerColor}
        onPingColorChange={setPingColor}
        onPenColorChange={setPenColor}
        onRulerColorChange={setRulerColor}
        snapToGrid={snapToGrid}
        rulerPersistent={rulerPersistent}
        onRulerSnapToggle={() => setSnapToGrid(prev => !prev)}
        onRulerPersistentToggle={() => setRulerPersistent(prev => !prev)}
        onClearPinnedRulers={() => setPinnedRulers([])}
        pinnedRulersCount={pinnedRulers.length}
        tokenSnap={tokenSnap}
        onTokenSnapToggle={() => setTokenSnap(prev => !prev)}
        onOpenGridConfig={() => setShowGridConfig(true)}
        showKeyboardShortcuts={false}
        shapeColor={shapeColor}
        shapeOpacity={shapeOpacity}
        shapePersistent={shapePersistent}
        shapeVisibility={shapeVisibility}
        // Grid configuration props
        map={gMap}
        onGridUpdate={async (updates) => {
          setMapLive(m => m ? { ...m, ...updates } : m);
          try {
            await mapService.updateMap(firestore, campaignId, gMap.id, updates);
          } catch (e) { console.error('Failed to update grid settings', e); }
        }}
        // Fog-related props
        fogOfWarEnabled={fogOfWarEnabled}
        onToggleFogEnabled={onToggleFogEnabled}
        onRevealAll={onRevealAll}
        onConcealAll={onConcealAll}
        onInitializeFog={onInitializeFog}
        showFogPanel={showFogPanel}
        onOpenFogPanel={onOpenFogPanel}
        onCloseFogPanel={onCloseFogPanel}
        fogBrushSize={fogBrushSize}
        onFogBrushSizeChange={onFogBrushSizeChange}
        fogBrushMode={fogBrushMode}
        onFogBrushModeChange={onFogBrushModeChange}
        onShapeColorChange={setShapeColor}
        onShapeOpacityChange={setShapeOpacity}
        onShapePersistentToggle={() => setShapePersistent(prev => !prev)}
        onShapeVisibilityChange={setShapeVisibility}
        onClearTempShapes={async () => {
          try {
            // snapshot current temporary shapes for undo
            const temp = shapes.filter(s => !s.persistent).map(s => ({ ...s }));
            if (!temp.length) return;
            await shapeService.clearTemporaryShapes(firestore, campaignId, map.id);
            // setUndoStack(u => [...u, { undo: () => shapeService.restoreShapes(firestore, campaignId, map.id, temp), redo: () => shapeService.clearTemporaryShapes(firestore, campaignId, map.id) }]);
          } catch (err) { console.error('Error clearing temp shapes:', err); }
        }}
        onClearAllShapes={async () => {
          if (!window.confirm('Clear ALL shapes (including persistent)?')) return;
          try {
            const all = shapes.map(s => ({ ...s }));
            if (!all.length) return;
            await shapeService.clearAllShapes(firestore, campaignId, map.id);
            // setUndoStack(u => [...u, { undo: () => shapeService.restoreShapes(firestore, campaignId, map.id, all), redo: () => shapeService.clearAllShapes(firestore, campaignId, map.id) }]);
          } catch (err) { console.error('Error clearing all shapes:', err); }
        }}
      />

      {/* Canvas Control Buttons Container */}
      {isDM && (
        <div className="canvas-controls-top" style={{
          position: 'absolute',
          top: 20,
          left: 220,
          zIndex: 999999,
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
          <button
            className="canvas-control-btn"
            style={{ background: '#2d2d35', color: '#ddd', border: '1px solid #444', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 12 }}
            onClick={() => setShowLayerManager(v => !v)}
            title="Toggle Layer Manager"
          >Layers</button>

          <button
            className="canvas-control-btn"
            style={{ background: showMapLibrary ? '#667eea' : '#2d2d35', color: '#ddd', border: '1px solid #444', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: '4px' }}
            onClick={onToggleMapLibrary}
            title="Map Library"
          >
            <FiMap size={14} /> Library
          </button>

          {onShowMaps && (
            <button
              className="canvas-control-btn"
              style={{ background: '#2d2d35', color: '#ddd', border: '1px solid #444', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 12 }}
              onClick={onShowMaps}
              title="Map Queue"
            >
              <FiMap size={14} style={{ marginRight: '4px' }} /> Maps
            </button>
          )}

          {onShowEncounters && (
            <button
              className="canvas-control-btn"
              style={{ background: '#2d2d35', color: '#ddd', border: '1px solid #444', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 12 }}
              onClick={onShowEncounters}
              title="Encounter Builder"
            >
              <FiSettings size={14} style={{ marginRight: '4px' }} /> Encounters
            </button>
          )}

          <button
            className="canvas-control-btn"
            style={{ background: localPlayerViewMode ? '#667eea' : '#2d2d35', color: '#ddd', border: '1px solid #444', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: '4px' }}
            onClick={() => setLocalPlayerViewMode(v => !v)}
            title={localPlayerViewMode ? 'Exit Player View (Return to DM View)' : 'Preview Player View (Hide hidden tokens)'}
          >
            👁️ {localPlayerViewMode ? 'DM View' : 'Player View'}
          </button>

          {onToggleTokenManager && (
            <button
              className="canvas-control-btn"
              style={{ background: showTokenManager ? '#667eea' : '#2d2d35', color: '#ddd', border: '1px solid #444', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={onToggleTokenManager}
              title="Token Manager"
            >
              🎭 Tokens
            </button>
          )}

          <button
            className="canvas-control-btn"
            style={{ background: '#2d2d35', color: '#ddd', border: '1px solid #444', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: '4px' }}
            onClick={() => setShowFXLibrary(v => !v)}
            title="FX Library - Lighting, Weather, Ambience"
          >
            ✨ FX Library
            <span style={{ fontSize: 10, marginLeft: 2 }}>{showFXLibrary ? '▲' : '▼'}</span>
          </button>
        </div>
      )}
      {isDM && showFXLibrary && (
        <div style={{ position: 'absolute', top: 60, left: 220, zIndex: 999998 }} data-fx-library>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            background: '#2d2d35',
            border: '1px solid #444',
            borderRadius: 6,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            minWidth: 180,
            overflow: 'hidden',
            zIndex: 140
          }}>
            <button
              style={{
                width: '100%',
                background: showLightingPanel ? '#3a3a45' : 'transparent',
                color: '#ddd',
                border: 'none',
                padding: '10px 12px',
                cursor: 'pointer',
                fontSize: 12,
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background 0.2s'
              }}
              onClick={() => {
                setShowLightingPanel(v => !v);
                // Keep dropdown open for multiple selections
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#3a3a45'}
              onMouseLeave={(e) => e.currentTarget.style.background = showLightingPanel ? '#3a3a45' : 'transparent'}
              title="Dynamic Lighting System"
            >
              <span style={{ fontSize: 14 }}>💡</span>
              <span>Lighting</span>
              {showLightingPanel && <span style={{ marginLeft: 'auto', fontSize: 10 }}>●</span>}
            </button>
            <button
              style={{
                width: '100%',
                background: showAudio ? '#3a3a45' : 'transparent',
                color: '#ddd',
                border: 'none',
                padding: '10px 12px',
                cursor: 'pointer',
                fontSize: 12,
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background 0.2s'
              }}
              onClick={() => {
                setShowAudio(v => !v);
                // Keep dropdown open for multiple selections
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#3a3a45'}
              onMouseLeave={(e) => e.currentTarget.style.background = showAudio ? '#3a3a45' : 'transparent'}
              title="Ambient Audio & Music"
            >
              <span style={{ fontSize: 14 }}>🎵</span>
              <span>Audio</span>
              {showAudio && <span style={{ marginLeft: 'auto', fontSize: 10 }}>●</span>}
            </button>
            <button
              style={{
                width: '100%',
                background: 'transparent',
                color: '#888',
                border: 'none',
                padding: '10px 12px',
                cursor: 'not-allowed',
                fontSize: 12,
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              disabled
              title="Weather Effects - Coming Soon"
            >
              <span style={{ fontSize: 14 }}>🌧️</span>
              <span>Weather</span>
              <span style={{ marginLeft: 'auto', fontSize: 9, opacity: 0.6 }}>Soon</span>
            </button>
            <button
              style={{
                width: '100%',
                background: 'transparent',
                color: '#888',
                border: 'none',
                padding: '10px 12px',
                cursor: 'not-allowed',
                fontSize: 12,
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              disabled
              title="Ambience Effects - Coming Soon"
            >
              <span style={{ fontSize: 14 }}>✨</span>
              <span>Ambience</span>
              <span style={{ marginLeft: 'auto', fontSize: 9, opacity: 0.6 }}>Soon</span>
            </button>
          </div>
        </div>
      )}

      <Stage
        ref={stageRef}
        width={width}
        height={height}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        onWheel={handleWheel}
        onDragEnd={handleDragEnd}
        onDragStart={() => setIsDragging(true)}
        onClick={handleStageClick}
        onTap={handleStageClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={(e) => {
          // Only show map context menu if right-clicking on empty space (not on a token)
          const target = e.target;
          // Check if we clicked on the stage itself or background layer elements (not tokens/lights)
          if (target.constructor.name === 'Stage' || target.nodeType === 'Stage' ||
            target.className === 'Image' || (target.className === 'Rect' && target.attrs.id !== 'token')) {
            e.evt.preventDefault();
            const rect = e.currentTarget.container().getBoundingClientRect();
            setMapContextMenu({
              x: e.evt.clientX - rect.left,
              y: e.evt.clientY - rect.top
            });
          }
        }}
        draggable={activeTool === 'pointer' && !fogBrushActive}
        style={{
          cursor: fogBrushActive ? (fogBrushMode === 'reveal' ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${Math.min(fogBrushSize * 8, 48)}' height='${Math.min(fogBrushSize * 8, 48)}' viewBox='0 0 24 24' fill='none' stroke='%23FFD700' stroke-width='2'%3E%3Ccircle cx='12' cy='12' r='10' opacity='0.5'/%3E%3Cpath d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z'/%3E%3Ccircle cx='12' cy='12' r='3'/%3E%3C/svg%3E") ${Math.min(fogBrushSize * 4, 24)} ${Math.min(fogBrushSize * 4, 24)}, crosshair` : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${Math.min(fogBrushSize * 8, 48)}' height='${Math.min(fogBrushSize * 8, 48)}' viewBox='0 0 24 24' fill='none' stroke='%2366B3FF' stroke-width='2'%3E%3Ccircle cx='12' cy='12' r='10' opacity='0.5'/%3E%3Cpath d='M3 3l18 18M21 3L3 21'/%3E%3C/svg%3E") ${Math.min(fogBrushSize * 4, 24)} ${Math.min(fogBrushSize * 4, 24)}, crosshair`) :
            activeTool === 'pointer' ? (isDragging ? 'grabbing' : 'grab') :
            activeTool === 'pen' ? 'crosshair' :
            activeTool === 'arrow' ? (arrowStart ? 'crosshair' : 'cell') :
            activeTool === 'ruler' ? 'crosshair' :
            ['circle', 'rectangle', 'cone', 'line'].includes(activeTool) ? 'cell' :
            isDragging ? 'grabbing' : 'default'
        }}
      >
        {/* Background Layer - includes map image and token snap highlight */}
        <Layer>
          {mapImage && (
            <KonvaImage
              image={mapImage}
              width={gMap.width}
              height={gMap.height}
              listening={false}
            />
          )}

          {/* Token snap highlight (shows target footprint while dragging) */}
          {gMap.gridEnabled && tokenSnap && tokenSnapHighlight && (() => {
            // Pulse parameters
            const periodMs = 900; // full cycle
            const phase = (tokenSnapPulse % periodMs) / periodMs; // 0..1
            const sine = Math.sin(phase * Math.PI * 2); // -1..1
            const intensity = 0.45 + (sine * 0.25); // 0.2 range
            const strokeWidth = 2 + (sine + 1) * 1.5; // 2..5
            const glow = 8 + (sine + 1) * 6; // 8..20
            return (
              <Rect
                x={tokenSnapHighlight.x}
                y={tokenSnapHighlight.y}
                width={tokenSnapHighlight.w}
                height={tokenSnapHighlight.h}
                stroke="#ffffff"
                strokeWidth={strokeWidth}
                cornerRadius={4}
                fill={`rgba(255,255,255,${intensity * 0.35})`}
                listening={false}
                shadowColor="#ffffff"
                shadowBlur={glow}
                shadowOpacity={0.9}
                opacity={0.95}
              />
            );
          })()}
        </Layer>

        {/* Grid Layer */}
        {gMap.gridEnabled && layerVisibility.grid && (
          <GridLayer
            width={gMap.width}
            height={gMap.height}
            gridSize={gMap.gridSize}
            gridColor={gMap.gridColor}
            gridOpacity={gMap.gridOpacity}
            enabled={gMap.gridEnabled}
            offsetX={gMap.gridOffsetX || 0}
            offsetY={gMap.gridOffsetY || 0}
          />
        )}

        {/* Lighting Layer - renders BEFORE tokens so lights don't overlap token ghosts */}
        {lights && globalLighting && (
          <LightingLayer
            lights={[...lights, ...playerTokenLights].filter(light =>
              light &&
              light.position &&
              typeof light.position.x === 'number' &&
              typeof light.position.y === 'number' &&
              typeof light.radius === 'number'
            )}
            globalLighting={globalLighting}
            mapWidth={gMap?.width || width}
            mapHeight={gMap?.height || height}
            selectedLightId={selectedLightId}
            onLightClick={handleLightClick}
            isDM={isDM}
          />
        )}

        {/* Token Layer */}
        {layerVisibility.tokens && <Layer>
          {tokens && tokens.map(token => {
            // Skip staged tokens (they're in EncounterBuilder)
            if (token.staged) {
              return null;
            }
            // Hide tokens marked as hidden from non-DM players
            // Also hide from DMs when in player view mode
            if (token.hidden && (!isDM || localPlayerViewMode)) {
              return null;
            }

            return (
              <TokenSprite
                key={token.id}
                token={token}
                isSelected={selectedTokenId === token.id}
                isDraggable={(isDM || token.ownerId === user?.uid || token.createdBy === user?.uid) && activeTool === 'pointer'}
                onClick={handleTokenClick}
                onDragEnd={handleTokenDragEnd}
                tokenSnap={tokenSnap}
                gridSize={map?.gridSize}
                gridOffsetX={map?.gridOffsetX || 0}
                gridOffsetY={map?.gridOffsetY || 0}
                mapWidth={gMap?.width || width}
                mapHeight={gMap?.height || height}
                onDragMovePreview={(data) => setTokenSnapHighlight(data)}
                listening={activeTool === 'pointer'}
                showGhost={false}
                onContextMenu={(evt) => {
                  evt.cancelBubble = true;
                  const raw = evt.evt;
                  setContextMenu({ tokenId: token.id, x: raw.clientX, y: raw.clientY });
                }}
              />
            );
          })}

          {/* player fog moved to be a top-level layer after LightingLayer */}

          {/* Light Control Markers - visible to all, draggable for DMs */}
          {globalLighting.enabled && lights.map(light => (
            <React.Fragment key={`light-control-${light.id}`}>
              {/* Light center marker */}
              <Circle
                x={light.position.x}
                y={light.position.y}
                radius={6}
                fill={light.color || '#FF8800'}
                stroke="white"
                strokeWidth={2}
                opacity={0.9}
                draggable={isDM && activeTool === 'pointer'}
                onDragStart={(e) => {
                  e.cancelBubble = true; // Prevent map from shifting
                  setDraggingLight({
                    id: light.id,
                    light: light,
                    currentPos: { x: e.target.x(), y: e.target.y() }
                  });
                }}
                onDragMove={(e) => {
                  e.cancelBubble = true; // Prevent map from shifting
                  const rawPos = { x: e.target.x(), y: e.target.y() };
                  const snappedPos = maybeSnapPoint(rawPos);
                  // Apply snap to visual position during drag
                  e.target.x(snappedPos.x);
                  e.target.y(snappedPos.y);
                  setDraggingLight(prev => prev ? {
                    ...prev,
                    currentPos: snappedPos
                  } : null);
                }}
                onDragEnd={(e) => {
                  e.cancelBubble = true; // Prevent map from shifting
                  const newPos = maybeSnapPoint({ x: e.target.x(), y: e.target.y() });
                  updateLight(light.id, { position: newPos });
                  setDraggingLight(null);
                }}
                onMouseEnter={(e) => {
                  if (isDM) {
                    e.target.getStage().container().style.cursor = 'move';
                  }
                }}
                onMouseLeave={(e) => {
                  if (isDM) {
                    e.target.getStage().container().style.cursor = 'default';
                  }
                }}
                onClick={(e) => {
                  if (e.evt.button === 2) { // Right click
                    e.cancelBubble = true;
                    e.evt.preventDefault();
                  }
                }}
                onContextMenu={(e) => {
                  if (!isDM) return; // Only DMs can delete lights
                  e.cancelBubble = true;
                  const stage = e.target.getStage();
                  const pos = stage.getPointerPosition();

                  // Show custom context menu
                  const menu = document.createElement('div');
                  menu.style.position = 'fixed';
                  menu.style.left = pos.x + 'px';
                  menu.style.top = pos.y + 'px';
                  menu.style.background = '#2a2a3e';
                  menu.style.border = '1px solid #444';
                  menu.style.borderRadius = '8px';
                  menu.style.padding = '8px 0';
                  menu.style.zIndex = '10000';
                  menu.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                  menu.style.minWidth = '150px';
                  menu.innerHTML = `
                    <div style="padding: 8px 16px; cursor: pointer; color: #e0e0f0; font-size: 14px;" onmouseover="this.style.background='#3a3a4e'" onmouseout="this.style.background='transparent'" onclick="window.dispatchEvent(new CustomEvent('deleteLight', { detail: '${light.id}' })); this.parentElement.remove();">
                      🗑️ Delete Light
                    </div>
                  `;
                  document.body.appendChild(menu);

                  // Remove menu on next click
                  const removeMenu = () => {
                    menu.remove();
                    document.removeEventListener('click', removeMenu);
                  };
                  setTimeout(() => document.addEventListener('click', removeMenu), 100);
                }}
                shadowColor={light.color || '#FF8800'}
                shadowBlur={10}
                shadowOpacity={0.8}
              />
              {/* Light icon overlay */}
              <Circle
                x={light.position.x}
                y={light.position.y}
                radius={3}
                fill="white"
                opacity={0.9}
                listening={false}
              />
            </React.Fragment>
          ))}
        </Layer>}

        {/* Fog of War Layer for players - rendered after tokens and lighting so it occludes tokens */}
        {!isDM && fogData?.enabled && layerVisibility.fog && (() => {
          const offsetX = gMap.gridOffsetX || 0;
          const offsetY = gMap.gridOffsetY || 0;
          return (
            <Layer>
              {fogData.visibility && fogData.visibility.map((row, y) =>
                row.map((isVisible, x) => {
                  // Subtract 1 to account for padding cell (fog grid has 1 extra cell on each side)
                  const cellX = (x - 1) * gMap.gridSize + offsetX;
                  const cellY = (y - 1) * gMap.gridSize + offsetY;
                  if (cellX >= gMap.width || cellY >= gMap.height) return null;
                  if (!isVisible) {
                    return (
                      <Rect
                        key={`fog-${x}-${y}`}
                        x={cellX}
                        y={cellY}
                        width={gMap.gridSize}
                        height={gMap.gridSize}
                        fill="black"
                        opacity={0.98}
                        stroke="#0a0a0a"
                        strokeWidth={0.5}
                        listening={false}
                        shadowColor="black"
                        shadowBlur={5}
                        shadowOpacity={0.9}
                      />
                    );
                  }
                  return null;
                })
              )}
            </Layer>
          );
        })()}

        {/* Fog of War Layer for DM (above lighting to show explored areas) */}
        {isDM && !localPlayerViewMode && fogData?.enabled && layerVisibility.fog && (() => {
          const offsetX = gMap.gridOffsetX || 0;
          const offsetY = gMap.gridOffsetY || 0;
          return (
            <Layer>
              {fogData.visibility && fogData.visibility.map((row, y) =>
                row.map((isVisible, x) => {
                  // Subtract 1 to account for padding cell (fog grid has 1 extra cell on each side)
                  const cellX = (x - 1) * gMap.gridSize + offsetX;
                  const cellY = (y - 1) * gMap.gridSize + offsetY;
                  if (cellX >= gMap.width || cellY >= gMap.height) return null;
                  if (!isVisible) {
                    return (
                      <Rect
                        key={`fog-dm-${x}-${y}`}
                        x={cellX}
                        y={cellY}
                        width={gMap.gridSize}
                        height={gMap.gridSize}
                        fill="black"
                        opacity={0.35}
                        stroke="#ff6b6b"
                        strokeWidth={1.5}
                        listening={false}
                        shadowColor="#ff0000"
                        shadowBlur={2}
                        shadowOpacity={0.5}
                      />
                    );
                  }
                  return null;
                })
              )}
              {/* Dimmer pattern when grid disabled: outline faint cells to help DM orient fog */}
              {!gMap.gridEnabled && fogData.visibility && fogData.visibility.map((row, y) =>
                row.map((isVisible, x) => {
                  if (!isVisible) return null; // only outline revealed cells lightly
                  // Subtract 1 to account for padding cell (fog grid has 1 extra cell on each side)
                  const cellX = (x - 1) * gMap.gridSize + offsetX;
                  const cellY = (y - 1) * gMap.gridSize + offsetY;
                  if (cellX >= gMap.width || cellY >= gMap.height) return null;
                  return (
                    <Rect
                      key={`fog-dimmer-${x}-${y}`}
                      x={cellX}
                      y={cellY}
                      width={gMap.gridSize}
                      height={gMap.gridSize}
                      fill={null}
                      stroke="#ff6b6b"
                      strokeWidth={0.4}
                      opacity={0.15}
                      listening={false}
                    />
                  );
                })
              )}
            </Layer>
          );
        })()}  

        {/* Drawing & Effects Layer - Shapes, Drawings, Rulers, Pings */}
        {(layerVisibility.shapes || layerVisibility.pings) && <Layer>
          {/* Shapes (persisted) with fade-out for non-persistent */}
          {visibleShapes.map(shape => {
            // Calculate fade-out for non-persistent shapes
            let effectiveOpacity = shape.opacity;
            if (!shape.persistent) {
              const createdAt = shape.createdAt?.toDate ? shape.createdAt.toDate() : new Date();
              const age = Date.now() - createdAt.getTime();
              const fadeStart = 3000; // Start fading at 3 seconds
              const fadeDuration = 2000; // Complete fade in 2 seconds
              if (age > fadeStart) {
                const fadeProgress = Math.min((age - fadeStart) / fadeDuration, 1);
                effectiveOpacity = shape.opacity * (1 - fadeProgress);
              }
            }

            if (shape.type === 'circle') {
              return <Circle key={shape.id} x={shape.geometry.x} y={shape.geometry.y} radius={shape.geometry.radius} fill={shape.color} opacity={effectiveOpacity} listening={false} />;
            }
            if (shape.type === 'rectangle') {
              return <Rect key={shape.id} x={shape.geometry.x} y={shape.geometry.y} width={shape.geometry.width} height={shape.geometry.height} fill={shape.color} opacity={effectiveOpacity} listening={false} />;
            }
            if (shape.type === 'line') {
              return <Line key={shape.id} points={[shape.geometry.x1, shape.geometry.y1, shape.geometry.x2, shape.geometry.y2]} stroke={shape.color} strokeWidth={4} opacity={effectiveOpacity} listening={false} lineCap="round" />;
            }
            if (shape.type === 'cone') {
              const { x, y, direction, length, angle } = shape.geometry;
              const half = (angle || 60) / 2;
              const startAngle = (direction - half) * (Math.PI / 180);
              const endAngle = (direction + half) * (Math.PI / 180);
              const x2 = x + Math.cos(startAngle) * length;
              const y2 = y + Math.sin(startAngle) * length;
              const x3 = x + Math.cos(endAngle) * length;
              const y3 = y + Math.sin(endAngle) * length;
              return <Line key={shape.id} points={[x, y, x2, y2, x3, y3]} fill={shape.color} closed opacity={effectiveOpacity} listening={false} />;
            }
            return null;
          })}

          {/* Shape preview */}
          {shapePreview && (() => {
            const preview = shapePreview;
            if (preview.type === 'circle') {
              return <Circle x={preview.geometry.x} y={preview.geometry.y} radius={preview.geometry.radius} stroke={shapeColor} strokeWidth={2} dash={[6, 4]} opacity={0.8} listening={false} />;
            }
            if (preview.type === 'rectangle') {
              const { x, y, width, height } = preview.geometry;
              return <Rect x={x} y={y} width={width} height={height} stroke={shapeColor} strokeWidth={2} dash={[6, 4]} opacity={0.8} listening={false} />;
            }
            if (preview.type === 'line') {
              const { x1, y1, x2, y2 } = preview.geometry;
              return <Line points={[x1, y1, x2, y2]} stroke={shapeColor} strokeWidth={3} dash={[6, 4]} opacity={0.8} listening={false} />;
            }
            if (preview.type === 'cone') {
              const { x, y, direction, length, angle } = preview.geometry;
              const half = (angle || 60) / 2;
              const startAngle = (direction - half) * (Math.PI / 180);
              const endAngle = (direction + half) * (Math.PI / 180);
              const x2 = x + Math.cos(startAngle) * length;
              const y2 = y + Math.sin(startAngle) * length;
              const x3 = x + Math.cos(endAngle) * length;
              const y3 = y + Math.sin(endAngle) * length;
              return <Line points={[x, y, x2, y2, x3, y3]} stroke={shapeColor} strokeWidth={2} dash={[6, 4]} opacity={0.8} closed listening={false} />;
            }
            return null;
          })()}

          {/* Other users' shape previews */}
          {otherUsersPreviews.map(preview => {
            if (preview.shapeType === 'circle') {
              return <Circle key={preview.userId} x={preview.geometry.x} y={preview.geometry.y} radius={preview.geometry.radius} stroke={preview.color} strokeWidth={2} dash={[6, 4]} opacity={preview.opacity * 0.6} listening={false} />;
            }
            if (preview.shapeType === 'rectangle') {
              const { x, y, width, height } = preview.geometry;
              return <Rect key={preview.userId} x={x} y={y} width={width} height={height} stroke={preview.color} strokeWidth={2} dash={[6, 4]} opacity={preview.opacity * 0.6} listening={false} />;
            }
            if (preview.shapeType === 'line') {
              const { x1, y1, x2, y2 } = preview.geometry;
              return <Line key={preview.userId} points={[x1, y1, x2, y2]} stroke={preview.color} strokeWidth={3} dash={[6, 4]} opacity={preview.opacity * 0.6} listening={false} />;
            }
            if (preview.shapeType === 'cone') {
              const { x, y, direction, length, angle } = preview.geometry;
              const half = (angle || 60) / 2;
              const startAngle = (direction - half) * (Math.PI / 180);
              const endAngle = (direction + half) * (Math.PI / 180);
              const x2 = x + Math.cos(startAngle) * length;
              const y2 = y + Math.sin(startAngle) * length;
              const x3 = x + Math.cos(endAngle) * length;
              const y3 = y + Math.sin(endAngle) * length;
              return <Line key={preview.userId} points={[x, y, x2, y2, x3, y3]} stroke={preview.color} strokeWidth={2} dash={[6, 4]} opacity={preview.opacity * 0.6} closed listening={false} />;
            }
            return null;
          })}
          {/* Pen strokes with fade */}
          {drawings.filter(d => d.type === 'pen').map(drawing => {
            const flatPoints = drawing.points.flatMap(p => [p.x, p.y]);
            // Calculate opacity based on age - start fading 1 second after creation
            const createdAt = drawing.createdAt?.toDate ? drawing.createdAt.toDate() : new Date();
            const age = Date.now() - createdAt.getTime();
            const fadeStart = 1000; // Start fading at 1 second
            const fadeDuration = 2000; // Fade over 2 seconds
            let opacity = 0.8;
            if (age > fadeStart) {
              const fadeProgress = Math.min(1, (age - fadeStart) / fadeDuration);
              opacity = 0.8 * (1 - fadeProgress);
            }
            return (
              <Line
                key={drawing.id}
                points={flatPoints}
                stroke={drawing.color}
                strokeWidth={3}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                opacity={opacity}
                listening={false}
              />
            );
          })}

          {/* Arrows with slow fade */}
          {drawings.filter(d => d.type === 'arrow').map(drawing => {
            // Calculate opacity based on age (fade from 0.9 to 0 over last 1 second)
            const createdAt = drawing.createdAt?.toDate ? drawing.createdAt.toDate() : new Date();
            const age = Date.now() - createdAt.getTime();
            const fadeStart = 2000; // Start fading at 2 seconds
            const fadeDuration = 1000; // Fade over 1 second
            let opacity = 0.9;
            if (age > fadeStart) {
              const fadeProgress = Math.min(1, (age - fadeStart) / fadeDuration);
              opacity = 0.9 * (1 - fadeProgress);
            }
            return (
              <Arrow
                key={drawing.id}
                points={[drawing.start.x, drawing.start.y, drawing.end.x, drawing.end.y]}
                stroke={drawing.color}
                fill={drawing.color}
                strokeWidth={4}
                pointerLength={15}
                pointerWidth={15}
                opacity={opacity}
                listening={false}
                shadowColor={drawing.color}
                shadowBlur={10}
                shadowOpacity={0.6}
              />
            );
          })}

          {/* Current drawing in progress */}
          {isDrawing && currentDrawing.length > 0 && (
            <Line
              points={currentDrawing}
              stroke={penColor}
              strokeWidth={3}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              opacity={0.8}
              listening={false}
            />
          )}

          {/* Pinned Rulers */}
          {pinnedRulers.map((ruler) => {
            const dx = ruler.end.x - ruler.start.x;
            const dy = ruler.end.y - ruler.start.y;
            const pixelDistance = Math.sqrt(dx * dx + dy * dy);
            const gridSize = gMap?.gridSize || 50;
            const gridSquares = (pixelDistance / gridSize).toFixed(1);
            const feetPerSquare = gMap?.scaleInFeet || 5;
            const feet = (parseFloat(gridSquares) * feetPerSquare).toFixed(0);
            const midX = (ruler.start.x + ruler.end.x) / 2;
            const midY = (ruler.start.y + ruler.end.y) / 2;

            return (
              <Fragment key={ruler.id}>
                <Line
                  points={[ruler.start.x, ruler.start.y, ruler.end.x, ruler.end.y]}
                  stroke="#ffaa00"
                  strokeWidth={2}
                  dash={[10, 5]}
                  listening={false}
                  opacity={0.7}
                />
                <Circle
                  x={ruler.start.x}
                  y={ruler.start.y}
                  radius={4}
                  fill="#ffaa00"
                  listening={false}
                  opacity={0.7}
                />
                <Circle
                  x={ruler.end.x}
                  y={ruler.end.y}
                  radius={4}
                  fill="#ffaa00"
                  listening={false}
                  opacity={0.7}
                />
                <Rect
                  x={midX - 40}
                  y={midY - 15}
                  width={80}
                  height={30}
                  fill="rgba(0, 0, 0, 0.6)"
                  cornerRadius={5}
                  listening={false}
                  opacity={0.7}
                />
                <KonvaText
                  x={midX - 38}
                  y={midY - 10}
                  width={76}
                  text={`📌 ${gridSquares} sq\n${feet} ft`}
                  fontSize={11}
                  fill="#ffaa00"
                  align="center"
                  listening={false}
                  opacity={0.7}
                />
              </Fragment>
            );
          })}

          {/* Active Ruler measurement */}
          {rulerStart && rulerEnd && (
            <Fragment>
              <Line
                points={[rulerStart.x, rulerStart.y, rulerEnd.x, rulerEnd.y]}
                stroke={rulerColor}
                strokeWidth={2}
                dash={[10, 5]}
                listening={false}
              />
              {/* Calculate and display distance */}
              {(() => {
                const dx = rulerEnd.x - rulerStart.x;
                const dy = rulerEnd.y - rulerStart.y;
                const pixelDistance = Math.sqrt(dx * dx + dy * dy);
                const gridSize = gMap?.gridSize || 50;
                const gridSquares = (pixelDistance / gridSize).toFixed(1);
                const feetPerSquare = gMap?.scaleInFeet || 5;
                const feet = (parseFloat(gridSquares) * feetPerSquare).toFixed(0);
                const midX = (rulerStart.x + rulerEnd.x) / 2;
                const midY = (rulerStart.y + rulerEnd.y) / 2;

                return (
                  <Fragment>
                    {/* Start marker */}
                    <Circle
                      x={rulerStart.x}
                      y={rulerStart.y}
                      radius={5}
                      fill={rulerColor}
                      listening={false}
                    />
                    {/* End marker */}
                    <Circle
                      x={rulerEnd.x}
                      y={rulerEnd.y}
                      radius={5}
                      fill={rulerColor}
                      listening={false}
                    />
                    {/* Distance label background */}
                    <Rect
                      x={midX - 40}
                      y={midY - 15}
                      width={80}
                      height={30}
                      fill="rgba(0, 0, 0, 0.7)"
                      cornerRadius={5}
                      listening={false}
                    />
                    {/* Distance label */}
                    <KonvaText
                      x={midX - 38}
                      y={midY - 10}
                      width={76}
                      text={`${gridSquares} sq\n${feet} ft`}
                      fontSize={12}
                      fill="#00ff00"
                      align="center"
                      listening={false}
                    />
                  </Fragment>
                );
              })()}
            </Fragment>
          )}

          {/* Arrow preview */}
          {arrowStart && (
            <Circle
              x={arrowStart.x}
              y={arrowStart.y}
              radius={8}
              fill="#ffff00"
              opacity={0.6}
              listening={false}
              shadowColor="#ffff00"
              shadowBlur={10}
            />
          )}

          {/* Light placement preview */}
          {activeTool === 'placeLight' && lightPreviewPos && placingLight && (
            <Fragment>
              {/* Outer glow ring */}
              <Circle
                x={lightPreviewPos.x}
                y={lightPreviewPos.y}
                radius={placingLight.radius || 40}
                fill={placingLight.color || '#FF8800'}
                opacity={0.1}
                listening={false}
              />
              {/* Inner bright center */}
              <Circle
                x={lightPreviewPos.x}
                y={lightPreviewPos.y}
                radius={8}
                fill={placingLight.color || '#FF8800'}
                opacity={0.8}
                listening={false}
                shadowColor={placingLight.color || '#FF8800'}
                shadowBlur={20}
                shadowOpacity={0.8}
              />
              {/* Placement indicator */}
              <Circle
                x={lightPreviewPos.x}
                y={lightPreviewPos.y}
                radius={placingLight.radius || 40}
                stroke={placingLight.color || '#FF8800'}
                strokeWidth={2}
                dash={[10, 5]}
                opacity={0.6}
                listening={false}
              />
            </Fragment>
          )}

          {/* Light dragging radius indicator */}
          {draggingLight && (
            <Fragment>
              {/* Outer glow ring showing light radius */}
              <Circle
                x={draggingLight.currentPos.x}
                y={draggingLight.currentPos.y}
                radius={draggingLight.light.radius || 40}
                fill={draggingLight.light.color || '#FF8800'}
                opacity={0.1}
                listening={false}
              />
              {/* Dashed radius border */}
              <Circle
                x={draggingLight.currentPos.x}
                y={draggingLight.currentPos.y}
                radius={draggingLight.light.radius || 40}
                stroke={draggingLight.light.color || '#FF8800'}
                strokeWidth={2}
                dash={[10, 5]}
                opacity={0.7}
                listening={false}
              />
              {/* Center dot indicator */}
              <Circle
                x={draggingLight.currentPos.x}
                y={draggingLight.currentPos.y}
                radius={10}
                fill={draggingLight.light.color || '#FF8800'}
                opacity={0.5}
                listening={false}
                shadowColor={draggingLight.light.color || '#FF8800'}
                shadowBlur={15}
                shadowOpacity={0.6}
              />
            </Fragment>
          )}

          {/* Pings - X shape with vertical line */}
          {layerVisibility.pings && pings.map(ping => {
            // Calculate ping animation phases
            const pingAge = Date.now() - (ping.createdAt?.toMillis?.() || Date.now());
            const flashDuration = 200; // 0.2s bright flash
            const colorTransitionDuration = 300; // 0.3s transition to color
            const holdDuration = 2000; // 2s hold at full opacity
            const fadeStart = flashDuration + colorTransitionDuration + holdDuration; // Start fading at 2.5s
            const fadeDuration = 1000; // 1s fade out

            let pingColor = ping.color || '#ffff00';
            let pingOpacity = 1;
            let shadowIntensity = 1;

            // Phase 1: Bright white flash (0-0.2s)
            if (pingAge < flashDuration) {
              pingColor = '#ffffff';
              pingOpacity = 1;
              shadowIntensity = 2; // Extra bright shadow
            }
            // Phase 2: Transition to custom color (0.2s-0.5s)
            else if (pingAge < flashDuration + colorTransitionDuration) {
              const transitionProgress = (pingAge - flashDuration) / colorTransitionDuration;
              // Interpolate from white to custom color (simplified - just use color)
              pingColor = ping.color || '#ffff00';
              pingOpacity = 1;
              shadowIntensity = 2 - transitionProgress; // Reduce shadow intensity
            }
            // Phase 3: Hold at full opacity (0.5s-2.5s)
            else if (pingAge < fadeStart) {
              pingOpacity = 1;
              shadowIntensity = 1;
            }
            // Phase 4: Fade out (2.5s-3.5s)
            else {
              const fadeProgress = Math.min(1, (pingAge - fadeStart) / fadeDuration);
              pingOpacity = 1 - fadeProgress;
              shadowIntensity = 1 - fadeProgress;
            }

            return (
              <Fragment key={ping.id}>
                {/* Vertical line up from center */}
                <Line
                  points={[ping.x, ping.y, ping.x, ping.y - 24]}
                  stroke={pingColor}
                  strokeWidth={3}
                  opacity={pingOpacity}
                  listening={false}
                  shadowColor={pingColor}
                  shadowBlur={8 * shadowIntensity}
                  shadowOpacity={pingOpacity * 0.75}
                />
                {/* X shape - diagonal 1 */}
                <Line
                  points={[ping.x - 12, ping.y - 12, ping.x + 12, ping.y + 12]}
                  stroke={pingColor}
                  strokeWidth={3}
                  opacity={pingOpacity}
                  listening={false}
                  shadowColor={pingColor}
                  shadowBlur={8 * shadowIntensity}
                  shadowOpacity={pingOpacity * 0.75}
                />
                {/* X shape - diagonal 2 */}
                <Line
                  points={[ping.x - 12, ping.y + 12, ping.x + 12, ping.y - 12]}
                  stroke={pingColor}
                  strokeWidth={3}
                  opacity={pingOpacity}
                  listening={false}
                  shadowColor={pingColor}
                  shadowBlur={8 * shadowIntensity}
                  shadowOpacity={pingOpacity * 0.75}
                />
              </Fragment>
            );
          })}
        </Layer>}

        {/* Additional layers */}
        {children}
      </Stage>

      {/* Canvas Controls */}
      <div className="canvas-controls">
        <button onClick={handleZoomIn} title="Zoom In">
          +
        </button>
        <span className="zoom-level">{Math.round(stageScale * 100)}%</span>
        <button onClick={handleZoomOut} title="Zoom Out">
          −
        </button>
        <button onClick={handleResetView} title="Reset View">
          ⟲
        </button>
      </div>

      {/* Floating Keyboard Shortcuts Button (Bottom-Left) */}
      <button
        className="floating-help-button"
        onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
        title="Keyboard Shortcuts"
        aria-label="Toggle keyboard shortcuts"
        aria-pressed={showKeyboardShortcuts}
      >
        <Info size={20} />
      </button>

      {/* Keyboard Shortcuts Panel */}
      {showKeyboardShortcuts && (
        <div className="keyboard-shortcuts-panel">
          <div className="shortcuts-header">
            <Keyboard size={25}/>
            <h3> Keyboard Shortcuts</h3>
            <button
              className="shortcuts-close-btn"
              onClick={() => setShowKeyboardShortcuts(false)}
              aria-label="Close shortcuts"
            >
              ✕
            </button>
          </div>
          <div className="shortcuts-content">
            <div className="shortcut-item">
              <kbd>Alt + Click</kbd>
              <span>Ping location</span>
            </div>
            <div className="shortcut-item">
              <kbd>R</kbd>
              <span>Toggle Ruler tool</span>
            </div>
            <div className="shortcut-item">
              <kbd>G</kbd>
              <span>Toggle Grid</span>
            </div>
            <div className="shortcut-item">
              <kbd>S</kbd>
              <span>Toggle Snap to Grid</span>
            </div>
            <div className="shortcut-item">
              <kbd>T</kbd>
              <span>Toggle Token Snap</span>
            </div>
            <div className="shortcut-item">
              <kbd>Esc</kbd>
              <span>Clear/Cancel</span>
            </div>
            {isDM && (
              <>
                <div className="shortcut-item">
                  <kbd>Ctrl + Z</kbd>
                  <span>Undo</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl + Shift + Z</kbd>
                  <span>Redo</span>
                </div>
              </>
            )}
            <div className="shortcut-item">
              <kbd>Mouse Wheel</kbd>
              <span>Zoom in/out</span>
            </div>
            <div className="shortcut-item">
              <kbd>Click + Drag</kbd>
              <span>Pan map</span>
            </div>
          </div>
        </div>
      )}
      {isDM && (
        <GridConfigurator
          open={showGridConfig}
          onClose={() => setShowGridConfig(false)}
          map={gMap}
          onUpdate={async (updates) => {
            // TODO: Track before state for undo/redo (future enhancement)
            setMapLive(m => m ? { ...m, ...updates } : m);
            try {
              await mapService.updateMap(firestore, campaignId, gMap.id, updates);
              // TODO: Undo/redo for grid updates (future enhancement)
            } catch (e) { console.error('Failed to update grid settings', e); }
          }}
        //           pushUndo={(entry) => setUndoStack(u => [...u, entry])}
        />
      )}
      {/* FogPanel now rendered inside MapToolbar as a flyout */}
      {isDM && (
        <LayerManager
          open={showLayerManager}
          onClose={() => setShowLayerManager(false)}
          visibility={layerVisibility}
          onToggle={(key) => setLayerVisibility(v => ({ ...v, [key]: !v[key] }))}
        />
      )}
      {isDM && (
        <AudioController
          firestore={firestore}
          campaignId={campaignId}
          open={showAudio}
          onClose={() => setShowAudio(false)}
          isDM={isDM}
        //           pushUndo={(entry) => setUndoStack(u => [...u, entry])}
        />
      )}
      {isDM && (
        <LightingPanel
          lights={lights}
          globalLighting={globalLighting}
          onCreateLight={createLight}
          onUpdateLight={updateLight}
          onDeleteLight={deleteLight}
          onUpdateGlobalLighting={updateGlobalLighting}
          onStartPlacingLight={(lightData) => {
            setPlacingLight(lightData);
            setActiveTool('placeLight');
          }}
          open={showLightingPanel}
          onClose={() => setShowLightingPanel(false)}
          isDM={isDM}
          onCenterCamera={(x, y) => {
            const stage = stageRef.current;
            if (stage) {
              const scale = stage.scaleX();
              const centerX = stage.width() / 2;
              const centerY = stage.height() / 2;
              
              stage.position({
                x: centerX - x * scale,
                y: centerY - y * scale
              });
              stage.batchDraw();
            }
          }}
        />
      )}
      {isDM && showTokenEditor && selectedTokenId && (() => {
        const token = tokens.find(t => t.id === selectedTokenId);
        if (!token) return null;
        return (
          <TokenExtendedEditor
            token={token}
            open={showTokenEditor}
            onClose={() => setShowTokenEditor(false)}
            onSave={async ({ hp, maxHp, presetStatus }) => {
              try {
                // TODO: Track before state for undo/redo (future enhancement)
                const updates = {};
                if (typeof maxHp === 'number' && maxHp !== token.maxHp) updates.maxHp = maxHp;
                if (typeof hp === 'number' && hp !== token.hp) updates.hp = hp;
                if (presetStatus) {
                  await tokenService.addStatusEffect(firestore, campaignId, map.id, token.id, presetStatus);
                  // TODO: Track status for undo/redo (future enhancement)
                }
                if (Object.keys(updates).length) {
                  await tokenService.updateToken(firestore, campaignId, map.id, token.id, updates);
                }
                // TODO: Undo/redo for token updates (future enhancement)
              } catch (e) { console.error('Save token stats failed', e); }
            }}
          />
        );
      })()}
      {contextMenu && (() => {
        const token = tokens.find(t => t.id === contextMenu.tokenId);
        if (!token) return null;
        const rect = stageRef.current?.container()?.getBoundingClientRect();
        const pos = { x: contextMenu.x - (rect?.left || 0), y: contextMenu.y - (rect?.top || 0) };
        return (
          <TokenContextMenu
            token={token}
            isDM={isDM}
            position={pos}
            onClose={() => setContextMenu(null)}
            onAdjustHP={async (value, isAbsolute) => {
              try {
                // TODO: Track before state for undo/redo (future enhancement)
                await tokenService.updateHP(firestore, campaignId, map.id, token.id, value, isAbsolute);
                // TODO: Undo/redo for HP updates (future enhancement)
              } catch (e) { console.error('HP update failed', e); }
            }}
            onAddStatus={async (effect) => {
              try {
                await tokenService.addStatusEffect(firestore, campaignId, map.id, token.id, effect);
                // setUndoStack(u => [...u, { undo: () => tokenService.removeStatusEffect(firestore, campaignId, map.id, token.id, effect.name), redo: () => tokenService.addStatusEffect(firestore, campaignId, map.id, token.id, effect) }]);
              } catch (e) { console.error('Add status failed', e); }
            }}
            onRemoveStatus={async (idOrName) => {
              try {
                const removed = (token.statusEffects || []).find(se => se.id === idOrName || se.name === idOrName);
                await tokenService.removeStatusEffect(firestore, campaignId, map.id, token.id, idOrName);
                if (removed) {
                  // setUndoStack(u => [...u, { undo: () => tokenService.addStatusEffect(firestore, campaignId, map.id, token.id, removed), redo: () => tokenService.removeStatusEffect(firestore, campaignId, map.id, token.id, idOrName) }]);
                }
              } catch (e) { console.error('Remove status failed', e); }
            }}
            onToggleHidden={async () => {
              try { await tokenService.updateToken(firestore, campaignId, map.id, token.id, { hidden: !token.hidden }); } catch (e) { console.error('Toggle hidden failed', e); }
            }}
            onDelete={async () => {
              if (!window.confirm('Delete token?')) return;
              try { await tokenService.deleteToken(firestore, campaignId, map.id, token.id); setContextMenu(null); } catch (e) { console.error('Delete token failed', e); }
            }}
            onAddToInitiative={async () => {
              try {
                const combatant = {
                  id: `token_${token.id}`,
                  name: token.name || 'Token',
                  initiative: typeof token.initiative === 'number' ? token.initiative : 0,
                  maxHP: token.maxHp || null,
                  currentHP: token.hp || token.maxHp || null,
                  type: token.type === 'pc' ? 'character' : (token.type || 'enemy'),
                  isPlayer: token.type === 'pc',
                  tokenId: token.id,
                  addedAt: new Date()
                };
                await initiativeService.addCombatant(firestore, campaignId, combatant);
              } catch (e) {
                console.error('Failed to add token to initiative', e);
              }
            }}
          />
        );
      })()}
      {mapContextMenu && (() => {
        const pos = { x: mapContextMenu.x, y: mapContextMenu.y };
        return (
          <MapContextMenu
            isDM={isDM}
            position={pos}
            onClose={() => setMapContextMenu(null)}
            onClearMyShapes={async () => {
              try {
                if (!user?.uid) {
                  console.error('No user ID available');
                  return;
                }
                await shapeService.clearUserShapes(firestore, campaignId, map.id, user.uid);
              } catch (e) {
                console.error('Clear my shapes failed', e);
              }
            }}
            onClearAllShapes={async () => {
              try {
                await shapeService.clearAllShapes(firestore, campaignId, map.id);
              } catch (e) {
                console.error('Clear all shapes failed', e);
              }
            }}
          />
        );
      })()}
    </div>
  );
}

export default MapCanvas;
