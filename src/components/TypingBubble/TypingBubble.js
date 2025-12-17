import React from "react";
import { useFirebase } from "../../services/FirebaseContext";
import { useTypingUsers } from "../../hooks/useTypingUsers";
import "./TypingBubble.css";

function TypingBubble({ users, soundEnabled }) {
  const { rtdb, auth } = useFirebase();
  const hookUsers = useTypingUsers({ rtdb, currentUid: auth.currentUser?.uid });
  const typingUsers = users || hookUsers;
  // Removed remote typing tap sounds per updated requirement.

  if (!typingUsers || !typingUsers.length) return null;
  const names = typingUsers.slice(0, 3).map((u) => u.displayName || "Someone");
  const more = typingUsers.length - names.length;
  const label =
    more > 0
      ? `${names.join(", ")} +${more} typing...`
      : `${names.join(", ")} ${names.length === 1 ? "is" : "are"} typing...`;
  return (
    <div className="typing-bubble" aria-live="polite" aria-atomic="true">
      <div className="typing-dots" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <span className="typing-text">{label}</span>
    </div>
  );
}

export default React.memo(TypingBubble);
