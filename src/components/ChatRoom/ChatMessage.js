import React from 'react';
import { createPortal } from 'react-dom';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import './ChatMessage.css';
import { useFirebase } from '../../services/FirebaseContext';
import { getFallbackAvatar } from '../../utils/avatar';
import { usePresence } from '../../services/PresenceContext';

function ChatMessage(props) {
    const { firestore, auth, rtdb } = useFirebase();
    const { text, uid, photoURL, reactions = {}, id, createdAt, imageURL, type, displayName, replyTo, editedAt, deleted } = props.message;
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
    const [menuOpen, setMenuOpen] = React.useState(false);
    const [isEditing, setIsEditing] = React.useState(false);
    const [editText, setEditText] = React.useState(text || '');
    const menuRef = React.useRef(null); // wrapper with trigger
    const menuPanelRef = React.useRef(null); // actual menu panel
    const [menuMode, setMenuMode] = React.useState('down'); // 'down' | 'up' | 'middle' | 'side'
    const [menuStyle, setMenuStyle] = React.useState({}); // { top,left }
    const [menuReady, setMenuReady] = React.useState(false); // avoid flash before positioned
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

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
        return date.toLocaleString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
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
    const quickMenuEmojis = React.useMemo(() => ['👍', '❤️', '😂', '😮'], []);

    const formatFullTimestamp = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString();
    };

    const startEditing = () => {
        setEditText(text || '');
        setIsEditing(true);
        setMenuOpen(false);
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setEditText(text || '');
    };

    const saveEdit = async () => {
        if (!messageId || !auth.currentUser || editText.trim() === '' || editText === text) {
            setIsEditing(false);
            return;
        }
        try {
            const messageRef = doc(firestore, 'messages', messageId);
            await updateDoc(messageRef, { text: editText.trim(), editedAt: serverTimestamp() });
        } catch (e) {
            console.error('❌ Error editing message:', e);
        } finally {
            setIsEditing(false);
        }
    };

    const handleDelete = async () => {
        if (!messageId || !auth.currentUser) return;
        try {
            const messageRef = doc(firestore, 'messages', messageId);
            await updateDoc(messageRef, {
                text: '-deleted-',
                deleted: true,
                imageURL: null,
                editedAt: serverTimestamp()
            });
        } catch (e) {
            console.error('❌ Error soft-deleting message:', e);
        } finally {
            setShowDeleteConfirm(false);
            setMenuOpen(false);
        }
    };

    const handleCopyText = async () => {
        if (text) {
            try { await navigator.clipboard.writeText(text); } catch (e) { console.error('❌ Clipboard copy failed:', e); }
            document.dispatchEvent(new CustomEvent('chat:prefill', { detail: { text } }));
        }
        setMenuOpen(false);
    };

    const handleAddReactionFull = () => {
        // Placeholder for future full emoji picker
        setMenuOpen(false);
    };

    // Toggle a body class so other messages suppress their hover reaction bars while any menu is open
    React.useEffect(() => {
        if (menuOpen) {
            document.body.classList.add('chat-menu-open');
        } else {
            // Only remove if no other menus are currently open (defensive)
            const stillOpen = document.querySelector('.message-menu.open');
            if (!stillOpen) document.body.classList.remove('chat-menu-open');
        }
        return () => {
            // Cleanup on unmount
            const stillOpen = document.querySelector('.message-menu.open');
            if (!stillOpen) document.body.classList.remove('chat-menu-open');
        };
    }, [menuOpen]);

    // Close menu on outside click / escape (robust & cleans up)
    React.useEffect(() => {
        if (!menuOpen) return;
        const onPointerDown = (e) => {
            if (showDeleteConfirm) return; // keep menu if confirmation displayed
            const wrap = menuRef.current;
            const panel = menuPanelRef.current;
            const insideTrigger = wrap && wrap.contains(e.target);
            const insidePanel = panel && panel.contains(e.target);
            if (insideTrigger || insidePanel) return; // clicks inside menu system
            setMenuOpen(false);
        };
        const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
        document.addEventListener('pointerdown', onPointerDown, true);
        document.addEventListener('keydown', onKey, true);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown, true);
            document.removeEventListener('keydown', onKey, true);
        };
    }, [menuOpen, showDeleteConfirm]);
    // Position menu fixed relative to viewport with up/down/middle mode
    const computeMenuPosition = React.useCallback(() => {
        if (!menuOpen) return;
        const wrapper = menuRef.current;
        const panel = menuPanelRef.current;
        if (!wrapper || !panel) return;
        const triggerBtn = wrapper.querySelector('.message-menu-trigger');
        const triggerRect = triggerBtn ? triggerBtn.getBoundingClientRect() : wrapper.getBoundingClientRect();
        const messageEl = wrapper.closest('.message');
        const messageRect = messageEl ? messageEl.getBoundingClientRect() : triggerRect;
        // Force reflow to ensure dimensions (offset* may be 0 on first frame)
        const panelHeight = panel.offsetHeight || panel.scrollHeight || 200;
        const panelWidth = panel.offsetWidth || 240;
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;

        // Try side placement first (to the right of the message block)
        const sideGap = 8;
        let sideLeft = messageRect.right + sideGap;
        const sideFits = (sideLeft + panelWidth + 8) <= viewportW; // 8px right gutter
        let mode = 'down';
        let top;
        if (sideFits) {
            mode = 'side';
            top = Math.min(Math.max(messageRect.top, 8), Math.max(8, viewportH - panelHeight - 8));
            setMenuMode(mode);
            setMenuStyle({ top: Math.round(top), left: Math.round(sideLeft) });
            setMenuReady(true);
            return;
        }

        // Fallback to vertical placement logic
        const spaceAbove = triggerRect.top;
        const spaceBelow = viewportH - triggerRect.bottom;
        const needed = panelHeight + 16;
        if (spaceBelow >= needed) mode = 'down'; else if (spaceAbove >= needed) mode = 'up'; else mode = 'middle';
        if (mode === 'down') top = triggerRect.bottom + 4; else if (mode === 'up') top = Math.max(8, triggerRect.top - panelHeight - 4); else top = Math.max(8, (viewportH - panelHeight) / 2);
        let left = triggerRect.right - panelWidth;
        left = Math.min(left, viewportW - panelWidth - 8);
        left = Math.max(8, left);
        setMenuMode(mode);
        setMenuStyle(prev => {
            const next = { top: Math.round(top), left: Math.round(left) };
            if (prev.top === next.top && prev.left === next.left) return prev;
            return next;
        });
        setMenuReady(true);
    }, [menuOpen]);

    // Fallback: if positioning somehow doesn't run, set a safe default after 120ms
    React.useEffect(() => {
        if (!menuOpen) return;
        const t = setTimeout(() => {
            setMenuReady(r => {
                if (!r) {
                    setMenuMode('down');
                    setMenuStyle(s => ({ top: s.top ?? 100, left: s.left ?? 100 }));
                    return true;
                }
                return r;
            });
        }, 120);
        return () => clearTimeout(t);
    }, [menuOpen]);

    // Ensure position after panel actually mounts (handles reopen case)
    React.useLayoutEffect(() => {
        if (!menuOpen) return;
        setMenuReady(false); // reset before measuring
        const raf = requestAnimationFrame(() => computeMenuPosition());
        return () => cancelAnimationFrame(raf);
    }, [menuOpen, computeMenuPosition]);

    React.useEffect(() => {
        if (!menuOpen) return;
        const raf = requestAnimationFrame(computeMenuPosition);
        window.addEventListener('resize', computeMenuPosition);
        window.addEventListener('scroll', computeMenuPosition, true);
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', computeMenuPosition);
            window.removeEventListener('scroll', computeMenuPosition, true);
        };
    }, [menuOpen, computeMenuPosition]);

    // Keyboard save / cancel
    const onEditKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            saveEdit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelEditing();
        }
    };

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
            <div className="avatar-container" role="button" tabIndex={0} title={`View ${userName}'s profile`} aria-label={`View ${userName}'s profile`} onClick={handleViewProfileClick} onKeyDown={(e)=>{ if(e.key==='Enter') handleViewProfileClick(); }}>
                <img
                    src={avatarSrc}
                    alt={userName ? `${userName}'s avatar` : 'User avatar'}
                    loading="lazy"
                    decoding="async"
                    className="message-avatar"
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
                
                {deleted && (
                    <p className="deleted-message" aria-label="Message deleted">This message was deleted.</p>
                )}
                {!deleted && (
                    <>
                        {isEditing ? (
                            <div className="edit-container">
                                <textarea
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    onKeyDown={onEditKeyDown}
                                    aria-label="Edit message text"
                                    autoFocus
                                />
                                <div className="edit-actions">
                                    <button onClick={saveEdit} aria-label="Save edit" className="save-edit-btn">Save</button>
                                    <button onClick={cancelEditing} aria-label="Cancel edit" className="cancel-edit-btn">Cancel</button>
                                </div>
                            </div>
                        ) : (
                            text && (
                                <p>
                                    {highlightText(text, searchTerm)}{' '}
                                    {editedAt && (
                                        <sub className="edited-label" title={`Edited ${formatFullTimestamp(editedAt)}`}> (edited)</sub>
                                    )}
                                </p>
                            )
                        )}
                    </>
                )}
                
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
                
                <div className={`reaction-buttons ${menuOpen ? 'force-visible' : ''}`}>
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
                            className="reply-btn quote-reply-btn"
                            onClick={() => onReply(props.message)}
                            title="Reply (quote message)"
                            aria-label="Reply to this message"
                        >
                            ❝
                        </button>
                    )}
                    {!deleted && (
                        <div className="message-menu-wrapper" ref={menuRef}>
                            <button
                                className="reply-btn message-menu-trigger"
                                aria-haspopup="true"
                                aria-expanded={menuOpen}
                                onClick={() => setMenuOpen(o => !o)}
                                title="Message options"
                            >
                                …
                            </button>
                            {menuOpen && createPortal(
                                <div
                                    ref={menuPanelRef}
                                    className={`message-menu open mode-${menuMode} ${menuReady ? 'ready' : 'measuring'}`}
                                    role="menu"
                                    aria-label="Message options"
                                    onMouseDown={(e)=>e.stopPropagation()}
                                    style={menuStyle}
                                >
                                    <div className="menu-reactions-row" role="group" aria-label="Quick reactions">
                                        {quickMenuEmojis.map(r => (
                                            <button
                                              key={r}
                                              className="menu-reaction-btn"
                                              onClick={() => { addReaction(r); /* keep menu open for multi-react? choose close */ setMenuOpen(false); }}
                                              title={`React ${r}`}
                                              aria-label={`React with ${r}`}
                                            >{r}</button>
                                        ))}
                                    </div>
                                    <div className="menu-divider" />
                                    <button role="menuitem" className="menu-item" onClick={handleAddReactionFull}>Add Reaction<span className="menu-item-icon" aria-hidden>+</span></button>
                                    {onReply && <button role="menuitem" className="menu-item" onClick={() => { onReply(props.message); setMenuOpen(false); }}>Reply<span className="menu-item-icon" aria-hidden>↩</span></button>}
                                    <button role="menuitem" className="menu-item" onClick={handleCopyText} disabled={!text}>Copy Text<span className="menu-item-icon" aria-hidden>⧉</span></button>
                                    {uid === auth.currentUser?.uid && type !== 'image' && (
                                        <button role="menuitem" onClick={startEditing} className="menu-item">Edit<span className="menu-item-icon" aria-hidden>✎</span></button>
                                    )}
                                    {uid === auth.currentUser?.uid && (
                                        <button role="menuitem" onClick={() => setShowDeleteConfirm(true)} className="menu-item delete-item">Delete<span className="menu-item-icon" aria-hidden>⌫</span></button>
                                    )}
                                </div>, document.body)
                            }
                        </div>
                    )}
                </div>
            </div>
            {showDeleteConfirm && (
                <div className="delete-modal-overlay" role="dialog" aria-modal="true" aria-label="Confirm delete" onMouseDown={(e)=>{ e.stopPropagation(); }} onClick={(e)=>{ e.stopPropagation(); }}>
                    <div className="delete-modal" onMouseDown={(e)=>e.stopPropagation()} onClick={(e)=>e.stopPropagation()}>
                        <h4>Delete message?</h4>
                        <p className="no-bg">This action cannot be undone.</p>
                        <div className="delete-modal-actions">
                            <button className="danger" onClick={handleDelete} autoFocus>Delete</button>
                            <button onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                        </div>
                    </div>
                    {/* Clicking outside modal (overlay background) closes only the delete modal */}
                    <div className="delete-modal-backdrop-click-capture" onMouseDown={(e)=>{ e.stopPropagation(); setShowDeleteConfirm(false); }} />
                </div>
            )}
        </div>
    )
}

export default ChatMessage;
