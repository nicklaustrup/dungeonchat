/**
 * WebRTC Manager
 * Manages peer-to-peer WebRTC connections for voice chat
 */

import { getWebRTCConfig, getAudioConstraints } from "./webrtcConfig";
import { ConnectionHealthMonitor } from "./connectionHealthMonitor";

export class WebRTCManager {
  constructor(userId, campaignId, roomId, signalingService) {
    this.userId = userId;
    this.campaignId = campaignId;
    this.roomId = roomId;
    this.signalingService = signalingService;

    this.connections = new Map(); // userId -> RTCPeerConnection
    this.remoteStreams = new Map(); // userId -> MediaStream
    this.localStream = null;
    this.reconnectionAttempts = new Map(); // userId -> attempt count
    this.reconnectionTimers = new Map(); // userId -> timeout id
    this.healthMonitors = new Map(); // userId -> ConnectionHealthMonitor

    // Callbacks
    this.onRemoteStream = null; // Callback when remote stream is received
    this.onConnectionStateChange = null; // Callback for connection state changes
    this.onError = null; // Callback for errors
    this.onReconnecting = null; // Callback when reconnection starts
    this.onReconnected = null; // Callback when reconnection succeeds
    this.onConnectionQuality = null; // Callback for quality updates
  }

  /**
   * Initialize local microphone stream
   */
  async initLocalStream() {
    try {
      const constraints = getAudioConstraints();
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("[WebRTC] Local stream initialized");
      return this.localStream;
    } catch (error) {
      console.error("[WebRTC] Failed to get local stream:", error);
      if (this.onError) {
        this.onError("microphone_access_denied", error);
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
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream);
        console.log(
          `[WebRTC] Added local track to connection with ${remoteUserId}`
        );
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
      console.log(
        `[WebRTC] Connection state with ${remoteUserId}: ${pc.connectionState}`
      );

      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(remoteUserId, pc.connectionState);
      }

      // Handle failed connections with automatic reconnection
      if (pc.connectionState === "failed") {
        console.log(
          `[WebRTC] Connection failed with ${remoteUserId}, attempting reconnection`
        );
        this.attemptReconnection(remoteUserId);
      } else if (pc.connectionState === "connected") {
        // Reset reconnection attempts on successful connection
        this.reconnectionAttempts.set(remoteUserId, 0);
        if (this.onReconnected) {
          this.onReconnected(remoteUserId);
        }

        // Start monitoring connection health
        this.startHealthMonitoring(remoteUserId);
      } else if (pc.connectionState === "closed") {
        this.closeConnection(remoteUserId);
      }
    };

    // Handle ICE connection state changes
    pc.oniceconnectionstatechange = () => {
      console.log(
        `[WebRTC] ICE state with ${remoteUserId}: ${pc.iceConnectionState}`
      );
    };

    this.connections.set(remoteUserId, pc);
    console.log(
      `[WebRTC] Created peer connection with ${remoteUserId} (initiator: ${isInitiator})`
    );

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
        this.onError("offer_failed", error);
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
      const offerCollision =
        pc &&
        (pc.signalingState === "have-local-offer" ||
          pc.signalingState === "stable");

      if (offerCollision) {
        console.log(
          `[WebRTC] Offer collision detected with ${remoteUserId}, isPolite: ${isPolite}`
        );

        if (isPolite) {
          // Polite peer: rollback and accept the incoming offer
          console.log(`[WebRTC] Rolling back local offer for ${remoteUserId}`);
          await pc.setLocalDescription({ type: "rollback" });
        } else {
          // Impolite peer: ignore the incoming offer, wait for answer to our offer
          console.log(
            `[WebRTC] Ignoring incoming offer from ${remoteUserId} (we are impolite)`
          );
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
      console.error(
        `[WebRTC] Failed to handle offer from ${remoteUserId}:`,
        error
      );
      if (this.onError) {
        this.onError("answer_failed", error);
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
        console.warn(
          `[WebRTC] No connection found for ${remoteUserId} when handling answer`
        );
        return;
      }

      // Check if we're in the correct state to receive an answer
      if (pc.signalingState !== "have-local-offer") {
        console.warn(
          `[WebRTC] Received answer from ${remoteUserId} but in wrong state: ` +
            `${pc.signalingState} (expected: have-local-offer). Ignoring.`
        );
        return;
      }

      // Additional check: if remoteDescription is already set, this is a duplicate
      if (pc.remoteDescription && pc.remoteDescription.type === "answer") {
        console.warn(
          `[WebRTC] Remote answer already set for ${remoteUserId}, ` +
            `ignoring duplicate answer`
        );
        return;
      }

      console.log(
        `[WebRTC] Setting remote answer from ${remoteUserId}, ` +
          `state: ${pc.signalingState}`
      );

      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      console.log(
        `[WebRTC] Successfully handled answer from ${remoteUserId}, ` +
          `new state: ${pc.signalingState}`
      );
    } catch (error) {
      console.error(
        `[WebRTC] Failed to handle answer from ${remoteUserId}:`,
        error.name,
        error.message
      );

      // Don't report InvalidStateError to user - it's usually benign
      if (error.name !== "InvalidStateError" && this.onError) {
        this.onError("answer_handling_failed", error);
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
      console.error(
        `[WebRTC] Failed to add ICE candidate from ${remoteUserId}:`,
        error
      );
    }
  }

  /**
   * Get connection state for a specific peer
   */
  getConnectionState(remoteUserId) {
    const pc = this.connections.get(remoteUserId);
    return pc ? pc.connectionState : "not-connected";
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

    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = !muted;
    });

    console.log(`[WebRTC] Local audio ${muted ? "muted" : "unmuted"}`);
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
   * Attempt to reconnect to a remote peer with exponential backoff
   */
  async attemptReconnection(remoteUserId) {
    const maxAttempts = 5;
    const currentAttempts = this.reconnectionAttempts.get(remoteUserId) || 0;

    // Check if we've exceeded max attempts
    if (currentAttempts >= maxAttempts) {
      console.error(
        `[WebRTC] Max reconnection attempts reached for ${remoteUserId}`
      );
      if (this.onError) {
        this.onError(
          "reconnection_failed",
          new Error(
            `Failed to reconnect to ${remoteUserId} after ${maxAttempts} attempts`
          )
        );
      }
      this.clearReconnectionTimer(remoteUserId);
      return;
    }

    // Clear any existing timer
    this.clearReconnectionTimer(remoteUserId);

    // Calculate backoff delay (1s, 2s, 4s, 8s, 16s)
    const delay = Math.pow(2, currentAttempts) * 1000;
    console.log(
      `[WebRTC] Reconnecting to ${remoteUserId} in ${delay}ms (attempt ${currentAttempts + 1}/${maxAttempts})`
    );

    // Notify UI of reconnection attempt
    if (this.onReconnecting) {
      this.onReconnecting(remoteUserId, currentAttempts + 1, maxAttempts);
    }

    // Schedule reconnection attempt
    const timer = setTimeout(async () => {
      try {
        console.log(
          `[WebRTC] Executing reconnection attempt ${currentAttempts + 1} for ${remoteUserId}`
        );

        // Update attempt counter
        this.reconnectionAttempts.set(remoteUserId, currentAttempts + 1);

        // Close the old connection
        this.closeConnection(remoteUserId);

        // Create a new connection and send an offer
        await this.sendOffer(remoteUserId);

        console.log(`[WebRTC] Reconnection offer sent to ${remoteUserId}`);
      } catch (error) {
        console.error(
          `[WebRTC] Reconnection attempt ${currentAttempts + 1} failed for ${remoteUserId}:`,
          error
        );
        // The connection state change handler will trigger another attempt if still failed
      }
    }, delay);

    this.reconnectionTimers.set(remoteUserId, timer);
  }

  /**
   * Clear reconnection timer for a user
   */
  clearReconnectionTimer(remoteUserId) {
    const timer = this.reconnectionTimers.get(remoteUserId);
    if (timer) {
      clearTimeout(timer);
      this.reconnectionTimers.delete(remoteUserId);
    }
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

    // Stop health monitoring
    this.stopHealthMonitoring(remoteUserId);

    // Clear any reconnection state
    this.clearReconnectionTimer(remoteUserId);
    this.reconnectionAttempts.delete(remoteUserId);
  }

  /**
   * Clean up all connections and streams
   */
  cleanup() {
    console.log("[WebRTC] Cleaning up all connections");

    // Stop all health monitoring
    this.healthMonitors.forEach((monitor) => {
      monitor.stopMonitoring();
    });
    this.healthMonitors.clear();

    // Clear all reconnection timers
    this.reconnectionTimers.forEach((timer) => {
      clearTimeout(timer);
    });
    this.reconnectionTimers.clear();
    this.reconnectionAttempts.clear();

    // Close all peer connections
    this.connections.forEach((pc, userId) => {
      pc.close();
      console.log(`[WebRTC] Closed connection with ${userId}`);
    });
    this.connections.clear();
    this.remoteStreams.clear();

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        track.stop();
      });
      this.localStream = null;
      console.log("[WebRTC] Stopped local stream");
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

    stats.forEach((report) => {
      if (report.type === "inbound-rtp" && report.kind === "audio") {
        audioStats.inbound = {
          packetsLost: report.packetsLost || 0,
          packetsReceived: report.packetsReceived || 0,
          jitter: report.jitter || 0,
          bytesReceived: report.bytesReceived || 0,
        };
      } else if (report.type === "outbound-rtp" && report.kind === "audio") {
        audioStats.outbound = {
          packetsSent: report.packetsSent || 0,
          bytesSent: report.bytesSent || 0,
        };
      }
    });

    return audioStats;
  }

  /**
   * Start monitoring connection health for a peer
   */
  startHealthMonitoring(remoteUserId) {
    const pc = this.connections.get(remoteUserId);
    if (!pc) return;

    // Stop existing monitor if any
    this.stopHealthMonitoring(remoteUserId);

    // Create new health monitor
    const monitor = new ConnectionHealthMonitor(pc);
    this.healthMonitors.set(remoteUserId, monitor);

    // Start monitoring with callback
    monitor.startMonitoring((quality) => {
      console.log(`[WebRTC] Connection quality for ${remoteUserId}:`, quality);

      // Notify UI of quality changes
      if (this.onConnectionQuality) {
        this.onConnectionQuality(remoteUserId, quality);
      }

      // Trigger reconnection if connection becomes unhealthy
      if (!monitor.isHealthy()) {
        console.warn(
          `[WebRTC] Unhealthy connection detected for ${remoteUserId}`
        );
        // Let the connection state handler deal with reconnection
      }
    });

    console.log(`[WebRTC] Started health monitoring for ${remoteUserId}`);
  }

  /**
   * Stop monitoring connection health for a peer
   */
  stopHealthMonitoring(remoteUserId) {
    const monitor = this.healthMonitors.get(remoteUserId);
    if (monitor) {
      monitor.stopMonitoring();
      this.healthMonitors.delete(remoteUserId);
      console.log(`[WebRTC] Stopped health monitoring for ${remoteUserId}`);
    }
  }

  /**
   * Get connection quality for a specific peer
   */
  getConnectionQuality(remoteUserId) {
    const monitor = this.healthMonitors.get(remoteUserId);
    return monitor ? monitor.getConnectionQuality() : null;
  }

  /**
   * Get quality for all monitored connections
   */
  getAllConnectionQualities() {
    const qualities = {};
    this.healthMonitors.forEach((monitor, userId) => {
      qualities[userId] = monitor.getConnectionQuality();
    });
    return qualities;
  }
}
