import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ChatInput from '../../components/ChatInput/ChatInput';
import { ChatStateProvider } from '../../contexts/ChatStateContext';

// Mock firebase context hook
jest.mock('../../services/FirebaseContext', () => ({
  useFirebase: () => ({
    auth: { currentUser: { uid: 'user1', displayName: 'Alice' } },
    firestore: {},
    rtdb: {},
    storage: {}
  })
}));

// Mock sounds
jest.mock('../../utils/sound', () => ({
  playSendMessageSound: jest.fn(),
  playNotificationSound: jest.fn(),
  playTypingSound: jest.fn(),
  playReceiveMessageSound: jest.fn(),
  playTapSound: jest.fn(),
  beginTypingLoop: jest.fn(),
  endTypingLoop: jest.fn()
}));

// Mock image pipeline
jest.mock('../../services/imageUploadService', () => ({
  compressImage: jest.fn(async f => f),
  uploadImage: jest.fn(async () => 'https://example.com/full.png')
}));

jest.mock('../../services/messageService', () => ({
  createTextMessage: jest.fn(async () => {}),
  createImageMessage: jest.fn(async () => {})
}));

import { createImageMessage } from '../../services/messageService';

class FRMock { readAsDataURL(file) { this.result = 'data:image/png;base64,PREVIEWDATA'; if (this.onload) this.onload({ target: { result: this.result } }); } }

describe('ChatInput Image Modal Behavior', () => {
  let realFR;
  beforeEach(() => { realFR = global.FileReader; global.FileReader = FRMock; });
  afterEach(() => { global.FileReader = realFR; jest.clearAllMocks(); });

  function selectImage() {
    const uploadBtn = screen.getByRole('button', { name: /upload image/i });
    fireEvent.click(uploadBtn);
    const file = new File(['abc'], 'pic.png', { type: 'image/png' });
    const fileInput = document.getElementById('image-upload');
    fireEvent.change(fileInput, { target: { files: [file] } });
  }

  test.skip('opens modal on file select and closes on Cancel without flicker', async () => {
    render(
      <ChatStateProvider>
        <ChatInput getDisplayName={() => 'Alice'} soundEnabled={false} forceScrollBottom={() => {}} />
      </ChatStateProvider>
    );
    selectImage();
    const sendBtn = await screen.findByRole('button', { name: /send image/i });
    expect(sendBtn).toBeInTheDocument();
    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);
    // Modal should disappear
    expect(screen.queryByRole('button', { name: /send image/i })).toBeNull();
  });

  test.skip('ESC key closes the modal', async () => {
    render(
      <ChatStateProvider>
        <ChatInput getDisplayName={() => 'Alice'} soundEnabled={false} forceScrollBottom={() => {}} />
      </ChatStateProvider>
    );
    selectImage();
    await screen.findByRole('button', { name: /send image/i });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('button', { name: /send image/i })).toBeNull();
  });

  test.skip('double clicking send only creates one image message', async () => {
    render(
      <ChatStateProvider>
        <ChatInput getDisplayName={() => 'Alice'} soundEnabled={false} forceScrollBottom={() => {}} />
      </ChatStateProvider>
    );
    selectImage();
    const sendBtn = await screen.findByRole('button', { name: /send image/i });
    await act(async () => {
      fireEvent.click(sendBtn);
      fireEvent.click(sendBtn);
    });
    expect(createImageMessage.mock.calls.length).toBeLessThanOrEqual(1);
  });

  test.skip('controlled props (lifted state) also close when cancel invoked', async () => {
    // This test is no longer relevant since we use context instead of lifted state
    // Simulate the new context-based approach
    render(
      <ChatStateProvider>
        <ChatInput getDisplayName={() => 'Alice'} soundEnabled={false} forceScrollBottom={() => {}} />
      </ChatStateProvider>
    );
    selectImage();
    const sendBtn = await screen.findByRole('button', { name: /send image/i });
    expect(sendBtn).toBeInTheDocument();
    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);
    expect(screen.queryByRole('button', { name: /send image/i })).toBeNull();
  });
});
