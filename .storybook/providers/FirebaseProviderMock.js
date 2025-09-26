import React from 'react';

const Ctx = React.createContext(null);

export function FirebaseProviderMock({ children }) {
  const value = React.useMemo(() => ({
    auth: { currentUser: { uid: 'user_current', email: 'me@example.com' } },
    firestore: {},
    rtdb: {},
    storage: {},
  }), []);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useFirebase = () => React.useContext(Ctx);
