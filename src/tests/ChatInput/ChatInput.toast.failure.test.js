import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ChatInput from '../../components/ChatInput/ChatInput';

jest.mock('../../services/FirebaseContext', () => ({
  useFirebase: () => ({
    auth: { currentUser: { uid: 'u1', displayName: 'Alice' } },
    firestore: {},
    rtdb: {},
    storage: {}
  })
}));

jest.mock('../../utils/sound', () => ({
  playSendMessageSound: jest.fn(),
  beginTypingLoop: jest.fn(),
  endTypingLoop: jest.fn(),
  playReceiveMessageSound: jest.fn(),
  playNotificationSound: jest.fn(),
  playTypingSound: jest.fn(),
  playTapSound: jest.fn()
}));

// Force upload failure to exercise toast path
jest.mock('../../services/imageUploadService', () => ({
  compressImage: jest.fn(async f => { throw new Error('Compression broke'); }),
  uploadImage: jest.fn(async () => { throw new Error('Upload fail'); })
}));

jest.mock('../../services/messageService', () => ({
  createTextMessage: jest.fn(async () => {}),
  createImageMessage: jest.fn(async () => {})
}));

class FRMock { readAsDataURL(file){ this.result='data:image/png;base64,MOCK'; if(this.onload) this.onload({ target:{ result:this.result } }); } }

describe('ChatInput toast on image failure', () => {
  let realFR;
  beforeEach(() => { realFR = global.FileReader; global.FileReader = FRMock; window.__TEST_TOASTS__ = []; });
  afterEach(() => { global.FileReader = realFR; jest.clearAllMocks(); });

  function selectImage(){
    const fileBtn = screen.getByRole('button', { name: /upload image/i });
    fireEvent.click(fileBtn);
    const file = new File(['data'], 'bad.png', { type: 'image/png' });
    const input = document.getElementById('image-upload');
    fireEvent.change(input, { target: { files: [file] } });
  }

  test('toast is pushed when upload pipeline fails', async () => {
    render(<ChatInput getDisplayName={() => 'Alice'} replyingTo={null} setReplyingTo={() => {}} soundEnabled={false} />);
    selectImage();
    const sendBtn = await screen.findByRole('button', { name: /send image/i });
    await act(async () => { fireEvent.click(sendBtn); });
    expect(window.__TEST_TOASTS__.length).toBeGreaterThan(0);
    expect(window.__TEST_TOASTS__[0].message).toMatch(/failed/i);
  });
});
