/**
 * VoiceNotificationContainer Component
 * Manages multiple voice chat notifications
 */

import React, {
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import VoiceNotification from "./VoiceNotification";

const VoiceNotificationContainer = forwardRef((props, ref) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [...prev, { ...notification, id }]);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Expose addNotification method to parent
  useImperativeHandle(
    ref,
    () => ({
      addNotification,
    }),
    [addNotification]
  );

  return (
    <div className="voice-notification-container">
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{
            position: "fixed",
            top: `${20 + index * 70}px`,
            right: "20px",
            zIndex: 10000 + index,
          }}
        >
          <VoiceNotification
            notification={notification}
            onDismiss={() => removeNotification(notification.id)}
          />
        </div>
      ))}
    </div>
  );
});

VoiceNotificationContainer.displayName = "VoiceNotificationContainer";

// Create a singleton instance to manage notifications globally
let notificationContainerInstance = null;

export function setNotificationContainer(instance) {
  notificationContainerInstance = instance;
}

export function showVoiceNotification(notification) {
  if (notificationContainerInstance) {
    notificationContainerInstance.addNotification(notification);
  }
}

export default VoiceNotificationContainer;
