import React from "react";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { render } from "./test-utils";
import ChatMessage from "../components/ChatRoom/ChatMessage";

// Mock Firebase and other dependencies
jest.mock("../components/ChatInput/EmojiMenu", () => ({
  __esModule: true,
  default: { open: jest.fn() },
}));
jest.mock("../services/PresenceContext", () => ({
  usePresence: () => ({ state: "online", lastSeen: Date.now() }),
}));

jest.mock("firebase/firestore", () => {
  const mockUpdateDoc = jest.fn(async () => {});
  const mockDeleteField = jest.fn(() => "DELETE_FIELD_TOKEN");
  return {
    doc: () => ({ path: "messages/test" }),
    updateDoc: mockUpdateDoc,
    deleteField: mockDeleteField,
  };
});

jest.mock("../services/FirebaseContext", () => ({
  useFirebase: () => ({
    auth: { currentUser: { uid: "current_user", email: "test@example.com" } },
    firestore: {},
    rtdb: null,
  }),
}));

jest.mock("../utils/avatar", () => ({
  getFallbackAvatar: () => "data:image/png;base64,fallback",
}));

describe("Reaction Bug Comprehensive Tests", () => {
  let mockUpdateDoc, mockDeleteField;

  beforeEach(() => {
    const firebase = require("firebase/firestore");
    mockUpdateDoc = firebase.updateDoc;
    mockDeleteField = firebase.deleteField;
    mockUpdateDoc.mockClear();
    mockDeleteField.mockClear();
  });

  test("adding first reaction shows correct count", async () => {
    const message = {
      id: "test1",
      uid: "other_user",
      text: "Test",
      createdAt: new Date(),
      displayName: "Other User",
      reactions: {},
    };

    render(<ChatMessage message={message} showMeta={true} />);

    const thumbsUpBtn = screen
      .getAllByTestId("reaction-btn")
      .find((btn) => btn.textContent === "👍");
    fireEvent.click(thumbsUpBtn);

    await waitFor(() => {
      const reactionItem = screen.getByTestId("reaction-item");
      expect(reactionItem).toHaveTextContent("👍 1");
    });

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      { path: "messages/test" },
      { "reactions.👍": ["current_user"] }
    );
  });

  test("removing last reaction hides the reaction completely", async () => {
    // Start with a reaction from current user
    const message = {
      id: "test2",
      uid: "other_user",
      text: "Test",
      createdAt: new Date(),
      displayName: "Other User",
      reactions: { "👍": ["current_user"] },
    };

    render(<ChatMessage message={message} showMeta={true} />);

    // Verify reaction is initially shown
    expect(screen.getByTestId("reaction-item")).toHaveTextContent("👍 1");

    // Click to remove reaction
    fireEvent.click(screen.getByTestId("reaction-item"));

    // Wait for the reaction to be removed
    await waitFor(() => {
      expect(screen.queryByTestId("reaction-list")).not.toBeInTheDocument();
    });
  });

  test("mixed reactions with some empty arrays are filtered correctly", () => {
    const message = {
      id: "test3",
      uid: "other_user",
      text: "Test",
      createdAt: new Date(),
      displayName: "Other User",
      reactions: {
        "👍": ["user1", "user2"], // Valid reaction
        "❤️": [], // Empty array - should be filtered out
        "😂": ["user3"], // Valid reaction
      },
    };

    render(<ChatMessage message={message} showMeta={true} />);

    const reactionItems = screen.getAllByTestId("reaction-item");
    expect(reactionItems).toHaveLength(2); // Only two valid reactions

    const texts = reactionItems.map((item) => item.textContent);
    expect(texts).toContain("👍 2");
    expect(texts).toContain("😂 1");
    expect(texts).not.toContain("❤️ 0");
  });

  test("reaction count updates correctly when toggling existing reaction", async () => {
    const message = {
      id: "test4",
      uid: "other_user",
      text: "Test",
      createdAt: new Date(),
      displayName: "Other User",
      reactions: { "👍": ["user1"] },
    };

    render(<ChatMessage message={message} showMeta={true} />);

    // Initially shows 1
    expect(screen.getByTestId("reaction-item")).toHaveTextContent("👍 1");

    // Add current user's reaction
    fireEvent.click(screen.getByTestId("reaction-item"));

    await waitFor(() => {
      expect(screen.getByTestId("reaction-item")).toHaveTextContent("👍 2");
    });
  });

  test("accessibility attributes are correct for reactions", () => {
    const message = {
      id: "test5",
      uid: "other_user",
      text: "Test",
      createdAt: new Date(),
      displayName: "Other User",
      reactions: {
        "👍": ["user1", "current_user"], // Current user has reacted
        "❤️": ["user2"], // Current user hasn't reacted
      },
    };

    render(<ChatMessage message={message} showMeta={true} />);

    const reactionItems = screen.getAllByTestId("reaction-item");
    const thumbsUp = reactionItems.find((item) =>
      item.textContent.includes("👍")
    );
    const heart = reactionItems.find((item) => item.textContent.includes("❤️"));

    // Check aria-pressed for user's own reaction
    expect(thumbsUp).toHaveAttribute("aria-pressed", "true");
    expect(heart).toHaveAttribute("aria-pressed", "false");

    // Check aria-label describes count correctly
    expect(thumbsUp).toHaveAttribute(
      "aria-label",
      expect.stringContaining("2 users")
    );
    expect(heart).toHaveAttribute(
      "aria-label",
      expect.stringContaining("1 user")
    );
  });
});
