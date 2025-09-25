import React from 'react';
import './App.css';
import { PresenceProvider } from './services/PresenceContext';
import { EmojiMenuProvider } from './components/ChatInput/EmojiMenu';
import ChatPage from './pages/ChatPage';

function App() {
  const [awayAfterSeconds, setAwayAfterSeconds] = React.useState(() => {
    const stored = localStorage.getItem('awayAfterSeconds');
    const val = stored ? parseInt(stored, 10) : 300;
    return isNaN(val) ? 300 : val;
  });
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
