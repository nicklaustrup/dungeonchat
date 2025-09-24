import React from 'react';
import './App.css';
import { FirebaseProvider } from './services/FirebaseContext';
import ChatPage from './pages/ChatPage';

function App() {
  return (
    <FirebaseProvider>
      <ChatPage />
    </FirebaseProvider>
  );
}

export default App;
