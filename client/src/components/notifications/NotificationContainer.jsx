import React, { useState, useCallback, useEffect } from 'react';
import TweetNotification from './TweetNotification';
import NotificationQueue from './NotificationQueue';
import './NotificationContainer.css';

const NotificationContainer = ({ tweets, viewMode }) => {
  const [notifications, setNotifications] = useState([]);
  const [queueRef] = useState(() => 
    new NotificationQueue({
      maxVisible: 4,
      dismissAfter: 5000,
      onUpdate: ({ visible }) => {
        setNotifications(visible);
        // Update mouse ignore region based on notification count
        if (window.electronAPI && viewMode === 'notifications') {
          const hasNotifications = visible.length > 0;
          window.electronAPI.setIgnoreMouseEvents(!hasNotifications, { forward: true });
        }
      }
    })
  );

  // Add new tweets to queue when they arrive
  useEffect(() => {
    if (tweets.length > 0 && viewMode === 'notifications') {
      const latestTweet = tweets[0];
      const currentIds = new Set(notifications.map(n => n.id));
      if (!currentIds.has(latestTweet.id)) {
        queueRef.add(latestTweet);
      }
    }
  }, [tweets, queueRef, notifications, viewMode]);

  const handleDismiss = useCallback((id) => {
    queueRef.dismiss(id);
  }, [queueRef]);

  // Clear queue when switching away from notification mode
  useEffect(() => {
    if (viewMode !== 'notifications') {
      queueRef.clear();
      // Restore click-through when leaving notification mode
      if (window.electronAPI) {
        window.electronAPI.setIgnoreMouseEvents(true, { forward: true });
      }
    }
  }, [viewMode, queueRef]);

  if (viewMode !== 'notifications') return null;

  return (
    <div className="notification-container">
      {notifications.map((tweet, index) => (
        <TweetNotification
          key={tweet.id}
          tweet={tweet}
          onDismiss={handleDismiss}
          index={index}
        />
      ))}
    </div>
  );
};

export default NotificationContainer;
