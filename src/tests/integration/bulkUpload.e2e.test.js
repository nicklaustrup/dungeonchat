/**
 * Integration test for bulk image upload functionality
 * Tests the complete flow from file selection to bulk upload modal
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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

describe("Bulk Image Upload Integration", () => {
  let originalFileReader;

  beforeAll(() => {
    originalFileReader = global.FileReader;
    global.FileReader = MockFileReader;
  });

  afterAll(() => {
    global.FileReader = originalFileReader;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("bulk file selection opens bulk upload modal", async () => {
    render(
      <ChatStateProvider>
        <ChatInput
          getDisplayName={() => "Test User"}
          soundEnabled={false}
          forceScrollBottom={() => {}}
        />
      </ChatStateProvider>
    );

    // Find the file input
    const fileInput = screen
      .getByLabelText(/upload image/i)
      .parentElement.querySelector("input[type=\"file\"]");
    expect(fileInput).toBeInTheDocument();

    // Create multiple test files
    const files = [
      new File(["test1"], "test1.png", { type: "image/png" }),
      new File(["test2"], "test2.jpg", { type: "image/jpeg" }),
      new File(["test3"], "test3.gif", { type: "image/gif" }),
    ];

    // Simulate file selection
    Object.defineProperty(fileInput, "files", {
      value: files,
      writable: false,
    });

    fireEvent.change(fileInput);

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

    // Check that all 3 images are displayed
    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(3);

    // Check that remove buttons are present
    const removeButtons = screen.getAllByRole("button", {
      name: /remove image/i,
    });
    expect(removeButtons).toHaveLength(3);
  });

  test("removing individual images from bulk modal", async () => {
    render(
      <ChatStateProvider>
        <ChatInput
          getDisplayName={() => "Test User"}
          soundEnabled={false}
          forceScrollBottom={() => {}}
        />
      </ChatStateProvider>
    );

    const fileInput = screen
      .getByLabelText(/upload image/i)
      .parentElement.querySelector("input[type=\"file\"]");

    const files = [
      new File(["test1"], "test1.png", { type: "image/png" }),
      new File(["test2"], "test2.jpg", { type: "image/jpeg" }),
      new File(["test3"], "test3.gif", { type: "image/gif" }),
    ];

    Object.defineProperty(fileInput, "files", {
      value: files,
      writable: false,
    });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText("3 Images Selected")).toBeInTheDocument();
    });

    // Remove one image
    const removeButtons = screen.getAllByRole("button", {
      name: /remove image/i,
    });
    fireEvent.click(removeButtons[0]);

    // The count should update
    await waitFor(() => {
      expect(screen.getByText("2 Images Selected")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: /send 2 images/i })
    ).toBeInTheDocument();
  });

  test("single file selection still uses regular image modal", async () => {
    render(
      <ChatStateProvider>
        <ChatInput
          getDisplayName={() => "Test User"}
          soundEnabled={false}
          forceScrollBottom={() => {}}
        />
      </ChatStateProvider>
    );

    const fileInput = screen
      .getByLabelText(/upload image/i)
      .parentElement.querySelector("input[type=\"file\"]");

    const file = new File(["test"], "test.png", { type: "image/png" });

    Object.defineProperty(fileInput, "files", {
      value: [file],
      writable: false,
    });
    fireEvent.change(fileInput);

    // Should use the regular single image modal
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /send image/i })
      ).toBeInTheDocument();
    });

    // Should not show the bulk modal
    expect(screen.queryByText("1 Image Selected")).not.toBeInTheDocument();
  });

  test("canceling bulk upload clears all images", async () => {
    render(
      <ChatStateProvider>
        <ChatInput
          getDisplayName={() => "Test User"}
          soundEnabled={false}
          forceScrollBottom={() => {}}
        />
      </ChatStateProvider>
    );

    const fileInput = screen
      .getByLabelText(/upload image/i)
      .parentElement.querySelector("input[type=\"file\"]");

    const files = [
      new File(["test1"], "test1.png", { type: "image/png" }),
      new File(["test2"], "test2.jpg", { type: "image/jpeg" }),
    ];

    Object.defineProperty(fileInput, "files", {
      value: files,
      writable: false,
    });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText("2 Images Selected")).toBeInTheDocument();
    });

    // Cancel the upload
    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelButton);

    // Modal should disappear
    await waitFor(() => {
      expect(screen.queryByText("2 Images Selected")).not.toBeInTheDocument();
    });
  });

  test("filters non-image files from bulk selection", async () => {
    render(
      <ChatStateProvider>
        <ChatInput
          getDisplayName={() => "Test User"}
          soundEnabled={false}
          forceScrollBottom={() => {}}
        />
      </ChatStateProvider>
    );

    const fileInput = screen
      .getByLabelText(/upload image/i)
      .parentElement.querySelector("input[type=\"file\"]");

    const files = [
      new File(["test1"], "test1.png", { type: "image/png" }),
      new File(["test2"], "test2.txt", { type: "text/plain" }), // Non-image file
      new File(["test3"], "test3.jpg", { type: "image/jpeg" }),
    ];

    Object.defineProperty(fileInput, "files", {
      value: files,
      writable: false,
    });
    fireEvent.change(fileInput);

    // Should only show the 2 image files
    await waitFor(() => {
      expect(screen.getByText("2 Images Selected")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: /send 2 images/i })
    ).toBeInTheDocument();
  });
});
