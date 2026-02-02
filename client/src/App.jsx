import { useState, useEffect } from 'react';
import Header from './components/Header';
import Tweet from './components/Tweet';
import HashtagManager from './components/HashtagManager';
import StreamStatus from './components/StreamStatus';
import StreamSettings from './components/StreamSettings';
import useTwitterStream from './hooks/useTwitterStream';
import './styles/globals.css';
import NotificationContainer from './components/notifications/NotificationContainer';

function App() {
  const [showControlCenter, setShowControlCenter] = useState(false);
  const [viewMode, setViewMode] = useState('feed'); // 'feed' | 'notifications'
  const [expandedSection, setExpandedSection] = useState(null); // 'status', 'settings', or 'hashtags'
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light';
    }
    return 'light';
  });
  
  const {
    tweets,
    hashtags,
    streamStatus,
    connectedClients,
    settings,
    error,
    isLoading,
    startStream,
    stopStream,
    addHashtag,
    removeHashtag,
    updateHashtags,
    clearTweets
  } = useTwitterStream();

  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Listen for view mode changes from Electron
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onToggleVisibility((event, mode) => {
        setViewMode(mode);
      });
    }
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const toggleSection = (section) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  const updateSettings = async (nextSettings) => {
    setIsUpdatingSettings(true);
    try {
      const response = await fetch('/api/settings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextSettings)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update settings');
      }
    } catch (err) {
      console.error('Failed to update settings:', err);
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const resetSettings = async () => {
    setIsUpdatingSettings(true);
    try {
      const response = await fetch('/api/settings/reset', {
        method: 'POST'
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset settings');
      }
    } catch (err) {
      console.error('Failed to reset settings:', err);
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const handleAddHashtag = (hashtag, options) => addHashtag(hashtag, options);

  const handleRemoveHashtag = (hashtag) => {
    removeHashtag(hashtag);
  };

  const handleUpdateHashtags = (newHashtags) => {
    updateHashtags(newHashtags);
  };

  return (
    <div className="app-shell">
      <NotificationContainer tweets={tweets} viewMode={viewMode} />
      
      <Header 
        tweetCount={tweets.length} 
        onClearTweets={clearTweets}
        onToggleControlCenter={() => setShowControlCenter(prev => !prev)}
        isControlCenterOpen={showControlCenter}
        isConnected={streamStatus.isConnected}
        viewMode={viewMode}
        onToggleView={() => setViewMode(prev => prev === 'feed' ? 'notifications' : 'feed')}
      />

      <div className={`main-content ${viewMode === 'notifications' ? 'main-content--minimal' : ''} w-full px-6 py-10 space-y-8`}>
        {/* Error Display */}
        {error && (
          <div className="surface-card surface-card--flat border border-red-200/40 text-red-500 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-semibold">Error</h3>
                <p className="mt-1 text-sm">{error}</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="ml-auto text-sm underline hover:text-red-300"
              >
                Reload
              </button>
            </div>
          </div>
        )}

        {showControlCenter && (
          <section className="control-panel space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Control Center</h2>
                <p className="text-sm text-muted">Start streams, adjust filters, and tune the experience.</p>
              </div>
              <button
                onClick={toggleTheme}
                className="theme-toggle"
              >
                {theme === 'light' ? (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414M18.364 18.364l-1.414-1.414M7.05 7.05 5.636 5.636M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
                    Light
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" /></svg>
                    Dark
                  </>
                )}
              </button>
            </div>

            {/* Accordion Sections */}
            <div className="space-y-3">
              {/* Stream Status Accordion */}
              <div className="overflow-hidden">
                <button
                  onClick={() => toggleSection('status')}
                  className="w-full flex items-center justify-between p-4 text-left bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="font-medium">Stream Status</span>
                  </div>
                  <svg 
                    className={`w-5 h-5 text-muted transition-transform ${expandedSection === 'status' ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSection === 'status' && (
                  <div className="mt-2">
                    <StreamStatus
                      status={streamStatus}
                      connectedClients={connectedClients}
                      onStartStream={startStream}
                      onStopStream={stopStream}
                      isLoading={isLoading}
                    />
                  </div>
                )}
              </div>

              {/* Settings Accordion */}
              <div className="overflow-hidden">
                <button
                  onClick={() => toggleSection('settings')}
                  className="w-full flex items-center justify-between p-4 text-left bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-medium">Settings</span>
                  </div>
                  <svg 
                    className={`w-5 h-5 text-muted transition-transform ${expandedSection === 'settings' ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSection === 'settings' && (
                  <div className="mt-2">
                    <StreamSettings
                      settings={settings}
                      onUpdate={updateSettings}
                      onReset={resetSettings}
                      isUpdating={isUpdatingSettings}
                      hashtags={hashtags}
                      tweetCount={tweets.length}
                      isConnected={streamStatus.isConnected}
                      connectedClients={connectedClients}
                    />
                  </div>
                )}
              </div>

              {/* Hashtags Accordion */}
              <div className="overflow-hidden">
                <button
                  onClick={() => toggleSection('hashtags')}
                  className="w-full flex items-center justify-between p-4 text-left bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                    <span className="font-medium">Hashtags</span>
                    <span className="text-sm text-muted">({hashtags.length})</span>
                  </div>
                  <svg 
                    className={`w-5 h-5 text-muted transition-transform ${expandedSection === 'hashtags' ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSection === 'hashtags' && (
                  <div className="mt-2">
                    <HashtagManager
                      hashtags={hashtags}
                      onAddHashtag={handleAddHashtag}
                      onRemoveHashtag={handleRemoveHashtag}
                      onUpdateHashtags={handleUpdateHashtags}
                      isLoading={isLoading}
                    />
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Tweet Feed */}
        <section className="space-y-6">
          {tweets.length === 0 ? (
            <div className="empty-state p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-twitter-dark mb-2">
                {streamStatus.isConnected ? 'Waiting for tweets...' : 'Start the stream to see tweets'}
              </h3>
              <p className="text-twitter-gray mb-4">
                {streamStatus.isConnected 
                  ? `Monitoring ${hashtags.join(', ')} hashtags in English and German`
                  : 'Click "Start Stream" to begin monitoring Eurovision-related tweets'
                }
              </p>
              {!streamStatus.isConnected && (
                <button
                  onClick={startStream}
                  disabled={isLoading}
                  className="px-6 py-2 accent-bg rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Starting…' : 'Start Stream'}
                </button>
              )}
            </div>
          ) : (
            <div className="tweet-masonry">
              {tweets.map((tweet) => (
                <Tweet key={tweet.id} tweet={tweet} onAddHashtag={handleAddHashtag} />
              ))}
            </div>
          )}
        </section>

        {/* Notification Mode Status */}
        {viewMode === 'notifications' && (
          <div className="notification-status">
            <p>Streaming tweets as notifications...</p>
            <button 
              onClick={() => setViewMode('feed')}
              className="text-sm underline"
            >
              Switch to feed view
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
