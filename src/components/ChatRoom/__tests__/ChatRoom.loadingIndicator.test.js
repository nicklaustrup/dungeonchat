import React from 'react';
import { render, screen } from '@testing-library/react';
import ChatRoom from '../ChatRoom';

// Mock dependent hooks to isolate loading sentinel / start marker rendering
jest.mock('../../../hooks/useChatMessages', () => ({
  useChatMessages: jest.fn()
}));
jest.mock('../../../hooks/useInfiniteScrollTop', () => ({
  useInfiniteScrollTop: jest.fn()
}));
jest.mock('../../../hooks/useAutoScroll', () => ({
  useAutoScroll: () => ({ isAtBottom: true, hasNew: false, newCount: 0, scrollToBottom: jest.fn() })
}));
jest.mock('../../../hooks/useScrollPrependRestoration', () => ({
  useScrollPrependRestoration: () => ({
    markBeforeLoadMore: jest.fn(),
    handleAfterMessages: jest.fn(),
    ignoreBottomRef: { current: false }
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
    replyingTo: null,
    setReplyingTo: jest.fn(),
    onImageDrop: jest.fn(),
    onViewProfile: jest.fn(),
    onScrollMeta: jest.fn(),
    soundEnabled: false
  };

  test('shows loading older indicator when fetching and hasMore', () => {
    useChatMessages.mockReturnValue({ messages: [{ id: 'm1' }], loadMore: jest.fn(), hasMore: true });
    useInfiniteScrollTop.mockReturnValue({ sentinelRef: { current: null }, isFetching: true });
    render(<ChatRoom {...baseProps} />);
    expect(screen.getByText(/Loading older messages/i)).toBeInTheDocument();
  });

  test('shows start of conversation marker when no more history', () => {
    useChatMessages.mockReturnValue({ messages: [{ id: 'm1' }], loadMore: jest.fn(), hasMore: false });
    useInfiniteScrollTop.mockReturnValue({ sentinelRef: { current: null }, isFetching: false });
    render(<ChatRoom {...baseProps} />);
    expect(screen.getByText(/Start of conversation/i)).toBeInTheDocument();
  });
});
