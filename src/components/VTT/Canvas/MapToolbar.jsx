import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Settings,
    Minus,
    Maximize2,
    MousePointer,
    PenTool,
    ArrowRight,
    Circle,
    Square,
    Triangle,
    Grid,
    Ruler,
    CloudFog
} from 'lucide-react';
import FogPanel from './FogPanel';
import './MapToolbar.css';

/**
 * MapToolbar - Enhanced tool selection for map interactions
 * Features:
 * - Draggable toolbar
 * - Collapsible/minimizable
 * - Color customization for pings and pens
 * - Multiple tools: Pointer, Ping, Pen, Arrow
 */
const MapToolbar = ({
    activeTool,
    onToolChange,
    isDM,
    pingColor = '#ffff00',
    penColor = '#ffffff',
    rulerColor = '#00ff00',
    onPingColorChange,
    onPenColorChange,
    onRulerColorChange,
    snapToGrid = false,
    rulerPersistent = false,
    onRulerSnapToggle,
    onRulerPersistentToggle,
    onClearPinnedRulers,
    pinnedRulersCount = 0,
    tokenSnap = true,
    onTokenSnapToggle,
    // Shape tool props
    shapeColor = '#ff0000',
    shapeOpacity = 0.5,
    shapePersistent = false,
    shapeVisibility = 'all', // 'dm' | 'all'
    onShapeColorChange,
    onShapeOpacityChange,
    onShapePersistentToggle,
    onShapeVisibilityChange,
    onClearTempShapes,
    onClearAllShapes,
    onOpenGridConfig,
    showKeyboardShortcuts = false, // Controlled by MapCanvas now
    // Grid configuration props
    map,
    onGridUpdate,
    // Fog-related props
    fogOfWarEnabled,
    onToggleFogEnabled,
    onRevealAll,
    onConcealAll,
    onInitializeFog,
    showFogPanel,
    onOpenFogPanel,
    onCloseFogPanel,
    fogBrushSize,
    onFogBrushSizeChange,
    fogBrushMode,
    onFogBrushModeChange,
}) => {
    const [isMinimized, setIsMinimized] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showGridConfig, setShowGridConfig] = useState(false);
    const [position, setPosition] = useState({ x: 20, y: 20 });
    const [width, setWidth] = useState(180);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);

    // Grid configuration state
    const [gridSize, setGridSize] = useState(map?.gridSize || 50);
    const [gridColor, setGridColor] = useState(map?.gridColor || '#000000');
    const [gridOpacity, setGridOpacity] = useState(map?.gridOpacity ?? 0.3);
    const [gridEnabled, setGridEnabled] = useState(map?.gridEnabled ?? true);
    const [gridOffsetX, setGridOffsetX] = useState(map?.gridOffsetX || 0);
    const [gridOffsetY, setGridOffsetY] = useState(map?.gridOffsetY || 0);
    const debounceRef = useRef();

    // Update grid state when map changes
    useEffect(() => {
        setGridSize(map?.gridSize || 50);
        setGridColor(map?.gridColor || '#000000');
        setGridOpacity(map?.gridOpacity ?? 0.3);
        setGridEnabled(map?.gridEnabled ?? true);
        setGridOffsetX(map?.gridOffsetX || 0);
        setGridOffsetY(map?.gridOffsetY || 0);
    }, [map?.id, map?.gridSize, map?.gridColor, map?.gridOpacity, map?.gridEnabled, map?.gridOffsetX, map?.gridOffsetY]);

    const toolbarRef = useRef(null);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const dragStartOffset = useRef({ x: 0, y: 0 });
    const resizeDirection = useRef(null);

    const MIN_WIDTH = 60; // Minimum width to fit icon + padding
    const MAX_WIDTH = 300; // Maximum width

    const tools = [
        { id: 'pointer', icon: MousePointer, label: 'Pointer', description: 'Select mode (no drawing)' },
        // Ping removed - use Alt+Click to ping at any time
        { id: 'pen', icon: PenTool, label: 'Pen', description: 'Draw temporary marks' },
        { id: 'arrow', icon: ArrowRight, label: 'Arrow', description: 'Point to locations' },
        // Ruler and shape tools available to all players
        { id: 'ruler', icon: Ruler, label: 'Ruler', description: 'Measure distance in grid squares' },
        { id: 'circle', icon: Circle, label: 'Circle', description: 'Draw circle (AOE radius)' },
        { id: 'rectangle', icon: Square, label: 'Rectangle', description: 'Draw rectangle area' },
        { id: 'cone', icon: Triangle, label: 'Cone', description: 'Draw cone (breath / spell)' },
        { id: 'line', icon: Minus, label: 'Line', description: 'Draw line / wall' },
    ];

    // Handle resize
    const handleResizeStart = useCallback((e, direction) => {
        if (e.button !== 0) return; // Only left-click
        setIsResizing(true);
        resizeDirection.current = direction;
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        e.preventDefault();
        e.stopPropagation(); // Crucial: prevent drag from starting
    }, []);

    // Handle dragging from sides/body
    const handleMouseDown = useCallback((e) => {
        if (e.button !== 0 || isResizing) return; // Only left-click for drag, prevent drag during resize

        // Prevent drag when clicking interactive elements
        const target = e.target;
        if (target.closest('.toolbar-control-btn') ||
            target.closest('.toolbar-title') ||
            target.closest('.toolbar-button') ||
            target.closest('.color-picker-container') ||
            target.closest('.checkbox-label') ||
            target.closest('.clear-rulers-btn') ||
            target.closest('.visibility-select') ||
            target.closest('.opacity-slider') ||
            target.closest('.resize-handle')) { // CRITICAL: Don't drag when clicking resize handles!
            return;
        }

        setIsDragging(true);
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        dragStartOffset.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
        e.preventDefault(); // Prevent text selection
    }, [isResizing, position.x, position.y]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isDragging) {
                let newX = e.clientX - dragStartOffset.current.x;
                let newY = e.clientY - dragStartOffset.current.y;

                // Simple boundaries (keep element on screen)
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                const toolbarWidth = toolbarRef.current.offsetWidth;
                const toolbarHeight = toolbarRef.current.offsetHeight;

                newX = Math.min(Math.max(0, newX), viewportWidth - toolbarWidth);
                newY = Math.min(Math.max(0, newY), viewportHeight - toolbarHeight);

                setPosition({ x: newX, y: newY });
            } else if (isResizing) {
                const deltaX = e.clientX - dragStartPos.current.x;
                let newWidth = width;
                let newX = position.x;

                if (resizeDirection.current === 'right') {
                    newWidth = Math.max(MIN_WIDTH, Math.min(width + deltaX, MAX_WIDTH));
                } else if (resizeDirection.current === 'left') {
                    newWidth = Math.max(MIN_WIDTH, Math.min(width - deltaX, MAX_WIDTH));
                    newX = position.x + (width - newWidth);

                    // newWidth = width - deltaX;
                    // newX = position.x + deltaX;

                    // if (newWidth < MIN_WIDTH) {
                    //     newX = position.x + (width - MIN_WIDTH);
                    //     newWidth = MIN_WIDTH;
                    // }
                    // if (newWidth > MAX_WIDTH) {
                    //     newX = position.x + (width - MAX_WIDTH);
                    //     newWidth = MAX_WIDTH;
                    // }
                }

                setWidth(newWidth);
                setPosition({ x: newX, y: position.y });
                // dragStartPos.current = { x: e.clientX, y: e.clientY };
            }
        };

        const handleMouseUp = () => {
            if (isDragging) setIsDragging(false);
            if (isResizing) setIsResizing(false);
            resizeDirection.current = null;
        };

        if (isDragging || isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, position, width, MIN_WIDTH, MAX_WIDTH]);

    const handleFogButtonClick = () => {
        // Toggle fog panel (external FogPanel component)
        if (showFogPanel) {
            onCloseFogPanel?.();
        } else {
            // Close other panels if open
            if (showSettings) {
                setShowSettings(false);
            }
            if (showGridConfig) {
                setShowGridConfig(false);
            }
            onOpenFogPanel?.();
        }
    };

    const handleGridButtonClick = () => {
        // Toggle grid config panel
        if (showGridConfig) {
            setShowGridConfig(false);
        } else {
            // Close other panels if open
            if (showSettings) {
                setShowSettings(false);
            }
            if (showFogPanel) {
                onCloseFogPanel?.();
            }
            setShowGridConfig(true);
        }
    };

    // Debounced grid update
    const debouncedGridUpdate = useCallback((partial) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            onGridUpdate?.(partial);
        }, 180);
    }, [onGridUpdate]);

    return (
        <div
            ref={toolbarRef}
            className={`map-toolbar ${isMinimized ? 'minimized' : ''} ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''}`}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: `${width}px`
            }}
        >
            {/* Resize handles */}
            <div
                className="resize-handle resize-handle-left"
                onMouseDown={(e) => handleResizeStart(e, 'left')}
            />
            <div
                className="resize-handle resize-handle-right"
                onMouseDown={(e) => handleResizeStart(e, 'right')}
            />
            <div className="toolbar-header" onMouseDown={handleMouseDown}>
                <div
                    className="toolbar-title"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsMinimized(!isMinimized);
                    }}
                    style={{ cursor: 'pointer' }}
                >
                    Map Tools
                </div>
                <div className="toolbar-controls">
                    {!isMinimized && (
                        <button
                            className={`toolbar-control-btn ${showSettings ? 'active' : ''}`}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (showSettings) {
                                    setShowSettings(false);
                                } else {
                                    // Close other panels if open
                                    if (showFogPanel) {
                                        onCloseFogPanel?.();
                                    }
                                    if (showGridConfig) {
                                        setShowGridConfig(false);
                                    }
                                    setShowSettings(true);
                                }
                            }}
                            aria-label="Toggle toolbar settings"
                            aria-pressed={showSettings}
                        >
                            <Settings size={14} />
                        </button>
                    )}
                    <button
                        className="toolbar-control-btn"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsMinimized(!isMinimized);
                        }}
                        aria-label={isMinimized ? "Expand toolbar" : "Minimize toolbar"}
                        aria-pressed={isMinimized}
                    >
                        {isMinimized ? <Maximize2 size={14} /> : <Minus size={14} />}
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <div className="scrollable-body">
                    <div className="toolbar-buttons">
                        {tools.map(tool => {
                            const Icon = tool.icon;
                            return (
                                <button
                                    key={tool.id}
                                    className={`toolbar-button ${activeTool === tool.id ? 'active' : ''}`}
                                    onClick={() => onToolChange(tool.id)}
                                    aria-label={`${tool.label} - ${tool.description}`}
                                    aria-pressed={activeTool === tool.id}
                                >
                                    <Icon size={20} />
                                    {width > 100 && <span className="toolbar-label">{tool.label}</span>}
                                </button>
                            );
                        })}
                        <div className="dm-toolbar-separator" />
                        {isDM && (
                            <button
                                className={`toolbar-button ${showGridConfig ? 'active' : ''}`}
                                onClick={handleGridButtonClick}
                                aria-label="Toggle Grid Configuration"
                                aria-pressed={showGridConfig}
                            >
                                <Grid size={20} />
                                {width > 100 && <span className="toolbar-label">Grid</span>}
                            </button>
                        )}

                        {isDM && (
                            <button
                                className={`toolbar-button ${showFogPanel ? 'active' : ''}`}
                                onClick={handleFogButtonClick}
                                aria-label="Toggle Fog Controls"
                                aria-pressed={showFogPanel}
                            >
                                <CloudFog size={20} />
                                {width > 100 && <span className="toolbar-label">Fog</span>}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Settings Panel - Adjacent Flyout */}
            {showSettings && !isMinimized && (
                <div className="toolbar-settings-panel">
                    <div className="panel-header">
                        <label>Tool Settings</label>
                        <button
                            className="panel-close-btn"
                            onClick={() => setShowSettings(false)}
                            aria-label="Close settings"
                        >
                            ×
                        </button>
                    </div>
                    <div className="setting-group">
                        <label>Ping Color (Alt+Click)</label>
                        <div className="color-picker-container">
                            <input
                                type="color"
                                value={pingColor}
                                onChange={(e) => onPingColorChange?.(e.target.value)}
                                className="color-picker"
                            />
                            <span className="color-value">{pingColor}</span>
                        </div>
                    </div>
                    <div className="setting-divider" />
                    <div className="setting-group">
                        <label>Pen Color</label>
                        <div className="color-picker-container">
                            <input
                                type="color"
                                value={penColor}
                                onChange={(e) => onPenColorChange?.(e.target.value)}
                                className="color-picker"
                            />
                            <span className="color-value">{penColor}</span>
                        </div>
                    </div>
                    <div className="setting-divider" />
                    <div className="setting-group">
                        <label>Ruler Color</label>
                        <div className="color-picker-container">
                            <input
                                type="color"
                                value={rulerColor}
                                onChange={(e) => onRulerColorChange?.(e.target.value)}
                                className="color-picker"
                            />
                            <span className="color-value">{rulerColor}</span>
                        </div>
                    </div>

                    {isDM && (
                        <>
                            <div className="setting-divider" />
                            <div className="setting-group">
                                <label>Ruler Settings (Press R)</label>
                                <div className="checkbox-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={snapToGrid}
                                            onChange={() => onRulerSnapToggle?.()}
                                        />
                                        <span>Snap to Grid (All Tools)</span>
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={tokenSnap}
                                            onChange={() => onTokenSnapToggle?.()}
                                        />
                                        <span>Token Snap</span>
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={rulerPersistent}
                                            onChange={() => onRulerPersistentToggle?.()}
                                        />
                                        <span>Pin Measurements (📌)</span>
                                    </label>
                                </div>
                                {pinnedRulersCount > 0 && (
                                    <button
                                        className="clear-rulers-btn"
                                        onClick={() => onClearPinnedRulers?.()}
                                    >
                                        Clear {pinnedRulersCount} Pinned Ruler{pinnedRulersCount !== 1 ? 's' : ''}
                                    </button>
                                )}
                            </div>
                        </>
                    )}

                    {isDM && (
                        <>
                            <div className="setting-divider" />
                            <div className="setting-group">
                                <label>Shape Settings</label>
                                <div className="color-picker-row">
                                    <div className="color-picker-container">
                                        <input
                                            type="color"
                                            value={shapeColor}
                                            onChange={(e) => onShapeColorChange?.(e.target.value)}
                                            className="color-picker"
                                        />
                                        <span className="color-value">{shapeColor}</span>
                                    </div>
                                    <div className="opacity-slider">
                                        <input
                                            type="range"
                                            min={0.1}
                                            max={1}
                                            step={0.05}
                                            value={shapeOpacity}
                                            onChange={(e) => onShapeOpacityChange?.(parseFloat(e.target.value))}
                                        />
                                        <span>{Math.round(shapeOpacity * 100)}% opacity</span>
                                    </div>
                                </div>
                                <div className="checkbox-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={shapePersistent}
                                            onChange={() => onShapePersistentToggle?.()}
                                        />
                                        <span>Persistent (no auto-expire)</span>
                                    </label>
                                </div>
                                <div className="visibility-select">
                                    <label>
                                        Visibility:
                                        <select
                                            value={shapeVisibility}
                                            onChange={(e) => onShapeVisibilityChange?.(e.target.value)}
                                        >
                                            <option value="all">All Players</option>
                                            <option value="dm">DM Only</option>
                                        </select>
                                    </label>
                                </div>
                                <div className="shape-actions">
                                    <button
                                        className="clear-rulers-btn"
                                        onClick={() => onClearTempShapes?.()}
                                    >
                                        Clear Temp Shapes
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Grid Configuration Panel - Adjacent Flyout */}
            {showGridConfig && !isMinimized && isDM && onOpenGridConfig && (
                <div className="toolbar-settings-panel">
                    <div className="panel-header">
                        <label>Grid Configuration</label>
                        <button
                            className="panel-close-btn"
                            onClick={() => setShowGridConfig(false)}
                            aria-label="Close grid configuration"
                        >
                            ×
                        </button>
                    </div>
                    <div className="setting-group">
                        <label>Grid Visibility</label>
                        <div className="checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={gridEnabled}
                                    onChange={(e) => {
                                        const newValue = e.target.checked;
                                        setGridEnabled(newValue);
                                        debouncedGridUpdate({ gridEnabled: newValue });
                                    }}
                                />
                                <span>Show Grid</span>
                            </label>
                        </div>
                    </div>
                    <div className="setting-divider" />
                    <div className="setting-group">
                        <label>Grid Size (px): {gridSize}</label>
                        <div className="opacity-slider">
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input
                                    type="range"
                                    min={20}
                                    max={150}
                                    step={5}
                                    value={gridSize}
                                    onChange={(e) => {
                                        const v = parseInt(e.target.value, 10);
                                        setGridSize(v);
                                        debouncedGridUpdate({ gridSize: v });
                                    }}
                                    style={{ flex: 1 }}
                                />
                                <input
                                    type="number"
                                    min={10}
                                    max={300}
                                    value={gridSize}
                                    onChange={(e) => {
                                        const v = parseInt(e.target.value, 10) || 50;
                                        setGridSize(v);
                                        debouncedGridUpdate({ gridSize: v });
                                    }}
                                    style={{ width: '60px', padding: '4px', background: '#2a2a3e', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="setting-divider" />
                    <div className="setting-group">
                        <label>Grid Offset X: {gridOffsetX}</label>
                        <div className="opacity-slider">
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input
                                    type="range"
                                    min={Math.floor(-(gridSize / 2))}
                                    max={Math.floor(gridSize / 2)}
                                    step={1}
                                    value={gridOffsetX}
                                    onChange={(e) => {
                                        const v = parseInt(e.target.value, 10);
                                        setGridOffsetX(v);
                                        debouncedGridUpdate({ gridOffsetX: v });
                                    }}
                                    style={{ flex: 1 }}
                                />
                                <input
                                    type="number"
                                    min={Math.floor(-(gridSize / 2))}
                                    max={Math.floor(gridSize / 2)}
                                    value={gridOffsetX}
                                    onChange={(e) => {
                                        const v = Math.max(Math.floor(-(gridSize / 2)), Math.min(Math.floor(gridSize / 2), parseInt(e.target.value, 10) || 0));
                                        setGridOffsetX(v);
                                        debouncedGridUpdate({ gridOffsetX: v });
                                    }}
                                    style={{ width: '60px', padding: '4px', background: '#2a2a3e', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="setting-divider" />
                    <div className="setting-group">
                        <label>Grid Offset Y: {gridOffsetY}</label>
                        <div className="opacity-slider">
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input
                                    type="range"
                                    min={Math.floor(-(gridSize / 2))}
                                    max={Math.floor(gridSize / 2)}
                                    step={1}
                                    value={gridOffsetY}
                                    onChange={(e) => {
                                        const v = parseInt(e.target.value, 10);
                                        setGridOffsetY(v);
                                        debouncedGridUpdate({ gridOffsetY: v });
                                    }}
                                    style={{ flex: 1 }}
                                />
                                <input
                                    type="number"
                                    min={Math.floor(-(gridSize / 2))}
                                    max={Math.floor(gridSize / 2)}
                                    value={gridOffsetY}
                                    onChange={(e) => {
                                        const v = Math.max(Math.floor(-(gridSize / 2)), Math.min(Math.floor(gridSize / 2), parseInt(e.target.value, 10) || 0));
                                        setGridOffsetY(v);
                                        debouncedGridUpdate({ gridOffsetY: v });
                                    }}
                                    style={{ width: '60px', padding: '4px', background: '#2a2a3e', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="setting-divider" />
                    <div className="setting-group">
                        <label>Grid Opacity</label>
                        <div className="opacity-slider">
                            <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.05}
                                value={gridOpacity}
                                onChange={(e) => {
                                    const v = parseFloat(e.target.value);
                                    setGridOpacity(v);
                                    debouncedGridUpdate({ gridOpacity: v });
                                }}
                            />
                            <span>{Math.round(gridOpacity * 100)}% opacity</span>
                        </div>
                    </div>
                    <div className="setting-divider" />
                    <div className="setting-group">
                        <label>Grid Color</label>
                        <div className="color-picker-container">
                            <input
                                type="color"
                                value={gridColor}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setGridColor(v);
                                    debouncedGridUpdate({ gridColor: v });
                                }}
                                className="color-picker"
                            />
                            <span className="color-value">{gridColor}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Fog of War Panel - Adjacent Flyout */}
            {showFogPanel && !isMinimized && isDM && (
                <FogPanel
                    open={showFogPanel}
                    onClose={onCloseFogPanel}
                    fogEnabled={fogOfWarEnabled}
                    onToggleFog={onToggleFogEnabled}
                    onRevealAll={onRevealAll}
                    onConcealAll={onConcealAll}
                    brushSize={fogBrushSize}
                    onBrushSizeChange={onFogBrushSizeChange}
                    brushMode={fogBrushMode}
                    onBrushModeChange={onFogBrushModeChange}
                />
            )}
        </div>
    );
};

export default MapToolbar;
