import React from 'react';
import { render, act } from '@testing-library/react';
jest.mock('../MessageList', () => function MockMessageList() { return <div data-testid="message-list" />; });
import ChatRoom from '../ChatRoom';

jest.useFakeTimers();

// Provide a variable starting with mock so jest allows factory closure access
let mockMessages = [];

jest.mock('../../../services/FirebaseContext', () => ({
  useFirebase: () => ({ firestore: {}, auth: { currentUser: { uid: 'me' } } })
}));
jest.mock('../../../hooks/useChatMessages', () => ({
  useChatMessages: () => ({ messages: mockMessages, loadMore: jest.fn(), hasMore: false })
}));
jest.mock('../../../hooks/useScrollPrependRestoration', () => ({
  useScrollPrependRestoration: () => ({ markBeforeLoadMore: jest.fn(), handleAfterMessages: jest.fn() })
}));
jest.mock('../../../hooks/useInfiniteScrollTop', () => ({
  useInfiniteScrollTop: () => ({ sentinelRef: { current: null }, isFetching: false })
}));
jest.mock('../../../hooks/useMessageSearch', () => ({
  useMessageSearch: (msgs) => msgs
}));
jest.mock('../../../hooks/useReplyState', () => ({
  useReplyState: () => ({ setReplyTarget: jest.fn() })
}));

// Use real hook for auto scroll (we want to test its integration), so no mock for useAutoScroll.

// Utility to build messages
const makeMsgs = (n, offset=0) => Array.from({ length: n }).map((_,i)=>({ id: 'm'+(i+offset), text: 'msg'+(i+offset) }));

// We'll capture onScrollMeta calls to inspect visible/hasNew state
function setupRoom(msgCount=30) {
  mockMessages = makeMsgs(msgCount);
  const metaUpdates = [];
  const utils = render(<ChatRoom onScrollMeta={(m)=> metaUpdates.push(m)} />);
  // Allow initial auto-scroll timers + rAF to flush
  act(()=> { jest.runOnlyPendingTimers(); });
  return { utils, metaUpdates };
}

// Provide a stub for scrollIntoView on all elements to avoid jsdom errors.
beforeAll(()=>{
  if (!HTMLElement.prototype.scrollIntoView) {
    HTMLElement.prototype.scrollIntoView = function() {};
  }
});

describe('ChatRoom scroll-to-bottom button bug reproduction', () => {
  test('Initial load should NOT show ScrollToBottomButton (desired behavior)', () => {
    const { metaUpdates } = setupRoom(40);
    const last = metaUpdates[metaUpdates.length - 1];
    expect(last.visible).toBe(false); // currently failing if bug present
  });

  test('Tail append while at bottom keeps button hidden and no hasNew', () => {
    const { metaUpdates, utils } = setupRoom(20);
    metaUpdates.length = 0;
    mockMessages = [...mockMessages, { id: 'm-tail', text: 'new tail' }];
    utils.rerender(<ChatRoom onScrollMeta={(m)=> metaUpdates.push(m)} />);
    act(()=> { jest.runAllTimers(); });
    const last = metaUpdates[metaUpdates.length - 1];
    expect(last.visible).toBe(false);
    expect(last.hasNew).toBe(false);
  });
});
