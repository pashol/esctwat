const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const TwitterClient = require('./twitter/client');
const HashtagFilter = require('./twitter/filters');
const streamSettings = require('./settings');
const logger = require('./logger');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
let server = null;

// Initialize Twitter client and hashtag filter
const twitterClient = new TwitterClient();
const hashtagFilter = new HashtagFilter();

// Store SSE connections
const connections = new Set();

const emitSettingsChange = () => {
  const payload = `data: ${JSON.stringify({
    type: 'settings',
    settings: streamSettings.getSettings()
  })}\n\n`;

  connections.forEach(client => {
    try {
      client.write(payload);
    } catch (error) {
      logger.error('Error broadcasting settings update:', error);
      connections.delete(client);
    }
  });
};

const buildConnectionPayload = (status) => ({
  type: 'connection',
  status,
  connectedClients: connections.size,
  settings: streamSettings.getSettings()
});

const broadcastConnectionUpdate = () => {
  const payload = `data: ${JSON.stringify(
    buildConnectionPayload(connections.size > 0 ? 'connected' : 'stopped')
  )}\n\n`;

  connections.forEach(client => {
    try {
      client.write(payload);
    } catch (error) {
      logger.error('Error broadcasting connection update:', error);
      connections.delete(client);
    }
  });
};

// Middleware
app.use(cors());
app.use(express.json());

// Twitter route handlers
const streamRoutes = express.Router();
const hashtagRoutes = express.Router();
const settingsRoutes = express.Router();
const tweetsRoutes = express.Router();

// SSE endpoint for real-time tweet streaming
streamRoutes.get('/', (req, res) => {
  logger.debug('New SSE connection established');

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }
  req.socket.setNoDelay(true);

  // Add connection to the set
  connections.add(res);

  // Send initial connection message
  const initialPayload = buildConnectionPayload('connected');
  logger.debug('[SSE] Sending initial connection message to new client:', initialPayload);
  res.write(`data: ${JSON.stringify(initialPayload)}\n\n`);
  
  // Send a test heartbeat every 5 seconds to verify connection is alive
  const heartbeatInterval = setInterval(() => {
    try {
      logger.debug('[SSE] Sending heartbeat to client');
      res.write(`:heartbeat\n\n`);
    } catch (error) {
      logger.error('[SSE] Heartbeat failed:', error);
      clearInterval(heartbeatInterval);
      connections.delete(res);
    }
  }, 5000);

  broadcastConnectionUpdate();

  // Handle client disconnect
  req.on('close', () => {
    logger.info('[SSE] Connection closed by client');
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    connections.delete(res);
    broadcastConnectionUpdate();
  });

  req.on('error', (err) => {
    logger.error('[SSE] Connection error:', err);
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    connections.delete(res);
    broadcastConnectionUpdate();
  });
});

// Get stream status
streamRoutes.get('/status', (req, res) => {
  const status = twitterClient.getConnectionStatus();
  const stats = hashtagFilter.getStats();
  
  res.json({
    stream: status,
    hashtags: stats,
    connectedClients: connections.size,
    settings: streamSettings.getSettings()
  });
});

// Start/stop streaming
streamRoutes.post('/start', async (req, res) => {
  try {
    const hashtags = hashtagFilter.getHashtags();

    if (!hashtags.length) {
      return res.status(400).json({
        success: false,
        error: 'At least one hashtag is required before starting the stream'
      });
    }

    const onTweet = (tweetData) => {
      logger.debug('[Broadcast] Received tweet to broadcast, connections:', connections.size);
      logger.debug('[Broadcast] Raw tweet data:', JSON.stringify(tweetData, null, 2));
      const tweet = formatTweetData(tweetData);

      if (!tweet) {
        logger.debug('[Broadcast] formatTweetData returned null, skipping');
        return;
      }

      logger.debug('[Broadcast] Formatted tweet:', JSON.stringify(tweet, null, 2));
      logger.debug('[Broadcast] Broadcasting tweet to', connections.size, 'clients');
      const payload = { type: 'tweet', data: tweet };
      logger.debug('[Broadcast] SSE payload:', JSON.stringify(payload));
      connections.forEach(client => {
        try {
          client.write(`data: ${JSON.stringify(payload)}\n\n`);
          logger.debug('[Broadcast] Successfully wrote to client');
        } catch (error) {
          logger.error('Error sending tweet to client:', error);
          connections.delete(client);
        }
      });
    };

    const onError = (error) => {
      logger.error('Search error:', error);
      connections.forEach(client => {
        try {
          client.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
        } catch (err) {
          logger.error('Error sending error to client:', err);
          connections.delete(client);
        }
      });
    };

    const success = await twitterClient.startStreaming(
      hashtags,
      onTweet,
      onError,
      streamSettings.getSettings()
    );

    if (success) {
      res.json({
        success: true,
        message: 'Search polling started (due to API limitations)',
        hashtags
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to start search polling'
      });
    }
  } catch (error) {
    logger.error('Error starting stream:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

streamRoutes.post('/stop', (req, res) => {
  twitterClient.stopStreaming();

  // Send stop notification to all clients
  broadcastConnectionUpdate();

  res.json({ success: true, message: 'Search polling stopped' });
});

// Hashtag management endpoints
hashtagRoutes.get('/', (req, res) => {
  res.json({ hashtags: hashtagFilter.getHashtags() });
});

hashtagRoutes.post('/add', (req, res) => {
  const { hashtag } = req.body;
  
  if (!hashtag) {
    return res.status(400).json({ error: 'Hashtag is required' });
  }

  const addedHashtag = hashtagFilter.addHashtag(hashtag);

  if (addedHashtag) {
    res.json({ 
      success: true, 
      hashtag: addedHashtag,
      hashtags: hashtagFilter.getHashtags()
    });
  } else {
    res.status(400).json({ 
      error: 'Invalid hashtag or already exists',
      hashtag: hashtag
    });
  }
});

hashtagRoutes.post('/remove', (req, res) => {
  const { hashtag } = req.body;
  
  if (!hashtag) {
    return res.status(400).json({ error: 'Hashtag is required' });
  }

  const cleaned = hashtagFilter.cleanHashtag(hashtag);
  if (!cleaned) {
    return res.status(400).json({ error: 'Invalid hashtag', hashtag });
  }

  const removed = hashtagFilter.removeHashtag(cleaned);
  
  if (removed) {
    res.json({ 
      success: true, 
      hashtag: cleaned,
      hashtags: hashtagFilter.getHashtags()
    });
  } else {
    res.status(404).json({ 
      error: 'Hashtag not found',
      hashtag: cleaned
    });
  }
});

hashtagRoutes.post('/update', (req, res) => {
  const { hashtags } = req.body;
  
  if (!Array.isArray(hashtags)) {
    return res.status(400).json({ error: 'Hashtags must be an array' });
  }

  const updatedHashtags = hashtagFilter.updateHashtags(hashtags);

  if (!updatedHashtags) {
    return res.status(400).json({
      success: false,
      error: 'At least one valid hashtag is required'
    });
  }
  
  res.json({ 
    success: true, 
    hashtags: updatedHashtags
  });
});

hashtagRoutes.post('/reset', (req, res) => {
  const defaultHashtags = hashtagFilter.resetToDefaults();
  res.json({ 
    success: true, 
    hashtags: defaultHashtags
  });
});

// Settings endpoints
settingsRoutes.get('/', (req, res) => {
  res.json({ settings: streamSettings.getSettings() });
});

settingsRoutes.post('/update', async (req, res) => {
  const { languages, includeRetweets, testMode, pollingInterval } = req.body;
  const updated = streamSettings.updateSettings({ languages, includeRetweets, testMode, pollingInterval });
  emitSettingsChange();
  
  // If stream is running and polling interval changed, restart it to apply new interval
  const streamStatus = twitterClient.getConnectionStatus();
  if (streamStatus.isConnected && pollingInterval) {
    const hashtags = hashtagFilter.getHashtags();
    if (hashtags.length > 0) {
       logger.info('[Settings] Restarting stream to apply new polling interval');
      twitterClient.stopStreaming();
      
      // Give it a moment to stop
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const onTweet = (tweetData) => {
        const tweet = formatTweetData(tweetData);
        if (!tweet) return;
        
        const payload = { type: 'tweet', data: tweet };
        connections.forEach(client => {
          try {
            client.write(`data: ${JSON.stringify(payload)}\n\n`);
          } catch (error) {
            logger.error('Error sending tweet to client:', error);
            connections.delete(client);
          }
        });
      };
      
      const onError = (error) => {
        logger.error('Search error:', error);
        connections.forEach(client => {
          try {
            client.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
          } catch (err) {
            logger.error('Error sending error to client:', err);
            connections.delete(client);
          }
        });
      };
      
      await twitterClient.startStreaming(hashtags, onTweet, onError, updated);
    }
  }
  
  broadcastConnectionUpdate();
  res.json({ settings: updated });
});

settingsRoutes.post('/reset', (req, res) => {
  const settings = streamSettings.reset();
  emitSettingsChange();
  broadcastConnectionUpdate();
  res.json({ settings });
});

// Tweets endpoints
tweetsRoutes.get('/backfill', async (req, res) => {
  try {
    const hashtags = hashtagFilter.getHashtags();
    
    if (!hashtags.length) {
      return res.json({ tweets: [] });
    }

    const settings = streamSettings.getSettings();
    
    // Fetch recent tweets using the existing Twitter client
    const onTweet = () => {}; // No-op for backfill
    const onError = () => {}; // No-op for backfill
    
    const tweets = await twitterClient.fetchRecentTweets(
      hashtags,
      20, // Fetch 20 tweets for backfill
      settings
    );
    const formattedTweets = (tweets || [])
      .map(formatTweetData)
      .filter(Boolean);

    res.json({ tweets: formattedTweets });
  } catch (error) {
    logger.error('Error fetching backfill tweets:', error);
    res.status(500).json({ error: 'Failed to fetch backfill tweets' });
  }
});

// Helper function to format tweet data
function formatTweetData(tweetData) {
  if (!tweetData || !tweetData.data) {
    return null;
  }

  const tweet = tweetData.data;
  const users = tweetData.includes?.users || [];
  const mediaIncludes = tweetData.includes?.media || [];
  const author = users.find(user => user.id === tweet.author_id);
  const mediaMap = new Map(mediaIncludes.map(media => [media.media_key, media]));

  let media = [];
  if (tweet.attachments?.media_keys?.length) {
    media = tweet.attachments.media_keys
      .map(key => mediaMap.get(key))
      .filter(Boolean)
      .map(item => ({
        mediaKey: item.media_key,
        type: item.type,
        url: item.url || item.preview_image_url || null,
        previewImageUrl: item.preview_image_url || null,
        durationMs: item.duration_ms || null,
        width: item.width || null,
        height: item.height || null,
        altText: item.alt_text || null,
        variants: item.variants || null
      }));
  }

  const entities = tweet.entities || {};
  if (media.length) {
    entities.media = media;
  }

  return {
    id: tweet.id,
    url: `https://twitter.com/${author?.username || 'i'}/status/${tweet.id}`,
    text: tweet.text,
    author: {
      id: tweet.author_id,
      username: author?.username || 'unknown',
      name: author?.name || 'Unknown User',
      profileImageUrl: author?.profile_image_url || null
    },
    createdAt: tweet.created_at,
    language: tweet.lang,
    publicMetrics: tweet.public_metrics || {},
    entities,
    media,
    lang: tweet.lang
  };
}

// Mount routes
app.use('/api/stream', streamRoutes);
app.use('/api/hashtags', hashtagRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/tweets', tweetsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    connectedClients: connections.size
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
    logger.error('Unhandled error:', error);
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ error: 'Internal server error' });
  } else {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Start server
const startServer = (port = PORT) => {
  if (server) {
    return server;
  }

  server = app.listen(port, () => {
    logger.info(`Eurovision Twitter Monitor server running on port ${port}`);
    logger.info(`SSE endpoint: http://localhost:${port}/api/stream`);
    logger.info(`Health check: http://localhost:${port}/health`);

    // Initialize Twitter client
    try {
      twitterClient.initialize();
      logger.info('Twitter client initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Twitter client:', error.message);
    }
  });

  return server;
};

const stopServer = () => {
  if (!server) {
    return;
  }

  server.close(() => {
    logger.info('HTTP server closed');
  });
  server = null;
};

// Graceful shutdown
const shutdown = (signal) => {
  logger.warn(`${signal} received, shutting down gracefully`);
  twitterClient.stopStreaming();
  connections.forEach(client => client.end());
  if (server) {
    server.close(() => {
      process.exit(0);
    });
  } else {
    process.exit(0);
  }

  setTimeout(() => {
    logger.warn('Force exiting after graceful shutdown timeout');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

if (require.main === module) {
  startServer();
}

module.exports = {
  app,
  startServer,
  stopServer,
  connections
};
