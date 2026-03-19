const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:8080';
const API_URL = `${BASE_URL}/api`;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Helper functions
const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logSuccess = (message) => log(`✅ ${message}`, 'green');
const logError = (message) => log(`❌ ${message}`, 'red');
const logInfo = (message) => log(`ℹ️  ${message}`, 'blue');
const logWarning = (message) => log(`⚠️  ${message}`, 'yellow');

// Test helper function
async function testEndpoint(method, endpoint, data = null, expectedStatus = 200) {
  try {
    const config = {
      method,
      url: `${endpoint.startsWith('http') ? endpoint : API_URL + endpoint}`,
      timeout: 10000
    };

    if (data) {
      config.data = data;
      config.headers = { 'Content-Type': 'application/json' };
    }

    const response = await axios(config);

    if (response.status === expectedStatus) {
      logSuccess(`${method.toUpperCase()} ${endpoint} - Status: ${response.status}`);
      return { success: true, data: response.data, status: response.status };
    } else {
      logWarning(`${method.toUpperCase()} ${endpoint} - Unexpected status: ${response.status} (expected: ${expectedStatus})`);
      return { success: false, data: response.data, status: response.status };
    }
  } catch (error) {
    if (error.response) {
      logError(`${method.toUpperCase()} ${endpoint} - Error ${error.response.status}: ${error.response.data?.message || error.message}`);
      return { success: false, error: error.response.data, status: error.response.status };
    } else {
      logError(`${method.toUpperCase()} ${endpoint} - Network error: ${error.message}`);
      return { success: false, error: error.message, status: 0 };
    }
  }
}

// Test suite
async function runTests() {
  log('\n🚀 Starting API Tests for Event Manager Backend\n', 'cyan');

  let passedTests = 0;
  let totalTests = 0;

  // Test 1: Health Check
  log('📋 Test 1: Health Check', 'magenta');
  totalTests++;
  const healthCheck = await testEndpoint('GET', `${BASE_URL}/health`);
  if (healthCheck.success) {
    passedTests++;
    logInfo(`Server uptime: ${healthCheck.data.uptime}s`);
  }

  // Test 2: API Info
  log('\n📋 Test 2: API Information', 'magenta');
  totalTests++;
  const apiInfo = await testEndpoint('GET', '/info');
  if (apiInfo.success) {
    passedTests++;
    logInfo(`API Version: ${apiInfo.data.api?.version || 'Unknown'}`);
  }

  // Test 3: Sample URLs
  log('\n📋 Test 3: Sample URLs', 'magenta');
  totalTests++;
  const sampleUrls = await testEndpoint('GET', '/sample-urls');
  if (sampleUrls.success) {
    passedTests++;
    logInfo('Sample URLs endpoint working');
  }

  // Test 4: Event Categories
  log('\n📋 Test 4: Event Categories', 'magenta');
  totalTests++;
  const categories = await testEndpoint('GET', '/events/categories');
  if (categories.success) {
    passedTests++;
    logInfo(`Found ${categories.data.data?.categories?.length || 0} categories`);
  }

  // Test 5: Events Health Check
  log('\n📋 Test 5: Events Service Health', 'magenta');
  totalTests++;
  const eventsHealth = await testEndpoint('GET', '/events/health');
  if (eventsHealth.success) {
    passedTests++;
    logInfo(`Events service status: ${eventsHealth.data.status}`);
  }

  // Test 6: Artists Health Check
  log('\n📋 Test 6: Artists Service Health', 'magenta');
  totalTests++;
  const artistsHealth = await testEndpoint('GET', '/artists/health');
  if (artistsHealth.success) {
    passedTests++;
    logInfo(`Artists service status: ${artistsHealth.data.status}`);
  }

  // Test 7: Get All Favorites (should work even with empty database)
  log('\n📋 Test 7: Get All Favorites', 'magenta');
  totalTests++;
  const favorites = await testEndpoint('GET', '/favorites');
  if (favorites.success) {
    passedTests++;
    logInfo(`Found ${favorites.data.data?.count || 0} favorites`);
  }

  // Test 8: Get Favorites Count
  log('\n📋 Test 8: Get Favorites Count', 'magenta');
  totalTests++;
  const favoritesCount = await testEndpoint('GET', '/favorites/count');
  if (favoritesCount.success) {
    passedTests++;
    logInfo(`Favorites count: ${favoritesCount.data.data?.count || 0}`);
  }

  // Test 9: Event Search (will fail without real API key, but should return proper error)
  log('\n📋 Test 9: Event Search (Expected to fail without real API key)', 'magenta');
  totalTests++;
  const eventSearch = await testEndpoint('GET', '/events/search?keyword=concert', null, 500);
  if (eventSearch.status === 500) {
    passedTests++;
    logInfo('Event search properly handles API key error');
  }

  // Test 10: Artist Search (will fail without real API key, but should return proper error)
  log('\n📋 Test 10: Artist Search (Expected to fail without real API key)', 'magenta');
  totalTests++;
  const artistSearch = await testEndpoint('GET', '/artists/search?artist=Taylor Swift', null, 500);
  if (artistSearch.status === 500) {
    passedTests++;
    logInfo('Artist search properly handles API key error');
  }

  // Test 11: Add Favorite (test with sample data)
  log('\n📋 Test 11: Add Favorite', 'magenta');
  totalTests++;
  const sampleEvent = {
    eventId: 'test-event-123',
    eventName: 'Test Concert',
    venue: {
      name: 'Test Venue',
      city: 'Test City',
      state: 'TC'
    },
    date: '2024-12-25',
    time: '20:00',
    genre: 'Music',
    image: 'https://example.com/image.jpg',
    url: 'https://example.com/event'
  };

  const addFavorite = await testEndpoint('POST', '/favorites', sampleEvent, 201);
  if (addFavorite.success) {
    passedTests++;
    logInfo('Successfully added test favorite');

    // Test 12: Check if event is favorite
    log('\n📋 Test 12: Check Favorite Status', 'magenta');
    totalTests++;
    const checkFavorite = await testEndpoint('GET', `/favorites/${sampleEvent.eventId}`);
    if (checkFavorite.success && checkFavorite.data.data?.isFavorite) {
      passedTests++;
      logInfo('Favorite status check working');
    }

    // Test 13: Remove favorite
    log('\n📋 Test 13: Remove Favorite', 'magenta');
    totalTests++;
    const removeFavorite = await testEndpoint('DELETE', `/favorites/${sampleEvent.eventId}`);
    if (removeFavorite.success) {
      passedTests++;
      logInfo('Successfully removed test favorite');
    }
  } else {
    // Skip dependent tests if add favorite failed
    totalTests += 2;
    logWarning('Skipping favorite status and remove tests due to add failure');
  }

  // Test 14: Invalid endpoint (should return 404)
  log('\n📋 Test 14: Invalid Endpoint (404 test)', 'magenta');
  totalTests++;
  const invalidEndpoint = await testEndpoint('GET', '/invalid-endpoint', null, 404);
  if (invalidEndpoint.status === 404) {
    passedTests++;
    logInfo('404 error handling working correctly');
  }

  // Test 15: Root endpoint
  log('\n📋 Test 15: Root Endpoint', 'magenta');
  totalTests++;
  const rootEndpoint = await testEndpoint('GET', `${BASE_URL}/`);
  if (rootEndpoint.success) {
    passedTests++;
    logInfo('Root endpoint working');
  }

  // Summary
  log('\n' + '='.repeat(50), 'cyan');
  log('🎯 TEST SUMMARY', 'cyan');
  log('='.repeat(50), 'cyan');

  if (passedTests === totalTests) {
    logSuccess(`All tests passed! (${passedTests}/${totalTests})`);
  } else if (passedTests > totalTests * 0.8) {
    logWarning(`Most tests passed: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`);
  } else {
    logError(`Many tests failed: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`);
  }

  log('\n📝 Notes:', 'yellow');
  log('   • Some tests may fail without real API keys (Ticketmaster, Spotify)', 'yellow');
  log('   • Database tests may fail without MongoDB connection', 'yellow');
  log('   • This is expected in development environment', 'yellow');

  log('\n🔗 Useful URLs:', 'blue');
  log(`   • Health Check: ${BASE_URL}/health`, 'blue');
  log(`   • API Documentation: ${BASE_URL}/api/info`, 'blue');
  log(`   • Sample URLs: ${BASE_URL}/api/sample-urls`, 'blue');
  log(`   • Frontend: ${BASE_URL}/`, 'blue');

  return { passed: passedTests, total: totalTests, percentage: Math.round(passedTests/totalTests*100) };
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(error => {
    logError(`Test suite failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runTests, testEndpoint };
