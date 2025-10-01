# Floating Panel User Guide

## Overview
Chat and Party panels can now be used in two modes:
- **Sidebar Mode** (default): Docked to the left side
- **Floating Mode**: Independent draggable window

## How to Use

### Opening Panels

**Method 1: Sidebar (Default)**
```
Click "Chat" or "Party" button → Opens in left sidebar
Click again → Closes sidebar
```

**Method 2: Pop Out (Floating)**
```
Right-click "Chat" or "Party" button → Opens floating panel
OR
Click button to open sidebar, then click again → Pops out
```

### Visual Indicators

- **Active in sidebar**: Button highlighted, no icon
- **Floating**: Button highlighted + ⬜ icon next to name
  - Example: "Chat ⬜"

### Floating Panel Controls

```
╔═══════════════════════════════════╗
║ 📱 Panel Title      📌 ➖ ✕      ║  ← Header (drag here)
╠═══════════════════════════════════╣
║                                   ║
║   Panel Content Here              ║
║                                   ║
║                                   ║
╚════════════════════════════════◢══╝
                                  ↑
                           Resize handle
```

**Header Buttons**:
- **📌 Dock**: Returns panel to sidebar
- **➖ Minimize**: Collapses to header bar only
- **✕ Close**: Closes the panel

**Interactions**:
- **Drag**: Click and hold header to move
- **Resize**: Click and drag bottom-right corner (◢)
- **Minimize**: Click ➖ to collapse, click again to expand

### Keyboard Shortcuts

Currently none - all interactions are mouse-based.

### Size Constraints

**Chat Panel**:
- Default: 400×600 pixels
- Min: 300×400 pixels
- Max: 900×900 pixels

**Party Panel**:
- Default: 450×650 pixels
- Min: 350×400 pixels
- Max: 900×900 pixels

### Multiple Panels

You can have multiple panels floating simultaneously:
- Chat + Party both floating
- One floating, one in sidebar
- Mix and match as needed

Panels have independent positions and sizes.

### Tips & Tricks

1. **Quick Pop-Out**: Right-click the button for instant floating mode
2. **Return to Sidebar**: Use the 📌 dock button (preserves your work)
3. **Compact Mode**: Minimize panels you want nearby but not taking space
4. **Can't Lose Panels**: All panels are constrained to stay on screen
5. **Smooth Dragging**: Uses 60fps requestAnimationFrame for buttery performance

### Troubleshooting

**Panel won't drag**:
- Make sure you're clicking the header (top bar with title)
- Don't click on buttons in the header

**Panel stuck at edge**:
- This is intentional - panels can't go off-screen
- Close and reopen to reset position

**Can't resize**:
- Look for the ◢ triangle in bottom-right corner
- Cursor should change to resize (↘)

**Panel too small/large**:
- Use resize handle to adjust
- Double-check you're within min/max constraints

**Lost track of panel**:
- Click the button again to close it
- Reopen to get fresh panel at default position

### Future Enhancements (Planned)

- [ ] Remember panel positions across sessions (localStorage)
- [ ] Keyboard shortcuts for panels
- [ ] Touch/mobile optimization
- [ ] Multi-monitor support
- [ ] Custom panel sizes per user preference
- [ ] Snap-to-grid panel positioning
- [ ] Panel transparency control

---

## Developer Notes

### Component Architecture

```javascript
// VTTSession.jsx manages state
const [floatingPanels, setFloatingPanels] = useState({
  chat: false,   // true = floating, false = not floating
  party: false,
  rules: false,  // not yet implemented
  // ... more panels can be added
});

// Each panel component receives:
<ChatPanel
  campaignId={campaignId}
  isFloating={true}  // Controls rendering mode
  onClose={() => closeFloatingPanel('chat')}  // X button
  onDock={() => {    // 📌 button
    closeFloatingPanel('chat');
    setActivePanel('chat');
    setIsSidebarOpen(true);
  }}
/>
```

### Styling

- **Floating**: `.chat-panel-floating` / `.party-panel-floating`
- **Docked**: `.chat-panel-docked` / `.party-panel-docked`
- Uses backdrop-filter for glassmorphism effect
- CSS transitions for smooth minimize/maximize

### Performance

- Drag: `requestAnimationFrame` for 60fps
- Resize: `requestAnimationFrame` for 60fps
- No performance impact when panels not open
- Cleanup: All event listeners removed on unmount

### Extending to Other Panels

To add floating support to other panels (Rules, Initiative, etc.):

1. Create `<PanelName>Panel.jsx` component (copy structure from ChatPanel/PartyPanel)
2. Create `<PanelName>Panel.css` with floating styles
3. Add to VTTSession imports
4. Update button onClick to use `toggleFloatingPanel('panelname')`
5. Add conditional rendering in VTTSession
6. Add `panelname: false` to floatingPanels state

Example for Rules panel:
```javascript
// Add to floatingPanels state
const [floatingPanels, setFloatingPanels] = useState({
  chat: false,
  party: false,
  rules: false,  // NEW
});

// Update button
<button
  className={`toolbar-button ${activePanel === 'rules' || floatingPanels.rules ? 'active' : ''}`}
  onClick={() => { /* toggle logic */ }}
  onContextMenu={(e) => { /* right-click popout */ }}
>
  <FiFileText />
  <span>Rules {floatingPanels.rules && '⬜'}</span>
</button>

// Add rendering
{floatingPanels.rules && (
  <RulesPanel
    campaignId={campaignId}
    isFloating={true}
    onClose={() => closeFloatingPanel('rules')}
    onDock={() => { /* dock logic */ }}
  />
)}
```

---

## Testing Scenarios

See `BUG_FIXES_SUMMARY.md` for complete testing checklist.

Quick smoke test:
1. Right-click Chat button → should pop out
2. Drag around screen → should be smooth
3. Resize from corner → should work smoothly
4. Minimize → should collapse to header
5. Dock → should return to sidebar
6. Repeat for Party panel
7. Open both simultaneously → should work independently
