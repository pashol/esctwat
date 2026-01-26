const { TwitterApi } = require('twitter-api-v2');

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
    console.log('Twitter API client initialized');
    return true;
  }

  async startStreaming(hashtags, onTweet, onError, options = {}) {
    if (!this.client) {
      this.initialize();
    }

    try {
      // Since filtered stream requires OAuth 1.0a, we'll use search polling instead
      console.log('Starting search polling for hashtags:', hashtags);
      this.isConnected = true;
      this.reconnectAttempts = 0;

      // Start polling instead of streaming
      await this.startPolling(hashtags, onTweet, onError, options);
      console.log('Search polling started successfully');
      return true;

    } catch (error) {
      console.error('Failed to start Twitter search:', error);
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
      console.log(`[Poll] Starting poll cycle. isConnected: ${this.isConnected}, lastSeenId: ${lastSeenId}`);
      if (!this.isConnected) {
        console.log('[Poll] Skipping poll - not connected');
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
          'tweet.fields': ['author_id', 'created_at', 'public_metrics', 'lang', 'entities'],
          'user.fields': ['username', 'name', 'profile_image_url'],
          'expansions': ['author_id'],
          'max_results': 50,
          'sort_order': 'recency'
        };

        if (lastSeenId) {
          searchParams.since_id = lastSeenId;
        }

        const response = await this.client.v2.search(query, searchParams);

        const tweets = response.data?.data || [];
        const includes = response.data?.includes || {};
        console.log(`[Poll] Received ${tweets.length} tweets`);

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
          console.log(`[Poll] Scheduling next poll in ${pollInterval}ms`);
          this.pollTimeout = setTimeout(poll, pollInterval);
        } else {
          console.log('[Poll] Not scheduling next poll - disconnected');
        }

      } catch (error) {
        console.error('Search polling error:', error);
        const statusCode = error.code || error.status;

        if (statusCode === 401 || statusCode === 403) {
          onError(error);
          this.isConnected = false;
          return;
        }

        if (statusCode === 429) {
          const retryAfter = Number(error.rateLimit?.resetIn) || 60;
          console.warn(`Rate limited. Retrying in ${retryAfter} seconds.`);
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
      console.log('Testing Bearer Token...');
      this.initialize();
      const response = await this.client.v2.me();
      console.log('Bearer Token is valid. User:', response.data.username);
      return true;
    } catch (error) {
      console.error('Bearer Token test failed:', error.message);
      if (error.code === 401) {
        throw new Error('Invalid or expired Bearer Token. Please check your TWITTER_BEARER_TOKEN in .env file');
      }
      if (error.code === 403) {
        console.warn('Bearer Token has limited permissions. Using search polling instead of streaming.');
        return true;
      }
      throw error;
    }
  }

  async clearStreamRules() {
    // Not needed for polling
    console.log('Clear rules not needed for polling approach');
  }

  async addStreamRules(hashtags) {
    // Not needed for polling
    console.log('Stream rules not needed for polling. Hashtags:', hashtags);
  }

  async handleReconnection(hashtags, onTweet, onError) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay / 1000} seconds (attempt ${this.reconnectAttempts})`);
    
    setTimeout(async () => {
      try {
        await this.startStreaming(hashtags, onTweet, onError);
      } catch (error) {
        console.error('Reconnection failed:', error);
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
    console.log('Twitter search polling stopped');
  }

  async fetchRecentTweets(hashtags, count = 20, options = {}) {
    if (!this.client) {
      this.initialize();
    }

    try {
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
        'tweet.fields': ['author_id', 'created_at', 'public_metrics', 'lang', 'entities'],
        'user.fields': ['username', 'name', 'profile_image_url'],
        'expansions': ['author_id'],
        'max_results': Math.min(count, 100), // Twitter API limit is 100
        'sort_order': 'relevance'
      };

      const response = await this.client.v2.search(query, searchParams);
      
      const tweets = response.data?.data || [];
      const includes = response.data?.includes || {};

      console.log(`[Backfill] Fetched ${tweets.length} recent tweets`);

      // Format tweets the same way as in polling
      return tweets.map(tweet => ({
        data: tweet,
        includes
      }));

    } catch (error) {
      console.error('Error fetching recent tweets:', error);
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
