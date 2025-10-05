import React, { useState, useEffect, useCallback } from 'react';
import './FriendsListModal.css';
import { useFirebase } from '../../services/FirebaseContext';
import friendshipService from '../../services/friendshipService';
import { usePresence } from '../../services/PresenceContext';
import UserProfileModal from '../UserProfileModal/UserProfileModal';

export default function FriendsListModal({ isOpen, onClose }) {
  const { user } = useFirebase();
  const { userStatuses } = usePresence();
  const [activeTab, setActiveTab] = useState('friends');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Load friends, blocked users, and pending requests
  const loadData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [friendsList, blockedList, pendingList, sentList] = await Promise.all([
        friendshipService.getFriends(user.uid),
        friendshipService.getBlockedUsers(user.uid),
        friendshipService.getPendingFriendRequests(user.uid),
        friendshipService.getSentFriendRequests(user.uid)
      ]);

      setFriends(friendsList);
      setBlockedUsers(blockedList);
      setPendingRequests(pendingList);
      setSentRequests(sentList);
    } catch (err) {
      console.error('Error loading friends data:', err);
      setError('Failed to load friends data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setError('');
    try {
      const results = await friendshipService.searchUsersByUsername(searchTerm);
      // Filter out current user from results
      setSearchResults(results.filter(u => u.id !== user.uid));
    } catch (err) {
      console.error('Error searching users:', err);
      setError('Failed to search users');
    } finally {
      setSearching(false);
    }
  };

  const handleAddFriend = async (userId) => {
    try {
      await friendshipService.sendFriendRequest(user.uid, userId);
      setSearchResults([]);
      setSearchTerm('');
      loadData();
    } catch (err) {
      console.error('Error sending friend request:', err);
      setError(err.message || 'Failed to send friend request');
    }
  };

  const handleAcceptRequest = async (friendshipId) => {
    try {
      await friendshipService.acceptFriendRequest(friendshipId, user.uid);
      loadData();
    } catch (err) {
      console.error('Error accepting friend request:', err);
      setError(err.message || 'Failed to accept friend request');
    }
  };

  const handleDeclineRequest = async (friendshipId) => {
    try {
      await friendshipService.declineFriendRequest(friendshipId);
      loadData();
    } catch (err) {
      console.error('Error declining friend request:', err);
      setError(err.message || 'Failed to decline friend request');
    }
  };

  const handleUnfriend = async (friendId) => {
    if (!window.confirm('Are you sure you want to remove this friend?')) return;

    try {
      await friendshipService.unfriend(user.uid, friendId);
      loadData();
    } catch (err) {
      console.error('Error unfriending user:', err);
      setError(err.message || 'Failed to remove friend');
    }
  };

  const handleUnblock = async (blockedId) => {
    try {
      await friendshipService.unblockUser(user.uid, blockedId);
      loadData();
    } catch (err) {
      console.error('Error unblocking user:', err);
      setError(err.message || 'Failed to unblock user');
    }
  };

  const handleViewProfile = (userId) => {
    setSelectedUserId(userId);
  };

  const handleCloseProfileModal = () => {
    setSelectedUserId(null);
    loadData(); // Reload in case friendship status changed
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="friends-modal" onClick={(e) => e.stopPropagation()}>
          <div className="friends-modal-header">
            <h2>Friends List</h2>
            <button className="close-btn" onClick={onClose}>&times;</button>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="friends-search">
            <input
              type="text"
              placeholder="Search by username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} disabled={searching}>
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="search-results">
              <h3>Search Results</h3>
              {searchResults.map(result => (
                <div key={result.id} className="user-item">
                  <div className="user-info" onClick={() => handleViewProfile(result.id)}>
                    <img
                      src={result.profilePictureURL || '/logo192.png'}
                      alt={result.username}
                      className="user-avatar"
                    />
                    <span className="user-name clickable-username">{result.username}</span>
                  </div>
                  <button
                    className="add-friend-btn"
                    onClick={() => handleAddFriend(result.id)}
                  >
                    Add Friend
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="friends-tabs">
            <button
              className={activeTab === 'friends' ? 'active' : ''}
              onClick={() => setActiveTab('friends')}
            >
              Friends {friends.length > 0 && `(${friends.length})`}
            </button>
            <button
              className={activeTab === 'pending' ? 'active' : ''}
              onClick={() => setActiveTab('pending')}
            >
              Pending {pendingRequests.length > 0 && `(${pendingRequests.length})`}
            </button>
            <button
              className={activeTab === 'blocked' ? 'active' : ''}
              onClick={() => setActiveTab('blocked')}
            >
              Blocked {blockedUsers.length > 0 && `(${blockedUsers.length})`}
            </button>
          </div>

          <div className="friends-content">
            {loading ? (
              <div className="loading">Loading...</div>
            ) : (
              <>
                {activeTab === 'friends' && (
                  <div className="friends-list">
                    {friends.length === 0 ? (
                      <p className="empty-message">No friends yet. Search for users to add!</p>
                    ) : (
                      friends.map(friend => {
                        const status = userStatuses[friend.id] || 'offline';
                        return (
                          <div key={friend.id} className="user-item">
                            <div className="user-info" onClick={() => handleViewProfile(friend.id)}>
                              <div className="avatar-wrapper">
                                <img
                                  src={friend.profilePictureURL || '/logo192.png'}
                                  alt={friend.username}
                                  className="user-avatar"
                                />
                                <span className={`status-indicator ${status}`}></span>
                              </div>
                              <span className="user-name clickable-username">{friend.username}</span>
                            </div>
                            <button
                              className="unfriend-btn"
                              onClick={() => handleUnfriend(friend.id)}
                            >
                              Remove
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {activeTab === 'pending' && (
                  <div className="pending-list">
                    {pendingRequests.length === 0 && sentRequests.length === 0 ? (
                      <p className="empty-message">No pending requests</p>
                    ) : (
                      <>
                        {pendingRequests.length > 0 && (
                          <div className="pending-section">
                            <h3>Received Requests</h3>
                            {pendingRequests.map(request => (
                              <div key={request.id} className="user-item">
                                <div className="user-info" onClick={() => handleViewProfile(request.from.id)}>
                                  <img
                                    src={request.from.profilePictureURL || '/logo192.png'}
                                    alt={request.from.username}
                                    className="user-avatar"
                                  />
                                  <span className="user-name clickable-username">{request.from.username}</span>
                                </div>
                                <div className="request-actions">
                                  <button
                                    className="accept-btn"
                                    onClick={() => handleAcceptRequest(request.id)}
                                  >
                                    Accept
                                  </button>
                                  <button
                                    className="decline-btn"
                                    onClick={() => handleDeclineRequest(request.id)}
                                  >
                                    Decline
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {sentRequests.length > 0 && (
                          <div className="pending-section">
                            <h3>Sent Requests</h3>
                            {sentRequests.map(request => (
                              <div key={request.id} className="user-item">
                                <div className="user-info" onClick={() => handleViewProfile(request.to.id)}>
                                  <img
                                    src={request.to.profilePictureURL || '/logo192.png'}
                                    alt={request.to.username}
                                    className="user-avatar"
                                  />
                                  <span className="user-name clickable-username">{request.to.username}</span>
                                </div>
                                <span className="pending-label">Pending...</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {activeTab === 'blocked' && (
                  <div className="blocked-list">
                    {blockedUsers.length === 0 ? (
                      <p className="empty-message">No blocked users</p>
                    ) : (
                      blockedUsers.map(blocked => (
                        <div key={blocked.id} className="user-item">
                          <div className="user-info" onClick={() => handleViewProfile(blocked.id)}>
                            <img
                              src={blocked.profilePictureURL || '/logo192.png'}
                              alt={blocked.username}
                              className="user-avatar"
                            />
                            <span className="user-name clickable-username">{blocked.username}</span>
                          </div>
                          <button
                            className="unblock-btn"
                            onClick={() => handleUnblock(blocked.id)}
                          >
                            Unblock
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          onClose={handleCloseProfileModal}
        />
      )}
    </>
  );
}
