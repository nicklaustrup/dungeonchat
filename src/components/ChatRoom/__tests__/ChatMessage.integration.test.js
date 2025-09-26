import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ChatMessage from '../ChatMessage';

// Mock Firebase context & hooks
jest.mock('../../../services/FirebaseContext', () => ({
  useFirebase: () => ({
    firestore: {},
    auth: { currentUser: { uid: 'userA', email: 'me@example.com' } },
    rtdb: {}
  })
}));

jest.mock('../../../services/PresenceContext', () => ({
  usePresence: () => ({ state: 'online', typing: false, lastSeen: Date.now() - 1000 })
}));

jest.mock('../../../components/ChatInput/EmojiMenu', () => ({
  __esModule: true,
  default: { open: jest.fn() }
}));

// Mock Firestore updateDoc
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => ({})),
  updateDoc: jest.fn(async () => {}),
  serverTimestamp: jest.fn(() => ({ server: true }))
}));

// Mock reactions hook to avoid Firestore complexity
jest.mock('../../../hooks/useReactions', () => ({
  useReactions: ({ initialReactions }) => ({
    reactions: initialReactions || {},
    toggleReaction: jest.fn()
  })
}));

const baseMessage = {
  id: 'm1',
  text: 'Hello world',
  uid: 'userA',
  photoURL: null,
  reactions: {},
  createdAt: { seconds: 0, nanoseconds: 0 },
  type: 'text',
  displayName: 'Me',
  replyTo: null,
  editedAt: null,
  deleted: false
};

const renderMessage = (overrides={}) => {
  return render(<ChatMessage message={{ ...baseMessage, ...overrides }} searchTerm="" getDisplayName={(uid, name) => name} />);
};

describe('ChatMessage integration', () => {
  test('renders text and opens options menu', () => {
    renderMessage();
    expect(screen.getByText(/hello world/i)).toBeInTheDocument();
    // Simulate desktop hover by focusing the message (hover CSS not applied in JSDOM, but button is present in DOM)
    const optionsBtn = screen.getByLabelText(/options/i);
    fireEvent.click(optionsBtn);
    expect(screen.getByRole('menu', { name: /message options/i })).toBeInTheDocument();
  });

  test('edit flow: enter editing then save', async () => {
    const { updateDoc } = require('firebase/firestore');
    renderMessage();
  fireEvent.click(screen.getByLabelText(/options/i));
    fireEvent.click(screen.getByRole('menuitem', { name: /edit/i }));
    const ta = screen.getByLabelText(/edit message text/i);
    fireEvent.change(ta, { target: { value: 'New text' } });
    fireEvent.click(screen.getByRole('button', { name: /save edit/i }));
    await act(() => Promise.resolve());
    expect(updateDoc).toHaveBeenCalled();
  });

  test('delete confirmation appears and triggers updateDoc', async () => {
    const { updateDoc } = require('firebase/firestore');
    renderMessage();
  fireEvent.click(screen.getByLabelText(/options/i));
    fireEvent.click(screen.getByRole('menuitem', { name: /delete/i }));
    expect(screen.getByTestId('delete-confirm-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    await act(() => Promise.resolve());
    expect(updateDoc).toHaveBeenCalled();
  });

  test('image modal opens on click', () => {
    renderMessage({ type: 'image', imageURL: '/test.png' });
    const img = screen.getByRole('button', { name: /open image/i });
    fireEvent.click(img);
    expect(screen.getByTestId('image-preview-modal')).toBeInTheDocument();
  });
});
