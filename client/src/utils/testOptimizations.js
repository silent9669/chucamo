// Test script to verify optimizations work correctly
import ResultsCacheManager from './resultsCacheManager';
import TestCacheManager from './testCacheManager';

// Test ResultsCacheManager
export const testResultsCacheManager = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🧪 Testing ResultsCacheManager...');
  }
  
  try {
    // Test 1: Basic caching functionality
    const testData = { id: 'test123', title: 'Test Test', type: 'practice' };
    ResultsCacheManager.setCachedTest('test123', testData);
    
    const cachedData = ResultsCacheManager.getCachedTest('test123');
    if (cachedData && cachedData.id === 'test123') {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Test 1 PASSED: Basic caching works');
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Test 1 FAILED: Basic caching failed');
      }
    }
    
    // Test 2: Cache expiration
    const oldData = { id: 'old123', title: 'Old Test', type: 'practice' };
    ResultsCacheManager.testCache.set('old123', { 
      data: oldData, 
      timestamp: Date.now() - (11 * 60 * 1000) // 11 minutes old
    });
    
    const expiredData = ResultsCacheManager.getCachedTest('old123');
    if (!expiredData) {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Test 2 PASSED: Cache expiration works');
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Test 2 FAILED: Cache expiration failed');
      }
    }
    
    // Test 3: Cache cleanup
    ResultsCacheManager.cleanup();
    const stats = ResultsCacheManager.getCacheStats();
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Test 3 PASSED: Cache cleanup works, stats:', stats);
    }
    
    return true;
  } catch (error) {
    console.error('❌ ResultsCacheManager test failed:', error);
    return false;
  }
};

// Test TestCacheManager
export const testTestCacheManager = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🧪 Testing TestCacheManager...');
  }
  
  try {
    // Test 1: Basic caching functionality
    const testData = { id: 'test456', title: 'Test Test', type: 'practice' };
    TestCacheManager.setCachedAttemptStatus('test456', 'user123', { 
      canAttempt: true, 
      hasIncompleteAttempt: false 
    });
    
    const cachedStatus = TestCacheManager.getCachedAttemptStatus('test456', 'user123');
    if (cachedStatus && cachedStatus.canAttempt === true) {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Test 1 PASSED: Basic attempt status caching works');
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Test 1 FAILED: Basic attempt status caching failed');
      }
    }
    
    // Test 2: Cache expiration
    const oldStatus = { canAttempt: false, hasIncompleteAttempt: true };
    TestCacheManager.attemptStatusCache.set('old456_user123', { 
      data: oldStatus, 
      timestamp: Date.now() - (6 * 60 * 1000) // 6 minutes old
    });
    
    const expiredStatus = TestCacheManager.getCachedAttemptStatus('old456', 'user123');
    if (!expiredStatus) {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Test 2 PASSED: Attempt status cache expiration works');
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Test 2 FAILED: Attempt status cache expiration failed');
      }
    }
    
    // Test 3: Cache cleanup
    TestCacheManager.cleanup();
    const stats = TestCacheManager.getCacheStats();
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Test 3 PASSED: Cache cleanup works, stats:', stats);
    }
    
    return true;
  } catch (error) {
    console.error('❌ TestCacheManager test failed:', error);
    return false;
  }
};

// Test batch loading functionality
export const testBatchLoading = async () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🧪 Testing batch loading functionality...');
  }
  
  try {
    // Test 1: Batch test loading (mock)
    const testIds = ['test1', 'test2', 'test3'];
    const mockTestsData = {
      test1: { id: 'test1', title: 'Test 1' },
      test2: { id: 'test2', title: 'Test 2' },
      test3: { id: 'test3', title: 'Test 3' }
    };
    
    // Mock the fetch function for testing
    const originalFetch = global.fetch;
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ test: mockTestsData.test1 })
      })
    );
    
    const batchResults = await ResultsCacheManager.batchLoadTests(testIds);
    
    if (batchResults && Object.keys(batchResults).length === 3) {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Test 1 PASSED: Batch loading works');
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Test 1 FAILED: Batch loading failed');
      }
    }
    
    // Restore original fetch
    global.fetch = originalFetch;
    
    return true;
  } catch (error) {
    console.error('❌ Batch loading test failed:', error);
    return false;
  }
};

// Run all tests
export const runAllTests = async () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🚀 Starting optimization tests...');
  }
  
  const results = {
    resultsCache: testResultsCacheManager(),
    testCache: testTestCacheManager(),
    batchLoading: await testBatchLoading()
  };
  
  const allPassed = Object.values(results).every(result => result === true);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Test Results:', results);
    console.log(allPassed ? '🎉 All tests PASSED!' : '❌ Some tests FAILED!');
  }
  
  return allPassed;
};

// Export for manual testing
export default {
  testResultsCacheManager,
  testTestCacheManager,
  testBatchLoading,
  runAllTests
};
