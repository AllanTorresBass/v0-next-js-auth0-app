/**
 * Test script to verify rate limiting is working
 * This script will make multiple concurrent requests to test the rate limiter
 */

const fetch = require('node-fetch');

async function testRateLimiting() {
  console.log('Testing rate limiting with multiple concurrent requests...');
  
  const baseUrl = 'http://localhost:3000';
  const requests = [];
  
  // Create 20 concurrent requests to trigger rate limiting
  for (let i = 0; i < 20; i++) {
    requests.push(
      fetch(`${baseUrl}/api/v2/users?page=1&limit=10`)
        .then(async (response) => {
          const data = await response.json();
          return {
            status: response.status,
            success: response.ok,
            data: data.error ? data.error.message : 'Success'
          };
        })
        .catch(error => ({
          status: 'ERROR',
          success: false,
          data: error.message
        }))
    );
  }
  
  console.log('Making 20 concurrent requests...');
  const startTime = Date.now();
  
  try {
    const results = await Promise.all(requests);
    const endTime = Date.now();
    
    console.log(`\nCompleted in ${endTime - startTime}ms`);
    console.log('\nResults:');
    
    const successCount = results.filter(r => r.success).length;
    const rateLimitCount = results.filter(r => r.data.includes('high load') || r.data.includes('Rate limit')).length;
    const errorCount = results.filter(r => !r.success && !r.data.includes('high load')).length;
    
    console.log(`✅ Successful requests: ${successCount}`);
    console.log(`⏳ Rate limited requests: ${rateLimitCount}`);
    console.log(`❌ Other errors: ${errorCount}`);
    
    if (rateLimitCount > 0) {
      console.log('\n🎉 Rate limiting is working! Some requests were properly rate limited.');
    } else if (successCount === results.length) {
      console.log('\n✅ All requests succeeded - rate limiter may have queued them properly.');
    } else {
      console.log('\n⚠️  Unexpected results - check the implementation.');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Wait a bit for the server to start, then run the test
setTimeout(testRateLimiting, 5000);
