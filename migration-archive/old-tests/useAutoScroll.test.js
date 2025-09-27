import React from 'react';
import { render, act } from '@testing-library/react';
import { useAutoScroll } from '../useAutoScroll';

// Basic mock for IntersectionObserver used inside the hook
class MockIntersectionObserver {
  constructor(cb) { this._cb = cb; this._el = null; }
  observe(el) { this._el = el; // immediately report NOT intersecting so hook treats bottom as not visible
    this._cb([{ isIntersecting: false, target: el }]);
  }
  disconnect() { this._el = null; }
  unobserve() {}
}

beforeAll(() => {
  global.IntersectionObserver = MockIntersectionObserver; // minimal stub
  // rAF shim
  if (!global.requestAnimationFrame) {
    global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  }
});

// Utility to define read-only dimension props on an element
function defineDims(el, { scrollTop = 0, scrollHeight = 1000, clientHeight = 500 }) {
  Object.defineProperty(el, 'scrollTop', { configurable: true, get: () => scrollTop, set: v => { scrollTop = v; } });
  Object.defineProperty(el, 'scrollHeight', { configurable: true, get: () => scrollHeight });
  Object.defineProperty(el, 'clientHeight', { configurable: true, get: () => clientHeight });
}

function TestHarness({ items, bottomThreshold = 60, expose }) {
  const containerRef = React.useRef(null);
  const anchorRef = React.useRef(null);
  const hookVals = useAutoScroll({ containerRef, anchorRef, items, bottomThreshold });
  React.useEffect(() => { expose && expose(hookVals, containerRef); });
  return (
    <div>
      <div ref={containerRef} data-testid="container">
        {items.map(m => <div key={m.id}>{m.id}</div>)}
        <div ref={anchorRef} />
      </div>
    </div>
  );
}

describe('useAutoScroll pagination vs append', () => {
  test('appending new tail message while at bottom keeps newCount 0', async () => {
    const initial = [
      { id: 'm1', type: 'text' },
      { id: 'm2', type: 'text' },
      { id: 'm3', type: 'text' }
    ];
    let hookVals; let containerRef;
    const { rerender } = render(<TestHarness items={initial} expose={(h, c) => { hookVals = h; containerRef = c; }} />);
    // Define dimensions: user at bottom => scrollTop = scrollHeight - clientHeight
    const el = containerRef.current;
    defineDims(el, { scrollTop: 500, scrollHeight: 1000, clientHeight: 500 }); // distance 0

    // Trigger IO bottom intersect manually (simulate anchor visible)
    // Trigger possible observer side-effects without referencing unused variable
    // No-op: ensure code path executed (removed unused expression for lint)
    act(() => {});

    // Append a new tail message
    const appended = [...initial, { id: 'm4', type: 'text' }];
    await act(async () => { rerender(<TestHarness items={appended} expose={(h) => { hookVals = h; }} />); });

    expect(hookVals.newCount).toBe(0);
    expect(hookVals.hasNew).toBe(false);
  });

  test('appending new tail message while scrolled up increments newCount', async () => {
    const base = [
      { id: 'a1', type: 'text' },
      { id: 'a2', type: 'text' },
      { id: 'a3', type: 'text' }
    ];
    let hookVals; let containerRef;
    const { rerender } = render(<TestHarness items={base} expose={(h, c) => { hookVals = h; containerRef = c; }} />);
    const el = containerRef.current;
    // Start at bottom first (simulate initial auto scroll settle)
    defineDims(el, { scrollTop: 500, scrollHeight: 1000, clientHeight: 500 }); // dist = 0
    act(() => { el.dispatchEvent(new Event('scroll')); });
    // Now user scrolls UP to read older messages -> scrollTop decreases (delta negative)
    defineDims(el, { scrollTop: 200, scrollHeight: 1000, clientHeight: 500 }); // dist = 300
    act(() => { el.dispatchEvent(new Event('scroll')); });

    const appended = [...base, { id: 'a4', type: 'text' }];
    await act(async () => { rerender(<TestHarness items={appended} expose={(h) => { hookVals = h; }} />); });

    expect(hookVals.newCount).toBe(1);
    expect(hookVals.hasNew).toBe(true);
  });

  test('pagination (prepend older messages) does not increment newCount', async () => {
    const base = [
      { id: 'b1', type: 'text' },
      { id: 'b2', type: 'text' },
      { id: 'b3', type: 'text' }
    ];
    let hookVals; let containerRef;
    const { rerender } = render(<TestHarness items={base} expose={(h, c) => { hookVals = h; containerRef = c; }} />);
    const el = containerRef.current;
    // Assume user at top performing pagination: scrollTop small
    defineDims(el, { scrollTop: 0, scrollHeight: 1500, clientHeight: 500 });

    const paginated = [{ id: 'b0', type: 'text' }, ...base]; // prepend older
    await act(async () => { rerender(<TestHarness items={paginated} expose={(h) => { hookVals = h; }} />); });

    expect(hookVals.newCount).toBe(0);
    expect(hookVals.hasNew).toBe(false);
  });

  test('no unread badge after pagination when previously at hard bottom', async () => {
    const base = Array.from({ length: 10 }).map((_, i) => ({ id: 'p' + i }));
    let hookVals; let containerRef;
    const { rerender } = render(<TestHarness items={base} expose={(h, c) => { hookVals = h; containerRef = c; }} />);
    const el = containerRef.current;
    // Hard bottom
    defineDims(el, { scrollTop: 500, scrollHeight: 1000, clientHeight: 500 });
    act(() => { el.dispatchEvent(new Event('scroll')); });
    // Simulate pagination prepend (older messages)
    const older = Array.from({ length: 5 }).map((_, i) => ({ id: 'o' + i }));
    const paginated = [...older, ...base];
    // Increase scrollHeight to mimic growth
    defineDims(el, { scrollTop: 500, scrollHeight: 1500, clientHeight: 500 });
    await act(async () => { rerender(<TestHarness items={paginated} expose={(h) => { hookVals = h; }} />); });
    // Should not have unread count
    expect(hookVals.newCount).toBe(0);
  });

  test('unread badge appears only when scrolled sufficiently far (distance beyond read zone)', async () => {
    const base = Array.from({ length: 8 }).map((_, i) => ({ id: 'm' + i }));
    let hookVals; let containerRef;
    const { rerender } = render(<TestHarness items={base} expose={(h, c) => { hookVals = h; containerRef = c; }} />);
    const el = containerRef.current;
    // Scroll up a SMALL amount (distance 20) still inside broadened read zone -> append should NOT create unread
    defineDims(el, { scrollTop: 480, scrollHeight: 1000, clientHeight: 500 }); // dist = 20
    act(() => { el.dispatchEvent(new Event('scroll')); });
    let appended = [...base, { id: 'm-new' }];
    await act(async () => { rerender(<TestHarness items={appended} expose={(h) => { hookVals = h; }} />); });
    expect(hookVals.newCount).toBe(0);
    // Scroll further up (distance 150) beyond read zone then append -> should create unread
    defineDims(el, { scrollTop: 1000 - 500 - 150, scrollHeight: 1000, clientHeight: 500 });
    act(() => { el.dispatchEvent(new Event('scroll')); });
    appended = [...appended, { id: 'm-new-2' }];
    await act(async () => { rerender(<TestHarness items={appended} expose={(h) => { hookVals = h; }} />); });
    expect(hookVals.newCount).toBe(1);
  });
});
