# WebRTC Glare Condition Fix

## Issue
When both users joined the voice chat simultaneously, they both tried to create offers to each other at the same time. This caused a "glare" condition where both peers were in the wrong state to receive answers, resulting in:

```
InvalidStateError: Failed to execute 'setRemoteDescription' on 'RTCPeerConnection': 
Failed to set remote answer sdp: Called in wrong state: stable
```

## Root Cause
In the original implementation:
1. User A joins and sends an offer to User B
2. User B joins (at nearly the same time) and sends an offer to User A
3. Both receive each other's offers while they already have local offers pending
4. Both try to send answers
5. When answers arrive, the peer connections are in the wrong state to accept them

This is called a **"glare condition"** in WebRTC terminology.

## Solution: Polite Peer Pattern
Implemented the standard WebRTC "polite peer" pattern as recommended by MDN and W3C:

### How It Works
1. **Deterministic Role Assignment**: Use lexicographic comparison of user IDs
   - Peer with smaller user ID = "polite" peer
   - Peer with larger user ID = "impolite" peer

2. **Collision Detection**: Check if peer connection is in `have-local-offer` state when receiving an offer

3. **Role-Based Behavior**:
   - **Polite peer**: Rolls back their local offer and accepts the incoming offer
   - **Impolite peer**: Ignores the incoming offer and waits for an answer to their offer

### Code Changes

#### `handleOffer()` Method
```javascript
async handleOffer(remoteUserId, offer) {
  // Determine role
  const isPolite = this.userId < remoteUserId;
  
  let pc = this.connections.get(remoteUserId);
  
  // Detect collision
  const offerCollision = pc && 
    (pc.signalingState === 'have-local-offer' || pc.signalingState === 'stable');
  
  if (offerCollision) {
    if (isPolite) {
      // Roll back and accept incoming offer
      await pc.setLocalDescription({type: 'rollback'});
    } else {
      // Ignore incoming offer
      return;
    }
  }
  
  // Continue with normal offer handling...
}
```

#### `handleAnswer()` Method
```javascript
async handleAnswer(remoteUserId, answer) {
  const pc = this.connections.get(remoteUserId);
  
  // Only accept answer if we're expecting one
  if (pc.signalingState !== 'have-local-offer') {
    console.warn(`Received answer but not in correct state, ignoring`);
    return;
  }
  
  await pc.setRemoteDescription(new RTCSessionDescription(answer));
}
```

## Example Scenario

### Before Fix (Race Condition)
```
User A (ID: "aaa...")          User B (ID: "bbb...")
    |                               |
    | joins, sends offer →          |
    |                      ← offer sent, joins
    | receives offer (collision!)   |
    | sends answer →                |
    |                ← sends answer  |
    | ERROR: wrong state!           |
    |                               | ERROR: wrong state!
```

### After Fix (Polite Peer)
```
User A (ID: "aaa..." - POLITE)   User B (ID: "bbb..." - IMPOLITE)
    |                               |
    | joins, sends offer →          |
    |                      ← offer sent, joins
    | receives offer (collision!)   |
    | A is polite: ROLLBACK         | B is impolite: IGNORE
    | sends answer →                |
    |                               | receives answer ✅
    | receives answer to new offer ✅|
    | CONNECTION ESTABLISHED        |
```

## Why This Is The Standard Solution

1. **W3C Recommendation**: This is the official pattern recommended by the WebRTC specification
2. **Deterministic**: User ID comparison ensures both peers always agree on roles
3. **No Race Conditions**: Only one negotiation path succeeds
4. **Minimal Changes**: Works with existing signaling infrastructure
5. **Scalable**: Works for any number of simultaneous connections

## Testing

### Test Case 1: Simultaneous Join
1. Open two browser windows
2. Click "Join Voice" in both windows **at the same time**
3. ✅ Both should connect successfully without errors

### Test Case 2: Sequential Join
1. User A joins first
2. Wait 1-2 seconds
3. User B joins
4. ✅ Both should connect successfully

### Test Case 3: Multiple Peers
1. User A joins
2. User B joins
3. User C joins
4. ✅ All three should be interconnected (mesh topology)

## Alternative Solutions Considered

### ❌ Option 1: Queue Offers
- Pro: Simple conceptually
- Con: Adds latency, complex state management

### ❌ Option 2: Designated Initiator
- Pro: No collisions possible
- Con: Requires coordination, doesn't work with mesh topology

### ✅ Option 3: Polite Peer (Chosen)
- Pro: Standard, proven, minimal latency
- Con: Requires understanding WebRTC states (but worth it)

## Related Resources
- [MDN: Perfect Negotiation](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Perfect_negotiation)
- [W3C WebRTC Spec](https://www.w3.org/TR/webrtc/)
- [WebRTC for the Curious: Signaling](https://webrtcforthecurious.com/docs/03-connecting/)

## Files Modified
- `src/services/voice/webrtcManager.js`
  - Updated `handleOffer()` to implement polite peer pattern
  - Updated `handleAnswer()` to validate signaling state

---
**Fixed**: September 30, 2025  
**Issue**: Glare condition causing connection failures  
**Solution**: Polite peer pattern with rollback
