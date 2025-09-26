import { render, screen } from '@testing-library/react';
import React from 'react';
import App from './App';
import { FirebaseProvider } from './services/FirebaseContext';

// Provide a lightweight mock for firebase dependencies so PresenceProvider doesn't throw.
jest.mock('./services/FirebaseContext', () => {
  const React = require('react');
  const Ctx = React.createContext(null);
  const mockValue = {
    auth: { currentUser: { uid: 'test-user', email: 'test@example.com' } },
    firestore: {},
    rtdb: null, // null disables realtime listeners in tests
    storage: {},
    user: { uid: 'test-user' },
    signInWithPopup: jest.fn(),
    signOut: jest.fn(),
    GoogleAuthProvider: function Provider() {}
  };
  return {
    FirebaseProvider: ({ children }) => <Ctx.Provider value={mockValue}>{children}</Ctx.Provider>,
    useFirebase: () => React.useContext(Ctx)
  };
});

// Mock ChatPage to eliminate internal Firebase / RTDB side-effects for this smoke test
jest.mock('./pages/ChatPage', () => {
  return function ChatPageMock() { return <div data-testid="chat-page-mock">Chat Page</div>; };
});

// The real UI doesn't include "learn react"; adjust test to something stable.
test('renders ChatPage mock', () => {
  render(<FirebaseProvider><App /></FirebaseProvider>);
  expect(screen.getByTestId('chat-page-mock')).toBeInTheDocument();
});

