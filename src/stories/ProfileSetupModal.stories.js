import React from 'react';
import { ProfileSetupModal } from '../components/ProfileSetupModal/ProfileSetupModal';
import { FirebaseProviderMock } from '../../.storybook/providers/FirebaseProviderMock';

const meta = {
  title: 'Profile/ProfileSetupModal',
  component: ProfileSetupModal,
  decorators: [
    (Story) => (
      <FirebaseProviderMock>
        <Story />
      </FirebaseProviderMock>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

const Template = (args) => <ProfileSetupModal {...args} />;

export const FirstTimeUser = Template.bind({});
FirstTimeUser.args = {
  onComplete: () => console.log('Setup completed'),
  canSkip: false,
};

export const SkippableSetup = Template.bind({});
SkippableSetup.args = {
  onComplete: () => console.log('Setup completed'),
  canSkip: true,
};

export const CompletedUser = Template.bind({});
CompletedUser.args = {
  onComplete: () => console.log('Setup completed'),
  canSkip: true,
};
CompletedUser.decorators = [
  (Story) => (
    <FirebaseProviderMock 
      mockProfile={{
        uid: 'user123',
        username: 'completeduser',
        displayName: 'Completed User',
        bio: '',
        statusMessage: '',
        profilePictureURL: '',
        authProvider: 'google.com',
        emailVerified: true,
        profileVisibility: 'public',
        showEmail: false,
        showLastActive: true,
        profanityFilterEnabled: true,
        createdAt: new Date(),
        lastUpdated: new Date()
      }}
    >
      <Story />
    </FirebaseProviderMock>
  ),
];

export const Interactive = () => {
  const [showModal, setShowModal] = React.useState(true);
  
  return (
    <FirebaseProviderMock>
      <div style={{ padding: '20px', background: '#f5f5f5', minHeight: '100vh' }}>
        <h1>Profile Setup Modal Demo</h1>
        <p>This demonstrates the first-time user experience.</p>
        <button 
          onClick={() => setShowModal(true)}
          style={{ 
            padding: '10px 20px', 
            background: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Show Setup Modal
        </button>
        
        {showModal && (
          <ProfileSetupModal 
            onComplete={() => {
              console.log('Setup completed');
              setShowModal(false);
            }}
            canSkip={true}
          />
        )}
      </div>
    </FirebaseProviderMock>
  );
};

export default meta;