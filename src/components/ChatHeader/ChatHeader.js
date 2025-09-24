import React from 'react';
import SignOut from '../SignOut/SignOut';

function ChatHeader({
  user,
  isDarkTheme,
  toggleTheme,
  soundEnabled,
  toggleSound,
  showSearch,
  setShowSearch,
  searchTerm,
  setSearchTerm
}) {
  const chipNameRef = React.useRef(null);
  const menuNameRef = React.useRef(null);
  const menuEmailRef = React.useRef(null);

  const applyTruncationFlags = React.useCallback(() => {
    [chipNameRef.current, menuNameRef.current, menuEmailRef.current].forEach(el => {
      if (!el) return;
      const truncated = el.scrollWidth > el.clientWidth;
      if (truncated) {
        el.setAttribute('data-truncated', 'true');
      } else {
        el.removeAttribute('data-truncated');
      }
    });
  }, []);

  React.useEffect(() => {
    applyTruncationFlags();
    window.addEventListener('resize', applyTruncationFlags);
    return () => window.removeEventListener('resize', applyTruncationFlags);
  }, [applyTruncationFlags, user?.displayName, user?.email]);

  React.useEffect(() => {
    const handleClick = (e) => {
      const menu = document.querySelector('.user-menu');
      const trigger = document.querySelector('.user-menu-trigger');
      if (!menu) return;
      if (menu.contains(e.target) || trigger?.contains(e.target)) return;
      menu.classList.remove('open');
    };
    const handleKey = (e) => { if (e.key === 'Escape') { document.querySelector('.user-menu')?.classList.remove('open'); } };
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => { document.removeEventListener('click', handleClick); document.removeEventListener('keydown', handleKey); };
  }, []);
  return (
    <header className="App-header">
      <div className="header-top">
        <h1>SuperChat 💬</h1>
        <div className="header-controls">
          <button className="icon-btn sound-toggle" onClick={toggleSound} title="Toggle sound">
            {soundEnabled ? '🔊' : '🔇'}
          </button>
          <button className="icon-btn theme-toggle" onClick={toggleTheme} title="Toggle theme">
            {isDarkTheme ? '☀️' : '🌙'}
          </button>
          <div className="search-wrapper">
            {!showSearch && (
              <button
                className="icon-btn search-icon"
                onClick={() => setShowSearch(true)}
                title="Search messages"
              >
                🔍
                <span className="search-tooltip">Search Messages</span>
              </button>
            )}
            {showSearch && (
              <div className="search-bar compact">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                  autoFocus
                />
                <button
                  className="search-close"
                  onClick={() => { setShowSearch(false); setSearchTerm(''); }}
                  title="Close search"
                >✕</button>
              </div>
            )}
          </div>
          {user && (
            <div className="user-menu-wrapper">
              <button
                className="user-chip user-menu-trigger"
                aria-haspopup="true"
                aria-expanded="false"
                title={user.displayName || 'User menu'}
                onClick={(e) => {
                  const wrapper = e.currentTarget.closest('.user-menu-wrapper');
                  const menu = wrapper?.querySelector('.user-menu');
                  if (menu) {
                    const willOpen = !menu.classList.contains('open');
                    menu.classList.toggle('open');
                    e.currentTarget.classList.toggle('open');
                    e.currentTarget.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
                    setTimeout(applyTruncationFlags, 0);
                  }
                }}
              >
                <img src={user.photoURL || '/logo192.png'} alt={user.displayName || 'User'} className="user-chip-avatar" />
                <span ref={chipNameRef} className="user-chip-name trunc-tooltip" data-full={user.displayName || 'Anonymous'}>{user.displayName || 'Anonymous'}</span>
                <span className="user-menu-caret">▾</span>
              </button>
              <div className="user-menu" onClick={(e) => e.stopPropagation()}>
                <div className="user-menu-section user-menu-profile">
                  <div className="user-menu-avatar-row">
                    <img src={user.photoURL || '/logo192.png'} alt={user.displayName || 'User'} className="user-menu-avatar" />
                    <div className="user-menu-names">
                      <span ref={menuNameRef} className="user-menu-display trunc-tooltip" data-full={user.displayName || 'Anonymous'}>{user.displayName || 'Anonymous'}</span>
                      <span ref={menuEmailRef} className="user-menu-email trunc-tooltip" data-full={user.email || ''}>{user.email || ''}</span>
                    </div>
                  </div>
                </div>
                <div className="user-menu-section user-menu-actions">
                  <button className="user-menu-item" disabled>Edit Profile (coming soon)</button>
                  <button className="user-menu-item" disabled>Settings (coming soon)</button>
                </div>
                <div className="user-menu-section user-menu-signout">
                  <SignOut />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default ChatHeader;
