import React from 'react';
import { render, act } from '@testing-library/react';
import { useAutoScroll } from '../useAutoScroll';

class IO { constructor(cb){ this.cb = cb; } observe(){} disconnect(){} unobserve(){} }
beforeAll(()=>{ global.IntersectionObserver = IO; if(!global.requestAnimationFrame){ global.requestAnimationFrame = cb=>setTimeout(cb,0);} });

function defineDims(el,{ scrollTop=0, scrollHeight=1000, clientHeight=500 }){
  Object.defineProperty(el,'scrollTop',{ configurable:true, get:()=>scrollTop, set:v=>{ scrollTop=v; }});
  Object.defineProperty(el,'scrollHeight',{ configurable:true, get:()=>scrollHeight });
  Object.defineProperty(el,'clientHeight',{ configurable:true, get:()=>clientHeight });
}

function Harness({ items, expose, bottomThreshold=60 }){
  const cRef = React.useRef(null); const aRef = React.useRef(null);
  const hook = useAutoScroll({ containerRef:cRef, anchorRef:aRef, items, bottomThreshold });
  React.useEffect(()=>{ expose && expose(hook, cRef); });
  return <div ref={cRef}>{items.map(m => <div key={m.id}>{m.id}</div>)}<div ref={aRef} /></div>;
}

const fireScroll = el => act(()=> el.dispatchEvent(new Event('scroll')));

describe('Regression: near-bottom appends remain read (read zone integrity)', () => {
  test('A. Append while 25px from bottom (within read zone) -> unread stays 0', async () => {
    const base = Array.from({ length: 25 }).map((_,i)=>({ id:'a'+i }));
    let hook; let ref; const { rerender } = render(<Harness items={base} expose={(h,c)=>{ hook=h; ref=c; }} bottomThreshold={60} />);
    const el = ref.current;
    defineDims(el,{ scrollTop: 1000 - 500 - 25, scrollHeight:1000, clientHeight:500 });
    fireScroll(el);
    const items = [...base, { id:'a-new' }];
    await act(async ()=> rerender(<Harness items={items} expose={h=>{ hook=h; }} bottomThreshold={60} />));
    expect(hook.newCount).toBe(0);
  });

  test('B. Slight scroll (30px) after first new message still within read zone -> second append unread stays 0', async () => {
    const base = Array.from({ length: 15 }).map((_,i)=>({ id:'b'+i }));
    let hook; let ref; const { rerender } = render(<Harness items={base} expose={(h,c)=>{ hook=h; ref=c; }} bottomThreshold={60} />);
    const el = ref.current;
    defineDims(el,{ scrollTop:500, scrollHeight:1000, clientHeight:500 }); fireScroll(el); // hard bottom
    let items = [...base, { id:'b-new1' }];
    await act(async ()=> rerender(<Harness items={items} expose={h=>{ hook=h; }} bottomThreshold={60} />));
    expect(hook.newCount).toBe(0); // first append at bottom
    defineDims(el,{ scrollTop: 1000 - 500 - 30, scrollHeight:1000, clientHeight:500 }); fireScroll(el); // slight scroll up
    items = [...items, { id:'b-new2' }];
    await act(async ()=> rerender(<Harness items={items} expose={h=>{ hook=h; }} bottomThreshold={60} />));
    expect(hook.newCount).toBe(0);
  });

  test('C. Mini upward nudge (18px) then append -> unread stays 0', async () => {
    const base = Array.from({ length: 10 }).map((_,i)=>({ id:'c'+i }));
    let hook; let ref; const { rerender } = render(<Harness items={base} expose={(h,c)=>{ hook=h; ref=c; }} bottomThreshold={60} />);
    const el = ref.current;
    defineDims(el,{ scrollTop:500, scrollHeight:1000, clientHeight:500 }); fireScroll(el); // bottom
    defineDims(el,{ scrollTop: 1000 - 500 - 18, scrollHeight:1000, clientHeight:500 }); fireScroll(el); // nudge
    const items = [...base, { id:'c-new' }];
    await act(async ()=> rerender(<Harness items={items} expose={h=>{ hook=h; }} bottomThreshold={60} />));
    expect(hook.newCount).toBe(0);
  });
});

// Converted former meta-fail into a regression: appending at hard bottom should NOT increment unread
describe('Regression: hard bottom append remains read', () => {
  test('Append while explicitly at hard bottom keeps unread at 0', async () => {
    const base = Array.from({ length: 8 }).map((_,i)=>({ id:'mf'+i }));
    let hook; let ref; const { rerender } = render(<Harness items={base} expose={(h,c)=>{ hook=h; ref=c; }} bottomThreshold={70} />);
    const el = ref.current;
    defineDims(el,{ scrollTop:500, scrollHeight:1000, clientHeight:500 }); fireScroll(el); // bottom
    const items = [...base, { id:'mf-new' }];
    await act(async ()=> rerender(<Harness items={items} expose={h=>{ hook=h; }} bottomThreshold={70} />));
    expect(hook.newCount).toBe(0);
  });
});
