import React from 'react';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
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
import DiceRollDisplay from '../DiceRoll/DiceRollDisplay';

// Custom hook to get campaign member info for a specific user
const useCampaignMember = (campaignId, userId) => {
    const [memberData, setMemberData] = React.useState(null);
    const { firestore } = useFirebase();
    
    React.useEffect(() => {
        if (!campaignId || !userId || !firestore) {
            setMemberData(null);
            return;
        }
        
        const fetchMemberData = async () => {
            try {
                const memberDoc = await getDoc(doc(firestore, 'campaigns', campaignId, 'members', userId));
                if (memberDoc.exists()) {
                    setMemberData(memberDoc.data());
                } else {
                    setMemberData(null);
                }
            } catch (error) {
                console.warn('Could not fetch campaign member data:', error);
                setMemberData(null);
            }
        };
        
        fetchMemberData();
    }, [campaignId, userId, firestore]);
    
    return memberData;
};

function ChatMessage(props) {
    // Extract the campaignId from props
    const { campaignId } = props;
    const { firestore, auth } = useFirebase();
    const { text, uid, photoURL, reactions = {}, createdAt, imageURL, type, displayName, replyTo, editedAt, deleted, diceData, messageContext, messageType } = props.message;
    const { searchTerm, onReply, isReplyTarget, onViewProfile, showMeta = true } = props;

    // Get enhanced profile data for this user
    const { profileData } = useUserProfileData(uid);

    // Get campaign member data if in a campaign context
    const campaignMemberData = useCampaignMember(campaignId, uid);

    // For the current user, we should use the profile from the global context
    // For other users, we use the fetched profile data
    const { profile: currentUserProfile } = useUserProfile();
    const { user: currentUser } = useFirebase();

    const effectiveProfileData = uid === currentUser?.uid ? currentUserProfile : profileData;

    // Get user's profanity filter preference from context (will re-render when changed)
    const { profanityFilterEnabled } = useProfanityFilterContext();

    // Ensure text is a string (defensive programming for legacy data)
    const safeText = typeof text === 'string' ? text : typeof text === 'object' && text?.text ? text.text : '';
    
    // Debug logging
    if (text && !safeText) {
        console.log('DEBUG: Text processing issue:', { originalText: text, typeOfText: typeof text, safeText });
    }

    // Apply profanity filtering based on user preference
    const displayText = useProfanityFilter(safeText, profanityFilterEnabled);
    
    // More debug logging
    if (safeText && !displayText) {
        console.log('DEBUG: Profanity filter issue:', { safeText, profanityFilterEnabled, displayText });
    }

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

    // Base message class
    const baseMessageClass = uid === auth.currentUser.uid ? 'sent' : 'received';
    
    // Add character context classes for campaign messages
    let contextClasses = '';
    if (campaignId && messageContext) {
        switch (messageContext) {
            case 'in_character':
                contextClasses = ' in-character-message';
                break;
            case 'out_of_character':
                contextClasses = ' out-of-character-message';
                break;
            default:
                break;
        }
    }
    
    // Add dice roll styling for enhanced dice rolls
    if (type === 'dice_roll' || messageType === 'dice_roll') {
        if (diceData?.characterCommand) {
            contextClasses += ' character-dice-roll';
        }
    }
    
    const messageClass = baseMessageClass + contextClasses;

    // Enhanced name priority: Campaign character name (highest) > username (medium) > displayName > auth displayName (lowest)
    const getDisplayNameWithPriority = () => {
        // If in a campaign context, prioritize character names for players
        if (campaignId && campaignMemberData) {
            // For DMs, use their username instead of character name
            if (campaignMemberData.role === 'dm') {
                return effectiveProfileData?.username || effectiveProfileData?.displayName || displayName || 'Unknown DM';
            }
            // For players, use character name if available
            if (campaignMemberData.characterName) {
                return campaignMemberData.characterName;
            }
        }
        
        // Standard priority for non-campaign or when no character name
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
    // Also check if the profile picture URL is a placeholder and use fallback instead
    const isPlaceholderURL = (url) => {
        return !url || url.includes('via.placeholder.com') || url.includes('placeholder');
    };
    
    const profilePictureURL = effectiveProfileData?.profilePictureURL;
    const userPhotoURL = isPlaceholderURL(profilePictureURL) ? 
        (isPlaceholderURL(photoURL) ? null : photoURL) : 
        profilePictureURL;

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

    // Helper function to render character context indicators
    const renderCharacterContextIndicator = () => {
        if (!campaignId || !messageContext || messageContext === 'neutral') return null;
        
        const characterName = campaignMemberData?.characterName;
        
        switch (messageContext) {
            case 'in_character':
                return (
                    <div className="character-context-indicator ic-indicator" title={characterName ? `${characterName} speaking in character` : 'In character'}>
                        <span className="context-icon">🎭</span>
                        <span className="context-label">IC</span>
                        {characterName && <span className="character-name">{characterName}</span>}
                    </div>
                );
            case 'out_of_character':
                return (
                    <div className="character-context-indicator ooc-indicator" title="Out of character">
                        <span className="context-icon">💬</span>
                        <span className="context-label">OOC</span>
                    </div>
                );
            default:
                return null;
        }
    };

    // Helper function to render enhanced dice roll info
    const renderDiceContextInfo = () => {
        if (type !== 'dice_roll' && messageType !== 'dice_roll') return null;
        if (!diceData?.characterCommand) return null;
        
        const { characterCommand } = diceData;
        
        let contextInfo = '';
        switch (characterCommand.type) {
            case 'skill_check':
                contextInfo = `${characterCommand.skill} check`;
                break;
            case 'saving_throw':
                contextInfo = `${characterCommand.ability} saving throw`;
                break;
            case 'attack_roll':
                contextInfo = 'attack roll';
                break;
            default:
                return null;
        }
        
        return (
            <div className="dice-context-info" title={characterCommand.description}>
                <span className="dice-context-type">{contextInfo}</span>
                {diceData.characterModifier !== undefined && (
                    <span className="character-modifier">
                        +{diceData.characterModifier} character bonus
                    </span>
                )}
            </div>
        );
    };

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
                    {renderCharacterContextIndicator()}
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
                    ) : type === 'dice_roll' && diceData ? (
                        <>
                            {renderDiceContextInfo()}
                            {displayText && (
                                <p>
                                    {processMessageText(displayText, searchTerm)}{' '}
                                    {editedAt && (<sub className="edited-label" title={`Edited ${formatFullTimestamp(editedAt)}`}> (edited)</sub>)}
                                </p>
                            )}
                            <DiceRollDisplay rollResult={diceData} mode="full" />
                        </>
                    ) : (
                        (displayText || safeText) && (
                            <p>
                                {processMessageText(displayText || safeText || 'DEBUG: No text', searchTerm)}{' '}
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
            if (['button', 'img', 'input', 'textarea', 'a'].includes(tag)) return;
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
                            campaignMemberData={campaignMemberData}
                            isInCampaign={!!campaignId}
                        />)}
                        {!showMeta && (<HoverTimestamp createdAt={createdAt} formatTimestamp={formatTimestamp} />)}
                        {renderCharacterContextIndicator()}
                        {type === 'image' && imageURL && (
                            <>
                                <div className="message-image">
                                    <img src={imageURL} alt="Shared content" onClick={() => setShowFullImage(true)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') setShowFullImage(true); }} aria-label="Open image in modal" loading="lazy" decoding="async" />
                                </div>
                                <ImagePreviewModal open={showFullImage} src={imageURL} onClose={() => setShowFullImage(false)} />
                            </>
                        )}
                        {type === 'dice_roll' && diceData && (
                            <>
                                {renderDiceContextInfo()}
                                {displayText && (
                                    <p>
                                        {processMessageText(displayText, searchTerm)}{' '}
                                        {editedAt && (<sub className="edited-label" title={`Edited ${formatFullTimestamp(editedAt)}`}> (edited)</sub>)}
                                    </p>
                                )}
                                <DiceRollDisplay rollResult={diceData} mode="full" />
                            </>
                        )}
                        {deleted && <p className="deleted-message" aria-label="Message deleted">This message was deleted.</p>}
                        {!deleted && type !== 'image' && type !== 'dice_roll' && (isEditing ? (
                            <EditMessageForm value={editText} onChange={setEditText} onSave={saveEdit} onCancel={cancelEditing} onKeyDown={onEditKeyDown} />
                        ) : (
                            (displayText || safeText) && (
                                <p>
                                    {processMessageText(displayText || safeText || 'DEBUG: No text', searchTerm)}{' '}
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
