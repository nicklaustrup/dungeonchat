import React from 'react';
import SettingsModal from '../SettingsModal/SettingsModal';
import UserMenu from './UserMenu';
import SearchBar from './SearchBar';

function ChatHeader({
  user,
  isDarkTheme,
  toggleTheme,
  soundEnabled,
  toggleSound,
  showSearch,
  setShowSearch,
  searchTerm,
  setSearchTerm,
  onViewProfile,
  awayAfterSeconds,
  setAwayAfterSeconds,
  onOpenSettings
}) {
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  return (
    <>
      <header className="App-header">
        <div className="header-top">
          <h1>DungeonChat</h1>
          <div className="logo-container"></div>
          <div className="header-controls">
            {user && (
              <UserMenu
                user={user}
                onViewProfile={onViewProfile}
                openSettings={() => setSettingsOpen(true)}
                onOpenSettings={onOpenSettings}
              >
                <SearchBar value={searchTerm} onChange={setSearchTerm} />
              </UserMenu>
            )}

          </div>
        </div>
      </header>
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        isDarkTheme={isDarkTheme}
        toggleTheme={toggleTheme}
        soundEnabled={soundEnabled}
        toggleSound={toggleSound}
        awayAfterSeconds={awayAfterSeconds}
        setAwayAfterSeconds={setAwayAfterSeconds}
      />
    </>
  );
}

export default ChatHeader;
