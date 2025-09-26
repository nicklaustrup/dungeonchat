import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ReactionBar, { getTelemetrySnapshot } from '../../components/ChatRoom/parts/ReactionBar';

function advance(ms) { jest.advanceTimersByTime(ms); }

describe('ReactionBar long-press', () => {
  beforeEach(() => { jest.useFakeTimers(); });
  afterEach(() => { jest.useRealTimers(); });

  it('fires long-press event after threshold', () => {
    const handler = jest.fn();
    render(<ReactionBar emojis={['👍']} onReact={handler} message={{ id: 'm1' }} />);
    const btn = screen.getByRole('button', { name: /react to message with 👍/i });
    fireEvent.pointerDown(btn, { pointerType: 'touch' });
    act(() => { advance(450); });
    fireEvent.pointerUp(btn, { pointerType: 'touch' });
    expect(handler).toHaveBeenCalledTimes(1);
    const tele = getTelemetrySnapshot().filter(e => e.type === 'long-press-reaction');
    expect(tele.length).toBeGreaterThan(0);
  });

  it('treats quick tap as normal tap reaction', () => {
    const handler = jest.fn();
    render(<ReactionBar emojis={['👍']} onReact={handler} message={{ id: 'm2' }} />);
    const btn = screen.getByRole('button', { name: /react to message with 👍/i });
    fireEvent.pointerDown(btn, { pointerType: 'touch' });
    act(() => { advance(200); }); // below threshold
    fireEvent.pointerUp(btn, { pointerType: 'touch' });
    expect(handler).toHaveBeenCalledTimes(1);
    const tele = getTelemetrySnapshot().filter(e => e.type === 'tap-reaction');
    expect(tele.length).toBeGreaterThan(0);
  });
});
