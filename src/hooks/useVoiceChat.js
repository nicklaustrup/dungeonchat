/**
 * useVoiceChat Hook
 * Main hook for managing voice chat in a campaign
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useFirebase } from '../services/FirebaseContext';
import { WebRTCManager } from '../services/voice/webrtcManager';
import { SignalingService } from '../services/voice/signalingService';
import * as voiceRoomService from '../services/voice/voiceRoomService';

export function useVoiceChat(campaignId, roomId = 'voice-general') {
  const { rtdb, firestore, user } = useFirebase();
  
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [audioLevels, setAudioLevels] = useState({});
  const [connectionStates, setConnectionStates] = useState({});
  const [error, setError] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // Add remote streams state
  
  const managerRef = useRef(null);
  const signalingRef = useRef(null);
  const unsubscribersRef = useRef([]);
  const audioContextRef = useRef(null);
  const analysersRef = useRef(new Map());

  /**
   * Setup audio level detection for a stream
   */
  const setupAudioLevelDetection = useCallback((userId, stream) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyser);
      
      analysersRef.current.set(userId, analyser);
      
      // Start monitoring audio levels
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const checkAudioLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const normalized = Math.min(100, (average / 128) * 100);
        
        setAudioLevels(prev => ({
          ...prev,
          [userId]: normalized
        }));
      };
      
      const intervalId = setInterval(checkAudioLevel, 100);
      
      return () => clearInterval(intervalId);
    } catch (error) {
      console.error(`[useVoiceChat] Error setting up audio level detection:`, error);
    }
  }, []);

  /**
   * Cleanup all connections and resources
   */
  const cleanup = useCallback(() => {
    unsubscribersRef.current.forEach(unsubscribe => unsubscribe());
    unsubscribersRef.current = [];
    
    if (managerRef.current) {
      managerRef.current.cleanup();
    }
    
    if (signalingRef.current) {
      signalingRef.current.cleanup(campaignId, roomId, user?.uid);
    }
    
    analysersRef.current.clear();
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setRemoteStreams({});
  }, [campaignId, roomId, user?.uid]);

  // Initialize services
  useEffect(() => {
    if (!user || !campaignId || !rtdb || !firestore) return;
    
    // Create signaling service
    signalingRef.current = new SignalingService(rtdb);
    
    // Create WebRTC manager
    managerRef.current = new WebRTCManager(
      user.uid,
      campaignId,
      roomId,
      signalingRef.current
    );
    
    // Set up callbacks
    managerRef.current.onRemoteStream = (userId, stream) => {
      console.log(`[useVoiceChat] Received remote stream from ${userId}`);
      setRemoteStreams(prev => ({ ...prev, [userId]: stream }));
      setupAudioLevelDetection(userId, stream);
    };
    
    managerRef.current.onConnectionStateChange = (userId, state) => {
      setConnectionStates(prev => ({
        ...prev,
        [userId]: state
      }));
    };
    
    managerRef.current.onError = (errorType, errorDetails) => {
      console.error(`[useVoiceChat] Error: ${errorType}`, errorDetails);
      setError({ type: errorType, details: errorDetails });
    };
    
    return () => {
      cleanup();
    };
  }, [user, campaignId, roomId, rtdb, firestore, setupAudioLevelDetection, cleanup]);

  // Listen to participants
  useEffect(() => {
    if (!firestore || !campaignId || !roomId) return;
    
    const unsubscribe = voiceRoomService.listenToParticipants(
      firestore,
      campaignId,
      roomId,
      (participantList) => {
        setParticipants(participantList);
      }
    );
    
    unsubscribersRef.current.push(unsubscribe);
    return () => unsubscribe();
  }, [firestore, campaignId, roomId]);

  /**
   * Join voice chat
   */
  const join = useCallback(async () => {
    if (!managerRef.current || !signalingRef.current || !user) {
      console.error('[useVoiceChat] Services not initialized');
      return;
    }
    
    setIsConnecting(true);
    setError(null);
    
    try {
      // Initialize local microphone stream
      await managerRef.current.initLocalStream();
      
      // Ensure voice room exists
      await voiceRoomService.createVoiceRoom(firestore, campaignId, roomId, {
        createdBy: user.uid
      });
      
      // Join room in Firestore (it will fetch user profile and character data automatically)
      await voiceRoomService.joinRoom(firestore, campaignId, roomId, user.uid, {
        role: 'player' // This should come from campaign membership
      });
      
      // Update presence in RTDB
      await signalingRef.current.updatePresence(campaignId, roomId, user.uid, 'online');
      
      // Listen for signaling messages
      signalingRef.current.listenForOffers(campaignId, roomId, user.uid, (fromUser, offer) => {
        console.log(`[useVoiceChat] Received offer from ${fromUser}`);
        managerRef.current.handleOffer(fromUser, offer);
      });
      
      signalingRef.current.listenForAnswers(campaignId, roomId, user.uid, (fromUser, answer) => {
        console.log(`[useVoiceChat] Received answer from ${fromUser}`);
        managerRef.current.handleAnswer(fromUser, answer);
      });
      
      signalingRef.current.listenForIceCandidates(campaignId, roomId, user.uid, (fromUser, candidate) => {
        managerRef.current.handleIceCandidate(fromUser, candidate);
      });
      
      // Connect to existing participants
      const existingParticipants = await voiceRoomService.getParticipants(firestore, campaignId, roomId);
      for (const participant of existingParticipants) {
        if (participant.userId !== user.uid) {
          console.log(`[useVoiceChat] Sending offer to ${participant.userId}`);
          await managerRef.current.sendOffer(participant.userId);
        }
      }
      
      setIsConnected(true);
      setIsConnecting(false);
      console.log('[useVoiceChat] Successfully joined voice chat');
      
    } catch (error) {
      console.error('[useVoiceChat] Failed to join voice chat:', error);
      setError({ type: 'join_failed', details: error });
      setIsConnecting(false);
    }
  }, [managerRef, signalingRef, user, firestore, campaignId, roomId]);

  /**
   * Leave voice chat
   */
  const leave = useCallback(async () => {
    if (!managerRef.current || !signalingRef.current || !user) return;
    
    try {
      // Update presence
      await signalingRef.current.updatePresence(campaignId, roomId, user.uid, 'offline');
      
      // Leave room in Firestore
      await voiceRoomService.leaveRoom(firestore, campaignId, roomId, user.uid);
      
      // Clean up signaling data
      await signalingRef.current.cleanup(campaignId, roomId, user.uid);
      
      // Clean up WebRTC connections
      managerRef.current.cleanup();
      
      // Clean up audio analysers
      analysersRef.current.clear();
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
      setIsConnected(false);
      setConnectionStates({});
      setAudioLevels({});
      
      console.log('[useVoiceChat] Left voice chat');
    } catch (error) {
      console.error('[useVoiceChat] Error leaving voice chat:', error);
    }
  }, [managerRef, signalingRef, user, firestore, campaignId, roomId]);

  /**
   * Toggle mute
   */
  const toggleMute = useCallback(() => {
    if (!managerRef.current) return;
    
    const newMutedState = !isMuted;
    managerRef.current.setMuted(newMutedState);
    setIsMuted(newMutedState);
    
    // Update Firestore
    if (user) {
      voiceRoomService.updateParticipant(firestore, campaignId, roomId, user.uid, {
        isMuted: newMutedState
      });
    }
  }, [managerRef, isMuted, user, firestore, campaignId, roomId]);

  return {
    isConnected,
    isConnecting,
    isMuted,
    participants,
    audioLevels,
    connectionStates,
    remoteStreams, // Expose remote streams
    error,
    join,
    leave,
    toggleMute
  };
}
