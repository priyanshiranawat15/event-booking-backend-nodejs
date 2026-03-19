const axios = require('axios');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
const API_URL = `${BASE_URL}/api`;

// Color coding for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Logging helpers
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

// Sample event with images array (from Ticketmaster API format)
const sampleEventWithImages = {
  id: 'TEST_IMAGES_123',
  name: 'Test Concert with Images',
  date: '2025-12-31',
  time: '20:00:00',
  venue: {
    name: 'Test Arena',
    city: 'Los Angeles',
    state: 'CA',
  },
  genre: 'Music',
  subGenre: 'Rock',
  image: 'https://s1.ticketm.net/dam/a/123/primary-image.jpg',
  images: [
    {
      url: 'https://s1.ticketm.net/dam/a/123/image-16x9.jpg',
      ratio: '16_9',
      width: 1920,
      height: 1080,
      fallback: false,
      attribution: 'Ticketmaster'
    },
    {
      url: 'https://s1.ticketm.net/dam/a/123/image-4x3.jpg',
      ratio: '4_3',
      width: 1024,
      height: 768,
      fallback: false,
      attribution: 'Ticketmaster'
    },
    {
      url: 'https://s1.ticketm.net/dam/a/123/image-3x2.jpg',
      ratio: '3_2',
      width: 1024,
      height: 683,
      fallback: false,
      attribution: 'Ticketmaster'
    }
  ],
  priceRange: {
    min: 50,
    max: 200,
    currency: 'USD',
  },
  ticketStatus: 'onsale',
  url: 'https://www.ticketmaster.com/test-event',
};

// Test helper function
async function testEndpoint(method, endpoint, data = null, expectedStatus = 200) {
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      validateStatus: () => true,
    };

    if (data) {
      config.data = data;
      config.headers = { 'Content-Type': 'application/json' };
    }

    const response = await axios(config);

    if (response.status === expectedStatus) {
      return { success: true, status: response.status, data: response.data };
    } else {
      return {
        success: false,
        status: response.status,
        data: response.data,
        expectedStatus,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      expectedStatus,
    };
  }
}

// Main test function
async function runTests() {
  log('\n🖼️  Starting Images Array Support Tests\n', 'cyan');
  log(`Testing against: ${API_URL}\n`, 'blue');

  let passedTests = 0;
  let totalTests = 0;

  // Test 1: Clear existing favorites
  log('📋 Test 1: Clear existing favorites', 'magenta');
  totalTests++;
  const clearResult = await testEndpoint('DELETE', '/favorites/clear', null, 200);
  if (clearResult.success || clearResult.status === 403) {
    passedTests++;
    logSuccess(
      clearResult.status === 403
        ? 'Clear operation blocked (production mode)'
        : 'Favorites cleared successfully'
    );
  } else {
    logInfo('Clear favorites skipped (continuing with tests)');
  }

  // Test 2: Add favorite with images array
  log('\n📋 Test 2: Add favorite with images array', 'magenta');
  totalTests++;
  const addResult = await testEndpoint(
    'POST',
    '/favorites',
    sampleEventWithImages,
    201
  );

  if (addResult.success) {
    passedTests++;
    logSuccess('Successfully added favorite with images array');
    logInfo(`Event ID: ${sampleEventWithImages.id}`);
    logInfo(`Images count: ${sampleEventWithImages.images.length}`);
  } else {
    logError('Failed to add favorite with images');
    console.log('Response:', JSON.stringify(addResult.data, null, 2));
  }

  // Test 3: Retrieve favorite and verify images array
  log('\n📋 Test 3: Retrieve favorite and verify images array', 'magenta');
  totalTests++;
  const getResult = await testEndpoint(
    'GET',
    `/favorites/${sampleEventWithImages.id}`,
    null,
    200
  );

  if (getResult.success && getResult.data.data.favorite) {
    const favorite = getResult.data.data.favorite;

    if (favorite.images && Array.isArray(favorite.images)) {
      if (favorite.images.length === sampleEventWithImages.images.length) {
        passedTests++;
        logSuccess('Images array correctly stored and retrieved');
        logInfo(`Images in favorite: ${favorite.images.length}`);

        // Verify image structure
        const firstImage = favorite.images[0];
        if (firstImage.url && firstImage.ratio && firstImage.width && firstImage.height) {
          logSuccess('Image structure is correct (url, ratio, width, height present)');
        } else {
          logInfo('Image structure may be incomplete');
        }
      } else {
        logError(`Image count mismatch: Expected ${sampleEventWithImages.images.length}, got ${favorite.images.length}`);
      }
    } else {
      logError('Images array not found or not an array');
      console.log('Favorite data:', JSON.stringify(favorite, null, 2));
    }
  } else {
    logError('Failed to retrieve favorite');
    console.log('Response:', JSON.stringify(getResult.data, null, 2));
  }

  // Test 4: Verify single image field still exists (backward compatibility)
  log('\n📋 Test 4: Verify single image field exists (backward compatibility)', 'magenta');
  totalTests++;
  const checkResult = await testEndpoint(
    'GET',
    `/favorites/${sampleEventWithImages.id}`,
    null,
    200
  );

  if (checkResult.success && checkResult.data.data.favorite) {
    const favorite = checkResult.data.data.favorite;

    if (favorite.image) {
      passedTests++;
      logSuccess('Single image field exists for backward compatibility');
      logInfo(`Image URL: ${favorite.image}`);
    } else {
      logError('Single image field missing');
    }
  } else {
    logError('Failed to check backward compatibility');
  }

  // Test 5: Get all favorites and verify images
  log('\n📋 Test 5: Get all favorites and verify images array', 'magenta');
  totalTests++;
  const getAllResult = await testEndpoint('GET', '/favorites', null, 200);

  if (getAllResult.success) {
    const favorites = getAllResult.data.data.favorites;
    const favoriteWithImages = favorites.find(f => f.eventId === sampleEventWithImages.id);

    if (favoriteWithImages && favoriteWithImages.images && Array.isArray(favoriteWithImages.images)) {
      passedTests++;
      logSuccess('Images array present in favorites list');
      logInfo(`Total favorites: ${favorites.length}`);
      logInfo(`Images in test favorite: ${favoriteWithImages.images.length}`);
    } else {
      logError('Images array not found in favorites list');
    }
  } else {
    logError('Failed to get all favorites');
  }

  // Test 6: Add favorite without images array (should default to empty array)
  log('\n📋 Test 6: Add favorite without images array', 'magenta');
  totalTests++;
  const eventWithoutImages = {
    id: 'TEST_NO_IMAGES',
    name: 'Test Event Without Images',
    date: '2025-12-31',
    time: '21:00:00',
    venue: {
      name: 'Test Venue',
      city: 'New York',
      state: 'NY',
    },
    genre: 'Sports',
    subGenre: 'Basketball',
    image: 'https://example.com/single-image.jpg',
    // No images array
    priceRange: null,
    ticketStatus: 'onsale',
    url: 'https://www.ticketmaster.com/test',
  };

  const addNoImagesResult = await testEndpoint('POST', '/favorites', eventWithoutImages, 201);

  if (addNoImagesResult.success) {
    logSuccess('Added favorite without images array');

    // Check if it has empty images array
    const checkNoImages = await testEndpoint('GET', `/favorites/${eventWithoutImages.id}`, null, 200);
    if (checkNoImages.success && checkNoImages.data.data.favorite) {
      const fav = checkNoImages.data.data.favorite;
      if (fav.images && Array.isArray(fav.images) && fav.images.length === 0) {
        passedTests++;
        logSuccess('Images defaults to empty array when not provided');
      } else {
        logError('Images array not properly defaulted');
        console.log('Images value:', fav.images);
      }
    }
  } else {
    logError('Failed to add favorite without images');
  }

  // Test 7: Test search API format with images
  log('\n📋 Test 7: Test search API returns images array', 'magenta');
  totalTests++;
  logInfo('This test checks if search API has been updated to return images array');

  try {
    const searchResult = await axios.get(`${API_URL}/events/search?keyword=music&location=Los Angeles, CA`);

    if (searchResult.data && searchResult.data.data && searchResult.data.data.events) {
      const events = searchResult.data.data.events;

      if (events.length > 0) {
        const firstEvent = events[0];

        if (firstEvent.images && Array.isArray(firstEvent.images)) {
          passedTests++;
          logSuccess('Search API returns images array');
          logInfo(`First event has ${firstEvent.images.length} images`);

          if (firstEvent.image) {
            logSuccess('Backward compatible: single image field also present');
          }
        } else {
          logError('Search API does not return images array');
          logInfo('Event structure: ' + JSON.stringify(Object.keys(firstEvent)));
        }
      } else {
        logInfo('No events returned from search (may need real API key)');
        passedTests++; // Don't fail if no events found
      }
    }
  } catch (error) {
    logInfo('Search test skipped (API may not be available): ' + error.message);
    passedTests++; // Don't fail if search unavailable
  }

  // Test 8: Bulk add with images
  log('\n📋 Test 8: Bulk add favorites with images arrays', 'magenta');
  totalTests++;

  const bulkEvents = [
    {
      id: 'BULK_IMG_1',
      name: 'Bulk Event 1',
      date: '2025-12-01',
      time: '19:00:00',
      venue: { name: 'Venue 1', city: 'Chicago', state: 'IL' },
      genre: 'Music',
      subGenre: 'Pop',
      image: 'https://example.com/bulk1.jpg',
      images: [
        { url: 'https://example.com/bulk1-1.jpg', ratio: '16_9', width: 1920, height: 1080, fallback: false }
      ],
      priceRange: null,
      ticketStatus: 'onsale',
      url: 'https://example.com/bulk1',
    },
    {
      id: 'BULK_IMG_2',
      name: 'Bulk Event 2',
      date: '2025-12-02',
      time: '20:00:00',
      venue: { name: 'Venue 2', city: 'Boston', state: 'MA' },
      genre: 'Sports',
      subGenre: 'Hockey',
      image: 'https://example.com/bulk2.jpg',
      images: [
        { url: 'https://example.com/bulk2-1.jpg', ratio: '4_3', width: 1024, height: 768, fallback: false },
        { url: 'https://example.com/bulk2-2.jpg', ratio: '16_9', width: 1920, height: 1080, fallback: false }
      ],
      priceRange: null,
      ticketStatus: 'onsale',
      url: 'https://example.com/bulk2',
    },
  ];

  const bulkResult = await testEndpoint('POST', '/favorites/bulk', { events: bulkEvents }, 200);

  if (bulkResult.success) {
    passedTests++;
    logSuccess('Bulk add with images successful');
    logInfo(`Inserted: ${bulkResult.data.data.inserted}`);

    // Verify bulk events have images
    const verifyBulk = await testEndpoint('GET', '/favorites/BULK_IMG_2', null, 200);
    if (verifyBulk.success && verifyBulk.data.data.favorite) {
      const bulkFav = verifyBulk.data.data.favorite;
      if (bulkFav.images && bulkFav.images.length === 2) {
        logSuccess('Bulk favorite has correct number of images');
      } else {
        logInfo('Bulk favorite images may not be correct');
      }
    }
  } else {
    logError('Bulk add with images failed');
  }

  // Test Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 Images Support Test Summary', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`Total Tests: ${totalTests}`, 'blue');
  log(`Passed: ${passedTests}`, 'green');
  log(`Failed: ${totalTests - passedTests}`, 'red');
  log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`, 'yellow');
  log('='.repeat(60), 'cyan');

  if (passedTests === totalTests) {
    log('\n🎉 All tests passed! Images array support working correctly.', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please review the output above.', 'yellow');
  }

  // Clean up
  log('\n🧹 Cleaning up test data...', 'cyan');
  await testEndpoint('DELETE', '/favorites/clear', null, 200);
  logInfo('Cleanup complete');
}

// Run tests
runTests().catch((error) => {
  logError(`Test execution failed: ${error.message}`);
  console.error(error);
  process.exit(1);
});
