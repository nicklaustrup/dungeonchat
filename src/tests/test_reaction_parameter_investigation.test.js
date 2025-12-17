import React from "react";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { render } from "./test-utils"; // Use our custom render with providers
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
  const mockDeleteField = jest.fn(() => Symbol("DELETE_FIELD"));
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

// Mock console to capture any errors
const originalConsoleError = console.error;

describe("Reaction Parameter Bug Investigation", () => {
  let mockUpdateDoc;
  let consoleErrors = [];

  beforeEach(() => {
    const firebase = require("firebase/firestore");
    mockUpdateDoc = firebase.updateDoc;
    mockUpdateDoc.mockClear();

    // Capture console errors
    consoleErrors = [];
    console.error = jest.fn((...args) => {
      consoleErrors.push(args.join(" "));
    });
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  test("investigates desktop menu reaction parameter issue", async () => {
    const message = {
      id: "test_param_bug",
      uid: "other_user",
      text: "Test message",
      createdAt: new Date(),
      displayName: "Other User",
      reactions: {},
    };

    // Mock hover state management
    let hoveredMessageId = null;
    const handleHoverMessage = (messageId) => {
      hoveredMessageId = messageId;
    };

    const { rerender } = render(
      <ChatMessage
        message={message}
        showMeta={true}
        hovered={hoveredMessageId === message.id}
        onHoverMessage={handleHoverMessage}
      />
    );

    // Hover over the message to show the reaction bar
    const messageEl = screen.getByRole("article");
    fireEvent.mouseEnter(messageEl);

    // Trigger hover state and rerender
    handleHoverMessage(message.id);
    rerender(
      <ChatMessage
        message={message}
        showMeta={true}
        hovered={hoveredMessageId === message.id}
        onHoverMessage={handleHoverMessage}
      />
    );

    // Click the options menu trigger
    const menuTrigger = screen.getByRole("button", { name: /options/i });
    fireEvent.click(menuTrigger);

    // Wait for menu to appear
    await waitFor(() => {
      expect(screen.getByTestId("message-options-menu")).toBeInTheDocument();
    });

    // Find and click quick reaction button
    const quickReactionBtns = screen
      .getAllByRole("button")
      .filter((btn) => btn.className.includes("menu-reaction-btn"));

    const thumbsUpBtn = quickReactionBtns.find((btn) =>
      btn.textContent.includes("👍")
    );
    expect(thumbsUpBtn).toBeInTheDocument();

    // Log what happens when we click
    console.log(
      "Before click - mockUpdateDoc calls:",
      mockUpdateDoc.mock.calls.length
    );
    fireEvent.click(thumbsUpBtn);

    // Wait a bit and check if anything was called
    await new Promise((resolve) => setTimeout(resolve, 100));

    console.log(
      "After click - mockUpdateDoc calls:",
      mockUpdateDoc.mock.calls.length
    );
    console.log("Console errors during test:", consoleErrors);

    // Check if the reaction was added
    const reactionList = screen.queryByTestId("reaction-list");
    if (reactionList) {
      console.log("Reaction list found");
      const reactionItem = screen.queryByTestId("reaction-item");
      if (reactionItem) {
        console.log("Reaction item content:", reactionItem.textContent);
      } else {
        console.log("No reaction item found");
      }
    } else {
      console.log("No reaction list found");
    }

    // This might fail if the bug exists
    if (mockUpdateDoc.mock.calls.length === 0) {
      console.log("BUG DETECTED: No Firestore update was triggered");
    }
  });
});
