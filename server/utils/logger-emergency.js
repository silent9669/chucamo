// Emergency logger - simple and guaranteed to work
const isProduction = process.env.NODE_ENV === 'production';

const logger = {
  error: (message, ...args) => {
    console.error(`[ERROR] ${message}`, ...args);
  },
  
  warn: (message, ...args) => {
    if (!isProduction || process.env.LOG_LEVEL === 'WARN' || process.env.LOG_LEVEL === 'INFO' || process.env.LOG_LEVEL === 'DEBUG') {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  
  info: (message, ...args) => {
    if (!isProduction || process.env.LOG_LEVEL === 'INFO' || process.env.LOG_LEVEL === 'DEBUG') {
      console.log(`[INFO] ${message}`, ...args);
    }
  },
  
  debug: (message, ...args) => {
    if (!isProduction || process.env.LOG_LEVEL === 'DEBUG') {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },
  
  critical: (message, ...args) => {
    console.log(`[CRITICAL] ${message}`, ...args);
  }
};

module.exports = logger;
