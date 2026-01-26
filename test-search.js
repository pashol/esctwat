const path = require('path');

// Try to load dotenv
let dotenv;
try {
  dotenv = require('dotenv');
} catch (e) {
  console.error('❌ dotenv not found. Please run: npm install');
  process.exit(1);
}

dotenv.config({ path: path.join(__dirname, 'server', '.env') });

const { TwitterApi } = require('twitter-api-v2');

async function testSearch() {
  try {
    console.log('🔍 Testing Twitter search API...');
    console.log('Token length:', process.env.TWITTER_BEARER_TOKEN?.length);
    
    if (!process.env.TWITTER_BEARER_TOKEN) {
      console.error('❌ No Bearer Token found in server/.env');
      process.exit(1);
    }
    
    if (process.env.TWITTER_BEARER_TOKEN.includes('YOUR_BEARER_TOKEN_HERE')) {
      console.error('❌ Please replace placeholder token with your actual token');
      process.exit(1);
    }
    
    const client = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);
    
    // Test search query
    const query = '#Eurovision lang:en lang:de -is:retweet';
    console.log('📝 Query:', query);
    
    const response = await client.v2.search(query, {
      'tweet.fields': ['author_id', 'created_at', 'public_metrics', 'lang', 'entities'],
      'user.fields': ['username', 'name', 'profile_image_url'],
      'expansions': ['author_id'],
      'max_results': 5
    });
    
    console.log('📊 Response structure:', {
      hasData: !!response.data,
      hasDataData: !!response.data?.data,
      dataLength: response.data?.data?.length || 0,
      meta: response.meta
    });
    
    if (response.data?.data && response.data.data.length > 0) {
      console.log('✅ Tweets found:', response.data.data.length);
      const tweet = response.data.data[0];
      console.log('🐦 Sample tweet ID:', tweet.id);
      console.log('🐦 Sample tweet text:', tweet.text?.substring(0, 100) + '...');
      
      if (response.data.includes?.users) {
        console.log('👤 Users included:', response.data.includes.users.length);
      }
    } else {
      console.log('❌ No tweets found with current query');
      
      // Try broader search
      console.log('🔄 Trying broader search...');
      const broadResponse = await client.v2.search('Eurovision', {
        'max_results': 2
      });
      
      console.log('📊 Broad search results:', broadResponse.data?.data?.length || 0);
      if (broadResponse.data?.data?.length > 0) {
        console.log('✅ Broader search works');
        console.log('🐦 Sample:', broadResponse.data.data[0].text?.substring(0, 100) + '...');
      }
    }
    
  } catch (error) {
    console.error('❌ Search error:');
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    if (error.data) {
      console.error('Data:', JSON.stringify(error.data, null, 2));
    }
  }
}

testSearch();