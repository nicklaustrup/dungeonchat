import React from 'react';
import './UserProfileModal.css';
import { getFallbackAvatar } from '../../utils/avatar';
import { usePresence, usePresenceMeta } from '../../services/PresenceContext';

function UserProfileModal({ user, isOpen, onClose }) {
    // Hooks must run unconditionally
    const presence = usePresence(user?.uid);
    const { awayAfterSeconds } = usePresenceMeta();

    if (!isOpen || !user) {
        return null;
    }

    const fallbackAvatar = getFallbackAvatar({ uid: user.uid, displayName: user.displayName, size: 128 });
    const avatarSrc = user.photoURL || fallbackAvatar;

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

    return (
        <div className="settings-modal-overlay" onClick={onClose}>
            <div className="user-profile-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>✕</button>
                <div className="profile-header">
                                        <img
                                                src={avatarSrc}
                                                alt={user.displayName || 'User'}
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
                        <h2 className="profile-displayName">{user.displayName || 'Anonymous User'}</h2>
                        {user.email && <p className="profile-email">{user.email}</p>}
                    </div>
                </div>
                <div className="profile-body">
                    <p><strong>Status:</strong> {presenceLabel}</p>
                    <p><strong>Last Active:</strong> {formatLastActive(presence.lastSeen)}</p>
                    <p style={{fontSize:'12px', opacity:0.7}}>Away after {Math.round(awayAfterSeconds/60)} min of inactivity.</p>
                </div>
            </div>
        </div>
    );
}

export default UserProfileModal;
