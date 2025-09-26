import React from 'react';
import { render, screen, act } from '@testing-library/react';
import ReactionList from '../../components/ChatRoom/parts/ReactionList';

function flushTimers(ms = 250) {
  return new Promise(r => setTimeout(r, ms));
}

describe('ReactionList accessibility semantics', () => {
  it('renders group with summary aria-label and updates live region', async () => {
    const reactions = { '👍': ['a','b'], '😂': ['c'] };
    render(<ReactionList reactions={reactions} currentUserId="a" onToggle={() => {}} />);
    const group = screen.getByRole('group');
    expect(group).toHaveAttribute('aria-label', expect.stringContaining('3 reactions'));

    // live region starts empty then updates after debounce
    const live = screen.getByTestId('reaction-live-region');
    expect(live.textContent).toBe('');
    await act(async () => { await flushTimers(); });
    expect(live.textContent).toMatch(/3 reactions/);
  });

  it('announces change when reactions prop changes', async () => {
    let reactions = { '👍': ['a'] };
    const { rerender } = render(<ReactionList reactions={reactions} currentUserId="z" onToggle={() => {}} />);
    await act(async () => { await flushTimers(); });
    const live = screen.getByTestId('reaction-live-region');
    expect(live.textContent).toMatch(/1 reaction/);

    reactions = { '👍': ['a','b'], '❤️': ['c'] };
    rerender(<ReactionList reactions={reactions} currentUserId="z" onToggle={() => {}} />);
    // debounce again
    await act(async () => { await flushTimers(); });
    expect(live.textContent).toMatch(/3 reactions/);
  });
});
