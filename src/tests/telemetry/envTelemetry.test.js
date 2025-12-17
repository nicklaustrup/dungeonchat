import {
  initTelemetry,
  _resetTelemetryForTests,
  getTelemetrySnapshot,
} from "../../telemetry/envTelemetry";

// jsdom may not implement PointerEvent; provide a minimal shim
if (typeof window.PointerEvent === "undefined") {
  // eslint-disable-next-line no-global-assign
  global.PointerEvent = class PointerEvent extends MouseEvent {
    constructor(type, params = {}) {
      super(type, params);
    }
  };
}

describe("envTelemetry", () => {
  beforeEach(() => {
    _resetTelemetryForTests();
  });
  test("captures an env-snapshot on init", () => {
    initTelemetry();
    const snap = getTelemetrySnapshot();
    expect(snap.some((e) => e.type === "env-snapshot")).toBe(true);
  });
  test("first interaction event logged once", () => {
    initTelemetry();
    window.dispatchEvent(new PointerEvent("pointerdown"));
    window.dispatchEvent(new PointerEvent("pointerdown"));
    const snap = getTelemetrySnapshot().filter(
      (e) => e.type === "first-interaction"
    );
    expect(snap.length).toBe(1);
  });
});
