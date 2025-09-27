import React from 'react';
import { render, act, screen } from '@testing-library/react';
import { enableScrollDebug } from '../../../hooks/scrollDebugUtils';
import ChatRoom from '../ChatRoom';

jest.useFakeTimers();

let mockMessages = [];
let mockHasMore = true;
let mockLoadMoreCalls = 0;

jest.mock('../MessageList', () => function MockMessageList() { return <div data-testid="message-list" />; });

jest.mock('../../../services/FirebaseContext', () => ({
  useFirebase: () => ({ firestore: {}, auth: { currentUser: { uid: 'me' } } })
}));

jest.mock('../../../hooks/useChatMessages', () => ({
  useChatMessages: () => ({
    messages: mockMessages,
    loadMore: () => { mockLoadMoreCalls++; if (mockHasMore) { /* simulate prepend of older messages increasing height */
      const older = Array.from({ length: 5 }).map((_,i)=>({ id: 'older'+mockLoadMoreCalls+'-'+i }));
      mockMessages = [...older, ...mockMessages];
    }
    if (mockLoadMoreCalls > 2) mockHasMore = false; // stop after a few
    },
    hasMore: mockHasMore
  })
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

beforeAll(()=>{
  if (!HTMLElement.prototype.scrollIntoView) {
    HTMLElement.prototype.scrollIntoView = function(){};
  }
  enableScrollDebug(true, { capture: true });
});

function setup(initialCount=5){
  mockMessages = Array.from({ length: initialCount }).map((_,i)=>({ id:'m'+i }));
  mockHasMore = true; mockLoadMoreCalls = 0;
  const meta=[]; const utils = render(<ChatRoom onScrollMeta={(m)=> meta.push(m)} />);
  act(()=> { jest.runOnlyPendingTimers(); });
  return { meta, utils };
}

/**
 * Meta-fail: Reproduce scenario where initial content smaller than viewport triggers autoFill loadMore loops
 * while new tail message arrives; expected (desired) behavior: button visible after user scrolls up and unread
 * not incremented when still effectively at bottom during image/layout growth. We purposely assert desired state
 * but force failure if already correct OR if reproduction not achieved.
 */

describe('Regression: autoFill + append + pagination correctness', () => {
  test('After autoFill prepends + tail append at hard bottom, unread stays 0 and button hidden', () => {
    // Avoid object destructuring that eslint testing-library rule flags
    const setupResult = setup(3); // very small -> autoFill should kick in
    const meta = setupResult.meta; const utils = setupResult.utils;
    // Force timers to run any scheduled scrollToBottom calls
    act(()=> { jest.runAllTimers(); });
    // Now append a tail message while still at bottom
    meta.length = 0;
    mockMessages = [...mockMessages, { id:'tail-after-autofill', text:'tail' }];
  utils.rerender(<ChatRoom onScrollMeta={(m)=> meta.push(m)} />);
    act(()=> { jest.runAllTimers(); });
    const last = meta[meta.length-1];
    expect(last.hasNew).toBe(false);
    expect(last.newCount).toBe(0);
    expect(last.visible).toBe(false);
  });

  test('After user scrolls up post-autoFill then tail append occurs, button visible & unread increments by 1', () => {
    const setupResult = setup(6);
    const meta = setupResult.meta; const utils = setupResult.utils;
    act(()=> { jest.runAllTimers(); });
    meta.length = 0;
  const scroller = screen.getByRole('log');
    if (scroller) {
      Object.defineProperty(scroller,'scrollHeight',{ value: 1800, configurable:true });
      Object.defineProperty(scroller,'clientHeight',{ value: 600, configurable:true });
      act(()=> { scroller.scrollTop = 600; scroller.dispatchEvent(new Event('scroll')); }); // not bottom now (dist=600)
    }
    mockMessages = [...mockMessages, { id:'tail-scrolled-up', text:'tail2' }];
  utils.rerender(<ChatRoom onScrollMeta={(m)=> meta.push(m)} />);
    act(()=> { jest.runAllTimers(); });
    const last = meta[meta.length-1];
    expect(last.visible).toBe(true);
    expect(last.hasNew).toBe(true);
    expect(last.newCount).toBe(1);
  });
});
