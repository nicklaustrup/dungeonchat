import React from 'react';

const PresenceCtx = React.createContext(null);

export function PresenceProviderMock({ children }) {
  const presenceMap = new Map([
    ['user_current', { state: 'online', lastSeen: Date.now(), online: true }],
    ['user_other', { state: 'away', lastSeen: Date.now() - 120000, online: true }],
    ['user_offline', { state: 'offline', lastSeen: Date.now() - 3600_000, online: false }]
  ]);

  const getPresence = (uid) => presenceMap.get(uid) || { state: 'offline', lastSeen: 0, online: false };
  const ensureSubscribed = () => {};

  return (
    <PresenceCtx.Provider value={{ presenceMap, getPresence, ensureSubscribed, typingMap: new Map(), awayAfterSeconds: 300 }}>
      {children}
    </PresenceCtx.Provider>
  );
}

export function usePresence(uid) {
  const ctx = React.useContext(PresenceCtx);
  return ctx.getPresence(uid);
}
