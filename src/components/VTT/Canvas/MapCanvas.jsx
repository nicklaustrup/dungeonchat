import React, { useRef, useState, useEffect, useContext, Fragment, useMemo, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Line, Arrow, Circle, Text as KonvaText } from 'react-konva';
import useImage from 'use-image';
import GridLayer from './GridLayer';
import TokenSprite from '../TokenManager/TokenSprite';
import MapToolbar from './MapToolbar';
import GridConfigurator from './GridConfigurator';
import LayerManager from './LayerManager';
import MapLibraryPanel from '../MapLibrary/MapLibraryPanel';
import AudioController from '../Audio/AudioController';
import TokenExtendedEditor from '../TokenManager/TokenExtendedEditor';
import TokenContextMenu from '../TokenManager/TokenContextMenu';
import LightingLayer from './LightingLayer';
import { initiativeService } from '../../../services/initiativeService';
import { mapService } from '../../../services/vtt/mapService';
import useTokens from '../../../hooks/vtt/useTokens';
import useCanvasTools from '../../../hooks/vtt/useCanvasTools';
import useDrawingState from '../../../hooks/vtt/useDrawingState';
import useCanvasViewport from '../../../hooks/vtt/useCanvasViewport';
import useLighting from '../../../hooks/vtt/useLighting';
import { tokenService } from '../../../services/vtt/tokenService';
import { pingService } from '../../../services/vtt/pingService';
import { fogOfWarService } from '../../../services/vtt/fogOfWarService';
import { drawingService } from '../../../services/vtt/drawingService';
import { shapeService } from '../../../services/vtt/shapeService';
import { FirebaseContext } from '../../../services/FirebaseContext';
import './MapCanvas.css';

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
  } = useCanvasTools();
  
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
  const { lights, globalLighting } = useLighting(firestore, campaignId, map?.id, map?.lighting);
  
  // Ping state
  const [pings, setPings] = useState([]);
  
  // Fog of War state
  const [fogData, setFogData] = useState(null);
  
  // Ruler state
  const [rulerStart, setRulerStart] = useState(null);
  const [rulerEnd, setRulerEnd] = useState(null);
  const [snapToGrid, setSnapToGrid] = useState(false); // global snap
  const [rulerPersistent, setRulerPersistent] = useState(false);
  const [pinnedRulers, setPinnedRulers] = useState([]); // Array of pinned measurements
  
  // Token-specific snapping toggle & drag highlight footprint
  const [tokenSnap, setTokenSnap] = useState(true);
  const [tokenSnapHighlight, setTokenSnapHighlight] = useState(null); // {x,y,w,h}
  const [tokenSnapPulse, setTokenSnapPulse] = useState(0); // animation ticker for highlight pulse
  const [showGridConfig, setShowGridConfig] = useState(false);
  const [contextMenu, setContextMenu] = useState(null); // { tokenId, x, y }
  const [layerVisibility, setLayerVisibility] = useState({ grid: true, fog: true, tokens: true, shapes: true, drawings: true, pings: true, rulers: true });
  // Undo/Redo state (future enhancement)
  // const [undoStack, setUndoStack] = useState([]);
  // const [redoStack, setRedoStack] = useState([]);
  const [showLayerManager, setShowLayerManager] = useState(false);
  const [showMapLibrary, setShowMapLibrary] = useState(false);
  const [showAudio, setShowAudio] = useState(false);
  const [showTokenEditor, setShowTokenEditor] = useState(false);
  // Local optimistic map state for immediate grid visual response
  const [mapLive, setMapLive] = useState(map);
  useEffect(() => { setMapLive(map); }, [map]);
  const gMap = mapLive || map;

  // Performance optimization: Memoize filtered shapes
  const visibleShapes = useMemo(() => {
    return shapes.filter(s => (s.visibleTo === 'all') || isDM);
  }, [shapes, isDM]);

  // Performance optimization: Memoize player tokens for fog reveal
  const playerTokens = useMemo(() => {
    return tokens ? tokens.filter(t => t.type === 'pc' && !t.staged && t.position) : [];
  }, [tokens]);

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

  // Helper to optionally snap any point to grid when global snap is enabled
  const maybeSnapPoint = useCallback((pt) => {
    if (snapToGrid && gMap?.gridSize) {
      const g = gMap.gridSize;
      return { x: Math.round(pt.x / g) * g, y: Math.round(pt.y / g) * g };
    }
    return pt;
  }, [snapToGrid, gMap?.gridSize]);

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
          mapService.updateMap(firestore, campaignId, gMap.id, { gridEnabled: next }).catch(()=>{});
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
  }, [isDM, activeTool, contextMenu, gMap, firestore, campaignId]);

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

  // Reveal fog around all player tokens when tokens or fog data changes
  useEffect(() => {
  if (!firestore || !campaignId || !gMap?.id || !fogOfWarEnabled || !fogData?.enabled || !playerTokens.length) return;

    const revealAroundPlayerTokens = async () => {
      try {
        // Reveal fog around each player token
        for (const token of playerTokens) {
          const gridX = Math.floor(token.position.x / map.gridSize);
          const gridY = Math.floor(token.position.y / map.gridSize);
          await fogOfWarService.revealArea(firestore, campaignId, map.id, gridX, gridY, 3);
        }
      } catch (error) {
        console.error('Error revealing fog around player tokens:', error);
      }
    };

    revealAroundPlayerTokens();
  }, [firestore, campaignId, gMap?.id, gMap?.gridSize, fogOfWarEnabled, fogData?.enabled, gMap?.gridEnabled, playerTokens, map.gridSize, map.id]);

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
        if (!arrowStart) {
          setArrowStart(maybeSnapPoint({ x: mapX, y: mapY }));
        } else {
          try {
            const end = maybeSnapPoint({ x: mapX, y: mapY });
            await drawingService.createArrow(firestore, campaignId, map.id, arrowStart, end, '#ffff00', user.uid);
            setArrowStart(null);
          } catch (err) {
            console.error('Error creating arrow:', err);
          }
        }
  } else if (activeTool === 'ruler') {
        const gridSize = map?.gridSize || 50;
        let startX = mapX;
        let startY = mapY;
        let endX = mapX;
        let endY = mapY;
        
        // Snap to grid if enabled
        if (snapToGrid) {
          startX = Math.round(mapX / gridSize) * gridSize;
          startY = Math.round(mapY / gridSize) * gridSize;
          endX = Math.round(mapX / gridSize) * gridSize;
          endY = Math.round(mapY / gridSize) * gridSize;
        }
        
        if (!rulerStart) {
          // Set ruler start point
          setRulerStart({ x: startX, y: startY });
        } else {
          // Complete measurement
          if (rulerPersistent) {
            // Pin the measurement
            setPinnedRulers(prev => [
              ...prev,
              {
                id: Date.now(),
                start: rulerStart,
                end: { x: endX, y: endY }
              }
            ]);
          }
          // Clear current ruler
          setRulerStart(null);
          setRulerEnd(null);
        }
        return; // Don't deselect tokens when using ruler
      } else if (['circle','rectangle','cone','line'].includes(activeTool) && isDM) {
        if (!shapeStart) {
          setShapeStart(maybeSnapPoint({ x: mapX, y: mapY }));
        } else {
          const end = maybeSnapPoint({ x: mapX, y: mapY });
          try {
            if (activeTool === 'circle') {
              const dx = end.x - shapeStart.x;
              const dy = end.y - shapeStart.y;
              const radius = Math.sqrt(dx*dx + dy*dy);
                await shapeService.createCircle(firestore, campaignId, map.id, shapeStart, radius, shapeColor, shapeOpacity, shapePersistent, shapeVisibility, user?.uid);
                // TODO: Undo/redo for shape creation (future enhancement)
            } else if (activeTool === 'rectangle') {
                await shapeService.createRectangle(firestore, campaignId, map.id, shapeStart, end.x - shapeStart.x, end.y - shapeStart.y, shapeColor, shapeOpacity, shapePersistent, shapeVisibility, user?.uid);
                // TODO: Undo/redo for shape creation (future enhancement)
            } else if (activeTool === 'cone') {
              const dx = end.x - shapeStart.x;
              const dy = end.y - shapeStart.y;
              const length = Math.sqrt(dx*dx + dy*dy);
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

  const handleMouseDown = (e) => {
    if (activeTool === 'pen' && e.target === e.target.getStage()) {
      const stage = stageRef.current;
      const pointer = stage.getPointerPosition();
      const mapX = (pointer.x - stage.x()) / stage.scaleX();
      const mapY = (pointer.y - stage.y()) / stage.scaleY();
      
      setIsDrawing(true);
      setCurrentDrawing([mapX, mapY]);
    }
  };

  const handleMouseMove = (e) => {
    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    const mapX = (pointer.x - stage.x()) / stage.scaleX();
    const mapY = (pointer.y - stage.y()) / stage.scaleY();
    
    if (activeTool === 'pen' && isDrawing) {
      setCurrentDrawing(prev => [...prev, mapX, mapY]);
  } else if (activeTool === 'ruler' && rulerStart) {
      // Update ruler end point while dragging
      const gridSize = map?.gridSize || 50;
      let endX = mapX;
      let endY = mapY;
      
      // Snap to grid if enabled
      if (snapToGrid) {
        endX = Math.round(mapX / gridSize) * gridSize;
        endY = Math.round(mapY / gridSize) * gridSize;
      }
      
      setRulerEnd({ x: endX, y: endY });
    } else if (['circle','rectangle','cone','line'].includes(activeTool) && isDM && shapeStart) {
      const end = maybeSnapPoint({ x: mapX, y: mapY });
      if (activeTool === 'circle') {
        const dx = end.x - shapeStart.x;
        const dy = end.y - shapeStart.y;
        const radius = Math.sqrt(dx*dx + dy*dy);
        setShapePreview({ type: 'circle', geometry: { x: shapeStart.x, y: shapeStart.y, radius } });
      } else if (activeTool === 'rectangle') {
        setShapePreview({ type: 'rectangle', geometry: { x: shapeStart.x, y: shapeStart.y, width: end.x - shapeStart.x, height: end.y - shapeStart.y } });
      } else if (activeTool === 'cone') {
        const dx = end.x - shapeStart.x;
        const dy = end.y - shapeStart.y;
        const length = Math.sqrt(dx*dx + dy*dy);
        const direction = (Math.atan2(dy, dx) * 180) / Math.PI;
        setShapePreview({ type: 'cone', geometry: { x: shapeStart.x, y: shapeStart.y, direction, length, angle: 60 } });
      } else if (activeTool === 'line') {
        setShapePreview({ type: 'line', geometry: { x1: shapeStart.x, y1: shapeStart.y, x2: end.x, y2: end.y } });
      }
    }
  };

  const handleMouseUp = async () => {
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
        const cellX = Math.floor(newPosition.x / g);
        const cellY = Math.floor(newPosition.y / g);
        finalPos = { x: cellX * g + g / 2, y: cellY * g + g / 2 };
      }
      // Clamp to map bounds
      finalPos = clampTokenCenter(finalPos, token);
      await tokenService.updateTokenPosition(firestore, campaignId, map.id, tokenId, finalPos);
      updateToken(tokenId, { position: finalPos });
      // Undo/redo disabled for token moves (future enhancement)
      if (fogOfWarEnabled && fogData?.enabled && map.gridEnabled) {
        if (token && token.type === 'pc') {
          const gridX = Math.floor(finalPos.x / map.gridSize);
          const gridY = Math.floor(finalPos.y / map.gridSize);
          await fogOfWarService.revealArea(firestore, campaignId, map.id, gridX, gridY, 3);
        }
      }
    } catch (err) {
      console.error('Error updating token position:', err);
    }
  }, [tokens, snapToGrid, map?.gridSize, map?.id, map?.gridEnabled, clampTokenCenter, firestore, campaignId, updateToken, fogOfWarEnabled, fogData?.enabled]);

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

  if (!gMap) {
    return (
      <div className="map-canvas-empty" style={{ width, height }}>
        <p>No map loaded. Upload a map to get started.</p>
      </div>
    );
  }

  return (
    <div className="map-canvas-container">
      {/* Map Toolbar */}
      <MapToolbar 
        activeTool={activeTool} 
        onToolChange={setActiveTool}
        isDM={isDM}
        pingColor={pingColor}
        penColor={penColor}
        onPingColorChange={setPingColor}
        onPenColorChange={setPenColor}
  snapToGrid={snapToGrid}
        rulerPersistent={rulerPersistent}
  onRulerSnapToggle={() => setSnapToGrid(prev => !prev)}
        onRulerPersistentToggle={() => setRulerPersistent(prev => !prev)}
        onClearPinnedRulers={() => setPinnedRulers([])}
        pinnedRulersCount={pinnedRulers.length}
  tokenSnap={tokenSnap}
  onTokenSnapToggle={() => setTokenSnap(prev => !prev)}
  onOpenGridConfig={() => setShowGridConfig(true)}
        shapeColor={shapeColor}
        shapeOpacity={shapeOpacity}
        shapePersistent={shapePersistent}
        shapeVisibility={shapeVisibility}
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
      {isDM && (
        <button
          style={{ position:'absolute', top:20, left:220, zIndex:130, background:'#2d2d35', color:'#ddd', border:'1px solid #444', borderRadius:6, padding:'6px 10px', cursor:'pointer', fontSize:12 }}
          onClick={() => setShowLayerManager(v=>!v)}
          title="Toggle Layer Manager"
        >Layers</button>
      )}
      {isDM && (
        <button
          style={{ position:'absolute', top:20, left:290, zIndex:130, background:'#2d2d35', color:'#ddd', border:'1px solid #444', borderRadius:6, padding:'6px 10px', cursor:'pointer', fontSize:12 }}
          onClick={() => setShowMapLibrary(v=>!v)}
          title="Toggle Map Library"
        >Maps</button>
      )}
      {isDM && (
        <button
          style={{ position:'absolute', top:20, left:350, zIndex:130, background:'#2d2d35', color:'#ddd', border:'1px solid #444', borderRadius:6, padding:'6px 10px', cursor:'pointer', fontSize:12 }}
          onClick={() => setShowAudio(v=>!v)}
          title="Toggle Ambient Audio"
        >Audio</button>
      )}
      {isDM && (
        <button
          style={{ position:'absolute', top:20, left:410, zIndex:130, background:'#2d2d35', color:'#ddd', border:'1px solid #444', borderRadius:6, padding:'6px 10px', cursor:'pointer', fontSize:12 }}
          onClick={() => setShowTokenEditor(v=>!v)}
          title="Edit Selected Token Stats"
          disabled={!selectedTokenId}
        >Edit Token</button>
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
        draggable={activeTool !== 'pen'}
        style={{ 
          cursor: activeTool === 'pen' ? 'crosshair' : 
                  activeTool === 'arrow' ? (arrowStart ? 'crosshair' : 'pointer') :
                  isDragging ? 'grabbing' : 'grab' 
        }}
      >
        {/* Background Layer */}
        <Layer>
          {mapImage && (
            <KonvaImage
              image={mapImage}
              width={gMap.width}
              height={gMap.height}
              listening={false}
            />
          )}
        </Layer>

        {/* Token snap highlight (shows target footprint while dragging) */}
  {gMap.gridEnabled && tokenSnapHighlight && (() => {
          // Pulse parameters
          const periodMs = 900; // full cycle
            const phase = (tokenSnapPulse % periodMs) / periodMs; // 0..1
          const sine = Math.sin(phase * Math.PI * 2); // -1..1
          const intensity = 0.45 + (sine * 0.25); // 0.2 range
          const strokeWidth = 2 + (sine + 1) * 1.5; // 2..5
          const glow = 8 + (sine + 1) * 6; // 8..20
          return (
            <Layer>
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
            </Layer>
          );
        })()}

  {/* Grid Layer */}
  {gMap.gridEnabled && layerVisibility.grid && (
          <GridLayer
            width={gMap.width}
            height={gMap.height}
            gridSize={gMap.gridSize}
            gridColor={gMap.gridColor}
            gridOpacity={gMap.gridOpacity}
            enabled={gMap.gridEnabled}
          />
        )}

  {/* Fog of War Layer (below tokens) - Enhanced for visibility */}
        {fogData?.enabled && layerVisibility.fog && (() => {
          return (
          <Layer>
            {fogData.visibility && fogData.visibility.map((row, y) => 
              row.map((isVisible, x) => {
                const cellX = x * gMap.gridSize;
                const cellY = y * gMap.gridSize;
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
                      opacity={isDM ? 0.35 : 0.95}
                      stroke={isDM ? "#ff6b6b" : "#1a1a1a"}
                      strokeWidth={isDM ? 1.5 : 0.5}
                      listening={false}
                      shadowColor={isDM ? "#ff0000" : "black"}
                      shadowBlur={isDM ? 2 : 3}
                      shadowOpacity={isDM ? 0.5 : 0.8}
                    />
                  );
                }
                return null;
              })
            )}
            {/* Dimmer pattern when grid disabled: outline faint cells to help DM orient fog */}
            {!gMap.gridEnabled && isDM && fogData.visibility && fogData.visibility.map((row, y) =>
              row.map((isVisible, x) => {
                if (!isVisible) return null; // only outline revealed cells lightly
                const cellX = x * gMap.gridSize;
                const cellY = y * gMap.gridSize;
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

  {/* Token Layer */}
  {layerVisibility.tokens && <Layer>
          {tokens && tokens.map(token => {
            // Skip staged tokens (they're in EncounterBuilder)
            if (token.staged) {
              return null;
            }
            // Hide tokens marked as hidden from non-DM players
            if (token.hidden && !isDM) {
              return null;
            }

            return (
              <TokenSprite
                key={token.id}
                token={token}
                isSelected={selectedTokenId === token.id}
                isDraggable={isDM && activeTool === 'pointer'}
                onClick={handleTokenClick}
                onDragEnd={handleTokenDragEnd}
                tokenSnap={tokenSnap}
                gridSize={map?.gridSize}
                onDragMovePreview={(data) => setTokenSnapHighlight(data)}
                listening={activeTool === 'pointer'}
                onContextMenu={(evt) => {
                  evt.cancelBubble = true;
                  const raw = evt.evt;
                  setContextMenu({ tokenId: token.id, x: raw.clientX, y: raw.clientY });
                }}
              />
            );
          })}
  </Layer>}

  {/* Lighting Layer - renders dynamic lighting effects */}
  {lights && globalLighting && (
    <LightingLayer
      lights={lights}
      globalLighting={globalLighting}
      mapWidth={gMap?.width || width}
      mapHeight={gMap?.height || height}
    />
  )}

  {/* Drawing Layer */}
  {layerVisibility.shapes && <Layer>
          {/* Shapes (persisted) */}
          {visibleShapes.map(shape => {
            if (shape.type === 'circle') {
              return <Circle key={shape.id} x={shape.geometry.x} y={shape.geometry.y} radius={shape.geometry.radius} fill={shape.color} opacity={shape.opacity} listening={false} />;
            }
            if (shape.type === 'rectangle') {
              return <Rect key={shape.id} x={shape.geometry.x} y={shape.geometry.y} width={shape.geometry.width} height={shape.geometry.height} fill={shape.color} opacity={shape.opacity} listening={false} />;
            }
            if (shape.type === 'line') {
              return <Line key={shape.id} points={[shape.geometry.x1, shape.geometry.y1, shape.geometry.x2, shape.geometry.y2]} stroke={shape.color} strokeWidth={4} opacity={shape.opacity} listening={false} lineCap="round" />;
            }
            if (shape.type === 'cone') {
              const { x, y, direction, length, angle } = shape.geometry;
              const half = (angle || 60)/2;
              const startAngle = (direction - half) * (Math.PI/180);
              const endAngle = (direction + half) * (Math.PI/180);
              const x2 = x + Math.cos(startAngle) * length;
              const y2 = y + Math.sin(startAngle) * length;
              const x3 = x + Math.cos(endAngle) * length;
              const y3 = y + Math.sin(endAngle) * length;
              return <Line key={shape.id} points={[x,y,x2,y2,x3,y3]} fill={shape.color} closed opacity={shape.opacity} listening={false} />;
            }
            return null;
          })}

          {/* Shape preview */}
          {shapePreview && (() => {
            const preview = shapePreview;
            if (preview.type === 'circle') {
              return <Circle x={preview.geometry.x} y={preview.geometry.y} radius={preview.geometry.radius} stroke={shapeColor} strokeWidth={2} dash={[6,4]} opacity={0.8} listening={false} />;
            }
            if (preview.type === 'rectangle') {
              const { x,y,width,height } = preview.geometry;
              return <Rect x={x} y={y} width={width} height={height} stroke={shapeColor} strokeWidth={2} dash={[6,4]} opacity={0.8} listening={false} />;
            }
            if (preview.type === 'line') {
              const { x1,y1,x2,y2 } = preview.geometry;
              return <Line points={[x1,y1,x2,y2]} stroke={shapeColor} strokeWidth={3} dash={[6,4]} opacity={0.8} listening={false} />;
            }
            if (preview.type === 'cone') {
              const { x,y,direction,length,angle } = preview.geometry;
              const half = (angle || 60)/2;
              const startAngle = (direction - half) * (Math.PI/180);
              const endAngle = (direction + half) * (Math.PI/180);
              const x2 = x + Math.cos(startAngle) * length;
              const y2 = y + Math.sin(startAngle) * length;
              const x3 = x + Math.cos(endAngle) * length;
              const y3 = y + Math.sin(endAngle) * length;
              return <Line points={[x,y,x2,y2,x3,y3]} stroke={shapeColor} strokeWidth={2} dash={[6,4]} opacity={0.8} closed listening={false} />;
            }
            return null;
          })()}
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
                stroke="#00ff00"
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
                      fill="#00ff00"
                      listening={false}
                    />
                    {/* End marker */}
                    <Circle
                      x={rulerEnd.x}
                      y={rulerEnd.y}
                      radius={5}
                      fill="#00ff00"
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
  </Layer>}

  {/* Ping Layer - X shape with vertical line */}
  {layerVisibility.pings && <Layer>
          {pings.map(ping => {
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
      {isDM && (
        <LayerManager
          open={showLayerManager}
          onClose={() => setShowLayerManager(false)}
          visibility={layerVisibility}
          onToggle={(key) => setLayerVisibility(v => ({ ...v, [key]: !v[key] }))}
        />
      )}
      {isDM && (
        <MapLibraryPanel
          firestore={firestore}
          campaignId={campaignId}
          open={showMapLibrary}
          onClose={() => setShowMapLibrary(false)}
          onSelect={(m) => { /* selection hook placeholder */ setShowMapLibrary(false); }}
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
    </div>
  );
}

export default MapCanvas;
