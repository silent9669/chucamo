import logger from '../utils/logger';
// Client-side logger utility
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
const currentLogLevel = process.env.REACT_APP_LOG_LEVEL || (isProduction ? 'WARN' : 'DEBUG');

const shouldLog = (level) => {
  return LOG_LEVELS[level] <= LOG_LEVELS[currentLogLevel];
};

// Rate limiting for logs to prevent excessive output
let logCount = 0;
let lastResetTime = Date.now();
const LOG_RATE_LIMIT = 50; // Max logs per second
const LOG_RESET_INTERVAL = 1000; // Reset counter every second

const checkRateLimit = () => {
  const now = Date.now();
  if (now - lastResetTime > LOG_RESET_INTERVAL) {
    logCount = 0;
    lastResetTime = now;
  }
  
  if (logCount >= LOG_RATE_LIMIT) {
    return false;
  }
  
  logCount++;
  return true;
};

const logger = {
  error: (message, ...args) => {
    if (shouldLog('ERROR') && checkRateLimit()) {
      logger.error(`[ERROR] ${message}`, ...args);
    }
  },
  
  warn: (message, ...args) => {
    if (shouldLog('WARN') && checkRateLimit()) {
      logger.warn(`[WARN] ${message}`, ...args);
    }
  },
  
  info: (message, ...args) => {
    if (shouldLog('INFO') && checkRateLimit()) {
      logger.debug(`[INFO] ${message}`, ...args);
    }
  },
  
  debug: (message, ...args) => {
    if (shouldLog('DEBUG') && checkRateLimit()) {
      logger.debug(`[DEBUG] ${message}`, ...args);
    }
  },
  
  // Special method for critical logs that should always be shown
  critical: (message, ...args) => {
    logger.debug(`[CRITICAL] ${message}`, ...args);
  }
};

export default logger;
