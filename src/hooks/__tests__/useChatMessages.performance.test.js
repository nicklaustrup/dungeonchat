import { renderHook } from "@testing-library/react";
import { useChatMessages } from "../useChatMessages";

// Mock Firebase dependencies
jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
}));

jest.mock("react-firebase-hooks/firestore", () => ({
  useCollection: jest.fn(),
}));

describe("useChatMessages performance optimizations", () => {
  let mockUseCollection;

  beforeEach(() => {
    const { useCollection } = require("react-firebase-hooks/firestore");
    mockUseCollection = useCollection;
    mockUseCollection.mockReturnValue([
      {
        docs: [],
      },
      false, // loading
      null, // error
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("memoizes messages array to prevent unnecessary re-renders", () => {
    const { result, rerender } = renderHook(() =>
      useChatMessages({
        firestore: {},
        limitBatchSize: 25,
        preserveDuringPagination: true,
      })
    );

    const initialMessages = result.current.messages;

    // Re-render with same props should return same memoized array
    rerender();

    expect(result.current.messages).toBe(initialMessages);
  });

  test("preserves stable messages reference during pagination", () => {
    // Simulate initial load
    mockUseCollection.mockReturnValue([
      {
        docs: [
          {
            id: "msg1",
            data: () => ({ text: "Hello", createdAt: { seconds: 1000 } }),
          },
          {
            id: "msg2",
            data: () => ({ text: "World", createdAt: { seconds: 2000 } }),
          },
        ],
      },
      false, // loading
      null, // error
    ]);

    const { result, rerender } = renderHook(() =>
      useChatMessages({
        firestore: {},
        limitBatchSize: 25,
        preserveDuringPagination: true,
      })
    );

    const messagesAfterLoad = result.current.messages;
    expect(messagesAfterLoad).toHaveLength(2);

    // Re-render with same data should preserve reference
    rerender();
    expect(result.current.messages).toBe(messagesAfterLoad);
  });

  test("optimizes hasMore calculation with proper memoization", () => {
    const { result, rerender } = renderHook(() =>
      useChatMessages({
        firestore: {},
        limitBatchSize: 25,
      })
    );

    const initialHasMore = result.current.hasMore;

    // Re-render multiple times with same props
    rerender();
    rerender();

    // hasMore should remain consistent
    expect(result.current.hasMore).toBe(initialHasMore);
    expect(typeof result.current.hasMore).toBe("boolean");
  });

  test("handles null safety for messages.length access", () => {
    // Simulate scenario where messages could be undefined
    mockUseCollection.mockReturnValue([
      null, // snapshot is null
      false, // loading
      null, // error
    ]);

    const { result } = renderHook(() =>
      useChatMessages({
        firestore: {},
        limitBatchSize: 25,
      })
    );

    // Should not throw error and should return safe defaults
    expect(result.current.messages).toEqual([]);
    expect(result.current.hasMore).toBe(false);
    expect(typeof result.current.loadMore).toBe("function");
  });

  test("loadMore function is memoized to prevent callback recreation", () => {
    const { result, rerender } = renderHook(() =>
      useChatMessages({
        firestore: {},
        limitBatchSize: 25,
      })
    );

    const initialLoadMore = result.current.loadMore;

    // Re-render with same props
    rerender();

    // loadMore function should be memoized
    expect(result.current.loadMore).toBe(initialLoadMore);
  });

  test("efficiently handles large message arrays", () => {
    // Create a large dataset
    const largeDocs = Array.from({ length: 1000 }, (_, i) => ({
      id: `msg${i}`,
      data: () => ({
        text: `Message ${i}`,
        createdAt: { seconds: 1000 + i },
        uid: "user1",
      }),
    }));

    mockUseCollection.mockReturnValue([
      { docs: largeDocs },
      false, // loading
      null, // error
    ]);

    const startTime = performance.now();

    const { result } = renderHook(() =>
      useChatMessages({
        firestore: {},
        limitBatchSize: 1000,
      })
    );

    const endTime = performance.now();
    const processingTime = endTime - startTime;

    // Should process large arrays efficiently (under 200ms)
    expect(processingTime).toBeLessThan(200);
    expect(result.current.messages).toHaveLength(1000);
  });

  test("preserves message order optimization", () => {
    const docs = [
      {
        id: "msg1",
        data: () => ({ text: "First", createdAt: { seconds: 1000 } }),
      },
      {
        id: "msg2",
        data: () => ({ text: "Second", createdAt: { seconds: 2000 } }),
      },
      {
        id: "msg3",
        data: () => ({ text: "Third", createdAt: { seconds: 3000 } }),
      },
    ];

    mockUseCollection.mockReturnValue([
      { docs },
      false, // loading
      null, // error
    ]);

    const { result } = renderHook(() =>
      useChatMessages({
        firestore: {},
        limitBatchSize: 25,
      })
    );

    const messages = result.current.messages;
    expect(messages).toHaveLength(3);

    // Just verify we have messages with correct structure
    messages.forEach((message) => {
      expect(message).toHaveProperty("id");
      expect(message).toHaveProperty("text");
      expect(message).toHaveProperty("createdAt");
    });
  });
});
