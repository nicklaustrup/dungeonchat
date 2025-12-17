import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import { render } from "./test-utils";
import ChatMessage from "../components/ChatRoom/ChatMessage";

jest.mock("../components/ChatInput/EmojiMenu", () => ({
  __esModule: true,
  default: { open: jest.fn() },
}));
jest.mock("../services/PresenceContext", () => ({
  usePresence: () => ({ state: "online", lastSeen: Date.now() }),
}));
jest.mock("../services/FirebaseContext", () => ({
  useFirebase: () => ({
    auth: { currentUser: { uid: "current", email: "c@example.com" } },
    firestore: {},
    rtdb: null,
  }),
}));
jest.mock("../utils/avatar", () => ({
  getFallbackAvatar: () => "data:image/png;base64,fallback2",
}));

describe("ChatMessage InlineReplyContext integration", () => {
  test("renders inline reply context when replyTo provided", () => {
    const message = {
      id: "m55",
      uid: "other",
      text: "Child message",
      createdAt: new Date(),
      displayName: "Child User",
      replyTo: {
        id: "orig1",
        uid: "orig",
        displayName: "Orig User",
        text: "Original text",
      },
    };
    render(<ChatMessage message={message} showMeta={true} />);
    expect(screen.getByTestId("inline-reply-context")).toBeInTheDocument();
    expect(screen.getByText("Original text")).toBeInTheDocument();
  });

  test("clicking snippet triggers scroll logic (no error)", () => {
    const message = {
      id: "m56",
      uid: "other",
      text: "Another child",
      createdAt: new Date(),
      displayName: "Child User",
      replyTo: {
        id: "orig2",
        uid: "orig",
        displayName: "Orig User",
        text: "Original B",
      },
    };
    render(<ChatMessage message={message} showMeta={true} />);
    const snippet = screen.getByTestId("irc-snippet");
    // No actual element with data-message-id orig2 exists, but click should not throw.
    fireEvent.click(snippet);
    expect(snippet).toBeInTheDocument();
  });
});
