// Firestore message creation service
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { normalizeReply } from './replyUtil';

export async function createTextMessage({ firestore, text, user, getDisplayName, replyTo }) {
  const messagesRef = collection(firestore, 'messages');
  const { uid, photoURL, displayName } = user;
  const data = {
    text,
    createdAt: serverTimestamp(),
    uid,
    photoURL: photoURL || null,
    displayName: getDisplayName ? getDisplayName(uid, displayName) : (displayName || 'Anonymous'),
    reactions: {}
  };
  if (replyTo && replyTo.id) {
    data.replyTo = normalizeReply(replyTo);
  }
  return addDoc(messagesRef, data);
}

export async function createImageMessage({ firestore, imageURL, user, getDisplayName }) {
  const messagesRef = collection(firestore, 'messages');
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
  return addDoc(messagesRef, data);
}
