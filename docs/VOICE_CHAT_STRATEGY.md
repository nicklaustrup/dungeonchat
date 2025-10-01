# Voice Chat Strategy Document

## Executive Summary

This document outlines a comprehensive strategy for implementing real-time voice chat functionality for campaign chats in DungeonChat. The solution leverages Firebase services, Google Cloud Platform (GCP), and WebRTC technology to provide low-latency, scalable voice communication for D&D gaming sessions.

**Key Technologies:**
- **WebRTC** - Peer-to-peer voice communication
- **Firebase Realtime Database** - Signaling and presence
- **Firebase Cloud Functions** - Backend orchestration
- **Google Cloud Storage** - Voice recording storage (optional)
- **Firestore** - Voice session metadata and permissions

---

## Table of Contents

1. [Technical Overview](#technical-overview)
2. [Architecture Options](#architecture-options)
3. [Recommended Solution](#recommended-solution)
4. [Data Model](#data-model)
5. [Implementation Phases](#implementation-phases)
6. [Security & Permissions](#security--permissions)
7. [Cost Analysis](#cost-analysis)
8. [Alternative Approaches](#alternative-approaches)
9. [Future Enhancements](#future-enhancements)

---

## Technical Overview

### Voice Chat Requirements for D&D Campaigns

1. **Real-time Communication** - Low latency (<200ms) for natural conversation
2. **Multi-participant** - Support 2-8 players + DM simultaneously
3. **Campaign Isolation** - Voice channels scoped to campaigns
4. **Permission Control** - DM can mute/unmute, kick participants
5. **Push-to-Talk Option** - For players who prefer it
6. **Audio Quality** - Clear voice for roleplay and strategy discussion
7. **Mobile Support** - Works on desktop and mobile devices
8. **Recording (Optional)** - Session recording for recap

### Why WebRTC?

WebRTC (Web Real-Time Communication) is the industry standard for voice/video in browsers:

- ✅ **Built into browsers** - No plugins required
- ✅ **Low latency** - Peer-to-peer connections
- ✅ **High quality** - Adaptive bitrate and echo cancellation
- ✅ **Standardized** - Works across all modern browsers
- ✅ **Free** - No per-minute costs (unlike Twilio)

### Firebase + WebRTC Architecture

Firebase provides the perfect signaling infrastructure for WebRTC:
- **RTDB** for real-time signaling (offer/answer/ICE candidates)
- **Firestore** for persistent metadata (who's in voice, permissions)
- **Cloud Functions** for orchestration (room management, recording triggers)
- **Authentication** for secure access control

---

## Architecture Options

### Option 1: Mesh Topology (Direct P2P)
**Description:** Each peer connects directly to every other peer

```
    Player A ←→ Player B
       ↕          ↕
    Player C ←→ Player D
```

**Pros:**
- Lowest latency
- No server infrastructure needed
- Free (no bandwidth costs)
- Best quality (direct streams)

**Cons:**
- Scales poorly (N² connections)
- Limited to ~4-6 participants
- High client bandwidth usage
- No server-side recording

**Verdict:** ✅ **Best for small campaigns (4-6 people)** - Recommended starting point

---

### Option 2: SFU (Selective Forwarding Unit)
**Description:** Central server relays streams between clients

```
Player A →→
Player B →→  SFU Server  →→ To all players
Player C →→
```

**Pros:**
- Scales to 20+ participants
- Lower client bandwidth
- Can record on server
- Better quality control

**Cons:**
- Requires dedicated infrastructure
- Monthly server costs ($20-50/mo)
- More complex to implement
- Added latency (minimal)

**Verdict:** 🔄 **For scaling beyond 6-8 users** - Future enhancement

**GCP Services Needed:**
- **Google Cloud Run** - Host SFU server (media relay)
- **Google Cloud Load Balancing** - Distribute traffic
- **Cloud Storage** - Store recordings

---

### Option 3: Third-Party Service (Agora, Twilio, Daily)
**Description:** Fully managed voice/video service

**Pros:**
- Fastest to implement
- Enterprise features built-in
- Handles all complexity
- Excellent quality

**Cons:**
- Per-minute pricing ($0.001-0.004/min)
- ~$10-40/month for typical usage
- Vendor lock-in
- Less customization

**Verdict:** 💰 **If budget allows** - Easiest but recurring costs

---

## Recommended Solution

### Phase 1: Mesh WebRTC with Firebase Signaling

**Why This Approach:**
1. ✅ **Zero ongoing costs** (uses existing Firebase)
2. ✅ **Perfect for D&D groups** (typically 4-6 players)
3. ✅ **Leverages existing tech stack** (Firebase + React)
4. ✅ **Can scale later** (add SFU if needed)
5. ✅ **Full control** (no vendor lock-in)

**Architecture Diagram:**

```
┌─────────────────────────────────────────────────────┐
│                  Campaign Voice Room                 │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐     │
│  │ Player 1 │←──→│ Player 2 │←──→│ Player 3 │     │
│  └─────┬────┘    └────┬─────┘    └────┬─────┘     │
│        └──────────────┼───────────────┘            │
│                       │                             │
│                  ┌────▼─────┐                      │
│                  │    DM    │                      │
│                  └──────────┘                      │
└─────────────────────────────────────────────────────┘
           ▲                              ▲
           │ WebRTC Peer Connections      │
           │                              │
    ┌──────┴──────────────────────────────┴──────┐
    │         Firebase Signaling Layer           │
    ├────────────────────────────────────────────┤
    │  • RTDB: ICE candidates, SDP offers       │
    │  • Firestore: Voice room metadata          │
    │  • Functions: Room management              │
    └────────────────────────────────────────────┘
```

### Technology Stack

1. **Frontend (React)**
   - `react-use-webrtc` or custom WebRTC hooks
   - Native `getUserMedia` API for microphone access
   - WebRTC `RTCPeerConnection` for connections

2. **Signaling (Firebase RTDB)**
   - Real-time exchange of SDP offers/answers
   - ICE candidate trickle
   - Presence tracking (who's in voice)

3. **Metadata (Firestore)**
   - Voice room state (active, participants)
   - Permissions (who can join, who's muted)
   - Settings (push-to-talk, audio quality)

4. **Backend (Cloud Functions)**
   - Room lifecycle management
   - Permission enforcement
   - Cleanup on disconnect

---

## Data Model

### Firestore Schema

```javascript
// campaigns/{campaignId}/voiceRooms/{roomId}
{
  id: 'voice-general', // 'voice-general', 'voice-dm-private'
  name: 'Campaign Voice Chat',
  type: 'voice',
  campaignId: 'campaign123',
  status: 'active', // 'inactive', 'active'
  participants: ['user1', 'user2', 'user3'], // Active speakers
  maxParticipants: 8,
  settings: {
    requirePushToTalk: false,
    audioQuality: 'high', // 'low', 'medium', 'high'
    echoCancellation: true,
    noiseSuppression: true
  },
  permissions: {
    allowedRoles: ['dm', 'player'], // Who can join
    canSpeak: ['dm', 'player'], // Who can unmute
    canMute: ['dm'], // Who can mute others
  },
  createdBy: 'dmUserId',
  createdAt: Timestamp,
  lastActivity: Timestamp
}

// campaigns/{campaignId}/voiceRooms/{roomId}/participants/{userId}
{
  userId: 'user123',
  displayName: 'Alice',
  role: 'player', // from campaign membership
  joinedAt: Timestamp,
  isSpeaking: false, // Audio activity detection
  isMuted: false,
  isDeafened: false, // Can't hear others
  audioLevel: 0, // 0-100, for UI indicators
  connectionQuality: 'good', // 'poor', 'fair', 'good', 'excellent'
}

// campaigns/{campaignId}/voiceRooms/{roomId}/recordings/{recordingId}
{
  id: 'rec_20250930_001',
  startedAt: Timestamp,
  endedAt: Timestamp,
  duration: 7200, // seconds
  storageUrl: 'gs://bucket/recordings/rec_20250930_001.webm',
  publicUrl: null, // Set after processing
  recordedBy: 'dmUserId',
  participants: ['user1', 'user2', 'user3'],
  metadata: {
    sessionNumber: 15,
    sessionTitle: 'The Dragon\'s Lair'
  }
}
```

### Realtime Database Schema (Signaling)

```javascript
// voiceSignaling/{campaignId}/{roomId}/{userId}/
{
  // SDP Offer/Answer
  offer: {
    sdp: "v=0\r\no=- 123...",
    type: "offer",
    timestamp: 1696089600000
  },
  answer: {
    sdp: "v=0\r\no=- 456...",
    type: "answer", 
    timestamp: 1696089601000
  },
  
  // ICE Candidates (trickle)
  iceCandidates: {
    "candidate1": {
      candidate: "candidate:1 1 UDP 2130706431...",
      sdpMLineIndex: 0,
      timestamp: 1696089600100
    },
    "candidate2": { /* ... */ }
  },
  
  // Presence
  presence: {
    status: 'online', // 'online', 'offline'
    lastSeen: 1696089650000
  }
}

// voiceSignaling/{campaignId}/{roomId}/connections/
{
  "user1-user2": {
    initiator: "user1",
    recipient: "user2",
    status: "connected", // 'connecting', 'connected', 'failed'
    connectedAt: 1696089605000
  },
  "user1-user3": { /* ... */ }
}
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Goal:** Basic voice infrastructure and UI

#### 1.1 Setup WebRTC Utilities
```javascript
// src/services/voice/webrtcManager.js
class WebRTCManager {
  constructor(userId, campaignId, roomId) {
    this.userId = userId;
    this.campaignId = campaignId;
    this.roomId = roomId;
    this.connections = new Map(); // userId -> RTCPeerConnection
    this.localStream = null;
  }

  async initLocalStream() {
    // Get microphone access
    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    return this.localStream;
  }

  async createPeerConnection(remoteUserId) {
    const config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };
    
    const pc = new RTCPeerConnection(config);
    
    // Add local tracks
    this.localStream.getTracks().forEach(track => {
      pc.addTrack(track, this.localStream);
    });
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendIceCandidate(remoteUserId, event.candidate);
      }
    };
    
    // Handle remote stream
    pc.ontrack = (event) => {
      this.handleRemoteTrack(remoteUserId, event.streams[0]);
    };
    
    this.connections.set(remoteUserId, pc);
    return pc;
  }

  async sendOffer(remoteUserId) {
    const pc = await this.createPeerConnection(remoteUserId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    // Send via Firebase RTDB
    await this.signalingService.sendOffer(
      this.campaignId, 
      this.roomId, 
      this.userId, 
      remoteUserId, 
      offer
    );
  }

  async handleOffer(remoteUserId, offer) {
    const pc = await this.createPeerConnection(remoteUserId);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    await this.signalingService.sendAnswer(
      this.campaignId,
      this.roomId,
      remoteUserId,
      this.userId,
      answer
    );
  }

  cleanup() {
    // Close all connections
    this.connections.forEach(pc => pc.close());
    this.connections.clear();
    
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
  }
}
```

#### 1.2 Signaling Service
```javascript
// src/services/voice/signalingService.js
import { ref, set, onValue, remove } from 'firebase/database';

export class SignalingService {
  constructor(rtdb) {
    this.rtdb = rtdb;
  }

  async sendOffer(campaignId, roomId, fromUser, toUser, offer) {
    const path = `voiceSignaling/${campaignId}/${roomId}/${fromUser}/offers/${toUser}`;
    await set(ref(this.rtdb, path), {
      sdp: offer.sdp,
      type: offer.type,
      timestamp: Date.now()
    });
  }

  async sendAnswer(campaignId, roomId, fromUser, toUser, answer) {
    const path = `voiceSignaling/${campaignId}/${roomId}/${toUser}/answers/${fromUser}`;
    await set(ref(this.rtdb, path), {
      sdp: answer.sdp,
      type: answer.type,
      timestamp: Date.now()
    });
  }

  async sendIceCandidate(campaignId, roomId, fromUser, toUser, candidate) {
    const path = `voiceSignaling/${campaignId}/${roomId}/${fromUser}/iceCandidates/${toUser}`;
    const candidateRef = ref(this.rtdb, path).push();
    await set(candidateRef, {
      candidate: candidate.candidate,
      sdpMLineIndex: candidate.sdpMLineIndex,
      sdpMid: candidate.sdpMid,
      timestamp: Date.now()
    });
  }

  listenForOffers(campaignId, roomId, userId, callback) {
    const path = `voiceSignaling/${campaignId}/${roomId}/${userId}/offers`;
    return onValue(ref(this.rtdb, path), (snapshot) => {
      snapshot.forEach((child) => {
        const fromUser = child.key;
        const offer = child.val();
        callback(fromUser, offer);
      });
    });
  }

  listenForAnswers(campaignId, roomId, userId, callback) {
    const path = `voiceSignaling/${campaignId}/${roomId}/${userId}/answers`;
    return onValue(ref(this.rtdb, path), (snapshot) => {
      snapshot.forEach((child) => {
        const fromUser = child.key;
        const answer = child.val();
        callback(fromUser, answer);
      });
    });
  }

  async cleanup(campaignId, roomId, userId) {
    const path = `voiceSignaling/${campaignId}/${roomId}/${userId}`;
    await remove(ref(this.rtdb, path));
  }
}
```

#### 1.3 Voice Chat Hook
```javascript
// src/hooks/useVoiceChat.js
import { useState, useEffect, useCallback } from 'react';
import { WebRTCManager } from '../services/voice/webrtcManager';
import { SignalingService } from '../services/voice/signalingService';

export function useVoiceChat(campaignId, roomId = 'voice-general') {
  const { rtdb, firestore, user } = useFirebase();
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [audioLevels, setAudioLevels] = useState({}); // userId -> level
  const [manager, setManager] = useState(null);

  // Initialize voice manager
  useEffect(() => {
    if (!user || !campaignId) return;
    
    const signalingService = new SignalingService(rtdb);
    const webrtcManager = new WebRTCManager(
      user.uid, 
      campaignId, 
      roomId,
      signalingService
    );
    setManager(webrtcManager);
    
    return () => {
      webrtcManager.cleanup();
    };
  }, [user, campaignId, roomId, rtdb]);

  // Join voice room
  const join = useCallback(async () => {
    if (!manager) return;
    
    try {
      // Get microphone access
      await manager.initLocalStream();
      
      // Update Firestore participant list
      await voiceRoomService.joinRoom(firestore, campaignId, roomId, user.uid);
      
      // Listen for other participants and create connections
      // (full implementation in actual code)
      
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to join voice:', error);
      throw error;
    }
  }, [manager, campaignId, roomId, user, firestore]);

  // Leave voice room
  const leave = useCallback(async () => {
    if (!manager) return;
    
    await voiceRoomService.leaveRoom(firestore, campaignId, roomId, user.uid);
    manager.cleanup();
    setIsConnected(false);
  }, [manager, campaignId, roomId, user, firestore]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (!manager || !manager.localStream) return;
    
    const audioTrack = manager.localStream.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    setIsMuted(!audioTrack.enabled);
    
    // Update Firestore
    voiceRoomService.updateParticipant(
      firestore, 
      campaignId, 
      roomId, 
      user.uid, 
      { isMuted: !audioTrack.enabled }
    );
  }, [manager, campaignId, roomId, user, firestore]);

  return {
    isConnected,
    isMuted,
    participants,
    audioLevels,
    join,
    leave,
    toggleMute
  };
}
```

#### 1.4 Voice Chat UI Component
```javascript
// src/components/Voice/VoiceChatPanel.js
import React from 'react';
import { useVoiceChat } from '../../hooks/useVoiceChat';
import { FaMicrophone, FaMicrophoneSlash, FaPhone, FaPhoneSlash } from 'react-icons/fa';
import './VoiceChatPanel.css';

function VoiceChatPanel({ campaignId, roomId = 'voice-general' }) {
  const {
    isConnected,
    isMuted,
    participants,
    audioLevels,
    join,
    leave,
    toggleMute
  } = useVoiceChat(campaignId, roomId);

  return (
    <div className="voice-chat-panel">
      <div className="voice-header">
        <h3>Voice Chat</h3>
        <span className="participant-count">{participants.length} connected</span>
      </div>

      <div className="voice-participants">
        {participants.map(participant => (
          <div 
            key={participant.userId}
            className={`participant ${participant.isSpeaking ? 'speaking' : ''}`}
          >
            <div className="participant-avatar">
              <img src={participant.photoURL} alt={participant.displayName} />
              {participant.isMuted && <FaMicrophoneSlash className="muted-icon" />}
            </div>
            <span className="participant-name">{participant.displayName}</span>
            <div 
              className="audio-level-bar"
              style={{ width: `${audioLevels[participant.userId] || 0}%` }}
            />
          </div>
        ))}
      </div>

      <div className="voice-controls">
        {!isConnected ? (
          <button className="btn-join-voice" onClick={join}>
            <FaPhone /> Join Voice
          </button>
        ) : (
          <>
            <button 
              className={`btn-toggle-mute ${isMuted ? 'muted' : ''}`}
              onClick={toggleMute}
            >
              {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
              {isMuted ? 'Unmute' : 'Mute'}
            </button>
            <button className="btn-leave-voice" onClick={leave}>
              <FaPhoneSlash /> Leave
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default VoiceChatPanel;
```

**Deliverables:**
- ✅ Working voice connections between 2 users
- ✅ Basic UI (join, leave, mute/unmute)
- ✅ Participant list with indicators
- ✅ Firebase signaling infrastructure

---

### Phase 2: Multi-Participant & Polish (Week 3-4)

**Goal:** Full mesh support and production-ready features

#### 2.1 Features
- ✅ **Full mesh network** - Connect to all participants automatically
- ✅ **Audio level detection** - Visual feedback for who's speaking
- ✅ **Connection quality indicators** - Show network health
- ✅ **Automatic reconnection** - Handle network drops gracefully
- ✅ **Browser compatibility** - Test on Chrome, Firefox, Safari, Edge
- ✅ **Mobile support** - iOS/Android voice chat
- ✅ **Notifications** - Sound when someone joins/leaves

#### 2.2 Audio Processing
```javascript
// Audio level detection using Web Audio API
class AudioLevelDetector {
  constructor(stream) {
    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    
    const source = this.audioContext.createMediaStreamSource(stream);
    source.connect(this.analyser);
    
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
  }

  getLevel() {
    this.analyser.getByteFrequencyData(this.dataArray);
    const average = this.dataArray.reduce((a, b) => a + b) / this.dataArray.length;
    return Math.min(100, (average / 128) * 100); // 0-100 scale
  }
}
```

#### 2.3 Connection Health Monitoring
```javascript
// Monitor connection quality
class ConnectionHealthMonitor {
  constructor(peerConnection) {
    this.pc = peerConnection;
  }

  async getStats() {
    const stats = await this.pc.getStats();
    let audioStats = {};
    
    stats.forEach(report => {
      if (report.type === 'inbound-rtp' && report.kind === 'audio') {
        audioStats = {
          packetsLost: report.packetsLost,
          jitter: report.jitter,
          bytesReceived: report.bytesReceived
        };
      }
    });
    
    return this.calculateQuality(audioStats);
  }

  calculateQuality(stats) {
    // Simple quality heuristic
    const lossRate = stats.packetsLost / (stats.packetsReceived + stats.packetsLost);
    
    if (lossRate < 0.02 && stats.jitter < 30) return 'excellent';
    if (lossRate < 0.05 && stats.jitter < 50) return 'good';
    if (lossRate < 0.10) return 'fair';
    return 'poor';
  }
}
```

**Deliverables:**
- ✅ Stable 4-6 person voice chat
- ✅ Visual indicators (speaking, audio levels)
- ✅ Network quality monitoring
- ✅ Mobile compatibility

---

### Phase 3: DM Controls & Advanced Features (Week 5-6)

**Goal:** Campaign-specific features and DM moderation

#### 3.1 DM Control Panel
```javascript
// src/components/Voice/VoiceDMControls.js
function VoiceDMControls({ campaignId, roomId, participants }) {
  const { user } = useFirebase();
  const { campaign } = useCampaign(campaignId);
  
  const isDM = campaign?.dmId === user?.uid;
  if (!isDM) return null;

  const muteParticipant = async (userId) => {
    // Force mute via Firestore
    await voiceRoomService.muteParticipant(campaignId, roomId, userId);
  };

  const kickParticipant = async (userId) => {
    await voiceRoomService.kickFromVoice(campaignId, roomId, userId);
  };

  return (
    <div className="voice-dm-controls">
      <h4>DM Controls</h4>
      {participants.map(p => (
        <div key={p.userId} className="dm-participant-control">
          <span>{p.displayName}</span>
          <button onClick={() => muteParticipant(p.userId)}>
            Force Mute
          </button>
          <button onClick={() => kickParticipant(p.userId)}>
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
```

#### 3.2 Push-to-Talk Mode
```javascript
// Push-to-talk implementation
function usePushToTalk(enabled) {
  const [isPushingToTalk, setIsPushingToTalk] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !e.repeat) {
        setIsPushingToTalk(true);
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        setIsPushingToTalk(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [enabled]);

  return isPushingToTalk;
}
```

#### 3.3 Session Recording (Optional)
```javascript
// Server-side recording with Cloud Functions
// functions/voiceRecording.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');
const storage = new Storage();

exports.startRecording = functions.https.onCall(async (data, context) => {
  const { campaignId, roomId } = data;
  const userId = context.auth.uid;
  
  // Verify user is DM
  const campaignDoc = await admin.firestore()
    .collection('campaigns')
    .doc(campaignId)
    .get();
    
  if (campaignDoc.data().dmId !== userId) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only the DM can start recording'
    );
  }
  
  // Create recording document
  const recordingRef = await admin.firestore()
    .collection('campaigns')
    .doc(campaignId)
    .collection('voiceRooms')
    .doc(roomId)
    .collection('recordings')
    .add({
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
      startedBy: userId,
      status: 'recording'
    });
    
  // Signal to clients to start recording locally
  // (WebRTC MediaRecorder API)
  await admin.database()
    .ref(`voiceSignaling/${campaignId}/${roomId}/recording`)
    .set({
      status: 'active',
      recordingId: recordingRef.id
    });
    
  return { recordingId: recordingRef.id };
});
```

**Deliverables:**
- ✅ DM can mute/kick participants
- ✅ Push-to-talk option
- ✅ Session recording capability
- ✅ Voice room settings UI

---

### Phase 4: Testing & Optimization (Week 7-8)

#### 4.1 Testing Checklist
- [ ] **Functionality Tests**
  - [ ] 2-person voice chat works
  - [ ] 4-person mesh network stable
  - [ ] 6-person stress test
  - [ ] Join/leave doesn't break others
  - [ ] Mute/unmute works correctly
  - [ ] DM controls work
  
- [ ] **Browser Compatibility**
  - [ ] Chrome (desktop & mobile)
  - [ ] Firefox (desktop & mobile)
  - [ ] Safari (desktop & iOS)
  - [ ] Edge

- [ ] **Network Conditions**
  - [ ] Good connection (low latency)
  - [ ] Poor connection (packet loss)
  - [ ] Intermittent connection (drops)
  - [ ] Firewall/NAT traversal

- [ ] **Security Tests**
  - [ ] Non-members can't join voice
  - [ ] Kicked users can't rejoin
  - [ ] DM-only controls enforced

#### 4.2 Performance Optimization
- Implement connection pooling
- Add ICE candidate filtering
- Optimize signaling frequency
- Reduce Firestore reads with caching

**Deliverables:**
- ✅ Comprehensive test coverage
- ✅ Performance benchmarks
- ✅ Bug-free experience
- ✅ Documentation

---

## Security & Permissions

### Firestore Security Rules

```javascript
// firestore.rules - Voice room access control
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Voice rooms within campaigns
    match /campaigns/{campaignId}/voiceRooms/{roomId} {
      // Only campaign members can read voice room
      allow read: if isCampaignMember(campaignId);
      
      // Only DM can create/delete voice rooms
      allow create, delete: if isCampaignDM(campaignId);
      
      // DM can update, others can update participant list
      allow update: if isCampaignDM(campaignId);
      
      // Voice room participants
      match /participants/{userId} {
        // Anyone in the voice room can read participants
        allow read: if isCampaignMember(campaignId);
        
        // Users can add themselves as participants
        allow create: if request.auth.uid == userId 
                      && isCampaignMember(campaignId);
        
        // Users can update their own participant data
        allow update: if request.auth.uid == userId;
        
        // Users can remove themselves, DM can remove anyone
        allow delete: if request.auth.uid == userId 
                      || isCampaignDM(campaignId);
      }
      
      // Recordings (DM only)
      match /recordings/{recordingId} {
        allow read: if isCampaignMember(campaignId);
        allow write: if isCampaignDM(campaignId);
      }
    }
    
    // Helper functions
    function isCampaignMember(campaignId) {
      return exists(/databases/$(database)/documents/campaigns/$(campaignId)/members/$(request.auth.uid));
    }
    
    function isCampaignDM(campaignId) {
      return get(/databases/$(database)/documents/campaigns/$(campaignId)).data.dmId == request.auth.uid;
    }
  }
}
```

### RTDB Security Rules

```json
// database.rules.json - Signaling security
{
  "rules": {
    "voiceSignaling": {
      "$campaignId": {
        "$roomId": {
          // Users can only write to their own signaling data
          "$userId": {
            ".read": "auth != null",
            ".write": "auth.uid === $userId"
          },
          // Connection status is readable by all in room
          "connections": {
            ".read": "auth != null"
          }
        }
      }
    }
  }
}
```

---

## Cost Analysis

### Firebase Free Tier (No Voice Chat)
- ✅ Firestore: 50K reads, 20K writes/day
- ✅ RTDB: 1GB storage, 10GB/month bandwidth
- ✅ Functions: 2M invocations/month
- ✅ Storage: 5GB, 1GB/day bandwidth

### With Mesh WebRTC Voice (Recommended)

**Additional Firebase Costs:** ~$0/month (within free tier)

**Breakdown:**
- **Signaling (RTDB):** ~1KB per ICE candidate × 20 candidates × 6 users = 120KB per session
  - 100 sessions/month = 12MB/month (well within 10GB free tier)
- **Metadata (Firestore):** ~10 writes per user join/leave
  - 100 sessions × 6 users × 10 writes = 6,000 writes/month (within 20K free tier)
- **Bandwidth:** All voice data is peer-to-peer (no Firebase bandwidth)

**Total Cost:** $0/month for typical usage ✅

---

### With SFU Server (Future Scaling)

**GCP Costs:** ~$30-50/month

**Breakdown:**
- **Cloud Run (SFU):** $0.024/vCPU-hour, $0.0025/GiB-hour
  - Estimated: 2 vCPU, 4GB RAM, running 100 hours/month = ~$15/month
- **Network Egress:** $0.12/GB (first 10GB free)
  - 6 users × 64kbps audio × 4 hours × 20 sessions = ~200GB/month = ~$22/month
- **Cloud Storage (recordings):** $0.026/GB/month
  - 10GB recordings = ~$0.26/month

**Total Cost:** ~$37/month for dedicated SFU ✅

---

### Third-Party Service (Agora/Twilio)

**Monthly Costs:** ~$10-40/month

**Breakdown:**
- **Per-minute pricing:** $0.0015 - $0.004/participant/minute
- **Typical campaign:** 5 players × 4 hours × 4 sessions/month = 4,800 minutes
- **Cost:** 4,800 min × $0.002/min = $9.60/month

**Total Cost:** ~$10-15/month for typical campaign 💰

---

## Alternative Approaches

### Option A: Discord Integration
**Pros:**
- Already built
- Excellent quality
- Free for users
- Familiar interface

**Cons:**
- External dependency
- Users must have Discord
- Less integrated experience
- Can't customize

**Verdict:** 🤔 Good fallback if voice is delayed

---

### Option B: Hybrid Approach
Start with Discord integration, then build native voice later

**Phase 1:** Add Discord webhook/bot for voice channel creation
**Phase 2:** Build native WebRTC voice (this document)

---

## Future Enhancements

### Phase 5+ (Post-Launch)

1. **Video Chat** (DM camera for battlemap)
   - Same WebRTC infrastructure
   - Optional video tracks
   - Bandwidth-conscious (toggle off when not needed)

2. **Spatial Audio** (RPG immersion)
   - Web Audio API panning
   - Characters in voice "move" based on in-game position
   - Volume based on distance

3. **Voice Activity Detection (VAD)**
   - Auto-mute when not speaking
   - Reduce bandwidth
   - Better UX

4. **AI Transcription** (Session notes)
   - Google Cloud Speech-to-Text
   - Real-time transcription
   - Searchable session logs

5. **Sound Effects & Music**
   - DM can play ambient music to all
   - Sound effects for dramatic moments
   - Shared audio experience

6. **Voice Commands** (RPG integration)
   - "Roll initiative" → triggers in-app dice
   - "Add character note" → creates note
   - Siri/Alexa style for hands-free

---

## Migration Path from Current System

### Integration Points

1. **Campaign Context** (already exists)
   - Voice rooms scoped to `campaignId`
   - Uses existing `campaign/members` for permissions
   - Reuses channel concept (text + voice channels)

2. **User Profiles** (already exists)
   - Uses existing `userProfiles` for display names/avatars
   - Voice participant data links to profiles
   - Same authentication flow

3. **Presence System** (already exists with RTDB)
   - Extend existing RTDB presence for voice status
   - Show "In Voice" indicator in chat
   - Update typing indicators to include voice status

4. **Chat Integration**
   - Voice activity shows in text chat ("Alice joined voice")
   - Share recordings in chat
   - Voice-to-text snippets as messages

### Backwards Compatibility

- ✅ Voice is opt-in (campaigns work without it)
- ✅ Falls back gracefully if browser doesn't support WebRTC
- ✅ No changes to existing chat/message schema
- ✅ Progressive enhancement approach

---

## Implementation Checklist

### Pre-Development
- [ ] Review WebRTC fundamentals
- [ ] Test WebRTC in target browsers
- [ ] Setup Firebase RTDB rules for signaling
- [ ] Research STUN/TURN server options

### Phase 1: Foundation
- [ ] Create `webrtcManager.js` utility
- [ ] Create `signalingService.js` utility  
- [ ] Create `useVoiceChat` hook
- [ ] Build basic UI components
- [ ] Test 2-person voice connection
- [ ] Add Firestore voice room schema
- [ ] Update security rules

### Phase 2: Multi-Participant
- [ ] Implement full mesh networking
- [ ] Add audio level detection
- [ ] Add connection quality monitoring
- [ ] Test on multiple devices/browsers
- [ ] Mobile compatibility testing
- [ ] Implement auto-reconnection

### Phase 3: Features
- [ ] Build DM control panel
- [ ] Add push-to-talk mode
- [ ] Implement recording (optional)
- [ ] Voice notifications
- [ ] Settings UI (quality, echo cancellation)

### Phase 4: Polish
- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Documentation
- [ ] User guide/tutorial
- [ ] Beta testing with real campaigns

---

## Recommended Development Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| **Research & Planning** | 1 week | This document + prototypes |
| **Phase 1: Foundation** | 2 weeks | Basic 2-person voice |
| **Phase 2: Multi-participant** | 2 weeks | Stable 4-6 person mesh |
| **Phase 3: Features** | 2 weeks | DM controls + polish |
| **Phase 4: Testing** | 2 weeks | Production-ready |
| **Total** | **9 weeks** | Launch-ready voice chat |

---

## Success Metrics

### Technical Metrics
- ✅ Connection success rate >95%
- ✅ Audio latency <200ms
- ✅ Packet loss <5%
- ✅ Reconnection time <10s
- ✅ Support 6 simultaneous users

### User Metrics
- ✅ Voice adoption rate >50% of campaigns
- ✅ Average session length >2 hours
- ✅ User satisfaction rating >4/5
- ✅ <1% support tickets related to voice

---

## Conclusion

**Recommendation:** Implement Mesh WebRTC with Firebase signaling (Phase 1-4)

**Rationale:**
1. ✅ **Zero ongoing costs** - Uses existing Firebase free tier
2. ✅ **Perfect for D&D** - 4-6 players is ideal for mesh topology
3. ✅ **Full control** - Customize for RPG-specific features
4. ✅ **Scalable** - Can add SFU later if campaigns grow
5. ✅ **9-week timeline** - Realistic scope for quality implementation

**Next Steps:**
1. Review this document with team
2. Prototype basic WebRTC connection (2-3 days)
3. Validate signaling approach with Firebase RTDB
4. Begin Phase 1 implementation
5. Set up staging environment for testing

---

## Resources & References

### Documentation
- [WebRTC Documentation](https://webrtc.org/getting-started/overview)
- [Firebase RTDB Guide](https://firebase.google.com/docs/database)
- [MDN WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)

### Libraries
- [simple-peer](https://github.com/feross/simple-peer) - WebRTC wrapper
- [peerjs](https://peerjs.com/) - Simplified WebRTC
- [mediasoup](https://mediasoup.org/) - SFU for scaling (Phase 5+)

### Example Projects
- [WebRTC Samples](https://webrtc.github.io/samples/)
- [Firebase WebRTC Codelab](https://webrtc.org/getting-started/firebase-rtc-codelab)

### Testing Tools
- [WebRTC Stats](https://github.com/fippo/webrtc-stats)
- [WebRTC Troubleshooter](https://test.webrtc.org/)

---

**Document Version:** 1.0  
**Last Updated:** September 30, 2025  
**Author:** GitHub Copilot  
**Status:** DRAFT - Ready for Discussion
