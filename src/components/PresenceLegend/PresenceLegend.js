import React from 'react';
import './PresenceLegend.css';
import { usePresenceMeta } from '../../services/PresenceContext';
import { useFirebase } from '../../services/FirebaseContext';

function PresenceLegend() {
  const { typingMap, presenceMap } = usePresenceMeta();
  const { auth } = useFirebase();
  const typingUsers = React.useMemo(() => {
    const arr = [];
    typingMap.forEach((_, uid) => {
      if (uid === auth?.currentUser?.uid) return; // exclude self
      const p = presenceMap.get(uid);
      arr.push({ uid, lastSeen: p?.lastSeen || 0 });
    });
    // Sort most recently active first
    arr.sort((a,b) => b.lastSeen - a.lastSeen);
    return arr;
  }, [typingMap, presenceMap, auth]);

  let typingLabel = '';
  if (typingUsers.length === 1) {
    typingLabel = 'Someone is typing…';
  } else if (typingUsers.length > 1) {
    typingLabel = `${typingUsers.length} people typing…`;
  }

  return (
    <div className="presence-legend" aria-live="polite" aria-atomic="true">
      <span className="legend-item"><span className="dot online" /> Online</span>
      <span className="legend-item"><span className="dot away" /> Away</span>
      <span className="legend-item"><span className="dot offline" /> Offline</span>
      {typingUsers.length > 0 && (
        <span className="legend-item typing-indicator" title={typingUsers.map(u=>u.uid).join(', ')}>
          <span className="dot typing" /> {typingLabel}
        </span>
      )}
    </div>
  );
}

export default React.memo(PresenceLegend);
