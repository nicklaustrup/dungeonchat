import React from 'react';

/**
 * useReplyState
 * Manages reply target normalization & sanitation. Supports either internal state
 * or an externally controlled state (via props) so it can integrate with higher-level
 * components that also need the reply context (e.g., ChatInput outside ChatRoom).
 *
 * @param {Object} params
 * @param {(uid: string, originalName?: string) => string} [params.getDisplayName]
 * @param {Object|null} [params.externalReply] - externally provided reply object
 * @param {Function} [params.setExternalReply] - setter for external reply object
 * @returns {{ replyingTo: Object|null, setReplyTarget: (message: Object) => void, clearReply: () => void }}
 */
export function useReplyState({ getDisplayName, externalReply, setExternalReply } = {}) {
  const [internalReply, setInternalReply] = React.useState(null);

  const replyState = externalReply !== undefined ? externalReply : internalReply;
  const setReplyState = setExternalReply || setInternalReply;

  const setReplyTarget = React.useCallback((message) => {
    if (!message) return;
    const messageId = message.id || message.documentId || `temp_${Date.now()}`;
    if (!messageId) return;
    const type = message.type || (message.imageURL ? 'image' : (message.text ? 'text' : 'meta'));
    const normalized = {
      id: messageId,
      text: message.text ?? null,
      imageURL: message.imageURL ?? null,
      type,
      uid: message.uid,
      displayName: getDisplayName ? getDisplayName(message.uid, message.displayName) : (message.displayName || 'Anonymous')
    };
    const sanitized = Object.fromEntries(Object.entries(normalized).filter(([_, v]) => v !== undefined));
    setReplyState(sanitized);
  }, [getDisplayName, setReplyState]);

  const clearReply = React.useCallback(() => setReplyState(null), [setReplyState]);

  return { replyingTo: replyState, setReplyTarget, clearReply };
}

export default useReplyState;
