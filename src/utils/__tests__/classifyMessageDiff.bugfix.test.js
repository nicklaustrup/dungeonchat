import { classifyMessageDiff } from "../../utils/classifyMessageDiff";

describe("classifyMessageDiff - Bug Fix Tests", () => {
  describe("Bug Fix: Cannot read properties of undefined (reading length)", () => {
    test("should handle null prevMessages without error", () => {
      const nextMessages = [{ id: "m1", text: "Hello" }];

      expect(() => {
        const result = classifyMessageDiff(null, nextMessages);
        expect(result).toEqual({
          didPrepend: false,
          prependedCount: 0,
          didAppend: false,
          appendedCount: 0,
          reset: false,
          prevLength: 0,
          nextLength: 0,
        });
      }).not.toThrow();
    });

    test("should handle undefined prevMessages without error", () => {
      const nextMessages = [{ id: "m1", text: "Hello" }];

      expect(() => {
        const result = classifyMessageDiff(undefined, nextMessages);
        expect(result).toEqual({
          didPrepend: false,
          prependedCount: 0,
          didAppend: false,
          appendedCount: 0,
          reset: false,
          prevLength: 0,
          nextLength: 0,
        });
      }).not.toThrow();
    });

    test("should handle null nextMessages without error", () => {
      const prevMessages = [{ id: "m1", text: "Hello" }];

      expect(() => {
        const result = classifyMessageDiff(prevMessages, null);
        expect(result).toEqual({
          didPrepend: false,
          prependedCount: 0,
          didAppend: false,
          appendedCount: 0,
          reset: false,
          prevLength: 0,
          nextLength: 0,
        });
      }).not.toThrow();
    });

    test("should handle undefined nextMessages without error", () => {
      const prevMessages = [{ id: "m1", text: "Hello" }];

      expect(() => {
        const result = classifyMessageDiff(prevMessages, undefined);
        expect(result).toEqual({
          didPrepend: false,
          prependedCount: 0,
          didAppend: false,
          appendedCount: 0,
          reset: false,
          prevLength: 0,
          nextLength: 0,
        });
      }).not.toThrow();
    });

    test("should handle both parameters null without error", () => {
      expect(() => {
        const result = classifyMessageDiff(null, null);
        expect(result).toEqual({
          didPrepend: false,
          prependedCount: 0,
          didAppend: false,
          appendedCount: 0,
          reset: false,
          prevLength: 0,
          nextLength: 0,
        });
      }).not.toThrow();
    });

    test("should handle both parameters undefined without error", () => {
      expect(() => {
        const result = classifyMessageDiff(undefined, undefined);
        expect(result).toEqual({
          didPrepend: false,
          prependedCount: 0,
          didAppend: false,
          appendedCount: 0,
          reset: false,
          prevLength: 0,
          nextLength: 0,
        });
      }).not.toThrow();
    });
  });

  describe("Normal functionality should still work", () => {
    test("should detect appends correctly", () => {
      const prev = [{ id: "m1", text: "Hello" }];
      const next = [
        { id: "m1", text: "Hello" },
        { id: "m2", text: "World" },
      ];

      const result = classifyMessageDiff(prev, next);

      expect(result.didAppend).toBe(true);
      expect(result.appendedCount).toBe(1);
      expect(result.didPrepend).toBe(false);
      expect(result.reset).toBe(false);
    });

    test("should detect prepends correctly", () => {
      const prev = [{ id: "m2", text: "World" }];
      const next = [
        { id: "m1", text: "Hello" },
        { id: "m2", text: "World" },
      ];

      const result = classifyMessageDiff(prev, next);

      expect(result.didPrepend).toBe(true);
      expect(result.prependedCount).toBe(1);
      expect(result.didAppend).toBe(false);
      expect(result.reset).toBe(false);
    });

    test("should handle empty arrays correctly", () => {
      expect(() => {
        const result = classifyMessageDiff([], []);
        expect(result).toEqual({
          didPrepend: false,
          prependedCount: 0,
          didAppend: false,
          appendedCount: 0,
          reset: false,
          prevLength: 0,
          nextLength: 0,
        });
      }).not.toThrow();
    });

    test("should detect initial hydration (empty to filled)", () => {
      const prev = [];
      const next = [
        { id: "m1", text: "Hello" },
        { id: "m2", text: "World" },
      ];

      const result = classifyMessageDiff(prev, next);

      // Initial hydration should not be classified as prepend or append
      expect(result.didAppend).toBe(false);
      expect(result.didPrepend).toBe(false);
      expect(result.appendedCount).toBe(0);
      expect(result.prependedCount).toBe(0);
      expect(result.reset).toBe(false);
    });
  });

  describe("Error scenarios that previously caused crashes", () => {
    test("should handle messages with missing id properties", () => {
      const prev = [{ text: "Hello" }]; // Missing id
      const next = [{ text: "Hello" }, { id: "m2", text: "World" }];

      expect(() => {
        classifyMessageDiff(prev, next);
      }).not.toThrow();
    });

    test("should handle messages with null id properties", () => {
      const prev = [{ id: null, text: "Hello" }];
      const next = [
        { id: null, text: "Hello" },
        { id: "m2", text: "World" },
      ];

      expect(() => {
        classifyMessageDiff(prev, next);
      }).not.toThrow();
    });

    test("should handle mixed valid/invalid message objects", () => {
      const prev = [
        { id: "m1", text: "Valid" },
        null, // Invalid message
        { text: "No ID" }, // Missing ID
        { id: "m2", text: "Valid" },
      ];

      const next = [
        { id: "m1", text: "Valid" },
        { id: "m2", text: "Valid" },
        { id: "m3", text: "New" },
      ];

      expect(() => {
        classifyMessageDiff(prev, next);
      }).not.toThrow();
    });
  });

  describe("Real-world scenarios that caused issues", () => {
    test("should handle Firebase loading state transitions", () => {
      // Scenario: useCollection hook returns undefined initially, then loads data

      // Initial state - hook returns undefined
      expect(() => {
        classifyMessageDiff(undefined, undefined);
      }).not.toThrow();

      // Transition - previous undefined, new data loaded
      const messages = [{ id: "m1", text: "First message" }];
      expect(() => {
        classifyMessageDiff(undefined, messages);
      }).not.toThrow();

      // Normal operation - both arrays exist
      const newMessages = [...messages, { id: "m2", text: "Second message" }];
      expect(() => {
        const result = classifyMessageDiff(messages, newMessages);
        expect(result.didAppend).toBe(true);
      }).not.toThrow();
    });

    test("should handle component unmount scenarios", () => {
      const messages = [{ id: "m1", text: "Hello" }];

      // Component unmounting, context cleared
      expect(() => {
        classifyMessageDiff(messages, null);
      }).not.toThrow();

      expect(() => {
        classifyMessageDiff(messages, undefined);
      }).not.toThrow();
    });

    test("should handle network error recovery", () => {
      const prevMessages = [{ id: "m1", text: "Hello" }];

      // Network error - Firebase returns undefined/null
      expect(() => {
        classifyMessageDiff(prevMessages, null);
      }).not.toThrow();

      // Recovery - data comes back
      const recoveredMessages = [{ id: "m1", text: "Hello" }];
      expect(() => {
        const result = classifyMessageDiff(null, recoveredMessages);
        expect(result.reset).toBe(false); // Should not be considered a reset
      }).not.toThrow();
    });
  });
});
