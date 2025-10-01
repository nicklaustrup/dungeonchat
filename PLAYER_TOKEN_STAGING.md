# Player Token Staging - How It Works

## Auto-Creation for Players

Player tokens **automatically create** when:
1. A **player** (not DM) joins the VTT session
2. The player has a **character sheet** at `/campaigns/{id}/characters/{userId}`
3. The player **doesn't already have a token** on the current map

**Important**: Auto-creation only works for **non-DM users**. The DM will not see auto-created tokens for themselves.

## Token Properties (Auto-Created)

```javascript
{
  name: character.name || profile.displayName || 'Player',
  type: 'pc',  // Player Character
  imageUrl: profile.photoURL || user.photoURL,
  position: { x: 100, y: 100 },
  size: { width: 50, height: 50 },
  color: '#4a9eff',
  characterId: user.uid,
  ownerId: user.uid,
  staged: true,  // Starts in staging area
  isHidden: false,
  createdBy: user.uid
}
```

## Manual Token Creation (DM or Players)

1. Open Token Manager
2. Click "Token Palette" tab
3. Select a token type
4. Click "Create Token"
5. Token appears in "Staging" tab
6. Click "✓ Reveal" to place on map

## Debug Console Logs

### Expected Logs (Player joining):
```
Auto-create player token check: {
  hasCampaign: true,
  hasUser: true, 
  hasFirestore: true,
  hasActiveMap: true,
  isUserDM: false,  // Must be false for auto-creation
  willRun: true
}

Player token created and staged for: [CharacterName] Token ID: [tokenId] Token data: {...}

TokenManager: Staged tokens received: 1 [token array]
```

### Expected Logs (DM viewing):
```
Auto-create player token check: {
  hasCampaign: true,
  hasUser: true,
  hasFirestore: true,
  hasActiveMap: true,
  isUserDM: true,  // True = no auto-creation
  willRun: false
}

TokenManager: Setting up staged tokens subscription for map: [mapId]
TokenManager: Staged tokens received: 0 []  // Empty if no manual tokens created
```

## Testing Auto-Creation

### Method 1: Two Browser Windows
1. **Window 1** (as DM): Create campaign, start VTT session
2. **Window 2** (as Player): 
   - Create character sheet
   - Join the same VTT session
   - Check console for "Player token created and staged for:"
3. **Window 1** (DM): 
   - Open Token Manager → Staging tab
   - Should see player's token

### Method 2: Incognito Window
1. **Normal window** (as DM): Start VTT session
2. **Incognito window** (as Player): Log in as different user, join session
3. Player should see their token auto-created
4. DM should see it in staging area

## Troubleshooting

### "No staged tokens" in Staging Tab

**For DM:**
- ✅ This is normal - DMhave no auto-creation
- ✅ Manually create tokens from Palette tab
- ✅ Players will auto-create when they join

**For Players:**
- ❌ Check: Do you have a character sheet?
- ❌ Check console: "Player has no character sheet, skipping token creation"
- ❌ Check: Do you already have a token on this map?
- ❌ Check Firestore: Does token exist with `staged: true`?

### Token Created But Not Visible

Check console logs:
```
TokenManager: Staged tokens received: 1 [{...}]
```

If count is 1 but token not visible:
- Check if token has `staged: true`
- Check if token has `type: 'pc'` (for player tokens)
- Clear browser cache and reload

### Console Shows "willRun: false"

This means auto-creation is blocked. Check which condition is false:
- `hasCampaign: false` → Campaign not loaded yet
- `hasUser: false` → User not authenticated
- `hasFirestore: false` → Firestore not initialized
- `hasActiveMap: false` → No map selected/loaded
- `isUserDM: true` → You're the DM (expected, no auto-creation for DM)

## Summary

| User Type | Auto-Creation | Manual Creation | Sees Others' Tokens |
|-----------|---------------|-----------------|---------------------|
| **DM** | ❌ No | ✅ Yes | ✅ Yes (in staging) |
| **Player** | ✅ Yes (with character sheet) | ✅ Yes | ✅ Yes (in staging) |

**Key Point**: The DM will **not** auto-create a token for themselves. They must either:
1. Create tokens manually from the Palette
2. Wait for players to join (players auto-create)
3. Upload custom tokens

Player tokens appear in the **Staging** tab and must be revealed with "✓ Reveal" to place them on the map.
