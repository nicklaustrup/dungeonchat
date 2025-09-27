import React from 'react';
import './App.css';
import './responsive.css'; // Phase 1 mobile responsiveness
import { PresenceProvider } from './services/PresenceContext';
import { EmojiMenuProvider } from './components/ChatInput/EmojiMenu';
import { ChatStateProvider } from './contexts/ChatStateContext';
import ChatPage from './pages/ChatPage';
import { useViewportInfo } from './hooks/useViewportInfo';
import { useVirtualKeyboard } from './hooks/useVirtualKeyboard';
import { useInitTelemetry } from './hooks/useInitTelemetry';

function App() {
  // Apply viewport class logic once at app root
  useViewportInfo();
  // Detect virtual keyboard & toggle html.keyboard-open
  useVirtualKeyboard();
  // Initialize Phase 5 environment & interaction telemetry
  useInitTelemetry();
  
  // Initialize away seconds from localStorage (moved to ChatStateProvider)
  const [awayAfterSeconds] = React.useState(() => {
    const stored = localStorage.getItem('awayAfterSeconds');
    const val = stored ? parseInt(stored, 10) : 300;
    return isNaN(val) ? 300 : val;
  });
  
  return (
    <ChatStateProvider initialAwaySeconds={awayAfterSeconds}>
      <PresenceProvider awayAfterSeconds={awayAfterSeconds}>
        <ChatPage />
        <EmojiMenuProvider />
      </PresenceProvider>
    </ChatStateProvider>
  );
}

export default App;
