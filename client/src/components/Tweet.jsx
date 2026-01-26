import React, { useState } from 'react';

const Tweet = ({ tweet }) => {
  const [expanded, setExpanded] = useState(false);

  // Debug log
  console.log('[Tweet Component] Rendering tweet:', tweet);

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

  const formatText = (text) => {
    let formattedText = text;
    formattedText = formattedText.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="highlight">$1</a>'
    );
    formattedText = formattedText.replace(/#(\w+)/g, '<span class="highlight">#$1</span>');
    formattedText = formattedText.replace(/@(\w+)/g, '<span class="highlight">@$1</span>');
    return formattedText;
  };

  const isLongText = tweet.text && tweet.text.length > 280;
  const metrics = tweet.publicMetrics || { reply_count: 0, retweet_count: 0, like_count: 0 };

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
              {isLongText && !expanded ? (
                <div>
                  <span
                    dangerouslySetInnerHTML={{ __html: formatText(`${tweet.text.substring(0, 280)}…`) }}
                  />
                  <button
                    onClick={() => setExpanded(true)}
                    className="ml-1 text-xs uppercase tracking-wide accent font-semibold"
                  >
                    Show more
                  </button>
                </div>
              ) : (
                <div>
                  <span dangerouslySetInnerHTML={{ __html: formatText(tweet.text) }} />
                  {isLongText && expanded && (
                    <button
                      onClick={() => setExpanded(false)}
                      className="ml-1 text-xs uppercase tracking-wide accent font-semibold"
                    >
                      Show less
                    </button>
                  )}
                </div>
              )}
            </div>

            {tweet.entities?.media?.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {tweet.entities.media.map((media, index) => (
                  <div key={index} className="rounded-xl overflow-hidden bg-black/5">
                    <img src={media.media_url_https} alt="Tweet media" className="w-full h-auto" />
                  </div>
                ))}
              </div>
            )}

            <div className="tweet-actions flex items-center justify-between pt-2 text-xs">
              <div className="flex items-center gap-6">
                <button className="icon-button flex items-center gap-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {metrics.reply_count > 0 && <span>{metrics.reply_count}</span>}
                </button>
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
    </article>
  );
};

export default Tweet;
