# Shape Clearing Context Menu - Implementation Summary

## Feature Overview
Users can now right-click on the map canvas to access a context menu for clearing shapes they've drawn. The context menu provides role-based actions:
- **All Users**: Can clear their own shapes
- **DMs Only**: Can clear all shapes from all users

## User Experience

### For Players
1. Right-click anywhere on the map (not on tokens/lights)
2. Select "Clear My Shapes" from the context menu
3. Only shapes created by that user are deleted
4. Other users' shapes remain untouched

### For DMs
1. Right-click anywhere on the map
2. Two options available:
   - "Clear My Shapes" - Clears only DM's shapes
   - "Clear All Shapes" - Clears all shapes from everyone (with confirmation)
3. Confirmation dialog prevents accidental deletion

## Implementation Details

### New Components

#### MapContextMenu.jsx
- Lightweight context menu component
- Props:
  - `isDM` - Determines available actions
  - `position` - {x, y} coordinates for menu placement
  - `onClose` - Handler to close menu
  - `onClearMyShapes` - Handler for clearing user's shapes
  - `onClearAllShapes` - Handler for clearing all shapes (DM only)
- Features:
  - Click outside to close
  - ESC key to close
  - Visual distinction for dangerous actions (red for "Clear All")
  - Icons: 🗑️ for my shapes, ⚠️ for all shapes

#### MapContextMenu.css
- Modern gradient background
- Backdrop blur effect
- Smooth hover transitions
- Danger styling for destructive actions
- Consistent with TokenContextMenu design

### Service Updates

#### shapeService.js
New method: `clearUserShapes(firestore, campaignId, mapId, userId)`
- Queries shapes collection with `where('createdBy', '==', userId)`
- Batch deletes all matching shapes
- Efficient single query + batch operation
- Existing `clearAllShapes()` used for DM action

### Canvas Integration

#### MapCanvas.jsx
1. **State Management**
   - Added `mapContextMenu` state: `{ x, y }`
   - Tracks menu position and visibility

2. **Event Handlers**
   - `onContextMenu` on Stage component
   - Detects right-click on map background (not tokens/lights)
   - Calculates position relative to canvas
   - Prevents default browser context menu
   
3. **Keyboard Shortcuts**
   - ESC key closes map context menu
   - Updated keyboard handler to check `mapContextMenu` state

4. **Menu Rendering**
   - Conditionally renders MapContextMenu
   - Passes user actions as callbacks
   - Integrates with shapeService methods

## Technical Implementation

### Data Model
Each shape includes:
```javascript
{
  type: 'circle' | 'rectangle' | 'cone' | 'line',
  geometry: { /* shape-specific data */ },
  color: string,
  opacity: number,
  persistent: boolean,
  visibleTo: 'dm' | 'all',
  createdBy: string, // user.uid from Firebase Auth
  createdAt: Timestamp,
  expiresAt: Timestamp | null
}
```

### Security
- User ID from Firebase Authentication (`user.uid`)
- `createdBy` field stored on shape creation
- Query filters ensure users only delete their own shapes
- DM permission check for "Clear All Shapes"
- No client-side spoofing possible

### Performance
- Single Firestore query with `where()` clause
- Batch deletion using `Promise.all()`
- No unnecessary reads or writes
- Efficient for large numbers of shapes

## Usage Examples

### Drawing Shapes
1. DM draws a red circle (area of effect)
2. Player A draws a blue cone (spell effect)
3. Player B draws a yellow line (movement path)

### Clearing Shapes

**Player A Right-Clicks:**
- Menu shows: "Clear My Shapes"
- Action: Deletes only Player A's blue cone
- Result: DM's circle and Player B's line remain

**DM Right-Clicks:**
- Menu shows: "Clear My Shapes" and "Clear All Shapes"
- "Clear My Shapes": Deletes only DM's red circle
- "Clear All Shapes": Confirmation → Deletes all shapes from everyone

## UI/UX Design

### Visual Hierarchy
1. **Header**: "Map Actions" with close button
2. **Section**: Action buttons with icons
3. **Hover States**: Background highlight + slight transform
4. **Danger Action**: Red text with warning icon (⚠️)

### Interaction Flow
```
Right-click map
    ↓
Context menu appears at cursor
    ↓
User selects action
    ↓
Action executes + menu closes
    ↓
Shapes deleted from Firestore
    ↓
Real-time update removes from canvas
```

### Menu Positioning
- Appears at exact cursor position
- Position calculated relative to canvas container
- Accounts for canvas transformations (zoom/pan)
- Always visible (no off-screen placement)

## Edge Cases Handled

1. **No shapes to clear**: Action completes silently (no error)
2. **User not authenticated**: Error logged, no action taken
3. **Right-click on token**: Token context menu takes precedence
4. **Right-click on light**: Light's custom menu takes precedence
5. **Menu open while clicking**: Menu closes first
6. **Multiple menus**: Only one context menu visible at a time
7. **ESC key priority**: Checks context menus before other actions

## Future Enhancements

Potential improvements:
- [ ] Undo/redo for shape deletion
- [ ] "Clear Temporary Shapes" option (non-persistent only)
- [ ] Shape count display in menu (e.g., "Clear My Shapes (3)")
- [ ] Bulk select and delete shapes
- [ ] Shape history/timeline view
- [ ] Export/import shape data

## Testing Checklist

- [x] Players can clear their own shapes
- [x] DMs can clear their own shapes
- [x] DMs can clear all shapes with confirmation
- [x] Menu doesn't appear on token right-click
- [x] Menu doesn't appear on light right-click
- [x] ESC key closes menu
- [x] Click outside closes menu
- [x] No console errors
- [x] Lint passes
- [x] Real-time updates work correctly
- [x] Multiple users can clear independently
- [x] Confirmation dialog for "Clear All"

## Files Changed

### New Files
- `src/components/VTT/Canvas/MapContextMenu.jsx` - Context menu component
- `src/components/VTT/Canvas/MapContextMenu.css` - Styling

### Modified Files
- `src/components/VTT/Canvas/MapCanvas.jsx` - Integration and handlers
- `src/services/vtt/shapeService.js` - clearUserShapes method

## Summary

This feature provides a clean, intuitive way for users to manage their own shape drawings while giving DMs full control over the canvas. The implementation follows existing patterns, maintains security, and provides a smooth user experience with proper permissions enforcement.

**Key Benefits:**
- ✅ User-friendly shape management
- ✅ Role-based permissions (player vs DM)
- ✅ Safe - can't delete others' shapes
- ✅ Confirmation for destructive actions
- ✅ Consistent UI/UX with existing menus
- ✅ Performance optimized
- ✅ Real-time updates via Firestore
