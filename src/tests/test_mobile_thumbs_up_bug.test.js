import React from "react";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { render } from "./test-utils";
import ChatMessage from "../components/ChatRoom/ChatMessage";

// Mock necessary modules
jest.mock("../services/PresenceContext", () => ({
  usePresence: () => ({ state: "online", lastSeen: Date.now() }),
}));

jest.mock("../services/FirebaseContext", () => ({
  useFirebase: () => ({
    auth: { currentUser: { uid: "current_user", email: "test@example.com" } },
    firestore: {},
    rtdb: null,
  }),
}));

jest.mock("../hooks/useReactions", () => ({
  useReactions: jest.fn(),
}));

// Mock window.matchMedia for mobile
const mockMatchMedia = (isMobile = true) => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: query.includes("pointer: coarse") ? isMobile : !isMobile,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

describe("Mobile Thumbs Up Emoji Bug", () => {
  let mockToggleReaction;
  const { useReactions } = require("../hooks/useReactions");

  beforeEach(() => {
    mockMatchMedia(true); // Mobile environment
    mockToggleReaction = jest.fn();
    useReactions.mockReturnValue({
      reactions: {},
      toggleReaction: mockToggleReaction,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("thumbs up emoji should work on mobile after multiple select/deselect cycles", async () => {
    const message = {
      id: "thumbs_test",
      uid: "other_user",
      text: "Test message for thumbs up",
      createdAt: new Date(),
      displayName: "Other User",
      reactions: {},
    };

    let selected = false;
    let hoveredMessageId = null;

    const { rerender } = render(
      <ChatMessage
        message={message}
        showMeta={true}
        selected={selected}
        hovered={hoveredMessageId === message.id}
        onHoverMessage={(id) => {
          hoveredMessageId = id;
        }}
        onSelectMessage={() => {
          selected = true;
        }}
      />
    );

    console.log(
      "Testing mobile thumbs up emoji after multiple select/deselect cycles..."
    );

    // Cycle 1: Select message, tap thumbs up, deselect
    console.log("Cycle 1: Selecting message...");
    selected = true;
    hoveredMessageId = message.id;

    rerender(
      <ChatMessage
        message={message}
        showMeta={true}
        selected={selected}
        hovered={hoveredMessageId === message.id}
        onHoverMessage={(id) => {
          hoveredMessageId = id;
        }}
        onSelectMessage={() => {
          selected = true;
        }}
      />
    );

    // Find and click thumbs up in reaction bar
    const reactionBar = screen.getByTestId("reaction-bar");
    expect(reactionBar).toBeInTheDocument();

    const reactionBtns = screen.getAllByTestId("reaction-btn");
    const thumbsUpBtn = reactionBtns.find((btn) =>
      btn.textContent.includes("👍")
    );
    expect(thumbsUpBtn).toBeInTheDocument();

    // Simulate mobile touch interaction
    fireEvent.pointerDown(thumbsUpBtn, { pointerType: "touch" });
    await new Promise((resolve) => setTimeout(resolve, 50));
    fireEvent.pointerUp(thumbsUpBtn, { pointerType: "touch" });

    await waitFor(
      () => {
        expect(mockToggleReaction).toHaveBeenCalledWith("👍");
      },
      { timeout: 1000 }
    );

    console.log("Cycle 1: Thumbs up clicked, deselecting...");
    mockToggleReaction.mockClear();

    // Deselect message
    selected = false;
    hoveredMessageId = null;

    rerender(
      <ChatMessage
        message={message}
        showMeta={true}
        selected={selected}
        hovered={hoveredMessageId === message.id}
        onHoverMessage={(id) => {
          hoveredMessageId = id;
        }}
        onSelectMessage={() => {
          selected = true;
        }}
      />
    );

    // Wait for debounce state to clear
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Cycle 2: Select message again, try thumbs up again
    console.log("Cycle 2: Selecting message again...");
    selected = true;
    hoveredMessageId = message.id;

    rerender(
      <ChatMessage
        message={message}
        showMeta={true}
        selected={selected}
        hovered={hoveredMessageId === message.id}
        onHoverMessage={(id) => {
          hoveredMessageId = id;
        }}
        onSelectMessage={() => {
          selected = true;
        }}
      />
    );

    // Try thumbs up again
    const reactionBtns2 = screen.getAllByTestId("reaction-btn");
    const thumbsUpBtn2 = reactionBtns2.find((btn) =>
      btn.textContent.includes("👍")
    );
    expect(thumbsUpBtn2).toBeInTheDocument();

    fireEvent.pointerDown(thumbsUpBtn2, { pointerType: "touch" });
    await new Promise((resolve) => setTimeout(resolve, 50));
    fireEvent.pointerUp(thumbsUpBtn2, { pointerType: "touch" });

    await waitFor(
      () => {
        expect(mockToggleReaction).toHaveBeenCalledWith("👍");
      },
      { timeout: 1000 }
    );

    console.log("Cycle 2: Success! Thumbs up worked after reselection");
    mockToggleReaction.mockClear();

    // Cycle 3: Repeat to test multiple cycles
    console.log("Cycle 3: Testing third cycle...");
    selected = false;
    hoveredMessageId = null;

    rerender(
      <ChatMessage
        message={message}
        showMeta={true}
        selected={selected}
        hovered={hoveredMessageId === message.id}
        onHoverMessage={(id) => {
          hoveredMessageId = id;
        }}
        onSelectMessage={() => {
          selected = true;
        }}
      />
    );

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Select and try thumbs up third time
    selected = true;
    hoveredMessageId = message.id;

    rerender(
      <ChatMessage
        message={message}
        showMeta={true}
        selected={selected}
        hovered={hoveredMessageId === message.id}
        onHoverMessage={(id) => {
          hoveredMessageId = id;
        }}
        onSelectMessage={() => {
          selected = true;
        }}
      />
    );

    const reactionBtns3 = screen.getAllByTestId("reaction-btn");
    const thumbsUpBtn3 = reactionBtns3.find((btn) =>
      btn.textContent.includes("👍")
    );

    fireEvent.pointerDown(thumbsUpBtn3, { pointerType: "touch" });
    await new Promise((resolve) => setTimeout(resolve, 50));
    fireEvent.pointerUp(thumbsUpBtn3, { pointerType: "touch" });

    await waitFor(
      () => {
        expect(mockToggleReaction).toHaveBeenCalledWith("👍");
      },
      { timeout: 1000 }
    );

    console.log("Cycle 3: Success! Thumbs up worked in third cycle");

    // If we get here, the bug is NOT present in our test environment
    console.log(
      "✅ Thumbs up emoji worked reliably across multiple select/deselect cycles"
    );
  });

  test("compare thumbs up vs other emojis on mobile", async () => {
    const message = {
      id: "emoji_comparison",
      uid: "other_user",
      text: "Test message for emoji comparison",
      createdAt: new Date(),
      displayName: "Other User",
      reactions: {},
    };

    let selected = true;
    let hoveredMessageId = message.id;

    render(
      <ChatMessage
        message={message}
        showMeta={true}
        selected={selected}
        hovered={hoveredMessageId === message.id}
        onHoverMessage={(id) => {
          hoveredMessageId = id;
        }}
        onSelectMessage={() => {
          selected = true;
        }}
      />
    );

    const reactionBtns = screen.getAllByTestId("reaction-btn");

    // Test thumbs up emoji
    console.log("Testing 👍 emoji...");
    const thumbsBtn = reactionBtns.find((btn) =>
      btn.textContent.includes("👍")
    );
    expect(thumbsBtn).toBeInTheDocument();
    fireEvent.pointerDown(thumbsBtn, { pointerType: "touch" });
    await new Promise((resolve) => setTimeout(resolve, 50));
    fireEvent.pointerUp(thumbsBtn, { pointerType: "touch" });
    await waitFor(
      () => {
        expect(mockToggleReaction).toHaveBeenCalledWith("👍");
      },
      { timeout: 1000 }
    );
    console.log("✅ 👍 emoji worked");
    mockToggleReaction.mockClear();

    // Test heart emoji
    console.log("Testing ❤️ emoji...");
    const heartBtn = reactionBtns.find((btn) => btn.textContent.includes("❤️"));
    expect(heartBtn).toBeInTheDocument();
    fireEvent.pointerDown(heartBtn, { pointerType: "touch" });
    await new Promise((resolve) => setTimeout(resolve, 50));
    fireEvent.pointerUp(heartBtn, { pointerType: "touch" });
    await waitFor(
      () => {
        expect(mockToggleReaction).toHaveBeenCalledWith("❤️");
      },
      { timeout: 1000 }
    );
    console.log("✅ ❤️ emoji worked");
    mockToggleReaction.mockClear();

    // Test laugh emoji
    console.log("Testing 😂 emoji...");
    const laughBtn = reactionBtns.find((btn) => btn.textContent.includes("😂"));
    expect(laughBtn).toBeInTheDocument();
    fireEvent.pointerDown(laughBtn, { pointerType: "touch" });
    await new Promise((resolve) => setTimeout(resolve, 50));
    fireEvent.pointerUp(laughBtn, { pointerType: "touch" });
    await waitFor(
      () => {
        expect(mockToggleReaction).toHaveBeenCalledWith("😂");
      },
      { timeout: 1000 }
    );
    console.log("✅ 😂 emoji worked");

    console.log("All emojis (including thumbs up) worked correctly");
  });

  test("specific rapid tap scenario for thumbs up", async () => {
    const message = {
      id: "rapid_tap_test",
      uid: "other_user",
      text: "Test rapid tapping",
      createdAt: new Date(),
      displayName: "Other User",
      reactions: {},
    };

    let selected = true;
    let hoveredMessageId = message.id;

    render(
      <ChatMessage
        message={message}
        showMeta={true}
        selected={selected}
        hovered={hoveredMessageId === message.id}
        onHoverMessage={(id) => {
          hoveredMessageId = id;
        }}
        onSelectMessage={() => {
          selected = true;
        }}
      />
    );

    console.log("Testing rapid tapping scenario for thumbs up...");

    const reactionBtns = screen.getAllByTestId("reaction-btn");
    const thumbsUpBtn = reactionBtns.find((btn) =>
      btn.textContent.includes("👍")
    );

    // Rapid tap scenario - tap multiple times quickly
    console.log("Rapid tapping thumbs up 3 times quickly...");

    fireEvent.pointerDown(thumbsUpBtn, { pointerType: "touch" });
    fireEvent.pointerUp(thumbsUpBtn, { pointerType: "touch" });

    // Immediate second tap
    fireEvent.pointerDown(thumbsUpBtn, { pointerType: "touch" });
    fireEvent.pointerUp(thumbsUpBtn, { pointerType: "touch" });

    // Immediate third tap
    fireEvent.pointerDown(thumbsUpBtn, { pointerType: "touch" });
    fireEvent.pointerUp(thumbsUpBtn, { pointerType: "touch" });

    // Wait for debounce
    await new Promise((resolve) => setTimeout(resolve, 400));

    // Only first tap should go through due to debounce
    expect(mockToggleReaction).toHaveBeenCalledTimes(1);
    expect(mockToggleReaction).toHaveBeenCalledWith("👍");

    console.log("✅ Debounce working correctly for rapid taps");
  });
});
