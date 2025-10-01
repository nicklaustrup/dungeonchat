import { 
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';

/**
 * Session Service - Manages campaign session notes and summaries
 * Handles CRUD operations for session data, DM notes, and session history
 */

export const sessionService = {
  // Get reference to a specific session document
  getSessionRef: (firestore, campaignId, sessionId) => {
    return doc(firestore, 'campaigns', campaignId, 'sessions', sessionId);
  },

  // Get reference to sessions collection
  getSessionsCollectionRef: (firestore, campaignId) => {
    return collection(firestore, 'campaigns', campaignId, 'sessions');
  },

  // Create a new session
  createSession: async (firestore, campaignId, sessionData) => {
    try {
      const sessionsRef = sessionService.getSessionsCollectionRef(firestore, campaignId);
      
      // Generate session ID
      const sessionId = `session_${Date.now()}`;
      const sessionRef = doc(sessionsRef, sessionId);
      
      const newSession = {
        ...sessionData,
        createdAt: serverTimestamp(),
        lastModified: serverTimestamp()
      };
      
      await setDoc(sessionRef, newSession);
      return { id: sessionId, ...newSession };
    } catch (error) {
      console.error('Error creating session:', error);
      throw new Error('Failed to create session');
    }
  },

  // Get a specific session
  getSession: async (firestore, campaignId, sessionId) => {
    try {
      const sessionRef = sessionService.getSessionRef(firestore, campaignId, sessionId);
      const sessionSnap = await getDoc(sessionRef);
      
      if (sessionSnap.exists()) {
        return { id: sessionSnap.id, ...sessionSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting session:', error);
      throw new Error('Failed to load session');
    }
  },

  // Get all sessions for a campaign
  getSessions: async (firestore, campaignId, limitCount = 50) => {
    try {
      const sessionsRef = sessionService.getSessionsCollectionRef(firestore, campaignId);
      const q = query(
        sessionsRef,
        orderBy('sessionNumber', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const sessions = [];
      
      querySnapshot.forEach((doc) => {
        sessions.push({ id: doc.id, ...doc.data() });
      });
      
      return sessions;
    } catch (error) {
      console.error('Error getting sessions:', error);
      throw new Error('Failed to load sessions');
    }
  },

  // Update session data
  updateSession: async (firestore, campaignId, sessionId, updates) => {
    try {
      const sessionRef = sessionService.getSessionRef(firestore, campaignId, sessionId);
      
      await updateDoc(sessionRef, {
        ...updates,
        lastModified: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating session:', error);
      throw new Error('Failed to update session');
    }
  },

  // Update DM notes (private)
  updateDMNotes: async (firestore, campaignId, sessionId, notes) => {
    return sessionService.updateSession(firestore, campaignId, sessionId, {
      dmNotes: notes
    });
  },

  // Update shared notes (public)
  updateSharedNotes: async (firestore, campaignId, sessionId, notes) => {
    return sessionService.updateSession(firestore, campaignId, sessionId, {
      sharedNotes: notes
    });
  },

  // Add highlight to session
  addHighlight: async (firestore, campaignId, sessionId, highlight) => {
    try {
      const session = await sessionService.getSession(firestore, campaignId, sessionId);
      if (!session) throw new Error('Session not found');
      
      const highlights = session.highlights || [];
      highlights.push(highlight);
      
      await sessionService.updateSession(firestore, campaignId, sessionId, {
        highlights
      });
    } catch (error) {
      console.error('Error adding highlight:', error);
      throw new Error('Failed to add highlight');
    }
  },

  // Remove highlight from session
  removeHighlight: async (firestore, campaignId, sessionId, highlightIndex) => {
    try {
      const session = await sessionService.getSession(firestore, campaignId, sessionId);
      if (!session) throw new Error('Session not found');
      
      const highlights = session.highlights || [];
      highlights.splice(highlightIndex, 1);
      
      await sessionService.updateSession(firestore, campaignId, sessionId, {
        highlights
      });
    } catch (error) {
      console.error('Error removing highlight:', error);
      throw new Error('Failed to remove highlight');
    }
  },

  // Add tag to session
  addTag: async (firestore, campaignId, sessionId, tag) => {
    try {
      const session = await sessionService.getSession(firestore, campaignId, sessionId);
      if (!session) throw new Error('Session not found');
      
      const tags = session.tags || [];
      if (!tags.includes(tag)) {
        tags.push(tag);
        
        await sessionService.updateSession(firestore, campaignId, sessionId, {
          tags
        });
      }
    } catch (error) {
      console.error('Error adding tag:', error);
      throw new Error('Failed to add tag');
    }
  },

  // Remove tag from session
  removeTag: async (firestore, campaignId, sessionId, tag) => {
    try {
      const session = await sessionService.getSession(firestore, campaignId, sessionId);
      if (!session) throw new Error('Session not found');
      
      const tags = session.tags || [];
      const filteredTags = tags.filter(t => t !== tag);
      
      await sessionService.updateSession(firestore, campaignId, sessionId, {
        tags: filteredTags
      });
    } catch (error) {
      console.error('Error removing tag:', error);
      throw new Error('Failed to remove tag');
    }
  },

  // Mark session as complete
  completeSession: async (firestore, campaignId, sessionId, endTime = null) => {
    try {
      const updates = {
        status: 'completed'
      };
      
      if (endTime) {
        updates.endTime = endTime;
      }
      
      await sessionService.updateSession(firestore, campaignId, sessionId, updates);
    } catch (error) {
      console.error('Error completing session:', error);
      throw new Error('Failed to complete session');
    }
  },

  // Delete a session
  deleteSession: async (firestore, campaignId, sessionId) => {
    try {
      const sessionRef = sessionService.getSessionRef(firestore, campaignId, sessionId);
      await deleteDoc(sessionRef);
    } catch (error) {
      console.error('Error deleting session:', error);
      throw new Error('Failed to delete session');
    }
  },

  // Subscribe to session changes
  subscribeToSession: (firestore, campaignId, sessionId, callback) => {
    const sessionRef = sessionService.getSessionRef(firestore, campaignId, sessionId);
    
    return onSnapshot(sessionRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() });
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error subscribing to session:', error);
      callback(null, error);
    });
  },

  // Subscribe to all sessions
  subscribeToSessions: (firestore, campaignId, callback) => {
    const sessionsRef = sessionService.getSessionsCollectionRef(firestore, campaignId);
    const q = query(sessionsRef, orderBy('sessionNumber', 'desc'));
    
    return onSnapshot(q, (querySnapshot) => {
      const sessions = [];
      querySnapshot.forEach((doc) => {
        sessions.push({ id: doc.id, ...doc.data() });
      });
      callback(sessions);
    }, (error) => {
      console.error('Error subscribing to sessions:', error);
      callback([], error);
    });
  },

  // Get next session number
  getNextSessionNumber: async (firestore, campaignId) => {
    try {
      const sessions = await sessionService.getSessions(firestore, campaignId, 1);
      
      if (sessions.length === 0) {
        return 1;
      }
      
      return (sessions[0].sessionNumber || 0) + 1;
    } catch (error) {
      console.error('Error getting next session number:', error);
      return 1;
    }
  },

  // Get sessions by tag
  getSessionsByTag: async (firestore, campaignId, tag) => {
    try {
      const sessionsRef = sessionService.getSessionsCollectionRef(firestore, campaignId);
      const q = query(
        sessionsRef,
        where('tags', 'array-contains', tag),
        orderBy('sessionNumber', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const sessions = [];
      
      querySnapshot.forEach((doc) => {
        sessions.push({ id: doc.id, ...doc.data() });
      });
      
      return sessions;
    } catch (error) {
      console.error('Error getting sessions by tag:', error);
      throw new Error('Failed to load sessions by tag');
    }
  },

  // Export session to markdown
  exportSessionToMarkdown: (session) => {
    let markdown = `# ${session.title}\n\n`;
    markdown += `**Session Number**: ${session.sessionNumber}\n`;
    markdown += `**Date**: ${session.sessionDate ? new Date(session.sessionDate.seconds * 1000).toLocaleDateString() : 'N/A'}\n\n`;
    
    if (session.attendees && session.attendees.length > 0) {
      markdown += `**Attendees**: ${session.attendees.length} players\n\n`;
    }
    
    if (session.highlights && session.highlights.length > 0) {
      markdown += `## Highlights\n\n`;
      session.highlights.forEach(highlight => {
        markdown += `- ${highlight}\n`;
      });
      markdown += `\n`;
    }
    
    if (session.sharedNotes) {
      markdown += `## Session Notes\n\n${session.sharedNotes}\n\n`;
    }
    
    if (session.tags && session.tags.length > 0) {
      markdown += `**Tags**: ${session.tags.join(', ')}\n`;
    }
    
    return markdown;
  }
};

export default sessionService;
