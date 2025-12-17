import { classifyMessageDiff } from "../utils/classifyMessageDiff";

describe("classifyMessageDiff", () => {
  const msgs = (ids) => ids.map((id) => ({ id }));

  test("initial hydrate treated as neither prepend nor append", () => {
    const res = classifyMessageDiff([], msgs(["a", "b", "c"]));
    expect(res.didPrepend).toBe(false);
    expect(res.didAppend).toBe(false);
    expect(res.reset).toBe(false);
  });

  test("pure append", () => {
    const prev = msgs(["a", "b", "c"]);
    const next = msgs(["a", "b", "c", "d", "e"]);
    const res = classifyMessageDiff(prev, next);
    expect(res.didAppend).toBe(true);
    expect(res.appendedCount).toBe(2);
    expect(res.didPrepend).toBe(false);
  });

  test("pure prepend", () => {
    const prev = msgs(["d", "e", "f"]);
    const next = msgs(["a", "b", "c", "d", "e", "f"]);
    const res = classifyMessageDiff(prev, next);
    expect(res.didPrepend).toBe(true);
    expect(res.prependedCount).toBe(3);
    expect(res.didAppend).toBe(false);
  });

  test("prepend + append simultaneously", () => {
    const prev = msgs(["d", "e", "f"]);
    const next = msgs(["b", "c", "d", "e", "f", "g"]);
    const res = classifyMessageDiff(prev, next);
    expect(res.didPrepend).toBe(true);
    expect(res.prependedCount).toBe(2);
    expect(res.didAppend).toBe(true);
    expect(res.appendedCount).toBe(1);
  });

  test("reset detection - disjoint sets", () => {
    const prev = msgs(["a", "b", "c"]);
    const next = msgs(["x", "y", "z"]);
    const res = classifyMessageDiff(prev, next);
    expect(res.reset).toBe(true);
    expect(res.didPrepend).toBe(false);
    expect(res.didAppend).toBe(false);
  });
});
