// Client-side logger utility
const isProduction = process.env.NODE_ENV === 'production';

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Current log level (can be set via environment variable)
// In production, default to ERROR only to minimize console output
const currentLogLevel = process.env.REACT_APP_LOG_LEVEL || (isProduction ? 'ERROR' : 'DEBUG');

const shouldLog = (level) => {
  // Ensure both levels are valid
  const levelToCheck = LOG_LEVELS[level] || 0;
  const currentLevel = LOG_LEVELS[currentLogLevel] || 0;
  
  return levelToCheck <= currentLevel;
};

// Batch logging for high-volume operations (no rate limiting)
let batchedLogs = [];
let batchTimeout = null;
const BATCH_DELAY = 1000; // Batch logs every second

const flushBatchedLogs = () => {
  if (batchedLogs.length > 0) {
    const summary = `[BATCHED] ${batchedLogs.length} logs: ${batchedLogs.slice(0, 3).join(', ')}${batchedLogs.length > 3 ? '...' : ''}`;
    console.log(summary);
    batchedLogs = [];
  }
  batchTimeout = null;
};

const addToBatch = (level, message, args) => {
  if (batchedLogs.length < 10) { // Limit batch size
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
      if (isProduction) {
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
      if (isProduction) {
        addToBatch('DEBUG', `${operation}: ${count} items`, details);
      } else {
        console.log(`[DEBUG] ${operation}: ${count} items`, details);
      }
    }
  }
};

export default logger;
