import React from 'react';
import ChatInput from '../components/ChatInput/ChatInput';

// Assign object to variable before exporting to satisfy lint rule import/no-anonymous-default-export
const meta = {
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

export default meta;

export const Default = (args) => <ChatInput {...args} />;
Default.storyName = 'Default';

export const WithReply = (args) => <ChatInput {...args} replyingTo={{ id: 'm1', displayName: 'Bob', text: 'Original message' }} />;
WithReply.storyName = 'With Reply';
