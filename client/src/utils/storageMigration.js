import secureStorage from './secureStorage';
import { resultsAPI } from '../services/api';
import logger from './logger';

class StorageMigration {
  constructor() {
    this.migrationComplete = false;
    this.migrationInProgress = false;
  }

  // Check if migration is needed
  needsMigration() {
    try {
      const localStorageKeys = Object.keys(localStorage);
      const hasTestData = localStorageKeys.some(key => 
        key.startsWith('test_completion_') || 
        key.startsWith('test_result_') || 
        key.startsWith('test_progress_')
      );
      
      return hasTestData && !this.migrationComplete;
    } catch (error) {
      logger.error('Error checking migration status:', error);
      return false;
    }
  }

  // Get all localStorage keys that need migration
  getMigrationKeys() {
    try {
      const localStorageKeys = Object.keys(localStorage);
      return localStorageKeys.filter(key => 
        key.startsWith('test_completion_') || 
        key.startsWith('test_result_') || 
        key.startsWith('test_progress_')
      );
    } catch (error) {
      logger.error('Error getting migration keys:', error);
      return [];
    }
  }

  // Migrate test completion data to server
  async migrateTestCompletion(testId) {
    try {
      const completionKey = `test_completion_${testId}`;
      const completionData = localStorage.getItem(completionKey);
      
      if (!completionData) {
        return { success: false, message: 'No completion data found' };
      }

      const parsedData = JSON.parse(completionData);
      
      // Validate data structure
      if (!parsedData || !Array.isArray(parsedData.answeredQuestions)) {
        logger.warn('Invalid completion data structure for test:', testId);
        return { success: false, message: 'Invalid data structure' };
      }

      // Prepare data for server
      const migrationData = {
        testId: testId,
        answeredQuestions: parsedData.answeredQuestions,
        status: parsedData.status || 'completed',
        startedAt: parsedData.startedAt,
        completedAt: parsedData.completedAt,
        totalQuestions: parsedData.totalQuestions,
        timeSpent: parsedData.timeSpent,
        source: 'localStorage_migration'
      };

      // Send to server
      const response = await resultsAPI.migrateFromLocalStorage(migrationData);
      
      if (response.data.success) {
        // Remove from localStorage after successful migration
        localStorage.removeItem(completionKey);
        
        // Store encrypted copy in secure storage as backup
        secureStorage.setItem(`migrated_completion_${testId}`, {
          ...parsedData,
          migratedAt: Date.now(),
          serverId: response.data.resultId
        });

        return { 
          success: true, 
          message: 'Data migrated successfully',
          resultId: response.data.resultId
        };
      } else {
        return { 
          success: false, 
          message: response.data.message || 'Migration failed' 
        };
      }
    } catch (error) {
      logger.error('Error migrating test completion:', error);
      return { 
        success: false, 
        message: 'Migration error: ' + error.message 
      };
    }
  }

  // Migrate test progress data to secure storage
  async migrateTestProgress(testId) {
    try {
      const progressKey = `test_progress_${testId}`;
      const progressData = localStorage.getItem(progressKey);
      
      if (!progressData) {
        return { success: false, message: 'No progress data found' };
      }

      const parsedData = JSON.parse(progressData);
      
      // Store in secure storage (encrypted + session-based)
      const success = secureStorage.setItem(`test_progress_${testId}`, {
        ...parsedData,
        migratedAt: Date.now()
      });

      if (success) {
        // Remove from localStorage after successful migration
        localStorage.removeItem(progressKey);
        
        return { 
          success: true, 
          message: 'Progress data migrated to secure storage' 
        };
      } else {
        return { 
          success: false, 
          message: 'Failed to store in secure storage' 
        };
      }
    } catch (error) {
      logger.error('Error migrating test progress:', error);
      return { 
        success: false, 
        message: 'Migration error: ' + error.message 
      };
    }
  }

  // Migrate test result data
  async migrateTestResult(testId) {
    try {
      const resultKey = `test_result_${testId}`;
      const resultData = localStorage.getItem(resultKey);
      
      if (!resultData) {
        return { success: false, message: 'No result data found' };
      }

      // Store in secure storage
      const success = secureStorage.setItem(`test_result_${testId}`, {
        resultId: resultData,
        migratedAt: Date.now()
      });

      if (success) {
        // Remove from localStorage after successful migration
        localStorage.removeItem(resultKey);
        
        return { 
          success: true, 
          message: 'Result data migrated to secure storage' 
        };
      } else {
        return { 
          success: false, 
          message: 'Failed to store in secure storage' 
        };
      }
    } catch (error) {
      logger.error('Error migrating test result:', error);
      return { 
        success: false, 
        message: 'Migration error: ' + error.message 
      };
    }
  }

  // Perform full migration
  async performMigration() {
    if (this.migrationInProgress) {
      return { success: false, message: 'Migration already in progress' };
    }

    try {
      this.migrationInProgress = true;
      logger.info('Starting storage migration...');

      const migrationKeys = this.getMigrationKeys();
      const results = {
        total: migrationKeys.length,
        successful: 0,
        failed: 0,
        details: []
      };

      for (const key of migrationKeys) {
        try {
          if (key.startsWith('test_completion_')) {
            const testId = key.replace('test_completion_', '');
            const result = await this.migrateTestCompletion(testId);
            results.details.push({ key, result });
            
            if (result.success) {
              results.successful++;
            } else {
              results.failed++;
            }
          } else if (key.startsWith('test_progress_')) {
            const testId = key.replace('test_progress_', '');
            const result = await this.migrateTestProgress(testId);
            results.details.push({ key, result });
            
            if (result.success) {
              results.successful++;
            } else {
              results.failed++;
            }
          } else if (key.startsWith('test_result_')) {
            const testId = key.replace('test_result_', '');
            const result = await this.migrateTestResult(testId);
            results.details.push({ key, result });
            
            if (result.success) {
              results.successful++;
            } else {
              results.failed++;
            }
          }
        } catch (error) {
          logger.error(`Error migrating key ${key}:`, error);
          results.failed++;
          results.details.push({ 
            key, 
            result: { success: false, message: error.message } 
          });
        }
      }

      // Mark migration as complete if all critical data was migrated
      if (results.successful > 0 && results.failed === 0) {
        this.migrationComplete = true;
        localStorage.setItem('storage_migration_complete', 'true');
      }

      logger.info('Storage migration completed:', results);
      return { success: true, results };

    } catch (error) {
      logger.error('Migration failed:', error);
      return { success: false, message: error.message };
    } finally {
      this.migrationInProgress = false;
    }
  }

  // Check migration status
  getMigrationStatus() {
    return {
      needsMigration: this.needsMigration(),
      migrationComplete: this.migrationComplete,
      migrationInProgress: this.migrationInProgress,
      localStorageKeys: this.getMigrationKeys().length,
      secureStorageKeys: secureStorage.keys().length
    };
  }

  // Clean up old localStorage data (use with caution)
  cleanupLocalStorage() {
    try {
      const migrationKeys = this.getMigrationKeys();
      let cleanedCount = 0;

      migrationKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
          cleanedCount++;
        } catch (error) {
          logger.warn(`Failed to clean up key ${key}:`, error);
        }
      });

      // Also clean up migration-related keys
      const cleanupKeys = [
        'test_completed_attempts_',
        'secure_session_refs'
      ];

      cleanupKeys.forEach(prefix => {
        const keys = Object.keys(localStorage).filter(key => 
          key.startsWith(prefix)
        );
        keys.forEach(key => {
          try {
            localStorage.removeItem(key);
            cleanedCount++;
          } catch (error) {
            logger.warn(`Failed to clean up key ${key}:`, error);
          }
        });
      });

      logger.info(`Cleaned up ${cleanedCount} localStorage keys`);
      return { success: true, cleanedCount };

    } catch (error) {
      logger.error('Cleanup failed:', error);
      return { success: false, message: error.message };
    }
  }
}

// Create singleton instance
const storageMigration = new StorageMigration();

export default storageMigration;
