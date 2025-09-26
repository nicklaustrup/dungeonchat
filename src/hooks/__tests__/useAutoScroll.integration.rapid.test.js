import React from 'react';
import { render, act } from '@testing-library/react';
import { useAutoScroll } from '../useAutoScroll';

// Minimal IntersectionObserver stub
class IO { constructor(cb){ this.cb = cb; } observe(){} disconnect(){} unobserve(){} }
beforeAll(()=>{ global.IntersectionObserver = IO; if(!global.requestAnimationFrame){ global.requestAnimationFrame = cb=>setTimeout(cb,0);} });

function defineDims(el,{ scrollTop=0, scrollHeight=1000, clientHeight=400 }){
  Object.defineProperty(el,'scrollTop',{ configurable:true, get:()=>el.__st ?? scrollTop, set:v=>{ el.__st=v; }});
  Object.defineProperty(el,'scrollHeight',{ configurable:true, get:()=>el.__sh ?? scrollHeight, set:v=>{ el.__sh=v; }});
  Object.defineProperty(el,'clientHeight',{ configurable:true, get:()=>clientHeight });
}

function Harness({ items, expose }){
  const cRef = React.useRef(null); const aRef = React.useRef(null);
  const vals = useAutoScroll({ containerRef:cRef, anchorRef:aRef, items, bottomThreshold:60 });
  React.useEffect(()=>{ expose && expose(vals, cRef); });
  return <div ref={cRef}>{items.map(m=> <div key={m.id}>{m.id}</div>)}<div ref={aRef} /></div>;
}

describe('Rapid alternating pagination + appends integration', () => {
  test('unread logic stable across alternating prepend/append cycles', async () => {
    // Start with base messages
    let items = Array.from({ length: 30 }).map((_,i)=>({ id:'m'+i }));
    let hook; let cRef; const { rerender } = render(<Harness items={items} expose={(h,c)=>{ hook=h; cRef=c; }} />);
    const el = cRef.current; defineDims(el,{ scrollTop:600, scrollHeight:1000, clientHeight:400 }); // at bottom (distance 0)
    act(()=>{ el.dispatchEvent(new Event('scroll')); });
    expect(hook.isAtBottom).toBe(true);
    // Append new message while at bottom => should auto-scroll & unread stays 0
    items = [...items, { id:'m30' }]; defineDims(el,{ scrollTop:600, scrollHeight:1025, clientHeight:400 });
    await act(async ()=> rerender(<Harness items={items} expose={h=>{ hook=h; }} />));
    expect(hook.newCount).toBe(0);
    // User scrolls up a bit (leave hard bottom)
    defineDims(el,{ scrollTop:500, scrollHeight:1025, clientHeight:400 }); act(()=> el.dispatchEvent(new Event('scroll')));
    expect(hook.isAtBottom).toBe(false);
    // Append 2 more => should increment unread by 2
    items = [...items, { id:'m31' }, { id:'m32' }]; defineDims(el,{ scrollTop:500, scrollHeight:1075, clientHeight:400 });
    await act(async ()=> rerender(<Harness items={items} expose={h=>{ hook=h; }} />));
    expect(hook.newCount).toBe(2);
    // Simulate pagination (prepend 10 older) while scrolled up; unread should remain 2, not increase
    const older = Array.from({ length:10 }).map((_,i)=>({ id:'o'+i }));
    items = [...older, ...items]; defineDims(el,{ scrollTop:500, scrollHeight:1375, clientHeight:400 });
    await act(async ()=> rerender(<Harness items={items} expose={h=>{ hook=h; }} />));
    expect(hook.newCount).toBe(2);
    // Scroll back to bottom (mark read)
    defineDims(el,{ scrollTop:1375-400, scrollHeight:1375, clientHeight:400 }); act(()=> el.dispatchEvent(new Event('scroll')));
    expect(hook.isAtBottom).toBe(true); expect(hook.newCount).toBe(0);
    // Append again while at bottom; unread remains 0
    items = [...items, { id:'m33' }]; defineDims(el,{ scrollTop:1375-400, scrollHeight:1400, clientHeight:400 });
    await act(async ()=> rerender(<Harness items={items} expose={h=>{ hook=h; }} />));
    expect(hook.newCount).toBe(0);
  });
});
