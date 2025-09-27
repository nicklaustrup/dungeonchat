import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatRoom from '../../components/ChatRoom/ChatRoom';
import ChatInput from '../../components/ChatInput/ChatInput';

// Firebase mock
// Mock Firebase context to provide an authenticated user and minimal services
jest.mock('../../services/FirebaseContext', () => ({
  useFirebase: () => ({
    auth: { currentUser: { uid: 'u1', displayName: 'Alice' } },
    user: { uid: 'u1', displayName: 'Alice' },
    firestore: {},
    rtdb: {},
    storage: {}
  })
}));

// No RTDB operations needed; ChatRoom & ChatInput do not use firebase/database directly in this harness.

jest.mock('../../utils/sound', () => ({
  playSendMessageSound: jest.fn(),
  playReceiveMessageSound: jest.fn(),
  playNotificationSound: jest.fn(),
  playTypingSound: jest.fn(),
  playTapSound: jest.fn(),
  beginTypingLoop: jest.fn(),
  endTypingLoop: jest.fn()
}));

jest.mock('../../services/imageUploadService', () => ({
  compressImage: jest.fn(async f => f),
  uploadImage: jest.fn(async () => 'https://example.com/image.png')
}));

jest.mock('../../services/messageService', () => ({
  createTextMessage: jest.fn(async () => {}),
  createImageMessage: jest.fn(async () => {})
}));

// Short-circuit Firestore message subscription hook to avoid needing Firestore
jest.mock('../../hooks/useChatMessages', () => ({
  useChatMessages: () => ({ messages: [], loadMore: jest.fn(), hasMore: false })
}));

// Use real useImageMessage (no mock) so preview modal behaves normally before upload.

// Mock other hooks used by ChatInput but irrelevant to drag/drop
jest.mock('../../hooks/useTypingPresence', () => ({ useTypingPresence: () => ({ handleInputActivity: () => {} }) }));
jest.mock('../../hooks/useEmojiPicker', () => ({ useEmojiPicker: () => ({ open:false, toggle: jest.fn(), buttonRef: { current: null }, setOnSelect: () => {} }) }));

class FRMock { readAsDataURL(file){ this.result='data:image/png;base64,MOCK'; if(this.onload) this.onload({ target:{ result:this.result } }); } }

// Utility to synthesize a drag/drop with DataTransfer
function fireDrop(target, file){
  const dataTransfer = {
    files: [file],
    items: [{ kind: 'file', type: file.type, getAsFile: () => file }]
  };
  fireEvent.dragEnter(target, { dataTransfer });
  fireEvent.dragOver(target, { dataTransfer });
  fireEvent.drop(target, { dataTransfer });
}

// Test harness composing ChatRoom + ChatInput similar to ChatPage but stripped down
function Harness(){
  const [replyingTo, setReplyingTo] = React.useState(null);
  const [selectedImage, setSelectedImage] = React.useState(null);
  const [imagePreview, setImagePreview] = React.useState(null);
  const [uploading, setUploading] = React.useState(false);
  const handleImageDrop = (file) => {
    if (!file) return;
    setSelectedImage(file);
    const fr = new FileReader();
    fr.onload = (e) => setImagePreview(e.target.result);
    fr.readAsDataURL(file);
  };
  const getDisplayName = () => 'Alice';
  return (
    <>
      <ChatRoom
        getDisplayName={getDisplayName}
        searchTerm=""
        onDragStateChange={() => {}}
        replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
        onImageDrop={handleImageDrop}
        onViewProfile={() => {}}
        onScrollMeta={() => {}}
        soundEnabled={false}
      />
      <ChatInput
        getDisplayName={getDisplayName}
        replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
        soundEnabled={false}
        selectedImage={selectedImage}
        setSelectedImage={setSelectedImage}
        imagePreview={imagePreview}
        setImagePreview={setImagePreview}
        uploading={uploading}
        setUploading={setUploading}
        forceScrollBottom={()=>{}}
      />
    </>
  );
}

describe.skip('ChatRoom drag & drop image integration', () => {
  let realFR;
  beforeEach(() => { realFR = global.FileReader; global.FileReader = FRMock; window.__TEST_TOASTS__ = []; });
  afterEach(() => { global.FileReader = realFR; jest.clearAllMocks(); });

  // Provide a simple IntersectionObserver mock for virtual scroll logic
  beforeAll(() => {
    class IO {
      constructor(cb){ this._cb = cb; }
      observe(){ /* no-op */ }
      unobserve(){ /* no-op */ }
      disconnect(){ /* no-op */ }
      trigger(entries=[{ isIntersecting:true }]){ this._cb(entries); }
    }
    global.IntersectionObserver = IO;
  });

  function setup(){
    render(<Harness />);
    return screen.getByRole('log');
  }

  test('dropping an image opens preview modal with actions', async () => {
    const log = setup();
    const img = new File(['data'], 'sample.png', { type: 'image/png' });
    fireDrop(log, img);
    expect(await screen.findByRole('button', { name: /send image/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  test('second drop after cancel reopens modal', async () => {
    const log = setup();
    const img1 = new File(['data1'], 'one.png', { type: 'image/png' });
    fireDrop(log, img1);
    expect(await screen.findByRole('button', { name: /send image/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('button', { name: /send image/i })).toBeNull();
    const img2 = new File(['data2'], 'two.png', { type: 'image/png' });
    fireDrop(log, img2);
    expect(await screen.findByRole('button', { name: /send image/i })).toBeInTheDocument();
  });
});
