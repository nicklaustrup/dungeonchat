jest.mock('firebase/firestore', () => {
  const updateDoc = jest.fn(async () => {});
  const doc = jest.fn(() => ({ path: 'messages/m1' }));
  return { doc, updateDoc };
});

import { renderHook, act } from '@testing-library/react';
import { useReactions } from '../hooks/useReactions';
import { updateDoc } from 'firebase/firestore';

describe('useReactions', () => {
  const auth = { currentUser: { uid: 'me' } };
  const firestore = {};
  beforeEach(() => { updateDoc.mockClear(); });

  test('toggle add/remove updates firestore with correct payload', async () => {
    const { result } = renderHook(() => useReactions({ firestore, auth, messageId: 'm1', initialReactions: {} }));
    await act(async () => { await result.current.toggleReaction('👍'); });
    expect(result.current.reactions['👍']).toContain('me');
    const firstCall = updateDoc.mock.calls[0];
    expect(firstCall[1]).toEqual({ reactions: { '👍': ['me'] } });
    await act(async () => { await result.current.toggleReaction('👍'); });
    expect(result.current.reactions['👍']).toBeUndefined();
    const secondCall = updateDoc.mock.calls[1];
    expect(secondCall[1]).toEqual({ reactions: {} });
  });
});



