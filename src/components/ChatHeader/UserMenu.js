import React from 'react';
import SignOut from '../SignOut/SignOut';
import useMenuToggle from './hooks/useMenuToggle';
import useTruncationObserver from './hooks/useTruncationObserver';
import { useUserProfile } from '../../hooks/useUserProfile';

export default function UserMenu({ user, onViewProfile, onEditProfile, onOpenSettings, openSettings, showSettings = true, children }) {
  const { open, toggle, close, triggerRef, menuRef } = useMenuToggle();
  const { register, recompute } = useTruncationObserver();
  const { profile } = useUserProfile();

  if (!user) return null;
  
  // Use username from profile, fallback to display name, then to 'Anonymous'
  const display = profile?.username || user.displayName || 'Anonymous';
  const avatar = profile?.profilePictureURL || user.photoURL || '/logo192.png';
  const isLongUsername = display.length > 30;

  const handleProfile = () => { onViewProfile && onViewProfile(user); close(); };
  const handleEditProfile = () => { onEditProfile && onEditProfile(); close(); };
  const handleSettings = () => { openSettings(); if (onOpenSettings) onOpenSettings(); close(); };

  return (
    <div className="user-menu-info-wrapper">
      <div className="user-menu-wrapper">
        <button
          ref={triggerRef}
            className={`user-chip user-menu-trigger ${open ? 'open' : ''}`}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : 'false'}
            title={display}
            onClick={() => { toggle(); setTimeout(recompute, 0); }}
          >
          <img src={avatar} alt={display} className="user-chip-avatar" />
          <span ref={register} className={`user-chip-name trunc-tooltip ${isLongUsername ? 'long-username' : ''}`} data-full={display}>{display}</span>
          <span className="user-menu-caret">▾</span>
        </button>
        <div ref={menuRef} className={`user-menu ${open ? 'open' : ''}`} onClick={(e) => e.stopPropagation()} role="menu" aria-label="User menu">
          <div className="user-menu-section user-menu-profile">
            <div className="user-menu-avatar-row">
              <img src={avatar} alt={display} className="user-menu-avatar" />
              <div className="user-menu-names">
                <span ref={register} className="user-menu-display trunc-tooltip" data-full={display}>{display}</span>
                <span ref={register} className="user-menu-email trunc-tooltip" data-full={user.email || ''}>{user.email || ''}</span>
              </div>
            </div>
          </div>
          <div className="user-menu-section user-menu-actions">
            <button className="user-menu-item actionable" onClick={handleProfile}>View Profile</button>
            <button className="user-menu-item actionable" onClick={handleEditProfile}>Edit Profile</button>
            {showSettings && (
              <button className="user-menu-item actionable" onClick={handleSettings}>Settings</button>
            )}
          </div>
          <div className="user-menu-section user-menu-signout">
            <SignOut />
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
