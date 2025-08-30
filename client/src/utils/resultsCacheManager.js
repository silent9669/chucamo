import { validateAndLogId, safeEncodeId } from './validationUtils';
import { testsAPI } from '../services/api';

class ResultsCacheManager {
  static testCache = new Map();
  static resultCache = new Map();
  static performanceCache = new Map();
  
  // Cache test data to prevent re-fetching
  static getCachedTest(testId) {
    const cached = this.testCache.get(testId);
    if (cached && Date.now() - cached.timestamp < 10 * 60 * 1000) { // 10 minutes
      return cached.data;
    }
    return null;
  }
  
  // Cache result data
  static getCachedResult(resultId) {
    const cached = this.resultCache.get(resultId);
    if (cached && Date.now() - cached.timestamp < 10 * 60 * 1000) {
      return cached.data;
    }
    return null;
  }
  
  // Cache performance calculations
  static getCachedPerformance(testId) {
    const cached = this.performanceCache.get(testId);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutes
      return cached.data;
    }
    return null;
  }
  
  // Set cache with timestamp
  static setCachedTest(testId, data) {
    this.testCache.set(testId, { data, timestamp: Date.now() });
  }
  
  static setCachedResult(resultId, data) {
    this.resultCache.set(resultId, { data, timestamp: Date.now() });
  }
  
  static setCachedPerformance(testId, data) {
    this.performanceCache.set(testId, { data, timestamp: Date.now() });
  }
  
  // Batch load tests efficiently
  static async batchLoadTests(testIds) {
    const results = {};
    const uncachedIds = [];
    
    // Check cache first
    testIds.forEach(id => {
      const cached = this.getCachedTest(id);
      if (cached) {
        results[id] = cached;
      } else {
        uncachedIds.push(id);
      }
    });
    
    // Batch load uncached tests (5 at a time to avoid overwhelming)
    if (uncachedIds.length > 0) {
      const batchSize = 5;
      for (let i = 0; i < uncachedIds.length; i += batchSize) {
        const batch = uncachedIds.slice(i, i + batchSize);
        const batchPromises = batch.map(id => {
          // Validate that the ID is a valid ObjectId
          if (!validateAndLogId(id, 'batchLoadTests')) {
            return Promise.reject(new Error(`Invalid test ID: ${id}`));
          }
          
          const encodedId = safeEncodeId(id);
          if (!encodedId) {
            return Promise.reject(new Error(`Failed to encode test ID: ${id}`));
          }
          
          // Use the existing API service which has proper authentication and error handling
          return testsAPI.getById(encodedId).catch(error => {
            console.warn(`Failed to load test ${encodedId}:`, error.response?.status, error.response?.statusText);
            // Return null for failed requests so they can be filtered out
            return null;
          });
        });
        
        const batchResults = await Promise.all(batchPromises);
        batch.forEach((id, index) => {
          try {
            const response = batchResults[index];
            if (response && response.data?.test) {
              results[id] = response.data.test;
              this.setCachedTest(id, response.data.test);
            } else if (response && response.test) {
              results[id] = response.test;
              this.setCachedTest(id, response.test);
            } else if (response === null) {
              console.warn(`Test ${id} failed to load (likely access denied)`);
            } else {
              console.warn(`No test data found for ID ${id}:`, response);
            }
          } catch (error) {
            console.error(`Error processing test data for ID ${id}:`, error);
          }
        });
      }
    }
    
    return results;
  }
  
  // Clear old cache entries
  static cleanup() {
    const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    
    for (const [key, value] of this.testCache.entries()) {
      if (value.timestamp < tenMinutesAgo) {
        this.testCache.delete(key);
      }
    }
    
    for (const [key, value] of this.resultCache.entries()) {
      if (value.timestamp < tenMinutesAgo) {
        this.resultCache.delete(key);
      }
    }
    
    for (const [key, value] of this.performanceCache.entries()) {
      if (value.timestamp < fiveMinutesAgo) {
        this.performanceCache.delete(key);
      }
    }
  }
  
  // Clear specific cache entries
  static clearTestCache(testId) {
    this.testCache.delete(testId);
  }
  
  static clearResultCache(resultId) {
    this.resultCache.delete(resultId);
  }
  
  static clearPerformanceCache(testId) {
    this.performanceCache.delete(testId);
  }
  
  // Get cache statistics for debugging
  static getCacheStats() {
    return {
      testCacheSize: this.testCache.size,
      resultCacheSize: this.resultCache.size,
      performanceCacheSize: this.performanceCache.size,
      totalCacheSize: this.testCache.size + this.resultCache.size + this.performanceCache.size
    };
  }
}

export default ResultsCacheManager;
