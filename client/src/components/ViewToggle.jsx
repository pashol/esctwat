import React from 'react';
import './ViewToggle.css';

const ViewToggle = ({ viewMode, onToggle }) => {
  return (
    <div className="view-toggle">
      <button
        className={`view-toggle__btn ${viewMode === 'feed' ? 'active' : ''}`}
        onClick={() => onToggle('feed')}
        title="Feed View"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
        <span>Feed</span>
      </button>
      <button
        className={`view-toggle__btn ${viewMode === 'notifications' ? 'active' : ''}`}
        onClick={() => onToggle('notifications')}
        title="Notification View"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <span>Notify</span>
      </button>
    </div>
  );
};

export default ViewToggle;
