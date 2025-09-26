// React import not required; Testing Library's renderHook provides necessary environment.
import { renderHook, act } from '@testing-library/react';
import { useScrollPrependRestoration } from '../useScrollPrependRestoration';

// Mock scroll debug utils so we can assert on emitted events
const logEvents = [];
jest.mock('../scrollDebugUtils', () => ({
  logEvent: (label, payload) => { logEvents.push({ label, ...payload }); },
  logInfiniteTrigger: jest.fn(),
  logScrollMetrics: jest.fn()
}));

// Helper to create an element that mimics the scroll container
function createContainer({ scrollTop = 0, scrollHeight = 1000, clientHeight = 400 } = {}) {
  const el = document.createElement('div');
  Object.defineProperty(el, 'scrollTop', {
    get: () => el.__scrollTop || scrollTop,
    set: (v) => { el.__scrollTop = v; }
  });
  Object.defineProperty(el, 'scrollHeight', { get: () => el.__scrollHeight ?? scrollHeight });
  Object.defineProperty(el, 'clientHeight', { get: () => clientHeight });
  el.getBoundingClientRect = () => ({ top: 0, left: 0, width: 300, height: clientHeight, bottom: clientHeight, right: 300 });
  return el;
}

// Force requestAnimationFrame to run immediately (nested calls collapse into one tick)
beforeAll(() => {
  // queue callbacks so we can flush them manually to simulate multiple frames
  const queue = [];
  global.requestAnimationFrame = (cb) => { queue.push(cb); return queue.length; };
  global.cancelAnimationFrame = () => {};
  // helper to flush all queued frames (including those queued during a flush)
  global.__flushRAFs = () => {
    while (queue.length) {
      const cbs = queue.splice(0, queue.length);
      cbs.forEach(fn => fn());
    }
  };
});

beforeEach(() => { logEvents.length = 0; });

describe('useScrollPrependRestoration', () => {
  test('restores scroll on positive delta growth (delta-growth)', () => {
    const container = createContainer({ scrollTop: 50, scrollHeight: 1000 });
    const containerRef = { current: container };
    const { result } = renderHook(() => useScrollPrependRestoration(containerRef));

    const initial = [ { id: 'm5' }, { id: 'm6' }, { id: 'm7' } ];
    act(() => { result.current.markBeforeLoadMore(initial); });

    // Simulate larger scrollHeight after prepend
    container.__scrollHeight = 1300; // delta 300
    const next = [ { id: 'm2' }, { id: 'm3' }, { id: 'm4' }, ...initial ];
  act(() => { result.current.handleAfterMessages(next); });
  act(() => { global.__flushRAFs(); }); // process nested rAF restoration
  const restore = logEvents.find(e => e.label === 'restoration');
    expect(restore).toBeTruthy();
    expect(restore.reason).toBe('delta-growth');
    // Expected target = prev.scrollTop + delta = 50 + 300 = 350
    expect(container.scrollTop).toBe(350);
  });

  test('anchor fallback immediate when delta non-positive and anchor present', () => {
    const container = createContainer({ scrollTop: 100, scrollHeight: 1000 });
    const containerRef = { current: container };
    const anchorNode = document.createElement('div');
    anchorNode.dataset.mid = 'm5';
    // Initial position
    anchorNode.getBoundingClientRect = () => ({ top: 0, left:0, width:200, height:30, bottom:30, right:200 });
    container.appendChild(anchorNode);
    const { result } = renderHook(() => useScrollPrependRestoration(containerRef));

    const initial = [ { id: 'm5' }, { id: 'm6' } ];
    act(() => { result.current.markBeforeLoadMore(initial); });

    // After load: scrollHeight shrinks (simulate measurement anomalies) => delta negative / zero
    container.__scrollHeight = 990; // delta -10
    // Move anchor node visually (simulate layout shift) so restoration applies offsetDelta
    anchorNode.getBoundingClientRect = () => ({ top: 25, left:0, width:200, height:30, bottom:55, right:200 });
    const next = [ { id: 'm1' }, { id: 'm2' }, { id: 'm5' }, { id: 'm6' } ];
  act(() => { result.current.handleAfterMessages(next); });
  act(() => { global.__flushRAFs(); });
  const restore = logEvents.find(e => e.label === 'restoration' && e.reason === 'anchor-fallback');
    expect(restore).toBeTruthy();
    // OffsetDelta = currentOffset (25) - desiredOffset(0) => target scrollTop = 100 + 25 = 125
    expect(container.scrollTop).toBe(125);
  });

  test('anchor fallback deferred when anchor not immediately found', () => {
    const container = createContainer({ scrollTop: 200, scrollHeight: 800 });
    const containerRef = { current: container };
    const anchorNode = document.createElement('div');
    anchorNode.dataset.mid = 'm5';
    anchorNode.getBoundingClientRect = () => ({ top: 30, left:0, width:200, height:30, bottom:60, right:200 });

    const q = jest.fn()
      .mockImplementationOnce(() => null) // immediate attempt fails
      .mockImplementation(() => anchorNode); // deferred attempt succeeds
    container.querySelector = q;
    const { result } = renderHook(() => useScrollPrependRestoration(containerRef));

    const initial = [ { id: 'm5' }, { id: 'm6' } ];
    act(() => { result.current.markBeforeLoadMore(initial); });
    container.__scrollHeight = 800; // delta 0 -> nonpositive path
    const next = [ { id: 'm1' }, { id: 'm2' }, { id: 'm5' }, { id: 'm6' } ];
  act(() => { result.current.handleAfterMessages(next); });
  // The hook nests two requestAnimationFrame calls inside applyScroll for restoration.
  // Our deferred path: first frame schedules another rAF via requestAnimationFrame(() => { if (attemptAnchor('deferred')) ... })
  // Flush 1: runs classification & schedules deferred attempt.
  act(() => { global.__flushRAFs(); });
  // Provide anchor now (already available in querySelector mock after first call) and flush again.
  act(() => { global.__flushRAFs(); });
  // One more flush to execute nested applyScroll rAF pair for scrolling.
  act(() => { global.__flushRAFs(); });
    const restoreImmediate = logEvents.find(e => e.label === 'restoration' && e.reason === 'anchor-fallback');
    const restoreDeferred = logEvents.find(e => e.label === 'restoration' && e.reason === 'anchor-fallback-deferred');
    expect(restoreImmediate || restoreDeferred).toBeTruthy();
    // Either path should adjust scrollTop upward from original 200
    expect(container.scrollTop).toBeGreaterThan(200);
  });

  test('restoration-skip when delta nonpositive and no anchor found even after deferred', () => {
    const container = createContainer({ scrollTop: 75, scrollHeight: 900 });
    const containerRef = { current: container };
    container.querySelector = () => null; // never returns anchor
    const { result } = renderHook(() => useScrollPrependRestoration(containerRef));
    const initial = [ { id: 'm5' }, { id: 'm6' } ];
    act(() => { result.current.markBeforeLoadMore(initial); });
    container.__scrollHeight = 890; // delta -10
    const next = [ { id: 'm1' }, { id: 'm2' }, { id: 'm5' }, { id: 'm6' } ];
  act(() => { result.current.handleAfterMessages(next); });
  act(() => { global.__flushRAFs(); });
  const skip = logEvents.find(e => e.label === 'restoration-skip');
    expect(skip).toBeTruthy();
    expect(skip.reason).toBe('nonpositive-delta-no-anchor');
  });

  test('avoids redundant restoration on identical message arrays (performance guard)', () => {
    const container = createContainer({ scrollTop: 40, scrollHeight: 1000 });
    const containerRef = { current: container };
    const { result } = renderHook(() => useScrollPrependRestoration(containerRef));

    const initial = [ { id: 'm4' }, { id: 'm5' } ];
    act(() => { result.current.markBeforeLoadMore(initial); });

    // First prepend event
    container.__scrollHeight = 1300; // delta +300
    const next = [ { id: 'm1' }, { id: 'm2' }, { id: 'm3' }, ...initial ];
    act(() => { result.current.handleAfterMessages(next); });
    act(() => { global.__flushRAFs(); });

    const firstRestores = logEvents.filter(e => e.label === 'restoration');
    expect(firstRestores.length).toBe(1);

    // Call again with the exact same array reference (should be ignored)
    act(() => { result.current.handleAfterMessages(next); });
    act(() => { global.__flushRAFs(); });
    const afterSameRef = logEvents.filter(e => e.label === 'restoration');
    expect(afterSameRef.length).toBe(1); // still only one restoration

    // Call with a new array instance but identical ordered IDs (structural no-op)
    const clone = next.map(m => ({ ...m }));
    act(() => { result.current.handleAfterMessages(clone); });
    act(() => { global.__flushRAFs(); });
    const afterClone = logEvents.filter(e => e.label === 'restoration');
    expect(afterClone.length).toBe(1); // still no additional restoration
  });
});
