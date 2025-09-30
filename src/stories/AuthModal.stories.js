import React, { useState } from 'react';
import AuthModal from '../components/AuthModal';
import { FirebaseProviderMock } from '../../.storybook/providers/FirebaseProviderMock';

const meta = {
  title: 'Components/AuthModal (Legacy)',
  component: AuthModal,
  decorators: [
    (Story) => (
      <FirebaseProviderMock>
        <Story />
      </FirebaseProviderMock>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: '⚠️ **DEPRECATED**: This modal-based authentication is no longer used. See SignIn component for the current inline implementation.',
      },
    },
  },
};

export default meta;

// Story wrapper component to manage modal state
function AuthModalStoryWrapper({ initialMode = 'signin' }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div style={{ padding: '20px' }}>
      <button onClick={() => setIsOpen(true)}>Open Auth Modal</button>
      <AuthModal 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialMode={initialMode}
      />
    </div>
  );
}

export const SignIn = () => <AuthModalStoryWrapper initialMode="signin" />;

export const SignUp = () => <AuthModalStoryWrapper initialMode="signup" />;

export const PasswordReset = () => <AuthModalStoryWrapper initialMode="reset" />;

// Individual component demos
export const SignInModal = {
  render: () => (
    <FirebaseProviderMock>
      <AuthModal 
        isOpen={true}
        onClose={() => {}}
        initialMode="signin"
      />
    </FirebaseProviderMock>
  ),
};

export const SignUpModal = {
  render: () => (
    <FirebaseProviderMock>
      <AuthModal 
        isOpen={true}
        onClose={() => {}}
        initialMode="signup"
      />
    </FirebaseProviderMock>
  ),
};

export const PasswordResetModal = {
  render: () => (
    <FirebaseProviderMock>
      <AuthModal 
        isOpen={true}
        onClose={() => {}}
        initialMode="reset"
      />
    </FirebaseProviderMock>
  ),
};