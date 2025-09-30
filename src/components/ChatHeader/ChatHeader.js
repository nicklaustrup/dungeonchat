import React, { Suspense, lazy, useEffect, useState } from 'react';
import UserMenu from './UserMenu';
import SearchBar from './SearchBar';

// Lazy load heavier settings modal
const SettingsModal = lazy(() => import('../SettingsModal/SettingsModal'));
const InlineProfileEditor = lazy(() => import('../InlineProfileEditor/InlineProfileEditor'));

function ChatHeader({
  user,
  isDarkTheme,
  toggleTheme,
  soundEnabled,
  toggleSound,
  searchTerm,
  setSearchTerm,
  onViewProfile,
  awayAfterSeconds,
  setAwayAfterSeconds,
  onOpenSettings
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchCollapsed, setSearchCollapsed] = useState(true); // default collapsed on mobile

  // Detect viewport width (simple listener; could be replaced by CSS-only solution but we need state for collapsed default)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 599px)');
    const handle = () => setIsMobile(mq.matches);
    handle();
    mq.addEventListener('change', handle);
    return () => mq.removeEventListener('change', handle);
  }, []);

  useEffect(() => {
    // When switching to desktop, ensure search expanded (legacy behavior). When to mobile, collapse it.
    setSearchCollapsed(isMobile);
  }, [isMobile]);

  const toggleSearch = () => setSearchCollapsed(c => !c);

  const handleEditProfile = () => {
    setProfileEditorOpen(true);
  };

  return (
    <>
      <header className={`App-header ${isMobile ? 'mobile-condense' : ''}`}>
        {!isMobile && (
          <div className="header-top desktop-layout">
            <h1 className="app-title">DungeonChat</h1>
            <div className="logo-container" aria-hidden="true" />
            {user && (
              <div className="header-controls stacked">
                <UserMenu
                  user={user}
                  onViewProfile={onViewProfile}
                  openSettings={() => setSettingsOpen(true)}
                  onOpenSettings={onOpenSettings}
                  onEditProfile={handleEditProfile}
                />
                <SearchBar value={searchTerm} onChange={setSearchTerm} collapsed={false} onToggle={() => {}} disableClose />
              </div>
            )}
          </div>
        )}
        {isMobile && (
          <div className="header-grid">
            <div className="header-left">
              <h1 className="app-title">DungeonChat</h1>
              <div className="logo-container mobile" aria-hidden="true" />
            </div>
            <div className="header-right mobile-stack-right">
              {user && (
                <>
                  <UserMenu
                    user={user}
                    onViewProfile={onViewProfile}
                    openSettings={() => setSettingsOpen(true)}
                    onOpenSettings={onOpenSettings}
                    onEditProfile={handleEditProfile}
                  />
                  <SearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    collapsed={searchCollapsed}
                    onToggle={toggleSearch}
                  />
                </>
              )}
            </div>
          </div>
        )}
      </header>
      <Suspense fallback={null}>
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
        {profileEditorOpen && (
          <div className="modal-overlay" onClick={() => setProfileEditorOpen(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <InlineProfileEditor
                onSave={() => setProfileEditorOpen(false)}
                onCancel={() => setProfileEditorOpen(false)}
                compact={false}
              />
            </div>
          </div>
        )}
      </Suspense>
    </>
  );
}

export default ChatHeader;
