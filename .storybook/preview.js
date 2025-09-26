import '../src/index.css';
import '../src/components/ChatRoom/ChatMessage.css';
import '../src/components/ChatRoom/ChatMessage.menu.css';
import '../src/components/ChatRoom/ChatMessage.reactions.css';
import '../src/components/ChatRoom/ChatMessage.modals.css';
import '../src/components/ChatRoom/ChatMessage.tooltips.css';

// Global parameters (Chromatic viewport & a11y suggestions)
export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: { matchers: { color: /(background|color)$/i, date: /Date$/ } },
  chromatic: { pauseAnimationAtEnd: true },
  a11y: { disable: false }
};

// Lightweight mock providers to satisfy ChatMessage dependencies without real Firebase.
import React from 'react';
import { FirebaseProviderMock } from './providers/FirebaseProviderMock';
import { PresenceProviderMock } from './providers/PresenceProviderMock';

export const decorators = [
  (Story) => (
    <FirebaseProviderMock>
      <PresenceProviderMock>
        <div style={{ maxWidth: 640, margin: '1rem auto', fontFamily: 'system-ui, sans-serif' }}>
          <Story />
        </div>
      </PresenceProviderMock>
    </FirebaseProviderMock>
  )
];
