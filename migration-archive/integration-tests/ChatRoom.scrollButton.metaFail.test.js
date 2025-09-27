import React from 'react';
import { render, act, screen } from '@testing-library/react';
import { enableScrollDebug } from '../../../hooks/scrollDebugUtils';

// Force real timers for timing assertions but control rAF fallbacks
jest.useFakeTimers();

let mockMessages = [];

jest.mock('../MessageList', () => function MockMessageList() { return <div data-testid="message-list" />; });

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

import ChatRoom from '../ChatRoom';

const makeMsgs = (n, offset=0) => Array.from({ length: n }).map((_,i)=>({ id: 'mf'+(i+offset), text: 'msg'+(i+offset) }));

beforeAll(()=>{
  if (!HTMLElement.prototype.scrollIntoView) {
    HTMLElement.prototype.scrollIntoView = function(){};
  }
  enableScrollDebug(true, { capture: true });
});

// setup function removed (unused) to satisfy no-unused-vars

/**
 * MetaFail tests intentionally encode CURRENT observed buggy behavior.
 * They should FAIL (red) while the bug exists. After fix, invert the expectation and rename.
 */

// Helper mirroring previous setupRoom used elsewhere
function setupRoom(count=25){
  mockMessages = makeMsgs(count);
  const meta=[];
  const utils = render(<ChatRoom onScrollMeta={(m)=> meta.push(m)} />);
  act(()=>{ jest.runOnlyPendingTimers(); });
  return { meta, utils };
}

describe('Regression: scroll button & unread correctness', () => {
  test('After user scrolls away & a new tail message arrives, scroll button becomes visible', () => {
    const setupResult = setupRoom(30);
    const meta = setupResult.meta; const utils = setupResult.utils;
    meta.length = 0;
  const scroller = screen.getByRole('log');
    if (scroller) {
      Object.defineProperty(scroller,'scrollHeight',{ value: 3000, configurable:true });
      Object.defineProperty(scroller,'clientHeight',{ value: 600, configurable:true });
      // Simulate user scroll up
      act(()=>{ scroller.scrollTop = 1800; scroller.dispatchEvent(new Event('scroll')); }); // distance 600
    }
    mockMessages = [...mockMessages, { id:'mf-tail-visible', text:'tail visible' }];
  utils.rerender(<ChatRoom onScrollMeta={(m)=> meta.push(m)} />);
    act(()=>{ jest.runAllTimers(); });
    const last = meta[meta.length-1];
    expect(last.visible).toBe(true);
  });

  test('When at hard bottom, tail append should NOT set hasNew or increment count', () => {
    const setupResult = setupRoom(12);
    const meta = setupResult.meta; const utils = setupResult.utils;
    const initial = meta[meta.length-1];
    expect(initial.visible).toBe(false); // baseline
    meta.length = 0;
    mockMessages = [...mockMessages, { id:'mf-tail-bottom', text:'tail' }];
  utils.rerender(<ChatRoom onScrollMeta={(m)=> meta.push(m)} />);
    act(()=>{ jest.runAllTimers(); });
    const last = meta[meta.length-1];
    expect(last.hasNew).toBe(false);
    expect(last.newCount).toBe(0);
  });

  test('Append at bottom then pagination should keep unread at 0 and button hidden (append then prepend sequence)', () => {
    const setupResult = setupRoom(15);
    const meta = setupResult.meta; const utils = setupResult.utils;
    meta.length = 0;
    // Step 1: append at bottom
    mockMessages = [...mockMessages, { id:'mf-tail-seq-1', text:'tail1' }];
  utils.rerender(<ChatRoom onScrollMeta={(m)=> meta.push(m)} />);
    act(()=>{ jest.runAllTimers(); });
    // Step 2: simulate pagination prepend
    const older = Array.from({ length:8 }).map((_,i)=>({ id:'mf-older'+i, text:'old'+i }));
    mockMessages = [...older, ...mockMessages];
  utils.rerender(<ChatRoom onScrollMeta={(m)=> meta.push(m)} />);
    act(()=>{ jest.runAllTimers(); });
    const last = meta[meta.length-1];
    expect(last.hasNew).toBe(false);
    expect(last.newCount).toBe(0);
    expect(last.visible).toBe(false);
  });
});
