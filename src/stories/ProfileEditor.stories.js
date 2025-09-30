import React from 'react';
import { ProfileEditor } from '../components/ProfileEditor/ProfileEditor';
import { FirebaseProviderMock } from '../../.storybook/providers/FirebaseProviderMock';

const meta = {
  title: 'Profile/ProfileEditor',
  component: ProfileEditor,
  decorators: [
    (Story) => (
      <FirebaseProviderMock>
        <div style={{ padding: '20px', background: '#f5f5f5', minHeight: '100vh' }}>
          <Story />
        </div>
      </FirebaseProviderMock>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

const Template = (args) => <ProfileEditor {...args} />;

export const NewUser = Template.bind({});
NewUser.args = {
  onSave: () => console.log('Profile saved'),
  onCancel: () => console.log('Profile cancelled'),
  compact: false,
};

export const CompactMode = Template.bind({});
CompactMode.args = {
  onSave: () => console.log('Profile saved'),
  onCancel: () => console.log('Profile cancelled'),
  compact: true,
};

export const ExistingUser = Template.bind({});
ExistingUser.args = {
  onSave: () => console.log('Profile saved'),
  onCancel: () => console.log('Profile cancelled'),
  compact: false,
};
ExistingUser.decorators = [
  (Story) => (
    <FirebaseProviderMock 
      mockProfile={{
        uid: 'user123',
        username: 'johndoe',
        displayName: 'John Doe',
        bio: 'Software developer passionate about creating amazing user experiences. Love coding, coffee, and collaboration.',
        statusMessage: 'Building something awesome! 🚀',
        profilePictureURL: 'https://via.placeholder.com/150x150?text=JD',
        authProvider: 'google.com',
        emailVerified: true,
        profileVisibility: 'public',
        showEmail: false,
        showLastActive: true,
        profanityFilterEnabled: true,
        createdAt: new Date('2023-01-15'),
        lastUpdated: new Date()
      }}
    >
      <div style={{ padding: '20px', background: '#f5f5f5', minHeight: '100vh' }}>
        <Story />
      </div>
    </FirebaseProviderMock>
  ),
];

export const Loading = () => (
  <FirebaseProviderMock loading={true}>
    <div style={{ padding: '20px', background: '#f5f5f5', minHeight: '100vh' }}>
      <ProfileEditor 
        onSave={() => console.log('Profile saved')}
        onCancel={() => console.log('Profile cancelled')}
      />
    </div>
  </FirebaseProviderMock>
);

export default meta;