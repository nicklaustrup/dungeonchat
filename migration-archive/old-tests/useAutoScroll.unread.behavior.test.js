import React from 'react';
import { render, act } from '@testing-library/react';
import { useAutoScroll } from '../useAutoScroll';

// IntersectionObserver stub
class MockIO { constructor(cb){ this.cb = cb; } observe(){} disconnect(){} unobserve(){} }
beforeAll(()=>{ global.IntersectionObserver = MockIO; if(!global.requestAnimationFrame){ global.requestAnimationFrame = cb=>setTimeout(cb,0);} });

function defineDims(el,{ scrollTop=0, scrollHeight=1000, clientHeight=500 }){
  Object.defineProperty(el,'scrollTop',{ configurable:true, get:()=>scrollTop, set:v=>{ scrollTop = v; }});
  Object.defineProperty(el,'scrollHeight',{ configurable:true, get:()=>scrollHeight });
  Object.defineProperty(el,'clientHeight',{ configurable:true, get:()=>clientHeight });
}

function Harness({ items, expose, bottomThreshold=60 }){
  const containerRef = React.useRef(null);
  const anchorRef = React.useRef(null);
  const hook = useAutoScroll({ containerRef, anchorRef, items, bottomThreshold });
  React.useEffect(()=>{ expose && expose(hook, containerRef); });
  return <div ref={containerRef}>{items.map(m=> <div key={m.id}>{m.id}</div>)}<div ref={anchorRef} /></div>;
}

// Helper to force a scroll event after dimension change
function fireScroll(el){ act(()=> el.dispatchEvent(new Event('scroll'))); }

describe('Unread / scroll behavior specification (initially expected to FAIL for current implementation)', () => {
  test('1. Messages near bottom (within bottomThreshold) are treated as read (distance < bottomThreshold)', async () => {
    const initial = Array.from({ length: 20 }).map((_,i)=>({ id:'m'+i }));
    let hook; let ref; const { rerender } = render(<Harness items={initial} expose={(h,c)=>{ hook=h; ref=c; }} bottomThreshold={60} />);
    const el = ref.current;
    // Simulate user resting 20px from hard bottom (still visually at bottom region)
    defineDims(el,{ scrollTop: 1000 - 500 - 20, scrollHeight:1000, clientHeight:500 });
    fireScroll(el); // distance = 20 (within bottomThreshold=60)
    // Append a new message while still effectively at bottom region -> should remain read
    const appended = [...initial, { id:'m-new' }];
    await act(async ()=> rerender(<Harness items={appended} expose={h=>{ hook=h; }} bottomThreshold={60} />));
    // Desired: no unread count because still within threshold
    expect(hook.newCount).toBe(0); // CURRENT IMPLEMENTATION LIKELY FAILS (sets to 1)
  });

  test('2. Scrolling up slightly AFTER receiving a message (still within threshold) does not retroactively mark it unread nor future single message within threshold', async () => {
    const base = Array.from({ length: 10 }).map((_,i)=>({ id:'b'+i }));
    let hook; let ref; const { rerender } = render(<Harness items={base} expose={(h,c)=>{ hook=h; ref=c; }} bottomThreshold={60} />);
    const el = ref.current;
    // Start at exact bottom
    defineDims(el,{ scrollTop:500, scrollHeight:1000, clientHeight:500 });
    fireScroll(el); // distance 0
    // New message arrives -> auto read
    let items = [...base, { id:'b-new1' }];
    await act(async ()=> rerender(<Harness items={items} expose={h=>{ hook=h; }} bottomThreshold={60} />));
    expect(hook.newCount).toBe(0); // sanity
    // User scrolls up a little but still within threshold (distance 30)
    defineDims(el,{ scrollTop: 1000 - 500 - 30, scrollHeight:1000, clientHeight:500 });
    fireScroll(el); // now not hard bottom but within threshold
    // Another message arrives while still within threshold -> should still be auto-read per spec (remain 0)
    items = [...items, { id:'b-new2' }];
    await act(async ()=> rerender(<Harness items={items} expose={h=>{ hook=h; }} bottomThreshold={60} />));
    expect(hook.newCount).toBe(0); // CURRENT IMPLEMENTATION LIKELY FAILS (becomes 1)
  });

  test('3. When user has scrolled far enough (outside threshold) the next message creates a New Message badge', async () => {
    const base = Array.from({ length: 15 }).map((_,i)=>({ id:'c'+i }));
    let hook; let ref; const { rerender } = render(<Harness items={base} expose={(h,c)=>{ hook=h; ref=c; }} bottomThreshold={60} />);
    const el = ref.current;
    // User scrolls up far (distance 150 > threshold)
    defineDims(el,{ scrollTop: 1000 - 500 - 150, scrollHeight:1000, clientHeight:500 });
    fireScroll(el);
    const items = [...base, { id:'c-new' }];
    await act(async ()=> rerender(<Harness items={items} expose={h=>{ hook=h; }} bottomThreshold={60} />));
    expect(hook.newCount).toBe(1); // should create badge (expected to PASS already)
  });

  test('4. Pagination (older load) after reading a new message does not create unread badge', async () => {
    const base = Array.from({ length: 12 }).map((_,i)=>({ id:'d'+i }));
    let hook; let ref; const { rerender } = render(<Harness items={base} expose={(h,c)=>{ hook=h; ref=c; }} bottomThreshold={60} />);
    const el = ref.current;
    // At bottom
    defineDims(el,{ scrollTop:500, scrollHeight:1000, clientHeight:500 });
    fireScroll(el);
    // Receive new message at bottom (read)
    let items = [...base, { id:'d-new1' }];
    await act(async ()=> rerender(<Harness items={items} expose={h=>{ hook=h; }} bottomThreshold={60} />));
    expect(hook.newCount).toBe(0);
    // Now prepend older messages (pagination)
    const older = Array.from({ length:5 }).map((_,i)=>({ id:'d-old'+i }));
    items = [...older, ...items];
    defineDims(el,{ scrollTop:500, scrollHeight:1500, clientHeight:500 }); // pretend height grew
    await act(async ()=> rerender(<Harness items={items} expose={h=>{ hook=h; }} bottomThreshold={60} />));
    expect(hook.newCount).toBe(0); // should remain 0 (expected to PASS already)
  });
});
