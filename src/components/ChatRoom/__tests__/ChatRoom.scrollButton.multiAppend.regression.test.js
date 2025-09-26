import React from 'react';
import { render, act } from '@testing-library/react';

let mockMessages = [];

jest.useFakeTimers();

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

const makeMsgs = (n, offset=0) => Array.from({ length: n }).map((_,i)=>({ id: 'mm'+(i+offset), text: 'msg'+(i+offset) }));

beforeAll(()=>{
  if (!HTMLElement.prototype.scrollIntoView) {
    HTMLElement.prototype.scrollIntoView = function(){};
  }
});

function setup(count=10){
  mockMessages = makeMsgs(count);
  const meta=[]; const utils = render(<ChatRoom onScrollMeta={(m)=> meta.push(m)} />);
  act(()=> { jest.runOnlyPendingTimers(); });
  return { meta, utils };
}

describe('Regression: multi-tail append at hard bottom stays read', () => {
  test('Appending a batch of >1 messages at hard bottom keeps unread at 0 and button hidden', () => {
  const { meta, utils } = setup(14);
    const baseline = meta[meta.length-1];
    expect(baseline.visible).toBe(false);
    meta.length = 0;
    // simulate batch arrival
    const batch = [ { id:'mm-new1' }, { id:'mm-new2' }, { id:'mm-new3' } ];
    mockMessages = [...mockMessages, ...batch];
  utils.rerender(<ChatRoom onScrollMeta={(m)=> meta.push(m)} />);
    act(()=> { jest.runAllTimers(); });
    const last = meta[meta.length-1];
    expect(last.hasNew).toBe(false);
    expect(last.newCount).toBe(0);
    expect(last.visible).toBe(false);
  });
});
