import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ChatInput from '../../components/ChatInput/ChatInput';
// Instead of using context directly (not exported), mock useFirebase hook
jest.mock('../../services/FirebaseContext', () => ({
  useFirebase: () => ({
    auth: { currentUser: { uid: 'user1', displayName: 'Alice' } },
    firestore: {},
    rtdb: {},
    storage: {}
  })
}));
// Avoid real RTDB ref usage in presence hooks
jest.mock('../../services/presenceService', () => ({
  setTyping: jest.fn(),
  refreshPresence: jest.fn()
}));

jest.mock('../../services/messageService', () => ({
  createTextMessage: jest.fn(async () => {}),
  createImageMessage: jest.fn(async () => {})
}));

import { createTextMessage } from '../../services/messageService';

describe('ChatInput integration', () => {
  test('sends text message on submit', async () => {
    const setReplyingTo = jest.fn();
    render(<ChatInput getDisplayName={() => 'Alice'} replyingTo={null} setReplyingTo={setReplyingTo} soundEnabled={false} forceScrollBottom={() => {}} />);
    const textarea = screen.getByLabelText(/message text/i);
    fireEvent.change(textarea, { target: { value: 'Hello there' } });
    const sendBtn = screen.getByRole('button', { name: /send message/i });
    await act(async () => { fireEvent.click(sendBtn); });
    expect(createTextMessage).toHaveBeenCalled();
    expect(textarea.value).toBe('');
  });

  test('enter key without shift triggers send', async () => {
    const setReplyingTo = jest.fn();
    render(<ChatInput getDisplayName={() => 'Alice'} replyingTo={null} setReplyingTo={setReplyingTo} soundEnabled={false} forceScrollBottom={() => {}} />);
    const textarea = screen.getByLabelText(/message text/i);
    fireEvent.change(textarea, { target: { value: 'Line 1' } });
    await act(async () => { fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false, preventDefault: () => {} }); });
    expect(createTextMessage).toHaveBeenCalled();
  });
});
