import React, { useState, useEffect, useCallback } from 'react';
import { useFirebase } from '../services/FirebaseContext';
import {
  searchUsersByUsername,
  getFriends,
  getBlockedUsers,
  sendFriendRequest,
  unblockUser,
  unfriend,
  getPendingFriendRequests,
  acceptFriendRequest,
  declineFriendRequest
} from '../services/friendshipService';
import UserProfileModal from './UserProfileModal';
import './FriendsListModal.css';

/**
 * Friends List Modal
 *
 * Manages user friendships and blocked users
 *
 * Features:
 * - Search for users by username
 * - Send friend requests
 * - View friend list with online status
 * - Accept/decline friend requests
 * - Unfriend users
 * - Block/unblock users
 */
function FriendsListModal({ onClose }) {
  const { user } = useFirebase();

  // Modal state
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' | 'blocked' | 'requests'
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Data state
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  // Loading state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Profile modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const loadFriends = useCallback(async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      setError(null);
      const friendsList = await getFriends(user.uid);
      setFriends(friendsList);
    } catch (err) {
      console.error('Error loading friends:', err);
      setError('Failed to load friends list');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  const loadBlockedUsers = useCallback(async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      setError(null);
      const blocked = await getBlockedUsers(user.uid);
      setBlockedUsers(blocked);
    } catch (err) {
      console.error('Error loading blocked users:', err);
      setError('Failed to load blocked users');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  const loadPendingRequests = useCallback(async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      setError(null);
      const requests = await getPendingFriendRequests(user.uid);
      setPendingRequests(requests);
    } catch (err) {
      console.error('Error loading pending requests:', err);
      setError('Failed to load friend requests');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  // Load friends list
  useEffect(() => {
    if (activeTab === 'friends' && user?.uid) {
      loadFriends();
    }
  }, [activeTab, user?.uid, loadFriends]);

  // Load blocked users
  useEffect(() => {
    if (activeTab === 'blocked' && user?.uid) {
      loadBlockedUsers();
    }
  }, [activeTab, user?.uid, loadBlockedUsers]);

  // Load pending requests
  useEffect(() => {
    if (activeTab === 'requests' && user?.uid) {
      loadPendingRequests();
    }
  }, [activeTab, user?.uid, loadPendingRequests]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      setError(null);
      const results = await searchUsersByUsername(searchTerm);

      // Filter out current user
      const filteredResults = results.filter(result => result.id !== user.uid);
      setSearchResults(filteredResults);
    } catch (err) {
      console.error('Error searching users:', err);
      setError('Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFriend = async (userId) => {
    try {
      setError(null);
      await sendFriendRequest(user.uid, userId);

      // Remove from search results
      setSearchResults(prev => prev.filter(u => u.id !== userId));
      alert('Friend request sent!');
    } catch (err) {
      console.error('Error sending friend request:', err);
      setError(err.message || 'Failed to send friend request');
    }
  };

  const handleUnfriend = async (friendId) => {
    const confirmed = window.confirm('Are you sure you want to unfriend this user?');
    if (!confirmed) return;

    try {
      setError(null);
      await unfriend(user.uid, friendId);
      await loadFriends();
    } catch (err) {
      console.error('Error unfriending user:', err);
      setError(err.message || 'Failed to unfriend user');
    }
  };

  const handleUnblock = async (blockedId) => {
    try {
      setError(null);
      await unblockUser(user.uid, blockedId);
      await loadBlockedUsers();
    } catch (err) {
      console.error('Error unblocking user:', err);
      setError(err.message || 'Failed to unblock user');
    }
  };

  const handleAcceptRequest = async (friendshipId) => {
    try {
      setError(null);
      await acceptFriendRequest(friendshipId, user.uid);
      await loadPendingRequests();
      await loadFriends(); // Refresh friends list
    } catch (err) {
      console.error('Error accepting friend request:', err);
      setError(err.message || 'Failed to accept friend request');
    }
  };

  const handleDeclineRequest = async (friendshipId) => {
    try {
      setError(null);
      await declineFriendRequest(friendshipId);
      await loadPendingRequests();
    } catch (err) {
      console.error('Error declining friend request:', err);
      setError(err.message || 'Failed to decline friend request');
    }
  };

  const openUserProfile = (userProfile) => {
    setSelectedUser(userProfile);
    setShowProfileModal(true);
  };

  const closeUserProfile = () => {
    setShowProfileModal(false);
    setSelectedUser(null);

    // Refresh current tab data
    if (activeTab === 'friends') {
      loadFriends();
    } else if (activeTab === 'blocked') {
      loadBlockedUsers();
    } else if (activeTab === 'requests') {
      loadPendingRequests();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <>
      <div className="friends-modal-overlay" onClick={onClose}>
        <div className="friends-modal" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="friends-modal-header">
            <h2>Friends List</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>

          {/* Search Bar */}
          <div className="friends-search-bar">
            <input
              type="text"
              placeholder="Search by username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchTerm.trim()}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="friends-search-results">
              <h3>Search Results</h3>
              <div className="user-list">
                {searchResults.map(userProfile => (
                  <div key={userProfile.id} className="user-item">
                    <img
                      src={userProfile.photoURL || '/default-avatar.png'}
                      alt={userProfile.username}
                      className="user-avatar"
                      onClick={() => openUserProfile(userProfile)}
                    />
                    <span
                      className="user-name"
                      onClick={() => openUserProfile(userProfile)}
                    >
                      {userProfile.username}
                    </span>
                    <button
                      className="btn-add-friend"
                      onClick={() => handleAddFriend(userProfile.id)}
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="friends-tabs">
            <button
              className={`tab ${activeTab === 'friends' ? 'active' : ''}`}
              onClick={() => setActiveTab('friends')}
            >
              Friends {friends.length > 0 && `(${friends.length})`}
            </button>
            <button
              className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
              onClick={() => setActiveTab('requests')}
            >
              Requests {pendingRequests.length > 0 && `(${pendingRequests.length})`}
            </button>
            <button
              className={`tab ${activeTab === 'blocked' ? 'active' : ''}`}
              onClick={() => setActiveTab('blocked')}
            >
              Blocked {blockedUsers.length > 0 && `(${blockedUsers.length})`}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="friends-error">
              {error}
            </div>
          )}

          {/* Tab Content */}
          <div className="friends-tab-content">
            {/* Friends Tab */}
            {activeTab === 'friends' && (
              <div className="friends-list">
                {loading ? (
                  <div className="loading">Loading friends...</div>
                ) : friends.length === 0 ? (
                  <div className="empty-state">
                    No friends yet. Search for users above to send friend requests!
                  </div>
                ) : (
                  <div className="user-list">
                    {friends.map(friend => (
                      <div key={friend.id} className="user-item">
                        <div className="user-info">
                          <img
                            src={friend.photoURL || '/default-avatar.png'}
                            alt={friend.username}
                            className="user-avatar"
                            onClick={() => openUserProfile(friend)}
                          />
                          <div className="user-details">
                            <span
                              className="user-name"
                              onClick={() => openUserProfile(friend)}
                            >
                              {friend.username}
                            </span>
                            <span className="user-status">
                              {friend.isOnline ? '🟢 Online' : '⚫ Offline'}
                            </span>
                          </div>
                        </div>
                        <button
                          className="btn-unfriend"
                          onClick={() => handleUnfriend(friend.id)}
                        >
                          Unfriend
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Requests Tab */}
            {activeTab === 'requests' && (
              <div className="requests-list">
                {loading ? (
                  <div className="loading">Loading requests...</div>
                ) : pendingRequests.length === 0 ? (
                  <div className="empty-state">
                    No pending friend requests
                  </div>
                ) : (
                  <div className="user-list">
                    {pendingRequests.map(request => (
                      <div key={request.id} className="user-item request-item">
                        <div className="user-info">
                          <img
                            src={request.from.photoURL || '/default-avatar.png'}
                            alt={request.from.username}
                            className="user-avatar"
                            onClick={() => openUserProfile(request.from)}
                          />
                          <span
                            className="user-name"
                            onClick={() => openUserProfile(request.from)}
                          >
                            {request.from.username}
                          </span>
                        </div>
                        <div className="request-actions">
                          <button
                            className="btn-accept"
                            onClick={() => handleAcceptRequest(request.id)}
                          >
                            Accept
                          </button>
                          <button
                            className="btn-decline"
                            onClick={() => handleDeclineRequest(request.id)}
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Blocked Tab */}
            {activeTab === 'blocked' && (
              <div className="blocked-list">
                {loading ? (
                  <div className="loading">Loading blocked users...</div>
                ) : blockedUsers.length === 0 ? (
                  <div className="empty-state">
                    No blocked users
                  </div>
                ) : (
                  <div className="user-list">
                    {blockedUsers.map(blockedUser => (
                      <div key={blockedUser.id} className="user-item">
                        <div className="user-info">
                          <img
                            src={blockedUser.photoURL || '/default-avatar.png'}
                            alt={blockedUser.username}
                            className="user-avatar"
                          />
                          <span className="user-name">
                            {blockedUser.username}
                          </span>
                        </div>
                        <button
                          className="btn-unblock"
                          onClick={() => handleUnblock(blockedUser.id)}
                        >
                          Unblock
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Profile Modal */}
      {showProfileModal && selectedUser && (
        <UserProfileModal
          userId={selectedUser.id}
          onClose={closeUserProfile}
        />
      )}
    </>
  );
}

export default FriendsListModal;
