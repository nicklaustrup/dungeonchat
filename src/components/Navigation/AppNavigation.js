import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import UserMenu from '../ChatHeader/UserMenu';
import SearchBar from '../ChatHeader/SearchBar';
import CampaignSwitcher from './CampaignSwitcher';
import { useFirebase } from '../../services/FirebaseContext';
import './AppNavigation.css';
import { ProfileDisplay } from '../ProfileDisplay/ProfileDisplay';

function AppNavigation() {
  const location = useLocation();
  const { user } = useFirebase();
  const [searchCollapsed, setSearchCollapsed] = useState(true);
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  
  // Check if we're in a chat context that would have ChatStateProvider
  const isInChatContext = (location.pathname === '/lobby') || 
                         (location.pathname.startsWith('/campaign/') && location.pathname.includes('/chat'));
  
  // Only use chat search when we're in a chat context
  // For now, we'll use local state everywhere to avoid hook rule violations
  // TODO: Implement proper context detection without conditional hook calls
  const searchTerm = localSearchTerm;
  const setSearchTerm = setLocalSearchTerm;
  
  // Determine if we should show the search bar based on current route
  const shouldShowSearch = isInChatContext;
  
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    if (path === '/lobby') {
      return location.pathname === '/lobby';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="app-navigation">
      <div className="nav-brand">
        <Link to="/">DungeonChat</Link>
      </div>
      
      <div className="nav-links">
        <Link 
          to="/" 
          className={isActive('/') ? 'active' : ''}
        >
          Home
        </Link>
        
        <Link 
          to="/lobby" 
          className={isActive('/lobby') ? 'active' : ''}
        >
          Lobby
        </Link>
        
        <Link 
          to="/campaigns" 
          className={isActive('/campaigns') ? 'active' : ''}
        >
          Campaigns
        </Link>
        
        <Link 
          to="/create-campaign" 
          className="nav-cta"
        >
          Create Campaign
        </Link>
      </div>
      
      <div className="nav-center">
        {user && <CampaignSwitcher />}
      </div>
      
      <div className="nav-right">
        {shouldShowSearch && (
          <SearchBar 
            value={searchTerm}
            onChange={setSearchTerm}
            collapsed={searchCollapsed}
            onToggle={() => setSearchCollapsed(!searchCollapsed)}
          />
        )}
        
        {user && (
          <UserMenu
            user={user}
            onViewProfile={(user) => {
              setProfileOpen(true);
            }}
            onEditProfile={() => {
              setProfileOpen(true);
            }}
            openSettings={() => {
              // TODO: Implement settings
              console.log('Open settings');
            }}
            onOpenSettings={() => {
              // TODO: Implement settings
              console.log('Open settings');
            }}
            showSettings={false}
          />
        )}
      </div>
      
      {profileOpen && (
        <ProfileDisplay
          userId={user?.uid}
          onClose={() => setProfileOpen(false)}
        />
      )}
    </nav>
  );
}

export default AppNavigation;