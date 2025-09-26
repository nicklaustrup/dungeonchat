import React from 'react';
import { PresenceContext } from '../../src/services/PresenceContext';

export function PresenceProviderMock({ children }) {
  const presenceMap = React.useMemo(() => new Map([
    ['user_current', { state: 'online', lastSeen: Date.now(), online: true }],
    ['user_other', { state: 'away', lastSeen: Date.now() - 120000, online: true }],
    ['user_offline', { state: 'offline', lastSeen: Date.now() - 3600_000, online: false }]
  ]), []);

  const getPresence = React.useCallback((uid) => presenceMap.get(uid) || { state: 'offline', lastSeen: 0, online: false }, [presenceMap]);
  const ensureSubscribed = () => {};
  const typingMap = React.useMemo(() => new Map(), []);

  const value = React.useMemo(() => ({ presenceMap, getPresence, ensureSubscribed, typingMap, awayAfterSeconds: 300 }), [presenceMap, getPresence]);

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  );
}

// No custom usePresence export; components use real hook.
