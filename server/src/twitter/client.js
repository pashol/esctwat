const { TwitterApi } = require('twitter-api-v2');
const logger = require('../logger');

class TwitterClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 5000;
    this.pollTimeout = null;
  }

  initialize() {
    const bearerToken = process.env.TWITTER_BEARER_TOKEN;
    
    if (!bearerToken) {
      throw new Error('Twitter Bearer Token is required. Set TWITTER_BEARER_TOKEN in environment variables.');
    }

    this.client = new TwitterApi(bearerToken.trim());
    logger.debug('Twitter API client initialized');
    return true;
  }

  async startStreaming(hashtags, onTweet, onError, options = {}) {
    if (!this.client) {
      this.initialize();
    }

    try {
      // Since filtered stream requires OAuth 1.0a, we'll use search polling instead
       logger.info('Starting search polling for hashtags:', hashtags);
      this.isConnected = true;
      this.reconnectAttempts = 0;

      // Start polling instead of streaming
      await this.startPolling(hashtags, onTweet, onError, options);
       logger.info('Search polling started successfully');
      return true;

    } catch (error) {
       logger.error('Failed to start Twitter search:', error);
      onError(error);
      return false;
    }
  }

  async startPolling(hashtags, onTweet, onError, options = {}) {
    const pollingIntervalSeconds = options.pollingInterval || 10;
    const pollInterval = pollingIntervalSeconds * 1000;
    let lastSeenId = null;
    this.reconnectAttempts = 0;
    const { languages = [], includeRetweets = false, testMode = false } = options;

    const poll = async () => {
       logger.debug(`[Poll] Starting poll cycle. isConnected: ${this.isConnected}, lastSeenId: ${lastSeenId}`);
      if (!this.isConnected) {
        logger.debug('[Poll] Skipping poll - not connected');
        return;
      }

      try {
        // Build search query
        const hashtagClause = hashtags.length > 1 ? `(${hashtags.join(' OR ')})` : hashtags[0];
        const parts = [hashtagClause];

        if (!testMode && languages.length > 0) {
          const normalizedLanguages = languages.map(lang => `lang:${lang}`).join(' OR ');
          parts.push(`(${normalizedLanguages})`);
        }

        if (!includeRetweets) {
          parts.push('-is:retweet');
        }

        const query = parts.join(' ');

        const searchParams = {
          'tweet.fields': ['author_id', 'created_at', 'public_metrics', 'lang', 'entities', 'attachments'],
          'user.fields': ['username', 'name', 'profile_image_url'],
          'media.fields': ['media_key', 'type', 'url', 'preview_image_url', 'duration_ms', 'width', 'height', 'alt_text', 'variants'],
          'expansions': ['author_id', 'attachments.media_keys'],
          'max_results': options.pollingLimit || 10,
          'sort_order': 'recency'
        };

        if (lastSeenId) {
          searchParams.since_id = lastSeenId;
        }

        const response = await this.client.v2.search(query, searchParams);

        const tweets = response.data?.data || [];
        const includes = response.data?.includes || {};
        logger.debug(`[Poll] Received ${tweets.length} tweets`);

        if (tweets.length) {
          const orderedTweets = [...tweets].reverse();

          for (const tweet of orderedTweets) {
            const tweetData = {
              data: tweet,
              includes
            };
            onTweet(tweetData);
          }

          const newestId = response.meta?.newest_id || response.data?.meta?.newest_id;
          if (newestId) {
            lastSeenId = newestId;
          }
        }

        if (this.isConnected) {
          logger.debug(`[Poll] Scheduling next poll in ${pollInterval}ms`);
          this.pollTimeout = setTimeout(poll, pollInterval);
        } else {
          logger.debug('[Poll] Not scheduling next poll - disconnected');
        }

      } catch (error) {
        logger.error('Search polling error:', error);
        const statusCode = error.code || error.status;

        if (statusCode === 401 || statusCode === 403) {
          onError(error);
          this.isConnected = false;
          return;
        }

        if (statusCode === 429) {
          const retryAfter = Number(error.rateLimit?.resetIn) || 60;
          logger.warn(`Rate limited. Retrying in ${retryAfter} seconds.`);
          if (this.isConnected) {
            this.pollTimeout = setTimeout(poll, retryAfter * 1000);
          }
          return;
        }

        this.reconnectAttempts += 1;
        const backoffDelay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 60000);
        if (this.isConnected) {
          this.pollTimeout = setTimeout(poll, backoffDelay);
        }
      }
    };

    // Start first poll
    await poll();
  }

  async testBearerToken() {
    try {
      logger.debug('Testing Bearer Token...');
      this.initialize();
      const response = await this.client.v2.me();
      logger.info('Bearer Token is valid. User:', response.data.username);
      return true;
    } catch (error) {
      logger.error('Bearer Token test failed:', error.message);
      if (error.code === 401) {
        throw new Error('Invalid or expired Bearer Token. Please check your TWITTER_BEARER_TOKEN in .env file');
      }
      if (error.code === 403) {
        logger.warn('Bearer Token has limited permissions. Using search polling instead of streaming.');
        return true;
      }
      throw error;
    }
  }

  async clearStreamRules() {
    // Not needed for polling
    logger.debug('Clear rules not needed for polling approach');
  }

  async addStreamRules(hashtags) {
    // Not needed for polling
    logger.debug('Stream rules not needed for polling. Hashtags:', hashtags);
  }

  async handleReconnection(hashtags, onTweet, onError) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    logger.warn(`Attempting to reconnect in ${delay / 1000} seconds (attempt ${this.reconnectAttempts})`);
    
    setTimeout(async () => {
      try {
        await this.startStreaming(hashtags, onTweet, onError);
      } catch (error) {
        logger.error('Reconnection failed:', error);
        this.handleReconnection(hashtags, onTweet, onError);
      }
    }, delay);
  }

  stopStreaming() {
    this.isConnected = false;
    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout);
      this.pollTimeout = null;
    }
    logger.info('Twitter search polling stopped');
  }

  async fetchRecentTweets(hashtags, count = 10, options = {}) {
    if (!this.client) {
      this.initialize();
    }

    try {
      // If count is 0, return empty array immediately (backfill disabled)
      if (count === 0) {
        return [];
      }

      const { languages = [], includeRetweets = false, testMode = false } = options;
      
      // Build search query
      const hashtagClause = hashtags.length > 1 ? `(${hashtags.join(' OR ')})` : hashtags[0];
      const parts = [hashtagClause];

      if (!testMode && languages.length > 0) {
        const normalizedLanguages = languages.map(lang => `lang:${lang}`).join(' OR ');
        parts.push(`(${normalizedLanguages})`);
      }

      if (!includeRetweets) {
        parts.push('-is:retweet');
      }

      const query = parts.join(' ');

       const searchParams = {
         'tweet.fields': ['author_id', 'created_at', 'public_metrics', 'lang', 'entities', 'attachments'],
         'user.fields': ['username', 'name', 'profile_image_url'],
         'media.fields': ['media_key', 'type', 'url', 'preview_image_url', 'duration_ms', 'width', 'height', 'alt_text', 'variants'],
         'expansions': ['author_id', 'attachments.media_keys'],
         'max_results': Math.min(count, 100), // Twitter API limit is 100
         'sort_order': 'recency'
       };

      const response = await this.client.v2.search(query, searchParams);

      const tweets = response.data?.data || [];
      const includes = response.data?.includes || {};

      logger.debug(`[Backfill] Fetched ${tweets.length} recent tweets`);

      // Format tweets the same way as in polling
      return tweets.map(tweet => ({
        data: tweet,
        includes
      }));

    } catch (error) {
      logger.error('Error fetching recent tweets:', error);
      throw error;
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

module.exports = TwitterClient;
