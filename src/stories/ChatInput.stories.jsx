import React from 'react';
import ChatInput from '../components/ChatInput/ChatInput';

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

export const Default = (args) => <ChatInput {...args} />;

export const WithReply = (args) => <ChatInput {...args} replyingTo={{ id: 'm1', displayName: 'Bob', text: 'Original message' }} />;
