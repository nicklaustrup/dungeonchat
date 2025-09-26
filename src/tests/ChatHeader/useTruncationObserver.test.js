import React from 'react';
import { render, act } from '@testing-library/react';
import useTruncationObserver from '../../components/ChatHeader/hooks/useTruncationObserver';

describe('useTruncationObserver', () => {
  function TestComponent({ text, width, expose }) {
    const { register, recompute } = useTruncationObserver();
    return (
      <div style={{ width }} data-testid="wrapper">
        <span
          ref={(el) => { register(el); if (el && expose) expose(el, recompute); }}
          data-testid="observed"
          style={{ display: 'inline-block', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden' }}
        >{text}</span>
      </div>
    );
  }

  test('sets data-truncated when content overflows', () => {
    let currentEl;
    let recompute;
    const { rerender, getByTestId } = render(<TestComponent text={'A'.repeat(10)} width={200} expose={(el, r) => { currentEl = el; recompute = r; }} />);
    // jsdom lacks real layout so simulate by monkey patching properties
    Object.defineProperty(currentEl, 'scrollWidth', { configurable: true, value: 300 });
    Object.defineProperty(currentEl, 'clientWidth', { configurable: true, value: 100 });
    act(() => { recompute(); });
    expect(currentEl.getAttribute('data-truncated')).toBe('true');

    rerender(<TestComponent text={'A'} width={200} expose={(el, r) => { currentEl = el; recompute = r; }} />);
    const el2 = getByTestId('observed');
    Object.defineProperty(el2, 'scrollWidth', { configurable: true, value: 50 });
    Object.defineProperty(el2, 'clientWidth', { configurable: true, value: 100 });
    act(() => { recompute(); });
    expect(el2.getAttribute('data-truncated')).toBeNull();
  });
});
