import React from 'react';
import './TweetNotification.css';

const TweetNotification = ({ tweet, onDismiss, index }) => {
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return `${Math.floor(diffMins / 60)}h ago`;
  };

  const handleClick = () => {
    onDismiss(tweet.id);
  };

  return (
    <article 
      className="tweet-notification" 
      onClick={handleClick}
      style={{ transform: `translateY(${index * 140}px)` }}
      role="article"
    >
      <div className="tweet-notification__glass">
        <div className="tweet-notification__content">
          <div className="tweet-notification__header">
            <img 
              src={tweet.author.profileImageUrl || `https://ui-avatars.com/api/?name=${tweet.author.name}&background=2563EB&color=fff&size=40`}
              alt={tweet.author.name}
              className="tweet-notification__avatar"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${tweet.author.name}&background=2563EB&color=fff&size=40`;
              }}
            />
            <div className="tweet-notification__meta">
              <span className="tweet-notification__name">{tweet.author.name}</span>
              <span className="tweet-notification__username">@{tweet.author.username}</span>
              <span className="tweet-notification__time">{formatTimestamp(tweet.createdAt)}</span>
            </div>
          </div>
          <p className="tweet-notification__text">{tweet.text}</p>
          <div className="tweet-notification__actions">
            <button 
              className="tweet-notification__link"
              onClick={(e) => {
                e.stopPropagation();
                window.open(tweet.url, '_blank');
              }}
            >
              Open in Twitter
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default TweetNotification;
