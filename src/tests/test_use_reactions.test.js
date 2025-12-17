jest.mock("firebase/firestore", () => {
  const updateDoc = jest.fn(async () => {});
  const doc = jest.fn(() => ({ path: "messages/m1" }));
  return { doc, updateDoc };
});

import { renderHook, act } from "@testing-library/react";
import { useReactions } from "../hooks/useReactions";
import { updateDoc } from "firebase/firestore";

// Set a reasonable timeout for all tests in this file
jest.setTimeout(5000); // 5 second timeout

describe("useReactions", () => {
  const auth = { currentUser: { uid: "me" } };
  const firestore = {};
  beforeEach(() => {
    updateDoc.mockClear();
  });

  test("toggle add/remove updates firestore with correct payload", async () => {
    // Mock the updateDoc implementation with immediate success
    updateDoc.mockImplementation(async () => Promise.resolve());

    // Ensure we control all promises with clear resolve/completion
    const { result, unmount, rerender } = renderHook(() =>
      useReactions({ firestore, auth, messageId: "m1", initialReactions: {} })
    );

    // First reaction toggle - add
    let updatedState;
    await act(async () => {
      updatedState = await result.current.toggleReaction("👍");
    });

    // Force a rerender to ensure state is updated
    rerender();

    // Verify local state updated correctly using the state returned from toggleReaction
    expect(updatedState).toEqual({ "👍": ["me"] });

    // Verify Firestore was called with correct data
    expect(updateDoc).toHaveBeenCalledTimes(1);
    const firstCall = updateDoc.mock.calls[0];
    expect(firstCall[1]).toEqual({ "reactions.👍": ["me"] });

    // Second reaction toggle - remove
    await act(async () => {
      await result.current.toggleReaction("👍");
    });

    // Force a rerender
    rerender();

    // After toggle off, verify the component state no longer has the reaction
    expect(result.current.reactions["👍"]).toBeUndefined();

    // Verify Firestore was called a second time
    expect(updateDoc).toHaveBeenCalledTimes(2);

    // Clean up hook after test
    unmount();
  }, 10000); // Additional timeout at the test level for extra safety
});
