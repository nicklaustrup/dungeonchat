import React from 'react';
import './ChatInput.css';
import { useFirebase } from '../../services/FirebaseContext';
import { playSendMessageSound } from '../../utils/sound';
import { createTextMessage } from '../../services/messageService';
import { useChatReply, useChatImage, useBulkImages } from '../../contexts/ChatStateContext';
import { useImageMessage } from '../../hooks/useImageMessage';
import { useTypingPresence } from '../../hooks/useTypingPresence';
import { useEmojiPicker } from '../../hooks/useEmojiPicker';
import { useToast } from '../../hooks/useToast';
import { ReplyPreview } from './ReplyPreview';
import { ImagePreviewModal } from './ImagePreviewModal';
import { BulkImagePreviewModal } from './BulkImagePreviewModal';
import { MessageBar } from './MessageBar';
import { ActionButtons } from './ActionButtons';
import { diceService, parseInlineDiceCommand, formatRollForChat } from '../../services/diceService';
import { initiativeService } from '../../services/initiativeService';
import { getCharacterContext, getMessageContextType, cleanMessageText } from '../../services/characterContextService';
import DiceRoller from '../DiceRoll/DiceRoller';
import CharacterCommandsHelp from './CharacterCommandsHelp';
import { doc, getDoc } from 'firebase/firestore';

// Custom hook to get campaign member info for current user
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

function ChatInput({
  getDisplayName,
  profile,
  soundEnabled,
  forceScrollBottom,
  campaignId = null,
  channelId = 'general'
}) {
  const { auth, firestore, rtdb, storage } = useFirebase();
  const user = auth.currentUser;
  const [text, setText] = React.useState('');
  const [showDiceRoller, setShowDiceRoller] = React.useState(false);
  const [showCommandsHelp, setShowCommandsHelp] = React.useState(false);

  // Get campaign member data for current user if in a campaign
  const campaignMemberData = useCampaignMember(campaignId, user?.uid);

  // Load character data for character-aware commands
  const [characterData, setCharacterData] = React.useState(null);
  
  React.useEffect(() => {
    if (!campaignId || !user?.uid || !firestore) {
      setCharacterData(null);
      return;
    }
    
    const loadCharacterData = async () => {
      try {
        const character = await getCharacterContext(firestore, campaignId, user.uid);
        setCharacterData(character);
      } catch (error) {
        console.warn('Failed to load character data for dice commands:', error);
        setCharacterData(null);
      }
    };
    
    loadCharacterData();
  }, [campaignId, user?.uid, firestore]);

  // Enhanced function to get player name for dice rolls
  const getPlayerName = React.useCallback(() => {
    if (!user) return 'Anonymous';
    
    // If in a campaign and have member data, use character name logic
    if (campaignId && campaignMemberData) {
      // For DMs, use their username from profile, fallback to display name
      if (campaignMemberData.role === 'dm') {
        return profile?.username || profile?.displayName || user.displayName || 'DM';
      }
      // For players, use character name if available
      if (campaignMemberData.characterName) {
        return campaignMemberData.characterName;
      }
    }
    
    // Fall back to regular display name
    return getDisplayName(user.uid, user.displayName);
  }, [user, campaignId, campaignMemberData, getDisplayName, profile]);

  // Use centralized state instead of prop drilling  
  const { replyingTo, setReplyingTo } = useChatReply();
  const { selectedFile: contextSelectedFile, preview: contextPreview, uploading: contextUploading, clearImage, setUploading } = useChatImage();
  const { images: bulkImages, uploading: bulkUploading, removeImage, clearAllImages, setImagesUploading, addImages } = useBulkImages();
  const { push: pushToast } = useToast();

  // Image handling - hybrid approach to support both drag-drop (context) and file picker (hook)
  const imageHook = useImageMessage({
    storage,
    firestore,
    user,
    getDisplayName,
    soundEnabled,
    playSendSound: () => playSendMessageSound(true),
    campaignId,
    channelId
  });

  // Merge context and hook state for image preview
  const hasContextImage = contextSelectedFile && contextPreview;
  
  const activeImagePreview = hasContextImage ? contextPreview : imageHook.imagePreview;
  const activeImageFile = hasContextImage ? contextSelectedFile : imageHook.selectedImage;
  const isUploading = hasContextImage ? contextUploading : imageHook.uploading;

  const handleLocalFile = React.useCallback((file) => {
    imageHook.handleImageSelect(file);
  }, [imageHook]);

  const handleLocalFiles = React.useCallback((files) => {
    if (!files || files.length === 0) return;
    
    const imageFiles = Array.from(files).filter(file => file.type && file.type.startsWith('image/'));
    
    if (imageFiles.length === 1) {
      // Single image - use existing flow
      handleLocalFile(imageFiles[0]);
    } else if (imageFiles.length > 1) {
      // Multiple images - use bulk flow
      addImages(imageFiles);
    }
  }, [handleLocalFile, addImages]);
  
  const handleClearImage = React.useCallback(() => {
    if (hasContextImage) {
      clearImage(); // Clear context state
    } else {
      imageHook.clearImage(); // Clear hook state
    }
  }, [hasContextImage, imageHook, clearImage]);

  const handleClearBulkImages = React.useCallback(() => {
    clearAllImages();
  }, [clearAllImages]);

  const handleSendImage = React.useCallback(async () => {
    if (hasContextImage) {
      // Handle context image upload
      if (!activeImageFile || isUploading || !user) return;
      setUploading(true);
      try {
        // Use the same upload logic as imageHook
        const { compressImage, uploadImage } = await import('../../services/imageUploadService');
        const { createImageMessage } = await import('../../services/messageService');
        
        const compressed = await compressImage(activeImageFile);
        const url = await uploadImage({ storage, file: compressed, uid: user.uid });
        if (!url) throw new Error('Upload failed');
        await createImageMessage({ firestore, imageURL: url, user, getDisplayName });
        clearImage();
        if (soundEnabled) playSendMessageSound(true);
      } catch (err) {
        console.error('Context image upload error:', err);
        pushToast('Image upload failed: ' + err.message, { type: 'error' });
        setUploading(false);
      }
    } else {
      // Use hook's send method
      await imageHook.sendImageMessage();
    }
  }, [hasContextImage, activeImageFile, isUploading, user, setUploading, storage, firestore, getDisplayName, soundEnabled, clearImage, imageHook, pushToast]);

  const handleSendBulkImages = React.useCallback(async () => {
    if (!bulkImages || bulkImages.length === 0 || bulkUploading || !user) return;
    
    setImagesUploading(true);
    try {
      const { compressImage, uploadImage } = await import('../../services/imageUploadService');
      const { createImageMessage } = await import('../../services/messageService');
      
      // Upload all images in parallel
      const uploadPromises = bulkImages.map(async (imageObj) => {
        const compressed = await compressImage(imageObj.file);
        const url = await uploadImage({ storage, file: compressed, uid: user.uid });
        if (!url) throw new Error('Upload failed for ' + imageObj.file.name);
        return createImageMessage({ firestore, imageURL: url, user, getDisplayName });
      });
      
      await Promise.all(uploadPromises);
      clearAllImages();
      if (soundEnabled) playSendMessageSound(true);
      if (forceScrollBottom) setTimeout(() => forceScrollBottom(), 10);
    } catch (err) {
      console.error('Bulk image upload error:', err);
      pushToast('Some images failed to upload: ' + err.message, { type: 'error' });
      setImagesUploading(false);
    }
  }, [bulkImages, bulkUploading, user, setImagesUploading, storage, firestore, getDisplayName, soundEnabled, clearAllImages, pushToast, forceScrollBottom]);

  const { handleInputActivity } = useTypingPresence({ rtdb, user, soundEnabled });
  const { open: emojiOpen, toggle: toggleEmoji, buttonRef: emojiButtonRef, setOnSelect } = useEmojiPicker();
  const inputRef = React.useRef(null);

  // Dice roll handler
  const handleDiceRoll = async (rollResult) => {
    if (!user || !rollResult) return;
    
    try {
      // Get player display name (character name in campaigns)
      const playerName = getPlayerName();
      
      // Create a dice roll message with the result
      await createTextMessage({ 
        firestore, 
        text: `🎲 **${playerName}** rolled **${rollResult.notation}**: **${rollResult.total}**${rollResult.breakdown ? ` (${rollResult.breakdown})` : ''}`,
        user, 
        getDisplayName, 
        replyTo: replyingTo,
        campaignId,
        channelId,
        messageType: 'dice_roll',
        diceData: rollResult
      });
      
      // Clear reply state and provide user feedback
      setReplyingTo(null);
      setShowDiceRoller(false);
      if (soundEnabled) playSendMessageSound(true);
      if (forceScrollBottom) setTimeout(() => forceScrollBottom(), 10);
    } catch (err) {
      console.error('Error sending dice roll', err);
      pushToast('Failed to send dice roll: ' + err.message, { type: 'error' });
    }
  };

  // Handle file uploads from ActionButtons
  const handleFileUpload = (files) => {
    if (files.length === 1) {
      handleLocalFile(files[0]);
    } else {
      handleLocalFiles(files);
    }
  };

  // Auto-focus on initial mount / when user becomes available
  React.useEffect(() => {
    if (user && inputRef.current) {
      // Delay to ensure layout present
      setTimeout(() => {
        try { inputRef.current.focus(); } catch (_) {}
      }, 30);
    }
  }, [user]);

  // Emoji selection handler
  React.useEffect(() => {
    setOnSelect((emojiData) => {
      const emoji = emojiData?.emoji || '';
      if (!emoji) return;
      setText(v => v + emoji);
      if (inputRef.current) inputRef.current.focus();
    });
  }, [setOnSelect]);

  const handleChange = (val) => {
    setText(val);
    handleInputActivity(val.length);
  };

  const sendText = async () => {
    if (!user || !text.trim()) return;
    
    // Clear typing indicator immediately when send is attempted
    handleInputActivity(0);
    
    try {
      const trimmedText = text.trim();
      
      // Initiative command (/init optionalModifier) - only in campaign context
      if (campaignId && trimmedText.startsWith('/init')) {
        try {
          // Extract optional modifier e.g. /init +3 or /init -1
            const parts = trimmedText.split(/\s+/);
            let mod = 0;
            if (parts.length > 1) {
              const m = parseInt(parts[1], 10);
              if (!isNaN(m)) mod = m;
            } else if (characterData) {
              // Use dex modifier if character sheet present
              const dex = characterData?.abilityScores?.dexterity;
              if (typeof dex === 'number') {
                mod = Math.floor((dex - 10) / 2);
              }
            }
            const roll = Math.floor(Math.random() * 20) + 1;
            const total = roll + mod;
            // Record in initiative tracker
            await initiativeService.recordPlayerInitiativeRoll(firestore, campaignId, user.uid, total, characterData);
            const playerName = getPlayerName();
            await createTextMessage({
              firestore,
              text: `⚔️ **${playerName}** rolls initiative: **${total}** (d20=${roll}${mod !== 0 ? (mod > 0 ? `+${mod}` : mod) : ''})`,
              user,
              getDisplayName,
              replyTo: replyingTo,
              campaignId,
              channelId,
              messageType: 'dice_roll',
              diceData: { total, rollSum: roll, modifier: mod, individual: [roll], breakdown: mod !== 0 ? `${roll}${mod>0?`+${mod}`:mod}`: `${roll}`, notation: mod!==0?`1d20${mod>0?`+${mod}`:mod}`:'1d20', timestamp: Date.now(), initiative: true }
            });
            setText('');
            setReplyingTo(null);
            if (soundEnabled) playSendMessageSound(true);
            if (forceScrollBottom) setTimeout(() => forceScrollBottom(), 10);
            return; // handled
        } catch (error) {
          pushToast('Failed to record initiative: ' + error.message, { type: 'error' });
          return;
        }
      }

      // Check for character-aware dice commands first (if in campaign with character)
      const diceCommand = parseInlineDiceCommand(trimmedText, characterData);
      
      if (diceCommand) {
        if (diceCommand.error) {
          pushToast(`Dice command error: ${diceCommand.error}`, { type: 'error' });
          return;
        }
        
        try {
          // Roll the dice
          const rollResult = diceService.rollDice(diceCommand);
          
          // Get player display name (character name in campaigns)
          const playerName = getPlayerName();
          
          // Format roll result with character context
          const formattedRoll = formatRollForChat(rollResult, playerName, diceCommand.characterCommand);
          
          // Create a dice roll message with the result
          await createTextMessage({ 
            firestore, 
            text: formattedRoll.text,
            user, 
            getDisplayName, 
            replyTo: replyingTo,
            campaignId,
            channelId,
            messageType: 'dice_roll',
            diceData: {
              ...rollResult,
              characterCommand: diceCommand.characterCommand,
              characterModifier: diceCommand.characterModifier
            }
          });
          
        } catch (error) {
          pushToast(`Dice roll error: ${error.message}`, { type: 'error' });
          return;
        }
      } else {
        // Check if this is a regular /roll command (fallback)
        if (trimmedText.startsWith('/roll ') || trimmedText.startsWith('/r ')) {
          const diceNotation = trimmedText.startsWith('/roll ') 
            ? trimmedText.substring(6).trim() 
            : trimmedText.substring(3).trim();
            
          if (diceNotation) {
            try {
              // Parse and roll the dice
              const parsedDice = diceService.parseDiceNotation(diceNotation);
              const rollResult = diceService.rollDice(parsedDice);
              
              // Create a dice roll message with the result
              const playerName = getPlayerName();
              const formattedRoll = formatRollForChat(rollResult, playerName);
              
              await createTextMessage({ 
                firestore, 
                text: formattedRoll.text,
                user, 
                getDisplayName, 
                replyTo: replyingTo,
                campaignId,
                channelId,
                messageType: 'dice_roll',
                diceData: rollResult
              });
            } catch (error) {
              pushToast(`Invalid dice notation: ${error.message}`, { type: 'error' });
              return;
            }
          } else {
            pushToast('Please specify dice notation after /roll (e.g., /roll 1d20+5)', { type: 'error' });
            return;
          }
        } else {
          // Regular text message - check for character context (IC/OOC)
          const messageContext = getMessageContextType(trimmedText);
          const cleanedText = cleanMessageText(trimmedText);
          
          // Create regular text message with context
          await createTextMessage({ 
            firestore, 
            text: cleanedText || trimmedText, // Use cleaned text if available, otherwise original
            user, 
            getDisplayName, 
            replyTo: replyingTo,
            campaignId,
            channelId,
            messageType: messageContext !== 'neutral' ? messageContext : 'text',
            messageContext
          });
        }
      }
      
      setText('');
      setReplyingTo(null);
      if (soundEnabled) playSendMessageSound(true);
      if (forceScrollBottom) setTimeout(() => forceScrollBottom(), 10);
    } catch (err) {
      console.error('Error sending message', err);
      pushToast('Failed to send message: ' + err.message, { type: 'error' });
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    sendText();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendText();
    }
  };

  // Prefill listener
  React.useEffect(() => {
    const handler = (e) => {
      if (!e.detail || !e.detail.text) return;
      setText(e.detail.text);
      requestAnimationFrame(() => {
        if (inputRef.current) {
          const val = e.detail.text;
          inputRef.current.focus();
          inputRef.current.selectionStart = inputRef.current.selectionEnd = val.length;
        }
      });
    };
    document.addEventListener('chat:prefill', handler);
    return () => document.removeEventListener('chat:prefill', handler);
  }, []);

  // Shortcut: Ctrl/Cmd + I for image file picker
  React.useEffect(() => {
    const handleShortcut = (e) => {
      const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
      const isMod = e.ctrlKey || e.metaKey;
      if (isMod && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault();
        const input = document.getElementById('image-upload');
        if (input) input.click();
      }
    };
    document.addEventListener('keydown', handleShortcut);
    return () => document.removeEventListener('keydown', handleShortcut);
  }, []);

  const jumpToMessage = (id) => {
    const selector = `[data-message-id="${id}"]`;
    const el = document.querySelector(selector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (!el.classList.contains('reply-target')) {
        el.classList.add('reply-target');
        setTimeout(() => el.classList.remove('reply-target'), 3000);
      }
    }
  };

  return (
    <div className="chat-input-area">
      <ImagePreviewModal
        imagePreview={activeImagePreview}
        uploading={isUploading}
        error={imageHook.error}
        onSend={handleSendImage}
        onCancel={handleClearImage}
        onRetry={handleSendImage}
      />
      <BulkImagePreviewModal
        images={bulkImages}
        uploading={bulkUploading}
        error={null}
        onSend={handleSendBulkImages}
        onCancel={handleClearBulkImages}
        onRetry={handleSendBulkImages}
        onRemoveImage={removeImage}
      />
      <ReplyPreview
        replyingTo={replyingTo}
        onCancel={() => setReplyingTo(null)}
        onJump={jumpToMessage}
      />
      {showDiceRoller && (
        <DiceRoller 
          onRoll={handleDiceRoll}
          onClose={() => setShowDiceRoller(false)}
          mode="inline"
        />
      )}
      <CharacterCommandsHelp 
        isOpen={showCommandsHelp}
        onClose={() => setShowCommandsHelp(false)}
        hasCharacter={!!characterData}
      />
      <form onSubmit={onSubmit} className="message-form">
        <ActionButtons
          onUploadImage={handleFileUpload}
          onToggleDice={() => setShowDiceRoller(prev => !prev)}
          onToggleEmoji={toggleEmoji}
          onToggleHelp={() => setShowCommandsHelp(prev => !prev)}
          showDiceRoller={showDiceRoller}
          showCommandsHelp={showCommandsHelp}
          emojiOpen={emojiOpen}
          emojiButtonRef={emojiButtonRef}
          campaignId={campaignId}
          hasCharacter={!!characterData}
        />
        <div className="input-row">
          <MessageBar
            text={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            textareaRef={inputRef}
          />
          <button type="submit" disabled={!text} className="send-btn" aria-label="Send message">➤</button>
        </div>
      </form>
    </div>
  );
}

export default ChatInput;
