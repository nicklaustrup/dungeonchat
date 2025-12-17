import React from "react";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { render } from "./test-utils";
import ChatMessage from "../components/ChatRoom/ChatMessage";

// Mock Firebase
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

jest.mock("../services/PresenceContext", () => ({
  usePresence: () => ({ state: "online", lastSeen: Date.now() }),
}));
jest.mock("../components/ChatInput/EmojiMenu", () => ({
  __esModule: true,
  default: { open: jest.fn() },
}));
jest.mock("../utils/avatar", () => ({
  getFallbackAvatar: () => "data:image/png;base64,fallback",
}));

describe("FINAL: Reaction Buttons Working Test", () => {
  let mockUpdateDoc;

  beforeEach(() => {
    const firebase = require("firebase/firestore");
    mockUpdateDoc = firebase.updateDoc;
    mockUpdateDoc.mockClear();

    // Mock desktop environment
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches:
          query.includes("hover: none") && query.includes("pointer: coarse")
            ? false
            : true,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
      })),
    });
  });

  test("REAL-WORLD: Direct reaction buttons (reaction-btn) work with simple clicks", async () => {
    const message = {
      id: "test_real_world_direct",
      uid: "other_user",
      text: "Test message",
      createdAt: new Date(),
      displayName: "Other User",
      reactions: {},
    };

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

    // Hover to show reaction bar
    handleHoverMessage(message.id);
    rerender(
      <ChatMessage
        message={message}
        showMeta={true}
        hovered={hoveredMessageId === message.id}
        onHoverMessage={handleHoverMessage}
      />
    );

    console.log("=== TESTING DIRECT REACTIONS WITH SIMPLE CLICK ===");

    const directReactionBtns = screen.getAllByTestId("reaction-btn");
    const thumbsBtn = directReactionBtns.find((btn) =>
      btn.textContent.includes("👍")
    );

    // Just a simple click - no pointer events
    fireEvent.click(thumbsBtn);

    await waitFor(() => {
      expect(mockUpdateDoc).toHaveBeenCalled();
    });

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      { path: "messages/test" },
      { "reactions.👍": ["current_user"] }
    );

    console.log("✅ Direct reaction-btn works with simple click");
    console.log("Firebase call:", mockUpdateDoc.mock.calls[0]);

    await waitFor(() => {
      const reactionItem = screen.getByTestId("reaction-item");
      expect(reactionItem).toHaveTextContent("👍 1");
    });

    console.log("✅ Reaction renders correctly in UI");
  });

  test("REAL-WORLD: Menu reaction buttons (menu-reaction-btn) work with simple clicks", async () => {
    const message = {
      id: "test_real_world_menu",
      uid: "other_user",
      text: "Test message",
      createdAt: new Date(),
      displayName: "Other User",
      reactions: {},
    };

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

    // Hover and open menu
    handleHoverMessage(message.id);
    rerender(
      <ChatMessage
        message={message}
        showMeta={true}
        hovered={hoveredMessageId === message.id}
        onHoverMessage={handleHoverMessage}
      />
    );

    console.log("=== TESTING MENU REACTIONS WITH SIMPLE CLICK ===");

    const menuTrigger = screen.getByRole("button", { name: /options/i });
    fireEvent.click(menuTrigger);

    await waitFor(() => {
      expect(screen.getByTestId("message-options-menu")).toBeInTheDocument();
    });

    const menuReactionBtns = screen
      .getAllByRole("button")
      .filter((btn) => btn.className.includes("menu-reaction-btn"));
    const menuHeartBtn = menuReactionBtns.find((btn) =>
      btn.textContent.includes("❤️")
    );

    // Simple click
    fireEvent.click(menuHeartBtn);

    await waitFor(() => {
      expect(mockUpdateDoc).toHaveBeenCalled();
    });

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      { path: "messages/test" },
      { "reactions.❤️": ["current_user"] }
    );

    console.log("✅ Menu reaction-btn works with simple click");
    console.log("Firebase call:", mockUpdateDoc.mock.calls[0]);

    await waitFor(() => {
      const reactionItem = screen.getByTestId("reaction-item");
      expect(reactionItem).toHaveTextContent("❤️ 1");
    });

    console.log("✅ Menu reaction renders correctly in UI");
  });

  test("COMPARISON: Both reaction methods work and produce same results", async () => {
    const message = {
      id: "test_comparison_final",
      uid: "other_user",
      text: "Test message",
      createdAt: new Date(),
      displayName: "Other User",
      reactions: {},
    };

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

    handleHoverMessage(message.id);
    rerender(
      <ChatMessage
        message={message}
        showMeta={true}
        hovered={hoveredMessageId === message.id}
        onHoverMessage={handleHoverMessage}
      />
    );

    console.log("=== FINAL COMPARISON TEST ===");

    // Test direct reaction
    console.log("Testing direct reaction-buttons...");
    const directReactionBtns = screen.getAllByTestId("reaction-btn");
    const directThumbsBtn = directReactionBtns.find((btn) =>
      btn.textContent.includes("👍")
    );

    fireEvent.click(directThumbsBtn);

    await waitFor(() => {
      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    });

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      { path: "messages/test" },
      { "reactions.👍": ["current_user"] }
    );

    console.log("✅ Direct reaction successful");

    mockUpdateDoc.mockClear();

    // Test menu reaction
    console.log("Testing message-menu reactions...");
    const menuTrigger = screen.getByRole("button", { name: /options/i });
    fireEvent.click(menuTrigger);

    await screen.findByTestId("message-options-menu");

    const menuReactionBtns = screen
      .getAllByRole("button")
      .filter((btn) => btn.className.includes("menu-reaction-btn"));
    const menuHeartBtn = menuReactionBtns.find((btn) =>
      btn.textContent.includes("❤️")
    );

    fireEvent.click(menuHeartBtn);

    await waitFor(() => {
      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    });

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      { path: "messages/test" },
      { "reactions.❤️": ["current_user"] }
    );

    console.log("✅ Menu reaction successful");

    // Verify both reactions show in UI
    await waitFor(() => {
      const reactionItems = screen.getAllByTestId("reaction-item");
      expect(reactionItems).toHaveLength(2);
    });

    const reactionItems = screen.getAllByTestId("reaction-item");
    expect(
      reactionItems.find((item) => item.textContent.includes("👍 1"))
    ).toBeInTheDocument();
    expect(
      reactionItems.find((item) => item.textContent.includes("❤️ 1"))
    ).toBeInTheDocument();

    console.log(
      "🎉 BOTH METHODS WORK! reaction-buttons and message-menu are functioning correctly!"
    );
  });

  test("EDGE CASES: Various interaction scenarios", async () => {
    const message = {
      id: "test_edge_cases",
      uid: "other_user",
      text: "Test message",
      createdAt: new Date(),
      displayName: "Other User",
      reactions: { "👍": ["another_user"] }, // Start with existing reaction
    };

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

    console.log("=== EDGE CASE TESTING ===");

    // Should show existing reaction
    expect(screen.getByText("👍 1")).toBeInTheDocument();

    handleHoverMessage(message.id);
    rerender(
      <ChatMessage
        message={message}
        showMeta={true}
        hovered={hoveredMessageId === message.id}
        onHoverMessage={handleHoverMessage}
      />
    );

    console.log("Edge case 1: Adding to existing reaction...");
    const directReactionBtns = screen.getAllByTestId("reaction-btn");
    const thumbsBtn = directReactionBtns.find((btn) =>
      btn.textContent.includes("👍")
    );

    fireEvent.click(thumbsBtn);

    await waitFor(() => {
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        { path: "messages/test" },
        { "reactions.👍": ["another_user", "current_user"] }
      );
    });

    console.log("✅ Edge case 1: Adding to existing reaction works");

    mockUpdateDoc.mockClear();

    console.log("Edge case 2: Adding different reaction via menu...");
    const menuTrigger = screen.getByRole("button", { name: /options/i });
    fireEvent.click(menuTrigger);

    await screen.findByTestId("message-options-menu");

    const menuReactionBtns = screen
      .getAllByRole("button")
      .filter((btn) => btn.className.includes("menu-reaction-btn"));
    const menuLaughBtn = menuReactionBtns.find((btn) =>
      btn.textContent.includes("😂")
    );

    fireEvent.click(menuLaughBtn);

    await waitFor(() => {
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        { path: "messages/test" },
        { "reactions.😂": ["current_user"] }
      );
    });

    console.log("✅ Edge case 2: Adding different reaction via menu works");
    console.log("🎉 ALL EDGE CASES PASS!");
  });
});
