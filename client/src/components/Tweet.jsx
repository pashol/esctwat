import React, { useState } from 'react';

const Tweet = ({ tweet, onAddHashtag }) => {
  const [expanded, setExpanded] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(null);
  const [pendingHashtag, setPendingHashtag] = useState(null);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [isAddingHashtag, setIsAddingHashtag] = useState(false);

  // Safety checks
  if (!tweet || !tweet.author) {
    console.error('[Tweet Component] Invalid tweet data:', tweet);
    return null;
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const renderText = (text) => {
    const regex = /(https?:\/\/[^\s]+)|(#\w+)|(@\w+)/g;
    const nodes = [];
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        const segment = text.slice(lastIndex, match.index);
        nodes.push(
          <span key={`text-${key++}`}>{segment}</span>
        );
      }

      const token = match[0];

      if (token.startsWith('http')) {
        nodes.push(
          <a
            key={`link-${key++}`}
            href={token}
            target="_blank"
            rel="noopener noreferrer"
            className="highlight"
          >
            {token}
          </a>
        );
      } else if (token.startsWith('#')) {
        if (onAddHashtag) {
          nodes.push(
            <button
              key={`hash-${key++}`}
              type="button"
              className="hashtag-link highlight"
              onClick={() => handleHashtagClick(token)}
            >
              {token}
            </button>
          );
        } else {
          nodes.push(
            <span key={`hash-${key++}`} className="highlight">{token}</span>
          );
        }
      } else if (token.startsWith('@')) {
        nodes.push(
          <span key={`mention-${key++}`} className="highlight">{token}</span>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      nodes.push(
        <span key={`text-${key++}`}>{text.slice(lastIndex)}</span>
      );
    }

    return nodes;
  };

  const handleHashtagClick = (token) => {
    const normalized = token.startsWith('#') ? token : `#${token}`;
    setPendingHashtag(normalized);
    setIsConfirmVisible(true);
  };

  const closeHashtagDialog = () => {
    setIsConfirmVisible(false);
    setPendingHashtag(null);
    setIsAddingHashtag(false);
  };

  const confirmAddHashtag = async () => {
    if (!pendingHashtag || !onAddHashtag) {
      closeHashtagDialog();
      return;
    }

    setIsAddingHashtag(true);
    try {
      await onAddHashtag(pendingHashtag, { keepFeed: true });
    } finally {
      closeHashtagDialog();
    }
  };

  const isLongText = tweet.text && tweet.text.length > 280;
  const metrics = tweet.publicMetrics || { reply_count: 0, retweet_count: 0, like_count: 0 };
  const displayedText = isLongText && !expanded ? tweet.text.substring(0, 280) : tweet.text;
  const shouldShowEllipsis = isLongText && !expanded;

  return (
    <article className="tweet-card tweet-enter">
      <div className="p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {tweet.author.profileImageUrl ? (
              <img
                src={tweet.author.profileImageUrl}
                alt={tweet.author.name}
                className="w-12 h-12 rounded-2xl shadow"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${tweet.author.name}&background=2563EB&color=fff&size=48`;
                }}
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl accent-bg flex items-center justify-center font-semibold">
                {tweet.author.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold tweet-author">{tweet.author.name}</span>
              <span className="tweet-author-secondary">@{tweet.author.username}</span>
              <span className="tweet-author-secondary">· {formatTimestamp(tweet.createdAt)}</span>
              <span className="tweet-lang">{tweet.lang?.toUpperCase() || '—'}</span>
            </div>

             <div className="tweet-body whitespace-pre-wrap">
               <div>
                 {renderText(displayedText)}
                 {shouldShowEllipsis && <span>…</span>}
               </div>
               {isLongText && (
                 <button
                   onClick={() => setExpanded(prev => !prev)}
                   className="ml-1 text-xs uppercase tracking-wide accent font-semibold"
                 >
                   {expanded ? 'Show less' : 'Show more'}
                 </button>
               )}
             </div>

            {tweet.media?.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {tweet.media.map((media, index) => {
                  if (media.type === 'photo' && media.url) {
                    return (
                      <button
                        key={media.mediaKey || index}
                        type="button"
                        className="rounded-xl overflow-hidden bg-black/5 focus:outline-none"
                        onClick={() => setActiveMediaIndex(index)}
                      >
                        <img src={media.url} alt={media.altText || 'Tweet media'} className="w-full h-auto" loading="lazy" />
                      </button>
                    );
                  }

                  if ((media.type === 'video' || media.type === 'animated_gif') && media.variants?.length) {
                    const videoVariant = media.variants.find(variant => variant.content_type === 'video/mp4' && variant.url);
                    if (!videoVariant) {
                      return null;
                    }
                    return (
                      <div key={media.mediaKey || index} className="rounded-xl overflow-hidden bg-black/5">
                        <video controls muted playsInline className="w-full h-auto" poster={media.previewImageUrl || undefined}>
                          <source src={videoVariant.url} type={videoVariant.content_type} />
                        </video>
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            )}

            <div className="tweet-actions flex items-center justify-between pt-2 text-xs">
              <div className="flex items-center gap-6">
                <a
                  href={tweet.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="icon-button flex items-center gap-1"
                  aria-label="Open original tweet"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {metrics.reply_count > 0 && <span>{metrics.reply_count}</span>}
                </a>
                <button className="icon-button flex items-center gap-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {metrics.retweet_count > 0 && <span>{metrics.retweet_count}</span>}
                </button>
                <button className="icon-button flex items-center gap-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {metrics.like_count > 0 && <span>{metrics.like_count}</span>}
                </button>
              </div>
              <button className="icon-button">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m9.032 4.026A9.001 9.001 0 0021 12c0-.474-.04-.937-.116-1.384" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      {activeMediaIndex !== null && tweet.media?.[activeMediaIndex] && (
        <div className="tweet-media-modal" role="dialog" aria-modal="true">
          <div className="tweet-media-modal__backdrop" onClick={() => setActiveMediaIndex(null)} />
          <div className="tweet-media-modal__content">
            <button
              type="button"
              className="tweet-media-modal__close"
              onClick={() => setActiveMediaIndex(null)}
              aria-label="Close media viewer"
            >
              ×
            </button>
            {tweet.media[activeMediaIndex].type === 'photo' && tweet.media[activeMediaIndex].url ? (
              <img
                src={tweet.media[activeMediaIndex].url}
                alt={tweet.media[activeMediaIndex].altText || 'Tweet media'}
              />
            ) : null}
          </div>
        </div>
      )}
      {isConfirmVisible && (
        <div className="tweet-confirm-modal" role="dialog" aria-modal="true">
          <div className="tweet-confirm-modal__backdrop" onClick={closeHashtagDialog} />
          <div className="tweet-confirm-modal__content">
            <h3>Add Hashtag</h3>
            <p>Do you want to add {pendingHashtag} to the monitored hashtags?</p>
            <div className="tweet-confirm-modal__actions">
              <button type="button" className="confirm-button cancel" onClick={closeHashtagDialog} disabled={isAddingHashtag}>
                Cancel
              </button>
              <button type="button" className="confirm-button confirm" onClick={confirmAddHashtag} disabled={isAddingHashtag}>
                {isAddingHashtag ? 'Adding…' : 'Add hashtag'}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
};

export default Tweet;
