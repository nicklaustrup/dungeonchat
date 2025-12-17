// Environment & interaction telemetry capture (Phase 5)
// Lightweight anonymous in-memory telemetry.
const _queue = [];
export function logTelemetry(event) {
  _queue.push({ ts: Date.now(), ...event });
  if (_queue.length > 200) _queue.shift();
}
export function getTelemetrySnapshot() {
  return [..._queue];
}

let _snapshotSent = false;
let _firstInteractionSent = false;
let _pendingResize = null;
let _scrollSamples = [];

function bucket(value, size) {
  const start = Math.floor(value / size) * size;
  return `${start}-${start + size - 1}`;
}

function computeEnv() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const dpr = Number((window.devicePixelRatio || 1).toFixed(2));
  const coarse = matchMedia("(pointer: coarse)").matches;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const orientation = (
    window.screen?.orientation?.type || (w > h ? "landscape" : "portrait")
  ).split("-")[0];
  return {
    wBucket: bucket(w, 100),
    hBucket: bucket(h, 100),
    dpr,
    coarse,
    reduced,
    orientation,
  };
}

function sendSnapshot(reason = "init") {
  const env = computeEnv();
  logTelemetry({ type: "env-snapshot", reason, ...env });
  _snapshotSent = true;
}

function handleResize() {
  if (_pendingResize) cancelAnimationFrame(_pendingResize);
  _pendingResize = requestAnimationFrame(() => {
    const env = computeEnv();
    logTelemetry({ type: "env-shift", ...env });
  });
}

function handleFirstInteraction(e) {
  if (_firstInteractionSent) return;
  _firstInteractionSent = true;
  logTelemetry({
    type: "first-interaction",
    sinceLoadMs: performance.now(),
    event: e.type,
  });
  window.removeEventListener("pointerdown", handleFirstInteraction, true);
  window.removeEventListener("keydown", handleFirstInteraction, true);
}

function handleScroll() {
  const start = performance.now();
  requestAnimationFrame(() => {
    const delay = performance.now() - start;
    _scrollSamples.push(delay);
    if (_scrollSamples.length >= 10) {
      const avg = Number(
        (
          _scrollSamples.reduce((a, b) => a + b, 0) / _scrollSamples.length
        ).toFixed(2)
      );
      logTelemetry({ type: "scroll-sample", avgFrameDelayMs: avg });
      _scrollSamples = [];
    }
  });
}

export function initTelemetry() {
  if (typeof window === "undefined") return;
  if (!_snapshotSent) sendSnapshot("init");
  window.addEventListener("resize", handleResize, { passive: true });
  window.addEventListener("orientationchange", handleResize, { passive: true });
  window.addEventListener("pointerdown", handleFirstInteraction, true);
  window.addEventListener("keydown", handleFirstInteraction, true);
  window.addEventListener("scroll", handleScroll, { passive: true });
}

export function teardownTelemetry() {
  window.removeEventListener("resize", handleResize);
  window.removeEventListener("orientationchange", handleResize);
  window.removeEventListener("pointerdown", handleFirstInteraction, true);
  window.removeEventListener("keydown", handleFirstInteraction, true);
  window.removeEventListener("scroll", handleScroll);
}

// For tests
export function _resetTelemetryForTests() {
  _queue.length = 0;
  _snapshotSent = false;
  _firstInteractionSent = false;
  _scrollSamples = [];
}
