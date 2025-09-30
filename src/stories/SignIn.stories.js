import React from 'react';
import SignIn from '../components/SignIn/SignIn';
import { FirebaseProviderMock } from '../../.storybook/providers/FirebaseProviderMock';
import { ChatStateProvider } from '../contexts/ChatStateContext';

const meta = {
  title: 'Components/SignIn',
  component: SignIn,
  decorators: [
    (Story) => (
      <FirebaseProviderMock>
        <ChatStateProvider>
          <Story />
        </ChatStateProvider>
      </FirebaseProviderMock>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

// Default sign-in page
export const Default = {
  render: () => <SignIn />,
};

// Dark theme variant  
export const DarkTheme = {
  render: () => <SignIn />,
  decorators: [
    (Story) => (
      <FirebaseProviderMock>
        <ChatStateProvider initialAwaySeconds={300}>
          <div className="dark-theme">
            <Story />
          </div>
        </ChatStateProvider>
      </FirebaseProviderMock>
    ),
  ],
};

// Mobile view
export const Mobile = {
  render: () => <SignIn />,
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};