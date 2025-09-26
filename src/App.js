import React from 'react';
import './App.css';
import './responsive.css'; // Phase 1 mobile responsiveness
import { PresenceProvider } from './services/PresenceContext';
import { EmojiMenuProvider } from './components/ChatInput/EmojiMenu';
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
  const [awayAfterSeconds, setAwayAfterSeconds] = React.useState(() => {
    const stored = localStorage.getItem('awayAfterSeconds');
    const val = stored ? parseInt(stored, 10) : 300;
    return isNaN(val) ? 300 : val;
  });
  //test
  React.useEffect(() => {
    localStorage.setItem('awayAfterSeconds', String(awayAfterSeconds));
  }, [awayAfterSeconds]);
  return (
    <PresenceProvider awayAfterSeconds={awayAfterSeconds}>
      <ChatPage awayAfterSeconds={awayAfterSeconds} setAwayAfterSeconds={setAwayAfterSeconds} />
      <EmojiMenuProvider />
    </PresenceProvider>
  );
}

export default App;
