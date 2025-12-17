/**
 * Integration test for drag and drop bulk image upload functionality
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ChatStateProvider } from "../../contexts/ChatStateContext";
import ChatRoom from "../../components/ChatRoom/ChatRoom";
import ChatInput from "../../components/ChatInput/ChatInput";

// Mock Firebase
jest.mock("../../services/FirebaseContext", () => ({
  useFirebase: () => ({
    auth: { currentUser: { uid: "test-user", displayName: "Test User" } },
    user: { uid: "test-user", displayName: "Test User" },
    firestore: {},
    rtdb: {},
    storage: {},
  }),
}));

// Mock services
jest.mock("../../services/messageService", () => ({
  createTextMessage: jest.fn(),
  createImageMessage: jest.fn(),
}));

jest.mock("../../services/imageUploadService", () => ({
  compressImage: jest.fn(async (file) => file),
  uploadImage: jest.fn(async () => "https://example.com/uploaded-image.png"),
}));

// Mock other hooks
jest.mock("../../hooks/useChatMessages", () => ({
  useChatMessages: () => ({
    messages: [],
    loadMore: jest.fn(),
    hasMore: false,
  }),
}));

jest.mock("../../hooks/useUnifiedScrollManager", () => ({
  useUnifiedScrollManager: () => ({
    isAtBottom: true,
    hasNewMessages: false,
    newMessagesCount: 0,
    scrollToBottom: jest.fn(),
    captureBeforeLoadMore: jest.fn(),
  }),
}));

jest.mock("../../hooks/useInfiniteScrollTop", () => ({
  useInfiniteScrollTop: () => ({
    sentinelRef: { current: null },
    isFetching: false,
  }),
}));

jest.mock("../../hooks/useTypingPresence", () => ({
  useTypingPresence: () => ({
    handleInputActivity: jest.fn(),
  }),
}));

jest.mock("../../hooks/useEmojiPicker", () => ({
  useEmojiPicker: () => ({
    open: false,
    toggle: jest.fn(),
    buttonRef: { current: null },
    setOnSelect: jest.fn(),
  }),
}));

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
    setTimeout(() => {
      this.result = `data:${file.type};base64,MOCK_${file.name}_DATA`;
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

// Utility to simulate drag and drop with multiple files
function simulateMultiFileDragDrop(element, files) {
  const dataTransfer = {
    files: files,
    items: files.map((file) => ({
      kind: "file",
      type: file.type,
      getAsFile: () => file,
    })),
  };

  fireEvent.dragEnter(element, { dataTransfer });
  fireEvent.dragOver(element, { dataTransfer });
  fireEvent.drop(element, { dataTransfer });
}

describe("Drag and Drop Bulk Image Upload", () => {
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

  test("dragging and dropping multiple images opens bulk upload modal", async () => {
    const IntegratedChatComponent = () => {
      const { handleMultipleImageDrop } =
        require("../../contexts/ChatStateContext").useChatImage();

      return (
        <div>
          <ChatRoom
            getDisplayName={() => "Test User"}
            searchTerm=""
            onDragStateChange={() => {}}
            onImageDrop={handleMultipleImageDrop}
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

    render(
      <ChatStateProvider>
        <IntegratedChatComponent />
      </ChatStateProvider>
    );

    const chatRoom = screen.getByRole("log");

    // Create multiple test image files
    const files = [
      new File(["test1"], "test1.png", { type: "image/png" }),
      new File(["test2"], "test2.jpg", { type: "image/jpeg" }),
      new File(["test3"], "test3.gif", { type: "image/gif" }),
    ];

    // Simulate drag and drop of multiple files
    simulateMultiFileDragDrop(chatRoom, files);

    // Wait for the bulk image modal to appear
    await waitFor(
      () => {
        expect(screen.getByText("3 Images Selected")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    expect(
      screen.getByRole("button", { name: /send 3 images/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();

    // Verify all images are displayed with remove buttons
    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(3);

    const removeButtons = screen.getAllByRole("button", {
      name: /remove image/i,
    });
    expect(removeButtons).toHaveLength(3);
  });

  test("dragging and dropping single image uses regular modal", async () => {
    const IntegratedChatComponent = () => {
      const { handleMultipleImageDrop } =
        require("../../contexts/ChatStateContext").useChatImage();

      return (
        <div>
          <ChatRoom
            getDisplayName={() => "Test User"}
            searchTerm=""
            onDragStateChange={() => {}}
            onImageDrop={handleMultipleImageDrop}
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

    render(
      <ChatStateProvider>
        <IntegratedChatComponent />
      </ChatStateProvider>
    );

    const chatRoom = screen.getByRole("log");

    // Create single test image file
    const file = new File(["test"], "test.png", { type: "image/png" });

    // Simulate drag and drop of single file
    simulateMultiFileDragDrop(chatRoom, [file]);

    // Wait for the regular image modal to appear
    await waitFor(
      () => {
        expect(
          screen.getByRole("button", { name: /send image/i })
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Should not show bulk modal header
    expect(screen.queryByText("1 Image Selected")).not.toBeInTheDocument();
  });

  test("drag overlay shows correct state for multiple images", async () => {
    const IntegratedChatComponent = () => {
      const { handleMultipleImageDrop } =
        require("../../contexts/ChatStateContext").useChatImage();

      return (
        <ChatRoom
          getDisplayName={() => "Test User"}
          searchTerm=""
          onDragStateChange={() => {}}
          onImageDrop={handleMultipleImageDrop}
          onViewProfile={() => {}}
          onScrollMeta={() => {}}
          soundEnabled={false}
        />
      );
    };

    render(
      <ChatStateProvider>
        <IntegratedChatComponent />
      </ChatStateProvider>
    );

    const chatRoom = screen.getByRole("log");

    const files = [
      new File(["test1"], "test1.png", { type: "image/png" }),
      new File(["test2"], "test2.jpg", { type: "image/jpeg" }),
    ];

    // Start drag over
    fireEvent.dragEnter(chatRoom, {
      dataTransfer: {
        files: files,
        items: files.map((file) => ({
          kind: "file",
          type: file.type,
          getAsFile: () => file,
        })),
      },
    });

    fireEvent.dragOver(chatRoom, {
      dataTransfer: {
        files: files,
        items: files.map((file) => ({
          kind: "file",
          type: file.type,
          getAsFile: () => file,
        })),
      },
    });

    // Verify drag overlay appears
    await waitFor(() => {
      const overlay = document.querySelector(".drag-overlay");
      expect(overlay).toBeInTheDocument();
    });
  });

  test("filtering non-image files during drag and drop", async () => {
    const IntegratedChatComponent = () => {
      const { handleMultipleImageDrop } =
        require("../../contexts/ChatStateContext").useChatImage();

      return (
        <div>
          <ChatRoom
            getDisplayName={() => "Test User"}
            searchTerm=""
            onDragStateChange={() => {}}
            onImageDrop={handleMultipleImageDrop}
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

    render(
      <ChatStateProvider>
        <IntegratedChatComponent />
      </ChatStateProvider>
    );

    const chatRoom = screen.getByRole("log");

    // Mix of image and non-image files
    const files = [
      new File(["test1"], "test1.png", { type: "image/png" }),
      new File(["test2"], "test2.txt", { type: "text/plain" }),
      new File(["test3"], "test3.jpg", { type: "image/jpeg" }),
      new File(["test4"], "test4.pdf", { type: "application/pdf" }),
    ];

    simulateMultiFileDragDrop(chatRoom, files);

    // Should only process the 2 image files
    await waitFor(
      () => {
        expect(screen.getByText("2 Images Selected")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    expect(
      screen.getByRole("button", { name: /send 2 images/i })
    ).toBeInTheDocument();
  });
});
