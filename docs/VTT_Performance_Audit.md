# Virtual Tabletop (Konva) Performance Optimization To‑Do List

Status Legend: ⭕ Not Started · 🟡 In Progress · ✅ Complete · 🚫 Skipped

Priority Legend: P1 (Highest Impact) → P3 (Lower Impact)

---
## Phase Overview
| Phase | Goal | Core Outcomes |
|-------|------|---------------|
| 1 | Restructure layers & isolate high-frequency updates | Reduced full-layer redraws, stable FPS during drags/animations |
| 2 | Replace React-driven transient animation state with imperative refs | Near-elimination of unnecessary React renders per frame |
| 3 | Memoize + stabilize component/handler identities | Minimal diffing for static nodes (tokens, shapes) |
| 4 | Apply node / group caching & rasterization | Fewer vector recalculations; lower CPU/GPU cost |
| 5 | Optimize data flows (Firestore batching, fog, lights) | Lower network + compute churn |
| 6 | Optional advanced enhancements | Progressive quality + scalability improvements |

---
## Phase 1 – Layer Architecture (P1)
Goal: Separate static vs. dynamic drawing surfaces; remove cross-contamination of redraw triggers.

| ID | Task | File / Scope | Action Steps | Verification |
|----|------|--------------|--------------|--------------|
| 1.1 | Split Background from Dynamic Highlight | `MapCanvas.jsx` (Stage layers) | 1. Create `BackgroundLayer` (map image only). 2. Move token snap highlight `<Rect>` into new `SnapFeedbackLayer` above it. 3. Optionally use `FastLayer` for highlight. | ✅ Implemented: `BackgroundLayer.jsx` & `SnapFeedbackLayer.jsx`; background no longer rerenders during token drag. |
| 1.2 | Decompose Monolithic Effects Layer | `MapCanvas.jsx` current combined shapes/drawings/pings/ruler/etc. | Create explicit layers: `ShapesLayer`, `DrawingsLayer`, `MeasurementLayer`, `PingLayer`, (light previews kept inline). | ✅ Implemented new layer components; removed monolithic block. |
| 1.3 | Isolate Fog Rendering | Player + DM fog block loops | Wrap fog into `FogLayer` components receiving immutable props; mark `listening={false}`. | ✅ `FogLayer.jsx` created; both player & DM fog paths use it. |
| 1.4 | Introduce Optional Fog Raster Path | New `FogRasterizer` helper | When fog cell count > threshold (e.g. 4k), pre-render to offscreen `<canvas>` → pass to `<Konva.Image>`. | ✅ Implemented inside `FogLayer.jsx` (prop `rasterThreshold`, default 4000). Uses offscreen canvas keyed by visibility hash; falls back to vector for smaller grids. |
| 1.5 | Token Layer Extraction | Token rendering block | Move token mapping into `TokenLayer` component (memoized). | ✅ `TokenLayer.jsx` implemented; token & light control logic moved. |

---
## Phase 2 – Imperative Interaction & Animation (P1)
Goal: Remove per-frame React state churn for live tools (pen, ruler, pings, shape preview, snap pulse).

| ID | Task | Scope | Action Steps | Verification |
|----|------|-------|-------------|--------------|
| 2.1 | Pen Tool Ref Migration | `MapCanvas.jsx` pen logic | Replaced transient state with refs (`penPointsRef`, `penLiveLineRef`) + layer `batchDraw()`. Persist only on mouseup. | ✅ Live stroke no React churn per point. |
| 2.2 | Ruler Live Update via Refs | Ruler logic | Start remains in state; end tracked via `rulerEndRef` + `rulerTempLineRef` imperatively. | ✅ Pointer move doesn't trigger React re-render. |
| 2.3 | Shape Preview Imperative | Shape creation flow | Imperative geometry updates via `shapePreviewRef` (circle/rect/line/cone) and `batchDraw()`. | ✅ Preview updates each frame without state updates. |
| 2.4 | Ping Animation Refactor | Pings fade logic | Replace interval + state spread with rAF loop iterating ping nodes in `PingLayer`. Update alpha; call `batchDraw()`. | ✅ Implemented rAF in `PingLayer.jsx` (imperative node mutation, no React churn). |
| 2.5 | Snap Highlight Pulse Refactor | Snap highlight | Pulse handled inside `SnapFeedbackLayer` rAF; removed `tokenSnapPulse` state. | ✅ No React renders during pulse. |
| 2.6 | Light Drag Preview | Light dragging | Use refs for preview circles; update positions w/out React state except final commit. | ✅ Implemented via `LightInteractionLayer` + imperative API (`show/move/hide`). |

---
## Phase 3 – Memoization & Stable Identities (P2)
Goal: Prevent avoidable reconciliation / diffing.

| ID | Task | Scope | Action Steps | Verification |
|----|------|-------|-------------|--------------|
| 3.1 | Memoize Handlers | All Stage & token handlers | Wrap stage handlers (`handleWheel` etc.) in `useCallback`. Hoist per-token handlers. | ✅ Core stage handlers wrapped (`handleWheel/DragEnd/StageClick/MouseDown/Move`). |
| 3.2 | `TokenSprite` Memoization | `TokenSprite.jsx` | Wrap with `React.memo` + custom equality comparing position, hp, status length, selection. | ✅ Implemented `areEqual` custom comparator. |
| 3.3 | Stage Style Memoization | `MapCanvas.jsx` | Memoize `style` object. | ✅ `stageStyle` useMemo added. |
| 3.4 | Derived Fog Cells Hash | `FogLayer` | Compute `fogVersion` (hash of visibility array) – only rebuild cells when hash changes. | ✅ `fogVersionKey` already implemented; confirms Phase 3 requirement. |
| 3.5 | Memoize Lights Array | Lights merge operation | `useMemo([...lights, ...playerTokenLights].filter(...))`. | ✅ `mergedLights` useMemo added. |

---
## Phase 4 – Konva Node / Group Caching (P3)
Goal: Cache expensive composite nodes.

| ID | Task | Scope | Action Steps | Verification |
|----|------|-------|-------------|--------------|
| 4.1 | Token Group Cache | `TokenSprite` Group | After mount or changes (image, hp, status), call `groupRef.current.cache({ pixelRatio:1 })`. | ✅ Implemented (`groupRef` + effect, skips during drag). |
| 4.2 | Static Shapes Cache | Non-animated shapes | Cache each after first render. Only update opacity. | ✅ Persistent shapes grouped & cached; ephemeral (fading) shapes excluded. |
| 4.3 | Pinned Ruler Cache | Pinned measurement UI | Cache the measurement group post-creation. | ✅ Pinned rulers grouped & cached (dynamic active ruler uncached). |
| 4.4 | Grid Cache | `GridLayer` | Cache entire layer after build. Invalidate on grid change. | ✅ `Group` + `cache()` after lines generation. |
| 4.5 | Optional Light Gradient Cache | Lighting | Pre-render gradient to offscreen canvas if flicker disabled. | ✅ Static non-flicker lights cached to images (`mask` + `glow`); dynamic lights still live. |

---
## Phase 5 – Data & Network Flow Optimizations (P1/P2 Mixed)
Goal: Reduce backend & CPU churn.

| ID | Task | Scope | Action Steps | Verification |
|----|------|-------|-------------|--------------|
| 5.1 | Fog Reveal Batching | Fog reveal loops | Accumulate changed indices; send single update. | ✅ Batching via `queueRevealCell` + timed flush (250ms). |
| 5.2 | Light Reveal Diffing | Light-driven fog | Track prior reveal radius cells; only send delta. | ✅ `lightRevealChanged` skips unchanged light centers. |
| 5.3 | Debounce Shape Preview Broadcast | Shape preview updates | Throttle broadcast to e.g. 30Hz using `requestAnimationFrame` guard. | ✅ Implemented rAF + min-interval scheduler (~30Hz) in `MapCanvas.jsx` (Phase 5.3). |
| 5.4 | Token Move Persistence Guard | Token drag | Ensure no mid-drag writes slip in (audit code paths). | ✅ Only drag-end queues reveal; no mid-drag writes. |
| 5.5 | Lazy Load High-Res Map | Background image | Load low-res first, swap once high-res complete. | ✅ Progressive low→high cross-fade (250ms) in `BackgroundLayer.jsx`; faster first paint. |

---
## Phase 6 – Advanced / Optional Enhancements
| ID | Task | Description | Verification |
|----|------|-------------|--------------|
| 6.1 | Multi-Resolution Background | Provide mip levels & swap by zoom | ✅ Implemented basic 0.5x / 0.25x variants & selection by `stageScale` in `BackgroundLayer.jsx`. |
| 6.2 | Light Mask Composition | Single blended mask per frame | ✅ Composite mask + glow canvases (one `KonvaImage` pair) in `LightingLayer.jsx`. |
| 6.3 | Performance Overlay | FPS + render counts overlay | ✅ `PerformanceOverlay.jsx` with FPS/ms/draw counters + toggle. |
| 6.4 | Interaction FSM | Replace scattered tool conditionals | Code complexity & bug density reduced (review). |
| 6.5 | Offscreen Worker Raster | Fog & lighting precompute in Web Worker | ✅ Fog raster offloaded (worker: `vttRasterWorkerFactory.js`); lighting static path available for extension. |

---
## Verification Toolkit
| Tool | Purpose | Quick Setup |
|------|---------|-------------|
| React Profiler | Count renders & measure commit times | Wrap dev session with Profiler in React DevTools |
| Custom Render Counter | Track per-component renders | Add `useRef` increment + `if(dev)` console.log |
| Konva Layer Debug | Ensure only intended layers redraw | Temporarily monkey-patch `layer.draw` to log layer names |
| Performance Timeline | Frame time & scripting cost | Chrome DevTools → Performance record while dragging |
| Network Panel | Firestore write frequency | Filter by `firestore.googleapis.com` |

---
## Baseline Metrics (Fill Before Starting)
| Metric | Scenario | Baseline | Target |
|--------|----------|----------|--------|
| Average FPS | Dragging large token (5x5) | (record) | ≥ 55 fps |
| React renders / token drag | Single token move | (record) | 1 (initial) |
| Firestore writes / 5 sec token drag | 5s continuous drag | (record) | 1 (final commit only) |
| Fog render time | 100x100 fog grid | (record) | -40% |
| Pen latency (ms) | Live stroke | (record) | < 16ms frame update |

---
## Completion Checklist (Mark as You Progress)
- [x] Phase 1 complete (layers split, fog isolated, highlight separated)
- [x] Phase 2 complete (all transient interactions imperative)
- [x] Phase 3 complete (stable identities + memoization)
- [x] Phase 4 complete (caching applied where beneficial)
- [x] Phase 5 baseline vs. improved metrics captured (pending actual metric recording; functional tasks 5.1–5.5 done)
- [ ] Optional advanced items evaluated / scheduled
- [ ] Documentation updated (add summary to `VTT_DOCUMENTATION_SUMMARY.md`)

---
## Execution Order (Condensed Quick Path)
1. Split layers (1.1–1.5)
2. Refactor pen / ruler / preview / pings to refs (2.x)
3. Memoize + `React.memo(TokenSprite)` (3.1–3.3)
4. Apply caching (4.x)
5. Batch fog + shape/light network (5.x)
6. Optional advanced enhancements (6.x)

---
## Rollback / Risk Notes
| Change Type | Risk | Mitigation |
|-------------|------|------------|
| Imperative refs | Drift from React state | Keep authoritative commit step; guard null refs |
| Raster fog | Visual parity issues | Feature flag + checksum compare of cell counts |
| Layer splitting | Z-order regressions | Write explicit ordering test notes / visual QA list |
| Caching | Stale visuals after prop change | Invalidate cache in `useEffect` on dependency change |

---
## Post-Implementation Validation Script (Human-Friendly)
1. Start app; load a large map (≥ 3000x3000 px, dense fog).
2. Drag a single medium token for 5 seconds while DevTools Performance recording.
3. Confirm:
   - React render count for other tokens stays constant.
   - Only dynamic layers log draws (if logging enabled).
   - FPS ≥ target range.
4. Draw a continuous pen stroke for 4 seconds:
   - No React state spam in console.
   - Stroke remains smooth.
5. Activate ruler and move pointer rapidly:
   - Distance updates visually each frame; React renders minimal.
6. Trigger 3 simultaneous pings:
   - Pings animate; CPU not spiking; no map image redraw.
7. Toggle fog visibility & ensure raster / vector parity (optional A/B diff snapshot).
8. Move a light source with flicker on:
   - Light updates smoothly; only lighting layer redraws.
9. Check Network panel for token drag: only final position write.
10. Record final metrics table vs. baseline.

---
## After Action Report Template (Fill In)
```
Date: YYYY-MM-DD
Phases Completed: 1–5 (Y/N each)
Baseline vs Final Metrics:
  FPS Drag:  ___ → ___
  React Renders (Token Drag): ___ → ___
  Fog Render Time: ___ → ___
  Writes / Drag: ___ → ___
Notable Wins:
Remaining Bottlenecks:
Next Iteration Targets:
```

---
## Ownership & Follow-Up
| Area | Owner (Assign) | Review Cadence |
|------|----------------|----------------|
| Layer Architecture |  | Quarterly |
| Fog System |  | Monthly |
| Interaction Tools |  | Monthly |
| Rendering Perf Budget |  | Before major feature merges |

---
Feel free to adjust thresholds once empirical data is collected. Start by establishing a solid baseline BEFORE merging Phase 1.
