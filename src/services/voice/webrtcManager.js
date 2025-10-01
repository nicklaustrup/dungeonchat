/**
 * WebRTC Manager
 * Manages peer-to-peer WebRTC connections for voice chat
 */

import { getWebRTCConfig, getAudioConstraints } from './webrtcConfig';

export class WebRTCManager {
  constructor(userId, campaignId, roomId, signalingService) {
    this.userId = userId;
    this.campaignId = campaignId;
    this.roomId = roomId;
    this.signalingService = signalingService;
    
    this.connections = new Map(); // userId -> RTCPeerConnection
    this.remoteStreams = new Map(); // userId -> MediaStream
    this.localStream = null;
    
    // Callbacks
    this.onRemoteStream = null; // Callback when remote stream is received
    this.onConnectionStateChange = null; // Callback for connection state changes
    this.onError = null; // Callback for errors
  }

  /**
   * Initialize local microphone stream
   */
  async initLocalStream() {
    try {
      const constraints = getAudioConstraints();
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('[WebRTC] Local stream initialized');
      return this.localStream;
    } catch (error) {
      console.error('[WebRTC] Failed to get local stream:', error);
      if (this.onError) {
        this.onError('microphone_access_denied', error);
      }
      throw error;
    }
  }

  /**
   * Create a peer connection to a remote user
   */
  async createPeerConnection(remoteUserId, isInitiator = false) {
    if (this.connections.has(remoteUserId)) {
      console.log(`[WebRTC] Connection to ${remoteUserId} already exists`);
      return this.connections.get(remoteUserId);
    }

    const config = getWebRTCConfig();
    const pc = new RTCPeerConnection(config);
    
    // Add local tracks to the connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream);
        console.log(`[WebRTC] Added local track to connection with ${remoteUserId}`);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`[WebRTC] Sending ICE candidate to ${remoteUserId}`);
        this.signalingService.sendIceCandidate(
          this.campaignId,
          this.roomId,
          this.userId,
          remoteUserId,
          event.candidate
        );
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log(`[WebRTC] Received remote track from ${remoteUserId}`);
      const [remoteStream] = event.streams;
      this.remoteStreams.set(remoteUserId, remoteStream);
      
      if (this.onRemoteStream) {
        this.onRemoteStream(remoteUserId, remoteStream);
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection state with ${remoteUserId}: ${pc.connectionState}`);
      
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(remoteUserId, pc.connectionState);
      }

      // Clean up failed/closed connections
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.closeConnection(remoteUserId);
      }
    };

    // Handle ICE connection state changes
    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC] ICE state with ${remoteUserId}: ${pc.iceConnectionState}`);
    };

    this.connections.set(remoteUserId, pc);
    console.log(`[WebRTC] Created peer connection with ${remoteUserId} (initiator: ${isInitiator})`);
    
    return pc;
  }

  /**
   * Send an offer to a remote peer (initiator side)
   */
  async sendOffer(remoteUserId) {
    try {
      const pc = await this.createPeerConnection(remoteUserId, true);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      await this.signalingService.sendOffer(
        this.campaignId,
        this.roomId,
        this.userId,
        remoteUserId,
        offer
      );
      
      console.log(`[WebRTC] Sent offer to ${remoteUserId}`);
    } catch (error) {
      console.error(`[WebRTC] Failed to send offer to ${remoteUserId}:`, error);
      if (this.onError) {
        this.onError('offer_failed', error);
      }
    }
  }

  /**
   * Handle an incoming offer from a remote peer
   * Implements "polite peer" pattern to handle glare conditions
   */
  async handleOffer(remoteUserId, offer) {
    try {
      // Determine if we are the "polite" peer (lexicographically smaller userId)
      const isPolite = this.userId < remoteUserId;
      
      let pc = this.connections.get(remoteUserId);
      
      // Check for glare condition (both sides sent offers)
      const offerCollision = pc && 
        (pc.signalingState === 'have-local-offer' || pc.signalingState === 'stable');
      
      if (offerCollision) {
        console.log(`[WebRTC] Offer collision detected with ${remoteUserId}, isPolite: ${isPolite}`);
        
        if (isPolite) {
          // Polite peer: rollback and accept the incoming offer
          console.log(`[WebRTC] Rolling back local offer for ${remoteUserId}`);
          await pc.setLocalDescription({type: 'rollback'});
        } else {
          // Impolite peer: ignore the incoming offer, wait for answer to our offer
          console.log(`[WebRTC] Ignoring incoming offer from ${remoteUserId} (we are impolite)`);
          return;
        }
      }
      
      // Create connection if it doesn't exist
      if (!pc) {
        pc = await this.createPeerConnection(remoteUserId, false);
      }
      
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      await this.signalingService.sendAnswer(
        this.campaignId,
        this.roomId,
        this.userId,
        remoteUserId,
        answer
      );
      
      console.log(`[WebRTC] Handled offer and sent answer to ${remoteUserId}`);
    } catch (error) {
      console.error(`[WebRTC] Failed to handle offer from ${remoteUserId}:`, error);
      if (this.onError) {
        this.onError('answer_failed', error);
      }
    }
  }

  /**
   * Handle an incoming answer from a remote peer
   */
  async handleAnswer(remoteUserId, answer) {
    try {
      const pc = this.connections.get(remoteUserId);
      if (!pc) {
        console.error(`[WebRTC] No connection found for ${remoteUserId}`);
        return;
      }
      
      // Only set remote description if we're expecting an answer
      if (pc.signalingState !== 'have-local-offer') {
        console.warn(`[WebRTC] Received answer from ${remoteUserId} but not in correct state (${pc.signalingState}), ignoring`);
        return;
      }
      
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      console.log(`[WebRTC] Handled answer from ${remoteUserId}`);
    } catch (error) {
      console.error(`[WebRTC] Failed to handle answer from ${remoteUserId}:`, error);
      if (this.onError) {
        this.onError('answer_handling_failed', error);
      }
    }
  }

  /**
   * Handle an incoming ICE candidate
   */
  async handleIceCandidate(remoteUserId, candidate) {
    try {
      const pc = this.connections.get(remoteUserId);
      if (!pc) {
        console.error(`[WebRTC] No connection found for ${remoteUserId}`);
        return;
      }
      
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
      console.log(`[WebRTC] Added ICE candidate from ${remoteUserId}`);
    } catch (error) {
      console.error(`[WebRTC] Failed to add ICE candidate from ${remoteUserId}:`, error);
    }
  }

  /**
   * Get connection state for a specific peer
   */
  getConnectionState(remoteUserId) {
    const pc = this.connections.get(remoteUserId);
    return pc ? pc.connectionState : 'not-connected';
  }

  /**
   * Get all active connection states
   */
  getAllConnectionStates() {
    const states = {};
    this.connections.forEach((pc, userId) => {
      states[userId] = pc.connectionState;
    });
    return states;
  }

  /**
   * Mute/unmute local audio
   */
  setMuted(muted) {
    if (!this.localStream) return;
    
    this.localStream.getAudioTracks().forEach(track => {
      track.enabled = !muted;
    });
    
    console.log(`[WebRTC] Local audio ${muted ? 'muted' : 'unmuted'}`);
  }

  /**
   * Check if local audio is muted
   */
  isMuted() {
    if (!this.localStream) return true;
    
    const audioTrack = this.localStream.getAudioTracks()[0];
    return audioTrack ? !audioTrack.enabled : true;
  }

  /**
   * Close a specific peer connection
   */
  closeConnection(remoteUserId) {
    const pc = this.connections.get(remoteUserId);
    if (pc) {
      pc.close();
      this.connections.delete(remoteUserId);
      this.remoteStreams.delete(remoteUserId);
      console.log(`[WebRTC] Closed connection with ${remoteUserId}`);
    }
  }

  /**
   * Clean up all connections and streams
   */
  cleanup() {
    console.log('[WebRTC] Cleaning up all connections');
    
    // Close all peer connections
    this.connections.forEach((pc, userId) => {
      pc.close();
      console.log(`[WebRTC] Closed connection with ${userId}`);
    });
    this.connections.clear();
    this.remoteStreams.clear();
    
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
      });
      this.localStream = null;
      console.log('[WebRTC] Stopped local stream');
    }
  }

  /**
   * Get statistics for a peer connection
   */
  async getConnectionStats(remoteUserId) {
    const pc = this.connections.get(remoteUserId);
    if (!pc) return null;

    const stats = await pc.getStats();
    const audioStats = {};
    
    stats.forEach(report => {
      if (report.type === 'inbound-rtp' && report.kind === 'audio') {
        audioStats.inbound = {
          packetsLost: report.packetsLost || 0,
          packetsReceived: report.packetsReceived || 0,
          jitter: report.jitter || 0,
          bytesReceived: report.bytesReceived || 0
        };
      } else if (report.type === 'outbound-rtp' && report.kind === 'audio') {
        audioStats.outbound = {
          packetsSent: report.packetsSent || 0,
          bytesSent: report.bytesSent || 0
        };
      }
    });
    
    return audioStats;
  }
}
