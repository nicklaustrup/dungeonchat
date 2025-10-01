/**
 * VoiceNotification Component
 * Toast notifications for voice chat events
 */

import React, { useEffect, useState } from 'react';
import { FaUserPlus, FaUserMinus, FaExclamationTriangle } from 'react-icons/fa';
import './VoiceNotification.css';

function VoiceNotification({ notification, onDismiss }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const showTimer = setTimeout(() => setIsVisible(true), 10);
    
    // Auto-dismiss after 3 seconds
    const hideTimer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        onDismiss();
      }, 300); // Wait for exit animation
    }, 3000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [onDismiss]);

  const getIcon = () => {
    switch (notification.type) {
      case 'user-joined':
        return <FaUserPlus className="notification-icon icon-join" />;
      case 'user-left':
        return <FaUserMinus className="notification-icon icon-leave" />;
      case 'error':
        return <FaExclamationTriangle className="notification-icon icon-error" />;
      default:
        return null;
    }
  };

  const getClassName = () => {
    let className = 'voice-notification';
    if (isVisible && !isExiting) className += ' visible';
    if (isExiting) className += ' exiting';
    className += ` notification-${notification.type}`;
    return className;
  };

  return (
    <div className={getClassName()}>
      {getIcon()}
      <div className="notification-content">
        <div className="notification-title">{notification.title}</div>
        {notification.message && (
          <div className="notification-message">{notification.message}</div>
        )}
      </div>
    </div>
  );
}

export default VoiceNotification;
