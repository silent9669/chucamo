// Simple, bulletproof client logger
const isProduction = process.env.NODE_ENV === 'production';

const logger = {
  error: (message, ...args) => {
    // Always log errors
    console.error(`[ERROR] ${message}`, ...args);
  },
  
  warn: (message, ...args) => {
    // Log warnings if REACT_APP_LOG_LEVEL allows it
    if (process.env.REACT_APP_LOG_LEVEL === 'ERROR') return;
    console.warn(`[WARN] ${message}`, ...args);
  },
  
  info: (message, ...args) => {
    // Log info if REACT_APP_LOG_LEVEL allows it
    if (process.env.REACT_APP_LOG_LEVEL === 'ERROR' || process.env.REACT_APP_LOG_LEVEL === 'WARN') return;
    console.log(`[INFO] ${message}`, ...args);
  },
  
  debug: (message, ...args) => {
    // Log debug if REACT_APP_LOG_LEVEL allows it
    if (process.env.REACT_APP_LOG_LEVEL === 'ERROR' || process.env.REACT_APP_LOG_LEVEL === 'WARN' || process.env.REACT_APP_LOG_LEVEL === 'INFO') return;
    console.log(`[DEBUG] ${message}`, ...args);
  },
  
  critical: (message, ...args) => {
    // Always log critical messages
    console.log(`[CRITICAL] ${message}`, ...args);
  }
};

export default logger;
