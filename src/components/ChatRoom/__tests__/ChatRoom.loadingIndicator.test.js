import React from 'react';
import { render, screen } from '@testing-library/react';
import ChatRoom from '../ChatRoom';
import { ChatStateProvider } from '../../../contexts/ChatStateContext';

// Mock dependent hooks to isolate loading sentinel / start marker rendering
jest.mock('../../../hooks/useChatMessages', () => ({
  useChatMessages: jest.fn()
}));
jest.mock('../../../hooks/useInfiniteScrollTop', () => ({
  useInfiniteScrollTop: jest.fn()
}));
jest.mock('../../../hooks/useUnifiedScrollManager', () => ({
  useUnifiedScrollManager: () => ({ 
    isAtBottom: true, 
    hasNewMessages: false, 
    newMessagesCount: 0, 
    scrollToBottom: jest.fn(),
    captureBeforeLoadMore: jest.fn()
  })
}));
jest.mock('../../../hooks/useMessageSearch', () => ({
  useMessageSearch: (msgs) => msgs
}));
// Mock MessageList to avoid deep rendering of ChatMessage / presence requirements
jest.mock('../MessageList', () => (
  function MockMessageList({ topSentinel }) {
    return <div data-testid="mock-message-list">{topSentinel}</div>;
  }
));

// Firebase context mock
jest.mock('../../../services/FirebaseContext', () => ({
  useFirebase: () => ({ firestore: {}, auth: { currentUser: { uid: 'u1' } } })
}));

// Silence sound play
jest.mock('../../../utils/sound', () => ({ playReceiveMessageSound: jest.fn() }));

const { useChatMessages } = require('../../../hooks/useChatMessages');
const { useInfiniteScrollTop } = require('../../../hooks/useInfiniteScrollTop');

describe('ChatRoom top sentinel + history marker', () => {
  const baseProps = {
    getDisplayName: () => 'User',
    searchTerm: '',
    onDragStateChange: jest.fn(),
    onImageDrop: jest.fn(),
    onViewProfile: jest.fn(),
    onScrollMeta: jest.fn(),
    soundEnabled: false
  };

  const renderWithContext = (props) => {
    return render(
      <ChatStateProvider>
        <ChatRoom {...props} />
      </ChatStateProvider>
    );
  };

  test('shows loading older indicator when fetching and hasMore', () => {
    useChatMessages.mockReturnValue({ messages: [{ id: 'm1' }], loadMore: jest.fn(), hasMore: true });
    useInfiniteScrollTop.mockReturnValue({ sentinelRef: { current: null }, isFetching: true });
    renderWithContext(baseProps);
    expect(screen.getByText(/Loading older messages/i)).toBeInTheDocument();
  });

  test('shows start of conversation marker when no more history', () => {
    useChatMessages.mockReturnValue({ messages: [{ id: 'm1' }], loadMore: jest.fn(), hasMore: false });
    useInfiniteScrollTop.mockReturnValue({ sentinelRef: { current: null }, isFetching: false });
    renderWithContext(baseProps);
    expect(screen.getByText(/Start of conversation/i)).toBeInTheDocument();
  });
});
