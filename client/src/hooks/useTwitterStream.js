import React, { useState, useEffect, useRef } from 'react';

const trimTrailingSlash = (value = '') => value.replace(/\/$/, '');

const resolveApiBaseUrl = () => {
  const fromEnv = trimTrailingSlash(process.env.REACT_APP_API_BASE_URL || '');
  if (fromEnv) {
    return fromEnv;
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:5000`;
    }
  }

  return '';
};

const API_BASE_URL = resolveApiBaseUrl();

const resolveStreamUrl = () => {
  const fromEnv = trimTrailingSlash(process.env.REACT_APP_STREAM_URL || '');
  if (fromEnv) {
    return fromEnv;
  }

  if (API_BASE_URL) {
    return `${API_BASE_URL}/api/stream`;
  }

  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/stream`;
  }

  return '/api/stream';
};

const STREAM_URL = resolveStreamUrl();

const buildApiUrl = (path) => {
  if (!path.startsWith('/')) {
    throw new Error('API path must start with "/"');
  }

  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
};

const useTwitterStream = () => {
  console.log('[Hook] useTwitterStream hook initialized');
  const [tweets, setTweets] = useState([]);
  const [hashtags, setHashtags] = useState([]);
  const [streamStatus, setStreamStatus] = useState({
    isConnected: false,
    reconnectAttempts: 0
  });
  const [connectedClients, setConnectedClients] = useState(0);
  const [settings, setSettings] = useState({
    languages: ['en', 'de'],
    includeRetweets: false,
    testMode: false
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  // Fetch initial status and hashtags
  useEffect(() => {
    fetchInitialData();
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchInitialData = async () => {
    try {
      const [statusResponse, hashtagsResponse] = await Promise.all([
        fetch(buildApiUrl('/api/stream/status')),
        fetch(buildApiUrl('/api/hashtags'))
      ]);

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setStreamStatus(statusData.stream);
        setConnectedClients(statusData.connectedClients);
        if (statusData.settings) {
          setSettings(statusData.settings);
        }

        // Auto-connect to SSE if stream is already running on server
        if (statusData.stream?.isConnected) {
          connectStream();
        }
      }

      if (hashtagsResponse.ok) {
        const hashtagsData = await hashtagsResponse.json();
        setHashtags(hashtagsData.hashtags);
      }
    } catch (err) {
      console.error('Failed to fetch initial data:', err);
      setError('Failed to fetch initial data');
    }
  };

  const connectStream = () => {
    console.log('[SSE] connectStream() called');
    if (eventSourceRef.current) {
      console.log('[SSE] Closing existing EventSource');
      eventSourceRef.current.close();
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // EventSource doesn't work well with CRA proxy, connect directly
    const streamUrl = STREAM_URL;
    console.log('[SSE] Creating new EventSource for', streamUrl);
    const eventSource = new EventSource(streamUrl);
    eventSourceRef.current = eventSource;
    console.log('[SSE] EventSource created, readyState:', eventSource.readyState, '(0=CONNECTING, 1=OPEN, 2=CLOSED)');

    eventSource.onopen = () => {
      console.log('[SSE] Connection opened successfully, readyState:', eventSource.readyState);
      setError(null);
      reconnectAttemptsRef.current = 0;
    };

    eventSource.onmessage = (event) => {
      try {
        console.log('[SSE] Received message:', event.data);
        const data = JSON.parse(event.data);
        console.log('[SSE] Parsed message type:', data.type);
        
        switch (data.type) {
          case 'connection':
            setStreamStatus(prev => ({
              ...prev,
              isConnected: data.status === 'connected'
            }));
            if (data.connectedClients !== undefined) {
              setConnectedClients(data.connectedClients);
            }
            if (data.settings) {
              setSettings(data.settings);
            }
            break;

          case 'settings':
            if (data.settings) {
              setSettings(data.settings);
            }
            break;

          case 'tweet':
            console.log('[SSE] Received tweet message');
            console.log('[SSE] Full data object:', JSON.stringify(data, null, 2));
            console.log('[SSE] Tweet data.data:', JSON.stringify(data.data, null, 2));
            console.log('[SSE] Adding tweet to state:', data.data);
            setTweets(prev => {
              const next = [data.data, ...prev];
              console.log('[SSE] Updated tweets array - previous length:', prev.length, 'new length:', next.length);
              console.log('[SSE] First tweet in array:', next[0]);
              return next.slice(0, 200);
            });
            break;

          case 'error':
            setError(data.error);
            break;
            
          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (err) {
        console.error('Error parsing SSE message:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('[SSE] Connection error:', err);
      console.log('[SSE] EventSource readyState:', eventSource.readyState);
      console.log('[SSE] EventSource URL:', eventSource.url);
      
      // Log more details about the error
      if (eventSource.readyState === EventSource.CLOSED) {
        console.error('[SSE] Connection closed by server');
      } else if (eventSource.readyState === EventSource.CONNECTING) {
        console.error('[SSE] Connection failed, will retry');
      }
      
      setStreamStatus(prev => ({
        ...prev,
        isConnected: false
      }));

      reconnectAttemptsRef.current += 1;
      const backoff = Math.min(5000 * Math.pow(2, reconnectAttemptsRef.current - 1), 60000);

      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('Attempting to reconnect SSE...');
        connectStream();
      }, backoff);
    };

    return eventSource;
  };

  const startStream = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[Stream] Sending start request to /api/stream/start');
      const response = await fetch(buildApiUrl('/api/stream/start'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      console.log('[Stream] Response status:', response.status);
      console.log('[Stream] Response headers:', response.headers);
      
      // Get the raw text first to see what we're receiving
      const text = await response.text();
      console.log('[Stream] Raw response text:', text);
      
      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        console.error('[Stream] Failed to parse JSON:', parseErr);
        console.error('[Stream] Response was:', text);
        throw new Error('Server returned invalid response: ' + text.substring(0, 100));
      }
      
      console.log('[Stream] Response data:', data);

      if (response.ok) {
        console.log('[Stream] Stream started successfully');
        // Clear tweets and fetch backfill before starting SSE connection
        clearTweets();
        await fetchBackfillTweets(); // Fetch about 20 recent tweets
        connectStream();
        fetchInitialData(); // Refresh status
      } else {
        console.error('[Stream] Failed to start stream:', data);
        setError(data.error || 'Failed to start stream');
      }
    } catch (err) {
      console.error('[Stream] Error starting stream:', err);
      setError('Failed to start stream: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const stopStream = async () => {
    setIsLoading(true);
    
    try {
      // Close SSE connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      // Clear reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      // Stop stream on server
      const response = await fetch(buildApiUrl('/api/stream/stop'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        fetchInitialData(); // Refresh status
        clearTweets();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to stop stream');
      }
    } catch (err) {
      console.error('Error stopping stream:', err);
      setError('Failed to stop stream');
    } finally {
      setIsLoading(false);
    }
  };

  const addHashtag = async (hashtag) => {
    try {
      const response = await fetch('/api/hashtags/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hashtag }),
      });

      const data = await response.json();

      if (response.ok) {
        setHashtags(data.hashtags);

        // If stream is active, restart it with new hashtags
        if (streamStatus.isConnected) {
          await stopStream();
          setTimeout(() => startStream(), 1000);
        }

        return true;
      } else {
        setError(data.error || 'Failed to add hashtag');
        return false;
      }
    } catch (err) {
      console.error('Error adding hashtag:', err);
      setError('Failed to add hashtag');
      return false;
    }
  };

  const removeHashtag = async (hashtag) => {
    try {
      const response = await fetch('/api/hashtags/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hashtag }),
      });

      const data = await response.json();

      if (response.ok) {
        setHashtags(data.hashtags);
        
        // If stream is active, restart it with new hashtags
        if (streamStatus.isConnected) {
          await stopStream();
          setTimeout(() => startStream(), 1000);
        }
        
        return true;
      } else {
        setError(data.error || 'Failed to remove hashtag');
        return false;
      }
    } catch (err) {
      console.error('Error removing hashtag:', err);
      setError('Failed to remove hashtag');
      return false;
    }
  };

  const updateHashtags = async (newHashtags) => {
    try {
      const response = await fetch('/api/hashtags/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hashtags: newHashtags }),
      });

      const data = await response.json();

      if (response.ok) {
        setHashtags(data.hashtags);
        
        // If stream is active, restart it with new hashtags
        if (streamStatus.isConnected) {
          await stopStream();
          setTimeout(() => startStream(), 1000);
        }
        
        return true;
      } else {
        setError(data.error || 'Failed to update hashtags');
        return false;
      }
    } catch (err) {
      console.error('Error updating hashtags:', err);
      setError('Failed to update hashtags');
      return false;
    }
  };

  const fetchBackfillTweets = async () => {
    try {
      console.log('[Backfill] Fetching backfill tweets');
      const response = await fetch(buildApiUrl('/api/tweets/backfill'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[Backfill] Received tweets:', data.tweets?.length || 0);
        if (data.tweets && data.tweets.length > 0) {
          setTweets(data.tweets.slice(0, 20)); // Limit to 20 tweets
        }
      } else {
        console.error('[Backfill] Failed to fetch backfill tweets:', response.statusText);
      }
    } catch (err) {
      console.error('[Backfill] Error fetching backfill tweets:', err);
    }
  };

  const clearTweets = () => {
    setTweets([]);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
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
  };
};

export default useTwitterStream;
