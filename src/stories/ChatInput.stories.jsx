import React from 'react';
import ChatInput from '../components/ChatInput/ChatInput';
import { FirebaseContext } from '../services/FirebaseContext';

export default {
  title: 'Chat/ChatInput',
  component: ChatInput,
  args: {
    getDisplayName: (uid, name) => name || 'User',
    replyingTo: null,
    setReplyingTo: () => {},
    soundEnabled: false,
    forceScrollBottom: () => {}
  },
  parameters: { chromatic: { disableSnapshot: false } }
};

// Provide minimal firebase context mocks
const firebaseMock = {
  auth: { currentUser: { uid: 'user1', displayName: 'Alice' } },
  firestore: {},
  rtdb: {},
  storage: {}
};

const Provider = (Story, ctx) => (
  <FirebaseContext.Provider value={firebaseMock}>
    <div style={{ maxWidth: 600 }}>{Story()}</div>
  </FirebaseContext.Provider>
);

export const Default = (args) => <ChatInput {...args} />;
Default.decorators = [Provider];

export const WithReply = (args) => <ChatInput {...args} replyingTo={{ id: 'm1', displayName: 'Bob', text: 'Original message' }} />;
WithReply.decorators = [Provider];
