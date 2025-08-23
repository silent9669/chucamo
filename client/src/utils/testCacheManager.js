class TestCacheManager {
  static testCache = new Map();
  static attemptStatusCache = new Map();
  
  // Cache test data with result integration
  static async getTestWithResult(testId, userId) {
    const cacheKey = `${testId}_${userId}`;
    
    // Check if we have fresh cached data (less than 5 minutes old)
    if (this.testCache.has(cacheKey)) {
      const cached = this.testCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
        return cached.data;
      }
    }
    
    return null;
  }
  
  // Cache test list with batch result status
  static async cacheTestList(tests, userId) {
    // Cache individual tests
    tests.forEach(test => {
      const cacheKey = `${test.id}_${userId}`;
      this.testCache.set(cacheKey, {
        data: test,
        timestamp: Date.now()
      });
    });
    
    // Batch fetch attempt statuses for all tests
    try {
      const attemptStatuses = await this.batchFetchAttemptStatuses(
        tests.map(t => t.id), 
        userId
      );
      
      // Cache attempt statuses
      attemptStatuses.forEach((status, testId) => {
        this.attemptStatusCache.set(`${testId}_${userId}`, {
          data: status,
          timestamp: Date.now()
        });
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to batch fetch attempt statuses:', error);
      }
    }
  }
  
  // Batch fetch attempt statuses (replaces individual calls)
  static async batchFetchAttemptStatuses(testIds, userId) {
    try {
      const response = await fetch('/api/results/batch-attempt-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ testIds, userId })
      });
      
      if (response.ok) {
        const data = await response.json();
        return new Map(data.attemptStatuses.map(status => [status.testId, status]));
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Batch attempt status fetch failed:', error);
      }
    }
    
    return new Map();
  }
  
  // Get cached attempt status
  static getCachedAttemptStatus(testId, userId) {
    const cacheKey = `${testId}_${userId}`;
    const cached = this.attemptStatusCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      return cached.data;
    }
    
    return null;
  }
  
  // Set cached attempt status
  static setCachedAttemptStatus(testId, userId, data) {
    const cacheKey = `${testId}_${userId}`;
    this.attemptStatusCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }
  
  // Clear old cache entries
  static cleanup() {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    
    for (const [key, value] of this.testCache.entries()) {
      if (value.timestamp < fiveMinutesAgo) {
        this.testCache.delete(key);
      }
    }
    
    for (const [key, value] of this.attemptStatusCache.entries()) {
      if (value.timestamp < fiveMinutesAgo) {
        this.attemptStatusCache.delete(key);
      }
    }
  }
  
  // Clear specific cache entries
  static clearTestCache(testId, userId) {
    const cacheKey = `${testId}_${userId}`;
    this.testCache.delete(cacheKey);
  }
  
  static clearAttemptStatusCache(testId, userId) {
    const cacheKey = `${testId}_${userId}`;
    this.attemptStatusCache.delete(cacheKey);
  }
  
  // Get cache statistics for debugging
  static getCacheStats() {
    return {
      testCacheSize: this.testCache.size,
      attemptStatusCacheSize: this.attemptStatusCache.size,
      totalCacheSize: this.testCache.size + this.attemptStatusCache.size
    };
  }
}

export default TestCacheManager;
