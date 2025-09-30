import React from 'react';
import { SettingsMenu } from '../components/SettingsMenu/SettingsMenu';
import { FirebaseProviderMock } from '../../.storybook/providers/FirebaseProviderMock';

const meta = {
  title: 'Profile/SettingsMenu',
  component: SettingsMenu,
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

const Template = (args) => <SettingsMenu {...args} />;

export const Default = Template.bind({});
Default.args = {
  isOpen: true,
  onClose: () => console.log('Settings closed'),
};

export const IncompleteProfile = Template.bind({});
IncompleteProfile.args = {
  isOpen: true,
  onClose: () => console.log('Settings closed'),
};
IncompleteProfile.decorators = [
  (Story) => (
    <FirebaseProviderMock 
      mockProfile={{
        uid: 'user123',
        username: '', // Incomplete profile
        displayName: 'John Doe',
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

export const CompleteProfile = Template.bind({});
CompleteProfile.args = {
  isOpen: true,
  onClose: () => console.log('Settings closed'),
};
CompleteProfile.decorators = [
  (Story) => (
    <FirebaseProviderMock 
      mockProfile={{
        uid: 'user123',
        username: 'johndoe',
        displayName: 'John Doe',
        bio: 'Software developer passionate about creating amazing user experiences.',
        statusMessage: 'Building something awesome! 🚀',
        profilePictureURL: 'https://via.placeholder.com/150x150?text=JD',
        authProvider: 'github.com',
        emailVerified: true,
        profileVisibility: 'public',
        showEmail: false,
        showLastActive: true,
        profanityFilterEnabled: false,
        createdAt: new Date('2023-01-15'),
        lastUpdated: new Date()
      }}
    >
      <Story />
    </FirebaseProviderMock>
  ),
];

export const PrivateProfile = Template.bind({});
PrivateProfile.args = {
  isOpen: true,
  onClose: () => console.log('Settings closed'),
};
PrivateProfile.decorators = [
  (Story) => (
    <FirebaseProviderMock 
      mockProfile={{
        uid: 'user123',
        username: 'privateuser',
        displayName: 'Private User',
        bio: 'This user prefers privacy.',
        statusMessage: 'Away',
        profilePictureURL: 'https://via.placeholder.com/150x150?text=PU',
        authProvider: 'password',
        emailVerified: true,
        profileVisibility: 'private',
        showEmail: false,
        showLastActive: false,
        profanityFilterEnabled: true,
        createdAt: new Date('2023-06-01'),
        lastUpdated: new Date()
      }}
    >
      <Story />
    </FirebaseProviderMock>
  ),
];

export const Interactive = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  return (
    <FirebaseProviderMock 
      mockProfile={{
        uid: 'user123',
        username: 'demouser',
        displayName: 'Demo User',
        bio: 'This is a demo profile for testing the settings interface.',
        statusMessage: 'Testing settings! 🧪',
        profilePictureURL: 'https://via.placeholder.com/150x150?text=DU',
        authProvider: 'google.com',
        emailVerified: true,
        profileVisibility: 'public',
        showEmail: true,
        showLastActive: true,
        profanityFilterEnabled: true,
        createdAt: new Date('2023-03-10'),
        lastUpdated: new Date()
      }}
    >
      <div style={{ padding: '20px', background: '#f5f5f5', minHeight: '100vh' }}>
        <h1>Settings Menu Demo</h1>
        <p>This demonstrates the enhanced settings menu with profile management.</p>
        <button 
          onClick={() => setIsOpen(true)}
          style={{ 
            padding: '10px 20px', 
            background: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Open Settings
        </button>
        
        <SettingsMenu 
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      </div>
    </FirebaseProviderMock>
  );
};

export default meta;