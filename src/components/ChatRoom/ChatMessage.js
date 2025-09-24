import React from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { ref as databaseRef, onValue } from 'firebase/database';
import { useFirebase } from '../../services/FirebaseContext';

function ChatMessage(props) {
    const { firestore, auth, rtdb } = useFirebase();
    const { text, uid, photoURL, reactions = {}, id, createdAt, imageURL, type, displayName, replyTo } = props.message;
    const { searchTerm, getDisplayName, onReply, isReplyTarget } = props;
    const [userOnline, setUserOnline] = React.useState(false);
    const [showFullImage, setShowFullImage] = React.useState(false);

    const messageId = id || props.message.documentId || props.message._id || `temp_${uid}_${createdAt?.seconds || Date.now()}`;

    if (!id && !props.message.documentId && !props.message._id) {
        console.log('📨 ChatMessage missing ID - Message:', props.message);
        console.log('📨 Available props:', Object.keys(props.message));
    }

    const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';
    const userName = getDisplayName ? getDisplayName(uid, displayName) : (displayName || 'Anonymous');
    const defaultAvatar = `https://ui-avatars.com/api/?name=${userName}&background=0d8abc&color=fff&size=40`;

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

    const highlightText = (text, searchTerm) => {
        if (!searchTerm || !text) return text;
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        const parts = text.split(regex);
        return parts.map((part, index) => 
            regex.test(part) ? <mark key={index} className="search-highlight">{part}</mark> : part
        );
    };

    React.useEffect(() => {
        if (uid) {
            const userPresenceRef = databaseRef(rtdb, `presence/${uid}`);
            const unsubscribe = onValue(userPresenceRef, (snapshot) => {
                const data = snapshot.val();
                setUserOnline(data?.online || false);
            });
            return () => unsubscribe();
        }
    }, [uid, rtdb]);

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

    const reactionEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡'];

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
        <div className={`message ${messageClass} ${isReplyTarget ? 'reply-target' : ''}`} data-message-id={messageId}>
            <div className="avatar-container">
                <img 
                    src={photoURL || defaultAvatar} 
                    alt="User avatar"
                    onError={(e) => { e.target.src = defaultAvatar; }}
                />
                <div className={`status-indicator ${userOnline ? 'online' : 'offline'}`}></div>
            </div>
            <div className="message-content">
                <div className="message-header">
                    <div className="message-username">{userName}</div>
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
                                alt="Shared content" 
                                onClick={() => setShowFullImage(true)}
                            />
                        </div>
                        
                        {showFullImage && (
                            <div className="image-modal" onClick={() => setShowFullImage(false)}>
                                <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
                                    <img src={imageURL} alt="Full size view" />
                                    <button 
                                        className="image-modal-close"
                                        onClick={() => setShowFullImage(false)}
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
