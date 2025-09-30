// Firestore message creation service
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { normalizeReply } from './replyUtil';

export async function createTextMessage({ firestore, text, user, getDisplayName, replyTo, campaignId = null, channelId = 'general', messageType = 'text', diceData = null }) {
  // Determine the correct collection reference based on context
  const messagesRef = campaignId 
    ? collection(firestore, 'campaigns', campaignId, 'channels', channelId, 'messages')
    : collection(firestore, 'messages');
    
  const { uid, photoURL, displayName } = user;
  const data = {
    text,
    createdAt: serverTimestamp(),
    uid,
    photoURL: photoURL || null,
    displayName: getDisplayName ? getDisplayName(uid, displayName) : (displayName || 'Anonymous'),
    reactions: {},
    type: messageType
  };
  
  // Add dice roll data if this is a dice message
  if (messageType === 'dice_roll' && diceData) {
    data.diceData = diceData;
  }
  
  // Add campaign context to message if in campaign
  if (campaignId) {
    data.campaignId = campaignId;
    data.channelId = channelId;
  }
  
  if (replyTo && replyTo.id) {
    data.replyTo = normalizeReply(replyTo);
  }
  return addDoc(messagesRef, data);
}

export async function createImageMessage({ firestore, imageURL, user, getDisplayName, campaignId = null, channelId = 'general' }) {
  // Determine the correct collection reference based on context
  const messagesRef = campaignId 
    ? collection(firestore, 'campaigns', campaignId, 'channels', channelId, 'messages')
    : collection(firestore, 'messages');
    
  const { uid, photoURL, displayName } = user;
  const data = {
    imageURL,
    createdAt: serverTimestamp(),
    uid,
    photoURL: photoURL || null,
    displayName: getDisplayName ? getDisplayName(uid, displayName) : (displayName || 'Anonymous'),
    reactions: {},
    type: 'image'
  };
  
  // Add campaign context to message if in campaign
  if (campaignId) {
    data.campaignId = campaignId;
    data.channelId = channelId;
  }
  
  return addDoc(messagesRef, data);
}
