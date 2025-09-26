import React from 'react';
import ChatMessage from '../components/ChatRoom/ChatMessage';
// For Storybook we rely on the real hook but avoid interaction side-effects by not clicking reactions in snapshots.

// Utility builder
const baseTimestamp = new Date();
const makeMsg = (overrides) => ({
  id: overrides.id || Math.random().toString(36).slice(2),
  text: 'Hello world from Storybook!',
  uid: 'user_other',
  photoURL: '',
  createdAt: baseTimestamp,
  displayName: 'Alice',
  reactions: {},
  type: 'text',
  ...overrides
});

const ChatMessageMeta = {
  title: 'Chat/ChatMessage',
  component: ChatMessage,
  args: {
    searchTerm: '',
    getDisplayName: (uid, fallback) => ({ user_other: 'Alice', user_current: 'You', user_offline: 'Ghost' }[uid] || fallback || 'User'),
    onReply: () => {},
    onViewProfile: () => {},
    showMeta: true
  },
  parameters: {
    chromatic: { disableSnapshot: false }
  }
};

export default ChatMessageMeta;

export const TextReceived = (args) => <ChatMessage {...args} message={makeMsg({ text: 'A plain received message.' })} />;

export const TextSent = (args) => <ChatMessage {...args} message={makeMsg({ uid: 'user_current', displayName: 'You', text: 'A message I sent.' })} />;

export const WithReactions = (args) => <ChatMessage {...args} message={makeMsg({ text: 'Message with reactions', reactions: { '👍': ['user_current', 'user_other'], '❤️': ['user_other'] } })} />;

export const ImageMessage = (args) => <ChatMessage {...args} message={makeMsg({ type: 'image', imageURL: 'https://placehold.co/300x160/png', text: '' })} />;

export const DeletedMessage = (args) => <ChatMessage {...args} message={makeMsg({ text: '-deleted-', deleted: true })} />;

export const EditedMessage = (args) => <ChatMessage {...args} message={makeMsg({ text: 'Edited content here', editedAt: new Date(Date.now() - 60000) })} />;

export const ReplyMessage = (args) => <ChatMessage {...args} message={makeMsg({ text: 'Replying here', replyTo: { id: 'prior1', displayName: 'Alice', text: 'Original message excerpt', uid: 'user_other' } })} />;

export const NoMetaGrouped = (args) => <ChatMessage {...args} showMeta={false} message={makeMsg({ text: 'Grouped message no meta', uid: 'user_current' })} />;

export const MenuOpenState = (args) => {
  // Show menu by simulating internal state via wrapper that toggles after mount
  const msg = makeMsg({ text: 'Message with options menu open' });
  // We cannot directly force menu open via prop; rely on user click in Chromatic (not ideal). Instead leave as standard.
  return <ChatMessage {...args} message={msg} />;
};
