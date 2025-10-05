import React, { useState, useEffect } from 'react';
import './UserProfileModal.css';
import { getFallbackAvatar } from '../../utils/avatar';
import { usePresence, usePresenceMeta } from '../../services/PresenceContext';
import { useFirebase } from '../../services/FirebaseContext';
import { useCachedUserProfileData } from '../../services/cache';
import friendshipService from '../../services/friendshipService';

function UserProfileModal({ user, userId, isOpen, onClose }) {
    const { user: currentUser } = useFirebase();
    const [friendshipStatus, setFriendshipStatus] = useState('none');
    const [error, setError] = useState('');

    // Determine which user ID to use
    const targetUserId = userId || user?.uid;

    // Hooks must run unconditionally
    const presence = usePresence(targetUserId);
    const { awayAfterSeconds } = usePresenceMeta();

    // Use cached profile data for better performance
    const { profileData, loading } = useCachedUserProfileData(targetUserId);

    // Load friendship status
    useEffect(() => {
        async function loadFriendshipStatus() {
            if (!currentUser || !targetUserId || targetUserId === currentUser.uid) {
                return;
            }

            try {
                const status = await friendshipService.getFriendshipStatus(currentUser.uid, targetUserId);
                setFriendshipStatus(status);
            } catch (err) {
                console.error('Error loading friendship status:', err);
            }
        }

        if (isOpen) {
            loadFriendshipStatus();
        }
    }, [targetUserId, currentUser, isOpen]);

    const handleAddFriend = async () => {
        try {
            await friendshipService.sendFriendRequest(currentUser.uid, targetUserId);
            setFriendshipStatus('pending_sent');
        } catch (err) {
            console.error('Error sending friend request:', err);
            setError(err.message || 'Failed to send friend request');
        }
    };

    const handleBlock = async () => {
        if (!window.confirm('Are you sure you want to block this user?')) return;

        try {
            await friendshipService.blockUser(currentUser.uid, targetUserId);
            setFriendshipStatus('blocked');
        } catch (err) {
            console.error('Error blocking user:', err);
            setError(err.message || 'Failed to block user');
        }
    };

    const handleUnblock = async () => {
        try {
            await friendshipService.unblockUser(currentUser.uid, targetUserId);
            setFriendshipStatus('none');
        } catch (err) {
            console.error('Error unblocking user:', err);
            setError(err.message || 'Failed to unblock user');
        }
    };

    if (!isOpen || (!user && !userId)) {
        return null;
    }

    // Use either provided user object or loaded profile data
    // profileData from cache has the actual data, no need for id field
    const displayUser = user || (profileData ? { ...profileData, id: targetUserId, uid: targetUserId } : null);
    if (!displayUser && !loading) {
        return null;
    }

    const fallbackAvatar = displayUser ? getFallbackAvatar({ uid: displayUser.id || displayUser.uid, displayName: displayUser.username || displayUser.displayName, size: 128 }) : '';
    const avatarSrc = displayUser?.profilePictureURL || displayUser?.photoURL || fallbackAvatar;

    const formatLastActive = (ts) => {
        if (!ts) return 'Unknown';
        const diff = Date.now() - ts;
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const presenceLabel = {
        online: 'Online',
        away: 'Away',
        offline: 'Offline'
    }[presence.state] || 'Offline';

    const displayName = displayUser?.username || displayUser?.displayName || 'Anonymous User';
    const isOwnProfile = currentUser && targetUserId === currentUser.uid;

    return (
        <div className="settings-modal-overlay" onClick={onClose}>
            <div className="user-profile-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>✕</button>

                {/* Add Friend button in top right (below close button) */}
                {!loading && !isOwnProfile && (
                    <div className="profile-top-right-actions">
                        {friendshipStatus === 'none' && (
                            <button className="profile-action-btn add-friend-top" onClick={handleAddFriend}>
                                Add Friend
                            </button>
                        )}
                        {friendshipStatus === 'pending_sent' && (
                            <button className="profile-action-btn pending-top" disabled>
                                Request Pending
                            </button>
                        )}
                        {friendshipStatus === 'pending_received' && (
                            <span className="profile-action-note-top">
                                Request received
                            </span>
                        )}
                        {friendshipStatus === 'friends' && (
                            <span className="profile-action-note-top friends-badge">
                                ✓ Friends
                            </span>
                        )}
                    </div>
                )}

                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
                ) : (
                    <>
                        <div className="profile-header">
                            <img
                                src={avatarSrc}
                                alt={displayName}
                                className="profile-avatar"
                                loading="lazy"
                                decoding="async"
                                onError={(e) => {
                                    if (e.target.dataset.fallbackApplied === 'true') return;
                                    e.target.src = fallbackAvatar;
                                    e.target.dataset.fallbackApplied = 'true';
                                }}
                            />
                            <div className="profile-names">
                                <h2 className="profile-displayName">{displayName}</h2>
                                {displayUser?.email && !isOwnProfile && <p className="profile-email">{displayUser.email}</p>}
                                {displayUser?.bio && <p className="profile-bio">{displayUser.bio}</p>}
                            </div>
                        </div>

                        {error && <div className="profile-error">{error}</div>}

                        <div className="profile-body">
                            <p><strong>Status:</strong> {presenceLabel}</p>
                            <p><strong>Last Active:</strong> {formatLastActive(presence.lastSeen)}</p>
                            <p style={{fontSize:'12px', opacity:0.7}}>Away after {Math.round(awayAfterSeconds/60)} min of inactivity.</p>
                        </div>

                        {/* Block button at the bottom */}
                        {!isOwnProfile && (
                            <div className="profile-bottom-actions">
                                {friendshipStatus === 'blocked' ? (
                                    <button className="profile-action-btn unblock-bottom" onClick={handleUnblock}>
                                        Unblock
                                    </button>
                                ) : (
                                    <button className="profile-action-btn block-bottom" onClick={handleBlock}>
                                        Block User
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default UserProfileModal;
