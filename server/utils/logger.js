const loggingConfig = require('../config/logging');
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Current log level (can be set via environment variable)
// In production, default to ERROR only to minimize Railway logs
const currentLogLevel = process.env.LOG_LEVEL || loggingConfig.server.default;

const shouldLog = (level) => {
  // In production, be very strict about what gets logged
  if (isProduction) {
    if (loggingConfig.production.always.includes(level)) return true;
    if (loggingConfig.production.never.includes(level)) return false;
    if (loggingConfig.production.conditional.includes(level)) {
      return process.env.LOG_LEVEL ? LOG_LEVELS[level] <= LOG_LEVELS[currentLogLevel] : false;
    }
  }
  
  return LOG_LEVELS[level] <= LOG_LEVELS[currentLogLevel];
};

// Batch logging for high-volume operations (no rate limiting)
let batchedLogs = [];
let batchTimeout = null;
const BATCH_DELAY = loggingConfig.batching.flushInterval;

const flushBatchedLogs = () => {
  if (batchedLogs.length > 0) {
    const summary = loggingConfig.batching.summaryFormat
      .replace('{count}', batchedLogs.length)
      .replace('{summary}', batchedLogs.slice(0, 3).join(', ') + (batchedLogs.length > 3 ? '...' : ''));
    console.log(summary);
    batchedLogs = [];
  }
  batchTimeout = null;
};

const addToBatch = (level, message, args) => {
  if (batchedLogs.length < loggingConfig.batching.maxBatchSize) {
    batchedLogs.push(`${level}: ${message}`);
  }
  
  if (!batchTimeout) {
    batchTimeout = setTimeout(flushBatchedLogs, BATCH_DELAY);
  }
};

const logger = {
  error: (message, ...args) => {
    if (shouldLog('ERROR')) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  },
  
  warn: (message, ...args) => {
    if (shouldLog('WARN')) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  
  info: (message, ...args) => {
    if (shouldLog('INFO')) {
      console.log(`[INFO] ${message}`, ...args);
    }
  },
  
  debug: (message, ...args) => {
    if (shouldLog('DEBUG')) {
      // In production, batch debug logs to reduce volume
      if (isProduction && loggingConfig.batching.enabled) {
        addToBatch('DEBUG', message, args);
      } else {
        console.log(`[DEBUG] ${message}`, ...args);
      }
    }
  },
  
  // Special method for critical logs that should always be shown
  critical: (message, ...args) => {
    console.log(`[CRITICAL] ${message}`, ...args);
  },
  
  // Method for high-volume debug operations
  debugBatch: (operation, count, details = '') => {
    if (shouldLog('DEBUG')) {
      if (isProduction && loggingConfig.batching.enabled) {
        addToBatch('DEBUG', `${operation}: ${count} items`, details);
      } else {
        console.log(`[DEBUG] ${operation}: ${count} items`, details);
      }
    }
  }
};

module.exports = logger;
