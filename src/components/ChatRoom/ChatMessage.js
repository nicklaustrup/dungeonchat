import React from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import './ChatMessage.css';
import './ChatMessage.menu.css';
import './ChatMessage.reactions.css';
import './ChatMessage.modals.css';
import './ChatMessage.tooltips.css';
import { useFirebase } from '../../services/FirebaseContext';
import { getFallbackAvatar } from '../../utils/avatar';
import { usePresence } from '../../services/PresenceContext';
import EmojiMenu from '../../components/ChatInput/EmojiMenu';
import { formatTimestamp, formatTimeOnly, formatFullTimestamp, buildMessageId, relativeLastActive } from '../../utils/messageFormatting';
import { processMessageText } from '../../utils/linkify';
import { useProfanityFilter } from '../../utils/profanityFilter';
import { useProfanityFilterContext } from '../../contexts/ProfanityFilterContext';
import AvatarWithPresence from './parts/AvatarWithPresence';
import InlineReplyContext from './parts/InlineReplyContext';
import ReactionList from './parts/ReactionList';
import ReactionBar from './parts/ReactionBar';
import MessageOptionsMenu from './parts/MessageOptionsMenu';
import EditMessageForm from './parts/EditMessageForm';
import DeleteConfirmModal from './parts/DeleteConfirmModal';
import ImagePreviewModal from './parts/ImagePreviewModal';
import MessageHeader from './parts/MessageHeader';
import HoverTimestamp from './parts/HoverTimestamp';
import { useReactions } from '../../hooks/useReactions';
import { useMessageMenuPosition } from '../../hooks/useMessageMenuPosition';
import { useUserProfileData } from '../../hooks/useUserProfileData';
import { useUserProfile } from '../../hooks/useUserProfile';

function ChatMessage(props) {
    const { firestore, auth } = useFirebase();
    const { text, uid, photoURL, reactions = {}, id, createdAt, imageURL, type, displayName, replyTo, editedAt, deleted } = props.message;
    const { searchTerm, onReply, isReplyTarget, onViewProfile, showMeta = true } = props;
    
    // Get enhanced profile data for this user
    const { profileData } = useUserProfileData(uid);
    
    // For the current user, we should use the profile from the global context
    // For other users, we use the fetched profile data
    const { profile: currentUserProfile } = useUserProfile();
    const { user: currentUser } = useFirebase();
    
    const effectiveProfileData = uid === currentUser?.uid ? currentUserProfile : profileData;
    
    // Debug: Log profile data to trace avatar issue
    if (uid === currentUser?.uid) {
        console.log('🔍 ChatMessage Debug (CURRENT USER) - User:', uid);
        console.log('🔍 Current User Profile:', currentUserProfile);
        console.log('🔍 Profile Picture URL:', currentUserProfile?.profilePictureURL);
    } else {
        console.log('🔍 ChatMessage Debug (OTHER USER) - User:', uid);
        console.log('🔍 Fetched Profile Data:', profileData);
        console.log('🔍 Profile Picture URL:', profileData?.profilePictureURL);
    }
    console.log('🔍 Effective Profile Data:', effectiveProfileData);
    console.log('🔍 Original photoURL from message:', photoURL);
    
    // Get user's profanity filter preference from context (will re-render when changed)
    const { profanityFilterEnabled } = useProfanityFilterContext();
    
    // Apply profanity filtering based on user preference
    const displayText = useProfanityFilter(text, profanityFilterEnabled);
    
    const presence = usePresence(uid);
    const isTyping = !!presence.typing;
    const presenceState = isTyping ? 'online' : presence.state; // typing overrides away state label visually
    const presenceTitle = (() => {
        const labelMap = { online: 'Online', away: 'Away', offline: 'Offline' };
        const label = labelMap[presenceState] || 'Offline';
        const rel = relativeLastActive(presence.lastSeen);
        if (!rel) return label;
        if (isTyping) return `Typing… (was ${label}, last active ${rel})`;
        return `${label} (last active ${rel})`;
    })();
    const [showFullImage, setShowFullImage] = React.useState(false);
    const [menuOpen, setMenuOpen] = React.useState(false);
    const [isEditing, setIsEditing] = React.useState(false);
    const [editText, setEditText] = React.useState(text || '');
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
    const { menuRef, menuPanelRef, menuMode, menuStyle, menuReady } = useMessageMenuPosition({ menuOpen, onClose: () => setMenuOpen(false), showDeleteConfirm });

    const messageId = buildMessageId(props.message);

    if (!id && !props.message.documentId && !props.message._id) {
        console.log('📨 ChatMessage missing ID - Message:', props.message);
        console.log('📨 Available props:', Object.keys(props.message));
    }

    const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';
    
    // Implement name priority: displayName (highest) > username (medium) > auth displayName (lowest)
    const getDisplayNameWithPriority = () => {
        // Highest priority: Custom display name from profile
        if (effectiveProfileData?.displayName) {
            return effectiveProfileData.displayName;
        }
        // Medium priority: Username from profile
        if (effectiveProfileData?.username) {
            return effectiveProfileData.username;
        }
        // Lowest priority: Original auth display name from message
        return displayName || 'Anonymous';
    };
    
    const userName = getDisplayNameWithPriority();
    
    // Use profile picture from profile data if available, otherwise fallback
    const userPhotoURL = effectiveProfileData?.profilePictureURL || photoURL;
    
    // Debug: Focus on the avatar issue
    if (effectiveProfileData && effectiveProfileData.profilePictureURL) {
        console.log('✅ Profile has picture URL:', effectiveProfileData.profilePictureURL);
    } else if (effectiveProfileData && !effectiveProfileData.profilePictureURL) {
        console.log('❌ Profile exists but no profilePictureURL. Profile:', effectiveProfileData);
    } else {
        console.log('❌ No profile data at all for user:', uid);
    }
    console.log('🔍 Final userPhotoURL:', userPhotoURL);
    
    const fallbackAvatar = React.useMemo(() => getFallbackAvatar({ uid, displayName: userName, size: 40 }), [uid, userName]);

    // formatting now handled by utils/messageFormatting.js

    const handleViewProfileClick = async () => {
        if (onViewProfile) {
            // Construct a basic user object from the message
            let profileUser = {
                uid,
                displayName: userName,
                photoURL: userPhotoURL || fallbackAvatar,
                // Add enhanced profile data if available
                username: effectiveProfileData?.username,
                bio: effectiveProfileData?.bio,
                statusMessage: effectiveProfileData?.statusMessage,
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

    // highlightText imported as a pure utility

    // Presence handled by shared hook to prevent duplicate listeners

    const { reactions: reactionsState, toggleReaction } = useReactions({ firestore, auth, messageId, initialReactions: reactions });
    const addReaction = (emoji) => toggleReaction(emoji);

    // Reduced reaction set per new design (only thumbs up, heart, laugh)
    const reactionEmojis = React.useMemo(() => ['👍', '❤️', '😂'], []);
    const quickMenuEmojis = React.useMemo(() => ['👍', '❤️', '😂'], []);

    // full timestamp handled by util

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

    const handleAddReactionFull = (e) => {
        const target = e?.currentTarget;
        let anchorRect = null;
        if (target) anchorRect = target.getBoundingClientRect();
        EmojiMenu.open({
            anchorRect,
            onSelect: (emojiData) => {
                if (emojiData?.emoji) addReaction(emojiData.emoji);
            }
        });
        // keep menu open? optional: currently we close for clarity
        setMenuOpen(false);
    };

    // (Menu positioning & lifecycle handled by useMessageMenuPosition hook)

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

    // (Removed unused handleNavigateToRepliedMessage; reply navigation handled inline where used.)

    const rootClasses = [
        'message',
        messageClass,
        isReplyTarget ? 'reply-target' : '',
        replyTo ? 'has-inline-reply' : '',
        showMeta ? 'with-meta' : 'no-meta'
    ].filter(Boolean).join(' ');

    // Specialized compact rendering for consecutive grouped (no-meta) messages
    const { selected, onSelectMessage, hovered, onHoverMessage } = props;
    const isTouch = React.useMemo(() => matchMedia('(hover: none) and (pointer: coarse)').matches, []);
    const showActions = isTouch ? selected : hovered; // On touch show only if selected
    const handleSelect = () => {
        if (isTouch && onSelectMessage) onSelectMessage(messageId);
    };

    if (!showMeta) {
        const timeOnly = formatTimeOnly(createdAt);
        return (
            <div className={rootClasses} data-message-id={messageId} data-selected={selected ? 'true' : undefined} role="article" aria-label={`Message from ${userName}`} onClick={isTouch ? handleSelect : undefined} onMouseEnter={() => onHoverMessage && onHoverMessage(messageId)} onMouseLeave={() => onHoverMessage && onHoverMessage(null)}>
                <div className="time-col" aria-hidden="true">{timeOnly}</div>
                <div className="message-content">
                    {deleted ? (
                        <p className="deleted-message" aria-label="Message deleted">This message was deleted.</p>
                    ) : isEditing ? (
                        <EditMessageForm value={editText} onChange={setEditText} onSave={saveEdit} onCancel={cancelEditing} onKeyDown={onEditKeyDown} />
                    ) : type === 'image' && imageURL ? (
                        <>
                            <div className="message-image">
                                <img src={imageURL} alt="Shared content" onClick={() => setShowFullImage(true)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') setShowFullImage(true); }} aria-label="Open image in modal" loading="lazy" decoding="async" />
                            </div>
                            <ImagePreviewModal open={showFullImage} src={imageURL} onClose={() => setShowFullImage(false)} />
                        </>
                    ) : (
                        displayText && (
                            <p>
                                {processMessageText(displayText, searchTerm)}{' '}
                                {editedAt && (<sub className="edited-label" title={`Edited ${formatFullTimestamp(editedAt)}`}> (edited)</sub>)}
                            </p>
                        )
                    )}
                    <ReactionList reactions={reactionsState} currentUserId={auth.currentUser?.uid} onToggle={addReaction} />
                    <ReactionBar
                        emojis={reactionEmojis}
                        onReact={addReaction}
                        onReply={onReply}
                        message={props.message}
                        menuOpen={menuOpen || (isTouch && selected)}
                        hidden={!showActions}
                    >
                        {!deleted && (
                            <div className="message-menu-wrapper" ref={menuRef}>
                                <button className="reply-btn message-menu-trigger" data-tip="Options" aria-label="Options" aria-haspopup="true" aria-expanded={menuOpen} onClick={() => setMenuOpen(o => !o)}>…</button>
                                <MessageOptionsMenu
                                    open={menuOpen}
                                    menuPanelRef={menuPanelRef}
                                    menuMode={menuMode}
                                    menuReady={menuReady}
                                    menuStyle={menuStyle}
                                    quickMenuEmojis={quickMenuEmojis}
                                    addReaction={(emoji) => { addReaction(emoji); setMenuOpen(false); }}
                                    handleAddReactionFull={handleAddReactionFull}
                                    onReply={onReply ? (m) => { onReply(m); setMenuOpen(false); } : undefined}
                                    message={props.message}
                                    handleCopyText={handleCopyText}
                                    canEdit={uid === auth.currentUser?.uid && type !== 'image'}
                                    startEditing={() => { startEditing(); setMenuOpen(false); }}
                                    canDelete={uid === auth.currentUser?.uid}
                                    onDelete={() => { setShowDeleteConfirm(true); setMenuOpen(false); }}
                                    text={text}
                                />
                            </div>
                        )}
                    </ReactionBar>
                </div>
                <DeleteConfirmModal open={showDeleteConfirm} onConfirm={handleDelete} onCancel={() => setShowDeleteConfirm(false)} />
            </div>
        );
    }

    return (
    <div className={rootClasses} data-message-id={messageId} data-selected={selected ? 'true' : undefined} role="article" aria-label={`Message from ${userName}${isReplyTarget ? ' (reply target)' : ''}`} onClick={isTouch ? (e) => {
            const tag = (e.target.tagName || '').toLowerCase();
            if (['button','img','input','textarea','a'].includes(tag)) return;
            handleSelect();
        } : undefined} onMouseEnter={() => onHoverMessage && onHoverMessage(messageId)} onMouseLeave={() => onHoverMessage && onHoverMessage(null)}>
            <div className="message-inner">
                                {replyTo && showMeta && (
                                    <div className="message-top-row" aria-label={`Replying to ${replyTo.displayName || 'user'}`}>
                                        <div className="avatar-spacer" aria-hidden="true" />
                                        <div className="reply-contexts">
                                            <InlineReplyContext
                                                replyTo={replyTo}
                                                onViewProfile={handleViewProfileClick}
                                                onNavigate={(id) => {
                                                    const selector = `[data-message-id="${id}"]`;
                                                    const targetEl = document.querySelector(selector);
                                                    if (targetEl) {
                                                        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                        targetEl.classList.add('reply-flash');
                                                        let addedTemp = false;
                                                        if (!targetEl.classList.contains('reply-target')) { targetEl.classList.add('reply-target'); addedTemp = true; }
                                                        setTimeout(() => { targetEl.classList.remove('reply-flash'); }, 600);
                                                        if (addedTemp) setTimeout(() => { targetEl.classList.remove('reply-target'); }, 3000);
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                <div className="message-main-row">
                    {showMeta && (
                        <AvatarWithPresence
                          uid={uid}
                          photoURL={userPhotoURL}
                          displayName={userName}
                          presenceState={presenceState}
                          presenceTitle={presenceTitle}
                          onClick={handleViewProfileClick}
                        />
                    )}
                    <div className="message-content">
                        {showMeta && (<MessageHeader 
                            userName={userName} 
                            userId={uid}
                            createdAt={createdAt} 
                            formatTimestamp={formatTimestamp} 
                            onViewProfile={handleViewProfileClick} 
                            profileData={effectiveProfileData}
                        />)}
                        {!showMeta && (<HoverTimestamp createdAt={createdAt} formatTimestamp={formatTimestamp} />)}
                        {type === 'image' && imageURL && (
                            <>
                                <div className="message-image">
                                    <img src={imageURL} alt="Shared content" onClick={() => setShowFullImage(true)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') setShowFullImage(true); }} aria-label="Open image in modal" loading="lazy" decoding="async" />
                                </div>
                                <ImagePreviewModal open={showFullImage} src={imageURL} onClose={() => setShowFullImage(false)} />
                            </>
                        )}
                        {deleted && <p className="deleted-message" aria-label="Message deleted">This message was deleted.</p>}
                        {!deleted && (isEditing ? (
                            <EditMessageForm value={editText} onChange={setEditText} onSave={saveEdit} onCancel={cancelEditing} onKeyDown={onEditKeyDown} />
                        ) : (
                            displayText && (
                                <p>
                                    {processMessageText(displayText, searchTerm)}{' '}
                                    {editedAt && (<sub className="edited-label" title={`Edited ${formatFullTimestamp(editedAt)}`}> (edited)</sub>)}
                                </p>
                            )
                        ))}
                        <ReactionList reactions={reactionsState} currentUserId={auth.currentUser?.uid} onToggle={addReaction} />
                        <ReactionBar
                            emojis={reactionEmojis}
                            onReact={addReaction}
                            onReply={onReply}
                            message={props.message}
                            menuOpen={menuOpen || (isTouch && selected)}
                            hidden={!showActions}
                        >
                            {!deleted && (
                                <div className="message-menu-wrapper" ref={menuRef}>
                                    <button className="reply-btn message-menu-trigger" data-tip="Options" aria-label="Options" aria-haspopup="true" aria-expanded={menuOpen} onClick={() => setMenuOpen(o => !o)}>…</button>
                                    <MessageOptionsMenu
                                        open={menuOpen}
                                        menuPanelRef={menuPanelRef}
                                        menuMode={menuMode}
                                        menuReady={menuReady}
                                        menuStyle={menuStyle}
                                        quickMenuEmojis={quickMenuEmojis}
                                        addReaction={(emoji) => { addReaction(emoji); setMenuOpen(false); }}
                                        handleAddReactionFull={handleAddReactionFull}
                                        onReply={onReply ? (m) => { onReply(m); setMenuOpen(false); } : undefined}
                                        message={props.message}
                                        handleCopyText={handleCopyText}
                                        canEdit={uid === auth.currentUser?.uid && type !== 'image'}
                                        startEditing={() => { startEditing(); setMenuOpen(false); }}
                                        canDelete={uid === auth.currentUser?.uid}
                                        onDelete={() => { setShowDeleteConfirm(true); setMenuOpen(false); }}
                                        text={text}
                                    />
                                </div>
                            )}
                        </ReactionBar>
                    </div>
                    <DeleteConfirmModal open={showDeleteConfirm} onConfirm={handleDelete} onCancel={() => setShowDeleteConfirm(false)} />
                </div>
            </div>
        </div>
    );
}

export default ChatMessage;
