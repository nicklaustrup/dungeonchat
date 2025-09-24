import React from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useFirebase } from '../../services/FirebaseContext';
import { getFallbackAvatar } from '../../utils/avatar';
import { usePresence } from '../../services/PresenceContext';

function ChatMessage(props) {
    const { firestore, auth, rtdb } = useFirebase();
    const { text, uid, photoURL, reactions = {}, id, createdAt, imageURL, type, displayName, replyTo } = props.message;
    const { searchTerm, getDisplayName, onReply, isReplyTarget, onViewProfile } = props;
    const presence = usePresence(uid);
    const isTyping = !!presence.typing;
    const presenceState = isTyping ? 'online' : presence.state; // typing overrides away state label visually
    const presenceTitle = (() => {
        const labelMap = { online: 'Online', away: 'Away', offline: 'Offline' };
        const label = labelMap[presenceState] || 'Offline';
        const ts = presence.lastSeen;
        if (!ts) return label;
        const diff = Date.now() - ts;
        const mins = Math.floor(diff/60000);
        let rel;
        if (mins < 1) rel = 'just now'; else if (mins < 60) rel = `${mins}m ago`; else { const h=Math.floor(mins/60); if (h<24) rel = `${h}h ago`; else rel = `${Math.floor(h/24)}d ago`; }
        if (isTyping) return `Typing… (was ${label}, last active ${rel})`;
        return `${label} (last active ${rel})`;
    })();
    const [showFullImage, setShowFullImage] = React.useState(false);

    const messageId = id || props.message.documentId || props.message._id || `temp_${uid}_${createdAt?.seconds || Date.now()}`;

    if (!id && !props.message.documentId && !props.message._id) {
        console.log('📨 ChatMessage missing ID - Message:', props.message);
        console.log('📨 Available props:', Object.keys(props.message));
    }

    const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';
    const userName = getDisplayName ? getDisplayName(uid, displayName) : (displayName || 'Anonymous');
    const fallbackAvatar = React.useMemo(() => getFallbackAvatar({ uid, displayName: userName, size: 40 }), [uid, userName]);
    const avatarSrc = photoURL || fallbackAvatar;

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    };

    const handleViewProfileClick = async () => {
        if (onViewProfile) {
            // Construct a basic user object from the message
            let profileUser = {
                uid,
                displayName: userName,
                photoURL: photoURL || fallbackAvatar,
                // email is not available on the message object by default
            };

            // If we are viewing our own profile, we can add the email from the auth object
            if (uid === auth.currentUser?.uid) {
                profileUser.email = auth.currentUser.email;
            } else {
                // For other users, we can try to fetch more info if we store it somewhere,
                // for example, in a 'users' collection. For now, we'll just use what we have.
                // This is a good place for a future enhancement.
            }
            
            onViewProfile(profileUser);
        }
    };

    const highlightText = React.useCallback((raw, term) => {
        if (!term || !raw) return raw;
        // Escape regex special chars in term
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, 'gi');
        const parts = raw.split(regex);
        return parts.map((part, i) => (regex.test(part) ? <mark key={i} className="search-highlight">{part}</mark> : part));
    }, []);

    // Presence handled by shared hook to prevent duplicate listeners

    const addReaction = async (emoji) => {
        if (!messageId || !auth.currentUser) return;
        
        const messageRef = doc(firestore, 'messages', messageId);
        const currentReactions = { ...reactions };
        
        if (!currentReactions[emoji]) {
            currentReactions[emoji] = [];
        } else if (typeof currentReactions[emoji] === 'number') {
            currentReactions[emoji] = [];
        }
        
        const userIndex = currentReactions[emoji].indexOf(auth.currentUser.uid);
        
        if (userIndex > -1) {
            currentReactions[emoji].splice(userIndex, 1);
            if (currentReactions[emoji].length === 0) {
                delete currentReactions[emoji];
            }
        } else {
            currentReactions[emoji].push(auth.currentUser.uid);
        }
        
        try {
            await updateDoc(messageRef, { reactions: currentReactions });
        } catch (error) {
            console.error('❌ Error updating reactions:', error);
        }
    };

    const reactionEmojis = React.useMemo(() => ['👍', '❤️', '😂', '😮', '😢', '😡'], []);

    const handleNavigateToRepliedMessage = () => {
        if (!replyTo?.id) return;
        const selector = `[data-message-id="${replyTo.id}"]`;
        const targetEl = document.querySelector(selector);
        if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Only remove highlight if we added it temporarily (i.e. it was not already highlighted due to active reply selection)
            let addedTemp = false;
            if (!targetEl.classList.contains('reply-target')) {
                targetEl.classList.add('reply-target');
                addedTemp = true;
            }
            if (addedTemp) {
                setTimeout(() => {
                    // Ensure we only remove if we were the ones who added it
                    if (targetEl.classList.contains('reply-target')) {
                        targetEl.classList.remove('reply-target');
                    }
                }, 3000);
            }
        }
    };

    return (
        <div
            className={`message ${messageClass} ${isReplyTarget ? 'reply-target' : ''}`}
            data-message-id={messageId}
            role="article"
            aria-label={`Message from ${userName}${isReplyTarget ? ' (reply target)' : ''}`}
        >
            <div className="avatar-container">
                <img
                    src={avatarSrc}
                    alt={userName ? `${userName}'s avatar` : 'User avatar'}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                        if (e.target.dataset.fallbackApplied === 'true') return;
                        e.target.src = fallbackAvatar;
                        e.target.dataset.fallbackApplied = 'true';
                    }}
                />
                <div className={`status-indicator ${presenceState}`} title={presenceTitle} aria-label={presenceTitle}></div>
            </div>
            <div className="message-content">
                <div className="message-header">
                    <div
                        className="message-username"
                        onClick={handleViewProfileClick}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleViewProfileClick(); }}
                        style={{cursor: 'pointer'}}
                        title={`View ${userName}'s profile`}
                        role="button"
                        tabIndex={0}
                        aria-label={`View profile for ${userName}`}
                    >{userName}</div>
                    <div className="message-timestamp">{formatTimestamp(createdAt)}</div>
                </div>
                
                {replyTo && (
                    <div 
                        className="reply-indicator" 
                        onClick={handleNavigateToRepliedMessage}
                        style={{ cursor: replyTo.id ? 'pointer' : 'default' }}
                        aria-label="Jump to replied message"
                        title="Jump to replied message"
                    >
                        <span className="reply-icon">↳</span>
                        <span className="reply-text">
                            Replying to: {replyTo.text ? replyTo.text.substring(0, 50) + (replyTo.text.length > 50 ? '...' : '') : (replyTo.type === 'image' ? 'an image' : 'original message')}
                        </span>
                    </div>
                )}
                
                {type === 'image' && imageURL && (
                    <>
                        <div className="message-image">
                            <img
                                src={imageURL}
                                alt="Shared image"
                                onClick={() => setShowFullImage(true)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === 'Enter') setShowFullImage(true); }}
                                aria-label="Open image in modal"
                                loading="lazy"
                                decoding="async"
                            />
                        </div>
                        
                        {showFullImage && (
                            <div className="image-modal" onClick={() => setShowFullImage(false)} role="dialog" aria-modal="true" aria-label="Image preview">
                                <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
                                    <img src={imageURL} alt="Full size view" />
                                    <button 
                                        className="image-modal-close"
                                        onClick={() => setShowFullImage(false)}
                                        aria-label="Close image preview"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
                
                {text && <p>{highlightText(text, searchTerm)}</p>}
                
                {Object.keys(reactions).length > 0 && (
                    <div className="message-reactions">
                        {Object.entries(reactions).map(([emoji, userIds]) => {
                            const isArray = Array.isArray(userIds);
                            const count = isArray ? userIds.length : (typeof userIds === 'number' ? userIds : 0);
                            const hasUserReacted = isArray ? userIds.includes(auth.currentUser?.uid) : false;
                            
                            return (
                                <span
                                    key={emoji}
                                    className={`reaction ${hasUserReacted ? 'reacted' : ''}`}
                                    onClick={() => addReaction(emoji)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') addReaction(emoji); }}
                                    role="button"
                                    tabIndex={0}
                                    aria-pressed={hasUserReacted}
                                    aria-label={`${emoji} reaction, ${count} user${count !== 1 ? 's' : ''}. ${hasUserReacted ? 'You reacted.' : 'Activate to toggle your reaction.'}`}
                                    title={`${count} reaction${count !== 1 ? 's' : ''}`}
                                >
                                    {emoji} {count}
                                </span>
                            );
                        })}
                    </div>
                )}
                
                <div className="reaction-buttons">
                    {reactionEmojis.map(emoji => (
                        <button
                            key={emoji}
                            className="reaction-btn"
                            onClick={() => addReaction(emoji)}
                            title={`React with ${emoji}`}
                            aria-label={`React to message with ${emoji}`}
                        >
                            {emoji}
                        </button>
                    ))}
                    {onReply && (
                        <button 
                            className="reply-btn" 
                            onClick={() => onReply(props.message)}
                            title="Reply to this message"
                        >
                            ↩️
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ChatMessage;
