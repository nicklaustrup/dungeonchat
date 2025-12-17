import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { ChatStateProvider } from "../../contexts/ChatStateContext";
import ChatInput from "../../components/ChatInput/ChatInput";

// Mock Firebase
jest.mock("../../services/FirebaseContext", () => ({
  useFirebase: () => ({
    auth: { currentUser: { uid: "test-user", displayName: "Test User" } },
    firestore: {},
    rtdb: {},
    storage: {},
  }),
}));

// Mock sound utilities
jest.mock("../../utils/sound", () => ({
  playSendMessageSound: jest.fn(),
}));

// Mock services
jest.mock("../../services/messageService", () => ({
  createTextMessage: jest.fn(),
  createImageMessage: jest.fn(),
}));

jest.mock("../../services/imageUploadService", () => ({
  compressImage: jest.fn(async (file) => file),
  uploadImage: jest.fn(async () => "https://example.com/image.png"),
}));

// Mock other hooks
jest.mock("../../hooks/useChatMessages", () => ({
  useChatMessages: () => ({
    messages: [],
    loadMore: jest.fn(),
    hasMore: false,
  }),
}));

jest.mock("../../hooks/useTypingPresence", () => ({
  useTypingPresence: () => ({ handleInputActivity: jest.fn() }),
}));

jest.mock("../../hooks/useEmojiPicker", () => ({
  useEmojiPicker: () => ({
    open: false,
    toggle: jest.fn(),
    buttonRef: { current: null },
    setOnSelect: jest.fn(),
  }),
}));

// Mock the useToast hook
jest.mock("../../hooks/useToast", () => ({
  useToast: () => ({
    push: jest.fn(),
  }),
}));

describe("ChatInput drag and drop integration", () => {
  test("image preview modal shows when context has image from drag and drop", async () => {
    render(
      <ChatStateProvider>
        <ChatInput
          getDisplayName={() => "Test User"}
          soundEnabled={false}
          forceScrollBottom={jest.fn()}
        />
      </ChatStateProvider>
    );

    // Initially, no modal should be visible
    expect(
      screen.queryByRole("button", { name: /send image/i })
    ).not.toBeInTheDocument();

    // Simulate the context receiving an image from drag and drop
    const TestComponent = () => {
      const { handleImageDrop } =
        require("../../contexts/ChatStateContext").useChatImage();

      React.useEffect(() => {
        // Simulate drag and drop of an image
        const file = new File(["test"], "test.png", { type: "image/png" });
        handleImageDrop(file);
      }, [handleImageDrop]);

      return (
        <ChatInput
          getDisplayName={() => "Test User"}
          soundEnabled={false}
          forceScrollBottom={jest.fn()}
        />
      );
    };

    render(
      <ChatStateProvider>
        <TestComponent />
      </ChatStateProvider>
    );

    // Wait for the image preview modal to appear
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /send image/i })
      ).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });
});
