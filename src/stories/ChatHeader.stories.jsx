import React from 'react';
import ChatHeader from '../components/ChatHeader/ChatHeader';

const meta = {
  title: 'Chat/ChatHeader',
  component: ChatHeader,
  args: {
    user: { displayName: 'Alice Wonderland', email: 'alice@example.com', photoURL: '' },
    isDarkTheme: true,
    toggleTheme: () => {},
    soundEnabled: true,
    toggleSound: () => {},
    showSearch: true,
    setShowSearch: () => {},
    searchTerm: '',
    setSearchTerm: () => {},
    onViewProfile: () => {},
    awayAfterSeconds: 120,
    setAwayAfterSeconds: () => {},
  },
  parameters: {
    chromatic: { disableSnapshot: false }
  }
};

export default meta;

export const Default = (args) => <ChatHeader {...args} />;

export const WithSearchValue = (args) => <ChatHeader {...args} searchTerm="dragon" />;

export const LongUserName = (args) => <ChatHeader {...args} user={{ displayName: 'Sir Very Extraordinarily Long Display Name That Truncates', email: 'long@example.com', photoURL: '' }} />;
