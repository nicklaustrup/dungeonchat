/**
 * End-to-end test for drag and drop image upload functionality
 * This test verifies that drag and drop images work correctly through the entire flow
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ChatStateProvider } from "../../contexts/ChatStateContext";
import ChatRoom from "../../components/ChatRoom/ChatRoom";
import ChatInput from "../../components/ChatInput/ChatInput";

// Mock Firebase context
jest.mock("../../services/FirebaseContext", () => ({
  useFirebase: () => ({
    auth: { currentUser: { uid: "test-user", displayName: "Test User" } },
    user: { uid: "test-user", displayName: "Test User" },
    firestore: {},
    rtdb: {},
    storage: {},
  }),
}));

// Mock sound utilities
jest.mock("../../utils/sound", () => ({
  playSendMessageSound: jest.fn(),
  playReceiveMessageSound: jest.fn(),
}));

// Mock message services
jest.mock("../../services/messageService", () => ({
  createTextMessage: jest.fn(),
  createImageMessage: jest.fn(),
}));

// Mock image upload service
jest.mock("../../services/imageUploadService", () => ({
  compressImage: jest.fn(async (file) => file),
  uploadImage: jest.fn(async () => "https://example.com/uploaded-image.png"),
}));

// Mock chat messages hook
jest.mock("../../hooks/useChatMessages", () => ({
  useChatMessages: () => ({
    messages: [],
    loadMore: jest.fn(),
    hasMore: false,
  }),
}));

// Mock scroll manager
jest.mock("../../hooks/useUnifiedScrollManager", () => ({
  useUnifiedScrollManager: () => ({
    isAtBottom: true,
    hasNewMessages: false,
    newMessagesCount: 0,
    scrollToBottom: jest.fn(),
    captureBeforeLoadMore: jest.fn(),
  }),
}));

// Mock infinite scroll
jest.mock("../../hooks/useInfiniteScrollTop", () => ({
  useInfiniteScrollTop: () => ({
    sentinelRef: { current: null },
    isFetching: false,
  }),
}));

// Mock typing presence
jest.mock("../../hooks/useTypingPresence", () => ({
  useTypingPresence: () => ({
    handleInputActivity: jest.fn(),
  }),
}));

// Mock emoji picker
jest.mock("../../hooks/useEmojiPicker", () => ({
  useEmojiPicker: () => ({
    open: false,
    toggle: jest.fn(),
    buttonRef: { current: null },
    setOnSelect: jest.fn(),
  }),
}));

// Mock toast
jest.mock("../../hooks/useToast", () => ({
  useToast: () => ({
    push: jest.fn(),
  }),
}));

// Mock FileReader
class MockFileReader {
  constructor() {
    this.result = null;
    this.onload = null;
  }

  readAsDataURL(file) {
    // Simulate async file reading
    setTimeout(() => {
      this.result = `data:${file.type};base64,MOCK_BASE64_DATA`;
      if (this.onload) {
        this.onload({ target: { result: this.result } });
      }
    }, 10);
  }
}

// Mock IntersectionObserver
class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Utility to simulate drag and drop
function simulateDragDrop(element, file) {
  const dataTransfer = {
    files: [file],
    items: [
      {
        kind: "file",
        type: file.type,
        getAsFile: () => file,
      },
    ],
  };

  fireEvent.dragEnter(element, { dataTransfer });
  fireEvent.dragOver(element, { dataTransfer });
  fireEvent.drop(element, { dataTransfer });
}

describe("Drag and Drop Image Upload - End to End", () => {
  let originalFileReader;
  let originalIntersectionObserver;

  beforeAll(() => {
    originalFileReader = global.FileReader;
    originalIntersectionObserver = global.IntersectionObserver;
    global.FileReader = MockFileReader;
    global.IntersectionObserver = MockIntersectionObserver;
  });

  afterAll(() => {
    global.FileReader = originalFileReader;
    global.IntersectionObserver = originalIntersectionObserver;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("complete drag and drop flow from ChatRoom to ChatInput modal", async () => {
    // Component that properly connects ChatRoom to context like ChatPage does
    const IntegratedChatComponent = () => {
      const { handleImageDrop } =
        require("../../contexts/ChatStateContext").useChatImage();

      return (
        <div>
          <ChatRoom
            getDisplayName={() => "Test User"}
            searchTerm=""
            onDragStateChange={() => {}}
            onImageDrop={handleImageDrop} // Properly connected to context
            onViewProfile={() => {}}
            onScrollMeta={() => {}}
            soundEnabled={false}
          />
          <ChatInput
            getDisplayName={() => "Test User"}
            soundEnabled={false}
            forceScrollBottom={() => {}}
          />
        </div>
      );
    };

    // Render the complete chat interface with proper context integration
    render(
      <ChatStateProvider>
        <IntegratedChatComponent />
      </ChatStateProvider>
    );

    // Find the chat room element (drop target)
    const chatRoom = screen.getByRole("log");
    expect(chatRoom).toBeInTheDocument();

    // Initially, no image modal should be visible
    expect(
      screen.queryByRole("button", { name: /send image/i })
    ).not.toBeInTheDocument();

    // Create a test image file
    const imageFile = new File(["test image data"], "test.png", {
      type: "image/png",
    });

    // Simulate drag and drop on the chat room
    simulateDragDrop(chatRoom, imageFile);

    // Wait for the image preview modal to appear
    await waitFor(
      () => {
        expect(
          screen.getByRole("button", { name: /send image/i })
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Verify cancel button is also present
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();

    // Test canceling the image
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: /send image/i })
      ).not.toBeInTheDocument();
    });
  });

  test("drag and drop shows drag overlay states", async () => {
    render(
      <ChatStateProvider>
        <ChatRoom
          getDisplayName={() => "Test User"}
          searchTerm=""
          onDragStateChange={() => {}}
          onImageDrop={() => {}}
          onViewProfile={() => {}}
          onScrollMeta={() => {}}
          soundEnabled={false}
        />
      </ChatStateProvider>
    );

    const chatRoom = screen.getByRole("log");
    const imageFile = new File(["test"], "test.png", { type: "image/png" });

    // Start drag over
    fireEvent.dragEnter(chatRoom, {
      dataTransfer: {
        files: [imageFile],
        items: [
          { kind: "file", type: "image/png", getAsFile: () => imageFile },
        ],
      },
    });

    fireEvent.dragOver(chatRoom, {
      dataTransfer: {
        files: [imageFile],
        items: [
          { kind: "file", type: "image/png", getAsFile: () => imageFile },
        ],
      },
    });

    // Verify drag overlay appears (it should show "Release to upload image")
    await waitFor(() => {
      const overlay = document.querySelector(".drag-overlay");
      expect(overlay).toBeInTheDocument();
    });
  });
});
