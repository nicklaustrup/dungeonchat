import React from 'react';
import { render, act } from '@testing-library/react';
import { useAutoScroll } from '../useAutoScroll';

class IO { constructor(cb){ this.cb=cb; } observe(){} disconnect(){} unobserve(){} }
beforeAll(()=>{ global.IntersectionObserver = IO; if(!global.requestAnimationFrame){ global.requestAnimationFrame = cb=>setTimeout(cb,0);} });

function defineDims(el,{ scrollTop=0, scrollHeight=800, clientHeight=400 }){
  Object.defineProperty(el,'scrollTop',{ configurable:true, get:()=>el.__st ?? scrollTop, set:v=>{ el.__st=v; }});
  Object.defineProperty(el,'scrollHeight',{ configurable:true, get:()=>el.__sh ?? scrollHeight, set:v=>{ el.__sh=v; }});
  Object.defineProperty(el,'clientHeight',{ configurable:true, get:()=>clientHeight });
}

function Harness({ items, expose, bottomThreshold=60 }){
  const cRef = React.useRef(null); const aRef = React.useRef(null);
  const hook = useAutoScroll({ containerRef:cRef, anchorRef:aRef, items, bottomThreshold });
  React.useEffect(()=>{ expose && expose(hook, cRef); });
  return <div ref={cRef}>{items.map(m=> <div key={m.id}>{m.id}</div>)}<div ref={aRef} /></div>;
}

const fire = el => act(()=> el.dispatchEvent(new Event('scroll')));

/**
 * Meta-fail: Sequence where an append and a pagination prepend occur nearly together can cause unread misclassification.
 * Desired: If user was at bottom, final unread count should remain 0.
 * We assert desired state but force fail if reproduction not shown.
 */

describe('MetaFail: append + immediate pagination race', () => {
  test('Desired: append+paginate while at bottom keeps unread at 0', async () => {
    let items = Array.from({ length: 12 }).map((_,i)=>({ id:'m'+i }));
    let hook; let ref; const { rerender } = render(<Harness items={items} expose={(h,c)=>{ hook=h; ref=c; }} bottomThreshold={80} />);
    const el = ref.current; defineDims(el,{ scrollTop:400, scrollHeight:800, clientHeight:400 }); fire(el); // bottom
    // Step 1: Append a tail message
    items = [...items, { id:'tail-x' }];
    await act(async()=> rerender(<Harness items={items} expose={(h)=>{ hook=h; }} bottomThreshold={80} />));
    // Step 2: Immediately paginate older (prepend) BEFORE user scroll
    const older = Array.from({ length:5 }).map((_,i)=>({ id:'old'+i }));
    items = [...older, ...items];
    defineDims(el,{ scrollTop:400, scrollHeight:1200, clientHeight:400 }); // height change
    await act(async()=> rerender(<Harness items={items} expose={(h)=>{ hook=h; }} bottomThreshold={80} />));
    expect(hook.newCount).toBe(0); // regression: unread should remain 0
  });
});
