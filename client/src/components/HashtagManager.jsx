import React, { useState } from 'react';

const HashtagManager = ({ hashtags, onAddHashtag, onRemoveHashtag, onUpdateHashtags, isLoading = false }) => {
  const [newHashtag, setNewHashtag] = useState('');
  const [error, setError] = useState('');

  const handleAddHashtag = (e) => {
    e.preventDefault();
    setError('');

    if (!newHashtag.trim()) {
      setError('Please enter a hashtag');
      return;
    }

    const success = onAddHashtag(newHashtag.trim());
    if (success) {
      setNewHashtag('');
    } else {
      setError('Invalid hashtag or already exists');
    }
  };

  const handleRemoveHashtag = (hashtag) => {
    setError('');
    onRemoveHashtag(hashtag);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddHashtag(e);
    }
  };

  const validateHashtag = (hashtag) => {
    if (!hashtag || typeof hashtag !== 'string') return false;
    
    const cleaned = hashtag.trim();
    if (!cleaned) return false;
    
    // Basic hashtag validation
    return cleaned.length >= 2 && /^[#]?[\w]+$/.test(cleaned);
  };

  return (
    <div className="surface-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Active Hashtags</h3>
          <p className="text-sm text-muted">Add or remove hashtags to refine your stream.</p>
        </div>
        <span className="chip">{hashtags.length} active</span>
      </div>
      
      {/* Current Hashtags */}
      <div className="mb-4">
        {hashtags.length === 0 ? (
          <p className="text-twitter-gray text-sm">No hashtags configured</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {hashtags.map((hashtag, index) => (
              <span
                key={index}
                className="chip"
              >
                {hashtag}
                {!isLoading && (
                  <button
                    onClick={() => handleRemoveHashtag(hashtag)}
                    className="icon-button"
                    title="Remove hashtag"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Add New Hashtag */}
      <form onSubmit={handleAddHashtag} className="space-y-4">
        <div>
          <label htmlFor="newHashtag" className="block text-sm font-medium">
            Add New Hashtag
          </label>
          <div className="flex space-x-2">
            <input
              id="newHashtag"
              type="text"
              value={newHashtag}
              onChange={(e) => setNewHashtag(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., Eurovision2025"
              className="flex-1 px-3 py-2 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/60 bg-slate-100/40 dark:bg-slate-900/40"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !newHashtag.trim()}
              className="px-4 py-2 accent-bg rounded-md shadow disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:-translate-y-0.5"
            >
              {isLoading ? 'Adding...' : 'Add'}
            </button>
          </div>
          {error && (
            <p className="text-red-500 text-sm mt-1">{error}</p>
          )}
        </div>

        <div className="text-xs text-muted">
          <p className="font-semibold">Tips</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Hashtags automatically start with #</li>
            <li>Only letters, numbers, and underscores allowed</li>
            <li>Minimum 2 characters after #</li>
          </ul>
        </div>
      </form>

      {hashtags.length > 0 && !isLoading && (
        <div className="flex justify-end">
          <button
            onClick={() => onUpdateHashtags([])}
            className="text-sm text-red-500 hover:text-red-400"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
};

export default HashtagManager;
