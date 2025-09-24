import React from 'react';
import { useFirebase } from '../../services/FirebaseContext';
import { useTypingUsers } from '../../hooks/useTypingUsers';
import './TypingBubble.css';

import { playTypingSound } from '../../utils/sound';

function TypingBubble({ users, soundEnabled }) {
  const { rtdb, auth } = useFirebase();
  const hookUsers = useTypingUsers({ rtdb, currentUid: auth.currentUser?.uid });
  const typingUsers = users || hookUsers;
  const prevIdsRef = React.useRef(new Set());
  const lastPlayRef = React.useRef(0);

  React.useEffect(() => {
    if (!typingUsers || typingUsers.length === 0) {
      prevIdsRef.current.clear();
      return;
    }
    const nowIds = new Set(typingUsers.map(u => u.uid));
    // Detect if any new uid started typing this frame
    let newCount = 0;
    nowIds.forEach(id => { if (!prevIdsRef.current.has(id)) newCount++; });
    const now = Date.now();
    if (newCount > 0 && soundEnabled && (now - lastPlayRef.current > 1200)) {
      playTypingSound(true, { multiple: newCount > 1, count: newCount, withReverb: true });
      lastPlayRef.current = now;
    }
    prevIdsRef.current = nowIds;
  }, [typingUsers, soundEnabled]);

  if (!typingUsers || !typingUsers.length) return null;
  const names = typingUsers.slice(0,3).map(u => u.displayName || 'Someone');
  const more = typingUsers.length - names.length;
  const label = more > 0 ? `${names.join(', ')} +${more} typing...` : `${names.join(', ')} ${names.length===1 ? 'is' : 'are'} typing...`;
  return (
    <div className="typing-bubble" aria-live="polite" aria-atomic="true">
      <div className="typing-dots" aria-hidden="true">
        <span></span><span></span><span></span>
      </div>
      <span className="typing-text">{label}</span>
    </div>
  );
}

export default React.memo(TypingBubble);